import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import test from 'node:test';
import { Expert, ExpertSession } from '../models/index.js';
import { protect } from './authMiddleware.js';
import { protectNotification } from './notificationAuthMiddleware.js';

const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

function response() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('protect rejects Seeker and Admin JWTs on expert routes', async () => {
  for (const role of ['seeker', 'admin']) {
    const token = jwt.sign({ id: `${role}-id`, role }, secret);
    const res = response();
    let continued = false;

    await protect({ headers: { authorization: `Bearer ${token}` } }, res, () => {
      continued = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(continued, false);
  }
});

test('protect rejects tokens belonging to deleted/missing experts', async (t) => {
  t.mock.method(Expert, 'findByPk', async () => null);
  const token = jwt.sign({ id: 'deleted-expert-id', jti: 'sess-1' }, secret);
  const res = response();
  let continued = false;

  await protect({ headers: { authorization: `Bearer ${token}` } }, res, () => {
    continued = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(continued, false);
});

test('protect allows valid active expert tokens with active session', async (t) => {
  t.mock.method(Expert, 'findByPk', async () => ({
    id: 'active-expert',
    status: 'approved',
    isBlacklisted: false,
    onboardingMetadata: {},
  }));
  t.mock.method(ExpertSession, 'findByPk', async () => ({
    id: 'sess-ok',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  }));

  const token = jwt.sign({ id: 'active-expert', jti: 'sess-ok' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let continued = false;

  await protect(req, res, () => {
    continued = true;
  });

  assert.equal(continued, true);
  assert.equal(req.user.id, 'active-expert');
});

test('protectNotification blocks blacklisted, suspended, and revoked-session experts', async (t) => {
  const token = jwt.sign({ id: 'expert-notif', jti: 'sess-revoked' }, secret);

  // Blacklisted expert
  t.mock.method(Expert, 'findByPk', async () => ({
    id: 'expert-notif',
    status: 'rejected',
    isBlacklisted: true,
    onboardingMetadata: {},
  }));
  const blacklistedRes = response();
  let continued = false;
  await protectNotification({ headers: { authorization: `Bearer ${token}` } }, blacklistedRes, () => {
    continued = true;
  });
  assert.equal(blacklistedRes.statusCode, 403);
  assert.equal(blacklistedRes.body.code, 'CREDENTIALS_BLACKLISTED');
  assert.equal(continued, false);

  // Suspended expert
  t.mock.method(Expert, 'findByPk', async () => ({
    id: 'expert-notif',
    status: 'suspended',
    isBlacklisted: false,
    onboardingMetadata: {},
  }));
  const suspendedRes = response();
  await protectNotification({ headers: { authorization: `Bearer ${token}` } }, suspendedRes, () => {
    continued = true;
  });
  assert.equal(suspendedRes.statusCode, 403);
  assert.equal(suspendedRes.body.code, 'ACCOUNT_SUSPENDED');
  assert.equal(continued, false);

  // Revoked session
  t.mock.method(Expert, 'findByPk', async () => ({
    id: 'expert-notif',
    status: 'approved',
    isBlacklisted: false,
    onboardingMetadata: {},
  }));
  t.mock.method(ExpertSession, 'findByPk', async () => ({
    id: 'sess-revoked',
    revokedAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
  }));
  const revokedRes = response();
  await protectNotification({ headers: { authorization: `Bearer ${token}` } }, revokedRes, () => {
    continued = true;
  });
  assert.equal(revokedRes.statusCode, 401);
  assert.equal(continued, false);

  // Seeker token still allowed cleanly
  const seekerToken = jwt.sign({ id: 'seeker-1', role: 'seeker' }, secret);
  const seekerReq = { headers: { authorization: `Bearer ${seekerToken}` } };
  const seekerRes = response();
  await protectNotification(seekerReq, seekerRes, () => {
    continued = true;
  });
  assert.equal(continued, true);
  assert.equal(seekerReq.user.role, 'seeker');
});

