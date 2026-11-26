import { GarissaZone, PriceTier } from '../types.js';

export const GARISSA_DELIVERY_FEES: Record<GarissaZone, number> = {
  'Garissa Town': 150,
  'Garissa Ndogo': 200,
  'Bula Iftin': 250,
  Medina: 250,
  Sankuri: 450,
};

export const GARISSA_ZONES: GarissaZone[] = [
  'Garissa Town',
  'Bula Iftin',
  'Garissa Ndogo',
  'Sankuri',
  'Medina',
];

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

export function getDeliveryFeeForZone(zone: GarissaZone): number {
  return GARISSA_DELIVERY_FEES[zone] ?? 250;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
