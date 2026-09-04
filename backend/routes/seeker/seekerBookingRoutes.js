import express from 'express';
import { protectSeeker } from '../../middleware/seeker/seekerAuthMiddleware.js';
import {
  createOrder,
  getBooking,
  getBookingOptions,
  listBookings,
  pokeBookingExpert,
  verifyPayment,
} from '../../controllers/seeker/seekerBookingController.js';
import { getSeekerAgoraSession } from '../../controllers/agoraSessionController.js';
import {
  getSeekerTranscript,
  startSeekerTranscription,
  stopSeekerTranscription,
  storeSeekerTranscriptSegment,
} from '../../controllers/agoraTranscriptionController.js';

const router = express.Router();

router.use(protectSeeker);
router.get('/experts/:expertId/booking-options', getBookingOptions);
router.get('/bookings', listBookings);
router.post('/bookings/orders', createOrder);
router.get('/bookings/:bookingId', getBooking);
router.post('/bookings/:bookingId/poke', pokeBookingExpert);
router.post('/bookings/:bookingId/session/token', getSeekerAgoraSession);
router.post('/bookings/:bookingId/transcription/start', startSeekerTranscription);
router.post('/bookings/:bookingId/transcription/stop', stopSeekerTranscription);
router.post('/bookings/:bookingId/transcription/segments', storeSeekerTranscriptSegment);
router.get('/bookings/:bookingId/transcript', getSeekerTranscript);
router.post('/bookings/:bookingId/verify-payment', verifyPayment);

export default router;
