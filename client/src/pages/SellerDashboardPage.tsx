import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  DollarSign,
  Edit3,
  FileSpreadsheet,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CATEGORIES, formatKes, GARISSA_ZONES } from '../lib/api';
import {
  CategorySlug,
  GarissaZone,
  Order,
  OrderStatus,
  PriceTier,
  Product,
  RFQ,
  Supplier,
} from '../types';

interface DashboardKpis {
  totalRevenueKes: number;
  paidRevenueKes: number;
  totalOrders: number;
  pendingOrders: number;
  activeProducts: number;
  pendingRfqs: number;
}

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'products' | 'orders' | 'rfqs' | 'storefront'>('products');
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Product modal / form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState<CategorySlug>('electronics-solar');
  const [pUnit, setPUnit] = useState('pcs');
  const [pPrice, setPPrice] = useState(1000);
  const [pMoq, setPMoq] = useState(1);
  const [pStock, setPStock] = useState(50);
  const [pImage, setPImage] = useState('/uploads/seed/solar-panel-450w.svg');
  const [pBulkMin, setPBulkMin] = useState(10);
  const [pBulkPrice, setPBulkPrice] = useState(850);
  const [uploadingImg, setUploadingImg] = useState(false);

  // RFQ Quote modal
  const [quotingRfq, setQuotingRfq] = useState<RFQ | null>(null);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState(0);
  const [quoteDeliveryFee, setQuoteDeliveryFee] = useState(0);
  const [quoteLeadTime, setQuoteLeadTime] = useState('Same-day Garissa dispatch');
  const [quoteMessage, setQuoteMessage] = useState('');

  // Storefront profile form
  const [sName, setSName] = useState('');
  const [sTagline, setSTagline] = useState('');
  const [sZone, setSZone] = useState<GarissaZone>('Garissa Town');
  const [sAddress, setSAddress] = useState('');
  const [sHours, setSHours] = useState('');
  const [sOpen, setSOpen] = useState(true);
  const [storeNotice, setStoreNotice] = useState('');

  const loadAll = useCallback(async () => {
    if (!user || user.role !== 'seller') return;
    setLoading(true);
    try {
      const [dash, prodRes, ordRes, rfqRes] = await Promise.all([
        apiRequest<{ supplier: Supplier; kpis: DashboardKpis }>('/seller/dashboard'),
        apiRequest<{ products: Product[] }>('/seller/products'),
        apiRequest<{ orders: Order[] }>('/seller/orders'),
        apiRequest<{ rfqs: RFQ[] }>('/seller/rfqs'),
      ]);
      setSupplier(dash.supplier);
      setKpis(dash.kpis);
      setProducts(prodRes.products);
      setOrders(ordRes.orders);
      setRfqs(rfqRes.rfqs);

      setSName(dash.supplier.name);
      setSTagline(dash.supplier.tagline);
      setSZone(dash.supplier.neighborhood);
      setSAddress(dash.supplier.address);
      setSHours(dash.supplier.openingHours);
      setSOpen(dash.supplier.isOpen);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (!user || user.role !== 'seller') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Store className="w-12 h-12 text-[#064E3B] mx-auto" />
        <h2 className="text-xl font-bold">Supplier Access Required</h2>
        <p className="text-xs text-slate-600">
          Use the 1-Click Demo Login as <strong>Verified Supplier 1</strong> or{' '}
          <strong>Verified Supplier 2</strong> to inspect an isolated supplier dashboard.
        </p>
        <Link
          to="/login"
          className="inline-block bg-[#064E3B] text-white font-bold px-6 py-3 rounded-xl text-sm"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const openCreateForm = () => {
    setEditingProduct(null);
    setPTitle('');
    setPDesc('');
    setPCategory(supplier?.category || 'electronics-solar');
    setPUnit('pcs');
    setPPrice(1500);
    setPMoq(1);
    setPStock(50);
    setPImage('/uploads/seed/solar-panel-450w.svg');
    setPBulkMin(10);
    setPBulkPrice(1300);
    setShowProductForm(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setPTitle(p.title);
    setPDesc(p.description);
    setPCategory(p.category);
    setPUnit(p.unit);
    setPPrice(p.unitPriceKes);
    setPMoq(p.moq);
    setPStock(p.stock);
    setPImage(p.images[0] || '/uploads/seed/solar-panel-450w.svg');
    const secondTier = p.priceTiers[1] || p.priceTiers[0];
    setPBulkMin(secondTier?.minQty || 10);
    setPBulkPrice(secondTier?.priceKes || p.unitPriceKes);
    setShowProductForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiRequest<{ url: string }>('/upload', {
        method: 'POST',
        body: formData,
      });
      setPImage(res.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const tiers: PriceTier[] =
      pBulkMin > pMoq && pBulkPrice < pPrice
        ? [
            { minQty: pMoq, maxQty: pBulkMin - 1, priceKes: pPrice },
            { minQty: pBulkMin, maxQty: null, priceKes: pBulkPrice },
          ]
        : [{ minQty: pMoq, maxQty: null, priceKes: pPrice }];

    const body = {
      title: pTitle,
      description: pDesc,
      category: pCategory,
      unit: pUnit,
      unitPriceKes: pPrice,
      priceTiers: tiers,
      moq: pMoq,
      stock: pStock,
      images: [pImage],
    };

    if (editingProduct) {
      await apiRequest(`/seller/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } else {
      await apiRequest('/seller/products', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    setShowProductForm(false);
    await loadAll();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product from your catalog?')) return;
    await apiRequest(`/seller/products/${id}`, { method: 'DELETE' });
    await loadAll();
  };

  const handleAdvanceOrder = async (orderId: string, nextStatus: OrderStatus) => {
    await apiRequest(`/seller/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadAll();
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingRfq) return;
    await apiRequest(`/seller/rfqs/${quotingRfq.id}/quote`, {
      method: 'POST',
      body: JSON.stringify({
        offeredUnitPriceKes: quoteUnitPrice,
        deliveryFeeKes: quoteDeliveryFee,
        leadTime: quoteLeadTime,
        message: quoteMessage,
      }),
    });
    setQuotingRfq(null);
    await loadAll();
  };

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/seller/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: sName,
        tagline: sTagline,
        neighborhood: sZone,
        address: sAddress,
        openingHours: sHours,
        isOpen: sOpen,
      }),
    });
    setStoreNotice('Storefront profile & visibility updated.');
    await loadAll();
    setTimeout(() => setStoreNotice(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {supplier && (
            <img
              src={supplier.logoUrl}
              alt={supplier.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
            />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900">
                {supplier?.name || 'Supplier Dashboard'}
              </h1>
              {supplier?.verified ? (
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-[#D97706] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified Garissa Supplier
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Verification Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Isolated to Business ID: <code className="font-mono">{user.businessId}</code> •{' '}
              {supplier?.neighborhood}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!supplier) return;
              await apiRequest('/seller/profile', {
                method: 'PUT',
                body: JSON.stringify({ isOpen: !supplier.isOpen }),
              });
              await loadAll();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              supplier?.isOpen
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-700'
            }`}
          >
            Storefront: {supplier?.isOpen ? 'OPEN' : 'CLOSED'}
          </button>
          {supplier && (
            <Link
              to={`/suppliers/${supplier.id}`}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              View Public Storefront
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#064E3B]" />
              Total KES Revenue
            </div>
            <div className="text-2xl font-extrabold text-[#064E3B] mt-1">
              {formatKes(kpis.totalRevenueKes)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Paid Escrow: {formatKes(kpis.paidRevenueKes)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#D97706]" />
              Incoming Orders
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.totalOrders}</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
              {kpis.pendingOrders} awaiting action
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#064E3B]" />
              Active Listings
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {kpis.activeProducts}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#D97706]" />
              Customer RFQs
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{rfqs.length}</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
              {kpis.pendingRfqs} pending quotes
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'products', label: `Catalog & Pricing (${products.length})` },
          { id: 'orders', label: `Incoming Orders (${orders.length})` },
          { id: 'rfqs', label: `RFQ Inbox (${rfqs.length})` },
          { id: 'storefront', label: 'Storefront Profile & Hours' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === t.id
                ? 'bg-[#064E3B] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-[#064E3B]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      ) : (
        <>
          {/* Products Tab */}
          {tab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-base text-slate-900">
                  Your Products & Wholesale Tiers
                </h2>
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-1.5 bg-[#064E3B] hover:bg-[#04392B] text-white text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Product / Service
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex gap-3">
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-20 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                          {p.title}
                        </h3>
                        <div className="text-xs font-extrabold text-[#064E3B] mt-1">
                          {formatKes(p.unitPriceKes)} / {p.unit}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          MOQ: {p.moq} • Stock: {p.stock} • Sold: {p.soldCount}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditForm(p)}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="inline-flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incoming Orders Tab */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                  No incoming orders yet.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          Buyer: {order.buyerName} (+{order.buyerPhone}) • {order.deliveryZone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#064E3B]">
                          {formatKes(order.totalKes)}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-200">
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.quantity} × {item.title}
                          </span>
                          <strong>{formatKes(item.lineTotalKes)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-slate-500">
                        Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
                        {order.mpesaReceipt ? ` • ${order.mpesaReceipt}` : ''}
                      </span>
                      <div className="flex gap-2">
                        {order.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceOrder(order.id, 'Confirmed')}
                            className="bg-[#064E3B] text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                          >
                            Confirm Order
                          </button>
                        )}
                        {order.status === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceOrder(order.id, 'Dispatched')}
                            className="bg-[#D97706] text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                          >
                            Dispatch Rider / Lorry
                          </button>
                        )}
                        {order.status === 'Dispatched' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceOrder(order.id, 'Delivered')}
                            className="bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* RFQ Inbox Tab */}
          {tab === 'rfqs' && (
            <div className="space-y-4">
              {rfqs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
                  No buyer RFQs received yet.
                </div>
              ) : (
                rfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-[#064E3B]">
                          {rfq.rfqNumber}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          {rfq.productTitle}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Buyer: {rfq.buyerName} (+{rfq.buyerPhone}) • Qty:{' '}
                          <strong>{rfq.quantity} {rfq.unit}</strong> • Zone: {rfq.deliveryZone}
                          {rfq.targetPriceKes
                            ? ` • Target: ${formatKes(rfq.targetPriceKes)}/${rfq.unit}`
                            : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-[#B45309]">
                        {rfq.status}
                      </span>
                    </div>
                    {rfq.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {rfq.notes}
                      </p>
                    )}

                    {rfq.supplierQuote ? (
                      <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        Quoted:{' '}
                        <strong>
                          {formatKes(rfq.supplierQuote.offeredUnitPriceKes)} / {rfq.unit}
                        </strong>{' '}
                        (Total {formatKes(rfq.supplierQuote.totalPriceKes)}) —{' '}
                        {rfq.supplierQuote.message}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuotingRfq(rfq);
                          setQuoteUnitPrice(rfq.targetPriceKes || 1000);
                          setQuoteDeliveryFee(0);
                          setQuoteMessage(
                            `Official wholesale quote from ${supplier?.name} for ${rfq.quantity} ${rfq.unit}.`
                          );
                        }}
                        className="bg-[#064E3B] hover:bg-[#04392B] text-white text-xs font-bold px-4 py-2 rounded-lg"
                      >
                        Send Custom KES Quote
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Storefront Profile Tab */}
          {tab === 'storefront' && (
            <form
              onSubmit={handleSaveStorefront}
              className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-4"
            >
              <h2 className="font-extrabold text-base text-slate-900">
                Storefront Profile & Garissa Location
              </h2>
              {storeNotice && (
                <div className="text-xs font-semibold bg-emerald-50 text-[#064E3B] p-3 rounded-lg">
                  {storeNotice}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Garissa Neighborhood
                  </label>
                  <select
                    value={sZone}
                    onChange={(e) => setSZone(e.target.value as GarissaZone)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {GARISSA_ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={sTagline}
                  onChange={(e) => setSTagline(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Address / Plot
                  </label>
                  <input
                    type="text"
                    value={sAddress}
                    onChange={(e) => setSAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={sHours}
                    onChange={(e) => setSHours(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={sOpen}
                  onChange={(e) => setSOpen(e.target.checked)}
                  className="accent-[#064E3B]"
                />
                Storefront Visible & Accepting Orders
              </label>
              <div>
                <button
                  type="submit"
                  className="bg-[#064E3B] text-white font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  Save Storefront Changes
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Product Create/Edit Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8"
          >
            <h3 className="font-extrabold text-base text-slate-900">
              {editingProduct ? 'Edit Product / Service' : 'Add New Product / Service'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={pTitle}
                onChange={(e) => setPTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value as CategorySlug)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Label
                </label>
                <input
                  type="text"
                  required
                  value={pUnit}
                  onChange={(e) => setPUnit(e.target.value)}
                  placeholder="pcs, 5L jerrycan, 50kg bag"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Price (KES)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MOQ</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={pMoq}
                  onChange={(e) => setPMoq(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stock</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={pStock}
                  onChange={(e) => setPStock(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Bulk Discount Min Qty
                </label>
                <input
                  type="number"
                  min={2}
                  value={pBulkMin}
                  onChange={(e) => setPBulkMin(Number(e.target.value))}
                  className="w-full rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Bulk Price (KES)
                </label>
                <input
                  type="number"
                  min={1}
                  value={pBulkPrice}
                  onChange={(e) => setPBulkPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Image (Upload via Multer or Use URL)
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={pImage}
                  alt=""
                  className="w-16 h-12 rounded-lg object-cover border border-slate-200"
                />
                <label className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingImg ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quote Response Modal */}
      {quotingRfq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSendQuote}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="font-extrabold text-base text-slate-900">
              Quote {quotingRfq.rfqNumber} ({quotingRfq.quantity} {quotingRfq.unit})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offered Unit Price (KES)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quoteUnitPrice}
                  onChange={(e) => setQuoteUnitPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Fee (KES)
                </label>
                <input
                  type="number"
                  min={0}
                  value={quoteDeliveryFee}
                  onChange={(e) => setQuoteDeliveryFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time</label>
              <input
                type="text"
                value={quoteLeadTime}
                onChange={(e) => setQuoteLeadTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message to Buyer
              </label>
              <textarea
                rows={3}
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="text-xs font-bold text-[#064E3B] bg-emerald-50 p-2.5 rounded-lg">
              Total Quote Value:{' '}
              {formatKes(quoteUnitPrice * quotingRfq.quantity + quoteDeliveryFee)}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuotingRfq(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-bold"
              >
                Send KES Offer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
