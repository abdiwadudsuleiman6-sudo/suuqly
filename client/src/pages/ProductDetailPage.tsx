import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Calculator,
  Heart,
  MapPin,
  MessageSquarePlus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiRequest, formatKes, getEffectiveUnitPrice } from '../lib/api';
import { Product, Review, Supplier } from '../types';

interface ProductDetailPageProps {
  onRequestQuote: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ onRequestQuote }) => {
  const { id } = useParams<{ id: string }>();
  const { user, toggleWishlist } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);

  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{
          product: Product;
          supplier: Supplier | null;
          reviews: Review[];
        }>(`/products/${id}`);
        if (!active) return;
        const enrichedProduct = {
          ...res.product,
          supplier: res.supplier
            ? {
                id: res.supplier.id,
                name: res.supplier.name,
                verified: res.supplier.verified,
                neighborhood: res.supplier.neighborhood,
                yearsInBusiness: res.supplier.yearsInBusiness,
                responseRate: res.supplier.responseRate,
                rating: res.supplier.rating,
                isOpen: res.supplier.isOpen,
              }
            : null,
        };
        setProduct(enrichedProduct);
        setSupplier(res.supplier);
        setReviews(res.reviews);
        setQty(res.product.moq || 1);
        setActiveImage(0);
      } catch {
        setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Product not found</h2>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#064E3B]">
          <ArrowLeft className="w-4 h-4" /> Back to Suuqly Marketplace
        </Link>
      </div>
    );
  }

  const effectiveUnitPrice = getEffectiveUnitPrice(
    product.unitPriceKes,
    product.priceTiers,
    qty
  );
  const totalKes = effectiveUnitPrice * qty;
  const savingsKes = Math.max(0, (product.unitPriceKes - effectiveUnitPrice) * qty);
  const isWishlisted = Boolean(user?.wishlist?.includes(product.id));
  const moqValid = qty >= product.moq && qty <= product.stock;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setReviewLoading(true);
    setReviewMsg('');
    try {
      const res = await apiRequest<{ review: Review; product: Product }>(
        `/products/${product.id}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ rating: ratingInput, comment: commentInput }),
        }
      );
      setReviews((prev) => [res.review, ...prev]);
      setProduct((prev) =>
        prev
          ? { ...prev, rating: res.product.rating, reviewCount: res.product.reviewCount }
          : prev
      );
      setCommentInput('');
      setReviewMsg('Thank you! Your review has been published.');
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : 'Failed to post review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#064E3B]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Garissa Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Multi-Image Gallery */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden aspect-[4/3]">
            <img
              src={product.images[activeImage] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2.5">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                    activeImage === idx ? 'border-[#064E3B]' : 'border-slate-200 opacity-75'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Pricing Tiers & Calculator */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {product.tradeAssurance && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#064E3B] border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                Trade Assurance / M-Pesa Escrow
              </span>
            )}
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
              {product.soldCount} sold
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 leading-snug">
            {product.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-bold text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
            <span>•</span>
            <span>In Stock: <strong>{product.stock}</strong> {product.unit}</span>
          </div>

          {/* Bulk Tier Pricing Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Wholesale & Retail KES Tiers
            </div>
            <div className="grid grid-cols-3 gap-2">
              {product.priceTiers.map((tier, idx) => {
                const isActive =
                  qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQty(Math.max(product.moq, tier.minQty))}
                    className={`p-2 rounded-lg border text-left transition ${
                      isActive
                        ? 'bg-[#ECFDF5] border-[#064E3B] ring-1 ring-[#064E3B]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-slate-500">
                      {tier.maxQty ? `${tier.minQty}–${tier.maxQty}` : `${tier.minQty}+`} {product.unit}
                    </div>
                    <div className="text-sm font-extrabold text-[#064E3B]">
                      {formatKes(tier.priceKes)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Bulk Calculator & MOQ Check */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                <Calculator className="w-4 h-4" />
                Live Bulk Tier Calculator
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                MOQ: {product.moq} {product.unit}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(product.moq, q - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 font-bold text-slate-700"
              >
                -
              </button>
              <input
                type="number"
                min={product.moq}
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-24 text-center rounded-lg border border-slate-300 py-1.5 font-bold text-sm bg-white"
              />
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 font-bold text-slate-700"
              >
                +
              </button>
              <span className="text-xs text-slate-600 font-medium">{product.unit}</span>
            </div>

            {!moqValid && (
              <p className="text-xs font-semibold text-rose-600">
                Quantity must be between MOQ ({product.moq}) and available stock ({product.stock}).
              </p>
            )}

            <div className="pt-2 border-t border-amber-200/80 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] text-slate-600">
                  Applied rate: <strong>{formatKes(effectiveUnitPrice)}</strong> / {product.unit}
                </div>
                {savingsKes > 0 && (
                  <div className="text-[11px] font-bold text-emerald-700">
                    Bulk Savings: {formatKes(savingsKes)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500">Total</div>
                <div className="text-lg font-extrabold text-[#064E3B]">{formatKes(totalKes)}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!moqValid}
                onClick={() => {
                  addToCart(product, qty);
                  navigate('/cart');
                }}
                className="flex-1 bg-[#064E3B] hover:bg-[#04392B] disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl text-sm inline-flex items-center justify-center gap-2 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  await toggleWishlist(product.id);
                }}
                className={`px-3.5 rounded-xl border transition flex items-center justify-center ${
                  isWishlisted
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-rose-300'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onRequestQuote(product)}
              className="w-full bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-300 font-bold py-2.5 px-4 rounded-xl text-sm inline-flex items-center justify-center gap-2 transition"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Contact Supplier / Request Bulk Quote (RFQ)
            </button>
          </div>
        </div>

        {/* Right: Verified Garissa Supplier Card */}
        <div className="lg:col-span-3 space-y-4">
          {supplier && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <img
                  src={supplier.logoUrl}
                  alt={supplier.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <Link
                    to={`/suppliers/${supplier.id}`}
                    className="font-extrabold text-sm text-slate-900 hover:text-[#064E3B] block"
                  >
                    {supplier.name}
                  </Link>
                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 mt-1 bg-amber-50 border border-amber-200 text-[#D97706] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verified Garissa Supplier
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Garissa Zone:</span>
                  <strong className="text-slate-800 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#064E3B]" />
                    {supplier.neighborhood}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Years in Business:</span>
                  <strong className="text-slate-800">{supplier.yearsInBusiness} years</strong>
                </div>
                <div className="flex justify-between">
                  <span>Response Rate:</span>
                  <strong className="text-[#064E3B]">{supplier.responseRate}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Store Status:</span>
                  <strong className={supplier.isOpen ? 'text-emerald-700' : 'text-rose-600'}>
                    {supplier.isOpen ? 'Open Now' : 'Closed'}
                  </strong>
                </div>
                <div className="pt-1 text-[11px] text-slate-500">{supplier.address}</div>
              </div>

              <Link
                to={`/suppliers/${supplier.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 border border-[#064E3B] text-[#064E3B] hover:bg-emerald-50 font-bold text-xs py-2.5 rounded-xl transition"
              >
                <Store className="w-4 h-4" />
                Visit Supplier Storefront
              </Link>
            </div>
          )}

          {/* Specs Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Product Specifications</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
            <div className="divide-y divide-slate-100 text-xs pt-1">
              {Object.entries(product.specs || {}).map(([k, v]) => (
                <div key={k} className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">
            Verified Buyer Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">
              No reviews yet. Be the first Garissa buyer to rate this product!
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{rev.userName}</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleReviewSubmit} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 h-fit">
          <h3 className="font-bold text-sm text-slate-900">Write a Review</h3>
          {reviewMsg && (
            <div className="text-xs font-semibold text-[#064E3B] bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
              {reviewMsg}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
            <select
              value={ratingInput}
              onChange={(e) => setRatingInput(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value={5}>5 Stars — Excellent Quality</option>
              <option value={4}>4 Stars — Good & Reliable</option>
              <option value={3}>3 Stars — Average</option>
              <option value={2}>2 Stars — Below Expectations</option>
              <option value={1}>1 Star — Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Experience
            </label>
            <textarea
              rows={3}
              required
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Share product quality, packaging, and Garissa delivery speed..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={reviewLoading}
            className="w-full bg-[#064E3B] hover:bg-[#04392B] text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            {reviewLoading ? 'Submitting...' : user ? 'Publish Review' : 'Sign In to Review'}
          </button>
        </form>
      </section>
    </div>
  );
};
