import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { MpesaTransaction } from '../types.js';

interface StkPushParams {
  phone: string;
  amountKes: number;
  orderIds: string[];
  accountReference: string;
  transactionDesc: string;
}

export function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

function getDarajaConfig() {
  const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
  const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();
  const passkey = (process.env.MPESA_PASSKEY || '').trim();
  const shortcode = (process.env.MPESA_SHORTCODE || '174379').trim();
  const callbackUrl = (process.env.MPESA_CALLBACK_URL || 'http://localhost:5000/api/mpesa/callback').trim();
  const env = (process.env.MPESA_ENV || 'sandbox').trim();
  const isLiveConfigured = Boolean(consumerKey && consumerSecret && passkey);

  return {
    consumerKey,
    consumerSecret,
    passkey,
    shortcode,
    callbackUrl,
    baseUrl: env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
    isLiveConfigured,
  };
}

function generateDemoReceipt(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 7; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SUQ${suffix}`;
}

export function getMpesaModeInfo() {
  const cfg = getDarajaConfig();
  return {
    mode: cfg.isLiveConfigured ? 'daraja-live' : 'sandbox-demo',
    shortcode: cfg.shortcode,
    env: process.env.MPESA_ENV || 'sandbox',
  };
}

export async function initiateStkPush(params: StkPushParams): Promise<MpesaTransaction> {
  const cfg = getDarajaConfig();
  const normalizedPhone = normalizeKenyanPhone(params.phone);
  const amount = Math.max(1, Math.round(params.amountKes));
  const now = new Date().toISOString();

  if (!cfg.isLiveConfigured) {
    const checkoutRequestId = `ws_CO_DEMO_${Date.now()}_${uuidv4().slice(0, 6)}`;
    const merchantRequestId = `SUUQLY_MR_${uuidv4().slice(0, 8).toUpperCase()}`;

    const tx: MpesaTransaction = {
      checkoutRequestId,
      merchantRequestId,
      orderIds: params.orderIds,
      phone: normalizedPhone,
      amountKes: amount,
      status: 'pending',
      resultDesc: 'Daraja Sandbox Demo Mode: STK Push sent to phone. Awaiting customer PIN.',
      mode: 'sandbox-demo',
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    db.data.mpesaTransactions.push(tx);
    for (const order of db.data.orders) {
      if (params.orderIds.includes(order.id)) {
        order.mpesaCheckoutRequestId = checkoutRequestId;
      }
    }
    await db.write();
    return tx;
  }

  // Live / Safaricom Daraja API OAuth + STK Push
  const authToken = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const oauthRes = await fetch(
    `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${authToken}` },
    }
  );
  if (!oauthRes.ok) {
    throw new Error(`Daraja OAuth failed: ${oauthRes.status} ${oauthRes.statusText}`);
  }
  const oauthData = (await oauthRes.json()) as { access_token: string };

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14);
  const password = Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64');

  const stkPayload = {
    BusinessShortCode: cfg.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: normalizedPhone,
    PartyB: cfg.shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: cfg.callbackUrl,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 13),
  };

  const stkRes = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${oauthData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stkPayload),
  });

  const stkData = (await stkRes.json()) as {
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    ResponseDescription?: string;
    errorMessage?: string;
  };

  if (!stkRes.ok || !stkData.CheckoutRequestID) {
    throw new Error(stkData.errorMessage || stkData.ResponseDescription || 'Daraja STK Push failed');
  }

  const tx: MpesaTransaction = {
    checkoutRequestId: stkData.CheckoutRequestID,
    merchantRequestId: stkData.MerchantRequestID || `MR_${Date.now()}`,
    orderIds: params.orderIds,
    phone: normalizedPhone,
    amountKes: amount,
    status: 'pending',
    resultDesc: stkData.ResponseDescription || 'STK Push sent via Daraja API',
    mode: 'daraja-live',
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  db.data.mpesaTransactions.push(tx);
  for (const order of db.data.orders) {
    if (params.orderIds.includes(order.id)) {
      order.mpesaCheckoutRequestId = tx.checkoutRequestId;
    }
  }
  await db.write();
  return tx;
}

export async function processMpesaResult(params: {
  checkoutRequestId: string;
  success: boolean;
  receiptNumber?: string;
  resultDesc?: string;
}): Promise<MpesaTransaction | null> {
  const db = await getDb();
  const tx = db.data.mpesaTransactions.find(
    (item) => item.checkoutRequestId === params.checkoutRequestId
  );
  if (!tx) return null;

  const now = new Date().toISOString();
  tx.status = params.success ? 'completed' : 'failed';
  tx.mpesaReceiptNumber = params.success
    ? params.receiptNumber || tx.mpesaReceiptNumber || generateDemoReceipt()
    : undefined;
  tx.resultDesc =
    params.resultDesc ||
    (params.success
      ? 'The service request is processed successfully. Trade Assurance Escrow funded.'
      : 'Request cancelled by user.');
  tx.updatedAt = now;

  for (const order of db.data.orders) {
    if (tx.orderIds.includes(order.id)) {
      if (params.success) {
        order.paymentStatus = 'paid';
        order.mpesaReceipt = tx.mpesaReceiptNumber;
        if (order.status === 'Pending') {
          order.status = 'Confirmed';
          order.timeline.push({
            status: 'Confirmed',
            timestamp: now,
            note: `M-Pesa Escrow payment verified (Receipt: ${tx.mpesaReceiptNumber})`,
          });
        }
      } else {
        order.paymentStatus = 'failed';
      }
    }
  }

  await db.write();
  return tx;
}
