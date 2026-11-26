import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  Truck,
} from 'lucide-react';
import { MpesaModal } from '../components/MpesaModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  apiRequest,
  formatKes,
  GARISSA_DELIVERY_FEES,
  GARISSA_ZONES,
} from '../lib/api';
import { GarissaZone, MpesaTransaction, Order } from '../types';

export const CartCheckoutPage: React.FC = () => {
  const { user, selectedZone, setSelectedZone } = useAuth();
  const { groups, items, subtotalKes, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryZone, setDeliveryZone] = useState<GarissaZone>(selectedZone);
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.addresses?.[0]?.streetDetails || 'Garissa Town Main Market'
  );
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '254711223344');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cod'>('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<MpesaTransaction | null>(null);
  const [createdOrders, setCreatedOrders] = useState<Order[]>([]);
  const [codCompleteOrders, setCodCompleteOrders] = useState<Order[]>([]);

  const deliveryFeePerSupplier = GARISSA_DELIVERY_FEES[deliveryZone] ?? 250;
  const totalDeliveryFeeKes = groups.length * deliveryFeePerSupplier;
  const grandTotalKes = subtotalKes + totalDeliveryFeeKes;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        deliveryZone,
        deliveryAddress,
        buyerPhone,
        paymentMethod,
      };
      const res = await apiRequest<{
        checkoutGroupId: string;
        orders: Order[];
        totalKes: number;
        mpesaTransaction: MpesaTransaction | null;
      }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      clearCart();
      setSelectedZone(deliveryZone);

      if (paymentMethod === 'mpesa' && res.mpesaTransaction) {
        setCreatedOrders(res.orders);
        setActiveTx(res.mpesaTransaction);
        setMpesaModalOpen(true);
      } else {
        setCodCompleteOrders(res.orders);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (codCompleteOrders.length > 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <h1 className="text-2xl font-extrabold text-slate-900">
            Orders Confirmed! ({codCompleteOrders.length} Split Supplier Orders)
          </h1>
          <p className="text-sm text-slate-600">
            Your multi-vendor checkout was atomically split per supplier for delivery to{' '}
            <strong>{deliveryZone}</strong>.
          </p>
          <div className="space-y-2 text-left bg-slate-50 border border-slate-200 rounded-xl p-4">
            {codCompleteOrders.map((o) => (
              <div key={o.id} className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">
                  {o.orderNumber} • {o.supplierName}
                </span>
                <span className="font-extrabold text-[#064E3B]">{formatKes(o.totalKes)}</span>
              </div>
            ))}
          </div>
          <Link
            to="/account"
            className="inline-block bg-[#064E3B] text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            Track Orders in Buyer Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Multi-Vendor Cart & Garissa Checkout
          </h1>
          <p className="text-xs text-slate-500">
            Automatically grouped by supplier with real-time bulk KES tier pricing
          </p>
        </div>
        <Link to="/" className="text-xs font-bold text-[#064E3B] hover:underline">
          + Continue Sourcing
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Your Suuqly cart is empty</h2>
          <p className="text-xs text-slate-500">
            Browse verified Garissa wholesale and retail listings to unlock bulk tier discounts.
          </p>
          <Link
            to="/"
            className="inline-block bg-[#064E3B] text-white font-bold px-6 py-2.5 rounded-xl text-sm"
          >
            Browse Garissa Deals
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Grouped Supplier Carts */}
          <div className="lg:col-span-7 space-y-4">
            {groups.map((group) => (
              <div
                key={group.supplierId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {group.supplierName}
                    </span>
                    {group.supplierVerified && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#064E3B]" />
                    {group.neighborhood}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.items.map(({ product, quantity, effectiveUnitPrice, lineTotalKes }) => (
                    <div key={product.id} className="p-4 flex items-center gap-4">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-20 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${product.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-[#064E3B] line-clamp-1"
                        >
                          {product.title}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Tier Rate: <strong className="text-[#064E3B]">{formatKes(effectiveUnitPrice)}</strong> / {product.unit}
                          {effectiveUnitPrice < product.unitPriceKes && (
                            <span className="ml-2 text-emerald-700 font-semibold">
                              (Bulk Discount Applied!)
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-7 h-7 rounded-md border border-slate-300 font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-12 text-center">
                            {quantity} {product.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-7 h-7 rounded-md border border-slate-300 font-bold text-xs"
                          >
                            +
                          </button>
                          <span className="text-[11px] text-slate-400 ml-1">MOQ {product.moq}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="font-extrabold text-sm text-slate-900">
                          {formatKes(lineTotalKes)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="text-rose-500 hover:text-rose-700 text-xs inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50/50 px-5 py-2.5 border-t border-slate-100 flex justify-between text-xs">
                  <span className="text-slate-600">
                    Supplier Subtotal + {deliveryZone} Dispatch ({formatKes(deliveryFeePerSupplier)})
                  </span>
                  <strong className="text-[#064E3B]">
                    {formatKes(group.subtotalKes + deliveryFeePerSupplier)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Garissa Zone Delivery & Payment */}
          <form
            onSubmit={handleCheckout}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 h-fit shadow-sm"
          >
            <h2 className="text-lg font-extrabold text-slate-900">
              Garissa Delivery & Payment
            </h2>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
                {error}
              </div>
            )}

            {user && user.addresses.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quick Fill Saved Address
                </label>
                <select
                  onChange={(e) => {
                    const addr = user.addresses.find((a) => a.id === e.target.value);
                    if (addr) {
                      setDeliveryZone(addr.zone);
                      setDeliveryAddress(addr.streetDetails);
                      setBuyerPhone(addr.phone);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-slate-50"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose saved Garissa address...
                  </option>
                  {user.addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} ({a.zone}) — {a.streetDetails}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Garissa Delivery Zone
              </label>
              <select
                value={deliveryZone}
                onChange={(e) => setDeliveryZone(e.target.value as GarissaZone)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium focus:border-[#064E3B] focus:outline-none"
              >
                {GARISSA_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z} — {formatKes(GARISSA_DELIVERY_FEES[z])} per supplier dispatch
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street / Landmark / Stage Details
              </label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g., Kismayu Road, Tana Plaza Stall 4"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#064E3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                M-Pesa / Contact Phone (2547...)
              </label>
              <input
                type="text"
                required
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="254711223344"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[#064E3B] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Method
              </label>
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  paymentMethod === 'mpesa'
                    ? 'bg-emerald-50 border-[#064E3B]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'mpesa'}
                  onChange={() => setPaymentMethod('mpesa')}
                  className="mt-1 accent-[#064E3B]"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#064E3B]" />
                    M-Pesa Daraja STK Push (Escrow)
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Protected by Suuqly Trade Assurance. Includes Sandbox Demo Simulator for instant judge testing.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  paymentMethod === 'cod'
                    ? 'bg-amber-50 border-[#D97706]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-[#D97706]"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#D97706]" />
                    Cash on Delivery (Garissa Zones)
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Pay our verified boda/lorry rider upon inspection in {deliveryZone}.
                  </p>
                </div>
              </label>
            </div>

            {/* Order Summary */}
            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Products Subtotal:</span>
                <span>{formatKes(subtotalKes)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  Dispatch ({groups.length} supplier{groups.length > 1 ? 's' : ''} ×{' '}
                  {formatKes(deliveryFeePerSupplier)}):
                </span>
                <span>{formatKes(totalDeliveryFeeKes)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-[#064E3B] pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span>{formatKes(grandTotalKes)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#064E3B] hover:bg-[#04392B] text-white font-bold py-3.5 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4 text-[#FBBF24]" />
              {submitting
                ? 'Splitting Orders...'
                : user
                ? paymentMethod === 'mpesa'
                  ? `Pay ${formatKes(grandTotalKes)} via M-Pesa Escrow`
                  : `Place Split Orders (${formatKes(grandTotalKes)})`
                : 'Sign In to Checkout'}
            </button>
          </form>
        </div>
      )}

      <MpesaModal
        isOpen={mpesaModalOpen}
        transaction={activeTx}
        orders={createdOrders}
        onClose={() => {
          setMpesaModalOpen(false);
          navigate('/account');
        }}
        onSuccess={() => {
          // Modal shows receipt & lets user click "View My Orders"
        }}
      />
    </div>
  );
};
