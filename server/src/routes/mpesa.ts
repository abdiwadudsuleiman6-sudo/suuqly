import { Router } from 'express';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getMpesaModeInfo, processMpesaResult } from '../services/mpesa.js';

const router = Router();

router.get('/mode', (_req, res) => {
  res.json(getMpesaModeInfo());
});

router.get('/status/:checkoutRequestId', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const tx = db.data.mpesaTransactions.find(
    (t) => t.checkoutRequestId === req.params.checkoutRequestId
  );
  if (!tx) {
    res.status(404).json({ error: 'M-Pesa transaction not found' });
    return;
  }
  const orders = db.data.orders.filter((o) => tx.orderIds.includes(o.id));
  res.json({ transaction: tx, orders });
});

router.post('/demo-confirm', authenticate, async (req: AuthRequest, res) => {
  const { checkoutRequestId, approve = true } = req.body as {
    checkoutRequestId?: string;
    approve?: boolean;
  };
  if (!checkoutRequestId) {
    res.status(400).json({ error: 'checkoutRequestId is required.' });
    return;
  }
  const tx = await processMpesaResult({
    checkoutRequestId,
    success: Boolean(approve),
    resultDesc: approve
      ? 'Daraja Sandbox Demo: Customer entered PIN. M-Pesa Escrow funded.'
      : 'Daraja Sandbox Demo: Customer cancelled STK prompt.',
  });
  if (!tx) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  const db = await getDb();
  const orders = db.data.orders.filter((o) => tx.orderIds.includes(o.id));
  res.json({ transaction: tx, orders });
});

// Official Safaricom Daraja STK Push Callback endpoint
router.post('/callback', async (req, res) => {
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback?.CheckoutRequestID) {
      res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
      return;
    }

    const success = Number(stkCallback.ResultCode) === 0;
    const items: { Name: string; Value?: string | number }[] =
      stkCallback.CallbackMetadata?.Item || [];
    const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber');

    await processMpesaResult({
      checkoutRequestId: stkCallback.CheckoutRequestID,
      success,
      receiptNumber: receiptItem?.Value ? String(receiptItem.Value) : undefined,
      resultDesc: stkCallback.ResultDesc,
    });

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa callback error:', err);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Callback error' });
  }
});

export default router;
