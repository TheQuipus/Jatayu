import { createHash } from 'node:crypto';
import { Setting } from '../models/index.js';

export const MAX_RESEND_ATTEMPTS = 3;
export const RESEND_BLOCK_DURATION_MS = 30 * 60 * 1000;
export const RESEND_WINDOW_MS = 30 * 60 * 1000;
export const OTP_RESEND_LIMIT_PREFIX = '_OTP_RESEND_LIMIT:';

const EMPTY_STATE = Object.freeze({
  count: 0,
  firstAttemptAt: null,
  blockedUntil: null,
});

export function normalizeResendEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizeResendPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function hashIdentifier(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function buildResendLimitKeys({ email, phone } = {}) {
  const keys = [];
  const normalizedEmail = normalizeResendEmail(email);
  if (normalizedEmail) {
    keys.push(`${OTP_RESEND_LIMIT_PREFIX}email:${hashIdentifier(normalizedEmail)}`);
  }
  const normalizedPhone = normalizeResendPhone(phone);
  if (normalizedPhone) {
    keys.push(`${OTP_RESEND_LIMIT_PREFIX}phone:${hashIdentifier(normalizedPhone)}`);
  }
  return keys.sort();
}

function parseRawState(rawValue) {
  try {
    const parsed = JSON.parse(rawValue || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...EMPTY_STATE };
    }
    return {
      count: Math.max(0, Number(parsed.count) || 0),
      firstAttemptAt: typeof parsed.firstAttemptAt === 'number' && Number.isFinite(parsed.firstAttemptAt)
        ? parsed.firstAttemptAt
        : null,
      blockedUntil: typeof parsed.blockedUntil === 'number' && Number.isFinite(parsed.blockedUntil)
        ? parsed.blockedUntil
        : null,
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function normalizeStateForNow(rawValue, now) {
  const state = parseRawState(rawValue);
  if (state.blockedUntil !== null && state.blockedUntil <= now) {
    return { ...EMPTY_STATE, expired: true };
  }
  if (
    state.count > 0 &&
    state.count < MAX_RESEND_ATTEMPTS &&
    state.firstAttemptAt !== null &&
    state.firstAttemptAt + RESEND_WINDOW_MS <= now
  ) {
    return { ...EMPTY_STATE, expired: true };
  }
  return { ...state, expired: false };
}

async function lockSettingRow(key, transaction) {
  await Setting.findOrCreate({
    where: { key },
    defaults: { value: JSON.stringify(EMPTY_STATE) },
    transaction,
  });
  return Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
}

export function buildResendBlockedPayload({ blockedUntil, retryAfterSeconds }) {
  return {
    message: 'Resend OTP limit reached. Please try again in 30 mins.',
    code: 'OTP_RESEND_LIMIT_REACHED',
    resendAttempts: MAX_RESEND_ATTEMPTS,
    maxResendAttempts: MAX_RESEND_ATTEMPTS,
    blockedUntil,
    retryAfterSeconds,
  };
}

/**
 * Read-only lookup of current resend attempt count and block status.
 * Does not create rows or mutate state.
 */
export async function getOtpResendStatus({ email, phone, now = Date.now() } = {}) {
  const keys = buildResendLimitKeys({ email, phone });
  if (keys.length === 0) {
    return {
      resendAttempts: 0,
      maxResendAttempts: MAX_RESEND_ATTEMPTS,
      blockedUntil: null,
    };
  }

  const rows = await Promise.all(keys.map((key) => Setting.findByPk(key)));
  let maxCount = 0;
  let maxBlockedUntil = null;

  for (const row of rows) {
    if (!row) continue;
    const state = normalizeStateForNow(row.value, now);
    if (state.count > maxCount) {
      maxCount = state.count;
    }
    if (state.blockedUntil !== null && state.blockedUntil > now) {
      if (maxBlockedUntil === null || state.blockedUntil > maxBlockedUntil) {
        maxBlockedUntil = state.blockedUntil;
      }
    }
  }

  const blocked = maxBlockedUntil !== null;
  return {
    resendAttempts: blocked ? MAX_RESEND_ATTEMPTS : Math.min(MAX_RESEND_ATTEMPTS, maxCount),
    maxResendAttempts: MAX_RESEND_ATTEMPTS,
    blockedUntil: blocked ? new Date(maxBlockedUntil).toISOString() : null,
  };
}

/**
 * Atomically checks and reserves one resend attempt across email and phone keys.
 * Commits before OTP delivery so no DB lock is held during network I/O.
 */
export async function reserveResendAttempt({ email, phone, now = Date.now() } = {}) {
  const keys = buildResendLimitKeys({ email, phone });
  if (keys.length === 0) {
    return {
      blocked: false,
      resendAttempts: 0,
      maxResendAttempts: MAX_RESEND_ATTEMPTS,
      blockedUntil: null,
      reservation: null,
    };
  }

  return Setting.sequelize.transaction(async (transaction) => {
    const lockedRows = [];
    for (const key of keys) {
      const row = await lockSettingRow(key, transaction);
      const state = normalizeStateForNow(row.value, now);
      lockedRows.push({ key, row, state });
    }

    let activeBlockedUntil = null;
    for (const { state } of lockedRows) {
      if (state.blockedUntil !== null && state.blockedUntil > now) {
        if (activeBlockedUntil === null || state.blockedUntil > activeBlockedUntil) {
          activeBlockedUntil = state.blockedUntil;
        }
      }
    }

    if (activeBlockedUntil !== null) {
      return {
        blocked: true,
        resendAttempts: MAX_RESEND_ATTEMPTS,
        maxResendAttempts: MAX_RESEND_ATTEMPTS,
        blockedUntil: new Date(activeBlockedUntil).toISOString(),
        retryAfterSeconds: Math.max(1, Math.ceil((activeBlockedUntil - now) / 1000)),
      };
    }

    const nextCounts = lockedRows.map(({ state }) => Math.min(MAX_RESEND_ATTEMPTS, state.count + 1));
    const effectiveAttempts = Math.min(MAX_RESEND_ATTEMPTS, Math.max(...nextCounts));
    const nextBlockedUntil = effectiveAttempts >= MAX_RESEND_ATTEMPTS
      ? now + RESEND_BLOCK_DURATION_MS
      : null;

    for (let index = 0; index < lockedRows.length; index += 1) {
      const { row, state } = lockedRows[index];
      const nextCount = nextCounts[index];
      const nextFirstAttemptAt = state.firstAttemptAt !== null ? state.firstAttemptAt : now;
      row.value = JSON.stringify({
        count: nextCount,
        firstAttemptAt: nextFirstAttemptAt,
        blockedUntil: nextBlockedUntil,
      });
      await row.save({ transaction });
    }

    return {
      blocked: false,
      resendAttempts: effectiveAttempts,
      maxResendAttempts: MAX_RESEND_ATTEMPTS,
      blockedUntil: nextBlockedUntil ? new Date(nextBlockedUntil).toISOString() : null,
      reservation: {
        keys,
        released: false,
      },
    };
  });
}

/**
 * Compensating action called when OTP delivery fails after reserveResendAttempt.
 */
export async function releaseResendAttempt(reservation, { now = Date.now() } = {}) {
  if (!reservation || reservation.released || !Array.isArray(reservation.keys) || reservation.keys.length === 0) {
    return;
  }
  reservation.released = true;
  const keys = [...reservation.keys].sort();

  await Setting.sequelize.transaction(async (transaction) => {
    for (const key of keys) {
      const row = await Setting.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE });
      if (!row) continue;

      const state = normalizeStateForNow(row.value, now);
      const nextCount = Math.max(0, state.count - 1);

      if (nextCount === 0) {
        await row.destroy({ transaction });
        continue;
      }

      const nextBlockedUntil = nextCount < MAX_RESEND_ATTEMPTS ? null : state.blockedUntil;
      row.value = JSON.stringify({
        count: nextCount,
        firstAttemptAt: state.firstAttemptAt,
        blockedUntil: nextBlockedUntil,
      });
      await row.save({ transaction });
    }
  });
}

/**
 * Clears resend attempt counters for both email and phone after successful verification.
 */
export async function clearOtpResendLimits({ email, phone } = {}) {
  const keys = buildResendLimitKeys({ email, phone });
  if (keys.length === 0) return;
  await Setting.destroy({ where: { key: keys } });
}
