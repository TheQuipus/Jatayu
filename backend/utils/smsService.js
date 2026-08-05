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

/**
 * Returns true when Twilio SMS credentials are configured via admin settings or env.
 */
export async function isSmsProviderConfigured() {
  const twilioAccountSid = await getSetting('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = await getSetting('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = await getSetting('TWILIO_PHONE_NUMBER');
  const smsEnabled = await getSettingBool('SMS_ENABLED', true);

  return Boolean(
    smsEnabled &&
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
  // Strip any leading 0 (common for Indian numbers)
  const digits = cleaned.replace(/^0+/, '');
  const defaultCountryCode = await getSetting('SMS_DEFAULT_COUNTRY_CODE', '+91');
  return `${defaultCountryCode}${digits}`;
}

export async function sendOtpSms({ recipientPhone, otpCode }) {
  if (!recipientPhone) {
    throw new Error('Phone number is required to send SMS OTP.');
  }

  const twilioAccountSid = await getSetting('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = await getSetting('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = await getSetting('TWILIO_PHONE_NUMBER');

  const isConfigured = await isSmsProviderConfigured();

  // Normalize phone to E.164 format
  const normalizedPhone = await normalizePhone(recipientPhone);
  const message = `Your Jatayu verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  if (!isConfigured) {
    console.log(`\n======================================================`);
    console.log(`[SMS OTP Temporary] Provider not configured — using code: ${TEMP_SMS_OTP}`);
    console.log(`To: ${normalizedPhone}`);
    console.log(`Configure Twilio in Admin → Settings → SMS to enable dynamic OTP delivery.`);
    console.log(`======================================================\n`);
    return;
  }

  const client = twilio(twilioAccountSid, twilioAuthToken);

  console.log(`[SMS] Sending OTP to ${normalizedPhone} from ${twilioPhoneNumber}`);
  await client.messages.create({
    body: message,
    from: twilioPhoneNumber,
    to: normalizedPhone,
  });
}

