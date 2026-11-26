import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { authenticate, AuthRequest, signToken } from '../middleware/auth.js';
import { CategorySlug, GarissaZone, Supplier, User } from '../types.js';
import { slugify } from '../utils/pricing.js';

const router = Router();

function sanitizeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = 'customer',
      businessName,
      neighborhood = 'Garissa Town',
      category = 'groceries-wholesale',
      address = '',
    } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: 'customer' | 'seller';
      businessName?: string;
      neighborhood?: GarissaZone;
      category?: CategorySlug;
      address?: string;
    };

    if (!name || !email || !password || !phone) {
      res.status(400).json({ error: 'Name, email, phone, and password are required.' });
      return;
    }

    const db = await getDb();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.data.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const userId = `usr-${uuidv4().slice(0, 8)}`;
    const userRole = role === 'seller' ? 'seller' : 'customer';
    let businessId: string | undefined;
    let createdSupplier: Supplier | undefined;

    if (userRole === 'seller') {
      if (!businessName || !businessName.trim()) {
        res.status(400).json({ error: 'Business name is required for supplier registration.' });
        return;
      }
      businessId = `sup-${uuidv4().slice(0, 8)}`;
      createdSupplier = {
        id: businessId,
        ownerId: userId,
        name: businessName.trim(),
        slug: `${slugify(businessName)}-${businessId.slice(-4)}`,
        tagline: `Trusted ${neighborhood} supplier on Suuqly`,
        description: `${businessName.trim()} serving retail and wholesale buyers across ${neighborhood} and Garissa County.`,
        category,
        neighborhood,
        address: address || `${neighborhood}, Garissa County`,
        phone: phone.trim(),
        email: normalizedEmail,
        openingHours: 'Mon–Sat 8:00 AM – 6:30 PM',
        isOpen: true,
        verified: false,
        verificationStatus: 'pending',
        rating: 5.0,
        reviewCount: 0,
        yearsInBusiness: 1,
        responseRate: 100,
        logoUrl: '/uploads/seed/supplier-modogashe-agro.svg',
        bannerUrl: '/uploads/seed/solar-panel-450w.svg',
        createdAt: now,
      };
      db.data.suppliers.push(createdSupplier);
    }

    const user: User = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash: bcrypt.hashSync(password, 10),
      role: userRole,
      businessId,
      wishlist: [],
      addresses: [
        {
          id: `addr-${uuidv4().slice(0, 6)}`,
          label: 'Primary Garissa Address',
          zone: neighborhood,
          streetDetails: address || `${neighborhood} Main Stage`,
          phone: phone.trim(),
          isDefault: true,
        },
      ],
      active: true,
      createdAt: now,
    };

    db.data.users.push(user);
    await db.write();

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });

    res.status(201).json({
      token,
      user: sanitizeUser(user),
      supplier: createdSupplier || null,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = await getDb();
    const user = db.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!user.active) {
      res.status(403).json({ error: 'Account suspended. Contact Suuqly Garissa support.' });
      return;
    }

    const supplier = user.businessId
      ? db.data.suppliers.find((s) => s.id === user.businessId) || null
      : null;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });

    res.json({
      token,
      user: sanitizeUser(user),
      supplier,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body as {
      email?: string;
      phone?: string;
      newPassword?: string;
    };
    if (!email || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Email and a new password (min 6 chars) are required.' });
      return;
    }
    const db = await getDb();
    const user = db.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      res.status(404).json({ error: 'No account found with that email.' });
      return;
    }
    if (phone && phone.replace(/\D/g, '').slice(-9) !== user.phone.replace(/\D/g, '').slice(-9)) {
      res.status(400).json({ error: 'Phone number does not match our records for this account.' });
      return;
    }
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.write();
    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const supplier = user.businessId
    ? db.data.suppliers.find((s) => s.id === user.businessId) || null
    : null;
  res.json({ user: sanitizeUser(user), supplier });
});

router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { name, phone, addresses } = req.body;
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof phone === 'string' && phone.trim()) user.phone = phone.trim();
  if (Array.isArray(addresses)) user.addresses = addresses;
  await db.write();
  res.json({ user: sanitizeUser(user) });
});

router.post('/wishlist/:productId', authenticate, async (req: AuthRequest, res) => {
  const db = await getDb();
  const user = db.data.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const productId = String(req.params.productId);
  const exists = user.wishlist.includes(productId);
  user.wishlist = exists
    ? user.wishlist.filter((id) => id !== productId)
    : [...user.wishlist, productId];
  await db.write();
  res.json({ wishlist: user.wishlist, added: !exists });
});

export default router;
