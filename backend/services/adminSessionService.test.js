import assert from 'node:assert/strict';
import test from 'node:test';
import { AdminSession, Setting } from '../models/index.js';
import {
  AdminSessionError,
  DEFAULT_ADMIN_IDLE_TIMEOUT_MINUTES,
  getAdminIdleConfig,
  getEffectiveAdminWarningSeconds,
  invalidateAdminIdleConfigCache,
  issueAdminSessionAndToken,
  revokeAdminSession,
  validateAdminSession,
} from './adminSessionService.js';

test('default admin idle timeout is 5 minutes and clamps warning for 1 min testing', () => {
  assert.equal(DEFAULT_ADMIN_IDLE_TIMEOUT_MINUTES, 5);
  assert.equal(getEffectiveAdminWarningSeconds(1, 60), 20);
  assert.equal(getEffectiveAdminWarningSeconds(5, 60), 60);
  assert.equal(getEffectiveAdminWarningSeconds(0, 60), 0);
});

test('getAdminIdleConfig reads Setting values and supports Disabled (0)', async (t) => {
  invalidateAdminIdleConfigCache();
  t.mock.method(Setting, 'findByPk', async (key) => {
    if (key === 'ADMIN_IDLE_TIMEOUT_MINUTES') return { value: '0' };
    if (key === 'ADMIN_IDLE_WARNING_SECONDS') return { value: '30' };
    return null;
  });

  const config = await getAdminIdleConfig();
  assert.equal(config.idleTimeoutMinutes, 0);
  assert.equal(config.idleWarningSeconds, 30);
  assert.equal(config.effectiveWarningSeconds, 0);
  invalidateAdminIdleConfigCache();
});

test('issueAdminSessionAndToken creates AdminSession with jti and validates active/passive/expired states', async (t) => {
  invalidateAdminIdleConfigCache();
  t.mock.method(Setting, 'findByPk', async (key) => {
    if (key === 'ADMIN_IDLE_TIMEOUT_MINUTES') return { value: '5' };
    if (key === 'ADMIN_IDLE_WARNING_SECONDS') return { value: '60' };
    return null;
  });

  const sessions = new Map();
  t.mock.method(AdminSession, 'create', async (data) => {
    const record = {
      ...data,
      save: async () => {
        sessions.set(record.id, record);
        return record;
      },
    };
    sessions.set(record.id, record);
    return record;
  });
  t.mock.method(AdminSession, 'findByPk', async (id) => sessions.get(id) || null);
  t.mock.method(AdminSession, 'update', async (values, { where }) => {
    const existing = sessions.get(where.id);
    if (!existing || existing.revokedAt) return [0];
    Object.assign(existing, values);
    return [1];
  });

  const admin = { id: 'admin-1', email: 'admin@jatayu.in', fullName: 'Quipus Admin', role: 'admin' };
  const req = { get: () => 'Chrome', ip: '127.0.0.1' };
  const { token, sessionId } = await issueAdminSessionAndToken(admin, req);
  assert.ok(token);
  assert.ok(sessions.has(sessionId));

  // Passive request does not bump lastActivityAt
  const stored = sessions.get(sessionId);
  const older = new Date(Date.now() - 45_000);
  stored.lastActivityAt = older;
  await validateAdminSession({ id: admin.id, jti: sessionId }, { touch: false });
  assert.equal(stored.lastActivityAt.getTime(), older.getTime());

  // Active request bumps lastActivityAt when older than throttle
  await validateAdminSession({ id: admin.id, jti: sessionId }, { touch: true });
  assert.ok(stored.lastActivityAt.getTime() > older.getTime());

  // Idle timeout beyond 5m + 30s grace revokes session and throws ADMIN_SESSION_IDLE_TIMEOUT
  stored.lastActivityAt = new Date(Date.now() - (5 * 60_000 + 35_000));
  await assert.rejects(
    () => validateAdminSession({ id: admin.id, jti: sessionId }),
    (err) => err instanceof AdminSessionError && err.code === 'ADMIN_SESSION_IDLE_TIMEOUT',
  );
  assert.ok(stored.revokedAt);

  // Manual revocation
  const { sessionId: session2 } = await issueAdminSessionAndToken(admin, req);
  assert.equal(await revokeAdminSession(session2), 1);
  await assert.rejects(
    () => validateAdminSession({ id: admin.id, jti: session2 }),
    (err) => err instanceof AdminSessionError && err.code === 'ADMIN_SESSION_REVOKED',
  );

  invalidateAdminIdleConfigCache();
});

