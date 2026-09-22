import express from 'express';
import { reviewAction, getBookingReview, submitReview } from '../../controllers/reviewController.js';
import { protectSeeker } from '../../middleware/seeker/seekerAuthMiddleware.js';
import {
  createOrder,
  getBooking,
  getBookingOptions,
  listBookings,
  pokeBookingExpert,
  verifyPayment,
} from '../../controllers/seeker/seekerBookingController.js';
import { completeSeekerAgoraSession, getSeekerAgoraSession } from '../../controllers/agoraSessionController.js';
import {
  getSeekerTranscript,
  startSeekerTranscription,
  stopSeekerTranscription,
  storeSeekerTranscriptSegment,
} from '../../controllers/agoraTranscriptionController.js';
import { verifySeekerExtensionPayment } from '../../controllers/bookingExtensionController.js';
import { seekerChat } from '../../controllers/bookingChatController.js';

const router = express.Router();

router.use(protectSeeker);
router.get('/bookings/:bookingId/review', reviewAction(getBookingReview));
router.post('/bookings/:bookingId/review', reviewAction(submitReview));
router.get('/experts/:expertId/booking-options', getBookingOptions);
router.get('/bookings', listBookings);
router.post('/bookings/orders', createOrder);
router.get('/bookings/:bookingId', getBooking);
router.post('/bookings/:bookingId/poke', pokeBookingExpert);
router.post('/bookings/:bookingId/session/token', getSeekerAgoraSession);
router.post('/bookings/:bookingId/session/complete', completeSeekerAgoraSession);
router.post('/bookings/:bookingId/transcription/start', startSeekerTranscription);
router.post('/bookings/:bookingId/transcription/stop', stopSeekerTranscription);
router.post('/bookings/:bookingId/transcription/segments', storeSeekerTranscriptSegment);
router.get('/bookings/:bookingId/transcript', getSeekerTranscript);
router.post('/bookings/:bookingId/verify-payment', verifyPayment);
router.post('/bookings/:bookingId/extension/verify-payment', verifySeekerExtensionPayment);
router.get('/bookings/:bookingId/messages', seekerChat.list);
router.post('/bookings/:bookingId/messages', seekerChat.send);
router.patch('/bookings/:bookingId/messages/read', seekerChat.read);

export default router;
