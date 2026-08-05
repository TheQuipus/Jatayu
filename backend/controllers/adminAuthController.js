import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';
import { TEMP_SMS_OTP } from '../utils/smsService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

/**
 * Admin login with email, password, and temporary OTP (123456 until MFA is configured).
 */
export const adminLogin = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
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

    // Temporary OTP until Google Authenticator / MFA is configured
    if (otp !== TEMP_SMS_OTP) {
      return res.status(401).json({ message: 'Invalid OTP. Use 123456 until MFA is configured.' });
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
