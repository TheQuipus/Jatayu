import { Booking, BookingExtension, seekerDb } from '../models/index.js';
import { getRazorpayClient } from '../config/razorpay.js';
import { verifyRazorpayPaymentSignature } from './payment/razorpayService.js';
import { syncBookingToExternalCalendars } from './expertCalendarService.js';

export async function approveExtension(expertId, bookingId, decision, minutes) {
  const booking = await Booking.findOne({ where: { id: bookingId, expertId, status: 'confirmed' } });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  const extension = await BookingExtension.findOne({ where: { bookingId } });
  if (!extension || extension.status !== 'requested') throw new Error('EXTENSION_NOT_PENDING');
  if (decision === 'declined') {
    await extension.update({ status: 'declined', approvedMinutes: null, respondedAt: new Date() });
    return { extension, order: null };
  }
  const approvedMinutes = Number(minutes);
  if (!Number.isInteger(approvedMinutes) || approvedMinutes < 1 || approvedMinutes > extension.requestedMinutes) throw new Error('INVALID_EXTENSION_DURATION');
  const originalMinutes = Math.max(1, Math.round((new Date(booking.scheduledEndAt) - new Date(booking.scheduledStartAt)) / 60000));
  const consultationFee = Math.round(booking.consultationFee * approvedMinutes / originalMinutes);
  const gst = Math.round(booking.gst * approvedMinutes / originalMinutes);
  const totalAmount = consultationFee + gst;
  const order = await getRazorpayClient().orders.create({ amount: totalAmount, currency: booking.currency,
    receipt: `extension_${booking.id.replace(/-/g, '').slice(0, 28)}`, notes: { bookingId, type: 'session_extension' } });
  await extension.update({ status: 'payment_pending', approvedMinutes, consultationFee, gst, totalAmount,
    razorpayOrderId: order.id, respondedAt: new Date() });
  return { extension, order: { id: order.id, amount: totalAmount, currency: booking.currency } };
}

export async function verifyExtensionPayment(seekerId, bookingId, input) {
  if (!input.razorpayOrderId || !input.razorpayPaymentId || !input.razorpaySignature) throw new Error('MISSING_PAYMENT_FIELDS');
  const booking = await Booking.findOne({ where: { id: bookingId, seekerId, status: 'confirmed' } });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  const extension = await BookingExtension.findOne({ where: { bookingId } });
  if (!extension || extension.status !== 'payment_pending' || extension.razorpayOrderId !== input.razorpayOrderId) throw new Error('PAYMENT_MISMATCH');
  if (!verifyRazorpayPaymentSignature({ orderId: input.razorpayOrderId, paymentId: input.razorpayPaymentId, signature: input.razorpaySignature })) throw new Error('INVALID_PAYMENT_SIGNATURE');
  const payment = await getRazorpayClient().payments.fetch(input.razorpayPaymentId);
  if (payment.order_id !== extension.razorpayOrderId || Number(payment.amount) !== extension.totalAmount || payment.status !== 'captured') throw new Error('PAYMENT_MISMATCH');
  const result = await seekerDb.transaction(async (transaction) => {
    const lockedBooking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
    const lockedExtension = await BookingExtension.findOne({ where: { bookingId }, transaction, lock: transaction.LOCK.UPDATE });
    if (lockedExtension.status === 'paid') return { booking: lockedBooking, extension: lockedExtension };
    const extendedEndAt = new Date(new Date(lockedExtension.originalEndAt).getTime() + lockedExtension.approvedMinutes * 60000);
    lockedExtension.status = 'paid'; lockedExtension.razorpayPaymentId = payment.id;
    lockedExtension.paidAt = new Date(); lockedExtension.extendedEndAt = extendedEndAt;
    lockedBooking.scheduledEndAt = extendedEndAt;
    await lockedExtension.save({ transaction }); await lockedBooking.save({ transaction });
    return { booking: lockedBooking, extension: lockedExtension };
  });
  void syncBookingToExternalCalendars(result.booking).catch((error) => console.error('Calendar sync error:', error.message));
  return result;
}
