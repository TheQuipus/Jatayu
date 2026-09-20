import Notification from '../models/Notification.js';
import Expert from '../models/Expert.js';
import Booking from '../models/seeker/Booking.js';
import { Op } from 'sequelize';
import { sendGenericEmail } from '../utils/emailService.js';
import { sendSms } from '../utils/smsService.js';
import { normalizeExpertNotificationPreferences } from '../config/expertNotificationPreferences.js';

let socketServer = null;
export function setNotificationSocketServer(io) { socketServer = io; }
export function emitRealtime(recipientType, recipientId, event, payload) {
  socketServer?.to(`notifications:${recipientType}:${recipientId}`).emit(event, payload);
}

export function expertNotificationCategory(eventType) {
  if (/^(booking\.(requested|poked)|session\.extension_requested)/.test(eventType)) return 'sessionRequests';
  if (/^(session\.(reminder|starting|completed))/.test(eventType)) return 'reminders';
  if (/^(chat\.|message\.)/.test(eventType)) return 'messages';
  if (/^(payout\.|settlement\.|earning\.)/.test(eventType)) return 'payouts';
  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function deliverExpertChannels(expert, category, preference, input) {
  const tasks = [];
  if (preference.email && expert.isEmailVerified && expert.email) {
    tasks.push(sendGenericEmail({
      recipientEmail: expert.email,
      recipientName: expert.fullName,
      subject: input.title,
      htmlContent: `<p>Hello ${escapeHtml(expert.fullName || 'there')},</p><p>${escapeHtml(input.body)}</p>`,
      textContent: input.body,
    }));
  }
  if (preference.sms && expert.isPhoneVerified && expert.phone) {
    tasks.push(sendSms({
      recipientPhone: expert.phone,
      message: input.body,
      templateKey: input.eventType.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      variables: { name: expert.fullName || 'Expert', title: input.title, message: input.body, ...(input.data || {}) },
    }));
  }
  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') console.error(`[Expert Notification] ${category} delivery failed:`, result.reason?.message || result.reason);
  }
}

export async function sendNotification(input) {
  let expert = null;
  let category = null;
  let preference = { push: true, email: false, sms: false };
  if (input.recipientType === 'expert') {
    category = expertNotificationCategory(input.eventType);
    if (category) {
      expert = await Expert.findByPk(input.recipientId, {
        attributes: ['email', 'phone', 'fullName', 'isEmailVerified', 'isPhoneVerified', 'notificationPreferences'],
      });
      preference = normalizeExpertNotificationPreferences(expert?.notificationPreferences)[category];
    }
  }
  const [notification, created] = input.dedupeKey
    ? await Notification.findOrCreate({ where: { dedupeKey: input.dedupeKey }, defaults: input })
    : [await Notification.create(input), true];
  const payload = notification.toJSON();
  if (created && preference.push) socketServer?.to(`notifications:${input.recipientType}:${input.recipientId}`).emit('notification:new', payload);
  if (created && expert && category && (preference.email || preference.sms)) {
    void deliverExpertChannels(expert, category, preference, input).catch((error) =>
      console.error('[Expert Notification] Channel delivery failed:', error.message));
  }
  return payload;
}

export async function sendUpcomingExpertReminders(now = new Date()) {
  const from = new Date(now.getTime() + 14 * 60000);
  const to = new Date(now.getTime() + 16 * 60000);
  const bookings = await Booking.findAll({
    where: { status: 'confirmed', scheduledStartAt: { [Op.gte]: from, [Op.lt]: to } },
    attributes: ['id', 'expertId', 'scheduledStartAt', 'consultationType'],
  });
  await Promise.all(bookings.map((booking) => sendNotification({
    recipientType: 'expert', recipientId: booking.expertId,
    eventType: 'session.reminder', dedupeKey: `session.reminder:15m:${booking.id}`,
    title: 'Session starts in 15 minutes',
    body: `Your ${booking.consultationType} consultation starts soon.`,
    href: `/expert/requests/${booking.id}/`, data: { bookingId: booking.id, scheduledStartAt: booking.scheduledStartAt },
  })));
  return bookings.length;
}

export async function listNotifications(recipientType, recipientId, { page = 1, limit = 30 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const safePage = Math.max(1, Number(page) || 1);
  const { rows, count } = await Notification.findAndCountAll({
    where: { recipientType, recipientId },
    order: [['createdAt', 'DESC']], limit: safeLimit, offset: (safePage - 1) * safeLimit,
  });
  return { items: rows, unreadCount: await Notification.count({ where: { recipientType, recipientId, readAt: null } }), pagination: { page: safePage, limit: safeLimit, total: count, pages: Math.ceil(count / safeLimit) } };
}
