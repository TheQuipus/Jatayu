import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { Admin, Setting } from '../models/index.js';

const lockouts = new Map();
const lockoutKey = (type, id, sourceIp = '127.0.0.1') => `${type}:${id}:${sourceIp}`;
let currentClientIp = '127.0.0.1';
const adminLoginLockoutState = {
  getPasswordLoginIpLockout: async () => null,
  getPasswordLoginLockout: async (type, id, sourceIp = '127.0.0.1') => {
    const state = lockouts.get(lockoutKey(type, id, sourceIp));
    return state?.lockedUntil > Date.now() ? { lockedUntil: state.lockedUntil } : null;
  },
  recordFailedPasswordLogin: async (type, account, sourceIp = '127.0.0.1') => {
    if (!account) {
      return { lockedUntil: null, ipLockedUntil: null };
    }
    const key = lockoutKey(type, account.id, sourceIp);
    const state = lockouts.get(key) || { attempts: 0 };
    if (state.lockedUntil > Date.now()) return { lockedUntil: state.lockedUntil, ipLockedUntil: null };
    state.attempts += 1;
    state.lockedUntil = state.attempts >= 5 ? Date.now() + 10 * 60 * 1000 : null;
    lockouts.set(key, state);
    return { lockedUntil: state.lockedUntil, ipLockedUntil: null };
  },
  clearPasswordLoginFailures: async (type, id, sourceIp = '127.0.0.1') => {
    const key = lockoutKey(type, id, sourceIp);
    const state = lockouts.get(key);
    if (state?.lockedUntil > Date.now()) return { lockedUntil: state.lockedUntil };
    lockouts.delete(key);
    return { lockedUntil: null };
  },
  clearPasswordLoginIpFailures: async () => ({ lockedUntil: null }),
};
const originalAdminLoginLockoutState = { ...adminLoginLockoutState };
mock.module('../utils/accountLoginLockout.js', {
  namedExports: {
    buildPasswordLoginLockedResponse: (lockedUntil) => ({ code: 'ACCOUNT_LOCKED', lockedUntil }),
    buildPasswordLoginRateLimitResponse: (lockedUntil) => ({ code: 'IP_RATE_LIMITED', lockedUntil }),
    getClientIpAddress: () => currentClientIp,
    getPasswordLoginIpLockout: async (...args) => adminLoginLockoutState.getPasswordLoginIpLockout(...args),
    getPasswordLoginLockout: async (...args) => adminLoginLockoutState.getPasswordLoginLockout(...args),
    recordFailedPasswordLogin: async (...args) => adminLoginLockoutState.recordFailedPasswordLogin(...args),
    clearPasswordLoginFailures: async (...args) => adminLoginLockoutState.clearPasswordLoginFailures(...args),
    clearPasswordLoginIpFailures: async (...args) => adminLoginLockoutState.clearPasswordLoginIpFailures(...args),
  },
});

const { adminLogin } = await import('./adminAuthController.js');

