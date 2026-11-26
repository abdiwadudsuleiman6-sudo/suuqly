import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// Customer & seller complaint submission endpoint
router.post('/complaints', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { subject, description, orderId, supplierId } = req.body as {
    subject?: string;
    description?: string;
    orderId?: string;
    supplierId?: string;
  };
  if (!subject || !description) {
    res.status(400).json({ error: 'Subject and description are required.' });
    return;
  }
  const complaint = {
    id: `cmp-${uuidv4().slice(0, 8)}`,
    userId: user.id,
    userName: user.name,
    orderId,
    supplierId,
    subject: subject.trim(),
    description: description.trim(),
    status: 'open' as const,
    createdAt: new Date().toISOString(),
  };
  db.data.complaints.unshift(complaint);
  await db.write();
  res.status(201).json({ complaint });
});

router.get('/complaints/my', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const complaints = db.data.complaints.filter((c) => c.userId === req.user!.userId);
  res.json({ complaints });
});

// Admin-only routes
router.get('/admin/overview', authenticate, requireRole('admin'), async (_req, res) => {
  const db = await getDb();
  const totalGmvKes = db.data.orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalKes, 0);
  const paidGmvKes = db.data.orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalKes, 0);

  res.json({
    kpis: {
      totalUsers: db.data.users.length,
      totalSuppliers: db.data.suppliers.length,
      verifiedSuppliers: db.data.suppliers.filter((s) => s.verified).length,
      pendingSuppliers: db.data.suppliers.filter((s) => s.verificationStatus === 'pending').length,
      totalProducts: db.data.products.length,
      totalOrders: db.data.orders.length,
      totalRfqs: db.data.rfqs.length,
      totalGmvKes,
      paidGmvKes,
      openComplaints: db.data.complaints.filter((c) => c.status !== 'resolved').length,
    },
  });
});

router.get('/admin/suppliers', authenticate, requireRole('admin'), async (_req, res) => {
  const db = await getDb();
  const suppliers = db.data.suppliers.map((s) => ({
    ...s,
    productCount: db.data.products.filter((p) => p.supplierId === s.id).length,
  }));
  res.json({ suppliers });
});

router.patch('/admin/suppliers/:id/verify', authenticate, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const supplier = db.data.suppliers.find((s) => s.id === req.params.id);
  if (!supplier) {
    res.status(404).json({ error: 'Supplier not found' });
    return;
  }
  const { verified, verificationStatus } = req.body as {
    verified?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  };
  if (typeof verified === 'boolean') supplier.verified = verified;
  if (verificationStatus) {
    supplier.verificationStatus = verificationStatus;
    supplier.verified = verificationStatus === 'verified';
  }
  await db.write();
  res.json({ supplier });
});

router.get('/admin/users', authenticate, requireRole('admin'), async (_req, res) => {
  const db = await getDb();
  const users = db.data.users.map(({ passwordHash: _, ...safe }) => safe);
  res.json({ users });
});

router.patch('/admin/users/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.role === 'admin') {
    res.status(400).json({ error: 'Cannot suspend an admin account.' });
    return;
  }
  user.active = Boolean(req.body?.active);
  await db.write();
  const { passwordHash: _, ...safe } = user;
  res.json({ user: safe });
});

router.get('/admin/products', authenticate, requireRole('admin'), async (_req, res) => {
  const db = await getDb();
  const supMap = new Map(db.data.suppliers.map((s) => [s.id, s.name]));
  const products = db.data.products.map((p) => ({
    ...p,
    supplierName: supMap.get(p.supplierId) || 'Unknown',
  }));
  res.json({ products });
});

router.patch('/admin/products/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const product = db.data.products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const status = req.body?.status;
  if (status !== 'active' && status !== 'flagged' && status !== 'archived') {
    res.status(400).json({ error: 'Invalid product status' });
    return;
  }
  product.status = status;
  await db.write();
  res.json({ product });
});

router.get('/admin/orders', authenticate, requireRole('admin'), async (_req, res) => {
  const db = await getDb();
  const orders = [...db.data.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders });
});

router.get('/admin/complaints', authenticate, requireRole('admin'), async (_req, res) => {
  const db = await getDb();
  res.json({ complaints: db.data.complaints });
});

router.patch('/admin/complaints/:id', authenticate, requireRole('admin'), async (req, res) => {
  const db = await getDb();
  const complaint = db.data.complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }
  const { status, resolutionNote } = req.body as {
    status?: 'open' | 'investigating' | 'resolved';
    resolutionNote?: string;
  };
  if (status) complaint.status = status;
  if (typeof resolutionNote === 'string') complaint.resolutionNote = resolutionNote.trim();
  if (status === 'resolved') complaint.resolvedAt = new Date().toISOString();
  await db.write();
  res.json({ complaint });
});

export default router;
