import { Booking } from '../models/index.js';
import {
  getBookingTranscript,
  startAgoraTranscription,
  stopAgoraTranscription,
  storeTranscriptSegment,
} from '../services/agoraTranscriptionService.js';
import { getAgoraSessionAccess } from '../services/agoraService.js';

const ERRORS = {
  BOOKING_NOT_FOUND: [404, 'Booking not found'],
  BOOKING_NOT_CONFIRMED: [409, 'The booking must be confirmed'],
  SESSION_NOT_OPEN: [403, 'This session is not open yet'],
  SESSION_CLOSED: [410, 'This session has ended'],
  AGORA_TRANSCRIPTION_DISABLED: [503, 'Agora transcription is disabled'],
  AGORA_TRANSCRIPTION_NOT_CONFIGURED: [503, 'Agora transcription credentials are not configured'],
  AGORA_NOT_CONFIGURED: [503, 'Agora RTC is not configured'],
  AGORA_TRANSCRIPTION_REQUEST_FAILED: [502, 'Agora transcription request failed'],
  INVALID_TRANSCRIPT_SEGMENT: [422, 'Invalid final transcript segment'],
};

async function ownedBooking(req, role) {
  const ownership = role === 'expert' ? { expertId: req.user.id } : { seekerId: req.user.id };
  const booking = await Booking.findOne({ where: { id: req.params.bookingId, ...ownership } });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  return booking;
}

function fail(error, res) {
  const [status, message] = ERRORS[error.message] || [500, 'Unable to manage session transcript'];
  if (status === 500) console.error('Agora Transcription Error:', error);
  return res.status(status).json({ message, code: error.message, details: error.providerDescription });
}

const startFor = (role) => async (req, res) => {
  try {
    const booking = await ownedBooking(req, role);
    if (booking.status !== 'confirmed') throw new Error('BOOKING_NOT_CONFIRMED');
    const access = await getAgoraSessionAccess(booking);
    if (!access.canJoin) {
      const now = Date.now();
      throw new Error(now < new Date(access.opensAt).getTime() ? 'SESSION_NOT_OPEN' : 'SESSION_CLOSED');
    }
    const session = await startAgoraTranscription(booking);
    return res.status(200).json({ transcription: { status: session.status, startedAt: session.startedAt } });
  } catch (error) { return fail(error, res); }
};

const stopFor = (role) => async (req, res) => {
  try {
    await ownedBooking(req, role);
    const session = await stopAgoraTranscription(req.params.bookingId);
    return res.status(200).json({ transcription: { status: session?.status || 'not_started' } });
  } catch (error) { return fail(error, res); }
};

const segmentFor = (role) => async (req, res) => {
  try {
    await ownedBooking(req, role);
    const segment = await storeTranscriptSegment(req.params.bookingId, req.body);
    return res.status(200).json({ segment: segment.toJSON() });
  } catch (error) { return fail(error, res); }
};

const transcriptFor = (role) => async (req, res) => {
  try {
    await ownedBooking(req, role);
    return res.status(200).json({ transcript: await getBookingTranscript(req.params.bookingId) });
  } catch (error) { return fail(error, res); }
};

export const startSeekerTranscription = startFor('seeker');
export const stopSeekerTranscription = stopFor('seeker');
export const storeSeekerTranscriptSegment = segmentFor('seeker');
export const getSeekerTranscript = transcriptFor('seeker');
export const startExpertTranscription = startFor('expert');
export const stopExpertTranscription = stopFor('expert');
export const storeExpertTranscriptSegment = segmentFor('expert');
export const getExpertTranscript = transcriptFor('expert');

export async function getAdminTranscript(req, res) {
  try {
    const booking = await Booking.findByPk(req.params.bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    return res.status(200).json({ transcript: await getBookingTranscript(booking.id) });
  } catch (error) { return fail(error, res); }
}
