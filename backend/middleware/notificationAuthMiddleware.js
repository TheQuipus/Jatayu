import jwt from 'jsonwebtoken';
import { Expert, ExpertSession } from '../models/index.js';
import { isExpertBlacklisted, isExpertSuspended } from '../controllers/authController.js';
import { AdminSessionError, validateAdminSession } from '../services/adminSessionService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

export async function protectNotification(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
    const user = token && jwt.verify(token, JWT_SECRET);
    if (!user?.id) throw new Error('Unauthorized');
    user.role ||= 'expert';
    if (!['seeker', 'expert', 'admin'].includes(user.role)) throw new Error('Unauthorized');

    if (user.role === 'expert') {
      const expert = await Expert.findByPk(user.id, {
        attributes: ['id', 'status', 'isBlacklisted', 'onboardingMetadata'],
      });
      if (!expert) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      if (isExpertBlacklisted(expert)) {
        return res.status(403).json({
          message: 'Your profile is Marked as Blacklisted',
          code: 'CREDENTIALS_BLACKLISTED',
        });
      }
      if (isExpertSuspended(expert)) {
        return res.status(403).json({
          message: 'Your Profile has been suspended. Contact Us?',
          code: 'ACCOUNT_SUSPENDED',
        });
      }
      if (user.jti) {
        const session = await ExpertSession.findByPk(user.jti);
        if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
          return res.status(401).json({ message: 'Session has expired or was revoked' });
        }
      }
    }

    if (user.role === 'admin') {
      const isPassive = String(req.get?.('x-admin-activity') || '').toLowerCase() === 'passive';
      await validateAdminSession(user, { touch: !isPassive });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof AdminSessionError) {
      return res.status(401).json({ message: error.message, code: error.code });
    }
    return res.status(401).json({ message: 'Not authorized' });
  }
}
