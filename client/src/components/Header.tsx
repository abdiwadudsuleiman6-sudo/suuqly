import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  FileSpreadsheet,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CATEGORIES, GARISSA_ZONES } from '../lib/api';
import { CategorySlug, GarissaZone } from '../types';

interface HeaderProps {
  searchQuery: string;
  searchType: 'products' | 'suppliers';
  activeCategory: CategorySlug | '';
  onSearchSubmit: (q: string, type: 'products' | 'suppliers') => void;
  onCategorySelect: (cat: CategorySlug | '') => void;
  onOpenRfq: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  searchType,
  activeCategory,
  onSearchSubmit,
  onCategorySelect,
  onOpenRfq,
}) => {
  const { user, logout, selectedZone, setSelectedZone } = useAuth();
  const { totalCount, items } = useCart();
  const navigate = useNavigate();
  const [localQ, setLocalQ] = useState(searchQuery);
  const [localType, setLocalType] = useState<'products' | 'suppliers'>(searchType);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(localQ, localType);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top Utility Bar */}
      <div className="bg-[#064E3B] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span className="text-emerald-100">Location:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as GarissaZone)}
                className="bg-emerald-900/80 text-white font-medium rounded px-1.5 py-0.5 border border-emerald-700 focus:outline-none cursor-pointer"
                aria-label="Select Garissa Zone"
              >
                {GARISSA_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}, Garissa
                  </option>
                ))}
              </select>
            </div>
            <span className="hidden sm:inline text-emerald-200">|</span>
            <span className="hidden sm:inline font-medium">
              Currency: <strong className="text-[#FBBF24]">KES (KSh)</strong>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 bg-amber-500/20 text-[#FCD34D] border border-amber-400/30 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              M-Pesa Escrow Trade Assurance
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenRfq}
              className="inline-flex items-center gap-1 hover:text-[#FBBF24] font-medium transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Request for Quotation
            </button>
            <Link
              to={user?.role === 'seller' ? '/seller' : '/login?tab=register&role=seller'}
              className="inline-flex items-center gap-1 text-[#FBBF24] hover:text-amber-300 font-semibold transition"
            >
              <Store className="w-3.5 h-3.5" />
              Sell on Suuqly
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link
          to="/"
          onClick={() => {
            onCategorySelect('');
            onSearchSubmit('', 'products');
            setLocalQ('');
          }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#064E3B] flex items-center justify-center shadow-sm border border-emerald-700">
            <span className="text-xl font-black text-[#FBBF24] tracking-tight">S</span>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-[#064E3B] tracking-tight">Suuqly</span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-[#D97706] px-1.5 py-0.5 rounded">
                Garissa B2B
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Your Marketplace. Your Community.
            </p>
          </div>
        </Link>

        {/* Oversized Alibaba-Style Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="hidden md:flex flex-1 max-w-2xl items-center rounded-full border-2 border-[#064E3B] bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-emerald-200"
        >
          <div className="relative border-r border-slate-200 bg-slate-50">
            <select
              value={localType}
              onChange={(e) => setLocalType(e.target.value as 'products' | 'suppliers')}
              className="appearance-none bg-transparent pl-4 pr-8 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              aria-label="Search scope"
            >
              <option value="products">Products</option>
              <option value="suppliers">Suppliers</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <input
            type="text"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder={
              localType === 'products'
                ? 'Search solar panels, camel milk, diracs, cement, rice in Garissa...'
                : 'Search Verified Garissa Suppliers by name or neighborhood...'
            }
            className="flex-1 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-[#064E3B] hover:bg-[#04392B] text-white px-6 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/account?tab=wishlist"
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-700 flex flex-col items-center text-[11px] font-medium"
            title="Wishlist"
          >
            <Heart className="w-5 h-5 text-slate-700" />
            <span className="hidden lg:inline mt-0.5">Wishlist</span>
            {user && user.wishlist.length > 0 && (
              <span className="absolute top-1 right-1 bg-[#D97706] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {user.wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-700 flex flex-col items-center text-[11px] font-medium"
            title="Cart & Checkout"
          >
            <ShoppingCart className="w-5 h-5 text-[#064E3B]" />
            <span className="hidden lg:inline mt-0.5">Cart</span>
            {items.length > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#064E3B] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </Link>

          {/* Account Menu */}
          <div className="relative">
            {user ? (
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-[#064E3B] bg-slate-50 text-sm font-medium transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#064E3B] text-white flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-slate-800 max-w-[110px] truncate">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-[#D97706]">
                    {user.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-[#064E3B] hover:bg-[#04392B] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {accountOpen && user && (
              <div
                className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                onMouseLeave={() => setAccountOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <Link
                  to="/account"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#064E3B]"
                >
                  <UserIcon className="w-4 h-4" />
                  Buyer Hub & Orders
                </Link>
                {user.role === 'seller' && (
                  <Link
                    to="/seller"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#064E3B] hover:bg-emerald-50"
                  >
                    <Store className="w-4 h-4" />
                    Supplier Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-[#D97706] hover:bg-amber-50"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Control Center
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setAccountOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 mt-1 border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-slate-100 pt-2">
          <form onSubmit={handleSubmit} className="flex items-center rounded-lg border border-[#064E3B] overflow-hidden">
            <select
              value={localType}
              onChange={(e) => setLocalType(e.target.value as 'products' | 'suppliers')}
              className="bg-slate-50 px-2 py-2 text-xs font-semibold border-r border-slate-200"
            >
              <option value="products">Products</option>
              <option value="suppliers">Suppliers</option>
            </select>
            <input
              type="text"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Search Suuqly Garissa..."
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
            />
            <button type="submit" className="bg-[#064E3B] text-white px-3 py-2">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Horizontal Category Strip */}
      <div className="border-t border-slate-100 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
          <button
            type="button"
            onClick={() => {
              onCategorySelect('');
              navigate('/');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeCategory === ''
                ? 'bg-[#064E3B] text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-[#064E3B]'
            }`}
          >
            All Garissa Markets
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                onCategorySelect(cat.slug);
                navigate('/');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.slug
                  ? 'bg-[#064E3B] text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-[#064E3B]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
