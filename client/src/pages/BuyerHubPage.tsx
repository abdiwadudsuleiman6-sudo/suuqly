import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Heart,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { MpesaModal } from '../components/MpesaModal';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatKes, GARISSA_ZONES } from '../lib/api';
import { GarissaZone, MpesaTransaction, Order, OrderStatus, Product, RFQ } from '../types';

const TRACKING_STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Dispatched', 'Delivered'];

interface BuyerHubPageProps {
  onRequestQuote: (product: Product) => void;
}

export const BuyerHubPage: React.FC<BuyerHubPageProps> = ({ onRequestQuote }) => {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'orders') as
    | 'orders'
    | 'rfqs'
    | 'wishlist'
    | 'profile';

  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [newZone, setNewZone] = useState<GarissaZone>('Garissa Town');
  const [newLabel, setNewLabel] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [profileSaved, setProfileSaved] = useState('');

  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintNotice, setComplaintNotice] = useState('');

  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [retryTx, setRetryTx] = useState<MpesaTransaction | null>(null);
  const [retryOrders, setRetryOrders] = useState<Order[]>([]);

  const loadBuyerData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ordRes, rfqRes, prodRes] = await Promise.all([
        apiRequest<{ orders: Order[] }>('/orders/my'),
        apiRequest<{ rfqs: RFQ[] }>('/rfqs/my'),
        apiRequest<{ products: Product[] }>('/products'),
      ]);
      setOrders(ordRes.orders);
      setRfqs(rfqRes.rfqs);
      setWishlistProducts(prodRes.products.filter((p) => user.wishlist.includes(p.id)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfilePhone(user.phone);
    void loadBuyerData();
  }, [user, loadBuyerData]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Sign in to access your Buyer Hub</h2>
        <Link
          to="/login"
          className="inline-block bg-[#064E3B] text-white font-bold px-6 py-3 rounded-xl text-sm"
        >
          Sign In / 1-Click Demo
        </Link>
      </div>
    );
  }

  const handleAcceptRfq = async (rfqId: string) => {
    try {
      await apiRequest(`/rfqs/${rfqId}/accept`, { method: 'POST' });
      await loadBuyerData();
      setSearchParams({ tab: 'orders' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept quote');
    }
  };

  const handleRetryMpesa = async (order: Order) => {
    try {
      const res = await apiRequest<{ mpesaTransaction: MpesaTransaction }>(
        `/orders/${order.id}/retry-mpesa`,
        {
          method: 'POST',
          body: JSON.stringify({ phone: order.buyerPhone }),
        }
      );
      setRetryTx(res.mpesaTransaction);
      setRetryOrders([order]);
      setMpesaModalOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start M-Pesa prompt');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: profileName, phone: profilePhone }),
    });
    await refreshMe();
    setProfileSaved('Profile updated successfully.');
    setTimeout(() => setProfileSaved(''), 3000);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newStreet) return;
    const updated = [
      ...user.addresses,
      {
        id: `addr-${Date.now()}`,
        label: newLabel,
        zone: newZone,
        streetDetails: newStreet,
        phone: user.phone,
        isDefault: user.addresses.length === 0,
      },
    ];
    await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ addresses: updated }),
    });
    setNewLabel('');
    setNewStreet('');
    await refreshMe();
  };

  const handleRemoveAddress = async (addrId: string) => {
    const updated = user.addresses.filter((a) => a.id !== addrId);
    await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ addresses: updated }),
    });
    await refreshMe();
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintOrder) return;
    await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({
        orderId: complaintOrder.id,
        supplierId: complaintOrder.supplierId,
        subject: complaintSubject,
        description: complaintDesc,
      }),
    });
    setComplaintOrder(null);
    setComplaintSubject('');
    setComplaintDesc('');
    setComplaintNotice('Your complaint has been submitted to Suuqly Admin Support.');
    setTimeout(() => setComplaintNotice(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#064E3B] text-white flex items-center justify-center font-extrabold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Buyer Hub — {user.name}</h1>
            <p className="text-xs text-slate-500">
              {user.email} • +{user.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
            { id: 'rfqs', label: `My Quotes (${rfqs.length})`, icon: FileSpreadsheet },
            { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})`, icon: Heart },
            { id: 'profile', label: 'Profile & Addresses', icon: UserIcon },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSearchParams({ tab: t.id })}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === t.id
                    ? 'bg-[#064E3B] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {complaintNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-[#064E3B] text-xs font-semibold p-3.5 rounded-xl">
          {complaintNotice}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">No orders placed yet.</p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="bg-[#064E3B] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIdx = TRACKING_STEPS.indexOf(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-[#064E3B]">
                          • {order.supplierName}
                        </span>
                        {order.mpesaReceipt && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-[#064E3B] text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            M-Pesa: {order.mpesaReceipt}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Zone: <strong>{order.deliveryZone}</strong> ({order.deliveryAddress}) •{' '}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-[#064E3B]">
                        {formatKes(order.totalKes)}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'COD'} •{' '}
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Live Tracking Stepper */}
                  {order.status !== 'Cancelled' && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {TRACKING_STEPS.map((step, idx) => {
                        const completed = idx <= currentStepIdx;
                        return (
                          <div key={step} className="space-y-1">
                            <div
                              className={`h-2 rounded-full ${
                                completed ? 'bg-[#064E3B]' : 'bg-slate-200'
                              }`}
                            />
                            <div
                              className={`text-[11px] font-bold flex items-center gap-1 ${
                                completed ? 'text-[#064E3B]' : 'text-slate-400'
                              }`}
                            >
                              {completed && <CheckCircle2 className="w-3 h-3" />}
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Line Items */}
                  <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl px-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800">{item.title}</div>
                            <div className="text-slate-500">
                              {item.quantity} {item.unit} × {formatKes(item.unitPriceKes)}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatKes(item.lineTotalKes)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-500">
                      Latest update: {order.timeline[order.timeline.length - 1]?.note}
                    </div>
                    <div className="flex gap-2">
                      {order.paymentMethod === 'mpesa' && order.paymentStatus !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleRetryMpesa(order)}
                          className="inline-flex items-center gap-1 bg-[#064E3B] text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          Pay M-Pesa Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setComplaintOrder(order);
                          setComplaintSubject(`Issue with order ${order.orderNumber}`);
                        }}
                        className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* My Quotes Tab */}
      {activeTab === 'rfqs' && (
        <div className="space-y-4">
          {rfqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              You have not submitted any Request for Quotations (RFQs) yet.
            </div>
          ) : (
            rfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#064E3B]">
                      {rfq.rfqNumber}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {rfq.productTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Requested: <strong>{rfq.quantity} {rfq.unit}</strong> • Delivery to{' '}
                      <strong>{rfq.deliveryZone}</strong> • Supplier: {rfq.supplierName}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      rfq.status === 'quoted'
                        ? 'bg-amber-100 text-[#B45309]'
                        : rfq.status === 'accepted'
                        ? 'bg-emerald-100 text-[#064E3B]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>

                {rfq.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                    Your note: {rfq.notes}
                  </p>
                )}

                {rfq.supplierQuote && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#064E3B] uppercase">
                        Official Supplier Offer
                      </span>
                      <span className="text-base font-extrabold text-[#064E3B]">
                        {formatKes(rfq.supplierQuote.offeredUnitPriceKes)} / {rfq.unit} (Total:{' '}
                        {formatKes(rfq.supplierQuote.totalPriceKes)})
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{rfq.supplierQuote.message}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                      <span>Lead Time: {rfq.supplierQuote.leadTime}</span>
                      {rfq.status === 'quoted' && (
                        <button
                          type="button"
                          onClick={() => handleAcceptRfq(rfq.id)}
                          className="bg-[#064E3B] hover:bg-[#04392B] text-white font-bold px-4 py-2 rounded-lg text-xs"
                        >
                          Accept Quote & Create Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Your wishlist is empty. Tap the heart icon on any product to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wishlistProducts.map((p) => (
                <ProductCard key={p.id} product={p} onRequestQuote={onRequestQuote} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile & Garissa Address Book */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-fit"
          >
            <h3 className="font-extrabold text-base text-slate-900">Account Details</h3>
            {profileSaved && (
              <div className="text-xs font-semibold bg-emerald-50 text-[#064E3B] p-2.5 rounded-lg">
                {profileSaved}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (M-Pesa)
              </label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-[#064E3B] text-white font-bold px-5 py-2.5 rounded-xl text-xs"
            >
              Save Profile
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Garissa Address Book</h3>
            <div className="space-y-2.5">
              {user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#064E3B]" />
                      {addr.label} ({addr.zone})
                    </div>
                    <p className="text-slate-600 mt-0.5">{addr.streetDetails}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(addr.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddAddress} className="pt-3 border-t border-slate-100 space-y-3">
              <div className="text-xs font-bold text-slate-700">Add Garissa Delivery Address</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (e.g., Shop)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <select
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value as GarissaZone)}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                >
                  {GARISSA_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                required
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                placeholder="Street, stage, or building landmark"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-[#B45309] font-bold px-4 py-2 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleComplaintSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="font-extrabold text-base text-slate-900">
              Report Order Issue ({complaintOrder.orderNumber})
            </h3>
            <input
              type="text"
              required
              value={complaintSubject}
              onChange={(e) => setComplaintSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              required
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              placeholder="Describe the issue for Suuqly Admin mediation..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComplaintOrder(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold"
              >
                Submit to Admin
              </button>
            </div>
          </form>
        </div>
      )}

      <MpesaModal
        isOpen={mpesaModalOpen}
        transaction={retryTx}
        orders={retryOrders}
        onClose={() => {
          setMpesaModalOpen(false);
          void loadBuyerData();
        }}
        onSuccess={() => {
          void loadBuyerData();
        }}
      />
    </div>
  );
};
