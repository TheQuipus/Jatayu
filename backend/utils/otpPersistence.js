import { timingSafeEqual } from 'node:crypto';

export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

const otpVerificationLocks = new Map();

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object' && !Array.isArray(metadata)) return metadata;
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

export function constantTimeCodeEqual(expected, submitted) {
  if (typeof expected !== 'string' || typeof submitted !== 'string') return false;
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(submitted, 'utf8');
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Serializes concurrent OTP verification calls for the same account key
 * to prevent double-redemption race conditions.
 */
export async function withOtpVerificationLock(lockKey, task) {
  const previous = otpVerificationLocks.get(lockKey) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const chained = previous.then(() => current);
  otpVerificationLocks.set(lockKey, chained);

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (otpVerificationLocks.get(lockKey) === chained) {
      otpVerificationLocks.delete(lockKey);
    }
  }
}

/**
 * Persist OTP on model onboardingMetadata.pendingOtp and return the entry.
 */
export async function storeOtpOnModel(modelInstance, code) {
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  const entry = { code: String(code), expiresAt, attempts: 0 };

  modelInstance.onboardingMetadata = {
    ...parseMetadata(modelInstance.onboardingMetadata),
    pendingOtp: entry,
  };
  await modelInstance.save({ fields: ['onboardingMetadata'] });

  return entry;
}

/**
 * Read pending OTP from model onboardingMetadata.
 */
export function readOtpFromModel(modelInstance) {
  const metadata = parseMetadata(modelInstance?.onboardingMetadata);
  const pendingOtp = metadata?.pendingOtp;
  if (!pendingOtp?.code || !pendingOtp?.expiresAt) {
    return null;
  }
  return pendingOtp;
}

/**
 * Remove pendingOtp from metadata object (does not save).
 */
export function clearPendingOtpMetadata(metadata) {
  const parsed = parseMetadata(metadata);
  if (!parsed?.pendingOtp) {
    return parsed;
  }
  const next = { ...parsed };
  delete next.pendingOtp;
  return next;
}

/**
 * Clear pending OTP from model and persist.
 */
export async function clearOtpOnModel(modelInstance) {
  const parsed = parseMetadata(modelInstance?.onboardingMetadata);
  if (!parsed?.pendingOtp) {
    return;
  }
  modelInstance.onboardingMetadata = clearPendingOtpMetadata(parsed);
  if (typeof modelInstance.save === 'function') {
    await modelInstance.save({ fields: ['onboardingMetadata'] });
  }
}

/**
 * Check whether an active, non-expired, non-exhausted OTP challenge exists.
 */
export function hasActivePendingOtp(storedOtp) {
  if (!storedOtp || !storedOtp.code || !storedOtp.expiresAt) return false;
  const attempts = Number(storedOtp.attempts) || 0;
  return storedOtp.expiresAt > Date.now() && attempts < MAX_OTP_ATTEMPTS;
}

/**
 * Check whether a stored OTP entry matches the submitted code in constant time,
 * is not expired, and has not exceeded the maximum verification attempts.
 */
export function isStoredOtpValid(storedOtp, code) {
  if (!hasActivePendingOtp(storedOtp)) return false;
  return constantTimeCodeEqual(String(storedOtp.code), String(code ?? ''));
}

/**
 * Record an invalid OTP attempt and invalidate the challenge once MAX_OTP_ATTEMPTS is reached.
 */
export async function recordOtpFailure(modelInstance, inMemoryCache, cacheKey) {
  const cached = inMemoryCache?.get(cacheKey) || null;
  const fromModel = readOtpFromModel(modelInstance);
  const active = cached || fromModel;

  if (!active || active.expiresAt <= Date.now()) {
    inMemoryCache?.delete(cacheKey);
    if (fromModel) {
      await clearOtpOnModel(modelInstance);
    }
    return { exhausted: false, attempts: 0 };
  }

  const nextAttempts = (Number(active.attempts) || 0) + 1;
  if (nextAttempts >= MAX_OTP_ATTEMPTS) {
    inMemoryCache?.delete(cacheKey);
    await clearOtpOnModel(modelInstance);
    return { exhausted: true, attempts: nextAttempts };
  }

  const updated = { ...active, attempts: nextAttempts };
  inMemoryCache?.set(cacheKey, updated);

  if (modelInstance && typeof modelInstance.save === 'function') {
    modelInstance.onboardingMetadata = {
      ...parseMetadata(modelInstance.onboardingMetadata),
      pendingOtp: updated,
    };
    await modelInstance.save({ fields: ['onboardingMetadata'] });
  }

  return { exhausted: false, attempts: nextAttempts };
}
