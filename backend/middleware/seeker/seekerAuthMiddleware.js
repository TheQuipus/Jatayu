import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Seeker } from '../../models/index.js';
import { isSeekerSuspended } from '../../controllers/seeker/seekerAuthController.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

export const protectSeeker = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.role !== 'seeker') {
        return res.status(403).json({ message: 'Not authorized as seeker' });
      }

      if (!decoded.id) {
        return res.status(401).json({ message: 'Not authorized, invalid token payload' });
      }

      const seeker = await Seeker.findByPk(decoded.id, {
        attributes: ['id', 'status', 'onboardingMetadata'],
      });
      if (!seeker) {
        return res.status(401).json({ message: 'Not authorized, seeker account not found' });
      }
      if (isSeekerSuspended(seeker)) {
        return res.status(403).json({
          message: 'Your Profile has been suspended. Contact Us?',
          code: 'ACCOUNT_SUSPENDED',
        });
      }
      if (seeker.status === 'deleted') {
        return res.status(403).json({
          message: 'Your account has been deleted.',
          code: 'ACCOUNT_DELETED',
        });
      }

      req.user = decoded;
      req.seeker = seeker;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

export const optionalProtectSeeker = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'seeker' && decoded.id) {
        const seeker = await Seeker.findByPk(decoded.id, {
          attributes: ['id', 'status', 'onboardingMetadata'],
        });
        if (seeker && !isSeekerSuspended(seeker) && seeker.status !== 'deleted') {
          req.user = decoded;
          req.seeker = seeker;
        }
      }
    } catch {
      // Continue without user if token invalid
    }
  }
  return next();
};

