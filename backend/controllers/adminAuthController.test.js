import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { Admin, Setting } from '../models/index.js';
import { adminLogin } from './adminAuthController.js';

test('admin validates credentials before sending a single-use email OTP', async (t) => {
  const admin = { id: 'test-admin', email: 'admin@example.com', password: await bcrypt.hash('correct-password', 4), role: 'admin' };
  const settings = new Map(Object.entries({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'sender@example.com', SMTP_PASS: 'test-secret', SMTP_PORT: '465' }));
  const rows = new Map();
  t.mock.method(Admin, 'findOne', async () => admin);
  t.mock.method(Setting.sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(Setting, 'findOrCreate', async ({ where: { key } }) => {
    if (!rows.has(key)) rows.set(key, { value: '{}', save: async () => {} });
  });
  t.mock.method(Setting, 'findByPk', async (key) => rows.get(key) || (settings.has(key) ? { value: settings.get(key) } : null));
  t.mock.method(Setting, 'destroy', async ({ where: { key } }) => rows.delete(key));
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));
  const messages = [];
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async (message) => messages.push(message) }));
  const login = async (password, otp) => {
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await adminLogin({ body: { email: admin.email, password, ...(otp === undefined ? {} : { otp }) } }, res);
    return res;
  };
  assert.equal((await login('wrong-password')).statusCode, 401);
  assert.equal(messages.length, 0);
  assert.equal((await login('correct-password', '000000')).statusCode, 401, 'a code must be issued before verification');
  const challenge = await login('correct-password');
  assert.equal(challenge.statusCode, 202);
  assert.equal(challenge.body.requiresOtp, true);
  assert.equal(challenge.body.token, undefined);
  const code = messages[0].text.match(/code is (\d{6})/)[1];
  const row = [...rows.values()][0];
  assert.ok(!row.value.includes(code), 'stored challenge must not contain plaintext OTP');
  assert.equal((await login('correct-password')).statusCode, 503, 'resend cooldown');
  const wrongCode = code === '000000' ? '999999' : '000000';
  assert.equal((await login('correct-password', wrongCode)).statusCode, 401);
  assert.equal((await login('correct-password', code)).statusCode, 200);
  assert.equal((await login('correct-password', code)).statusCode, 401, 'code cannot be replayed');

  row.value = JSON.stringify({ ...JSON.parse(row.value), sentAt: 0 });
  await login('correct-password');
  const nextCode = messages.at(-1).text.match(/code is (\d{6})/)[1];
  for (let attempt = 0; attempt < 5; attempt++) assert.equal((await login('correct-password', '000000')).statusCode, 401);
  assert.equal((await login('correct-password', nextCode)).statusCode, 401, 'attempt limit');

  row.value = JSON.stringify({ ...JSON.parse(row.value), sentAt: 0 });
  await login('correct-password');
  const expiredCode = messages.at(-1).text.match(/code is (\d{6})/)[1];
  row.value = JSON.stringify({ ...JSON.parse(row.value), expiresAt: 0 });
  assert.equal((await login('correct-password', expiredCode)).statusCode, 401);
  settings.set('EMAIL_ENABLED', 'false');
  assert.equal((await login('correct-password')).statusCode, 503, 'disabled email must not issue a login token');
});
