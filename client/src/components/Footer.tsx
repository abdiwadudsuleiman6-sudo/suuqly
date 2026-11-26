import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ShieldCheck } from 'lucide-react';
import { GARISSA_ZONES } from '../lib/api';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#064E3B] text-emerald-50 mt-16 border-t border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white text-[#064E3B] flex items-center justify-center font-black text-lg">
              S
            </div>
            <div>
              <h4 className="font-extrabold text-white text-lg leading-none">Suuqly</h4>
              <p className="text-[11px] text-[#FBBF24]">Your Marketplace. Your Community.</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            The Alibaba of Garissa & Northern Kenya — connecting verified wholesalers, pastoralist dairy cooperatives, solar engineers, and retail buyers with M-Pesa Escrow Trade Assurance.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm mb-3">Garissa Delivery Zones</h5>
          <ul className="space-y-1.5 text-xs text-emerald-100/90">
            {GARISSA_ZONES.map((z) => (
              <li key={z} className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FBBF24]" />
                {z}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm mb-3">Marketplace Portals</h5>
          <ul className="space-y-2 text-xs text-emerald-100/90">
            <li>
              <Link to="/" className="hover:text-[#FBBF24]">
                Browse Wholesale & Retail Deals
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-[#FBBF24]">
                Buyer Hub, Orders & RFQs
              </Link>
            </li>
            <li>
              <Link to="/seller" className="hover:text-[#FBBF24]">
                Supplier Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-[#FBBF24]">
                Admin Verification Center
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-white text-sm">Trade Assurance & Support</h5>
          <div className="bg-emerald-900/70 border border-emerald-700 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#FBBF24]">
              <ShieldCheck className="w-4 h-4" />
              M-Pesa Daraja Escrow
            </div>
            <p className="text-emerald-100/80">
              All wholesale & retail orders in KES are protected until local dispatch confirmation.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-white font-medium">
              <Phone className="w-3.5 h-3.5 text-[#FBBF24]" />
              +254 722 100 001 • Garissa Town
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-800/80 py-4 text-center text-xs text-emerald-200/80">
        © {new Date().getFullYear()} Suuqly Garissa B2B & Retail Marketplace • Currency: KES
      </div>
    </footer>
  );
};
