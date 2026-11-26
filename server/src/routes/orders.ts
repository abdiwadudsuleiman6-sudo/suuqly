import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { initiateStkPush } from '../services/mpesa.js';
import { GarissaZone, Order, OrderItem, PaymentMethod } from '../types.js';
import { getDeliveryFeeForZone, getEffectiveUnitPrice } from '../utils/pricing.js';

const router = Router();

router.post('/checkout', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, deliveryZone, deliveryAddress, buyerPhone, paymentMethod } = req.body as {
      items?: { productId: string; quantity: number }[];
      deliveryZone?: GarissaZone;
      deliveryAddress?: string;
      buyerPhone?: string;
      paymentMethod?: PaymentMethod;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' });
      return;
    }
    if (!deliveryZone || !deliveryAddress) {
      res.status(400).json({ error: 'Garissa delivery zone and address details are required.' });
      return;
    }

    const db = await getDb();
    const buyer = db.data.users.find((u) => u.id === req.user!.userId);
    if (!buyer) {
      res.status(404).json({ error: 'Buyer account not found.' });
      return;
    }

    const groupedBySupplier = new Map<
      string,
      { supplierName: string; orderItems: OrderItem[]; subtotalKes: number }
    >();

    for (const cartItem of items) {
      const product = db.data.products.find(
        (p) => p.id === cartItem.productId && p.status === 'active'
      );
      if (!product) {
        res.status(400).json({ error: `Product ${cartItem.productId} is unavailable.` });
        return;
      }
      const qty = Math.floor(Number(cartItem.quantity));
      if (!qty || qty < product.moq) {
        res.status(400).json({
          error: `"${product.title}" requires a minimum order (MOQ) of ${product.moq} ${product.unit}.`,
        });
        return;
      }
      if (qty > product.stock) {
        res.status(400).json({
          error: `Only ${product.stock} ${product.unit} remaining for "${product.title}".`,
        });
        return;
      }

      const supplier = db.data.suppliers.find((s) => s.id === product.supplierId);
      if (!supplier) {
        res.status(400).json({ error: `Supplier missing for "${product.title}".` });
        return;
      }

      const effectiveUnitPrice = getEffectiveUnitPrice(
        product.unitPriceKes,
        product.priceTiers,
        qty
      );
      const lineTotal = effectiveUnitPrice * qty;

      const existingGroup = groupedBySupplier.get(supplier.id) || {
        supplierName: supplier.name,
        orderItems: [],
        subtotalKes: 0,
      };
      existingGroup.orderItems.push({
        productId: product.id,
        title: product.title,
        image: product.images[0] || '/uploads/seed/solar-panel-450w.svg',
        unit: product.unit,
        quantity: qty,
        unitPriceKes: effectiveUnitPrice,
        lineTotalKes: lineTotal,
      });
      existingGroup.subtotalKes += lineTotal;
      groupedBySupplier.set(supplier.id, existingGroup);
    }

    // Deduct stock atomically after full validation
    for (const cartItem of items) {
      const product = db.data.products.find((p) => p.id === cartItem.productId)!;
      product.stock -= Math.floor(Number(cartItem.quantity));
      product.soldCount += Math.floor(Number(cartItem.quantity));
    }

    const now = new Date().toISOString();
    const checkoutGroupId = `GRP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const deliveryFeePerSupplier = getDeliveryFeeForZone(deliveryZone);
    const chosenMethod: PaymentMethod = paymentMethod === 'cod' ? 'cod' : 'mpesa';
    const phoneToUse = (buyerPhone || buyer.phone).trim();

    const createdOrders: Order[] = [];
    for (const [supplierId, group] of groupedBySupplier.entries()) {
      const order: Order = {
        id: `ord-${uuidv4().slice(0, 8)}`,
        orderNumber: `SUQ-${Math.floor(100000 + Math.random() * 900000)}`,
        checkoutGroupId,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerPhone: phoneToUse,
        supplierId,
        supplierName: group.supplierName,
        items: group.orderItems,
        subtotalKes: group.subtotalKes,
        deliveryFeeKes: deliveryFeePerSupplier,
        totalKes: group.subtotalKes + deliveryFeePerSupplier,
        deliveryZone,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: chosenMethod,
        paymentStatus: 'pending',
        status: 'Pending',
        timeline: [
          {
            status: 'Pending',
            timestamp: now,
            note:
              chosenMethod === 'mpesa'
                ? 'Order created — awaiting M-Pesa Daraja Escrow STK confirmation'
                : 'Order created — Cash on Delivery selected',
          },
        ],
        createdAt: now,
      };
      db.data.orders.unshift(order);
      createdOrders.push(order);
    }

    await db.write();

    const grandTotalKes = createdOrders.reduce((sum, o) => sum + o.totalKes, 0);

    let mpesaTransaction = null;
    if (chosenMethod === 'mpesa') {
      mpesaTransaction = await initiateStkPush({
        phone: phoneToUse,
        amountKes: grandTotalKes,
        orderIds: createdOrders.map((o) => o.id),
        accountReference: createdOrders[0].orderNumber,
        transactionDesc: 'Suuqly Escrow',
      });
    }

    res.status(201).json({
      checkoutGroupId,
      orders: createdOrders,
      totalKes: grandTotalKes,
      mpesaTransaction,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Checkout failed' });
  }
});

router.get('/my', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const orders = db.data.orders
    .filter((o) => o.buyerId === req.user!.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders });
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const order = db.data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const canAccess =
    req.user!.role === 'admin' ||
    order.buyerId === req.user!.userId ||
    (req.user!.businessId && order.supplierId === req.user!.businessId);
  if (!canAccess) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  res.json({ order });
});

router.post('/:id/retry-mpesa', authenticate, async (req: AuthRequest, res) => {
  try {
    const db = await getDb();
    const order = db.data.orders.find(
      (o) => o.id === req.params.id && o.buyerId === req.user!.userId
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.paymentStatus === 'paid') {
      res.status(400).json({ error: 'Order is already paid.' });
      return;
    }
    const phone = (req.body?.phone as string) || order.buyerPhone;
    const tx = await initiateStkPush({
      phone,
      amountKes: order.totalKes,
      orderIds: [order.id],
      accountReference: order.orderNumber,
      transactionDesc: 'Suuqly Retry',
    });
    res.json({ mpesaTransaction: tx });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Retry failed' });
  }
});

export default router;
