import {
  createBookingOrder,
  getExpertBookingOptions,
  getSeekerBooking,
  listSeekerBookings,
  pokeExpert,
  serializeBooking,
  verifyBookingPayment,
} from '../../services/seeker/bookingService.js';
import { getBookingPokeConfig } from '../../config/bookingPokes.js';

const ERROR_RESPONSES = {
  MISSING_BOOKING_FIELDS: [400, 'expertId, idempotencyKey, subject, context, and scheduledStartAt are required'],
  INVALID_BOOKING_FIELDS: [422, 'Booking fields exceed their allowed length'],
  INVALID_CONSULTATION_TYPE: [422, 'Unsupported consultation type'],
  INVALID_BOOKING_TIME: [422, 'scheduledStartAt must be a valid future ISO date'],
  INVALID_FROM_DATE: [422, 'from must be a valid date'],
  EXPERT_NOT_FOUND: [404, 'Approved expert not found'],
  SEEKER_NOT_FOUND: [404, 'Seeker not found'],
  BOOKING_NOT_FOUND: [404, 'Booking not found'],
  EXPERT_UNAVAILABLE: [409, 'Expert is not available at the requested time'],
  SLOT_UNAVAILABLE: [409, 'This slot is no longer available'],
  FORMAT_NOT_OFFERED: [422, 'The expert does not offer the selected consultation type'],
  MISSING_PAYMENT_FIELDS: [400, 'Razorpay order ID, payment ID, and signature are required'],
  INVALID_PAYMENT_SIGNATURE: [400, 'Invalid Razorpay payment signature'],
  PAYMENT_MISMATCH: [409, 'Payment does not match this booking'],
  PAYMENT_ORDER_FAILED: [502, 'Unable to create Razorpay payment order'],
  BOOKING_NOT_AWAITING_EXPERT: [409, 'This booking is no longer awaiting the expert response'],
  POKE_LIMIT_REACHED: [409, 'Maximum number of pokes reached for this booking'],
  POKE_TOO_EARLY: [429, 'Please wait before poking the expert again'],
};

function handleBookingError(error, res, operation) {
  const [status, message] = ERROR_RESPONSES[error.message] || [500, `Unable to ${operation}`];
  if (status === 500) console.error(`Seeker Booking ${operation} Error:`, error);
  return res.status(status).json({
    message,
    code: error.message,
    ...(error.nextAllowedAt ? { nextAllowedAt: error.nextAllowedAt } : {}),
  });
}

export async function getBookingOptions(req, res) {
  try {
    const requestedDays = req.query.days === undefined ? 28 : Number.parseInt(req.query.days, 10);
    if (!Number.isInteger(requestedDays) || requestedDays < 1 || requestedDays > 31) {
      return res.status(422).json({ message: 'days must be between 1 and 31' });
    }
    const options = await getExpertBookingOptions(req.params.expertId, req.query.from, requestedDays);
    if (!options) return res.status(404).json({ message: 'Approved expert not found' });
    return res.status(200).json({ bookingOptions: options });
  } catch (error) {
    return handleBookingError(error, res, 'retrieve booking options');
  }
}

export async function createOrder(req, res) {
  try {
    const result = await createBookingOrder(req.user.id, req.body);
    const payment = result.payment;
    return res.status(result.reused ? 200 : 201).json({
      booking: serializeBooking(result.booking, await getBookingPokeConfig()),
      checkoutRequired: result.booking.payableAmount > 0
        && !['paid', 'paid_with_credits'].includes(result.booking.paymentStatus),
      razorpayOrder: payment ? {
        id: payment.razorpayOrderId,
        amount: payment.amount,
        currency: payment.currency,
      } : null,
      reused: result.reused,
    });
  } catch (error) {
    return handleBookingError(error, res, 'create booking');
  }
}

export async function verifyPayment(req, res) {
  try {
    const booking = await verifyBookingPayment(req.user.id, req.params.bookingId, req.body);
    return res.status(200).json({
      message: booking.status === 'awaiting_expert'
        ? 'Payment confirmed and booking request sent to the expert'
        : 'Payment verified and awaiting capture confirmation',
      booking: serializeBooking(booking, await getBookingPokeConfig()),
    });
  } catch (error) {
    return handleBookingError(error, res, 'verify payment');
  }
}

export async function listBookings(req, res) {
  try {
    return res.status(200).json({ bookings: await listSeekerBookings(req.user.id) });
  } catch (error) {
    return handleBookingError(error, res, 'list bookings');
  }
}

export async function getBooking(req, res) {
  try {
    const booking = await getSeekerBooking(req.user.id, req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    return res.status(200).json({ booking });
  } catch (error) {
    return handleBookingError(error, res, 'retrieve booking');
  }
}

export async function pokeBookingExpert(req, res) {
  try {
    const booking = await pokeExpert(req.user.id, req.params.bookingId);
    return res.status(200).json({ message: 'Expert poked successfully', booking });
  } catch (error) {
    return handleBookingError(error, res, 'poke expert');
  }
}
