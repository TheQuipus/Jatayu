import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Expert } from '../models/index.js';
import dotenv from 'dotenv';
import { deliverOtpChannels, handleOtpDeliveryError } from '../utils/otpDelivery.js';
import { getSettingBool, getDatabaseSettingBool } from '../utils/settingsHelper.js';
import {
  getGoogleAuthConfig,
  isDefaultProfilePhoto,
  verifyGoogleLogin,
} from '../utils/googleAuth.js';
import { promoteExpertToApplicationQueue } from '../utils/expertApplicationQueue.js';
import { generateApplicationNumber } from '../utils/applicationNumber.js';
import { getLinkedinAuthConfig, verifyLinkedinLogin } from '../utils/linkedinAuth.js';
import {
  storeOtpOnModel,
  readOtpFromModel,
  clearPendingOtpMetadata,
  hasActivePendingOtp,
  isStoredOtpValid,
  recordOtpFailure,
  withOtpVerificationLock,
} from '../utils/otpPersistence.js';
import {
  classifyRegistrationConflict,
  createOtpCooldownTracker,
  mapRegistrationUniqueError,
} from '../utils/authRegistrationGuard.js';
import { issueExpertToken } from '../services/expertSessionService.js';
import {
  buildPasswordLoginLockedResponse,
  buildPasswordLoginRateLimitResponse,
  clearPasswordLoginFailures,
  clearPasswordLoginIpFailures,
  getClientIpAddress,
  getPasswordLoginIpLockout,
  getPasswordLoginLockout,
  recordFailedPasswordLogin,
} from '../utils/accountLoginLockout.js';
import {
  buildResendBlockedPayload,
  clearOtpResendLimits,
  getOtpResendStatus,
  releaseResendAttempt,
  reserveResendAttempt,
} from '../utils/otpResendLimit.js';

dotenv.config();

function normalizeExpertEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isExpertBlacklisted(expert) {
  if (!expert) return false;
  if (expert.isBlacklisted || expert.dataValues?.isBlacklisted) return true;

  const rawMetadata = expert.onboardingMetadata || expert.dataValues?.onboardingMetadata;
  if (rawMetadata) {
    if (typeof rawMetadata === 'string') {
      if (/"isBlacklisted"\s*:\s*(true|1)/i.test(rawMetadata)) return true;
      try {
        const parsed = JSON.parse(rawMetadata);
        if (parsed && typeof parsed === 'object' && (parsed.isBlacklisted || parsed.isBlacklisted === 1)) {
          return true;
        }
      } catch {
        // ignore
      }
    } else if (typeof rawMetadata === 'object') {
      if (rawMetadata.isBlacklisted || rawMetadata.isBlacklisted === 1) return true;
      const keys = Object.keys(rawMetadata);
      if (keys.length > 0 && keys.every((k, idx) => k === String(idx))) {
        const decoded = keys.map((k) => rawMetadata[k]).join('');
        if (/"isBlacklisted"\s*:\s*(true|1)/i.test(decoded)) return true;
        try {
          const parsed = JSON.parse(decoded);
          if (parsed && typeof parsed === 'object' && (parsed.isBlacklisted || parsed.isBlacklisted === 1)) {
            return true;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return false;
}

export function isExpertSuspended(expert) {
  if (!expert) return false;
  const status = expert.status || expert.dataValues?.status;
  if (status === 'suspended') return true;

  const rawMetadata = expert.onboardingMetadata || expert.dataValues?.onboardingMetadata;
  if (rawMetadata) {
    if (typeof rawMetadata === 'string') {
      if (/"status"\s*:\s*"suspended"/i.test(rawMetadata)) return true;
      try {
        const parsed = JSON.parse(rawMetadata);
        if (parsed && typeof parsed === 'object' && parsed.status === 'suspended') {
          return true;
        }
      } catch {
        // ignore
      }
    } else if (typeof rawMetadata === 'object') {
      if (rawMetadata.status === 'suspended') return true;
      const keys = Object.keys(rawMetadata);
      if (keys.length > 0 && keys.every((k, idx) => k === String(idx))) {
        const decoded = keys.map((k) => rawMetadata[k]).join('');
        if (/"status"\s*:\s*"suspended"/i.test(decoded)) return true;
        try {
          const parsed = JSON.parse(decoded);
          if (parsed && typeof parsed === 'object' && parsed.status === 'suspended') {
            return true;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return false;
}

function nationalPhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

async function findExpertByEmail(email, options = {}) {
  const normalized = normalizeExpertEmail(email);
  if (!normalized) return null;
  return Expert.findOne({
    ...options,
    where: Expert.sequelize.where(
      Expert.sequelize.fn('LOWER', Expert.sequelize.col('email')),
      normalized,
    ),
  });
}

async function findExpertByPhone(phone, options = {}) {
  const last10 = nationalPhoneDigits(phone);
  if (last10.length < 10) return null;
  return Expert.findOne({
    ...options,
    where: Expert.sequelize.where(
      Expert.sequelize.fn(
        'RIGHT',
        Expert.sequelize.fn('REGEXP_REPLACE', Expert.sequelize.col('phone'), '[^0-9]', ''),
        10,
      ),
      last10,
    ),
  });
}

function serializeAuthUser(expert) {
  const onboardingStep = expert.onboardingStep;
  const status = expert.status;
  return {
    id: expert.id,
    email: expert.email,
    fullName: expert.fullName,
    phone: expert.phone,
    profilePhotoSrc: expert.profilePhotoSrc,
    linkedinId: expert.linkedinId,
    onboardingStep,
    status,
    onboardingComplete: status === 'approved' || onboardingStep === 'success',
  };
}

// Cache active OTPs locally; onboarding metadata persists codes and expiry across restarts.
const tempOtps = new Map();
// Must stay aligned with the frontend OTP resend countdown (30 seconds).
const OTP_RESEND_COOLDOWN_MS = 30_000;
const expertOtpCooldown = createOtpCooldownTracker(OTP_RESEND_COOLDOWN_MS);

function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

async function storeOtp(expert, code) {
  const entry = await storeOtpOnModel(expert, code);
  tempOtps.set(expert.id, entry);
}

async function deliverOtp(expert, otp) {
  await deliverOtpChannels({
    email: expert.email,
    phone: expert.phone,
    fullName: expert.fullName,
    otpCode: otp,
    logPrefix: 'OTP',
  });
}

async function issueOtp(expert) {
  const otp = generateOtpCode();
  await storeOtp(expert, otp);
  await deliverOtp(expert, otp);

  return otp;
}

/**
 * Register a new expert (Credentials signup)
 */
export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields (fullName, email, password, phone) are required' });
  }

  try {
    const normalizedEmail = normalizeExpertEmail(email);
    const normalizedPhone = nationalPhoneDigits(phone);

    const existingEmail = await findExpertByEmail(normalizedEmail, { paranoid: false });
    const existingPhone = await findExpertByPhone(normalizedPhone, { paranoid: false });

    if (isExpertBlacklisted(existingEmail) || isExpertBlacklisted(existingPhone)) {
      return res.status(403).json({
        message: 'Your profile is Marked as Blacklisted',
        code: 'CREDENTIALS_BLACKLISTED',
      });
    }

    if (isExpertSuspended(existingEmail) || isExpertSuspended(existingPhone)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (existingEmail?.deletedAt) {
      return res.status(409).json({ message: 'This account was deleted. Contact support if you want it restored.', code: 'ACCOUNT_DELETED' });
    }

    if (existingPhone?.deletedAt) {
      return res.status(409).json({ message: 'An account using this phone number was deleted. Contact support to restore it.', code: 'ACCOUNT_DELETED' });
    }

    // Strict signup: reject any existing email or phone (including drafts) and direct user to log in
    const conflict = classifyRegistrationConflict({
      existingEmail,
      existingPhone,
      accountLabel: 'expert account',
    });

    if (conflict.action === 'CONFLICT') {
      return res.status(conflict.status).json({
        message: conflict.message,
        code: conflict.code,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create expert in draft state immediately in DB
    const expert = await Expert.create({
      applicationNumber: await generateApplicationNumber(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      onboardingStep: 'otp',
      status: 'draft',
      isEmailVerified: false,
      isPhoneVerified: false,
      submittedAt: null,
    });

    await issueOtp(expert);
    expertOtpCooldown.markIssued(expert.id);
    const resendStatus = await getOtpResendStatus({ email: expert.email, phone: expert.phone });

    console.log(`\n======================================================`);
    console.log(`[Expert OTP Sent] Registered: ${expert.fullName}`);
    console.log(`Email: ${expert.email}`);
    console.log(`Phone: ${expert.phone}`);
    console.log(`ExpertId: ${expert.id}`);
    console.log(`======================================================\n`);

    return res.status(201).json({
      message: 'Registration successful. Verification code sent to your email and phone.',
      expertId: expert.id,
      email: expert.email,
      phone: expert.phone,
      ...resendStatus,
    });
  } catch (error) {
    const uniqueConflict = mapRegistrationUniqueError(error, 'expert account');
    if (uniqueConflict) {
      return res.status(uniqueConflict.status).json({
        message: uniqueConflict.message,
        code: uniqueConflict.code,
      });
    }
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Registration');
    if (deliveryResponse) return deliveryResponse;
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

/**
 * Verify OTP code
 */
export const verifyOtp = async (req, res) => {
  const { expertId, code } = req.body;

  if (!expertId || !code) {
    return res.status(400).json({ message: 'expertId and code are required' });
  }

  try {
    return await withOtpVerificationLock(`expert:${expertId}`, async () => {
      const expert = await Expert.findByPk(expertId);
      if (!expert) {
        return res.status(404).json({ message: 'Registration session expired or expert not found. Please register again.' });
      }

      if (isExpertBlacklisted(expert)) {
        return res.status(403).json({
          message: 'Your profile is Marked as Blacklisted',
          code: 'CREDENTIALS_BLACKLISTED',
        });
      }

      if (isExpertSuspended(expert)) {
        return res.status(403).json({
          message: 'Your Profile has been suspended. Contact Us?',
          code: 'ACCOUNT_SUSPENDED',
        });
      }

      let storedOtp = tempOtps.get(expertId);
      if (!isStoredOtpValid(storedOtp, code)) {
        storedOtp = readOtpFromModel(expert);
      }

      const isCodeValid = isStoredOtpValid(storedOtp, code);

      if (!isCodeValid) {
        const failure = await recordOtpFailure(expert, tempOtps, expertId);
        if (failure.exhausted) {
          return res.status(429).json({
            message: 'Too many invalid verification attempts. Please request a new verification code.',
            code: 'OTP_ATTEMPTS_EXCEEDED',
          });
        }
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      const completingSignup = expert.onboardingStep === 'otp';
      if (completingSignup) {
        expert.isPhoneVerified = Boolean(expert.phone);
        expert.isEmailVerified = Boolean(expert.email);
        expert.onboardingStep = 'category';
      }
      expert.onboardingMetadata = clearPendingOtpMetadata(expert.onboardingMetadata);
      await expert.save();

      if (completingSignup) await promoteExpertToApplicationQueue(expert);

      tempOtps.delete(expertId);
      expertOtpCooldown.clear(expertId);

      try {
        await clearOtpResendLimits({ email: expert.email, phone: expert.phone });
      } catch {
        console.warn('[OTP Resend Limit] Failed to clear expert resend limits after verification');
      }

      const token = await issueExpertToken(expert, req, 'otp');

      return res.status(200).json({
        message: 'Account verified successfully',
        token,
        user: serializeAuthUser(expert),
      });
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({ message: 'Server error during verification', error: error.message });
  }
};

/**
 * Resend OTP to email and phone
 */
export const resendOtp = async (req, res) => {
  const { expertId } = req.body;

  if (!expertId) {
    return res.status(400).json({ message: 'expertId is required' });
  }

  try {
    const expert = await Expert.findByPk(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Registration session expired. Please register again.' });
    }

    if (isExpertBlacklisted(expert)) {
      return res.status(403).json({
        message: 'Your profile is Marked as Blacklisted',
        code: 'CREDENTIALS_BLACKLISTED',
      });
    }

    if (isExpertSuspended(expert)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const resendStatus = await getOtpResendStatus({ email: expert.email, phone: expert.phone });
    if (resendStatus.blockedUntil) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((Date.parse(resendStatus.blockedUntil) - Date.now()) / 1000),
      );
      return res.status(429).json(
        buildResendBlockedPayload({
          blockedUntil: resendStatus.blockedUntil,
          retryAfterSeconds,
        }),
      );
    }

    if (!expertOtpCooldown.canIssueNow(expert.id)) {
      return res.status(429).json({
        message: 'Please wait before requesting another OTP.',
        code: 'OTP_RESEND_COOLDOWN',
        retryAfterSeconds: Math.max(1, expertOtpCooldown.getRemainingSeconds(expert.id)),
      });
    }

    const reservationResult = await reserveResendAttempt({
      email: expert.email,
      phone: expert.phone,
    });
    if (reservationResult.blocked) {
      return res.status(429).json(buildResendBlockedPayload(reservationResult));
    }

    try {
      await issueOtp(expert);
    } catch (deliveryError) {
      await releaseResendAttempt(reservationResult.reservation);
      throw deliveryError;
    }

    expertOtpCooldown.markIssued(expert.id);

    console.log(`[OTP Resent] Expert: ${expert.email} | OTP: (sent via provider)`);

    return res.status(200).json({
      message: 'Verification code resent to your email and phone.',
      email: expert.email,
      phone: expert.phone,
      resendAttempts: reservationResult.resendAttempts,
      maxResendAttempts: reservationResult.maxResendAttempts,
      blockedUntil: reservationResult.blockedUntil,
    });
  } catch (error) {
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Resend OTP');
    if (deliveryResponse) return deliveryResponse;
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ message: 'Server error during OTP resend', error: error.message });
  }
};

/**
 * Get current OTP resend attempt status without incrementing or issuing an OTP
 */
export const resendStatus = async (req, res) => {
  const { expertId } = req.body;

  if (!expertId) {
    return res.status(400).json({ message: 'expertId is required' });
  }

  try {
    const expert = await Expert.findByPk(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Registration session expired. Please register again.' });
    }

    if (isExpertBlacklisted(expert)) {
      return res.status(403).json({
        message: 'Your profile is Marked as Blacklisted',
        code: 'CREDENTIALS_BLACKLISTED',
      });
    }

    if (isExpertSuspended(expert)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const status = await getOtpResendStatus({ email: expert.email, phone: expert.phone });
    return res.status(200).json(status);
  } catch (error) {
    console.error('Resend Status Error:', error);
    return res.status(500).json({ message: 'Server error checking OTP resend status', error: error.message });
  }
};

/**
 * Login with standard credentials
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const sourceIp = getClientIpAddress(req);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const activeIpLockout = await getPasswordLoginIpLockout(sourceIp);
    if (activeIpLockout) {
      return res.status(429).json(buildPasswordLoginRateLimitResponse(activeIpLockout.lockedUntil));
    }

    const expert = await Expert.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });
    // Keep unknown email, wrong password, and social-only accounts indistinguishable.
    if (!expert) {
      const lockout = await recordFailedPasswordLogin('expert', null, sourceIp);
      if (lockout.ipLockedUntil) {
        return res.status(429).json(buildPasswordLoginRateLimitResponse(lockout.ipLockedUntil));
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (isExpertBlacklisted(expert)) {
      return res.status(403).json({
        message: 'Your profile is Marked as Blacklisted',
        code: 'CREDENTIALS_BLACKLISTED',
      });
    }

    if (isExpertSuspended(expert)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    // Check password if it was registered with one (not a Google-only account)
    if (!expert.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const activeLockout = await getPasswordLoginLockout('expert', expert.id, sourceIp);
    if (activeLockout) {
      return res.status(429).json(buildPasswordLoginLockedResponse(activeLockout.lockedUntil));
    }

    const isMatch = await bcrypt.compare(password, expert.password);
    if (!isMatch) {
      const lockout = await recordFailedPasswordLogin('expert', expert, sourceIp);
      if (lockout.ipLockedUntil) {
        return res.status(429).json(buildPasswordLoginRateLimitResponse(lockout.ipLockedUntil));
      }
      if (lockout.lockedUntil) {
        return res.status(429).json(buildPasswordLoginLockedResponse(lockout.lockedUntil));
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const clearedLockout = await clearPasswordLoginFailures('expert', expert.id, sourceIp);
    await clearPasswordLoginIpFailures(sourceIp);
    if (clearedLockout.lockedUntil) {
      return res.status(429).json(buildPasswordLoginLockedResponse(clearedLockout.lockedUntil));
    }

    // Signup verification is mandatory; later logins respect the expert's 2FA setting.
    if (expert.onboardingStep === 'otp' || expert.twoFactorEnabled) {
      const existingPendingOtp = tempOtps.get(expert.id) || readOtpFromModel(expert);
      if (expertOtpCooldown.canIssueNow(expert.id) || !hasActivePendingOtp(existingPendingOtp)) {
        await issueOtp(expert);
        expertOtpCooldown.markIssued(expert.id);
      }

      const resendStatus = await getOtpResendStatus({ email: expert.email, phone: expert.phone });

      return res.status(403).json({
        message: 'Please verify your account with the OTP sent to your email and phone.',
        requiresOtp: true,
        expertId: expert.id,
        email: expert.email,
        phone: expert.phone,
        ...resendStatus,
      });
    }

    const token = await issueExpertToken(expert, req, 'password');
    return res.status(200).json({
      token,
      user: serializeAuthUser(expert),
    });
  } catch (error) {
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Login');
    if (deliveryResponse) return deliveryResponse;
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

/**
 * Login or Sign up using Google Authentication
 */
export const googleLogin = async (req, res) => {
  const { idToken, accessToken } = req.body;

  try {
    const profile = await verifyGoogleLogin({ idToken, accessToken });
    const { googleId, email, fullName, picture } = profile;

    let expert = await Expert.findOne({ where: { googleId }, paranoid: false });
    if (!expert) {
      expert = await findExpertByEmail(email, { paranoid: false });
    }
    if (expert?.deletedAt) {
      const error = new Error('This account was deleted. Contact support if you want it restored.');
      error.status = 403;
      throw error;
    }

    if (isExpertBlacklisted(expert)) {
      return res.status(403).json({
        message: 'Your profile is Marked as Blacklisted',
        code: 'CREDENTIALS_BLACKLISTED',
      });
    }

    if (isExpertSuspended(expert)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!expert) {
      expert = await Expert.create({
        email,
        fullName: fullName || 'Google Expert',
        googleId,
        isEmailVerified: true,
        isPhoneVerified: false,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft',
      });
      await promoteExpertToApplicationQueue(expert);
    } else {
      expert.googleId = expert.googleId || googleId;
      expert.isEmailVerified = true;
      if (fullName && (!expert.fullName || expert.fullName === 'Google Expert')) {
        expert.fullName = fullName;
      }
      if (picture && isDefaultProfilePhoto(expert.profilePhotoSrc)) {
        expert.profilePhotoSrc = picture;
      }
      await expert.save();
    }

    const token = await issueExpertToken(expert, req, 'google');

    return res.status(200).json({
      token,
      user: serializeAuthUser(expert),
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    const status = error.status || 401;
    return res.status(status).json({ message: error.message || 'Google authentication failed' });
  }
};

/**
 * Login or Sign up using LinkedIn Authentication
 */
export const linkedinLogin = async (req, res) => {
  const { authCode, redirectUri } = req.body;

  try {
    const { linkedinId, email, fullName, picture, emailVerified } =
      await verifyLinkedinLogin({ authCode, redirectUri });

    let expert = await Expert.findOne({ where: { linkedinId }, paranoid: false });
    if (!expert) {
      const emailMatch = await findExpertByEmail(email, { paranoid: false });
      if (emailMatch && !emailVerified) {
        return res.status(403).json({
          message: 'Please verify your LinkedIn email address or sign in with your password to link this account.',
          code: 'LINKEDIN_EMAIL_UNVERIFIED',
        });
      }
      expert = emailMatch;
    }
    if (expert?.deletedAt) {
      const error = new Error('This account was deleted. Contact support if you want it restored.');
      error.status = 403;
      throw error;
    }

    if (isExpertBlacklisted(expert)) {
      return res.status(403).json({
        message: 'Your profile is Marked as Blacklisted',
        code: 'CREDENTIALS_BLACKLISTED',
      });
    }

    if (isExpertSuspended(expert)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!expert) {
      expert = await Expert.create({
        email,
        fullName: fullName || 'LinkedIn Expert',
        linkedinId,
        isEmailVerified: emailVerified,
        isPhoneVerified: false,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft'
      });
      await promoteExpertToApplicationQueue(expert);
    } else {
      expert.linkedinId = expert.linkedinId || linkedinId;
      expert.isEmailVerified = expert.isEmailVerified || emailVerified;
      if (fullName && (!expert.fullName || expert.fullName === 'LinkedIn Expert')) {
        expert.fullName = fullName;
      }
      if (picture && isDefaultProfilePhoto(expert.profilePhotoSrc)) expert.profilePhotoSrc = picture;
      await expert.save();
    }

    // Generate JWT
    const token = await issueExpertToken(expert, req, 'linkedin');

    return res.status(200).json({
      token,
      user: serializeAuthUser(expert)
    });
  } catch (error) {
    console.error('LinkedIn Auth Error:', error);
    return res.status(error.status || 401).json({ message: error.message || 'LinkedIn authentication failed' });
  }
};

/**
 * Get public config for frontend visibility settings
 */
export const getPublicConfig = async (req, res) => {
  try {
    const emailEnabled = await getDatabaseSettingBool('EMAIL_ENABLED', true);
    const smsEnabled = await getSettingBool('SMS_ENABLED', true);
    const linkedin = await getLinkedinAuthConfig();
    const google = await getGoogleAuthConfig();

    return res.status(200).json({
      emailEnabled,
      smsEnabled,
      googleLoginEnabled: google.enabled,
      linkedinLoginEnabled: linkedin.enabled,
      googleClientId: google.enabled ? google.clientId : '',
      linkedinClientId: linkedin.enabled ? linkedin.clientId : ''
    });
  } catch (error) {
    console.error('Get Public Config Error:', error);
    return res.status(500).json({ message: 'Server error retrieving configuration', error: error.message });
  }
};
