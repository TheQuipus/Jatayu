import { Booking } from '../models/index.js';
import { createAgoraSessionToken } from '../services/agoraService.js';
import { seekerDb } from '../models/index.js';
import { sendNotification } from '../services/notificationService.js';

const ERRORS = {
  BOOKING_NOT_FOUND: [404, 'Booking not found'],
  BOOKING_NOT_CONFIRMED: [409, 'The expert must accept this booking before the session can start'],
  AGORA_DISABLED: [503, 'Agora communication is disabled'],
  AGORA_NOT_CONFIGURED: [503, 'Agora communication is not configured'],
  SESSION_NOT_OPEN: [403, 'The session room is not open yet'],
  SESSION_CLOSED: [410, 'The session room has closed'],
};

function respondError(error, res) {
  const [status, message] = ERRORS[error.message] || [500, 'Unable to create session credentials'];
  if (status === 500) console.error('Agora Session Error:', error);
  return res.status(status).json({
    message,
    code: error.message,
    ...(error.opensAt ? { opensAt: error.opensAt } : {}),
  });
}

async function tokenFor(req, res, role) {
  try {
    const ownership = role === 'expert' ? { expertId: req.user.id } : { seekerId: req.user.id };
    const booking = await Booking.findOne({ where: { id: req.params.bookingId, ...ownership } });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (booking.status !== 'confirmed') throw new Error('BOOKING_NOT_CONFIRMED');
    return res.status(200).json({ session: await createAgoraSessionToken(booking, role) });
  } catch (error) {
    return respondError(error, res);
  }
}

async function completeFor(req, res, role) {
  try {
    const ownership = role === 'expert' ? { expertId: req.user.id } : { seekerId: req.user.id };
    const booking = await Booking.findOne({ where: { id: req.params.bookingId, ...ownership } });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (Date.now() < new Date(booking.scheduledEndAt).getTime()) {
      return res.status(409).json({ message: 'The booked session duration has not ended', code: 'SESSION_NOT_ENDED' });
    }
    await seekerDb.transaction(async (transaction) => {
      const locked = await Booking.findByPk(booking.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (locked.status === 'confirmed') {
        locked.status = 'completed';
        locked.activeSlotKey = null;
        await locked.save({ transaction });
      }
    });
    await Promise.all([
      sendNotification({ recipientType: 'seeker', recipientId: booking.seekerId, eventType: 'session.completed', dedupeKey: `session.completed:${booking.id}:seeker`, title: 'Session completed', body: `Your session with ${booking.expertName} has ended.`, href: `/seeker/bookings/${booking.id}/`, data: { bookingId: booking.id } }),
      sendNotification({ recipientType: 'expert', recipientId: booking.expertId, eventType: 'session.completed', dedupeKey: `session.completed:${booking.id}:expert`, title: 'Session completed', body: 'Your consultation session has ended.', href: `/expert/requests/${booking.id}/`, data: { bookingId: booking.id } }),
    ]);
    return res.status(200).json({ bookingId: booking.id, status: 'completed' });
  } catch (error) { return respondError(error, res); }
}

export const getSeekerAgoraSession = (req, res) => tokenFor(req, res, 'seeker');
export const getExpertAgoraSession = (req, res) => tokenFor(req, res, 'expert');
export const completeSeekerAgoraSession = (req, res) => completeFor(req, res, 'seeker');
export const completeExpertAgoraSession = (req, res) => completeFor(req, res, 'expert');
