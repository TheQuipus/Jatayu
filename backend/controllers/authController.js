import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Expert } from '../models/index.js';
import dotenv from 'dotenv';
import { isSmsProviderConfigured, TEMP_SMS_OTP } from '../utils/smsService.js';
import { isSmtpConfigured } from '../utils/emailService.js';
import { deliverOtpChannels, handleOtpDeliveryError } from '../utils/otpDelivery.js';
import { getSetting, getSettingBool } from '../utils/settingsHelper.js';
import {
  getGoogleAuthConfig,
  isDefaultProfilePhoto,
  verifyGoogleLogin,
} from '../utils/googleAuth.js';
import { promoteExpertToApplicationQueue } from '../utils/expertApplicationQueue.js';
import {
  storeOtpOnModel,
  readOtpFromModel,
  clearPendingOtpMetadata,
  isStoredOtpValid,
} from '../utils/otpPersistence.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

function normalizeExpertEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function nationalPhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

async function findExpertByEmail(email) {
  const normalized = normalizeExpertEmail(email);
  if (!normalized) return null;
  return Expert.findOne({
    where: Expert.sequelize.where(
      Expert.sequelize.fn('LOWER', Expert.sequelize.col('email')),
      normalized,
    ),
  });
}

async function findExpertByPhone(phone) {
  const last10 = nationalPhoneDigits(phone);
  if (last10.length < 10) return null;
  return Expert.findOne({
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
    onboardingStep,
    status,
    onboardingComplete: status === 'approved' || onboardingStep === 'success',
  };
}

// Keep track of active OTPs in memory for demo/verification steps (in-production we'd store in DB or Redis with TTL)
const tempOtps = new Map();

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOtpCode() {
  const smsConfigured = await isSmsProviderConfigured();
  const smtpConfigured = await isSmtpConfigured();
  if (!smsConfigured && !smtpConfigured) {
    console.log('[OTP] SMS and SMTP not configured — using temporary OTP 123456');
    return TEMP_SMS_OTP;
  }
  return generateOtpCode();
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
  const otp = await createOtpCode();
  await storeOtp(expert, otp);
  await deliverOtp(expert, otp);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`[OTP Dev] Expert: ${expert.fullName}`);
    console.log(`Email: ${expert.email}`);
    console.log(`Phone: ${expert.phone || '(none)'}`);
    console.log(`Verification Code: ${otp}`);
    console.log(`======================================================\n`);
  }

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

    const existingEmail = await findExpertByEmail(normalizedEmail);
    if (existingEmail) {
      return res.status(409).json({
        message: 'An expert account with this email already exists. Please log in to continue.',
        code: 'EMAIL_EXISTS',
      });
    }

    const existingPhone = await findExpertByPhone(normalizedPhone);
    if (existingPhone) {
      return res.status(409).json({
        message: 'An expert account with this contact number already exists. Please log in to continue.',
        code: 'PHONE_EXISTS',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create expert in draft state
    const expert = await Expert.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      onboardingStep: 'otp', // Next step is OTP verification
      status: 'draft'
    });

    const otp = await issueOtp(expert);

    console.log(`\n======================================================`);
    console.log(`[OTP Sent] Expert Registered: ${fullName}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    if (otp === TEMP_SMS_OTP) {
      console.log(`Temporary OTP (until SMS configured): ${TEMP_SMS_OTP}`);
    }
    console.log(`======================================================\n`);

    return res.status(201).json({
      message: 'Registration successful. Verification code sent to your email and phone.',
      expertId: expert.id,
      email: expert.email,
      phone: expert.phone,
    });
  } catch (error) {
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
    const expert = await Expert.findByPk(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    let storedOtp = tempOtps.get(expertId);
    if (!isStoredOtpValid(storedOtp, code)) {
      storedOtp = readOtpFromModel(expert);
    }

    // Accept stored OTP, or temporary 123456 when SMS provider is not yet configured
    const smsConfigured = await isSmsProviderConfigured();
    const isTempOtpValid = !smsConfigured && code === TEMP_SMS_OTP;
    const isCodeValid = isTempOtpValid || isStoredOtpValid(storedOtp, code);

    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Update expert verification flags
    expert.isPhoneVerified = true;
    expert.isEmailVerified = true;
    // Only advance to the first onboarding step for a brand-new signup. If the
    // expert had already progressed further (re-verifying after re-submitting
    // the signup form), keep their existing progress instead of resetting it.
    if (expert.onboardingStep === 'otp') {
      expert.onboardingStep = 'category';
    }
    expert.onboardingMetadata = clearPendingOtpMetadata(expert.onboardingMetadata);
    await expert.save();

    // Signup is complete — make the expert visible in the admin approval queue
    await promoteExpertToApplicationQueue(expert);

    // Clean up OTP memory
    tempOtps.delete(expertId);

    // Generate JWT
    const token = jwt.sign(
      { id: expert.id, email: expert.email, fullName: expert.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      message: 'Account verified successfully',
      token,
      user: serializeAuthUser(expert)
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
      return res.status(404).json({ message: 'Expert not found' });
    }

    const otp = await issueOtp(expert);

    console.log(`[OTP Resent] Expert: ${expert.email} | OTP: ${otp === TEMP_SMS_OTP ? TEMP_SMS_OTP : '(sent via provider)'}`);

    return res.status(200).json({
      message: 'Verification code resent to your email and phone.',
      email: expert.email,
      phone: expert.phone,
    });
  } catch (error) {
    const deliveryResponse = handleOtpDeliveryError(error, res, 'Resend OTP');
    if (deliveryResponse) return deliveryResponse;
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ message: 'Server error during OTP resend', error: error.message });
  }
};

/**
 * Login with standard credentials
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const expert = await Expert.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });
    // Same message for unknown email and wrong password — do not leak which failed.
    if (!expert) {
      return res.status(401).json({ message: 'incorrect credentials' });
    }

    // Check password if it was registered with one (not a Google-only account)
    if (!expert.password) {
      return res.status(400).json({ 
        message: 'This account was created using Google Sign-In. Please log in with Google.' 
      });
    }

    const isMatch = await bcrypt.compare(password, expert.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'incorrect credentials' });
    }

    if (expert.onboardingStep === 'otp') {
      try {
        await issueOtp(expert);
      } catch (deliveryError) {
        const deliveryResponse = handleOtpDeliveryError(deliveryError, res, 'Login');
        if (deliveryResponse) return deliveryResponse;
        throw deliveryError;
      }

      return res.status(403).json({
        message: 'Please verify your account with the OTP sent to your email and phone.',
        requiresOtp: true,
        expertId: expert.id,
        email: expert.email,
        phone: expert.phone,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: expert.id, email: expert.email, fullName: expert.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: serializeAuthUser(expert)
    });
  } catch (error) {
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

    let expert = await Expert.findOne({ where: { googleId } });
    if (!expert) {
      expert = await findExpertByEmail(email);
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

    const token = jwt.sign(
      { id: expert.id, email: expert.email, fullName: expert.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

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

  if (!authCode) {
    return res.status(400).json({ message: 'LinkedIn authorization code is required' });
  }

  try {
    const linkedinClientId = await getSetting('LINKEDIN_CLIENT_ID');
    const linkedinClientSecret = await getSetting('LINKEDIN_CLIENT_SECRET');
    const linkedinRedirectUri = await getSetting('LINKEDIN_REDIRECT_URI') || redirectUri;
    const linkedinLoginEnabled = await getSettingBool('LINKEDIN_LOGIN_ENABLED', true);

    if (!linkedinLoginEnabled) {
      return res.status(400).json({ message: 'LinkedIn Login is disabled by administrator settings' });
    }

    let payload;

    const isMockAuth = authCode === 'mock-linkedin-token' ||
                       !linkedinClientId ||
                       linkedinClientId.includes('your_linkedin_client_id');

    if (isMockAuth) {
      console.log('Using mock LinkedIn verification (development mode)');
      payload = {
        id: req.body.linkedinId || 'mock-linkedin-id-12345',
        email: req.body.email || 'linkedin-expert@example.com',
        name: req.body.fullName || 'LinkedIn Expert',
        picture: req.body.profilePhotoSrc || '/assets/img/manportrait.png'
      };
    } else {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: linkedinClientId,
          client_secret: linkedinClientSecret,
          redirect_uri: linkedinRedirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange LinkedIn auth code');
      }

      const accessToken = tokenData.access_token;

      // Fetch user profile and email
      const userinfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userinfo = await userinfoResponse.json();
      if (!userinfoResponse.ok) {
        throw new Error('Failed to fetch LinkedIn user info');
      }

      payload = {
        id: userinfo.sub,
        email: userinfo.email,
        name: `${userinfo.given_name} ${userinfo.family_name}`,
        picture: userinfo.picture
      };
    }

    const { id: linkedinId, email, name, picture } = payload;

    // Check if user already exists
    let expert = await Expert.findOne({ where: { email } });

    if (!expert) {
      expert = await Expert.create({
        email,
        fullName: name || 'LinkedIn Expert',
        linkedinId,
        isEmailVerified: true,
        isPhoneVerified: true,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft'
      });
      await promoteExpertToApplicationQueue(expert);
    } else {
      if (!expert.linkedinId) {
        expert.linkedinId = linkedinId;
        expert.isEmailVerified = true;
        if (!expert.profilePhotoSrc && picture) {
          expert.profilePhotoSrc = picture;
        }
        await expert.save();
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: expert.id, email: expert.email, fullName: expert.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: serializeAuthUser(expert)
    });
  } catch (error) {
    console.error('LinkedIn Auth Error:', error);
    return res.status(401).json({ message: 'LinkedIn authentication failed', error: error.message });
  }
};

/**
 * Get public config for frontend visibility settings
 */
export const getPublicConfig = async (req, res) => {
  try {
    const emailEnabled = await getSettingBool('EMAIL_ENABLED', true);
    const smsEnabled = await getSettingBool('SMS_ENABLED', true);
    const linkedinLoginEnabled = await getSettingBool('LINKEDIN_LOGIN_ENABLED', true);
    const linkedinClientId = await getSetting('LINKEDIN_CLIENT_ID');
    const google = await getGoogleAuthConfig();

    return res.status(200).json({
      emailEnabled,
      smsEnabled,
      googleLoginEnabled: google.enabled,
      linkedinLoginEnabled,
      googleClientId: google.enabled ? google.clientId : '',
      linkedinClientId
    });
  } catch (error) {
    console.error('Get Public Config Error:', error);
    return res.status(500).json({ message: 'Server error retrieving configuration', error: error.message });
  }
};

