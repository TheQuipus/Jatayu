import { Op } from 'sequelize';
import {
  Booking,
  BookingPayment,
  Expert,
  Seeker,
  seekerDb,
} from '../../models/index.js';
import {
  refundBookingCredits,
  requestBookingRefund,
} from '../seeker/bookingService.js';
import {
  EXPERT_REQUEST_NEW_WINDOW_MS,
  EXPERT_REQUEST_RESPONSE_WINDOW_MS,
} from '../../config/expertRequests.js';

const DECLINE_REASON_CODES = new Set([
  'scheduling_conflict',
  'outside_expertise',
  'fee_mismatch',
  'insufficient_notice',
  'other',
]);

function requestStatus(booking, now = Date.now()) {
  if (booking.status === 'confirmed') return 'accepted';
  if (booking.status === 'declined') return 'declined';
  if (booking.status !== 'awaiting_expert') return null;
  const requestedAt = new Date(booking.expertRequestedAt || booking.createdAt).getTime();
  return now - requestedAt < EXPERT_REQUEST_NEW_WINDOW_MS ? 'new' : 'pending';
}

function responseTiming(booking, now) {
  const requestedAt = new Date(booking.expertRequestedAt || booking.createdAt).getTime();
  const dueAt = requestedAt + EXPERT_REQUEST_RESPONSE_WINDOW_MS;
  return {
    responseDueAt: new Date(dueAt),
    responseTimeRemainingSeconds: Math.max(0, Math.ceil((dueAt - now) / 1000)),
    isResponseOverdue: booking.status === 'awaiting_expert' && now >= dueAt,
  };
}

function publicPayment(payment) {
  if (!payment) return null;
  const data = payment.toJSON ? payment.toJSON() : payment;
  delete data.providerPayload;
  return data;
}

export function serializeExpertRequest(booking, now = Date.now()) {
  const data = booking.toJSON ? booking.toJSON() : booking;
  const seeker = data.seeker || null;
  const payment = Array.isArray(data.payments) ? data.payments[0] : null;
  delete data.idempotencyKey;
  delete data.activeSlotKey;
  delete data.seeker;
  delete data.payments;
  const timing = responseTiming(data, now);
  return {
    ...data,
    isPoked: Number(data.pokeCount || 0) > 0,
    pokeCount: Number(data.pokeCount || 0),
    requestStatus: requestStatus(data, now),
    ...timing,
    seeker: seeker ? {
      id: seeker.id,
      fullName: seeker.fullName,
      profilePhotoSrc: seeker.profilePhotoSrc,
      location: seeker.location,
      category: seeker.category,
      selectedLanguages: seeker.selectedLanguages || [],
    } : null,
    amounts: {
      consultationFee: data.consultationFee,
      platformFee: data.platformFee,
      gst: data.gst,
      creditAmount: data.creditAmount,
      total: data.totalAmount,
      payable: data.payableAmount,
      currency: data.currency,
      unit: 'paise',
    },
    payment: publicPayment(payment),
    refundStatus: payment?.refundStatus || null,
  };
}

function whereForStatus(expertId, status, cutoff) {
  const where = { expertId };
  if (status === 'new') {
    where.status = 'awaiting_expert';
    where.expertRequestedAt = { [Op.gte]: cutoff };
  } else if (status === 'pending') {
    where.status = 'awaiting_expert';
    where.expertRequestedAt = { [Op.lt]: cutoff };
  } else if (status === 'accepted') {
    where.status = 'confirmed';
  } else if (status === 'declined') {
    where.status = 'declined';
  } else {
    where.status = { [Op.in]: ['awaiting_expert', 'confirmed', 'declined'] };
  }
  return where;
}

async function ensureExpert(expertId) {
  const expert = await Expert.findByPk(expertId, { attributes: ['id'] });
  if (!expert) throw new Error('EXPERT_NOT_FOUND');
}

