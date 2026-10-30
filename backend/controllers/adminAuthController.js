import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';
import { requestAdminOtp, verifyAdminOtp } from '../utils/adminLoginOtp.js';
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

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

/**
 * Admin login validates credentials before issuing an email verification code.
 */
export const adminLogin = async (req, res) => {
  const { email, password, otp } = req.body;
  const sourceIp = getClientIpAddress(req);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const activeIpLockout = await getPasswordLoginIpLockout(sourceIp);
    if (activeIpLockout) {
      return res.status(429).json(buildPasswordLoginRateLimitResponse(activeIpLockout.lockedUntil));
    }

    const admin = await Admin.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      const lockout = await recordFailedPasswordLogin('admin', null, sourceIp);
      if (lockout.ipLockedUntil) {
        return res.status(429).json(buildPasswordLoginRateLimitResponse(lockout.ipLockedUntil));
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const activeLockout = await getPasswordLoginLockout('admin', admin.id, sourceIp);
    if (activeLockout) {
      return res.status(429).json(buildPasswordLoginLockedResponse(activeLockout.lockedUntil));
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      const lockout = await recordFailedPasswordLogin('admin', admin, sourceIp);
      if (lockout.ipLockedUntil) {
        return res.status(429).json(buildPasswordLoginRateLimitResponse(lockout.ipLockedUntil));
      }
      if (lockout.lockedUntil) {
        return res.status(429).json(buildPasswordLoginLockedResponse(lockout.lockedUntil));
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const clearedLockout = await clearPasswordLoginFailures('admin', admin.id, sourceIp);
    await clearPasswordLoginIpFailures(sourceIp);
    if (clearedLockout.lockedUntil) {
      return res.status(429).json(buildPasswordLoginLockedResponse(clearedLockout.lockedUntil));
    }

    if (process.env.ADMIN_LOGIN_OTP_ENABLED !== 'false') {
      if (otp === undefined) {
        try {
          await requestAdminOtp(admin);
        } catch (error) {
          return res.status(503).json({ message: error.message });
        }
        return res.status(202).json({ requiresOtp: true, message: 'Verification code sent to your email.' });
      }
      if (!await verifyAdminOtp(admin.id, otp)) {
        return res.status(401).json({ message: 'Invalid or expired verification code. Request a new code if needed.' });
      }
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(200).json({
      token,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ message: 'Server error during admin login', error: error.message });
  }
};

/**
 * Get current admin session from token
 */
export const getAdminMe = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: ['id', 'email', 'fullName', 'role'],
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json(admin);
  } catch (error) {
    console.error('Get Admin Me Error:', error);
    return res.status(500).json({ message: 'Server error retrieving admin profile', error: error.message });
  }
};
