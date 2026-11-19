import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import test from 'node:test';
import { Seeker } from '../../models/index.js';
import { protectSeeker, optionalProtectSeeker } from './seekerAuthMiddleware.js';

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

test('rejects unauthenticated profile reads and writes before the route handler', async () => {
  for (const method of ['GET', 'PUT']) {
    const req = { method, headers: {} };
    const res = response();
    let continued = false;

    await protectSeeker(req, res, () => {
      continued = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(continued, false);
  }
});

test('rejects a valid token for a non-Seeker account', async () => {
  const token = jwt.sign({ id: 'expert-id', role: 'expert' }, secret);
  const res = response();
  let continued = false;

  await protectSeeker(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => {
      continued = true;
    },
  );

  assert.equal(res.statusCode, 403);
  assert.equal(continued, false);
});

test('authenticates the Seeker identity from the verified token for active seekers', async (t) => {
  t.mock.method(Seeker, 'findByPk', async () => ({
    id: 'authenticated-seeker-id',
    status: 'active',
    onboardingMetadata: {},
  }));

  const token = jwt.sign({ id: 'authenticated-seeker-id', role: 'seeker' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let continued = false;

  await protectSeeker(req, res, () => {
    continued = true;
  });

  assert.equal(continued, true);
  assert.equal(req.user.id, 'authenticated-seeker-id');
  assert.equal(req.user.role, 'seeker');
  assert.equal(req.seeker.id, 'authenticated-seeker-id');
});

test('protectSeeker blocks suspended seeker with 403 ACCOUNT_SUSPENDED', async (t) => {
  t.mock.method(Seeker, 'findByPk', async () => ({
    id: 'suspended-seeker-id',
    status: 'suspended',
    onboardingMetadata: { suspendedAt: new Date().toISOString() },
  }));

  const token = jwt.sign({ id: 'suspended-seeker-id', role: 'seeker' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let continued = false;

  await protectSeeker(req, res, () => {
    continued = true;
  });

  assert.equal(continued, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'ACCOUNT_SUSPENDED');
  assert.equal(res.body.message, 'Your Profile has been suspended. Contact Us?');
});

test('protectSeeker blocks deleted seeker with 403 ACCOUNT_DELETED', async (t) => {
  t.mock.method(Seeker, 'findByPk', async () => ({
    id: 'deleted-seeker-id',
    status: 'deleted',
    onboardingMetadata: {},
  }));

  const token = jwt.sign({ id: 'deleted-seeker-id', role: 'seeker' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let continued = false;

  await protectSeeker(req, res, () => {
    continued = true;
  });

  assert.equal(continued, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'ACCOUNT_DELETED');
});

test('protectSeeker rejects missing/deleted seeker records with 401', async (t) => {
  t.mock.method(Seeker, 'findByPk', async () => null);

  const token = jwt.sign({ id: 'missing-seeker-id', role: 'seeker' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let continued = false;

  await protectSeeker(req, res, () => {
    continued = true;
  });

  assert.equal(continued, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /not found/i);
});
