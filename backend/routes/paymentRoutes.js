import express from 'express';
import { getRazorpayConfig } from '../controllers/payment/razorpayController.js';

const router = express.Router();

router.get('/razorpay/config', getRazorpayConfig);

export default router;
