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

  // Gemini / Fallback AI
  GEMINI_API_KEY: ['AI_FALLBACK_API_KEY'],
  AI_FALLBACK_API_KEY: ['GEMINI_API_KEY'],
};

export async function getSetting(key, defaultValue = '') {
  // 1. HIGHEST PRIORITY: Check process.env primary key
  if (process.env[key] !== undefined && process.env[key] !== null && String(process.env[key]).trim() !== '') {
    return String(process.env[key]).trim();
  }

  // 2. HIGHEST PRIORITY: Check process.env aliases
  const aliases = KEY_ALIASES[key] || [];
  for (const alias of aliases) {
    if (process.env[alias] !== undefined && process.env[alias] !== null && String(process.env[alias]).trim() !== '') {
      return String(process.env[alias]).trim();
    }
  }

  try {
    // 3. Fallback: Try finding primary key in DB
    const record = await Setting.findByPk(key);
    if (record && record.value !== undefined && record.value !== null && String(record.value).trim() !== '') {
      return record.value;
    }

    // 4. Fallback: Try finding aliases in DB
    for (const alias of aliases) {
      const aliasRecord = await Setting.findByPk(alias);
      if (aliasRecord && aliasRecord.value !== undefined && aliasRecord.value !== null && String(aliasRecord.value).trim() !== '') {
        return aliasRecord.value;
      }
    }
  } catch (err) {
    console.error(`Error fetching setting ${key} from DB:`, err.message);
  }

  return defaultValue;
}

export async function getSettingBool(key, defaultValue = false) {
  const value = await getSetting(key);
  if (value === '') return defaultValue;
  return value === 'true';
}

/**
 * Read a runtime-managed setting only from the admin database.
 * Unlike getSetting(), this intentionally has no process.env fallback.
 */
export async function getDatabaseSetting(key, defaultValue = '') {
  try {
    const keys = [key, ...(KEY_ALIASES[key] || [])];
    for (const candidate of keys) {
      const record = await Setting.findByPk(candidate);
      if (record && record.value !== undefined && record.value !== null && record.value !== '') {
        return record.value;
      }
    }
  } catch (error) {
    console.error(`Error fetching database-only setting ${key}:`, error.message);
  }
  return defaultValue;
}

export async function getDatabaseSettingBool(key, defaultValue = false) {
  const value = await getDatabaseSetting(key);
  if (value === '') return defaultValue;
  return value === 'true';
}
