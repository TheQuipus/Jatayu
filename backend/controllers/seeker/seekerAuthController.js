import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Seeker } from '../../models/index.js';
import dotenv from 'dotenv';
import { isSmsProviderConfigured, TEMP_SMS_OTP } from '../../utils/smsService.js';
import { deliverOtpChannels, handleOtpDeliveryError } from '../../utils/otpDelivery.js';
import { getSettingBool } from '../../utils/settingsHelper.js';
import {
  getGoogleAuthConfig,
  isDefaultProfilePhoto,
  verifyGoogleLogin,
} from '../../utils/googleAuth.js';
import { getLinkedinAuthConfig, verifyLinkedinLogin } from '../../utils/linkedinAuth.js';
import {
  storeOtpOnModel,
  readOtpFromModel,
  clearPendingOtpMetadata,
  isStoredOtpValid,
} from '../../utils/otpPersistence.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

const seekerTempOtps = new Map();

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOtpCode() {
  const smsConfigured = await isSmsProviderConfigured();
  if (!smsConfigured) {
    console.log('[Seeker OTP] SMS provider not configured — using temporary OTP 123456');
    return TEMP_SMS_OTP;
  }
  return generateOtpCode();
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
  const otp = await createOtpCode();
  await storeOtp(seeker, otp);
  await deliverOtp(seeker, otp);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`[OTP Dev] Seeker: ${seeker.fullName}`);
    console.log(`Email: ${seeker.email}`);
    console.log(`Phone: ${seeker.phone || '(none)'}`);
    console.log(`Verification Code: ${otp}`);
    console.log(`======================================================\n`);
  }

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
  return {
    id: seeker.id,
    email: seeker.email,
    fullName: seeker.fullName,
    phone: seeker.phone,
    profilePhotoSrc: seeker.profilePhotoSrc,
    onboardingStep: seeker.onboardingStep,
    status: seeker.status,
    role: 'seeker',
  };
}

export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields (fullName, email, password, phone) are required' });
  }

  try {
    const existingEmail = await Seeker.findOne({ where: { email } });
    if (existingEmail) {
      const hasPassword = Boolean(existingEmail.password);
      const passwordMatches = hasPassword && (await bcrypt.compare(password, existingEmail.password));

      if (!passwordMatches) {
        return res.status(409).json({
          message: 'An account with this email already exists. Please log in to continue.',
          code: 'EMAIL_EXISTS',
        });
      }

      const otp = await issueOtp(existingEmail);

      console.log(`\n======================================================`);
      console.log(`[Seeker OTP Resent] Existing seeker re-submitted registration: ${existingEmail.fullName}`);
      console.log(`Email: ${existingEmail.email}`);
      if (otp === TEMP_SMS_OTP) {
        console.log(`Temporary OTP (until SMS configured): ${TEMP_SMS_OTP}`);
      }
      console.log(`======================================================\n`);

      return res.status(200).json({
        message: 'Welcome back! Verification code sent to your email and phone.',
        seekerId: existingEmail.id,
        email: existingEmail.email,
        phone: existingEmail.phone,
      });
    }

    const existingPhone = await Seeker.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(409).json({
        message: 'An account with this phone number already exists. Please log in to continue.',
        code: 'PHONE_EXISTS',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const seeker = await Seeker.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      onboardingStep: 'otp',
      status: 'draft',
    });

    const otp = await issueOtp(seeker);

    console.log(`\n======================================================`);
    console.log(`[Seeker OTP Sent] Registered: ${fullName}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    if (otp === TEMP_SMS_OTP) {
      console.log(`Temporary OTP (until SMS configured): ${TEMP_SMS_OTP}`);
    }
    console.log(`======================================================\n`);

    return res.status(201).json({
      message: 'Registration successful. Verification code sent to your email and phone.',
      seekerId: seeker.id,
      email: seeker.email,
      phone: seeker.phone,
    });
  } catch (error) {
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
    const seeker = await Seeker.findByPk(seekerId);
    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    let storedOtp = seekerTempOtps.get(seekerId);
    if (!isStoredOtpValid(storedOtp, code)) {
      storedOtp = readOtpFromModel(seeker);
    }

    const smsConfigured = await isSmsProviderConfigured();
    const isTempOtpValid = !smsConfigured && code === TEMP_SMS_OTP;
    const isCodeValid = isTempOtpValid || isStoredOtpValid(storedOtp, code);

    if (!isCodeValid) {
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

    return res.status(200).json({
      message: 'Account verified successfully',
      token: buildSeekerToken(seeker),
      user: buildSeekerUser(seeker),
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
      return res.status(404).json({ message: 'Seeker not found' });
    }

    const otp = await issueOtp(seeker);

    console.log(`[Seeker OTP Resent] ${seeker.email} | OTP: ${otp === TEMP_SMS_OTP ? TEMP_SMS_OTP : '(sent via provider)'}`);

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

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const seeker = await Seeker.findOne({ where: { email } });
    if (!seeker) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!seeker.password) {
      return res.status(400).json({
        message: 'This account was created using social sign-in. Please log in with Google or LinkedIn.',
      });
    }

    const isMatch = await bcrypt.compare(password, seeker.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (seeker.onboardingStep === 'otp') {
      try {
        await issueOtp(seeker);
      } catch (deliveryError) {
        const deliveryResponse = handleOtpDeliveryError(deliveryError, res, 'Seeker login');
        if (deliveryResponse) return deliveryResponse;
        throw deliveryError;
      }

      return res.status(403).json({
        message: 'Please verify your account with the OTP sent to your email and phone.',
        requiresOtp: true,
        seekerId: seeker.id,
        email: seeker.email,
        phone: seeker.phone,
      });
    }

    return res.status(200).json({
      token: buildSeekerToken(seeker),
      user: buildSeekerUser(seeker),
    });
  } catch (error) {
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
    if (!seeker) seeker = await Seeker.findOne({ where: { email } });

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
    const emailEnabled = await getSettingBool('EMAIL_ENABLED', true);
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
