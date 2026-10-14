import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';
import { requestAdminOtp, verifyAdminOtp } from '../utils/adminLoginOtp.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

/**
 * Admin login validates credentials before issuing an email verification code.
 */
export const adminLogin = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const admin = await Admin.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
