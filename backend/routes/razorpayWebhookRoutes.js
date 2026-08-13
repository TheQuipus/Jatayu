import express from 'express';
import { receiveRazorpayWebhook } from '../controllers/payment/razorpayController.js';

const router = express.Router();

router.post('/razorpay', express.raw({ type: 'application/json' }), receiveRazorpayWebhook);

export default router;