test('admin validates credentials before sending a single-use email OTP', async (t) => {
  const previous = process.env.ADMIN_LOGIN_OTP_ENABLED;
  delete process.env.ADMIN_LOGIN_OTP_ENABLED;
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_LOGIN_OTP_ENABLED;
    else process.env.ADMIN_LOGIN_OTP_ENABLED = previous;
  });
  const admin = { id: 'test-admin', email: 'admin@example.com', password: await bcrypt.hash('correct-password', 4), role: 'admin' };
  const settings = new Map(Object.entries({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'sender@example.com', SMTP_PASS: 'test-secret', SMTP_PORT: '465' }));
  const rows = new Map();
  t.mock.method(Admin, 'findOne', async () => admin);
  t.mock.method(Setting.sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(Setting, 'findOrCreate', async ({ where: { key } }) => {
    if (!rows.has(key)) rows.set(key, {
      value: '{}',
      save: async () => {},
      destroy: async () => rows.delete(key),
    });
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

test('admin can disable OTP explicitly while still requiring valid credentials', async (t) => {
  const previous = process.env.ADMIN_LOGIN_OTP_ENABLED;
  process.env.ADMIN_LOGIN_OTP_ENABLED = 'false';
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_LOGIN_OTP_ENABLED;
    else process.env.ADMIN_LOGIN_OTP_ENABLED = previous;
  });
  const admin = { id: 'test-admin', email: 'admin@example.com', password: await bcrypt.hash('correct-password', 4), role: 'admin' };
  t.mock.method(Admin, 'findOne', async () => admin);
  t.mock.method(Setting, 'findByPk', async () => { throw new Error('OTP settings must not be accessed'); });
  const login = async (password) => {
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await adminLogin({ body: { email: admin.email, password } }, res);
    return res;
  };
  assert.equal((await login('wrong-password')).statusCode, 401);
  const response = await login('correct-password');
  assert.equal(response.statusCode, 200);
  assert.ok(response.body.token);
  assert.equal(response.body.user.id, admin.id);
  assert.equal(response.body.requiresOtp, undefined);
  t.mock.method(Admin, 'findOne', async () => null);
  assert.equal((await login('correct-password')).statusCode, 401);
});

test('admin password login locks after five incorrect passwords', async (t) => {
  const previous = process.env.ADMIN_LOGIN_OTP_ENABLED;
  process.env.ADMIN_LOGIN_OTP_ENABLED = 'false';
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_LOGIN_OTP_ENABLED;
    else process.env.ADMIN_LOGIN_OTP_ENABLED = previous;
  });
  const admin = { id: 'locked-admin', email: 'locked@example.com', password: await bcrypt.hash('correct-password', 4), role: 'admin' };
  t.mock.method(Admin, 'findOne', async () => admin);
  const login = async (password) => {
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await adminLogin({ body: { email: admin.email, password } }, res);
    return res;
  };

  for (let attempt = 1; attempt < 5; attempt++) {
    assert.equal((await login('wrong-password')).statusCode, 401);
  }
  const locked = await login('wrong-password');
  assert.equal(locked.statusCode, 429);
  assert.equal(locked.body.code, 'ACCOUNT_LOCKED');
  const correct = await login('correct-password');
  assert.equal(correct.statusCode, 429);
  assert.equal(correct.body.code, 'ACCOUNT_LOCKED');
});

test('admin login keeps unknown-account and incorrect-password responses generic', async (t) => {
  const admin = {
    id: 'generic-login-admin',
    email: 'generic-admin@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    role: 'admin',
  };
  t.mock.method(Admin, 'findOne', async ({ where }) =>
    where.email === admin.email ? admin : null);

  const unknown = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: 'unknown@example.com', password: 'wrong' } }, unknown);
  const wrongPassword = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: admin.email, password: 'wrong' } }, wrongPassword);

  assert.deepEqual(
    [unknown.statusCode, unknown.body],
    [wrongPassword.statusCode, wrongPassword.body],
  );
  assert.equal(unknown.statusCode, 401);
  assert.equal(unknown.body.message, 'Invalid email or password');
});

test('admin login blocks active IP lockouts and tracks unknown-account IP failures', async (t) => {
  const previous = process.env.ADMIN_LOGIN_OTP_ENABLED;
  process.env.ADMIN_LOGIN_OTP_ENABLED = 'false';
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_LOGIN_OTP_ENABLED;
    else process.env.ADMIN_LOGIN_OTP_ENABLED = previous;
    Object.assign(adminLoginLockoutState, originalAdminLoginLockoutState);
  });

  const admin = {
    id: 'ip-admin',
    email: 'ip-admin@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    role: 'admin',
  };
  const lookupCalls = { count: 0 };
  const recordCalls = [];

  adminLoginLockoutState.getPasswordLoginIpLockout = async () => ({ lockedUntil: Date.now() + 60_000 });
  t.mock.method(Admin, 'findOne', async ({ where }) => {
    lookupCalls.count += 1;
    return where.email === admin.email ? admin : null;
  });

  const lockedIpRes = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: admin.email, password: 'CorrectPassword1!' } }, lockedIpRes);
  assert.equal(lockedIpRes.statusCode, 429);
  assert.equal(lockedIpRes.body.code, 'IP_RATE_LIMITED');
  assert.equal(lookupCalls.count, 0);

  adminLoginLockoutState.getPasswordLoginIpLockout = async () => null;
  adminLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => {
    recordCalls.push({ type, account, sourceIp });
    return { lockedUntil: null, ipLockedUntil: null };
  };
  const unknownRes = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: 'missing-admin@example.com', password: 'wrong' } }, unknownRes);
  assert.equal(unknownRes.statusCode, 401);
  assert.equal(unknownRes.body.message, 'Invalid email or password');
  assert.equal(recordCalls.at(-1).account, null);
  assert.equal(recordCalls.at(-1).sourceIp, '127.0.0.1');

  adminLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => {
    recordCalls.push({ type, account, sourceIp, ipLockedUntil: Date.now() + 60_000 });
    return { lockedUntil: null, ipLockedUntil: Date.now() + 60_000 };
  };
  const rateLimitedRes = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: 'missing-admin@example.com', password: 'wrong' } }, rateLimitedRes);
  assert.equal(rateLimitedRes.statusCode, 429);
  assert.equal(rateLimitedRes.body.code, 'IP_RATE_LIMITED');

  adminLoginLockoutState.getPasswordLoginIpLockout = async () => null;
  adminLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => ({ lockedUntil: null, ipLockedUntil: null });
  adminLoginLockoutState.clearPasswordLoginIpFailures = async (ip) => {
    recordCalls.push({ clearIp: ip });
    return { lockedUntil: null };
  };
  const successRes = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: admin.email, password: 'CorrectPassword1!' } }, successRes);
  assert.equal(successRes.statusCode, 200);
  assert.ok(successRes.body.token);
  assert.equal(successRes.body.user.id, admin.id);
  assert.equal(recordCalls.some((entry) => entry.clearIp === '127.0.0.1'), true);
});

