import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileSpreadsheet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatKes, GARISSA_ZONES } from '../lib/api';
import { GarissaZone, Product } from '../types';

interface RfqModalProps {
  isOpen: boolean;
  product?: Product | null;
  onClose: () => void;
}

export const RfqModal: React.FC<RfqModalProps> = ({ isOpen, product, onClose }) => {
  const { user, selectedZone } = useAuth();
  const navigate = useNavigate();

  const [productTitle, setProductTitle] = useState(product?.title || '');
  const [quantity, setQuantity] = useState<number>(product ? Math.max(product.moq, 10) : 20);
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [targetPriceKes, setTargetPriceKes] = useState<string>(
    product ? String(Math.round(product.unitPriceKes * 0.9)) : ''
  );
  const [deliveryZone, setDeliveryZone] = useState<GarissaZone>(selectedZone);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRfqNumber, setSubmittedRfqNumber] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setProductTitle(product?.title || '');
      setQuantity(product ? Math.max(product.moq, 10) : 20);
      setUnit(product?.unit || 'pcs');
      setTargetPriceKes(product ? String(Math.round(product.unitPriceKes * 0.9)) : '');
      setDeliveryZone(selectedZone);
      setNotes('');
      setError('');
      setSubmittedRfqNumber('');
    }
  }, [isOpen, product, selectedZone]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onClose();
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await apiRequest<{ rfq: { rfqNumber: string } }>('/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          productId: product?.id,
          productTitle: product?.title || productTitle,
          supplierId: product?.supplierId,
          quantity,
          unit: product?.unit || unit,
          targetPriceKes: targetPriceKes ? Number(targetPriceKes) : undefined,
          deliveryZone,
          notes,
        }),
      });
      setSubmittedRfqNumber(data.rfq.rfqNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#064E3B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#FBBF24]" />
            <div>
              <h3 className="font-bold text-base">Request Bulk Quote (RFQ)</h3>
              <p className="text-xs text-emerald-100">
                {product?.supplier?.name
                  ? `Direct quote to ${product.supplier.name}`
                  : 'Broadcast to Verified Garissa Suppliers'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedRfqNumber ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-lg font-bold text-slate-900">
              Quote Request Sent! ({submittedRfqNumber})
            </h4>
            <p className="text-sm text-slate-600">
              Your bulk request has been delivered to the supplier inbox. Track replies and accept offers anytime in <strong>Buyer Hub → My Quotes</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/account?tab=rfqs');
                }}
                className="bg-[#064E3B] text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
              >
                View My Quotes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!user && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-lg">
                Please sign in (1-click Demo Login available) to submit and track supplier quotes.
              </div>
            )}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product / Service Needed
              </label>
              <input
                type="text"
                required
                readOnly={Boolean(product)}
                value={product ? product.title : productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="e.g., 450W Solar Panels or 5L Camel Milk"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-[#064E3B] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity ({product?.unit || unit})
                </label>
                <input
                  type="number"
                  min={product?.moq || 1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Unit Price (KES)
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetPriceKes}
                  onChange={(e) => setTargetPriceKes(e.target.value)}
                  placeholder={product ? formatKes(product.unitPriceKes) : 'Optional'}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Garissa Delivery Zone
              </label>
              <select
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value as GarissaZone)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:outline-none"
              >
                {GARISSA_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Timeline & Custom Specs
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share delivery schedule, packaging preference, or bulk terms..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#064E3B] hover:bg-[#04392B] text-white text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? 'Sending RFQ...' : user ? 'Submit Quote Request' : 'Sign In & Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
