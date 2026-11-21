import express from 'express';
import {
  createSupportTicket,
  getSupportMe,
  listMySupportTickets,
} from '../controllers/supportController.js';
import { protectNotification } from '../middleware/notificationAuthMiddleware.js';

const router = express.Router();

router.use(protectNotification);

router.get('/me', getSupportMe);
router.get('/tickets', listMySupportTickets);
router.post('/tickets', createSupportTicket);

export default router;
