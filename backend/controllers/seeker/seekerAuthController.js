import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Seeker } from '../../models/index.js';
import dotenv from 'dotenv';
import { isSmsProviderConfigured, TEMP_SMS_OTP } from '../../utils/smsService.js';
import { deliverOtpChannels, handleOtpDeliveryError } from '../../utils/otpDelivery.js';
import { getSetting, getSettingBool } from '../../utils/settingsHelper.js';
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
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Google ID token is required' });
  }

  try {
    const googleClientId = await getSetting('GOOGLE_CLIENT_ID');
    const googleLoginEnabled = await getSettingBool('GOOGLE_LOGIN_ENABLED', true);

    if (!googleLoginEnabled) {
      return res.status(400).json({ message: 'Google Login is disabled by administrator settings' });
    }

    let payload;
    const isMockAuth =
      idToken === 'mock-google-token' ||
      !googleClientId ||
      googleClientId.includes('your_google_client_id');

    if (isMockAuth) {
      console.log('Using mock Google token verification for seeker (development mode)');
      payload = {
        sub: req.body.googleId || 'mock-google-seeker-id',
        email: req.body.email || 'google-seeker@example.com',
        name: req.body.fullName || 'Google Seeker',
        picture: req.body.profilePhotoSrc || '/assets/img/manportrait.png',
        email_verified: true,
      };
    } else {
      const authClient = new OAuth2Client(googleClientId);
      const ticket = await authClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    }

    const { sub: googleId, email, name, picture } = payload;
    let seeker = await Seeker.findOne({ where: { email } });

    if (!seeker) {
      seeker = await Seeker.create({
        email,
        fullName: name || 'Google Seeker',
        googleId,
        isEmailVerified: true,
        isPhoneVerified: true,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft',
      });
    } else {
      if (!seeker.googleId) {
        seeker.googleId = googleId;
        seeker.isEmailVerified = true;
        if (!seeker.profilePhotoSrc && picture) {
          seeker.profilePhotoSrc = picture;
        }
        await seeker.save();
      }
    }

    return res.status(200).json({
      token: buildSeekerToken(seeker),
      user: buildSeekerUser(seeker),
    });
  } catch (error) {
    console.error('Seeker Google Auth Error:', error);
    return res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};

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
    const isMockAuth =
      authCode === 'mock-linkedin-token' ||
      !linkedinClientId ||
      linkedinClientId.includes('your_linkedin_client_id');

    if (isMockAuth) {
      console.log('Using mock LinkedIn verification for seeker (development mode)');
      payload = {
        id: req.body.linkedinId || 'mock-linkedin-seeker-id',
        email: req.body.email || 'linkedin-seeker@example.com',
        name: req.body.fullName || 'LinkedIn Seeker',
        picture: req.body.profilePhotoSrc || '/assets/img/manportrait.png',
      };
    } else {
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: linkedinClientId,
          client_secret: linkedinClientSecret,
          redirect_uri: linkedinRedirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange LinkedIn auth code');
      }

      const userinfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userinfo = await userinfoResponse.json();
      if (!userinfoResponse.ok) {
        throw new Error('Failed to fetch LinkedIn user info');
      }

      payload = {
        id: userinfo.sub,
        email: userinfo.email,
        name: `${userinfo.given_name} ${userinfo.family_name}`,
        picture: userinfo.picture,
      };
    }

    const { id: linkedinId, email, name, picture } = payload;
    let seeker = await Seeker.findOne({ where: { email } });

    if (!seeker) {
      seeker = await Seeker.create({
        email,
        fullName: name || 'LinkedIn Seeker',
        linkedinId,
        isEmailVerified: true,
        isPhoneVerified: true,
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category',
        status: 'draft',
      });
    } else {
      if (!seeker.linkedinId) {
        seeker.linkedinId = linkedinId;
        seeker.isEmailVerified = true;
        if (!seeker.profilePhotoSrc && picture) {
          seeker.profilePhotoSrc = picture;
        }
        await seeker.save();
      }
    }

    return res.status(200).json({
      token: buildSeekerToken(seeker),
      user: buildSeekerUser(seeker),
    });
  } catch (error) {
    console.error('Seeker LinkedIn Auth Error:', error);
    return res.status(401).json({ message: 'LinkedIn authentication failed', error: error.message });
  }
};

export const getPublicConfig = async (req, res) => {
  try {
    const emailEnabled = await getSettingBool('EMAIL_ENABLED', true);
    const smsEnabled = await getSettingBool('SMS_ENABLED', true);
    const googleLoginEnabled = await getSettingBool('GOOGLE_LOGIN_ENABLED', true);
    const linkedinLoginEnabled = await getSettingBool('LINKEDIN_LOGIN_ENABLED', true);
    const googleClientId = await getSetting('GOOGLE_CLIENT_ID');
    const linkedinClientId = await getSetting('LINKEDIN_CLIENT_ID');

    return res.status(200).json({
      emailEnabled,
      smsEnabled,
      googleLoginEnabled,
      linkedinLoginEnabled,
      googleClientId,
      linkedinClientId,
    });
  } catch (error) {
    console.error('Seeker Get Public Config Error:', error);
    return res.status(500).json({ message: 'Server error retrieving configuration', error: error.message });
  }
};
