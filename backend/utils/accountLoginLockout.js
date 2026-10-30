import { Setting } from '../models/index.js';
import { sendAccountLockedEmail } from './emailService.js';

export const LOGIN_LOCKOUT_THRESHOLD = 5;
export const LOGIN_LOCKOUT_MINUTES = 10;
export const LOGIN_LOCKOUT_PREFIX = '_PASSWORD_LOGIN_LOCKOUT:';
export const LOGIN_IP_LOCKOUT_THRESHOLD = 20;
export const LOGIN_IP_LOCKOUT_MINUTES = 10;
export const LOGIN_IP_LOCKOUT_PREFIX = '_PASSWORD_LOGIN_IP_LOCKOUT:';

const LOGIN_LOCKOUT_DURATION_MS = LOGIN_LOCKOUT_MINUTES * 60 * 1000;
const LOGIN_IP_LOCKOUT_DURATION_MS = LOGIN_IP_LOCKOUT_MINUTES * 60 * 1000;

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

export function buildPasswordLoginRateLimitResponse(lockedUntil) {
  const retryAfterSeconds = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
  return {
    code: 'IP_RATE_LIMITED',
    message: `Too many failed password attempts from this IP. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
    lockedUntil: new Date(lockedUntil).toISOString(),
    retryAfterSeconds,
  };
}

export function normalizeClientIpAddress(sourceIp) {
  const candidate = Array.isArray(sourceIp) ? sourceIp[0] : String(sourceIp || '').trim();
  if (!candidate) return 'unknown';
  const forwarded = candidate.split(',')[0].trim();
  return forwarded.replace(/^::ffff:/, '') || 'unknown';
}

export function getClientIpAddress(req) {
  return normalizeClientIpAddress(req?.ip || req?.socket?.remoteAddress || 'unknown');
}

function settingKey(accountType, accountId) {
  return `${LOGIN_LOCKOUT_PREFIX}${accountType}:${accountId}`;
}

function ipSettingKey(ipAddress) {
  const normalized = normalizeClientIpAddress(ipAddress);
  if (!normalized || normalized === 'unknown') return null;
  return `${LOGIN_IP_LOCKOUT_PREFIX}${normalized}`;
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

export async function getPasswordLoginIpLockout(ipAddress) {
  const key = ipSettingKey(ipAddress);
  if (!key) return null;
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

export async function recordFailedPasswordLogin(accountType, account, sourceIp) {
  let lockedUntil = null;
  let shouldNotify = false;

  if (account) {
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
      const nextLockedUntil = failedAttempts >= LOGIN_LOCKOUT_THRESHOLD
        ? now + LOGIN_LOCKOUT_DURATION_MS
        : null;

      row.value = JSON.stringify({ failedAttempts, lockedUntil: nextLockedUntil });
      await row.save({ transaction });

      return { lockedUntil: nextLockedUntil, shouldNotify: Boolean(nextLockedUntil) };
    });
    lockedUntil = result.lockedUntil;
    shouldNotify = result.shouldNotify;
  }

  let ipLockedUntil = null;
  const clientIp = normalizeClientIpAddress(sourceIp);
  if (clientIp && clientIp !== 'unknown') {
    const ipKey = ipSettingKey(clientIp);
    if (ipKey) {
      const ipResult = await Setting.sequelize.transaction(async (transaction) => {
        const row = await lockSettingRow(ipKey, transaction);
        const state = parseState(row.value);
        const now = Date.now();
        if (state.lockedUntil && state.lockedUntil > now) {
          return { lockedUntil: state.lockedUntil };
        }
        const failures = state.lockedUntil ? 0 : Number(state.failedAttempts) || 0;
        const failedAttempts = failures + 1;
        const nextLockedUntil = failedAttempts >= LOGIN_IP_LOCKOUT_THRESHOLD ? now + LOGIN_IP_LOCKOUT_DURATION_MS : null;
        row.value = JSON.stringify({ failedAttempts, lockedUntil: nextLockedUntil });
        await row.save({ transaction });
        return { lockedUntil: nextLockedUntil };
      });
      ipLockedUntil = ipResult.lockedUntil;
    }
  }

  if (account && shouldNotify) {
    try {
      await sendAccountLockedEmail({
        recipientEmail: account.email,
        lockoutMinutes: LOGIN_LOCKOUT_MINUTES,
      });
    } catch (error) {
      console.error(`[Login Lockout] Failed to send account lock email for ${accountType} account ${account.id}:`, error.message);
    }
  }

  return { lockedUntil, ipLockedUntil };
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

export async function clearPasswordLoginIpFailures(ipAddress) {
  const key = ipSettingKey(ipAddress);
  if (!key) return { lockedUntil: null };
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