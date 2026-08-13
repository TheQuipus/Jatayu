import crypto from 'crypto';
import { UniqueConstraintError } from 'sequelize';
import { getRazorpayKeySecret, getRazorpayWebhookSecret } from '../../config/razorpay.js';
import RazorpayWebhookEvent from '../../models/seeker/RazorpayWebhookEvent.js';

function signaturesMatch(expectedSignature, suppliedSignature) {
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const suppliedBuffer = Buffer.from(suppliedSignature, 'utf8');

  return expectedBuffer.length === suppliedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function verifyRazorpayWebhookSignature(rawBody, suppliedSignature) {
  if (!Buffer.isBuffer(rawBody) || !suppliedSignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', getRazorpayWebhookSecret())
    .update(rawBody)
    .digest('hex');

  return signaturesMatch(expectedSignature, suppliedSignature);
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return signaturesMatch(expectedSignature, signature);
}

export async function storeRazorpayWebhookEvent({ eventId, eventType, payload }) {
  try {
    const [event, created] = await RazorpayWebhookEvent.findOrCreate({
      where: { eventId },
      defaults: {
        eventId,
        eventType,
        payload,
        status: 'received',
      },
    });

    return { event, created };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const event = await RazorpayWebhookEvent.findOne({ where: { eventId } });
      return { event, created: false };
    }
    throw error;
  }
}
