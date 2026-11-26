import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { CategorySlug, GarissaZone, OrderStatus, PriceTier, Product } from '../types.js';
import { slugify } from '../utils/pricing.js';

const router = Router();

router.use(authenticate, requireRole('seller', 'admin'));

function getOwnedBusinessId(req: AuthRequest): string | null {
  if (req.user?.businessId) return req.user.businessId;
  return null;
}

router.get('/dashboard', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  if (!businessId) {
    res.status(400).json({ error: 'No business storefront linked to this account.' });
    return;
  }

  const supplier = db.data.suppliers.find((s) => s.id === businessId);
  if (!supplier) {
    res.status(404).json({ error: 'Supplier storefront not found.' });
    return;
  }

  const products = db.data.products.filter((p) => p.supplierId === businessId);
  const orders = db.data.orders.filter((o) => o.supplierId === businessId);
  const rfqs = db.data.rfqs.filter(
    (r) => r.supplierId === businessId || (!r.supplierId && r.status === 'pending')
  );

  const totalRevenueKes = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalKes, 0);
  const paidRevenueKes = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalKes, 0);

  res.json({
    supplier,
    kpis: {
      totalRevenueKes,
      paidRevenueKes,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed').length,
      activeProducts: products.filter((p) => p.status === 'active').length,
      pendingRfqs: rfqs.filter((r) => r.status === 'pending').length,
    },
  });
});

router.put('/profile', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const supplier = db.data.suppliers.find((s) => s.id === businessId);
  if (!supplier) {
    res.status(404).json({ error: 'Supplier storefront not found.' });
    return;
  }

  const { name, tagline, description, neighborhood, address, phone, openingHours, isOpen, logoUrl } =
    req.body as {
      name?: string;
      tagline?: string;
      description?: string;
      neighborhood?: GarissaZone;
      address?: string;
      phone?: string;
      openingHours?: string;
      isOpen?: boolean;
      logoUrl?: string;
    };

  if (typeof name === 'string' && name.trim()) supplier.name = name.trim();
  if (typeof tagline === 'string') supplier.tagline = tagline.trim();
  if (typeof description === 'string') supplier.description = description.trim();
  if (neighborhood) supplier.neighborhood = neighborhood;
  if (typeof address === 'string') supplier.address = address.trim();
  if (typeof phone === 'string') supplier.phone = phone.trim();
  if (typeof openingHours === 'string') supplier.openingHours = openingHours.trim();
  if (typeof isOpen === 'boolean') supplier.isOpen = isOpen;
  if (typeof logoUrl === 'string' && logoUrl.trim()) supplier.logoUrl = logoUrl.trim();

  await db.write();
  res.json({ supplier });
});

router.get('/products', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const products = db.data.products.filter((p) => p.supplierId === businessId);
  res.json({ products });
});

router.post('/products', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  if (!businessId) {
    res.status(400).json({ error: 'No supplier storefront linked.' });
    return;
  }

  const {
    title,
    description,
    category,
    unit = 'pcs',
    unitPriceKes,
    priceTiers = [],
    moq = 1,
    stock = 10,
    images = [],
    specs = {},
  } = req.body as {
    title?: string;
    description?: string;
    category?: CategorySlug;
    unit?: string;
    unitPriceKes?: number;
    priceTiers?: PriceTier[];
    moq?: number;
    stock?: number;
    images?: string[];
    specs?: Record<string, string>;
  };

  if (!title || !category || !unitPriceKes) {
    res.status(400).json({ error: 'Title, category, and KES unit price are required.' });
    return;
  }

  const now = new Date().toISOString();
  const id = `prod-${uuidv4().slice(0, 8)}`;
  const cleanedTiers =
    Array.isArray(priceTiers) && priceTiers.length > 0
      ? priceTiers
      : [{ minQty: Math.max(1, Number(moq)), maxQty: null, priceKes: Number(unitPriceKes) }];

  const product: Product = {
    id,
    supplierId: businessId,
    title: title.trim(),
    slug: `${slugify(title)}-${id.slice(-4)}`,
    description: (description || '').trim() || `${title.trim()} supplied directly in Garissa.`,
    category,
    unit: unit.trim(),
    unitPriceKes: Number(unitPriceKes),
    priceTiers: cleanedTiers,
    moq: Math.max(1, Number(moq)),
    stock: Math.max(0, Number(stock)),
    images:
      Array.isArray(images) && images.length > 0
        ? images
        : ['/uploads/seed/solar-panel-450w.svg'],
    featured: false,
    tradeAssurance: true,
    status: 'active',
    rating: 5.0,
    reviewCount: 0,
    soldCount: 0,
    specs,
    createdAt: now,
  };

  db.data.products.unshift(product);
  await db.write();
  res.status(201).json({ product });
});

