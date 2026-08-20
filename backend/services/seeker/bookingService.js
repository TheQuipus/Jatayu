import crypto from 'crypto';
import { Op, UniqueConstraintError } from 'sequelize';
import {
  Availability,
  Booking,
  BookingPayment,
  Expert,
  Seeker,
  SeekerCreditTransaction,
  seekerDb,
} from '../../models/index.js';
import { getRazorpayClient } from '../../config/razorpay.js';
import { verifyRazorpayPaymentSignature } from '../payment/razorpayService.js';

const ACTIVE_BOOKING_STATUSES = ['payment_pending', 'payment_verified', 'awaiting_expert', 'confirmed'];
const SLOT_DURATION_MINUTES = 30;
const BOOKING_EXPIRY_MINUTES = 15;
const SUPPORTED_TYPES = new Set(['text', 'video', 'shoutout', 'group']);

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizeType(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function parseTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function zonedParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function isWithinExpertAvailability(expert, scheduledStartAt) {
  const timezone = expert.timezone || 'Asia/Kolkata';
  let parts;
  try { parts = zonedParts(scheduledStartAt, timezone); } catch { return false; }
  const weekday = parts.weekday.toLowerCase();
  const startMinute = Number(parts.hour) * 60 + Number(parts.minute);
  const endMinute = startMinute + SLOT_DURATION_MINUTES;

  return (expert.availabilities || []).some((availability) => {
    const days = parseJson(availability.days, []);
    const from = parseTime(availability.fromTime);
    const to = parseTime(availability.toTime);
    return Array.isArray(days)
      && days.some((day) => String(day).toLowerCase().slice(0, 3) === weekday)
      && from !== null && to !== null
      && startMinute >= from && endMinute <= to;
  });
}

async function resolveApprovedExpert(identifier) {
  const include = [{ model: Availability, as: 'availabilities', required: false }];
  const direct = await Expert.findOne({ where: { id: identifier, status: 'approved' }, include }).catch(() => null);
  if (direct) return direct;

  const normalizedSlug = String(identifier || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const experts = await Expert.findAll({ where: { status: 'approved' }, include });
  return experts.find((expert) => expert.fullName
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === normalizedSlug) || null;
}

function priceFor(expert, consultationType) {
  const prices = parseJson(expert.formatPrices, {});
  const entry = Object.entries(prices || {}).find(([key]) => normalizeType(key) === consultationType);
  const rupees = Number(entry?.[1]);
  return Number.isFinite(rupees) && rupees > 0 ? Math.round(rupees * 100) : null;
}

function serializeBooking(booking) {
  const data = booking.toJSON();
  delete data.idempotencyKey;
  delete data.activeSlotKey;
  data.payments = (data.payments || []).map(({ providerPayload, ...payment }) => payment);
  const refundStatus = data.payments[0]?.refundStatus || null;
  return {
    ...data,
    refundStatus,
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
  };
}

export async function refundBookingCredits(booking, transaction, reason) {
  if (!booking.creditsUsed) return;
  const seeker = await Seeker.findByPk(booking.seekerId, { transaction, lock: transaction.LOCK.UPDATE });
  const reference = `${booking.id}:refund`;
  const existing = await SeekerCreditTransaction.findOne({
    where: { seekerId: booking.seekerId, source: 'booking_refund', reference },
    transaction,
  });
  if (existing) return;
  seeker.credits = Number(seeker.credits) + booking.creditsUsed;
  await seeker.save({ transaction });
  await SeekerCreditTransaction.create({
    seekerId: seeker.id,
    amount: booking.creditsUsed,
    balanceAfter: seeker.credits,
    type: 'credit',
    source: 'booking_refund',
    reference,
    description: 'Booking credit refund',
    metadata: { bookingId: booking.id, reason },
  }, { transaction });
}

export async function expirePendingBookings() {
  const expired = await Booking.findAll({
    where: { status: 'payment_pending', expiresAt: { [Op.lt]: new Date() } },
  });
  for (const candidate of expired) {
    await seekerDb.transaction(async (transaction) => {
      const booking = await Booking.findByPk(candidate.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!booking || booking.status !== 'payment_pending' || booking.expiresAt >= new Date()) return;
      booking.status = 'expired';
      booking.paymentStatus = 'expired';
      booking.activeSlotKey = null;
      await refundBookingCredits(booking, transaction, 'payment_timeout');
      await booking.save({ transaction });
    });
  }
}

export async function getExpertBookingOptions(expertIdentifier, from, days = 28) {
  const expert = await resolveApprovedExpert(expertIdentifier);
  if (!expert) return null;
  await expirePendingBookings();
  const start = from ? new Date(from) : new Date();
  if (Number.isNaN(start.getTime())) throw new Error('INVALID_FROM_DATE');
  const end = new Date(start.getTime() + days * 86400000);
  const occupied = await Booking.findAll({
    where: {
      expertId: expert.id,
      status: { [Op.in]: ACTIVE_BOOKING_STATUSES },
      scheduledStartAt: { [Op.gte]: start, [Op.lt]: end },
    },
    attributes: ['scheduledStartAt', 'scheduledEndAt'],
    order: [['scheduledStartAt', 'ASC']],
  });
  const prices = parseJson(expert.formatPrices, {});
  return {
    expertId: expert.id,
    timezone: expert.timezone || 'Asia/Kolkata',
    slotDurationMinutes: SLOT_DURATION_MINUTES,
    formats: (parseJson(expert.selectedFormats, []) || []).map(normalizeType),
    formatPrices: prices,
    availabilities: (expert.availabilities || []).map((item) => ({
      id: item.id,
      days: parseJson(item.days, []),
      fromTime: item.fromTime,
      toTime: item.toTime,
    })),
    occupiedSlots: occupied.map((item) => ({
      startAt: item.scheduledStartAt,
      endAt: item.scheduledEndAt,
    })),
  };
}

export async function createBookingOrder(seekerId, input) {
  const consultationType = normalizeType(input.consultationType);
  if (!SUPPORTED_TYPES.has(consultationType)) throw new Error('INVALID_CONSULTATION_TYPE');
  if (!input.expertId || !input.idempotencyKey || !input.subject?.trim() || !input.context?.trim()) {
    throw new Error('MISSING_BOOKING_FIELDS');
  }
  if (input.idempotencyKey.length > 100 || input.subject.trim().length > 255 || input.context.trim().length > 5000) {
    throw new Error('INVALID_BOOKING_FIELDS');
  }
  const startAt = new Date(input.scheduledStartAt);
  if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) throw new Error('INVALID_BOOKING_TIME');
  const endAt = new Date(startAt.getTime() + SLOT_DURATION_MINUTES * 60000);
  const expert = await resolveApprovedExpert(input.expertId);
  if (!expert) throw new Error('EXPERT_NOT_FOUND');
  if (!isWithinExpertAvailability(expert, startAt)) throw new Error('EXPERT_UNAVAILABLE');
  const consultationFee = priceFor(expert, consultationType);
  if (!consultationFee) throw new Error('FORMAT_NOT_OFFERED');
  await expirePendingBookings();

  const existing = await Booking.findOne({ where: { seekerId, idempotencyKey: input.idempotencyKey }, include: ['payments'] });
  if (existing) return { booking: existing, payment: existing.payments?.[0], reused: true };

  const gstRate = Number(process.env.BOOKING_GST_PERCENT || 18);
  const platformFee = Math.max(0, Number.parseInt(process.env.BOOKING_PLATFORM_FEE_PAISE || '0', 10) || 0);
  const gst = Math.round((consultationFee + platformFee) * gstRate / 100);
  const totalAmount = consultationFee + platformFee + gst;
  const creditValue = Math.max(1, Number.parseInt(process.env.SEEKER_CREDIT_VALUE_PAISE || '100', 10) || 100);
  const bookingId = crypto.randomUUID();

  let booking;
  try {
    booking = await seekerDb.transaction(async (transaction) => {
      const seeker = await Seeker.findByPk(seekerId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!seeker) throw new Error('SEEKER_NOT_FOUND');
      const conflict = await Booking.findOne({
        where: {
          expertId: expert.id,
          status: { [Op.in]: ACTIVE_BOOKING_STATUSES },
          scheduledStartAt: { [Op.lt]: endAt },
          scheduledEndAt: { [Op.gt]: startAt },
        },
        transaction,
      });
      if (conflict) throw new Error('SLOT_UNAVAILABLE');

      const creditsUsed = input.useCredits
        ? Math.min(Number(seeker.credits), Math.floor(totalAmount / creditValue))
        : 0;
      const creditAmount = creditsUsed * creditValue;
      const payableAmount = totalAmount - creditAmount;
      const created = await Booking.create({
        id: bookingId,
        seekerId,
        expertId: expert.id,
        activeSlotKey: `${expert.id}|${startAt.toISOString()}`,
        idempotencyKey: input.idempotencyKey,
        consultationType,
        subject: input.subject.trim(),
        context: input.context.trim(),
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        timezone: expert.timezone || 'Asia/Kolkata',
        expertName: expert.fullName,
        expertProfessionalTitle: expert.professionalTitle,
        expertProfilePhotoSrc: expert.profilePhotoSrc,
        consultationFee,
        platformFee,
        gst,
        creditsUsed,
        creditAmount,
        totalAmount,
        payableAmount,
        status: payableAmount === 0 ? 'awaiting_expert' : 'payment_pending',
        paymentStatus: payableAmount === 0 ? 'paid_with_credits' : 'pending',
        expertRequestedAt: payableAmount === 0 ? new Date() : null,
        confirmedAt: null,
        expiresAt: payableAmount === 0 ? null : new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60000),
      }, { transaction });

      if (creditsUsed > 0) {
        seeker.credits = Number(seeker.credits) - creditsUsed;
        await seeker.save({ transaction });
        await SeekerCreditTransaction.create({
          seekerId,
          amount: -creditsUsed,
          balanceAfter: seeker.credits,
          type: 'debit',
          source: 'booking',
          reference: bookingId,
          description: 'Credits applied to expert booking',
          metadata: { bookingId, creditValuePaise: creditValue },
        }, { transaction });
      }
      return created;
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const duplicate = await Booking.findOne({ where: { seekerId, idempotencyKey: input.idempotencyKey }, include: ['payments'] });
      if (duplicate) return { booking: duplicate, payment: duplicate.payments?.[0], reused: true };
      throw new Error('SLOT_UNAVAILABLE');
    }
    throw error;
  }

  if (booking.payableAmount === 0) return { booking, payment: null, reused: false };
  try {
    const order = await getRazorpayClient().orders.create({
      amount: booking.payableAmount,
      currency: booking.currency,
      receipt: `booking_${booking.id.replace(/-/g, '').slice(0, 30)}`,
      notes: { bookingId: booking.id, seekerId, expertId: expert.id },
    });
    const payment = await BookingPayment.create({
      bookingId: booking.id,
      razorpayOrderId: order.id,
      amount: booking.payableAmount,
      currency: booking.currency,
      status: 'order_created',
      providerPayload: { order },
    });
    return { booking, payment, reused: false };
  } catch (error) {
    await failBookingPayment(booking.id, { code: 'ORDER_CREATION_FAILED', description: error.message });
    throw new Error('PAYMENT_ORDER_FAILED');
  }
}

export async function verifyBookingPayment(seekerId, bookingId, input) {
  if (!input.razorpayOrderId || !input.razorpayPaymentId || !input.razorpaySignature) {
    throw new Error('MISSING_PAYMENT_FIELDS');
  }
  const booking = await Booking.findOne({ where: { id: bookingId, seekerId }, include: ['payments'] });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  const payment = booking.payments.find((item) => item.razorpayOrderId === input.razorpayOrderId);
  if (!payment || payment.amount !== booking.payableAmount) throw new Error('PAYMENT_MISMATCH');
  if (!verifyRazorpayPaymentSignature({
    orderId: payment.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  })) throw new Error('INVALID_PAYMENT_SIGNATURE');

  const providerPayment = await getRazorpayClient().payments.fetch(input.razorpayPaymentId);
  if (providerPayment.order_id !== payment.razorpayOrderId
    || Number(providerPayment.amount) !== payment.amount
    || providerPayment.currency !== payment.currency) throw new Error('PAYMENT_MISMATCH');
  payment.razorpayPaymentId = providerPayment.id;
  payment.status = providerPayment.status === 'captured' ? 'paid' : 'verified';
  payment.verifiedAt = new Date();
  payment.paidAt = providerPayment.status === 'captured' ? new Date() : null;
  payment.providerPayload = { payment: providerPayment };
  await payment.save();
  if (providerPayment.status === 'captured') await confirmBookingPayment(booking.id, providerPayment.id);
  else {
    booking.status = 'payment_verified';
    booking.paymentStatus = providerPayment.status;
    await booking.save();
  }
  return Booking.findByPk(booking.id, { include: ['payments'] });
}

export async function confirmBookingPayment(bookingId, paymentId) {
  return seekerDb.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!booking || ['awaiting_expert', 'confirmed', 'declined'].includes(booking.status)) return booking;
    const payment = await BookingPayment.findOne({ where: { bookingId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!payment) return null;
    booking.status = 'awaiting_expert';
    booking.paymentStatus = 'paid';
    booking.expertRequestedAt = booking.expertRequestedAt || new Date();
    booking.confirmedAt = null;
    booking.expiresAt = null;
    payment.status = 'paid';
    payment.razorpayPaymentId = paymentId || payment.razorpayPaymentId;
    payment.paidAt = payment.paidAt || new Date();
    await payment.save({ transaction });
    await booking.save({ transaction });
    return booking;
  });
}