export async function listExpertRequests(expertId, options) {
  await ensureExpert(expertId);
  const now = Date.now();
  const cutoff = new Date(now - EXPERT_REQUEST_NEW_WINDOW_MS);
  const { rows, count } = await Booking.findAndCountAll({
    where: whereForStatus(expertId, options.status, cutoff),
    include: [
      { model: Seeker, as: 'seeker', attributes: ['id', 'fullName', 'profilePhotoSrc', 'location', 'category', 'selectedLanguages'] },
      { model: BookingPayment, as: 'payments', required: false },
    ],
    distinct: true,
    order: [['expertRequestedAt', options.sort === 'oldest' ? 'ASC' : 'DESC']],
    limit: options.limit,
    offset: (options.page - 1) * options.limit,
  });
  const [newCount, pendingCount, acceptedCount, declinedCount] = await Promise.all([
    Booking.count({ where: whereForStatus(expertId, 'new', cutoff) }),
    Booking.count({ where: whereForStatus(expertId, 'pending', cutoff) }),
    Booking.count({ where: whereForStatus(expertId, 'accepted', cutoff) }),
    Booking.count({ where: whereForStatus(expertId, 'declined', cutoff) }),
  ]);
  return {
    requests: rows.map((booking) => serializeExpertRequest(booking, now)),
    counts: {
      all: newCount + pendingCount + acceptedCount + declinedCount,
      new: newCount,
      pending: pendingCount,
      accepted: acceptedCount,
      declined: declinedCount,
    },
    pagination: {
      page: options.page,
      limit: options.limit,
      total: count,
      pages: Math.ceil(count / options.limit),
    },
  };
}

async function loadExpertRequest(expertId, bookingId) {
  return Booking.findOne({
    where: { id: bookingId, expertId },
    include: [
      { model: Seeker, as: 'seeker', attributes: ['id', 'fullName', 'profilePhotoSrc', 'location', 'category', 'selectedLanguages'] },
      { model: BookingPayment, as: 'payments', required: false },
    ],
  });
}

export async function decideExpertRequest(expertId, bookingId, input) {
  await ensureExpert(expertId);
  const decision = String(input.decision || '').trim().toLowerCase();
  if (!['accepted', 'declined'].includes(decision)) throw new Error('INVALID_DECISION');
  const reasonCode = String(input.reasonCode || '').trim().toLowerCase();
  const reasonNotes = String(input.reasonNotes || '').trim();
  if (decision === 'declined' && !DECLINE_REASON_CODES.has(reasonCode)) throw new Error('INVALID_DECLINE_REASON');
  if (reasonNotes.length > 1000) throw new Error('DECLINE_NOTES_TOO_LONG');

  let shouldRequestRefund = false;
  await seekerDb.transaction(async (transaction) => {
    const booking = await Booking.findOne({
      where: { id: bookingId, expertId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!booking) throw new Error('REQUEST_NOT_FOUND');
    const existingDecision = booking.status === 'confirmed'
      ? 'accepted'
      : booking.status === 'declined' ? 'declined' : null;
    if (existingDecision) {
      if (existingDecision !== decision) throw new Error('REQUEST_ALREADY_DECIDED');
      shouldRequestRefund = decision === 'declined'
        && booking.payableAmount > 0
        && booking.paymentStatus !== 'refunded';
      return;
    }
    if (booking.status !== 'awaiting_expert') throw new Error('REQUEST_NOT_DECIDABLE');

    if (decision === 'accepted') {
      booking.status = 'confirmed';
      booking.expertRespondedAt = new Date();
      booking.confirmedAt = new Date();
      await booking.save({ transaction });
      return;
    }

    booking.status = 'declined';
    booking.expertRespondedAt = new Date();
    booking.declineReasonCode = reasonCode;
    booking.declineReasonNotes = reasonNotes || null;
    booking.activeSlotKey = null;
    await refundBookingCredits(booking, transaction, 'expert_declined');
    if (booking.payableAmount > 0) {
      const payment = await BookingPayment.findOne({ where: { bookingId }, transaction, lock: transaction.LOCK.UPDATE });
      if (!payment?.razorpayPaymentId || payment.status !== 'paid') throw new Error('PAYMENT_NOT_CAPTURED');
      payment.status = 'refund_pending';
      payment.refundStatus = 'refund_pending';
      payment.refundRequestedAt = payment.refundRequestedAt || new Date();
      await payment.save({ transaction });
      booking.paymentStatus = 'refund_pending';
      shouldRequestRefund = true;
    } else {
      booking.paymentStatus = 'refunded';
    }
    await booking.save({ transaction });
  });

  if (shouldRequestRefund) await requestBookingRefund(bookingId);
  const booking = await loadExpertRequest(expertId, bookingId);
  return serializeExpertRequest(booking);
}

export { DECLINE_REASON_CODES };
