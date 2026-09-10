import { verifyExtensionPayment } from '../services/bookingExtensionService.js';
import { emitRealtime } from '../services/notificationService.js';

export async function verifySeekerExtensionPayment(req, res) {
  try {
    const result = await verifyExtensionPayment(req.user.id, req.params.bookingId, req.body || {});
    const payload = { bookingId: result.booking.id, extendedEndAt: result.booking.scheduledEndAt,
      minutes: result.extension.approvedMinutes, status: 'paid' };
    emitRealtime('seeker', result.booking.seekerId, 'session:extension:activated', payload);
    emitRealtime('expert', result.booking.expertId, 'session:extension:activated', payload);
    return res.status(200).json(payload);
  } catch (error) {
    const status = ['BOOKING_NOT_FOUND'].includes(error.message) ? 404 : 422;
    return res.status(status).json({ message: error.message, code: error.message });
  }
}
