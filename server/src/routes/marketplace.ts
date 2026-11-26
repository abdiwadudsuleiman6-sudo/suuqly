import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/products', async (req, res) => {
  const db = await getDb();
  const {
    q = '',
    category = '',
    neighborhood = '',
    supplierId = '',
    verifiedOnly = '',
    minPrice = '',
    maxPrice = '',
    sort = 'featured',
  } = req.query as Record<string, string>;

  const supplierMap = new Map(db.data.suppliers.map((s) => [s.id, s]));
  const query = q.trim().toLowerCase();

  let list = db.data.products.filter((p) => {
    if (p.status !== 'active') return false;
    const sup = supplierMap.get(p.supplierId);
    if (!sup || !sup.isOpen) {
      // If seller closed storefront temporarily, keep visible when filtering by supplierId or show status
      if (!supplierId && sup && !sup.isOpen) return false;
    }
    if (category && p.category !== category) return false;
    if (supplierId && p.supplierId !== supplierId) return false;
    if (neighborhood && sup?.neighborhood !== neighborhood) return false;
    if (verifiedOnly === 'true' && !sup?.verified) return false;
    if (minPrice && p.unitPriceKes < Number(minPrice)) return false;
    if (maxPrice && p.unitPriceKes > Number(maxPrice)) return false;
    if (query) {
      const hay = `${p.title} ${p.description} ${p.category} ${sup?.name || ''} ${sup?.neighborhood || ''}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  if (sort === 'price-asc') list.sort((a, b) => a.unitPriceKes - b.unitPriceKes);
  else if (sort === 'price-desc') list.sort((a, b) => b.unitPriceKes - a.unitPriceKes);
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (sort === 'sold') list.sort((a, b) => b.soldCount - a.soldCount);
  else list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.soldCount - a.soldCount);

  const enriched = list.map((p) => {
    const sup = supplierMap.get(p.supplierId);
    return {
      ...p,
      supplier: sup
        ? {
            id: sup.id,
            name: sup.name,
            verified: sup.verified,
            neighborhood: sup.neighborhood,
            yearsInBusiness: sup.yearsInBusiness,
            responseRate: sup.responseRate,
            rating: sup.rating,
            isOpen: sup.isOpen,
          }
        : null,
    };
  });

  res.json({ products: enriched, total: enriched.length });
});

router.get('/products/:id', async (req, res) => {
  const db = await getDb();
  const product = db.data.products.find(
    (p) => p.id === req.params.id || p.slug === req.params.id
  );
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const supplier = db.data.suppliers.find((s) => s.id === product.supplierId) || null;
  const reviews = db.data.reviews
    .filter((r) => r.productId === product.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ product, supplier, reviews });
});

router.post('/products/:id/reviews', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const product = db.data.products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const user = db.data.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { rating, comment } = req.body as { rating?: number; comment?: string };
  const numericRating = Math.min(5, Math.max(1, Number(rating || 5)));
  if (!comment || !comment.trim()) {
    res.status(400).json({ error: 'Review comment is required.' });
    return;
  }

  const review = {
    id: `rev-${uuidv4().slice(0, 8)}`,
    productId: product.id,
    userId: user.id,
    userName: user.name,
    rating: numericRating,
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  db.data.reviews.unshift(review);

  const productReviews = db.data.reviews.filter((r) => r.productId === product.id);
  product.reviewCount = productReviews.length;
  product.rating = Number(
    (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
  );

  const supplier = db.data.suppliers.find((s) => s.id === product.supplierId);
  if (supplier) {
    supplier.reviewCount += 1;
  }

  await db.write();
  res.status(201).json({ review, product });
});

router.get('/suppliers', async (req, res) => {
  const db = await getDb();
  const { q = '', category = '', neighborhood = '', verifiedOnly = '' } = req.query as Record<
    string,
    string
  >;
  const query = q.trim().toLowerCase();

  const suppliers = db.data.suppliers
    .filter((s) => {
      if (s.verificationStatus === 'rejected') return false;
      if (category && s.category !== category) return false;
      if (neighborhood && s.neighborhood !== neighborhood) return false;
      if (verifiedOnly === 'true' && !s.verified) return false;
      if (query) {
        const hay = `${s.name} ${s.tagline} ${s.neighborhood} ${s.category}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .map((s) => ({
      ...s,
      productCount: db.data.products.filter((p) => p.supplierId === s.id && p.status === 'active').length,
    }));

  res.json({ suppliers });
});

router.get('/suppliers/:id', async (req, res) => {
  const db = await getDb();
  const supplier = db.data.suppliers.find(
    (s) => s.id === req.params.id || s.slug === req.params.id
  );
  if (!supplier) {
    res.status(404).json({ error: 'Supplier not found' });
    return;
  }
  const products = db.data.products.filter(
    (p) => p.supplierId === supplier.id && p.status === 'active'
  );
  res.json({ supplier, products });
});

export default router;
