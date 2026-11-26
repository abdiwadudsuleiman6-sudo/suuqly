import fs from 'fs';
import path from 'path';

export interface AssetSpec {
  filename: string;
  bgStart: string;
  bgEnd: string;
  accent: string;
  badge: string;
  title: string;
  subtitle: string;
  motif:
    | 'solar'
    | 'battery'
    | 'pump'
    | 'dairy'
    | 'livestock'
    | 'textile'
    | 'hardware'
    | 'grocery'
    | 'transport'
    | 'supplier';
}

function renderMotif(motif: AssetSpec['motif'], accent: string): string {
  switch (motif) {
    case 'solar':
      return `
        <rect x="210" y="110" width="220" height="150" rx="10" fill="#0f172a" stroke="#e2e8f0" stroke-width="5"/>
        <line x1="265" y1="110" x2="265" y2="260" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
        <line x1="320" y1="110" x2="320" y2="260" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
        <line x1="375" y1="110" x2="375" y2="260" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
        <line x1="210" y1="160" x2="430" y2="160" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
        <line x1="210" y1="210" x2="430" y2="210" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
        <circle cx="485" cy="95" r="28" fill="${accent}"/>
        <line x1="320" y1="260" x2="320" y2="295" stroke="#64748b" stroke-width="10"/>
        <rect x="270" y="290" width="100" height="12" rx="6" fill="#475569"/>
      `;
    case 'battery':
      return `
        <rect x="235" y="120" width="170" height="170" rx="16" fill="#064e3b" stroke="#ffffff" stroke-width="5"/>
        <rect x="260" y="102" width="32" height="18" rx="4" fill="#d97706"/>
        <rect x="348" y="102" width="32" height="18" rx="4" fill="#0f172a"/>
        <polygon points="330,152 295,208 323,208 308,255 352,195 324,195" fill="#fbbf24"/>
      `;
    case 'pump':
      return `
        <rect x="210" y="165" width="160" height="80" rx="14" fill="#0f766e" stroke="#ffffff" stroke-width="4"/>
        <circle cx="385" cy="205" r="46" fill="#064e3b" stroke="#ffffff" stroke-width="4"/>
        <circle cx="385" cy="205" r="18" fill="${accent}"/>
        <rect x="372" y="108" width="26" height="52" rx="4" fill="#334155"/>
        <rect x="235" y="182" width="90" height="44" rx="6" fill="#14b8a6" opacity="0.5"/>
      `;
    case 'dairy':
      return `
        <rect x="255" y="125" width="130" height="168" rx="22" fill="#ffffff" stroke="#064e3b" stroke-width="5"/>
        <rect x="295" y="96" width="50" height="32" rx="6" fill="${accent}"/>
        <rect x="275" y="175" width="90" height="62" rx="10" fill="#ecfdf5" stroke="#064e3b" stroke-width="2"/>
        <circle cx="320" cy="206" r="18" fill="#064e3b"/>
        <text x="320" y="212" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" font-weight="bold">5L</text>
      `;
    case 'livestock':
      return `
        <ellipse cx="320" cy="215" rx="95" ry="52" fill="#b45309"/>
        <ellipse cx="320" cy="175" rx="44" ry="34" fill="#d97706"/>
        <rect x="242" y="242" width="18" height="58" rx="7" fill="#92400e"/>
        <rect x="282" y="248" width="18" height="54" rx="7" fill="#92400e"/>
        <rect x="342" y="248" width="18" height="54" rx="7" fill="#92400e"/>
        <rect x="380" y="242" width="18" height="58" rx="7" fill="#92400e"/>
        <path d="M398 188 Q435 155 430 122 Q458 122 460 142 Q442 152 430 198 Z" fill="#b45309"/>
        <circle cx="442" cy="134" r="4" fill="#0f172a"/>
      `;
    case 'textile':
      return `
        <path d="M225 115 L415 115 L440 295 L200 295 Z" fill="#065f46" stroke="#ffffff" stroke-width="4"/>
        <path d="M245 115 L395 115 L415 295 L225 295 Z" fill="${accent}" opacity="0.88"/>
        <circle cx="320" cy="185" r="34" fill="none" stroke="#ffffff" stroke-width="5" stroke-dasharray="8 6"/>
        <circle cx="320" cy="245" r="20" fill="#ffffff" opacity="0.85"/>
      `;
    case 'hardware':
      return `
        <rect x="215" y="130" width="210" height="150" rx="12" fill="#475569" stroke="#ffffff" stroke-width="4"/>
        <rect x="235" y="152" width="170" height="106" rx="8" fill="#e2e8f0"/>
        <rect x="255" y="175" width="130" height="22" rx="4" fill="#064e3b"/>
        <rect x="255" y="210" width="90" height="16" rx="4" fill="${accent}"/>
      `;
    case 'grocery':
      return `
        <rect x="240" y="122" width="160" height="172" rx="18" fill="#fef3c7" stroke="#b45309" stroke-width="5"/>
        <path d="M240 156 L400 156" stroke="#b45309" stroke-width="4"/>
        <circle cx="320" cy="222" r="38" fill="#064e3b"/>
        <text x="320" y="229" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">KES</text>
      `;
    case 'transport':
      return `
        <rect x="195" y="145" width="175" height="110" rx="12" fill="#064e3b" stroke="#ffffff" stroke-width="4"/>
        <path d="M370 175 L435 175 L455 215 L455 255 L370 255 Z" fill="${accent}" stroke="#ffffff" stroke-width="4"/>
        <rect x="385" y="188" width="42" height="28" rx="4" fill="#e0f2fe"/>
        <circle cx="248" cy="265" r="24" fill="#0f172a" stroke="#e2e8f0" stroke-width="5"/>
        <circle cx="415" cy="265" r="24" fill="#0f172a" stroke="#e2e8f0" stroke-width="5"/>
      `;
    case 'supplier':
      return `
        <rect x="210" y="135" width="220" height="150" rx="14" fill="#064e3b" stroke="#ffffff" stroke-width="5"/>
        <path d="M195 140 L320 92 L445 140 Z" fill="${accent}"/>
        <rect x="285" y="198" width="70" height="87" rx="8" fill="#ffffff"/>
        <rect x="232" y="172" width="38" height="38" rx="6" fill="#ecfdf5"/>
        <rect x="370" y="172" width="38" height="38" rx="6" fill="#ecfdf5"/>
      `;
  }
}

