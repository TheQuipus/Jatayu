import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Seeker } from '../../models/index.js';
import dotenv from 'dotenv';
import { deliverOtpChannels, handleOtpDeliveryError } from '../../utils/otpDelivery.js';
import { getSettingBool, getDatabaseSettingBool } from '../../utils/settingsHelper.js';
import {
  getGoogleAuthConfig,
  isDefaultProfilePhoto,
  verifyGoogleLogin,
} from '../../utils/googleAuth.js';
import { getLinkedinAuthConfig, verifyLinkedinLogin } from '../../utils/linkedinAuth.js';
import { getSeekerOnboardingProgress } from '../../utils/seekerOnboardingProgress.js';
import { isValidSeekerFullName } from '../../utils/seekerNameValidation.js';
import {
  isValidSeekerRegistrationEmail,
  isValidSeekerRegistrationPhone,
} from '../../utils/seekerRegistrationValidation.js';
import {
  storeOtpOnModel,
  readOtpFromModel,
  clearPendingOtpMetadata,
  hasActivePendingOtp,
  isStoredOtpValid,
  recordOtpFailure,
  withOtpVerificationLock,
} from '../../utils/otpPersistence.js';
import {
  classifyRegistrationConflict,
  createOtpCooldownTracker,
  mapRegistrationUniqueError,
} from '../../utils/authRegistrationGuard.js';
import {
  buildPasswordLoginLockedResponse,
  buildPasswordLoginRateLimitResponse,
  clearPasswordLoginFailures,
  clearPasswordLoginIpFailures,
  getClientIpAddress,
  getPasswordLoginIpLockout,
  getPasswordLoginLockout,
  recordFailedPasswordLogin,
} from '../../utils/accountLoginLockout.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

const seekerTempOtps = new Map();
const seekerOtpCooldown = createOtpCooldownTracker(30_000);

function canIssueSeekerOtpNow(seekerId) {
  return seekerOtpCooldown.canIssueNow(seekerId);
}

function markSeekerOtpIssued(seekerId) {
  seekerOtpCooldown.markIssued(seekerId);
}

export function isSeekerSuspended(seeker) {
  if (!seeker) return false;
  const status = seeker.status || seeker.dataValues?.status;
  if (status === 'suspended') return true;

  const rawMetadata = seeker.onboardingMetadata || seeker.dataValues?.onboardingMetadata;
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
    }
  }

  return false;
}

function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

async function storeOtp(seeker, code) {
  const entry = await storeOtpOnModel(seeker, code);
  seekerTempOtps.set(seeker.id, entry);
}

async function deliverOtp(seeker, otp) {
  await deliverOtpChannels({
    email: seeker.email,
    phone: seeker.phone,
    fullName: seeker.fullName,
    otpCode: otp,
    triggerKey: 'SEEKER_OTP',
    logPrefix: 'Seeker OTP',
  });
}

async function issueOtp(seeker) {
  const otp = generateOtpCode();
  await storeOtp(seeker, otp);
  await deliverOtp(seeker, otp);

  return otp;
}

function buildSeekerToken(seeker) {
  return jwt.sign(
    {
      id: seeker.id,
      email: seeker.email,
      fullName: seeker.fullName,
      role: 'seeker',
    },
    JWT_SECRET,
    { expiresIn: '30d' },
  );
}

function buildSeekerUser(seeker) {
  const onboarding = getSeekerOnboardingProgress(seeker);
  return {
    id: seeker.id,
    email: seeker.email,
    fullName: seeker.fullName,
    phone: seeker.phone,
    profilePhotoSrc: seeker.profilePhotoSrc,
    category: seeker.category,
    topics: seeker.topics,
    needsText: seeker.needsText,
    selectedNeedChips: seeker.selectedNeedChips,
    onboardingMetadata: seeker.onboardingMetadata,
    onboardingStep: seeker.onboardingStep,
    status: seeker.status,
    role: 'seeker',
    completedSteps: onboarding.completedSteps,
    resumeStep: onboarding.resumeStep,
    onboardingComplete: onboarding.onboardingComplete,
    onboarding,
  };
}

