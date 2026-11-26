import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { GarissaZone, Order, RFQ } from '../types.js';
import { getDeliveryFeeForZone } from '../utils/pricing.js';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const buyer = db.data.users.find((u) => u.id === req.user!.userId);
  if (!buyer) {
    res.status(404).json({ error: 'Buyer not found' });
    return;
  }

  const {
    productId,
    productTitle,
    supplierId,
    quantity,
    unit = 'pcs',
    targetPriceKes,
    deliveryZone = 'Garissa Town',
    notes = '',
  } = req.body as {
    productId?: string;
    productTitle?: string;
    supplierId?: string;
    quantity?: number;
    unit?: string;
    targetPriceKes?: number;
    deliveryZone?: GarissaZone;
    notes?: string;
  };

  if (!quantity || Number(quantity) < 1) {
    res.status(400).json({ error: 'Please specify a valid quantity.' });
    return;
  }

  const product = productId ? db.data.products.find((p) => p.id === productId) : undefined;
  const resolvedSupplierId = supplierId || product?.supplierId;
  const supplier = resolvedSupplierId
    ? db.data.suppliers.find((s) => s.id === resolvedSupplierId)
    : undefined;

  const title = product?.title || productTitle?.trim();
  if (!title) {
    res.status(400).json({ error: 'Product or service title is required.' });
    return;
  }

  const now = new Date().toISOString();
  const rfq: RFQ = {
    id: `rfq-${uuidv4().slice(0, 8)}`,
    rfqNumber: `RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    productId: product?.id,
    productTitle: title,
    supplierId: supplier?.id,
    supplierName: supplier?.name || 'Open Garissa Marketplace',
    buyerId: buyer.id,
    buyerName: buyer.name,
    buyerPhone: buyer.phone,
    buyerEmail: buyer.email,
    quantity: Math.floor(Number(quantity)),
    unit: product?.unit || unit,
    targetPriceKes: targetPriceKes ? Number(targetPriceKes) : undefined,
    deliveryZone,
    notes: notes.trim(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  db.data.rfqs.unshift(rfq);
  await db.write();
  res.status(201).json({ rfq });
});

router.get('/my', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const rfqs = db.data.rfqs
    .filter((r) => r.buyerId === req.user!.userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ rfqs });
});

router.post('/:id/accept', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const rfq = db.data.rfqs.find(
    (r) => r.id === req.params.id && r.buyerId === req.user!.userId
  );
  if (!rfq) {
    res.status(404).json({ error: 'Quote request not found.' });
    return;
  }
  if (rfq.status !== 'quoted' || !rfq.supplierQuote || !rfq.supplierId) {
    res.status(400).json({ error: 'This RFQ does not have an active supplier quote yet.' });
    return;
  }

  const now = new Date().toISOString();
  rfq.status = 'accepted';
  rfq.updatedAt = now;

  const product = rfq.productId
    ? db.data.products.find((p) => p.id === rfq.productId)
    : undefined;
  const deliveryFee =
    rfq.supplierQuote.deliveryFeeKes ?? getDeliveryFeeForZone(rfq.deliveryZone);
  const subtotal = rfq.supplierQuote.offeredUnitPriceKes * rfq.quantity;

  const order: Order = {
    id: `ord-${uuidv4().slice(0, 8)}`,
    orderNumber: `SUQ-${Math.floor(100000 + Math.random() * 900000)}`,
    checkoutGroupId: `RFQ-${rfq.rfqNumber}`,
    buyerId: rfq.buyerId,
    buyerName: rfq.buyerName,
    buyerPhone: rfq.buyerPhone,
    supplierId: rfq.supplierId,
    supplierName: rfq.supplierName || 'Suuqly Supplier',
    items: [
      {
        productId: rfq.productId || 'custom-rfq',
        title: `${rfq.productTitle} (Accepted RFQ ${rfq.rfqNumber})`,
        image: product?.images[0] || '/uploads/seed/solar-panel-450w.svg',
        unit: rfq.unit,
        quantity: rfq.quantity,
        unitPriceKes: rfq.supplierQuote.offeredUnitPriceKes,
        lineTotalKes: subtotal,
      },
    ],
    subtotalKes: subtotal,
    deliveryFeeKes: deliveryFee,
    totalKes: subtotal + deliveryFee,
    deliveryZone: rfq.deliveryZone,
    deliveryAddress: `${rfq.deliveryZone} (Confirmed via ${rfq.rfqNumber})`,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'Confirmed',
    timeline: [
      {
        status: 'Pending',
        timestamp: now,
        note: `Converted from accepted ${rfq.rfqNumber}`,
      },
      {
        status: 'Confirmed',
        timestamp: now,
        note: `Agreed unit price: KES ${rfq.supplierQuote.offeredUnitPriceKes.toLocaleString()}`,
      },
    ],
    createdAt: now,
  };

  db.data.orders.unshift(order);
  await db.write();
  res.json({ rfq, order });
});

export default router;
