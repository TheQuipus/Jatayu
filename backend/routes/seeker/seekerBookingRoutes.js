import express from 'express';
import { protectSeeker } from '../../middleware/seeker/seekerAuthMiddleware.js';
import {
  createOrder,
  getBooking,
  getBookingOptions,
  listBookings,
  verifyPayment,
} from '../../controllers/seeker/seekerBookingController.js';

const router = express.Router();

router.use(protectSeeker);
router.get('/experts/:expertId/booking-options', getBookingOptions);
router.get('/bookings', listBookings);
router.post('/bookings/orders', createOrder);
router.get('/bookings/:bookingId', getBooking);
router.post('/bookings/:bookingId/verify-payment', verifyPayment);

export default router;
