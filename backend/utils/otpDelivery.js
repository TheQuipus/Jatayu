import { triggerNotification } from './templateNotificationService.js';
import { isSmsProviderConfigured } from './smsService.js';
import { getSettingBool } from './settingsHelper.js';

export class OtpDeliveryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OtpDeliveryError';
  }
}

/**
 * Deliver OTP via configured channels. At least one channel must succeed.
 * Unconfigured SMS is not treated as a successful delivery (avoids masking email failures).
 */
export async function deliverOtpChannels({ email, phone, fullName, otpCode, triggerKey = 'EXPERT_OTP', logPrefix = 'OTP' }) {
  const emailEnabled = await getSettingBool('EMAIL_ENABLED', true);
  const smsConfigured = await isSmsProviderConfigured();

  let delivered = false;
  let lastError;

  if (emailEnabled) {
    try {
      const result = await triggerNotification(triggerKey, {
        email,
        phone: null, // send email channel
        name: fullName || 'there',
        data: { otp: otpCode },
      });
      if (result.emailSent) delivered = true;
      else if (result.errors.length) lastError = new Error(result.errors[0]);
    } catch (err) {
      lastError = err;
      console.warn(`[${logPrefix} Delivery Warning] Email failed:`, err.message);
    }
  }

  if (smsConfigured) {
    try {
      const result = await triggerNotification(triggerKey, {
        email: null,
        phone, // send SMS channel
        name: fullName || 'there',
        data: { otp: otpCode },
      });
      if (result.smsSent) delivered = true;
      else if (result.errors.length && !delivered) lastError = new Error(result.errors[0]);
    } catch (err) {
      console.warn(`[${logPrefix} Delivery Warning] SMS failed:`, err.message);
      if (!delivered) lastError = err;
    }
  }

  if (!delivered) {
    throw new OtpDeliveryError(
      lastError?.message ||
        'Could not send verification code. Please check your email settings or try again later.',
    );
  }
}

export function handleOtpDeliveryError(error, res, actionLabel) {
  if (error?.name === 'OtpDeliveryError') {
    console.error(`${actionLabel} OTP delivery failed:`, error.message);
    return res.status(503).json({
      message: 'Could not send verification code to your email or phone. Please try again in a moment.',
      code: 'OTP_DELIVERY_FAILED',
      error: error.message,
    });
  }
  return null;
}
