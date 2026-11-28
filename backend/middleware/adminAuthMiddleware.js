import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AdminSessionError, validateAdminSession } from '../services/adminSessionService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

export const protectAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no admin token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const isPassive = String(req.get?.('x-admin-activity') || '').toLowerCase() === 'passive';
    const isHeartbeat = req.path === '/auth/heartbeat';
    const { session, idleConfig } = await validateAdminSession(decoded, {
      touch: !isPassive,
      forceTouch: isHeartbeat,
    });

    req.admin = decoded;
    req.adminSession = session;
    req.adminIdleConfig = idleConfig;
    return next();
  } catch (error) {
    if (error instanceof AdminSessionError) {
      return res.status(401).json({ message: error.message, code: error.code });
    }
    return res.status(401).json({ message: 'Not authorized, admin token validation failed' });
  }
};
