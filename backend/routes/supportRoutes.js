import express from 'express';
import {
  createMySupportReply,
  createSupportTicket,
  getMySupportTicketDetail,
  getSupportMe,
  listMySupportTickets,
} from '../controllers/supportController.js';
import { protectNotification } from '../middleware/notificationAuthMiddleware.js';

const router = express.Router();

router.use(protectNotification);

router.get('/me', getSupportMe);
router.get('/tickets', listMySupportTickets);
router.get('/tickets/:ticketId', getMySupportTicketDetail);
router.post('/tickets', createSupportTicket);
router.post('/tickets/:ticketId/replies', createMySupportReply);

export default router;
