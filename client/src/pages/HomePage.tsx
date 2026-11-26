import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Filter,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Sun,
  Truck,
  Wheat,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { apiRequest, CATEGORIES, GARISSA_ZONES } from '../lib/api';
import { CategorySlug, GarissaZone, Product, Supplier } from '../types';

interface HomePageProps {
  searchQuery: string;
  searchType: 'products' | 'suppliers';
  activeCategory: CategorySlug | '';
  onCategorySelect: (cat: CategorySlug | '') => void;
  onRequestQuote: (product?: Product | null) => void;
}

const CATEGORY_ICONS: Record<CategorySlug, React.ReactNode> = {
  'livestock-camel-milk': <Wheat className="w-4 h-4" />,
  'electronics-solar': <Sun className="w-4 h-4" />,
  'textiles-diracs': <ShoppingBag className="w-4 h-4" />,
  'building-hardware': <Building2 className="w-4 h-4" />,
  'groceries-wholesale': <Package className="w-4 h-4" />,
  'local-services-transport': <Truck className="w-4 h-4" />,
};

const HERO_SLIDES = [
  {
    badge: 'GARISSA B2B & RETAIL TRADE HUB',
    title: 'Source Verified Goods Across Garissa & Northern Kenya',
    subtitle:
      'Direct KES bulk pricing tiers, local Garissa neighborhood delivery, and M-Pesa Daraja Escrow protection on every order.',
    cta: 'Explore Verified Deals',
    category: '' as CategorySlug | '',
    accent: 'from-[#064E3B] via-[#065F46] to-[#04392B]',
  },
  {
    badge: 'OFF-GRID SOLAR & WATER',
    title: 'Tier-1 450W Solar Panels & DC Borehole Pumps',
    subtitle:
      'Save up to 16% on bulk quantities from Tana River Solar & Hardware in Garissa Town.',
    cta: 'Shop Solar & Tech',
    category: 'electronics-solar' as CategorySlug,
    accent: 'from-[#064E3B] via-emerald-800 to-amber-900/90',
  },
  {
    badge: 'PASTORALIST DAIRY & PANTRY',
    title: 'Chilled Bula Iftin Camel Milk & Wholesale Staples',
    subtitle:
      'Daily cold-chain delivery from cooperatives in Bula Iftin & Sankuri with instant RFQ quotes.',
    cta: 'Shop Dairy & Livestock',
    category: 'livestock-camel-milk' as CategorySlug,
    accent: 'from-[#04392B] via-[#064E3B] to-[#92400E]',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  searchQuery,
  searchType,
  activeCategory,
  onCategorySelect,
  onRequestQuote,
}) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCat, setHoveredCat] = useState<CategorySlug | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);

  const [neighborhood, setNeighborhood] = useState<GarissaZone | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [demoLoading, setDemoLoading] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const prodParams = new URLSearchParams();
        if (searchQuery && searchType === 'products') prodParams.set('q', searchQuery);
        if (activeCategory) prodParams.set('category', activeCategory);
        if (neighborhood) prodParams.set('neighborhood', neighborhood);
        if (verifiedOnly) prodParams.set('verifiedOnly', 'true');
        if (sortBy) prodParams.set('sort', sortBy);

        const supParams = new URLSearchParams();
        if (searchQuery && searchType === 'suppliers') supParams.set('q', searchQuery);
        if (activeCategory) supParams.set('category', activeCategory);
        if (neighborhood) supParams.set('neighborhood', neighborhood);
        if (verifiedOnly) supParams.set('verifiedOnly', 'true');

        const [prodRes, supRes] = await Promise.all([
          apiRequest<{ products: Product[] }>(`/products?${prodParams.toString()}`),
          apiRequest<{ suppliers: Supplier[] }>(`/suppliers?${supParams.toString()}`),
        ]);

        if (!active) return;
        setProducts(prodRes.products);
        setSuppliers(supRes.suppliers);
      } catch (err) {
        console.error('Failed to load marketplace:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [searchQuery, searchType, activeCategory, neighborhood, verifiedOnly, sortBy]);

  const handleQuickDemo = async (email: string, password: string, dest: string) => {
    setDemoLoading(email);
    try {
      await login(email, password);
      if (dest !== '/') navigate(dest);
    } finally {
      setDemoLoading('');
    }
  };

  const currentSlide = HERO_SLIDES[slideIdx];
  const hoveredCategoryMeta = CATEGORIES.find((c) => c.slug === hoveredCat);
  const verifiedSuppliers = suppliers.filter((s) => s.verified);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Alibaba-Style 3-Column Hero & Discovery Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Vertical Categories Mega-Menu */}
        <div
          className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 relative"
          onMouseLeave={() => setHoveredCat(null)}
        >
          <div className="px-2 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#064E3B]">
              Garissa Markets
            </span>
            <span className="text-[11px] text-slate-400">6 Categories</span>
          </div>
          <ul className="space-y-1">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug} onMouseEnter={() => setHoveredCat(cat.slug)}>
                <button
                  type="button"
                  onClick={() => onCategorySelect(cat.slug)}
                  className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-left text-xs font-semibold transition ${
                    activeCategory === cat.slug || hoveredCat === cat.slug
                      ? 'bg-[#ECFDF5] text-[#064E3B]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[#064E3B]">{CATEGORY_ICONS[cat.slug]}</span>
                    {cat.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>

          {/* Mega-Menu Flyout Panel on Desktop Hover */}
          {hoveredCategoryMeta && (
            <div className="hidden lg:block absolute left-full top-0 ml-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-30">
              <p className="text-xs font-extrabold uppercase text-[#D97706] mb-1">
                {hoveredCategoryMeta.label}
              </p>
              <p className="text-xs text-slate-500 mb-3">{hoveredCategoryMeta.tagline}</p>
              <div className="space-y-1.5">
                {hoveredCategoryMeta.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      onCategorySelect(hoveredCategoryMeta.slug);
                      setHoveredCat(null);
                    }}
                    className="w-full text-left text-xs font-medium text-slate-700 hover:text-[#064E3B] hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition"
                  >
                    • {sub}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Promotional Trade Banner */}
        <div
          className={`lg:col-span-6 rounded-2xl bg-gradient-to-br ${currentSlide.accent} text-white p-7 flex flex-col justify-between shadow-md relative overflow-hidden min-h-[300px]`}
        >
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-8 bottom-6 w-32 h-32 rounded-full bg-[#D97706]/20 pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-[#FCD34D] border border-amber-300/30 text-[11px] font-bold px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              {currentSlide.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              {currentSlide.title}
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-lg leading-relaxed">
              {currentSlide.subtitle}
            </p>
          </div>

          <div className="relative z-10 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onCategorySelect(currentSlide.category);
                  document.getElementById('deals-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm transition"
              >
                {currentSlide.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onRequestQuote(null)}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
              >
                Post Bulk RFQ
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === slideIdx ? 'w-6 bg-[#FBBF24]' : 'w-2 bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: User Welcome / Quick RFQ & 1-Click Demo Login Card */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between gap-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#064E3B] text-white flex items-center justify-center font-extrabold text-base">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Karibu back to Suuqly</p>
                  <p className="font-bold text-slate-900 truncate">{user.name}</p>
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-[#064E3B] border border-emerald-200">
                    {user.role} Account
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <Link
                  to="/account"
                  className="w-full text-center bg-[#064E3B] hover:bg-[#04392B] text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Open Buyer Hub & Orders
                </Link>
                {user.role === 'seller' && (
                  <Link
                    to="/seller"
                    className="w-full text-center bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-300 text-xs font-bold py-2.5 rounded-xl transition"
                  >
                    Open Supplier Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="w-full text-center bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-300 text-xs font-bold py-2.5 rounded-xl transition"
                  >
                    Admin Verification Center
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-[#D97706] uppercase tracking-wide">
                  1-Click Judge Demo Access
                </p>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Welcome to Suuqly Garissa
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={Boolean(demoLoading)}
                  onClick={() => handleQuickDemo('customer@suuqly.co.ke', 'Customer123!', '/')}
                  className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 py-2 px-2 rounded-lg transition"
                >
                  {demoLoading === 'customer@suuqly.co.ke' ? '...' : 'Buyer Demo'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(demoLoading)}
                  onClick={() => handleQuickDemo('seller1@suuqly.co.ke', 'Seller123!', '/seller')}
                  className="text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 py-2 px-2 rounded-lg transition"
                >
                  {demoLoading === 'seller1@suuqly.co.ke' ? '...' : 'Supplier 1'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(demoLoading)}
                  onClick={() => handleQuickDemo('seller2@suuqly.co.ke', 'Seller123!', '/seller')}
                  className="text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 py-2 px-2 rounded-lg transition"
                >
                  {demoLoading === 'seller2@suuqly.co.ke' ? '...' : 'Supplier 2'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(demoLoading)}
                  onClick={() => handleQuickDemo('admin@suuqly.co.ke', 'Admin123!', '/admin')}
                  className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2 px-2 rounded-lg transition"
                >
                  {demoLoading === 'admin@suuqly.co.ke' ? '...' : 'Admin Hub'}
                </button>
              </div>
              <Link
                to="/login"
                className="block text-center text-xs font-semibold text-[#064E3B] hover:underline"
              >
                Register Buyer or Supplier Account →
              </Link>
            </div>
          )}

          {/* Quick RFQ Promo Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#D97706]" />
              <span className="text-xs font-bold text-slate-900">Need Custom Bulk Pricing?</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Send one RFQ and receive custom KES quotes from verified Garissa suppliers.
            </p>
            <button
              type="button"
              onClick={() => onRequestQuote(null)}
              className="w-full bg-white hover:bg-emerald-50 text-[#064E3B] border border-[#064E3B] text-xs font-bold py-2 rounded-lg transition"
            >
              Request Bulk Quote (RFQ)
            </button>
          </div>
        </div>
      </section>

      {/* Source by Category */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Source by Category</h2>
            <p className="text-xs text-slate-500">
              Wholesale & retail trade verticals built for Garissa & Northern Kenya
            </p>
          </div>
          {activeCategory && (
            <button
              type="button"
              onClick={() => onCategorySelect('')}
              className="text-xs font-bold text-[#064E3B] hover:underline"
            >
              Reset Category Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onCategorySelect(cat.slug)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                activeCategory === cat.slug
                  ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-[#064E3B]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  activeCategory === cat.slug
                    ? 'bg-emerald-800 text-[#FBBF24]'
                    : 'bg-emerald-50 text-[#064E3B]'
                }`}
              >
                {CATEGORY_ICONS[cat.slug]}
              </div>
              <div>
                <h3 className="text-xs font-bold leading-snug">{cat.label}</h3>
                <p
                  className={`text-[11px] mt-0.5 line-clamp-1 ${
                    activeCategory === cat.slug ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {cat.subcategories[0]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Verified Garissa Suppliers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                {searchType === 'suppliers' && searchQuery
                  ? `Suppliers matching "${searchQuery}"`
                  : 'Verified Garissa Suppliers'}
              </h2>
              <span className="inline-flex items-center gap-1 bg-amber-100 text-[#B45309] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" />
                {verifiedSuppliers.length} Verified
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Vetted local wholesalers & service providers with high response rates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(searchType === 'suppliers' && searchQuery ? suppliers : verifiedSuppliers).map(
            (sup) => (
              <Link
                key={sup.id}
                to={`/suppliers/${sup.id}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-[#064E3B] hover:shadow-md p-4 transition flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={sup.logoUrl}
                    alt={sup.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{sup.name}</h3>
                      {sup.verified && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-[#D97706] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          <BadgeCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{sup.tagline}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#064E3B]" />
                    <span className="truncate">{sup.neighborhood}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                    {sup.yearsInBusiness} yrs • {sup.responseRate}%
                  </span>
                  <span className="inline-flex items-center justify-end gap-1 font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {sup.rating.toFixed(1)} ({sup.productCount || 0})
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Trending Wholesale & Retail Deals */}
      <section id="deals-grid" className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : activeCategory
                ? CATEGORIES.find((c) => c.slug === activeCategory)?.label
                : 'Trending Wholesale & Retail Deals'}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {products.length} active listings in KES with M-Pesa Escrow
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#064E3B]" />
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value as GarissaZone | '')}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
                aria-label="Filter by Garissa neighborhood"
              >
                <option value="">All Garissa Zones</option>
                {GARISSA_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="accent-[#064E3B]"
              />
              Verified Only
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              aria-label="Sort products"
            >
              <option value="featured">Featured & Best Selling</option>
              <option value="price-asc">Price: Low to High (KES)</option>
              <option value="price-desc">Price: High to Low (KES)</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 h-80 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <Store className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800">No listings matched your filters</h3>
            <p className="text-xs text-slate-500">
              Try clearing your neighborhood or search filter, or submit a custom RFQ to Garissa suppliers.
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setNeighborhood('');
                  setVerifiedOnly(false);
                  onCategorySelect('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => onRequestQuote(null)}
                className="px-4 py-2 rounded-lg bg-[#064E3B] text-white text-xs font-semibold"
              >
                Post Custom RFQ
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onRequestQuote={(p) => onRequestQuote(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trade Assurance Banner */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Suuqly Trade Assurance & M-Pesa Daraja Escrow
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl mt-1">
              Every transaction in Kenyan Shillings (KES) supports instant M-Pesa STK Push or Cash on Delivery across Garissa Town, Bula Iftin, Garissa Ndogo, Sankuri, and Medina.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRequestQuote(null)}
          className="bg-[#064E3B] hover:bg-[#04392B] text-white text-xs font-bold px-5 py-3 rounded-xl whitespace-nowrap transition"
        >
          Start Bulk Sourcing (RFQ)
        </button>
      </section>
    </div>
  );
};
