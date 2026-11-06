import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Expert, ExpertSession } from '../models/index.js';
import { isExpertBlacklisted } from '../controllers/authController.js';

dotenv.config();

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');
      if (decoded.jti) {
        const session = await ExpertSession.findByPk(decoded.jti);
        if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
          return res.status(401).json({ message: 'Session has expired or was revoked' });
        }
      }

      if (decoded.id) {
        const expert = await Expert.findByPk(decoded.id, { attributes: ['id', 'isBlacklisted', 'onboardingMetadata'] });
        if (isExpertBlacklisted(expert)) {
          return res.status(403).json({ message: 'Your profile is Marked as Blacklisted', code: 'CREDENTIALS_BLACKLISTED' });
        }
      }
      
      // Store the decoded token details (id, email, fullName) in the request object
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
