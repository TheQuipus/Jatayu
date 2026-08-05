import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Seeker } from '../models/index.js';
import dotenv from 'dotenv';
import { sendOtpEmail } from '../utils/emailService.js';
import { sendOtpSms, isSmsProviderConfigured, TEMP_SMS_OTP } from '../utils/smsService.js';
import { getSetting, getSettingBool } from '../utils/settingsHelper.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
const OTP_EXPIRY_MS = 10 * 60 * 1000;

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

function storeOtp(seekerId, code) {
  seekerTempOtps.set(seekerId, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
}

async function deliverOtp(seeker, otp) {
  const results = await Promise.allSettled([
    sendOtpEmail({
      recipientEmail: seeker.email,
      recipientName: seeker.fullName,
      otpCode: otp,
    }),
    sendOtpSms({
      recipientPhone: seeker.phone,
      otpCode: otp,
    }),
  ]);

  const successes = results.filter((r) => r.status === 'fulfilled');
  const failures = results.filter((r) => r.status === 'rejected').map((r) => r.reason);

  failures.forEach((err) => console.warn('[Seeker OTP Delivery Warning]', err.message));

  if (successes.length === 0) {
    throw failures[0] || new Error('All OTP delivery channels failed.');
  }
}

async function issueOtp(seeker) {
  let otp = await createOtpCode();
  storeOtp(seeker.id, otp);

  try {
    await deliverOtp(seeker, otp);
  } catch (deliveryError) {
    console.warn('[Seeker OTP Delivery Warning]', deliveryError.message);
    otp = TEMP_SMS_OTP;
    storeOtp(seeker.id, otp);
    console.log(`[Seeker OTP Fallback] Using temporary OTP: ${TEMP_SMS_OTP}`);
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
      return res.status(400).json({ message: 'A seeker with this email already exists' });
    }

    const existingPhone = await Seeker.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'A seeker with this phone number already exists' });
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

    const storedOtp = seekerTempOtps.get(seekerId);
    const smsConfigured = await isSmsProviderConfigured();
    const isTempOtpValid = !smsConfigured && code === TEMP_SMS_OTP;
    const isCodeValid =
      isTempOtpValid ||
      (storedOtp && storedOtp.code === code && storedOtp.expiresAt > Date.now());

    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    seeker.isPhoneVerified = true;
    seeker.isEmailVerified = true;
    seeker.onboardingStep = 'category';
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

    if (seeker.onboardingStep !== 'otp') {
      return res.status(400).json({ message: 'OTP resend is not available for this account' });
    }

    const otp = await issueOtp(seeker);

    console.log(`[Seeker OTP Resent] ${seeker.email} | OTP: ${otp === TEMP_SMS_OTP ? TEMP_SMS_OTP : '(sent via provider)'}`);

    return res.status(200).json({
      message: 'Verification code resent to your email and phone.',
      email: seeker.email,
      phone: seeker.phone,
    });
  } catch (error) {
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
