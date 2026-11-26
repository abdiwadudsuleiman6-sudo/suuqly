export type UserRole = 'customer' | 'seller' | 'admin';

export type GarissaZone =
  | 'Garissa Town'
  | 'Bula Iftin'
  | 'Garissa Ndogo'
  | 'Sankuri'
  | 'Medina';

export type CategorySlug =
  | 'livestock-camel-milk'
  | 'electronics-solar'
  | 'textiles-diracs'
  | 'building-hardware'
  | 'groceries-wholesale'
  | 'local-services-transport';

export interface Address {
  id: string;
  label: string;
  zone: GarissaZone;
  streetDetails: string;
  phone: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId?: string;
  wishlist: string[];
  addresses: Address[];
  active: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: CategorySlug;
  neighborhood: GarissaZone;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  isOpen: boolean;
  verified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rating: number;
  reviewCount: number;
  yearsInBusiness: number;
  responseRate: number;
  logoUrl: string;
  bannerUrl: string;
  productCount?: number;
  createdAt: string;
}

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  priceKes: number;
}

export interface Product {
  id: string;
  supplierId: string;
  title: string;
  slug: string;
  description: string;
  category: CategorySlug;
  unit: string;
  unitPriceKes: number;
  priceTiers: PriceTier[];
  moq: number;
  stock: number;
  images: string[];
  featured: boolean;
  tradeAssurance: boolean;
  status: 'active' | 'flagged' | 'archived';
  rating: number;
  reviewCount: number;
  soldCount: number;
  specs: Record<string, string>;
  createdAt: string;
  supplierName?: string;
  supplier?: {
    id: string;
    name: string;
    verified: boolean;
    neighborhood: GarissaZone;
    yearsInBusiness: number;
    responseRate: number;
    rating: number;
    isOpen: boolean;
  } | null;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  productId?: string;
  productTitle: string;
  supplierId?: string;
  supplierName?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  quantity: number;
  unit: string;
  targetPriceKes?: number;
  deliveryZone: GarissaZone;
  notes: string;
  status: 'pending' | 'quoted' | 'accepted' | 'declined';
  supplierQuote?: {
    offeredUnitPriceKes: number;
    totalPriceKes: number;
    deliveryFeeKes: number;
    leadTime: string;
    message: string;
    quotedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  title: string;
  image: string;
  unit: string;
  quantity: number;
  unitPriceKes: number;
  lineTotalKes: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  checkoutGroupId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  subtotalKes: number;
  deliveryFeeKes: number;
  totalKes: number;
  deliveryZone: GarissaZone;
  deliveryAddress: string;
  paymentMethod: 'mpesa' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  mpesaReceipt?: string;
  mpesaCheckoutRequestId?: string;
  status: OrderStatus;
  timeline: { status: OrderStatus; timestamp: string; note: string }[];
  createdAt: string;
}

export interface MpesaTransaction {
  checkoutRequestId: string;
  merchantRequestId: string;
  orderIds: string[];
  phone: string;
  amountKes: number;
  status: 'pending' | 'completed' | 'failed';
  mpesaReceiptNumber?: string;
  resultDesc?: string;
  mode: 'sandbox-demo' | 'daraja-live';
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  orderId?: string;
  supplierId?: string;
  subject: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}
