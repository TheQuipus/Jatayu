import express from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';
import { protectNotification } from '../middleware/notificationAuthMiddleware.js';
const router = express.Router();
router.use(protectNotification);
router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
export default router;
