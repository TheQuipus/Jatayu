import Notification from '../models/Notification.js';

let socketServer = null;
export function setNotificationSocketServer(io) { socketServer = io; }

export async function sendNotification(input) {
  const [notification, created] = input.dedupeKey
    ? await Notification.findOrCreate({ where: { dedupeKey: input.dedupeKey }, defaults: input })
    : [await Notification.create(input), true];
  const payload = notification.toJSON();
  if (created) socketServer?.to(`notifications:${input.recipientType}:${input.recipientId}`).emit('notification:new', payload);
  return payload;
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
