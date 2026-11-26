import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Heart,
  MapPin,
  MessageSquarePlus,
  ShieldCheck,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatKes } from '../lib/api';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onRequestQuote: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onRequestQuote }) => {
  const { user, toggleWishlist } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const isWishlisted = Boolean(user?.wishlist?.includes(product.id));
  const lowestTier =
    product.priceTiers && product.priceTiers.length > 0
      ? [...product.priceTiers].sort((a, b) => a.priceKes - b.priceKes)[0]
      : null;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWishlist(product.id);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-[#064E3B]/50 hover:shadow-md transition flex flex-col overflow-hidden group">
      <Link to={`/products/${product.id}`} className="relative block aspect-[16/11] bg-slate-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback) {
              target.dataset.fallback = '1';
              target.src = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80';
            }
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {product.tradeAssurance && (
            <span className="inline-flex items-center gap-1 bg-[#064E3B]/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <ShieldCheck className="w-3 h-3 text-[#FBBF24]" />
              M-Pesa Escrow
            </span>
          )}
          <span className="bg-white/95 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
            MOQ: {product.moq} {product.unit}
          </span>
        </div>
        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/90 text-slate-600 hover:text-rose-500'
          }`}
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col">
        <Link
          to={`/products/${product.id}`}
          className="text-sm font-bold text-slate-900 hover:text-[#064E3B] line-clamp-2 min-h-[2.5rem]"
        >
          {product.title}
        </Link>

        {/* KES Pricing + Bulk Tier */}
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-extrabold text-[#064E3B]">
              {formatKes(product.unitPriceKes)}
            </span>
            <span className="text-xs text-slate-500">/ {product.unit}</span>
          </div>

          {product.priceTiers && product.priceTiers.length > 1 && lowestTier && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] bg-amber-50 border border-amber-200/80 text-amber-900 px-2 py-1 rounded-md">
              <span className="font-semibold text-[#D97706]">Bulk:</span>
              <span>
                {lowestTier.minQty}+ {product.unit}: <strong>{formatKes(lowestTier.priceKes)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Supplier Info */}
        {product.supplier && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between gap-1">
              <Link
                to={`/suppliers/${product.supplier.id}`}
                className="font-semibold text-slate-700 hover:text-[#064E3B] truncate"
              >
                {product.supplier.name}
              </Link>
              {product.supplier.verified && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#D97706] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0"
                  title="Verified Garissa Supplier"
                >
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#064E3B]" />
                {product.supplier.neighborhood}
              </span>
              <span>{product.supplier.responseRate}% resp.</span>
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 pt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => addToCart(product, product.moq)}
            disabled={product.stock < product.moq}
            className="inline-flex items-center justify-center gap-1 bg-[#064E3B] hover:bg-[#04392B] disabled:bg-slate-300 text-white text-xs font-semibold py-2 px-2 rounded-lg transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.stock < product.moq ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={() => onRequestQuote(product)}
            className="inline-flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-300 text-xs font-semibold py-2 px-2 rounded-lg transition"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Request Quote
          </button>
        </div>
      </div>
    </div>
  );
};
