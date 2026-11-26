import { CategorySlug, GarissaZone, PriceTier } from '../types';

export const GARISSA_ZONES: GarissaZone[] = [
  'Garissa Town',
  'Bula Iftin',
  'Garissa Ndogo',
  'Sankuri',
  'Medina',
];

export const GARISSA_DELIVERY_FEES: Record<GarissaZone, number> = {
  'Garissa Town': 150,
  'Garissa Ndogo': 200,
  'Bula Iftin': 250,
  Medina: 250,
  Sankuri: 450,
};

export interface CategoryMeta {
  slug: CategorySlug;
  label: string;
  shortLabel: string;
  subcategories: string[];
  tagline: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'livestock-camel-milk',
    label: 'Livestock & Camel Milk',
    shortLabel: 'Livestock & Dairy',
    subcategories: ['Fresh Camel Milk', 'Galla Goats', 'Subag Ghee', 'Halal Meat Cuts'],
    tagline: 'Daily pastoralist dairy & vet-inspected stock',
  },
  {
    slug: 'electronics-solar',
    label: 'Electronics & Solar',
    shortLabel: 'Solar & Tech',
    subcategories: ['450W Solar Panels', 'LiFePO4 Batteries', 'Solar Borehole Pumps', 'MPPT Inverters'],
    tagline: 'Tier-1 off-grid power for Northern Kenya',
  },
  {
    slug: 'textiles-diracs',
    label: 'Textiles & Diracs',
    shortLabel: 'Diracs & Fabrics',
    subcategories: ['Embroidered Diracs', 'Medina Silk Hijabs', 'Cotton Macaawiis', 'Prayer Mats'],
    tagline: 'Wholesale boutique bundles from Garissa Ndogo',
  },
  {
    slug: 'building-hardware',
    label: 'Building & Hardware',
    shortLabel: 'Hardware & Steel',
    subcategories: ['50kg Cement', 'Box Profile Mabati', 'D12 Steel Rebar', '5,000L Water Tanks'],
    tagline: 'KEBS-certified depot pricing from Medina',
  },
  {
    slug: 'groceries-wholesale',
    label: 'Groceries & Wholesale',
    shortLabel: 'Wholesale Pantry',
    subcategories: ['20L Cooking Oil', '25kg Basmati Rice', 'Grade-A Dates', '50kg Cane Sugar'],
    tagline: 'Bulk cartons & sacks for kiosks and hotels',
  },
  {
    slug: 'local-services-transport',
    label: 'Local Services & Transport',
    shortLabel: 'Cargo & Services',
    subcategories: ['Nairobi–Garissa Freight', 'Boda Fleet Passes', 'Solar Installation', 'Cold-Chain Trucks'],
    tagline: 'Insured regional logistics & certified engineers',
  },
];

export function formatKes(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString('en-KE')}`;
}

export function getEffectiveUnitPrice(
  unitPriceKes: number,
  priceTiers: PriceTier[],
  quantity: number
): number {
  if (!priceTiers || priceTiers.length === 0) return unitPriceKes;
  const sorted = [...priceTiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty)) {
      return tier.priceKes;
    }
  }
  return unitPriceKes;
}

export function getToken(): string | null {
  return localStorage.getItem('suuqly_token');
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem('suuqly_token', token);
  else localStorage.removeItem('suuqly_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const res = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}
