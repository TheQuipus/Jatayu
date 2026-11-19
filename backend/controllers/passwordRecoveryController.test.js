import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { Admin, Expert, ExpertSession, Seeker, Setting } from '../models/index.js';
import { requestPasswordReset, resetPassword } from './passwordRecoveryController.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('password recovery is generic, hashed, single-use, and works for every role', async (t) => {
  const accounts = {
    admin: { id: 'admin-id', email: 'admin@example.com', password: 'old-admin', save: async () => {} },
    expert: { id: 'expert-id', email: 'expert@example.com', password: 'old-expert', save: async () => {} },
    user: { id: 'seeker-id', email: 'seeker@example.com', password: 'old-seeker', save: async () => {} },
  };
  const models = { admin: Admin, expert: Expert, user: Seeker };
  for (const [role, model] of Object.entries(models)) {
    t.mock.method(model, 'findOne', async ({ where: { email } }) => accounts[role].email === email ? accounts[role] : null);
    t.mock.method(model, 'findByPk', async (id) => accounts[role].id === id ? accounts[role] : null);
  }
  const rows = new Map();
  const settings = new Map(Object.entries({
    EMAIL_ENABLED: 'true', SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465',
    SMTP_SECURE: 'true', SMTP_USER: 'sender@example.com', SMTP_PASS: 'test-secret',
  }));
  t.mock.method(Setting.sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(Setting, 'findOrCreate', async ({ where: { key } }) => {
    if (!rows.has(key)) rows.set(key, { value: '{}', save: async function save() { rows.set(key, this); } });
    return [rows.get(key), !rows.has(key)];
  });
  t.mock.method(Setting, 'findByPk', async (key) => rows.get(key) || (settings.has(key) ? { value: settings.get(key) } : null));
  t.mock.method(Setting, 'destroy', async ({ where: { key } }) => rows.delete(key));
  t.mock.method(ExpertSession, 'update', async () => [1]);
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));
  const messages = [];
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async (message) => messages.push(message) }));

  const unknown = response();
  await requestPasswordReset({ body: { role: 'user', email: 'missing@example.com' } }, unknown);
  assert.equal(unknown.statusCode, 202);
  assert.equal(messages.length, 0);
  assert.doesNotMatch(unknown.body.message, /missing|not found/i);

  for (const role of Object.keys(accounts)) {
    const messagesBeforeRequest = messages.length;
    const requested = response();
    await requestPasswordReset({ body: { role, email: accounts[role].email } }, requested);
    assert.equal(requested.statusCode, 202);
    const throttled = response();
    await requestPasswordReset({ body: { role, email: accounts[role].email } }, throttled);
    assert.equal(throttled.statusCode, 202);
    assert.equal(messages.length, messagesBeforeRequest + 1, 'repeated requests must be throttled');
    const resetUrl = new URL(messages.at(-1).text.match(/https?:\/\/\S+/)[0]);
    const token = resetUrl.searchParams.get('token');
    const userId = resetUrl.searchParams.get('id');
    const stored = rows.get(`_PASSWORD_RESET:${role}:${userId}`).value;
    assert.ok(token);
    assert.ok(!stored.includes(token), 'plaintext reset token must never be stored');

    const changed = response();
    await resetPassword({ body: { role, userId, token, password: 'NewSecure1!' } }, changed);
    assert.equal(changed.statusCode, 200);
    assert.equal(await bcrypt.compare('NewSecure1!', accounts[role].password), true);

    const replay = response();
    await resetPassword({ body: { role, userId, token, password: 'AnotherSecure2!' } }, replay);
    assert.equal(replay.statusCode, 400, 'reset link must be single-use');
  }

  const expiredRequest = response();
  await requestPasswordReset({ body: { role: 'admin', email: accounts.admin.email } }, expiredRequest);
  const expiredUrl = new URL(messages.at(-1).text.match(/https?:\/\/\S+/)[0]);
  const expiredKey = `_PASSWORD_RESET:admin:${accounts.admin.id}`;
  rows.get(expiredKey).value = JSON.stringify({ ...JSON.parse(rows.get(expiredKey).value), expiresAt: 0 });
  const expired = response();
  await resetPassword({ body: { role: 'admin', userId: accounts.admin.id, token: expiredUrl.searchParams.get('token'), password: 'ExpiredSecure3!' } }, expired);
  assert.equal(expired.statusCode, 400);
});

test('password reset rejects malformed input and weak passwords', async () => {
  const badRequest = response();
  await requestPasswordReset({ body: { role: 'invalid', email: 'not-an-email' } }, badRequest);
  assert.equal(badRequest.statusCode, 422);

  const weakReset = response();
  await resetPassword({ body: { role: 'admin', userId: 'id', token: 'short', password: 'password' } }, weakReset);
  assert.equal(weakReset.statusCode, 422);
});
