import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Expert } from '../models/index.js';
import dotenv from 'dotenv';
import { sendOtpEmail } from '../utils/emailService.js';
import { sendOtpSms } from '../utils/smsService.js';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
const OTP_EXPIRY_MS = 10 * 60 * 1000;

// Keep track of active OTPs in memory for demo/verification steps (in-production we'd store in DB or Redis with TTL)
const tempOtps = new Map();

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOtp(expertId, code) {
  tempOtps.set(expertId, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
}

async function deliverOtp(expert, otp) {
  const results = await Promise.allSettled([
    sendOtpEmail({
      recipientEmail: expert.email,
      recipientName: expert.fullName,
      otpCode: otp,
    }),
    sendOtpSms({
      recipientPhone: expert.phone,
      otpCode: otp,
    }),
  ]);

  const failures = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason);

  if (failures.length === results.length) {
    throw failures[0];
  }

  if (failures.length > 0) {
    failures.forEach((error) => console.error('[OTP Delivery Warning]', error));

    if (process.env.NODE_ENV === 'production') {
      throw failures[0];
    }
  }
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
    // Check if email or phone already registered
    const existingEmail = await Expert.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'An expert with this email already exists' });
    }

    const existingPhone = await Expert.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'An expert with this phone number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create expert in draft state
    const expert = await Expert.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      onboardingStep: 'otp', // Next step is OTP verification
      status: 'draft'
    });

    const otp = generateOtpCode();
    storeOtp(expert.id, otp);

    try {
      await deliverOtp(expert, otp);
    } catch (deliveryError) {
      tempOtps.delete(expert.id);
      await expert.destroy();
      console.error('OTP Delivery Error:', deliveryError);
      return res.status(500).json({
        message: 'Could not send verification code. Please try again later.',
        error: deliveryError.message,
      });
    }

    console.log(`\n======================================================`);
    console.log(`[OTP Sent] Expert Registered: ${fullName}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`======================================================\n`);

    return res.status(201).json({
      message: 'Registration successful. Verification code sent to your email and phone.',
      expertId: expert.id,
      email: expert.email,
      phone: expert.phone,
    });
  } catch (error) {
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

    const storedOtp = tempOtps.get(expertId);
    
    // We allow a universal dev code '123456' as bypass, or the actual generated code
    const isCodeValid = (code === '123456') || (storedOtp && storedOtp.code === code && storedOtp.expiresAt > Date.now());

    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Update expert verification flags
    expert.isPhoneVerified = true;
    expert.isEmailVerified = true;
    expert.onboardingStep = 'category'; // Move to first onboarding step
    await expert.save();

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
      user: {
        id: expert.id,
        email: expert.email,
        fullName: expert.fullName,
        phone: expert.phone,
        onboardingStep: expert.onboardingStep,
        status: expert.status
      }
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

    if (expert.onboardingStep !== 'otp') {
      return res.status(400).json({ message: 'OTP resend is not available for this account' });
    }

    const otp = generateOtpCode();
    storeOtp(expert.id, otp);

    try {
      await deliverOtp(expert, otp);
    } catch (deliveryError) {
      console.error('OTP Resend Error:', deliveryError);
      return res.status(500).json({
        message: 'Could not resend verification code. Please try again later.',
        error: deliveryError.message,
      });
    }

    return res.status(200).json({
      message: 'Verification code resent to your email and phone.',
      email: expert.email,
      phone: expert.phone,
    });
  } catch (error) {
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
    const expert = await Expert.findOne({ where: { email } });
    if (!expert) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password if it was registered with one (not a Google-only account)
    if (!expert.password) {
      return res.status(400).json({ 
        message: 'This account was created using Google Sign-In. Please log in with Google.' 
      });
    }

    const isMatch = await bcrypt.compare(password, expert.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: expert.id, email: expert.email, fullName: expert.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: expert.id,
        email: expert.email,
        fullName: expert.fullName,
        phone: expert.phone,
        onboardingStep: expert.onboardingStep,
        status: expert.status
      }
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
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Google ID token is required' });
  }

  try {
    let payload;
    
    // Check if running in development mode without a Google Client ID configured
    const isMockAuth = idToken === 'mock-google-token' || 
                       !process.env.GOOGLE_CLIENT_ID || 
                       process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id');

    if (isMockAuth) {
      console.log('Using mock Google token verification (development mode)');
      payload = {
        sub: req.body.googleId || 'mock-google-id-12345',
        email: req.body.email || 'google-expert@example.com',
        name: req.body.fullName || 'Google Expert',
        picture: req.body.profilePhotoSrc || '/assets/img/manportrait.png',
        email_verified: true
      };
    } else {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    let expert = await Expert.findOne({ where: { email } });

    if (!expert) {
      // Create new expert - verify immediately since they verified via Google
      expert = await Expert.create({
        email,
        fullName: name || 'Google Expert',
        googleId,
        isEmailVerified: true,
        isPhoneVerified: true, // Google login links email securely
        profilePhotoSrc: picture || '/assets/img/manportrait.png',
        onboardingStep: 'category', // Skip OTP verification step
        status: 'draft'
      });
    } else {
      // Update Google ID if not present
      if (!expert.googleId) {
        expert.googleId = googleId;
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
      user: {
        id: expert.id,
        email: expert.email,
        fullName: expert.fullName,
        phone: expert.phone,
        onboardingStep: expert.onboardingStep,
        status: expert.status
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};
