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
import swaggerUi from 'swagger-ui-express';
import { connectAllDatabases, syncAllDatabases } from './config/db/index.js';
import authRoutes from './routes/authRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import seekerAuthRoutes from './routes/seeker/seekerAuthRoutes.js';
import seekerRoutes from './routes/seeker/seekerRoutes.js';
import seekerBookingRoutes from './routes/seeker/seekerBookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicExpertRoutes from './routes/publicExpertRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import razorpayWebhookRoutes from './routes/razorpayWebhookRoutes.js';
import { getRazorpayClient, validateRazorpayConfig } from './config/razorpay.js';
import { seedDefaultAdmin } from './utils/seedDefaultAdmin.js';
import { createOpenApiDocument } from './config/swagger.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { sendNotification, setNotificationSocketServer } from './services/notificationService.js';
import { Booking, BookingExtension } from './models/index.js';
import { approveExtension } from './services/bookingExtensionService.js';
import jwt from 'jsonwebtoken';

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

const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
if (swaggerEnabled) {
  const openApiDocument = createOpenApiDocument({
    serverUrl: process.env.API_PUBLIC_URL || '/',
  });
  app.get('/api-docs.json', (req, res) => res.json(openApiDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Jatayu API Documentation',
    swaggerOptions: { persistAuthorization: true },
  }));
}

