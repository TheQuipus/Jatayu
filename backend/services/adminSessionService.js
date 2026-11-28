import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AdminSession } from '../models/index.js';
import { getDatabaseSetting } from '../utils/settingsHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

export const ADMIN_IDLE_TIMEOUT_PRESETS = [0, 1, 5, 10, 15, 30, 60];
export const DEFAULT_ADMIN_IDLE_TIMEOUT_MINUTES = 5;
export const DEFAULT_ADMIN_IDLE_WARNING_SECONDS = 60;
export const SERVER_IDLE_GRACE_MS = 30_000;
export const ACTIVITY_TOUCH_THROTTLE_MS = 30_000;
const CONFIG_CACHE_TTL_MS = 15_000;
const ADMIN_SESSION_TTL_MS = 7 * 86_400_000;

let cachedIdleConfig = null;
let cachedIdleConfigAt = 0;

export class AdminSessionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AdminSessionError';
    this.code = code;
  }
}

function deviceName(userAgent = '') {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const platform = /iPhone|iPad/.test(userAgent)
    ? 'iOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown device';
  return `${browser} on ${platform}`;
}

export function parseAdminIdleTimeoutMinutes(raw, fallback = DEFAULT_ADMIN_IDLE_TIMEOUT_MINUTES) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const parsed = Number(String(raw).trim());
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 1440) return fallback;
  return parsed;
}

export function parseAdminIdleWarningSeconds(raw, fallback = DEFAULT_ADMIN_IDLE_WARNING_SECONDS) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const parsed = Number(String(raw).trim());
  if (!Number.isInteger(parsed) || parsed < 10 || parsed > 300) return fallback;
  return parsed;
}

export function getEffectiveAdminWarningSeconds(timeoutMinutes, warningSeconds) {
  if (timeoutMinutes <= 0) return 0;
  return Math.min(warningSeconds, Math.max(10, Math.floor((timeoutMinutes * 60) / 3)));
}

export function invalidateAdminIdleConfigCache() {
  cachedIdleConfig = null;
  cachedIdleConfigAt = 0;
}

export async function getAdminIdleConfig() {
  const now = Date.now();
  if (cachedIdleConfig && now - cachedIdleConfigAt < CONFIG_CACHE_TTL_MS) {
    return cachedIdleConfig;
  }

  const [rawTimeout, rawWarning] = await Promise.all([
    getDatabaseSetting('ADMIN_IDLE_TIMEOUT_MINUTES', String(DEFAULT_ADMIN_IDLE_TIMEOUT_MINUTES)),
    getDatabaseSetting('ADMIN_IDLE_WARNING_SECONDS', String(DEFAULT_ADMIN_IDLE_WARNING_SECONDS)),
  ]);

  const idleTimeoutMinutes = parseAdminIdleTimeoutMinutes(rawTimeout);
  const idleWarningSeconds = parseAdminIdleWarningSeconds(rawWarning);

  cachedIdleConfig = {
    idleTimeoutMinutes,
    idleWarningSeconds,
    effectiveWarningSeconds: getEffectiveAdminWarningSeconds(idleTimeoutMinutes, idleWarningSeconds),
  };
  cachedIdleConfigAt = now;
  return cachedIdleConfig;
}

export async function issueAdminSessionAndToken(admin, req) {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ADMIN_SESSION_TTL_MS);

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      jti: id,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  await AdminSession.create({
    id,
    adminId: admin.id,
    device: deviceName(req?.get?.('user-agent') || ''),
    ipAddress: req?.ip || req?.socket?.remoteAddress || null,
    lastActivityAt: now,
    expiresAt,
  });

  const idleConfig = await getAdminIdleConfig();
  return { token, idleConfig, sessionId: id };
}

export async function validateAdminSession(decoded, { touch = true, forceTouch = false } = {}) {
  const idleConfig = await getAdminIdleConfig();

  if (!decoded?.jti) {
    if (process.env.ADMIN_REQUIRE_SESSION_JTI === 'true') {
      throw new AdminSessionError('ADMIN_SESSION_REVOKED', 'Admin session is invalid or expired. Please log in again.');
    }
    return { session: null, idleConfig, legacy: true };
  }

  const session = await AdminSession.findByPk(decoded.jti);
  if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new AdminSessionError('ADMIN_SESSION_REVOKED', 'Admin session has been revoked or expired. Please log in again.');
  }

  const nowMs = Date.now();
  const lastActivityMs = new Date(session.lastActivityAt).getTime();

  if (idleConfig.idleTimeoutMinutes > 0) {
    const timeoutMs = idleConfig.idleTimeoutMinutes * 60_000;
    if (nowMs - lastActivityMs > timeoutMs + SERVER_IDLE_GRACE_MS) {
      session.revokedAt = new Date(nowMs);
      await session.save().catch(() => {});
      throw new AdminSessionError('ADMIN_SESSION_IDLE_TIMEOUT', 'Your admin session expired due to inactivity. Please log in again.');
    }
  }

  if (forceTouch || (touch && nowMs - lastActivityMs >= ACTIVITY_TOUCH_THROTTLE_MS)) {
    session.lastActivityAt = new Date(nowMs);
    await session.save();
  }

  return { session, idleConfig, legacy: false };
}

export async function revokeAdminSession(jti) {
  if (!jti) return 0;
  const [updated] = await AdminSession.update(
    { revokedAt: new Date() },
    { where: { id: jti, revokedAt: null } },
  );
  return updated;
}