test('admin login uses the requesting IP when checking account lockout state across IPs', async (t) => {
  const previous = process.env.ADMIN_LOGIN_OTP_ENABLED;
  process.env.ADMIN_LOGIN_OTP_ENABLED = 'false';
  const admin = {
    id: 'cross-ip-admin',
    email: 'cross-ip-admin@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    role: 'admin',
  };
  const attackerIp = '203.0.113.10';
  const legitimateIp = '198.51.100.20';
  const attackerLockUntil = Date.now() + 60_000;
  const lookupCalls = [];
  const originalLookup = adminLoginLockoutState.getPasswordLoginLockout.bind(adminLoginLockoutState);
  const originalClear = adminLoginLockoutState.clearPasswordLoginFailures.bind(adminLoginLockoutState);
  const originalClearIp = adminLoginLockoutState.clearPasswordLoginIpFailures.bind(adminLoginLockoutState);

  lockouts.set(lockoutKey('admin', admin.id, attackerIp), { attempts: 5, lockedUntil: attackerLockUntil });
  currentClientIp = legitimateIp;

  adminLoginLockoutState.getPasswordLoginLockout = async (...args) => {
    lookupCalls.push(args);
    return originalLookup(...args);
  };
  adminLoginLockoutState.clearPasswordLoginFailures = async (...args) => {
    lookupCalls.push(['clear', ...args]);
    return originalClear(...args);
  };
  adminLoginLockoutState.clearPasswordLoginIpFailures = async (...args) => {
    lookupCalls.push(['clear-ip', ...args]);
    return originalClearIp(...args);
  };

  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_LOGIN_OTP_ENABLED;
    else process.env.ADMIN_LOGIN_OTP_ENABLED = previous;
    currentClientIp = '127.0.0.1';
    lockouts.clear();
    adminLoginLockoutState.getPasswordLoginLockout = originalLookup;
    adminLoginLockoutState.clearPasswordLoginFailures = originalClear;
    adminLoginLockoutState.clearPasswordLoginIpFailures = originalClearIp;
    Object.assign(adminLoginLockoutState, originalAdminLoginLockoutState);
  });

  t.mock.method(Admin, 'findOne', async ({ where }) => where.email === admin.email ? admin : null);

  const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await adminLogin({ body: { email: admin.email, password: 'CorrectPassword1!' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, admin.id);
  assert.equal(lookupCalls.some(([type, id, sourceIp]) => type === 'admin' && id === admin.id && sourceIp === legitimateIp), true);
  assert.equal(lookupCalls.some(([type, id, sourceIp]) => type === 'admin' && id === admin.id && sourceIp === attackerIp), false);
  assert.equal(lockouts.get(lockoutKey('admin', admin.id, attackerIp))?.lockedUntil, attackerLockUntil);
  assert.equal(lockouts.has(lockoutKey('admin', admin.id, legitimateIp)), false);
});
