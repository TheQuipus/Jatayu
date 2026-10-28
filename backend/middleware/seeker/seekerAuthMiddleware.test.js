import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import test from 'node:test';
import { protectSeeker } from './seekerAuthMiddleware.js';

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

test('authenticates the Seeker identity from the verified token', async () => {
  const token = jwt.sign({ id: 'authenticated-seeker-id', role: 'seeker' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();

  await protectSeeker(req, res, () => {});

  assert.equal(req.user.id, 'authenticated-seeker-id');
  assert.equal(req.user.role, 'seeker');
});
