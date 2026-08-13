import { setDefaultResultOrder } from 'dns';
// Force IPv4 DNS resolution first — prevents ENETUNREACH on networks without IPv6
setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { connectAllDatabases, syncAllDatabases } from './config/db/index.js';
import authRoutes from './routes/authRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import seekerAuthRoutes from './routes/seeker/seekerAuthRoutes.js';
import seekerRoutes from './routes/seeker/seekerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicExpertRoutes from './routes/publicExpertRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import razorpayWebhookRoutes from './routes/razorpayWebhookRoutes.js';
import { getRazorpayClient, validateRazorpayConfig } from './config/razorpay.js';
import { seedDefaultAdmin } from './utils/seedDefaultAdmin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const DEV_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/;

// Resolve __dirname in ES Modules environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      CORS_ORIGINS.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && DEV_ORIGIN_REGEX.test(origin))
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

// Configure Middlewares
app.use(cors(corsOptions));
// Razorpay signs the exact request bytes, so this route must run before express.json().
app.use('/api/payments/webhooks', razorpayWebhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve profile uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/seeker-auth', seekerAuthRoutes);
app.use('/api/seeker', seekerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public/experts', publicExpertRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Jatayu API is healthy.' });
});

app.get('/health/ws', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'WebSocket service is available at /socket.io' });
});

// Database Sync and Server Startup
const startServer = async () => {
  try {
    validateRazorpayConfig();
    getRazorpayClient();

    await connectAllDatabases();

    // Sync schema without ALTER on every dev restart to avoid MySQL deadlocks.
    const syncOptions = process.env.DB_SYNC_ALTER === 'true' ? { alter: true } : {};
    await syncAllDatabases(syncOptions);

    await seedDefaultAdmin();

    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: CORS_ORIGINS,
        credentials: true,
      },
      path: '/socket.io',
    });

    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      socket.emit('connected', { socketId: socket.id, message: 'WebSocket connected.' });

      socket.on('ping', (payload) => {
        socket.emit('pong', payload || { timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id} (${reason})`);
      });
    });

    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other backend process and restart.`);
      } else {
        console.error('HTTP server error:', error);
      }
      process.exit(1);
    });

    httpServer.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`Jatayu Expert Onboarding Backend is running!`);
      console.log(`Port:         ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`WebSocket:    ws://localhost:${PORT}/socket.io`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Unable to start backend server:', error);
    process.exit(1);
  }
};

startServer();
