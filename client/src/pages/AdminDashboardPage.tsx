import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  DollarSign,
  LayoutDashboard,
  Package,
  ShieldAlert,
  Store,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatKes } from '../lib/api';
import { Complaint, Order, Product, Supplier, User } from '../types';

interface AdminOverview {
  totalUsers: number;
  totalSuppliers: number;
  verifiedSuppliers: number;
  pendingSuppliers: number;
  totalProducts: number;
  totalOrders: number;
  totalRfqs: number;
  totalGmvKes: number;
  paidGmvKes: number;
  openComplaints: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'suppliers' | 'users' | 'products' | 'orders' | 'complaints'>(
    'suppliers'
  );
  const [kpis, setKpis] = useState<AdminOverview | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const [ov, supRes, usrRes, prodRes, ordRes, cmpRes] = await Promise.all([
        apiRequest<{ kpis: AdminOverview }>('/admin/overview'),
        apiRequest<{ suppliers: Supplier[] }>('/admin/suppliers'),
        apiRequest<{ users: User[] }>('/admin/users'),
        apiRequest<{ products: Product[] }>('/admin/products'),
        apiRequest<{ orders: Order[] }>('/admin/orders'),
        apiRequest<{ complaints: Complaint[] }>('/admin/complaints'),
      ]);
      setKpis(ov.kpis);
      setSuppliers(supRes.suppliers);
      setUsers(usrRes.users);
      setProducts(prodRes.products);
      setOrders(ordRes.orders);
      setComplaints(cmpRes.complaints);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <LayoutDashboard className="w-12 h-12 text-[#D97706] mx-auto" />
        <h2 className="text-xl font-bold">Admin Control Center Restricted</h2>
        <p className="text-xs text-slate-600">
          Sign in as <strong>Platform Admin</strong> (`admin@suuqly.co.ke`) via the 1-Click Demo
          Login Bar to manage supplier verification and platform operations.
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

  const handleVerifySupplier = async (
    supplierId: string,
    verificationStatus: 'verified' | 'rejected' | 'pending'
  ) => {
    await apiRequest(`/admin/suppliers/${supplierId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({
        verificationStatus,
        verified: verificationStatus === 'verified',
      }),
    });
    await loadAdmin();
  };

  const handleToggleUser = async (target: User) => {
    await apiRequest(`/admin/users/${target.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !target.active }),
    });
    await loadAdmin();
  };

  const handleProductStatus = async (productId: string, status: 'active' | 'flagged') => {
    await apiRequest(`/admin/products/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadAdmin();
  };

  const handleResolveComplaint = async (complaintId: string) => {
    const note =
      prompt('Enter resolution note for the buyer & supplier:', 'Resolved by Suuqly Garissa Admin') ||
      'Resolved by Suuqly Garissa Admin';
    await apiRequest(`/admin/complaints/${complaintId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved', resolutionNote: note }),
    });
    await loadAdmin();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-[#064E3B] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FBBF24]">
            Admin Role Control Center
          </span>
          <h1 className="text-2xl font-extrabold">Suuqly Garissa Governance & Operations</h1>
        </div>
        <div className="text-xs text-emerald-100">
          Logged in as <strong>{user.email}</strong>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#064E3B]" /> Total KES GMV
            </div>
            <div className="text-xl font-extrabold text-[#064E3B] mt-1">
              {formatKes(kpis.totalGmvKes)}
            </div>
            <div className="text-[10px] text-slate-500">Paid: {formatKes(kpis.paidGmvKes)}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-[#D97706]" /> Verified Suppliers
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {kpis.verifiedSuppliers} / {kpis.totalSuppliers}
            </div>
            <div className="text-[10px] text-amber-700 font-bold">
              {kpis.pendingSuppliers} pending queue
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#064E3B]" /> Users
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{kpis.totalUsers}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-[#064E3B]" /> Products & Orders
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {kpis.totalProducts} / {kpis.totalOrders}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Open Complaints
            </div>
            <div className="text-xl font-extrabold text-rose-600 mt-1">
              {kpis.openComplaints}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'suppliers', label: `Supplier Verification Queue (${suppliers.length})` },
          { id: 'users', label: `Users (${users.length})` },
          { id: 'products', label: `Product Moderation (${products.length})` },
          { id: 'orders', label: `Order Monitor (${orders.length})` },
          { id: 'complaints', label: `Complaints (${complaints.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === t.id
                ? 'bg-[#064E3B] text-white'
                : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Supplier Verification Queue */}
          {tab === 'suppliers' && (
            <div className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={s.logoUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{s.name}</span>
                        {s.verified ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <BadgeCheck className="w-3 h-3" /> Verified Garissa Supplier
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {s.verificationStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {s.neighborhood} • {s.address} • {s.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!s.verified ? (
                      <button
                        type="button"
                        onClick={() => handleVerifySupplier(s.id, 'verified')}
                        className="bg-[#064E3B] hover:bg-[#04392B] text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                      >
                        Approve & Grant Gold Badge
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerifySupplier(s.id, 'pending')}
                        className="border border-amber-300 bg-amber-50 text-[#B45309] text-xs font-bold px-3.5 py-2 rounded-lg"
                      >
                        Revoke Badge
                      </button>
                    )}
                    {s.verificationStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleVerifySupplier(s.id, 'rejected')}
                        className="border border-rose-200 text-rose-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-rose-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 uppercase font-bold text-[#064E3B]">{u.role}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u)}
                            className="border border-slate-300 px-3 py-1 rounded-lg font-semibold hover:bg-slate-50"
                          >
                            {u.active ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Product Moderation */}
          {tab === 'products' && (
            <div className="divide-y divide-slate-100">
              {products.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.images[0]}
                      alt=""
                      className="w-12 h-10 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900">{p.title}</div>
                      <div className="text-xs text-slate-500">
                        {p.supplierName} • {formatKes(p.unitPriceKes)} • Status:{' '}
                        <strong
                          className={p.status === 'active' ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          {p.status}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleProductStatus(p.id, p.status === 'active' ? 'flagged' : 'active')
                    }
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      p.status === 'active'
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {p.status === 'active' ? 'Flag Listing' : 'Restore Active'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Order Monitor */}
          {tab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Buyer</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3">Total (KES)</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="p-3 font-mono font-bold">{o.orderNumber}</td>
                      <td className="p-3">{o.buyerName}</td>
                      <td className="p-3 font-semibold">{o.supplierName}</td>
                      <td className="p-3">{o.deliveryZone}</td>
                      <td className="p-3 font-extrabold text-[#064E3B]">
                        {formatKes(o.totalKes)}
                      </td>
                      <td className="p-3">
                        {o.paymentMethod.toUpperCase()} ({o.paymentStatus})
                      </td>
                      <td className="p-3 font-bold">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Complaints */}
          {tab === 'complaints' && (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{c.subject}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      By {c.userName} • {c.description}
                    </p>
                    {c.resolutionNote && (
                      <p className="text-xs text-emerald-700 font-semibold">
                        Resolution: {c.resolutionNote}
                      </p>
                    )}
                  </div>
                  {c.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleResolveComplaint(c.id)}
                      className="inline-flex items-center gap-1 bg-[#064E3B] text-white text-xs font-bold px-3.5 py-2 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold">Resolved</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
