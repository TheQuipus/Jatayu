import Notification from '../models/Notification.js';
import { listNotifications } from '../services/notificationService.js';

export async function getNotifications(req, res) {
  res.json(await listNotifications(req.user.role, req.user.id, req.query));
}
export async function markNotificationRead(req, res) {
  const item = await Notification.findOne({ where: { id: req.params.id, recipientType: req.user.role, recipientId: req.user.id } });
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  item.readAt ||= new Date(); await item.save(); return res.json({ notification: item });
}
export async function markAllNotificationsRead(req, res) {
  await Notification.update({ readAt: new Date() }, { where: { recipientType: req.user.role, recipientId: req.user.id, readAt: null } });
  return res.json({ success: true });
}
