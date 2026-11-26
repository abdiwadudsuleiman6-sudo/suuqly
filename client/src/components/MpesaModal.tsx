import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Smartphone, X, XCircle } from 'lucide-react';
import { apiRequest, formatKes } from '../lib/api';
import { MpesaTransaction, Order } from '../types';

interface MpesaModalProps {
  isOpen: boolean;
  transaction: MpesaTransaction | null;
  orders: Order[];
  onClose: () => void;
  onSuccess: (updatedOrders: Order[], tx: MpesaTransaction) => void;
}

export const MpesaModal: React.FC<MpesaModalProps> = ({
  isOpen,
  transaction,
  orders,
  onClose,
  onSuccess,
}) => {
  const [tx, setTx] = useState<MpesaTransaction | null>(transaction);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTx(transaction);
    setError('');
  }, [transaction]);

  // Poll status while pending (supports both live Daraja callback & demo mode)
  useEffect(() => {
    if (!isOpen || !tx || tx.status !== 'pending') return;
    const timer = setInterval(async () => {
      try {
        const res = await apiRequest<{ transaction: MpesaTransaction; orders: Order[] }>(
          `/mpesa/status/${tx.checkoutRequestId}`
        );
        setTx(res.transaction);
        if (res.transaction.status === 'completed') {
          onSuccess(res.orders, res.transaction);
        }
      } catch {
        // ignore transient poll errors
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, tx, onSuccess]);

  if (!isOpen || !tx) return null;

  const handleDemoConfirm = async (approve: boolean) => {
    setProcessing(true);
    setError('');
    try {
      const res = await apiRequest<{ transaction: MpesaTransaction; orders: Order[] }>(
        '/mpesa/demo-confirm',
        {
          method: 'POST',
          body: JSON.stringify({
            checkoutRequestId: tx.checkoutRequestId,
            approve,
          }),
        }
      );
      setTx(res.transaction);
      if (res.transaction.status === 'completed') {
        onSuccess(res.orders, res.transaction);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process demo payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#064E3B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-800 border border-emerald-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#FBBF24]" />
            </div>
            <div>
              <h3 className="font-bold text-base">M-Pesa Daraja STK Push</h3>
              <p className="text-[11px] text-emerald-100">
                {tx.mode === 'sandbox-demo'
                  ? 'Daraja Sandbox Demo Mode Active'
                  : 'Safaricom Daraja Live API'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-emerald-100 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Escrow Total:</span>
              <span className="font-extrabold text-[#064E3B] text-base">
                {formatKes(tx.amountKes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-mono font-semibold text-slate-800">+{tx.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Split Supplier Orders:</span>
              <span className="font-semibold text-slate-800">{orders.length} order(s)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">CheckoutRequestID:</span>
              <span className="font-mono text-slate-600 truncate max-w-[190px]">
                {tx.checkoutRequestId}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          {tx.status === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <Loader2 className="w-5 h-5 text-[#064E3B] animate-spin shrink-0" />
                <p className="text-xs text-emerald-950">
                  STK Push sent to <strong>+{tx.phone}</strong>. Funds are held safely in{' '}
                  <strong>Suuqly Trade Assurance Escrow</strong> until dispatch confirmation.
                </p>
              </div>

              {tx.mode === 'sandbox-demo' && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B45309] uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4" />
                    Hackathon Judge Simulator
                  </div>
                  <p className="text-xs text-slate-700">
                    Since `.env` Daraja keys are empty, Suuqly is running in{' '}
                    <strong>Daraja Sandbox Demo Mode</strong>. Simulate the customer&apos;s phone response below:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleDemoConfirm(true)}
                      className="w-full bg-[#064E3B] hover:bg-[#04392B] text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-60"
                    >
                      {processing ? 'Verifying...' : 'Simulate Customer M-Pesa PIN Entry (Pay)'}
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleDemoConfirm(false)}
                      className="w-full bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold py-2 px-4 rounded-lg text-xs transition"
                    >
                      Simulate Cancelled Prompt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tx.status === 'completed' && (
            <div className="text-center space-y-3 py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-extrabold text-slate-900">
                M-Pesa Escrow Confirmed!
              </h4>
              <div className="inline-block bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
                <span className="text-xs text-slate-600">M-Pesa Receipt: </span>
                <strong className="font-mono text-[#064E3B]">{tx.mpesaReceiptNumber}</strong>
              </div>
              <p className="text-xs text-slate-600">
                All split supplier orders have been automatically moved to <strong>Confirmed</strong>.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#064E3B] text-white font-semibold py-2.5 rounded-lg text-sm"
              >
                View My Orders
              </button>
            </div>
          )}

          {tx.status === 'failed' && (
            <div className="text-center space-y-3 py-2">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Payment Not Completed</h4>
              <p className="text-xs text-slate-600">{tx.resultDesc}</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-sm"
              >
                Close & Retry from My Orders
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
