import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ExpertSession } from '../models/index.js';
import { forceDisconnectUser } from './notificationService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

function deviceName(userAgent = '') {
  const browser = /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox'
    : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : 'Browser';
  const platform = /iPhone|iPad/.test(userAgent) ? 'iOS' : /Android/.test(userAgent) ? 'Android'
    : /Windows/.test(userAgent) ? 'Windows' : /Mac OS/.test(userAgent) ? 'macOS' : /Linux/.test(userAgent) ? 'Linux' : 'Unknown device';
  return `${browser} on ${platform}`;
}

export async function issueExpertToken(expert, req, loginMethod = 'password') {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  const token = jwt.sign(
    { id: expert.id, email: expert.email, fullName: expert.fullName, jti: id },
    JWT_SECRET,
    { expiresIn: '30d' },
  );
  await ExpertSession.create({
    id, expertId: expert.id, device: deviceName(req.get('user-agent')),
    ipAddress: req.ip || req.socket?.remoteAddress || null, loginMethod, expiresAt,
  });
  return token;
}

export async function revokeAndExpelExpertSessions(
  expertId,
  reason = 'CREDENTIALS_BLACKLISTED',
  message = 'Your profile is Marked as Blacklisted',
) {
  try {
    await ExpertSession.update(
      { revokedAt: new Date() },
      { where: { expertId, revokedAt: null } }
    );
  } catch (err) {
    console.warn(`[Session Revoke Warning] Could not revoke sessions for expert ${expertId}:`, err.message);
  }

  try {
    forceDisconnectUser('expert', expertId, { reason, message });
  } catch (err) {
    console.warn(`[Force Disconnect Warning] Could not disconnect sockets for expert ${expertId}:`, err.message);
  }
}