export const SEED_ASSETS: AssetSpec[] = [
  { filename: 'solar-panel-450w.svg', bgStart: '#ecfdf5', bgEnd: '#d1fae5', accent: '#d97706', badge: 'SOLAR TECH', title: '450W Mono Solar Panel', subtitle: 'Tier-1 Off-Grid Power', motif: 'solar' },
  { filename: 'lithium-battery-200ah.svg', bgStart: '#f0fdf4', bgEnd: '#dcfce7', accent: '#d97706', badge: 'ENERGY STORAGE', title: '200Ah LiFePO4 Battery', subtitle: '4000+ Deep Cycles', motif: 'battery' },
  { filename: 'borehole-pump-solar.svg', bgStart: '#ecfeff', bgEnd: '#cffafe', accent: '#f59e0b', badge: 'WATER SOLUTIONS', title: 'DC Solar Borehole Pump', subtitle: 'Submersible 1.5HP Kit', motif: 'pump' },
  { filename: 'inverter-hybrid-5kva.svg', bgStart: '#f8fafc', bgEnd: '#e2e8f0', accent: '#064e3b', badge: 'HYBRID INVERTER', title: '5kVA Pure Sine Inverter', subtitle: 'MPPT Solar Controller', motif: 'battery' },
  { filename: 'camel-milk-fresh.svg', bgStart: '#fffbeb', bgEnd: '#fef3c7', accent: '#064e3b', badge: 'GARISSA DAIRY', title: 'Fresh Pasteurized Camel Milk', subtitle: '5L Food-Grade Jerrycan', motif: 'dairy' },
  { filename: 'camel-ghee-subag.svg', bgStart: '#fffbeb', bgEnd: '#fde68a', accent: '#b45309', badge: 'TRADITIONAL SUBAG', title: 'Pure Camel & Goat Ghee', subtitle: '2L Sealed Wholesale Jar', motif: 'dairy' },
  { filename: 'galla-goats-wholesale.svg', bgStart: '#fef3c7', bgEnd: '#fed7aa', accent: '#064e3b', badge: 'SANKURI LIVESTOCK', title: 'Garissa Galla Breeding Goats', subtitle: 'Vaccinated Herd Lot', motif: 'livestock' },
  { filename: 'somali-camel-beef.svg', bgStart: '#fef2f2', bgEnd: '#fecaca', accent: '#b45309', badge: 'COLD CHAIN', title: 'Halal Camel Meat Cuts', subtitle: 'Chilled 10kg Wholesale Box', motif: 'livestock' },
  { filename: 'dirac-baati-bale.svg', bgStart: '#f0fdf4', bgEnd: '#bbf7d0', accent: '#d97706', badge: 'AL-NOOR TEXTILES', title: 'Embroidered Dirac & Garbasaar', subtitle: '12-Piece Wholesale Bundle', motif: 'textile' },
  { filename: 'silk-hijab-pack.svg', bgStart: '#fdf4ff', bgEnd: '#f5d0fe', accent: '#064e3b', badge: 'MODEST WEAR', title: 'Medina Silk Hijab Pack', subtitle: '20-Piece Boutique Lot', motif: 'textile' },
  { filename: 'mens-macaawiis.svg', bgStart: '#eff6ff', bgEnd: '#bfdbfe', accent: '#064e3b', badge: 'PREMIUM COTTON', title: 'Woven Somali Macaawiis', subtitle: '24-Piece Wholesale Box', motif: 'textile' },
  { filename: 'prayer-mats-bulk.svg', bgStart: '#ecfdf5', bgEnd: '#a7f3d0', accent: '#d97706', badge: 'VELVET JACQUARD', title: 'Plush Prayer Mats (Sajadah)', subtitle: '10-Piece Mosque & Retail Lot', motif: 'textile' },
  { filename: 'cement-50kg.svg', bgStart: '#f1f5f9', bgEnd: '#cbd5e1', accent: '#d97706', badge: 'IFTIN STEEL & CEMENT', title: 'Portland Pozzolana Cement', subtitle: '50kg Heavy Duty Bag', motif: 'hardware' },
  { filename: 'mabati-roofing.svg', bgStart: '#f8fafc', bgEnd: '#e2e8f0', accent: '#064e3b', badge: 'GAUGE 28 COLORED', title: 'Box Profile Mabati Sheets', subtitle: '3m Heat-Reflective Sheet', motif: 'hardware' },
  { filename: 'rebar-d12.svg', bgStart: '#f1f5f9', bgEnd: '#d1d5db', accent: '#b45309', badge: 'KEBS CERTIFIED', title: 'D12 Deformed Steel Rebar', subtitle: '12m High-Tensile Bar', motif: 'hardware' },
  { filename: 'water-tank-5000l.svg', bgStart: '#ecfeff', bgEnd: '#bae6fd', accent: '#064e3b', badge: 'UV STABILIZED', title: '5,000L Heavy Water Tank', subtitle: 'Food-Grade Storage Drum', motif: 'pump' },
  { filename: 'cooking-oil-20l.svg', bgStart: '#fffbeb', bgEnd: '#fef08a', accent: '#064e3b', badge: 'WHOLESALE PANTRY', title: 'Golden Fry Vegetable Oil', subtitle: '20L Sealed Jerrycan', motif: 'grocery' },
  { filename: 'basmati-rice-25kg.svg', bgStart: '#f0fdf4', bgEnd: '#dcfce7', accent: '#d97706', badge: 'LONG GRAIN', title: 'Aromatic Basmati Rice', subtitle: '25kg Wholesale Sack', motif: 'grocery' },
  { filename: 'dates-medjool-5kg.svg', bgStart: '#fef3c7', bgEnd: '#fde68a', accent: '#92400e', badge: 'IMPORT GRADE A', title: 'Premium Arabian Dates', subtitle: '5kg Carton (Tamir)', motif: 'grocery' },
  { filename: 'sugar-50kg-bag.svg', bgStart: '#f8fafc', bgEnd: '#e2e8f0', accent: '#064e3b', badge: 'FACTORY DIRECT', title: 'Kenyan Brown Cane Sugar', subtitle: '50kg Wholesale Sack', motif: 'grocery' },
  { filename: 'nairobi-garissa-cargo.svg', bgStart: '#ecfdf5', bgEnd: '#d1fae5', accent: '#d97706', badge: 'DAILY CONSOLIDATION', title: 'Nairobi–Garissa Lorry Freight', subtitle: 'Per-Tonne Express Cargo', motif: 'transport' },
  { filename: 'boda-same-day.svg', bgStart: '#fff7ed', bgEnd: '#fed7aa', accent: '#064e3b', badge: 'LOCAL DISPATCH', title: 'Garissa Boda Fleet Pass', subtitle: '10-Trip Town & Bula Iftin Pack', motif: 'transport' },
  { filename: 'solar-installation-svc.svg', bgStart: '#f0fdf4', bgEnd: '#bbf7d0', accent: '#d97706', badge: 'CERTIFIED ENGINEERS', title: 'Commercial Solar Installation', subtitle: 'Full Site Survey & Wiring', motif: 'solar' },
  { filename: 'cold-truck-hire.svg', bgStart: '#ecfeff', bgEnd: '#cffafe', accent: '#064e3b', badge: 'REFRIGERATED 3T', title: 'Cold-Chain Truck Charter', subtitle: 'Sankuri–Garissa–Thika Route', motif: 'transport' },
  { filename: 'supplier-tana-solar.svg', bgStart: '#ecfdf5', bgEnd: '#a7f3d0', accent: '#d97706', badge: 'VERIFIED SUPPLIER', title: 'Tana River Solar & Hardware', subtitle: 'Garissa Town • 8 Yrs', motif: 'supplier' },
  { filename: 'supplier-camel-dairy.svg', bgStart: '#fffbeb', bgEnd: '#fde68a', accent: '#064e3b', badge: 'VERIFIED SUPPLIER', title: 'Garissa Wholesale & Camel Dairy', subtitle: 'Bula Iftin • 11 Yrs', motif: 'supplier' },
  { filename: 'supplier-al-noor.svg', bgStart: '#fdf4ff', bgEnd: '#f5d0fe', accent: '#064e3b', badge: 'VERIFIED SUPPLIER', title: 'Al-Noor Diracs & Textiles', subtitle: 'Garissa Ndogo • 6 Yrs', motif: 'supplier' },
  { filename: 'supplier-iftin-builders.svg', bgStart: '#f1f5f9', bgEnd: '#cbd5e1', accent: '#d97706', badge: 'VERIFIED SUPPLIER', title: 'Iftin Builders & Steel Depot', subtitle: 'Medina • 9 Yrs', motif: 'supplier' },
  { filename: 'supplier-sankuri-livestock.svg', bgStart: '#fef3c7', bgEnd: '#fed7aa', accent: '#064e3b', badge: 'VERIFIED SUPPLIER', title: 'Sankuri Livestock & Cold Chain', subtitle: 'Sankuri • 7 Yrs', motif: 'supplier' },
  { filename: 'supplier-northeastern-cargo.svg', bgStart: '#ecfeff', bgEnd: '#bae6fd', accent: '#d97706', badge: 'VERIFIED SUPPLIER', title: 'NorthEastern Cargo & Boda', subtitle: 'Garissa Town • 5 Yrs', motif: 'supplier' },
  { filename: 'supplier-modogashe-agro.svg', bgStart: '#f8fafc', bgEnd: '#e2e8f0', accent: '#d97706', badge: 'PENDING REVIEW', title: 'Modogashe Agro-Vet Supplies', subtitle: 'Bula Iftin • New Applicant', motif: 'supplier' },
];

export function ensureSeedAssets(uploadsDir: string): void {
  const seedDir = path.join(uploadsDir, 'seed');
  fs.mkdirSync(seedDir, { recursive: true });

  for (const spec of SEED_ASSETS) {
    const filePath = path.join(seedDir, spec.filename);
    if (fs.existsSync(filePath)) continue;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${spec.bgStart}"/>
      <stop offset="100%" stop-color="${spec.bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="440" fill="url(#bg)"/>
  <circle cx="560" cy="70" r="90" fill="#ffffff" opacity="0.35"/>
  <circle cx="70" cy="390" r="110" fill="#ffffff" opacity="0.3"/>
  <rect x="28" y="24" width="168" height="30" rx="15" fill="#064e3b"/>
  <text x="112" y="44" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" letter-spacing="0.8">${spec.badge}</text>
  ${renderMotif(spec.motif, spec.accent)}
  <rect x="28" y="330" width="584" height="84" rx="16" fill="#ffffff" fill-opacity="0.92"/>
  <text x="48" y="366" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${spec.title}</text>
  <text x="48" y="394" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="500">${spec.subtitle} • Suuqly Garissa</text>
</svg>`;
    fs.writeFileSync(filePath, svg, 'utf-8');
  }
}
