import { Setting } from '../models/index.js';

const SECRET_SETTING_KEYS = new Set([
  'AI_API_KEY',
  'AI_FALLBACK_API_KEY',
  'BREVO_API_KEY',
  'DIGILOCKER_CLIENT_SECRET',
  'GEMINI_API_KEY',
  'LINKEDIN_CLIENT_SECRET',
  'MSG91_AUTH_KEY',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SMS_API_SECRET',
  'SMS_AUTH_TOKEN',
  'SMTP_PASS',
  'TWILIO_AUTH_TOKEN',
]);

export const SECRET_VALUE_MASK = '********';

export const getSettings = async (req, res) => {
  try {
    const dbSettings = await Setting.findAll();
    return res.status(200).json(dbSettings.map((setting) => {
      const item = setting.toJSON();
      if (SECRET_SETTING_KEYS.has(item.key) && item.value) {
        item.value = SECRET_VALUE_MASK;
      }
      return item;
    }));
  } catch (error) {
    console.error('Get Settings Error:', error);
    return res.status(500).json({ message: 'Server error retrieving settings', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object is required' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      // A masked value means "keep the existing secret". Empty values are
      // also ignored so saving another settings section cannot erase secrets.
      if (SECRET_SETTING_KEYS.has(key) && (value === SECRET_VALUE_MASK || value === '')) {
        continue;
      }
      await Setting.upsert({
        key,
        value: String(value)
      });
    }

    return res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return res.status(500).json({ message: 'Server error updating settings', error: error.message });
  }
};
