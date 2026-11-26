import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ShieldCheck, Sparkles, Store, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CATEGORIES, GARISSA_ZONES } from '../lib/api';
import { CategorySlug, GarissaZone } from '../types';

const DEMO_ACCOUNTS = [
  {
    label: 'Platform Admin',
    email: 'admin@suuqly.co.ke',
    pass: 'Admin123!',
    dest: '/admin',
    badge: 'Admin Control Center',
    color: 'bg-slate-900 text-white hover:bg-slate-800',
  },
  {
    label: 'Verified Supplier 1',
    sub: 'Tana River Solar & Hardware',
    email: 'seller1@suuqly.co.ke',
    pass: 'Seller123!',
    dest: '/seller',
    badge: 'Seller Dashboard',
    color: 'bg-[#064E3B] text-white hover:bg-[#04392B]',
  },
  {
    label: 'Verified Supplier 2',
    sub: 'Garissa Wholesale & Camel Dairy',
    email: 'seller2@suuqly.co.ke',
    pass: 'Seller123!',
    dest: '/seller',
    badge: 'Seller Dashboard',
    color: 'bg-emerald-700 text-white hover:bg-emerald-800',
  },
  {
    label: 'Buyer / Customer',
    sub: 'Amina Abdullahi',
    email: 'customer@suuqly.co.ke',
    pass: 'Customer123!',
    dest: '/',
    badge: 'Buyer Experience',
    color: 'bg-[#D97706] text-white hover:bg-amber-700',
  },
];

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab =
    searchParams.get('tab') === 'register'
      ? 'register'
      : searchParams.get('tab') === 'reset'
      ? 'reset'
      : 'login';
  const initialRole = searchParams.get('role') === 'seller' ? 'seller' : 'customer';

  const [tab, setTab] = useState<'login' | 'register' | 'reset'>(initialTab);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('2547');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'customer' | 'seller'>(initialRole);
  const [businessName, setBusinessName] = useState('');
  const [neighborhood, setNeighborhood] = useState<GarissaZone>('Garissa Town');
  const [category, setCategory] = useState<CategorySlug>('groceries-wholesale');

  // Password Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleDemoLogin = async (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setLoading(true);
    setError('');
    try {
      await login(acc.email, acc.pass);
      navigate(acc.dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'seller') navigate('/seller');
      else navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        businessName: regRole === 'seller' ? businessName : undefined,
        neighborhood,
        category,
      });
      navigate(user.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          phone: resetPhone,
          newPassword: resetNewPass,
        }),
      });
      setMessage(res.message);
      setTab('login');
      setEmail(resetEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* 1-Click Demo Login Bar for Hackathon Judges */}
      <div className="bg-white rounded-2xl border-2 border-[#D97706]/50 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D97706]" />
            <h2 className="font-extrabold text-slate-900 text-base">
              1-Click Demo Login Bar (For Hackathon Judges)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Instant JWT session — no typing required
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin(acc)}
              className={`${acc.color} rounded-xl p-3.5 text-left transition shadow-sm flex flex-col justify-between gap-2 disabled:opacity-60`}
            >
              <div>
                <div className="text-[10px] uppercase font-bold opacity-80">{acc.badge}</div>
                <div className="font-extrabold text-sm">{acc.label}</div>
                {acc.sub && <div className="text-[11px] opacity-90 truncate">{acc.sub}</div>}
              </div>
              <div className="text-[10px] font-mono bg-black/20 px-2 py-1 rounded truncate">
                {acc.email}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto overflow-hidden">
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`py-3.5 transition ${
              tab === 'login'
                ? 'bg-white text-[#064E3B] border-b-2 border-[#064E3B]'
                : 'text-slate-500'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`py-3.5 transition ${
              tab === 'register'
                ? 'bg-white text-[#064E3B] border-b-2 border-[#064E3B]'
                : 'text-slate-500'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('reset');
              setError('');
            }}
            className={`py-3.5 transition ${
              tab === 'reset'
                ? 'bg-white text-[#064E3B] border-b-2 border-[#064E3B]'
                : 'text-slate-500'
            }`}
          >
            Reset Password
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-[#064E3B] text-xs p-3 rounded-lg">
              {message}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@suuqly.co.ke"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#064E3B] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#064E3B] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#064E3B] hover:bg-[#04392B] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {loading ? 'Signing In...' : 'Sign In to Suuqly'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('customer')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                    regRole === 'customer'
                      ? 'bg-emerald-50 border-[#064E3B] text-[#064E3B]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mb-1" />
                  Buyer / Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('seller')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                    regRole === 'seller'
                      ? 'bg-amber-50 border-[#D97706] text-[#B45309]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Store className="w-4 h-4 mb-1" />
                  Supplier / Business
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g., Mohamed Ali"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kenyan Phone (M-Pesa)
                  </label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {regRole === 'seller' && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business / Shop Name
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Garissa Oasis Hardware"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Garissa Zone
                      </label>
                      <select
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value as GarissaZone)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs bg-white"
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
                        Primary Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CategorySlug)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#064E3B] hover:bg-[#04392B] text-white font-bold py-3 rounded-xl text-sm"
              >
                {loading
                  ? 'Creating Account...'
                  : regRole === 'seller'
                  ? 'Register Business Storefront'
                  : 'Create Buyer Account'}
              </button>
            </form>
          )}

          {tab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Phone (Verification)
                </label>
                <input
                  type="text"
                  required
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  placeholder="254711223344"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#064E3B] hover:bg-[#04392B] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