router.put('/products/:id', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const product = db.data.products.find(
    (p) => p.id === req.params.id && p.supplierId === businessId
  );
  if (!product) {
    res.status(404).json({ error: 'Product not found in your catalog.' });
    return;
  }

  const { title, description, category, unit, unitPriceKes, priceTiers, moq, stock, images, specs, status } =
    req.body;

  if (typeof title === 'string' && title.trim()) product.title = title.trim();
  if (typeof description === 'string') product.description = description.trim();
  if (category) product.category = category;
  if (typeof unit === 'string' && unit.trim()) product.unit = unit.trim();
  if (unitPriceKes !== undefined) product.unitPriceKes = Number(unitPriceKes);
  if (Array.isArray(priceTiers) && priceTiers.length > 0) product.priceTiers = priceTiers;
  if (moq !== undefined) product.moq = Math.max(1, Number(moq));
  if (stock !== undefined) product.stock = Math.max(0, Number(stock));
  if (Array.isArray(images) && images.length > 0) product.images = images;
  if (specs && typeof specs === 'object') product.specs = specs;
  if (status === 'active' || status === 'archived') product.status = status;

  await db.write();
  res.json({ product });
});

router.delete('/products/:id', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const idx = db.data.products.findIndex(
    (p) => p.id === req.params.id && p.supplierId === businessId
  );
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found in your catalog.' });
    return;
  }
  db.data.products.splice(idx, 1);
  await db.write();
  res.json({ deleted: true });
});

router.get('/orders', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const orders = db.data.orders
    .filter((o) => o.supplierId === businessId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders });
});

router.patch('/orders/:id/status', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const order = db.data.orders.find(
    (o) => o.id === req.params.id && o.supplierId === businessId
  );
  if (!order) {
    res.status(404).json({ error: 'Order not found for your business.' });
    return;
  }
  const { status, note } = req.body as { status?: OrderStatus; note?: string };
  const validStatuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Dispatched',
    'Delivered',
    'Cancelled',
  ];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid order status.' });
    return;
  }
  const now = new Date().toISOString();
  order.status = status;
  if (status === 'Delivered' && order.paymentMethod === 'cod') {
    order.paymentStatus = 'paid';
  }
  order.timeline.push({
    status,
    timestamp: now,
    note: note?.trim() || `Order marked as ${status} by ${order.supplierName}`,
  });

  await db.write();
  res.json({ order });
});

router.get('/rfqs', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const rfqs = db.data.rfqs
    .filter((r) => r.supplierId === businessId || !r.supplierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ rfqs });
});

router.post('/rfqs/:id/quote', async (req: AuthRequest, res) => {
  const db = await getDb();
  const businessId = getOwnedBusinessId(req);
  const supplier = db.data.suppliers.find((s) => s.id === businessId);
  const rfq = db.data.rfqs.find(
    (r) => r.id === req.params.id && (r.supplierId === businessId || !r.supplierId)
  );
  if (!rfq || !supplier) {
    res.status(404).json({ error: 'RFQ not found.' });
    return;
  }

  const { offeredUnitPriceKes, deliveryFeeKes = 0, leadTime, message } = req.body as {
    offeredUnitPriceKes?: number;
    deliveryFeeKes?: number;
    leadTime?: string;
    message?: string;
  };

  if (!offeredUnitPriceKes || Number(offeredUnitPriceKes) <= 0) {
    res.status(400).json({ error: 'Valid KES unit quote price is required.' });
    return;
  }

  const now = new Date().toISOString();
  const unitPrice = Number(offeredUnitPriceKes);
  const delivery = Math.max(0, Number(deliveryFeeKes));

  rfq.supplierId = supplier.id;
  rfq.supplierName = supplier.name;
  rfq.status = 'quoted';
  rfq.updatedAt = now;
  rfq.supplierQuote = {
    offeredUnitPriceKes: unitPrice,
    deliveryFeeKes: delivery,
    totalPriceKes: unitPrice * rfq.quantity + delivery,
    leadTime: leadTime?.trim() || 'Same-day / Next-day Garissa dispatch',
    message: message?.trim() || `Official quote from ${supplier.name}`,
    quotedAt: now,
  };

  await db.write();
  res.json({ rfq });
});

export default router;
