import { Op } from 'sequelize';
import { Booking, BookingMessage } from '../models/index.js';

function ownership(role, userId) { return role === 'expert' ? { expertId: userId } : { seekerId: userId }; }
async function ownedBooking(role, userId, bookingId) {
  const booking = await Booking.findOne({ where: { id: bookingId, ...ownership(role, userId) } });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  return booking;
}
function assertCanSend(booking) {
  if (booking.status !== 'confirmed') throw new Error('CHAT_NOT_ACTIVE');
  if (Date.now() > new Date(booking.scheduledEndAt).getTime()) throw new Error('CHAT_CLOSED');
}
export function serializeMessage(record) {
  const data = record.toJSON ? record.toJSON() : record;
  return { id: data.id, bookingId: data.bookingId, sender: data.senderType, text: data.message,
    timestamp: data.createdAt, deliveredAt: data.deliveredAt, readAt: data.readAt };
}
export async function listBookingMessages(role, userId, bookingId, { before, limit = 50 } = {}) {
  await ownedBooking(role, userId, bookingId);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const where = { bookingId };
  if (before) { const date = new Date(before); if (!Number.isNaN(date.getTime())) where.createdAt = { [Op.lt]: date }; }
  const rows = await BookingMessage.findAll({ where, order: [['createdAt', 'DESC']], limit: safeLimit });
  return rows.reverse().map(serializeMessage);
}
export async function createBookingMessage(role, userId, bookingId, input) {
  const booking = await ownedBooking(role, userId, bookingId); assertCanSend(booking);
  const message = String(input.message || '').trim();
  const clientMessageId = String(input.clientMessageId || '').trim();
  if (!message || message.length > 2000 || !clientMessageId || clientMessageId.length > 100) throw new Error('INVALID_MESSAGE');
  const [record] = await BookingMessage.findOrCreate({ where: { senderType: role, senderId: userId, clientMessageId },
    defaults: { bookingId, senderType: role, senderId: userId, clientMessageId, message, deliveredAt: new Date() } });
  if (record.bookingId !== bookingId) throw new Error('INVALID_MESSAGE');
  return { booking, message: serializeMessage(record) };
}
export async function markBookingMessagesRead(role, userId, bookingId) {
  await ownedBooking(role, userId, bookingId);
  await BookingMessage.update({ readAt: new Date() }, { where: { bookingId, senderType: { [Op.ne]: role }, readAt: null } });
  return { success: true };
}
