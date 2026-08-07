export const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Persist OTP on model onboardingMetadata.pendingOtp and return the entry.
 */
export async function storeOtpOnModel(modelInstance, code) {
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  const entry = { code, expiresAt };

  modelInstance.onboardingMetadata = {
    ...(modelInstance.onboardingMetadata || {}),
    pendingOtp: entry,
  };
  await modelInstance.save({ fields: ['onboardingMetadata'] });

  return entry;
}

/**
 * Read pending OTP from model onboardingMetadata.
 */
export function readOtpFromModel(modelInstance) {
  const pendingOtp = modelInstance.onboardingMetadata?.pendingOtp;
  if (!pendingOtp?.code || !pendingOtp?.expiresAt) {
    return null;
  }
  return pendingOtp;
}

/**
 * Remove pendingOtp from metadata object (does not save).
 */
export function clearPendingOtpMetadata(metadata) {
  if (!metadata?.pendingOtp) {
    return metadata ?? {};
  }
  const next = { ...metadata };
  delete next.pendingOtp;
  return next;
}

/**
 * Clear pending OTP from model and persist.
 */
export async function clearOtpOnModel(modelInstance) {
  if (!modelInstance.onboardingMetadata?.pendingOtp) {
    return;
  }
  modelInstance.onboardingMetadata = clearPendingOtpMetadata(modelInstance.onboardingMetadata);
  await modelInstance.save({ fields: ['onboardingMetadata'] });
}

/**
 * Check whether a stored OTP entry matches the submitted code and is not expired.
 */
export function isStoredOtpValid(storedOtp, code) {
  return Boolean(storedOtp && storedOtp.code === code && storedOtp.expiresAt > Date.now());
}
