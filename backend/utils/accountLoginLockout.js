import { Setting } from '../models/index.js';
import { sendAccountLockedEmail } from './emailService.js';

export const LOGIN_LOCKOUT_THRESHOLD = 5;
export const LOGIN_LOCKOUT_MINUTES = 10;
export const LOGIN_LOCKOUT_PREFIX = '_PASSWORD_LOGIN_LOCKOUT:';

const LOGIN_LOCKOUT_DURATION_MS = LOGIN_LOCKOUT_MINUTES * 60 * 1000;

export function buildPasswordLoginLockedResponse(lockedUntil) {
  const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
  return {
    code: 'ACCOUNT_LOCKED',
    // This response intentionally identifies temporary lockout so the owner knows when to retry.
    message: `Too many failed password attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
    lockedUntil: new Date(lockedUntil).toISOString(),
    retryAfterSeconds,
  };
}

function settingKey(accountType, accountId) {
  return `${LOGIN_LOCKOUT_PREFIX}${accountType}:${accountId}`;
}

function parseState(value) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
}

async function lockSettingRow(key, transaction) {
  await Setting.findOrCreate({
    where: { key },
    defaults: { value: '{}' },
    transaction,
  });
  return Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
}

export async function getPasswordLoginLockout(accountType, accountId) {
  const key = settingKey(accountType, accountId);
  return Setting.sequelize.transaction(async (transaction) => {
    const row = await Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) return null;

    const state = parseState(row.value);
    if (state.lockedUntil && state.lockedUntil <= Date.now()) {
      await row.destroy({ transaction });
      return null;
    }

    return state.lockedUntil ? { lockedUntil: state.lockedUntil } : null;
  });
}

export async function recordFailedPasswordLogin(accountType, account) {
  const key = settingKey(accountType, account.id);
  const result = await Setting.sequelize.transaction(async (transaction) => {
    const row = await lockSettingRow(key, transaction);
    const state = parseState(row.value);
    const now = Date.now();

    if (state.lockedUntil && state.lockedUntil > now) {
      return { lockedUntil: state.lockedUntil, shouldNotify: false };
    }

    const failures = state.lockedUntil ? 0 : Number(state.failedAttempts) || 0;
    const failedAttempts = failures + 1;
    const lockedUntil = failedAttempts >= LOGIN_LOCKOUT_THRESHOLD
      ? now + LOGIN_LOCKOUT_DURATION_MS
      : null;

    row.value = JSON.stringify({
      failedAttempts,
      lockedUntil,
    });
    await row.save({ transaction });

    return { lockedUntil, shouldNotify: Boolean(lockedUntil) };
  });

  // Notify once when the lock is created; delivery failure does not unlock or retry it.
  if (result.shouldNotify) {
    try {
      await sendAccountLockedEmail({
        recipientEmail: account.email,
        lockoutMinutes: LOGIN_LOCKOUT_MINUTES,
      });
    } catch (error) {
      console.error(`[Login Lockout] Failed to send account lock email for ${accountType} account ${account.id}:`, error.message);
    }
  }

  return { lockedUntil: result.lockedUntil };
}

export async function clearPasswordLoginFailures(accountType, accountId) {
  const key = settingKey(accountType, accountId);
  return Setting.sequelize.transaction(async (transaction) => {
    const row = await Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) return { lockedUntil: null };

    const state = parseState(row.value);
    if (state.lockedUntil && state.lockedUntil > Date.now()) {
      return { lockedUntil: state.lockedUntil };
    }

    await row.destroy({ transaction });
    return { lockedUntil: null };
  });
}