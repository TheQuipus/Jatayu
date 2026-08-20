import twilio from 'twilio';
import { getSetting, getSettingBool } from './settingsHelper.js';

const OTP_EXPIRY_MINUTES = 10;
export const TEMP_SMS_OTP = '123456';

function hasPlaceholderCredential(value) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return (
    normalized.includes('your_twilio') ||
    normalized.includes('change_me') ||
    normalized.includes('placeholder')
  );
}

async function getSmsProvider() {
  const provider = await getSetting('SMS_PROVIDER', 'twilio');
  return provider.toLowerCase();
}

/**
 * Returns true when SMS credentials are configured for the active provider.
 */
export async function isSmsProviderConfigured() {
  const smsEnabled = await getSettingBool('SMS_ENABLED', true);
  if (!smsEnabled) return false;

  const provider = await getSmsProvider();

  if (provider === 'fast2sms') {
    const apiKey = await getSetting('SMS_API_KEY');
    return Boolean(apiKey && !hasPlaceholderCredential(apiKey));
  }

  if (provider === 'textlocal') {
    const apiKey = await getSetting('SMS_API_KEY');
    const senderId = await getSetting('SMS_SENDER_ID');
    return Boolean(
      apiKey &&
        senderId &&
        !hasPlaceholderCredential(apiKey) &&
        !hasPlaceholderCredential(senderId),
    );
  }

  const twilioAccountSid = await getSetting('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = await getSetting('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = await getSetting('TWILIO_PHONE_NUMBER');

  return Boolean(
    twilioAccountSid &&
      twilioAuthToken &&
      twilioPhoneNumber &&
      !hasPlaceholderCredential(twilioAccountSid) &&
      !hasPlaceholderCredential(twilioAuthToken) &&
      !hasPlaceholderCredential(twilioPhoneNumber),
  );
}

/**
 * Normalize a phone number to E.164 format.
 * If it already starts with '+', it's used as-is.
 * Otherwise, the default country code from settings is prepended.
 */
async function normalizePhone(phone) {
  if (!phone) return phone;
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  const digits = cleaned.replace(/^0+/, '');
  const defaultCountryCode = await getSetting('SMS_DEFAULT_COUNTRY_CODE', '+91');
  return `${defaultCountryCode}${digits}`;
}

/**
 * Extract a 10-digit Indian mobile number for Fast2SMS Quick route.
 */
function toIndianMobileNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits.slice(-10);
}

async function sendViaTwilio({ normalizedPhone, message }) {
  const twilioAccountSid = await getSetting('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = await getSetting('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = await getSetting('TWILIO_PHONE_NUMBER');

  const client = twilio(twilioAccountSid, twilioAuthToken);

  console.log(`[SMS] Sending OTP to ${normalizedPhone} from ${twilioPhoneNumber}`);
  await client.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to: normalizedPhone,
  });
}

async function sendViaFast2Sms({ recipientPhone, message }) {
  const apiKey = await getSetting('SMS_API_KEY');
  const numbers = toIndianMobileNumber(recipientPhone);

  console.log(`[SMS] Sending OTP via Fast2SMS to ${numbers}`);

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      numbers,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Fast2SMS request failed (${response.status}): ${JSON.stringify(data)}`);
  }

  if (data.return !== true) {
    throw new Error(`Fast2SMS error: ${JSON.stringify(data)}`);
  }
}

export async function sendOtpSms({ recipientPhone, otpCode }) {
  if (!recipientPhone) {
    throw new Error('Phone number is required to send SMS OTP.');
  }

  const provider = await getSmsProvider();
  const isConfigured = await isSmsProviderConfigured();
  const normalizedPhone = await normalizePhone(recipientPhone);
  const message = `Your Jatayu verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  if (!isConfigured) {
    console.log(`\n======================================================`);
    console.log(`[SMS OTP Temporary] Provider not configured — using code: ${TEMP_SMS_OTP}`);
    console.log(`To: ${normalizedPhone}`);
    console.log(`Configure SMS in Admin → Settings → SMS to enable dynamic OTP delivery.`);
    console.log(`======================================================\n`);
    return;
  }

  switch (provider) {
    case 'fast2sms':
      await sendViaFast2Sms({ recipientPhone: normalizedPhone, message });
      break;
    case 'textlocal':
      throw new Error('Textlocal SMS provider is not yet implemented.');
    case 'twilio':
    default:
      await sendViaTwilio({ normalizedPhone, message });
      break;
  }
}