export async function failBookingPayment(bookingId, failure = {}) {
  return seekerDb.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!booking || ['awaiting_expert', 'confirmed', 'declined', 'payment_failed'].includes(booking.status)) return booking;
    booking.status = 'payment_failed';
    booking.paymentStatus = 'failed';
    booking.activeSlotKey = null;
    const payment = await BookingPayment.findOne({ where: { bookingId }, transaction, lock: transaction.LOCK.UPDATE });
    if (payment) {
      payment.status = 'failed';
      payment.failureCode = failure.code || null;
      payment.failureDescription = failure.description || null;
      payment.providerPayload = failure.payload || payment.providerPayload;
      await payment.save({ transaction });
    }
    await refundBookingCredits(booking, transaction, failure.code || 'payment_failed');
    await booking.save({ transaction });
    return booking;
  });
}

function refundReceipt(bookingId, failedRefundId = '') {
  const retrySuffix = failedRefundId ? `_${failedRefundId.slice(-6)}` : '';
  return `booking_refund_${bookingId.replace(/-/g, '').slice(0, 18)}${retrySuffix}`;
}

function refundState(providerStatus) {
  if (providerStatus === 'processed') return 'refunded';
  if (providerStatus === 'failed') return 'refund_failed';
  return 'refund_pending';
}

