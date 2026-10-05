import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/db.js';
import authRoutes from './routes/auth.js';
import nailWorksRoutes from './routes/nailWorks.js';
import registrationsRoutes from './routes/registrations.js';
import servicesRoutes from './routes/services.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Request logger
app.use((req, res, next) => {
  if (!req.url.startsWith('/uploads') && !req.url.startsWith('/css') && !req.url.startsWith('/js')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check and Neon DB status
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'OK',
    message: 'Beauty Abyssi Nail API is live',
    database: dbStatus.success ? 'Connected to Neon DB' : 'Disconnected',
    details: dbStatus,
  });
});

// Customer Maintenance Middleware
const checkMaintenance = (req, res, next) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  if (isMaintenance && req.method === 'POST') {
    return res.status(503).json({
      success: false,
      maintenance: true,
      message: "We're cooking something special! Online registrations are temporarily paused. Direct bookings are available via phone or Telegram.",
      direct_contact: {
        phone: '+251 95 664 5851',
        telegram: '@Bonkersss'
      }
    });
  }
  next();
};

// Maintenance status endpoint
app.get('/api/maintenance', (req, res) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  res.json({
    success: true,
    maintenance: isMaintenance,
    message: isMaintenance
      ? "We're cooking something special! We will be right back."
      : "Service is operational."
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/registrations', checkMaintenance, registrationsRoutes);
app.use('/api/nail-works', nailWorksRoutes);
app.use('/api/admin', adminRoutes);

// Root API info
app.get('/', (req, res) => {
  res.json({
    message: '💅 Beauty Abyssi Nail House Backend API',
    endpoints: {
      health: '/api/health',
      services: '/api/services',
      registrations: '/api/registrations',
      admin: '/api/admin',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`✨ Beauty Abyssi Nail House server running on http://localhost:${PORT}`);
  await testConnection();
});
