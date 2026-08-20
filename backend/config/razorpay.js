import Razorpay from 'razorpay';

const REQUIRED_RAZORPAY_ENV_VARS = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
];

let razorpayClient;

export function validateRazorpayConfig() {
  const missingVariables = REQUIRED_RAZORPAY_ENV_VARS.filter(
    (variableName) => !process.env[variableName]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(`Missing required Razorpay configuration: ${missingVariables.join(', ')}`);
  }
}

export function getRazorpayPublicConfig() {
  validateRazorpayConfig();
  return {
    enabled: true,
    keyId: process.env.RAZORPAY_KEY_ID.trim(),
  };
}

export function getRazorpayWebhookSecret() {
  validateRazorpayConfig();
  return process.env.RAZORPAY_WEBHOOK_SECRET.trim();
}

export function getRazorpayKeySecret() {
  validateRazorpayConfig();
  return process.env.RAZORPAY_KEY_SECRET.trim();
}

export function getRazorpayClient() {
  validateRazorpayConfig();

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });
  }

  return razorpayClient;
}