// Serve profile uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/seeker-auth', seekerAuthRoutes);
app.use('/api/seeker', seekerRoutes);
app.use('/api/seeker', seekerBookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public/experts', publicExpertRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

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

    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        const user = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');
        if (!user?.id) throw new Error();
        user.role ||= 'expert';
        if (!['seeker', 'expert', 'admin'].includes(user.role)) throw new Error();
        socket.user = user;
        next();
      } catch { next(new Error('Unauthorized')); }
    });
    setNotificationSocketServer(io);

    io.on('connection', (socket) => {
      socket.join(`notifications:${socket.user.role}:${socket.user.id}`);
      console.log(`Socket connected: ${socket.id}`);
      socket.emit('connected', { socketId: socket.id, message: 'WebSocket connected.' });

      socket.on('ping', (payload) => {
        socket.emit('pong', payload || { timestamp: Date.now() });
      });

      socket.on('session:extension:subscribe', async ({ bookingId } = {}) => {
        try {
          const ownership = socket.user.role === 'expert'
            ? { expertId: socket.user.id }
            : { seekerId: socket.user.id };
          const booking = await Booking.findOne({ where: { id: bookingId, ...ownership } });
          if (!booking) throw new Error('BOOKING_NOT_FOUND');
          const extension = await BookingExtension.findOne({ where: { bookingId: booking.id } });
          if (!extension) return;
          if (socket.user.role === 'expert' && extension.status === 'requested') {
            socket.emit('session:extension:request', {
              bookingId: booking.id,
              minutes: extension.requestedMinutes,
            });
          } else if (socket.user.role === 'seeker' && extension.status !== 'requested') {
            socket.emit('session:extension:decision', {
              bookingId: booking.id,
              decision: extension.status === 'declined'
                ? 'declined'
                : extension.approvedMinutes < extension.requestedMinutes ? 'reduced' : 'confirmed',
              minutes: extension.approvedMinutes || 0,
              order: extension.status === 'payment_pending' ? {
                id: extension.razorpayOrderId,
                amount: extension.totalAmount,
                currency: extension.currency,
              } : null,
            });
          }
        } catch (error) {
          socket.emit('session:extension:error', { bookingId, code: error.message });
        }
      });

      socket.on('session:extension:request', async ({ bookingId, minutes } = {}) => {
        try {
          if (socket.user.role !== 'seeker') throw new Error('FORBIDDEN');
          const requestedMinutes = Number(minutes);
          if (!Number.isInteger(requestedMinutes) || requestedMinutes < 1 || requestedMinutes > 360) {
            throw new Error('INVALID_EXTENSION_DURATION');
          }
          const booking = await Booking.findOne({ where: { id: bookingId, seekerId: socket.user.id, status: 'confirmed' } });
          if (!booking) throw new Error('BOOKING_NOT_FOUND');
          if (Date.now() > new Date(booking.scheduledEndAt).getTime()) throw new Error('SESSION_CLOSED');
          const [extension] = await BookingExtension.findOrCreate({
            where: { bookingId: booking.id },
            defaults: {
              bookingId: booking.id,
              requestedMinutes,
              status: 'requested',
              originalEndAt: booking.scheduledEndAt,
            },
          });
          if (extension.status === 'payment_pending' && extension.razorpayOrderId) {
            socket.emit('session:extension:decision', {
              bookingId: booking.id,
              decision: extension.approvedMinutes < extension.requestedMinutes ? 'reduced' : 'confirmed',
              minutes: extension.approvedMinutes,
              order: { id: extension.razorpayOrderId, amount: extension.totalAmount, currency: extension.currency },
            });
            return;
          }
          if (extension.status === 'paid') throw new Error('EXTENSION_ALREADY_PAID');
          if (extension.status !== 'requested') {
            await extension.update({ status: 'requested', approvedMinutes: null, razorpayOrderId: null,
              razorpayPaymentId: null, consultationFee: null, gst: null, totalAmount: null,
              respondedAt: null, paidAt: null, extendedEndAt: null });
          }
          if (extension.status === 'requested') {
            extension.requestedMinutes = requestedMinutes;
            extension.requestedAt = new Date();
            await extension.save();
          }
          io.to(`notifications:expert:${booking.expertId}`).emit('session:extension:request', {
            bookingId: booking.id,
            minutes: requestedMinutes,
          });
          void sendNotification({
            recipientType: 'expert', recipientId: booking.expertId,
            eventType: 'session.extension_requested',
            title: 'Session extension requested',
            body: `The seeker requested ${requestedMinutes} additional minutes.`,
            href: `/expert/requests/${booking.id}/?action=join`,
            data: { bookingId: booking.id, minutes: requestedMinutes },
          }).catch(console.error);
        } catch (error) {
          socket.emit('session:extension:error', { bookingId, code: error.message });
        }
      });

      socket.on('session:extension:decision', async ({ bookingId, decision, minutes } = {}) => {
        try {
          if (socket.user.role !== 'expert') throw new Error('FORBIDDEN');
          if (!['confirmed', 'reduced', 'declined'].includes(decision)) throw new Error('INVALID_EXTENSION_DECISION');
          const booking = await Booking.findOne({ where: { id: bookingId, expertId: socket.user.id, status: 'confirmed' } });
          if (!booking) throw new Error('BOOKING_NOT_FOUND');
          const approvedMinutes = decision === 'declined' ? 0 : Number(minutes);
          const result = await approveExtension(socket.user.id, booking.id, decision, approvedMinutes);
          io.to(`notifications:seeker:${booking.seekerId}`).emit('session:extension:decision', {
            bookingId: booking.id,
            decision,
            minutes: approvedMinutes,
            order: result.order,
          });
          void sendNotification({
            recipientType: 'seeker', recipientId: booking.seekerId,
            eventType: `session.extension_${decision}`,
            title: decision === 'declined' ? 'Extension declined' : 'Extension approved',
            body: decision === 'declined'
              ? 'The expert declined your session extension request.'
              : `The expert approved ${approvedMinutes} additional minutes.`,
            href: `/seeker/bookings/${booking.id}/?action=join`,
            data: { bookingId: booking.id, decision, minutes: approvedMinutes },
          }).catch(console.error);
        } catch (error) {
          socket.emit('session:extension:error', { bookingId, code: error.message });
        }
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
      if (swaggerEnabled) console.log(`API Docs:     http://localhost:${PORT}/api-docs`);
      console.log(`WebSocket:    ws://localhost:${PORT}/socket.io`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Unable to start backend server:', error);
    process.exit(1);
  }
};

startServer();