export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields (fullName, email, password, phone) are required' });
  }
  if (!isValidSeekerFullName(fullName)) {
    return res.status(400).json({ message: 'Name must contain letters and may only include numbers, spaces, hyphens, commas, and apostrophes.' });
  }

  try {
    if (!await isValidSeekerRegistrationEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (!isValidSeekerRegistrationPhone(phone)) {
      return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await Seeker.findOne({ where: { email: normalizedEmail } });
    const existingPhone = await Seeker.findOne({ where: { phone } });

    const conflict = classifyRegistrationConflict({
      existingEmail,
      existingPhone,
      accountLabel: 'account',
    });

    if (conflict.action === 'CONFLICT') {
      return res.status(conflict.status).json({
        message: conflict.message,
        code: conflict.code,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create seeker in draft state immediately in DB
    const seeker = await Seeker.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      onboardingStep: 'otp',
      status: 'draft',
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    await issueOtp(seeker);
    markSeekerOtpIssued(seeker.id);

    console.log(`\n======================================================`);
    console.log(`[Seeker OTP Sent] Registered: ${seeker.fullName}`);
    console.log(`Email: ${seeker.email}`);
    console.log(`Phone: ${seeker.phone}`);
    console.log(`SeekerId: ${seeker.id}`);
    console.log(`======================================================\n`);

    return res.status(201).json({
      message: 'Registration successful. Verification code sent to your email and phone.',
      seekerId: seeker.id,
      email: seeker.email,
      phone: seeker.phone,
    });
  } catch (error) {
    const uniqueConflict = mapRegistrationUniqueError(error, 'account');
    if (uniqueConflict) {
      return res.status(uniqueConflict.status).json({
        message: uniqueConflict.message,
        code: uniqueConflict.code,
      });
    }
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Seeker registration');
    if (deliveryResponse) return deliveryResponse;
    console.error('Seeker Registration Error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { seekerId, code } = req.body;

  if (!seekerId || !code) {
    return res.status(400).json({ message: 'seekerId and code are required' });
  }

  try {
    return await withOtpVerificationLock(`seeker:${seekerId}`, async () => {
      const seeker = await Seeker.findByPk(seekerId);
      if (!seeker) {
        return res.status(404).json({ message: 'Verification session not found or expired. Please register again.' });
      }

      if (isSeekerSuspended(seeker)) {
        return res.status(403).json({
          message: 'Your Profile has been suspended. Contact Us?',
          code: 'ACCOUNT_SUSPENDED',
        });
      }

      let storedOtp = seekerTempOtps.get(seekerId);
      if (!isStoredOtpValid(storedOtp, code)) {
        storedOtp = readOtpFromModel(seeker);
      }

      const isCodeValid = isStoredOtpValid(storedOtp, code);

      if (!isCodeValid) {
        const failure = await recordOtpFailure(seeker, seekerTempOtps, seekerId);
        if (failure.exhausted) {
          return res.status(429).json({
            message: 'Too many invalid verification attempts. Please request a new verification code.',
            code: 'OTP_ATTEMPTS_EXCEEDED',
          });
        }
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }

      seeker.isPhoneVerified = true;
      seeker.isEmailVerified = true;
      if (seeker.onboardingStep === 'otp') {
        seeker.onboardingStep = 'category';
      }
      seeker.onboardingMetadata = clearPendingOtpMetadata(seeker.onboardingMetadata);
      await seeker.save();

      seekerTempOtps.delete(seekerId);
      seekerOtpCooldown.clear(seekerId);

      return res.status(200).json({
        message: 'Account verified successfully',
        token: buildSeekerToken(seeker),
        user: buildSeekerUser(seeker),
      });
    });
  } catch (error) {
    console.error('Seeker OTP Verification Error:', error);
    return res.status(500).json({ message: 'Server error during verification', error: error.message });
  }
};

export const resendOtp = async (req, res) => {
  const { seekerId } = req.body;

  if (!seekerId) {
    return res.status(400).json({ message: 'seekerId is required' });
  }

  try {
    const seeker = await Seeker.findByPk(seekerId);
    if (!seeker) {
      return res.status(404).json({ message: 'Registration session expired. Please register again.' });
    }

    if (isSeekerSuspended(seeker)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!canIssueSeekerOtpNow(seeker.id)) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP.' });
    }

    await issueOtp(seeker);
    markSeekerOtpIssued(seeker.id);

    console.log(`[Seeker OTP Resent] ${seeker.email} | OTP: (sent via provider)`);

    return res.status(200).json({
      message: 'Verification code resent to your email and phone.',
      email: seeker.email,
      phone: seeker.phone,
    });
  } catch (error) {
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Seeker resend OTP');
    if (deliveryResponse) return deliveryResponse;
    console.error('Seeker Resend OTP Error:', error);
    return res.status(500).json({ message: 'Server error during OTP resend', error: error.message });
  }
};

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

    const seeker = await Seeker.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (!seeker) {
      const lockout = await recordFailedPasswordLogin('seeker', null, sourceIp);
      if (lockout.ipLockedUntil) {
        return res.status(429).json(buildPasswordLoginRateLimitResponse(lockout.ipLockedUntil));
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (isSeekerSuspended(seeker)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!seeker.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const activeLockout = await getPasswordLoginLockout('seeker', seeker.id, sourceIp);
    if (activeLockout) {
      return res.status(429).json(buildPasswordLoginLockedResponse(activeLockout.lockedUntil));
    }

    const isMatch = await bcrypt.compare(password, seeker.password);
    if (!isMatch) {
      const lockout = await recordFailedPasswordLogin('seeker', seeker, sourceIp);
      if (lockout.ipLockedUntil) {
        return res.status(429).json(buildPasswordLoginRateLimitResponse(lockout.ipLockedUntil));
      }
      if (lockout.lockedUntil) {
        return res.status(429).json(buildPasswordLoginLockedResponse(lockout.lockedUntil));
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const clearedLockout = await clearPasswordLoginFailures('seeker', seeker.id, sourceIp);
    await clearPasswordLoginIpFailures(sourceIp);
    if (clearedLockout.lockedUntil) {
      return res.status(429).json(buildPasswordLoginLockedResponse(clearedLockout.lockedUntil));
    }

    // Password validation starts a fresh OTP challenge on every login.
    // Only verifyOtp may issue the authenticated session for this flow.
    const existingPendingOtp = seekerTempOtps.get(seeker.id) || readOtpFromModel(seeker);
    if (!canIssueSeekerOtpNow(seeker.id) && hasActivePendingOtp(existingPendingOtp)) {
      return res.status(403).json({
        message: 'Please verify your account with the OTP sent to your email and phone.',
        requiresOtp: true,
        seekerId: seeker.id,
        email: seeker.email,
        phone: seeker.phone,
      });
    }

    await issueOtp(seeker);
    markSeekerOtpIssued(seeker.id);

    return res.status(403).json({
      message: 'Please verify your account with the OTP sent to your email and phone.',
      requiresOtp: true,
      seekerId: seeker.id,
      email: seeker.email,
      phone: seeker.phone,
    });
  } catch (error) {
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Seeker login');
    if (deliveryResponse) return deliveryResponse;
    console.error('Seeker Login Error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

export const googleLogin = async (req, res) => {
  const { idToken, accessToken } = req.body;

  try {
    const profile = await verifyGoogleLogin({ idToken, accessToken });
    const { googleId, email, fullName, picture } = profile;

    let seeker = await Seeker.findOne({ where: { googleId } });
    if (!seeker) {
      seeker = await Seeker.findOne({ where: { email } });
    }

    if (seeker && isSeekerSuspended(seeker)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!seeker) {
      seeker = await Seeker.create({
        email,
        fullName: fullName || 'Google Seeker',
        googleId,
        isEmailVerified: true,
        isPhoneVerified: false,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft',
      });
    } else {
      seeker.googleId = seeker.googleId || googleId;
      seeker.isEmailVerified = true;
      if (fullName && (!seeker.fullName || seeker.fullName === 'Google Seeker')) {
        seeker.fullName = fullName;
      }
      if (picture && isDefaultProfilePhoto(seeker.profilePhotoSrc)) {
        seeker.profilePhotoSrc = picture;
      }
      await seeker.save();
    }

    return res.status(200).json({
      token: buildSeekerToken(seeker),
      user: buildSeekerUser(seeker),
    });
  } catch (error) {
    console.error('Seeker Google Auth Error:', error);
    const status = error.status || 401;
    return res.status(status).json({ message: error.message || 'Google authentication failed' });
  }
};

export const linkedinLogin = async (req, res) => {
  const { authCode, redirectUri } = req.body;

  try {
    const { linkedinId, email, fullName, picture, emailVerified } =
      await verifyLinkedinLogin({ authCode, redirectUri });
    let seeker = await Seeker.findOne({ where: { linkedinId } });
    if (!seeker) {
      const emailMatch = await Seeker.findOne({ where: { email } });
      if (emailMatch && !emailVerified) {
        return res.status(403).json({
          message: 'Please verify your LinkedIn email address or sign in with your password to link this account.',
          code: 'LINKEDIN_EMAIL_UNVERIFIED',
        });
      }
      seeker = emailMatch;
    }

    if (seeker && isSeekerSuspended(seeker)) {
      return res.status(403).json({
        message: 'Your Profile has been suspended. Contact Us?',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!seeker) {
      seeker = await Seeker.create({
        email,
        fullName: fullName || 'LinkedIn Seeker',
        linkedinId,
        isEmailVerified: emailVerified,
        isPhoneVerified: false,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft',
      });
    } else {
      seeker.linkedinId = seeker.linkedinId || linkedinId;
      seeker.isEmailVerified = seeker.isEmailVerified || emailVerified;
      if (fullName && (!seeker.fullName || seeker.fullName === 'LinkedIn Seeker')) {
        seeker.fullName = fullName;
      }
      if (picture && isDefaultProfilePhoto(seeker.profilePhotoSrc)) seeker.profilePhotoSrc = picture;
      await seeker.save();
    }

    return res.status(200).json({
      token: buildSeekerToken(seeker),
      user: buildSeekerUser(seeker),
    });
  } catch (error) {
    console.error('Seeker LinkedIn Auth Error:', error);
    return res.status(error.status || 401).json({ message: error.message || 'LinkedIn authentication failed' });
  }
};

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
      linkedinClientId: linkedin.enabled ? linkedin.clientId : '',
    });
  } catch (error) {
    console.error('Seeker Get Public Config Error:', error);
    return res.status(500).json({ message: 'Server error retrieving configuration', error: error.message });
  }
};
