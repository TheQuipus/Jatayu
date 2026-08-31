import { Booking } from '../models/index.js';
import { createAgoraSessionToken } from '../services/agoraService.js';

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

export const getSeekerAgoraSession = (req, res) => tokenFor(req, res, 'seeker');
export const getExpertAgoraSession = (req, res) => tokenFor(req, res, 'expert');
