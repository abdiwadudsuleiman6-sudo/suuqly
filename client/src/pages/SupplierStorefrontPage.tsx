import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Clock, MapPin, Phone, Star } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { apiRequest } from '../lib/api';
import { Product, Supplier } from '../types';

interface SupplierStorefrontPageProps {
  onRequestQuote: (product: Product) => void;
}

export const SupplierStorefrontPage: React.FC<SupplierStorefrontPageProps> = ({
  onRequestQuote,
}) => {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiRequest<{ supplier: Supplier; products: Product[] }>(
          `/suppliers/${id}`
        );
        if (!active) return;
        setSupplier(res.supplier);
        setProducts(
          res.products.map((p) => ({
            ...p,
            supplier: {
              id: res.supplier.id,
              name: res.supplier.name,
              verified: res.supplier.verified,
              neighborhood: res.supplier.neighborhood,
              yearsInBusiness: res.supplier.yearsInBusiness,
              responseRate: res.supplier.responseRate,
              rating: res.supplier.rating,
              isOpen: res.supplier.isOpen,
            },
          }))
        );
      } catch {
        setSupplier(null);
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
        <div className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold">Supplier storefront not found</h2>
        <Link to="/" className="text-sm font-semibold text-[#064E3B]">
          ← Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#064E3B]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-[#064E3B] via-emerald-800 to-[#04392B]" />
        <div className="p-6 -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <img
              src={supplier.logoUrl}
              alt={supplier.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
            />
            <div className="pt-2 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900">{supplier.name}</h1>
                {supplier.verified && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-[#D97706] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <BadgeCheck className="w-4 h-4" />
                    Verified Garissa Supplier
                  </span>
                )}
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    supplier.isOpen
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {supplier.isOpen ? 'Open for Orders' : 'Temporarily Closed'}
                </span>
              </div>
              <p className="text-sm text-slate-600">{supplier.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#064E3B]" />
              <strong>{supplier.neighborhood}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#D97706]" />
              {supplier.openingHours}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#064E3B]" />+{supplier.phone}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {supplier.rating.toFixed(1)} • {supplier.responseRate}% Response
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 text-xs text-slate-600 border-t border-slate-100 pt-4">
          {supplier.description} • <strong>Address:</strong> {supplier.address}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">
          Supplier Catalog ({products.length} Products & Services)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onRequestQuote={(p) => onRequestQuote(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
