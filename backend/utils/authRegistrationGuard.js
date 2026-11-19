/**
 * Shared strict registration conflict classification, DB duplicate-entry mapping,
 * and bounded OTP cooldown tracking for Seeker and Expert authentication.
 */

export function classifyRegistrationConflict({
  existingEmail,
  existingPhone,
  accountLabel = 'account',
}) {
  if (existingEmail) {
    return {
      action: 'CONFLICT',
      status: 409,
      code: 'EMAIL_EXISTS',
      message: `An ${accountLabel} with this email already exists. Please log in to continue.`,
    };
  }

  if (existingPhone) {
    return {
      action: 'CONFLICT',
      status: 409,
      code: 'PHONE_EXISTS',
      message: `An ${accountLabel} with this phone number already exists. Please log in to continue.`,
    };
  }

  return { action: 'CREATE' };
}

/**
 * Maps concurrent registration DB unique constraint errors to a clean 409 response.
 */
export function mapRegistrationUniqueError(error, accountLabel = 'account') {
  const isUniqueError =
    error?.name === 'SequelizeUniqueConstraintError' ||
    error?.original?.code === 'ER_DUP_ENTRY' ||
    error?.parent?.code === 'ER_DUP_ENTRY';

  if (!isUniqueError) return null;

  const fieldKeys = [
    ...Object.keys(error?.fields || {}),
    ...(Array.isArray(error?.errors) ? error.errors.map((item) => item?.path || '') : []),
    String(error?.original?.sqlMessage || error?.message || ''),
  ]
    .join(' ')
    .toLowerCase();

  const isPhoneConflict = fieldKeys.includes('phone') && !fieldKeys.includes('email');

  return {
    status: 409,
    code: isPhoneConflict ? 'PHONE_EXISTS' : 'EMAIL_EXISTS',
    message: isPhoneConflict
      ? `An ${accountLabel} with this phone number already exists. Please log in to continue.`
      : `An ${accountLabel} with this email already exists. Please log in to continue.`,
  };
}

/**
 * Bounded in-memory OTP resend cooldown tracker with automatic stale-entry pruning.
 */
export function createOtpCooldownTracker(windowMs = 30_000, maxEntries = 10_000) {
  const timestamps = new Map();

  function prune(now = Date.now()) {
    for (const [key, ts] of timestamps.entries()) {
      if (now - ts >= windowMs) {
        timestamps.delete(key);
      }
    }
    if (timestamps.size > maxEntries) {
      const overflow = timestamps.size - maxEntries;
      let removed = 0;
      for (const key of timestamps.keys()) {
        timestamps.delete(key);
        removed += 1;
        if (removed >= overflow) break;
      }
    }
  }

  return {
    getLastIssuedAt(id) {
      return timestamps.get(id) || 0;
    },
    canIssueNow(id) {
      const lastIssuedAt = timestamps.get(id) || 0;
      return !lastIssuedAt || Date.now() - lastIssuedAt >= windowMs;
    },
    markIssued(id) {
      const now = Date.now();
      if (timestamps.size >= maxEntries) {
        prune(now);
      }
      timestamps.set(id, now);
    },
    clear(id) {
      timestamps.delete(id);
    },
  };
}