export async function applyBookingRefund(refundEntity) {
  if (!refundEntity?.id || !refundEntity.payment_id) return null;
  return seekerDb.transaction(async (transaction) => {
    const payment = await BookingPayment.findOne({
      where: {
        [Op.or]: [
          { razorpayRefundId: refundEntity.id },
          { razorpayPaymentId: refundEntity.payment_id },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!payment) return null;
    if (payment.razorpayRefundId
      && payment.razorpayRefundId !== refundEntity.id
      && payment.refundStatus !== 'refund_failed') return payment;
    const booking = await Booking.findByPk(payment.bookingId, { transaction, lock: transaction.LOCK.UPDATE });
    const incomingStatus = refundState(refundEntity.status);
    const status = payment.refundStatus === 'refunded' ? 'refunded' : incomingStatus;
    payment.razorpayRefundId = refundEntity.id;
    payment.refundStatus = status;
    payment.refundedAmount = Number(refundEntity.amount || payment.amount || 0);
    payment.refundRequestedAt = payment.refundRequestedAt || new Date();
    payment.refundedAt = status === 'refunded' ? (payment.refundedAt || new Date()) : null;
    payment.refundFailureCode = status === 'refund_failed' ? 'RAZORPAY_REFUND_FAILED' : null;
    payment.refundFailureDescription = status === 'refund_failed'
      ? 'Razorpay reported that the refund failed'
      : null;
    payment.status = status;
    await payment.save({ transaction });
    if (booking?.status === 'declined') {
      booking.paymentStatus = status;
      await booking.save({ transaction });
    }
    return payment;
  });
}

export async function requestBookingRefund(bookingId) {
  const claimed = await seekerDb.transaction(async (transaction) => {
    const payment = await BookingPayment.findOne({ where: { bookingId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!payment || !payment.razorpayPaymentId || payment.amount <= 0) return null;
    if (payment.refundStatus === 'refunded'
      || (payment.razorpayRefundId && payment.refundStatus !== 'refund_failed')) {
      return { payment, skip: true };
    }
    const claimIsFresh = payment.refundStatus === 'refund_creating'
      && payment.refundRequestedAt
      && Date.now() - new Date(payment.refundRequestedAt).getTime() < 60_000;
    if (claimIsFresh) return { payment, skip: true };
    const failedRefundId = payment.refundStatus === 'refund_failed' ? payment.razorpayRefundId : null;
    if (failedRefundId) payment.razorpayRefundId = null;
    payment.refundStatus = 'refund_creating';
    payment.status = 'refund_pending';
    payment.refundRequestedAt = new Date();
    payment.refundFailureCode = null;
    payment.refundFailureDescription = null;
    await payment.save({ transaction });
    return { payment, failedRefundId, skip: false };
  });
  if (!claimed || claimed.skip) return claimed?.payment || null;

  const payment = claimed.payment;
  const receipt = refundReceipt(bookingId, claimed.failedRefundId || '');
  try {
    const existingRefunds = await getRazorpayClient().payments.fetchMultipleRefund(payment.razorpayPaymentId, { count: 100 });
    const existing = existingRefunds.items?.find((refund) => (
      refund.status !== 'failed'
      && (refund.receipt === receipt || refund.notes?.bookingId === bookingId)
    ));
    const refund = existing || await getRazorpayClient().payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount,
      speed: 'normal',
      receipt,
      notes: { bookingId, paymentRecordId: payment.id },
    });
    return applyBookingRefund(refund);
  } catch (error) {
    await seekerDb.transaction(async (transaction) => {
      const current = await BookingPayment.findByPk(payment.id, { transaction, lock: transaction.LOCK.UPDATE });
      const booking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!current || current.razorpayRefundId) return;
      current.status = 'refund_failed';
      current.refundStatus = 'refund_failed';
      current.refundFailureCode = error.error?.code || error.code || 'REFUND_REQUEST_FAILED';
      current.refundFailureDescription = error.error?.description || error.message;
      await current.save({ transaction });
      if (booking?.status === 'declined') {
        booking.paymentStatus = 'refund_failed';
        await booking.save({ transaction });
      }
    });
    return BookingPayment.findByPk(payment.id);
  }
}

export async function processBookingWebhook(payload) {
  const refundEntity = payload?.payload?.refund?.entity;
  if (['refund.created', 'refund.processed', 'refund.failed'].includes(payload.event)) {
    const payment = await applyBookingRefund(refundEntity);
    return payment
      ? { processed: true }
      : { processed: false, reason: 'No booking payment matches this refund' };
  }
  const paymentEntity = payload?.payload?.payment?.entity;
  const orderEntity = payload?.payload?.order?.entity;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  if (!orderId) return { processed: false, reason: 'No Razorpay order ID in event' };
  const payment = await BookingPayment.findOne({ where: { razorpayOrderId: orderId } });
  if (!payment) return { processed: false, reason: 'No booking payment matches this order' };
  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    await confirmBookingPayment(payment.bookingId, paymentEntity?.id);
    return { processed: true };
  }
  if (payload.event === 'payment.failed') {
    await failBookingPayment(payment.bookingId, {
      code: paymentEntity?.error_code || 'PAYMENT_FAILED',
      description: paymentEntity?.error_description,
      payload: { payment: paymentEntity },
    });
    return { processed: true };
  }
  return { processed: false, reason: `Event ${payload.event} does not change a booking` };
}

export async function listSeekerBookings(seekerId) {
  await expirePendingBookings();
  const bookings = await Booking.findAll({
    where: { seekerId }, include: ['payments'], order: [['createdAt', 'DESC']],
  });
  return bookings.map(serializeBooking);
}

export async function getSeekerBooking(seekerId, bookingId) {
  await expirePendingBookings();
  const booking = await Booking.findOne({ where: { id: bookingId, seekerId }, include: ['payments'] });
  return booking ? serializeBooking(booking) : null;
}

export { serializeBooking };
