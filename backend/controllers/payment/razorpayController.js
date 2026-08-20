import { getRazorpayPublicConfig } from '../../config/razorpay.js';
import {
  storeRazorpayWebhookEvent,
  updateRazorpayWebhookEvent,
  verifyRazorpayWebhookSignature,
} from '../../services/payment/razorpayService.js';
import { processBookingWebhook } from '../../services/seeker/bookingService.js';

export function getRazorpayConfig(req, res) {
  return res.status(200).json(getRazorpayPublicConfig());
}

export async function receiveRazorpayWebhook(req, res) {
  const signature = req.get('X-Razorpay-Signature');
  const eventId = req.get('X-Razorpay-Event-Id');

  if (!verifyRazorpayWebhookSignature(req.body, signature)) {
    return res.status(401).json({ message: 'Invalid Razorpay webhook signature' });
  }

  if (!eventId) {
    return res.status(400).json({ message: 'Missing Razorpay webhook event ID' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Invalid Razorpay webhook payload' });
  }

  if (!payload.event || typeof payload.event !== 'string') {
    return res.status(400).json({ message: 'Missing Razorpay webhook event type' });
  }

  try {
    const { event, created } = await storeRazorpayWebhookEvent({
      eventId,
      eventType: payload.event,
      payload,
    });

    if (created || event.status === 'failed') {
      try {
        const result = await processBookingWebhook(payload);
        await updateRazorpayWebhookEvent(event, {
          status: result.processed ? 'processed' : 'ignored',
          processedAt: new Date(),
          failureReason: result.reason || null,
        });
      } catch (processingError) {
        await updateRazorpayWebhookEvent(event, {
          status: 'failed',
          processedAt: new Date(),
          failureReason: processingError.message,
        });
        console.error('Process Razorpay Booking Webhook Error:', processingError);
        return res.status(500).json({ message: 'Unable to process Razorpay webhook event' });
      }
    }

    return res.status(200).json({
      received: true,
      duplicate: !created,
    });
  } catch (error) {
    console.error('Store Razorpay Webhook Error:', error);
    return res.status(500).json({ message: 'Unable to store Razorpay webhook event' });
  }
}
