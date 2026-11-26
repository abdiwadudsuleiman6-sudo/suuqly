import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, UPLOADS_DIR } from './db/database.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import marketplaceRoutes from './routes/marketplace.js';
import mpesaRoutes from './routes/mpesa.js';
import orderRoutes from './routes/orders.js';
import rfqRoutes from './routes/rfqs.js';
import sellerRoutes from './routes/seller.js';
import uploadRoutes from './routes/upload.js';
import { getMpesaModeInfo } from './services/mpesa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env and/or root .env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173'] : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Suuqly API',
    currency: 'KES',
    mpesa: getMpesaModeInfo(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', marketplaceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
);

async function start() {
  await getDb();
  app.listen(PORT, () => {
    const mpesa = getMpesaModeInfo();
    console.log(`[Suuqly Server] Running on http://localhost:${PORT}`);
    console.log(`[Suuqly M-Pesa] Mode: ${mpesa.mode} (Shortcode: ${mpesa.shortcode})`);
  });
}

start().catch((err) => {
  console.error('Failed to start Suuqly server:', err);
  process.exit(1);
});
