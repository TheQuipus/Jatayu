import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Admin, Expert, ExpertSession, Seeker, Setting } from '../models/index.js';
import { sendGenericEmail } from './emailService.js';

export const PASSWORD_RESET_PREFIX = '_PASSWORD_RESET:';
export const PASSWORD_RESET_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;
const MODELS = { admin: Admin, expert: Expert, user: Seeker };

function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

function hashesMatch(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function readEntry(value) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
}

function frontendOrigin() {
  return (process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000').replace(/\/$/, '');
}

export function getPasswordRecoveryModel(role) {
  return MODELS[role] || null;
}

export async function issuePasswordReset({ role, email }) {
  const model = getPasswordRecoveryModel(role);
  const account = model ? await model.findOne({ where: { email } }) : null;
  if (!account) return;

  const key = `${PASSWORD_RESET_PREFIX}${role}:${account.id}`;
  const token = randomBytes(32).toString('base64url');
  let throttled = false;

  await Setting.sequelize.transaction(async (transaction) => {
    await Setting.findOrCreate({ where: { key }, defaults: { value: '{}' }, transaction });
    const row = await Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
    const previous = readEntry(row.value);
    if (previous.sentAt > Date.now() - PASSWORD_RESET_COOLDOWN_MS) {
      throttled = true;
      return;
    }
    row.value = JSON.stringify({ hash: digest(token), expiresAt: Date.now() + PASSWORD_RESET_TTL_MS, sentAt: Date.now() });
    await row.save({ transaction });
  });
  if (throttled) return;

  const query = new URLSearchParams({ role, id: account.id, token });
  const resetUrl = `${frontendOrigin()}/reset-password?${query}`;
  try {
    await sendGenericEmail({
      recipientEmail: account.email,
      recipientName: account.fullName,
      subject: 'Reset your Jatayu password',
      textContent: `Use this link to reset your Jatayu password: ${resetUrl} The link expires in 10 minutes.`,
      htmlContent: `<p>Use the link below to reset your Jatayu password. It expires in 10 minutes.</p><p><a href="${resetUrl.replaceAll('&', '&amp;')}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  } catch (error) {
    await Setting.destroy({ where: { key } });
    throw error;
  }
}

export async function consumePasswordReset({ role, userId, token, password }) {
  const model = getPasswordRecoveryModel(role);
  if (!model) return false;
  const key = `${PASSWORD_RESET_PREFIX}${role}:${userId}`;
  const account = await model.findByPk(userId);
  if (!account) return false;
  const passwordHash = await bcrypt.hash(password, 12);
  const consumed = await Setting.sequelize.transaction(async (transaction) => {
    const row = await Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) return false;
    const entry = readEntry(row.value);
    if (entry.expiresAt <= Date.now() || !hashesMatch(entry.hash, digest(token))) return false;
    await Setting.destroy({ where: { key }, transaction });
    return true;
  });
  if (!consumed) return false;

  account.password = passwordHash;
  await account.save({ fields: ['password'] });
  if (role === 'expert') {
    await ExpertSession.update({ revokedAt: new Date() }, { where: { expertId: userId, revokedAt: null } });
  }
  return true;
}
