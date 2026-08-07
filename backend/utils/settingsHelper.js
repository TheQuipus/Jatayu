import { Setting } from '../models/index.js';

const KEY_ALIASES = {
  // SMS (provider-agnostic keys with Twilio fallbacks)
  SMS_API_KEY: ['TWILIO_ACCOUNT_SID'],
  SMS_API_SECRET: ['TWILIO_AUTH_TOKEN'],
  SMS_SENDER_ID: ['TWILIO_PHONE_NUMBER'],
  TWILIO_ACCOUNT_SID: ['SMS_API_KEY'],
  TWILIO_AUTH_TOKEN: ['SMS_API_SECRET'],
  TWILIO_PHONE_NUMBER: ['SMS_SENDER_ID'],
  
  // Google
  GOOGLE_LOGIN_ENABLED: ['GOOGLE_ENABLE_SIGN_IN'],
  
  // LinkedIn
  LINKEDIN_LOGIN_ENABLED: ['LINKEDIN_ENABLE_SIGN_IN'],
  
  // SMTP / Email
  SMTP_USER: ['SMTP_USERNAME'],
  SMTP_PASS: ['SMTP_PASSWORD'],
  FROM_EMAIL: ['EMAIL_FROM_EMAIL'],
  EMAIL_PROVIDER: ['EMAIL_PROVIDER'],
  BREVO_API_KEY: ['BREVO_API_KEY'],
};

export async function getSetting(key, defaultValue = '') {
  try {
    // 1. Try finding primary key in DB
    const record = await Setting.findByPk(key);
    if (record && record.value !== undefined && record.value !== null && record.value !== '') {
      return record.value;
    }

    // 2. Try finding aliases in DB
    const aliases = KEY_ALIASES[key] || [];
    for (const alias of aliases) {
      const aliasRecord = await Setting.findByPk(alias);
      if (aliasRecord && aliasRecord.value !== undefined && aliasRecord.value !== null && aliasRecord.value !== '') {
        return aliasRecord.value;
      }
    }
  } catch (err) {
    console.error(`Error fetching setting ${key} from DB:`, err.message);
  }

  // 3. Fallback to process.env
  if (process.env[key]) {
    return process.env[key];
  }
  
  const aliases = KEY_ALIASES[key] || [];
  for (const alias of aliases) {
    if (process.env[alias]) {
      return process.env[alias];
    }
  }

  return defaultValue;
}

export async function getSettingBool(key, defaultValue = false) {
  const value = await getSetting(key);
  if (value === '') return defaultValue;
  return value === 'true';
}
