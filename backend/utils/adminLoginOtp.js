import { createHash, randomInt } from 'node:crypto';
import { Setting } from '../models/index.js';
import { sendGenericEmail, isSmtpConfigured } from './emailService.js';
import { getDatabaseSetting, getDatabaseSettingBool } from './settingsHelper.js';

export const ADMIN_OTP_PREFIX = '_ADMIN_LOGIN_OTP:';
const digest = (id, code) => createHash('sha256').update(`${id}:${code}`).digest('hex');

export async function requestAdminOtp(admin) {
  const enabled = await getDatabaseSettingBool('EMAIL_ENABLED', true);
  const provider = await getDatabaseSetting('EMAIL_PROVIDER', 'smtp');
  const configured = provider === 'brevo'
    ? Boolean(await getDatabaseSetting('BREVO_API_KEY'))
    : await isSmtpConfigured();
  if (!enabled || !configured) throw new Error('Configure admin email delivery before signing in.');
  const key = ADMIN_OTP_PREFIX + admin.id;
  const code = String(randomInt(100000, 1000000));
  await Setting.sequelize.transaction(async (transaction) => {
    // Ensure a lockable row exists for concurrent requests.
    await Setting.findOrCreate({ where: { key }, defaults: { value: '{}' }, transaction });
    const row = await Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
    const previous = JSON.parse(row.value);
    if (previous.sentAt > Date.now() - 60000) throw new Error('Please wait one minute before requesting another code.');
    row.value = JSON.stringify({ hash: digest(admin.id, code), expiresAt: Date.now() + 10 * 60000, sentAt: Date.now(), attempts: 0 });
    await row.save({ transaction });
  });
  try {
    await sendGenericEmail({ recipientEmail: admin.email, subject: 'Your Jatayu admin login code', textContent: `Your admin login code is ${code}. It expires in 10 minutes.`, htmlContent: `<p>Your admin login code is <strong>${code}</strong>. It expires in 10 minutes.</p>` });
  } catch (error) {
    await Setting.destroy({ where: { key } });
    throw error;
  }
}

export async function verifyAdminOtp(adminId, code) {
  return Setting.sequelize.transaction(async (transaction) => {
    const row = await Setting.findByPk(ADMIN_OTP_PREFIX + adminId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) return false;
    const entry = JSON.parse(row.value);
    if (!entry.hash || entry.expiresAt <= Date.now() || entry.attempts >= 5) return false;
    const valid = typeof code === 'string' && /^\d{6}$/.test(code) && entry.hash === digest(adminId, code);
    row.value = JSON.stringify({ ...entry, attempts: entry.attempts + 1, ...(valid ? { hash: null } : {}) });
    await row.save({ transaction });
    return valid;
  });
}
