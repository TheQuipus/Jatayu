import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const rows = new Map();
const deliveries = [];
let deliveryFails = false;
let deliveryAttempts = 0;
const Setting = {
  sequelize: {
    transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
  },
  findOrCreate: async ({ where: { key }, defaults }) => {
    if (!rows.has(key)) {
      rows.set(key, {
        value: defaults.value,
        save: async function () {},
        destroy: async function () { rows.delete(key); },
      });
    }
  },
  findByPk: async (key) => rows.get(key) || null,
};

mock.module('../models/index.js', { namedExports: { Setting } });
mock.module('./emailService.js', {
  namedExports: {
    sendAccountLockedEmail: async (message) => {
      deliveryAttempts += 1;
      if (deliveryFails) throw new Error('Delivery unavailable');
      deliveries.push(message);
    },
  },
});

const {
  clearPasswordLoginFailures,
  getClientIpAddress,
  getPasswordLoginIpLockout,
  getPasswordLoginLockout,
  LOGIN_IP_LOCKOUT_MINUTES,
  LOGIN_IP_LOCKOUT_THRESHOLD,
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_LOCKOUT_PREFIX,
  LOGIN_LOCKOUT_THRESHOLD,
  recordFailedPasswordLogin,
} = await import('./accountLoginLockout.js');

test('locks after five failures, emails once, and expires after ten minutes', async (t) => {
  rows.clear();
  deliveries.length = 0;
  deliveryAttempts = 0;
  let now = 1_000_000;
  t.mock.method(Date, 'now', () => now);
  const account = { id: 'expert-1', email: 'expert@example.com' };

  for (let attempt = 1; attempt < LOGIN_LOCKOUT_THRESHOLD; attempt++) {
    assert.equal((await recordFailedPasswordLogin('expert', account)).lockedUntil, null);
  }
  const locked = await recordFailedPasswordLogin('expert', account);
  assert.equal(locked.lockedUntil, now + LOGIN_LOCKOUT_MINUTES * 60 * 1000);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].recipientEmail, account.email);
  assert.equal((await getPasswordLoginLockout('expert', account.id)).lockedUntil, locked.lockedUntil);

  await recordFailedPasswordLogin('expert', account);
  assert.equal(deliveries.length, 1);

  now = locked.lockedUntil;
  assert.equal(await getPasswordLoginLockout('expert', account.id), null);
  assert.equal(rows.has(`${LOGIN_LOCKOUT_PREFIX}expert:${account.id}`), false);
  assert.equal((await recordFailedPasswordLogin('expert', account)).lockedUntil, null);
});

test('prefers Express req.ip and ignores spoofed x-forwarded-for values', () => {
  const req = {
    headers: { 'x-forwarded-for': '203.0.113.77, 10.0.0.5' },
    ip: '198.51.100.14',
    socket: { remoteAddress: '10.0.0.5' },
  };
  assert.equal(getClientIpAddress(req), '198.51.100.14');

  const fallbackReq = {
    headers: { 'x-forwarded-for': '203.0.113.77' },
    socket: { remoteAddress: '10.0.0.5' },
  };
  assert.equal(getClientIpAddress(fallbackReq), '10.0.0.5');
});

test('rates down repeated failures per IP address', async (t) => {
  rows.clear();
  deliveries.length = 0;
  deliveryAttempts = 0;
  let now = 3_000_000;
  t.mock.method(Date, 'now', () => now);
  const account = { id: 'ip-locked', email: 'ip@example.com' };
  const ipAddress = '203.0.113.45';

  for (let attempt = 1; attempt < LOGIN_IP_LOCKOUT_THRESHOLD; attempt++) {
    const result = await recordFailedPasswordLogin('expert', account, ipAddress);
    assert.equal(result.ipLockedUntil, null);
  }

  const locked = await recordFailedPasswordLogin('expert', account, ipAddress);
  assert.equal(locked.ipLockedUntil, now + LOGIN_IP_LOCKOUT_MINUTES * 60 * 1000);
  assert.equal((await getPasswordLoginIpLockout(ipAddress)).lockedUntil, locked.ipLockedUntil);
  assert.equal(rows.has(`_PASSWORD_LOGIN_IP_LOCKOUT:203.0.113.45`), true);
});

test('recordFailedPasswordLogin still rates down unknown accounts by IP without creating an account lock', async (t) => {
  rows.clear();
  deliveries.length = 0;
  deliveryAttempts = 0;
  let now = 5_000_000;
  t.mock.method(Date, 'now', () => now);
  const ipAddress = '198.51.100.88';

  for (let attempt = 1; attempt < LOGIN_IP_LOCKOUT_THRESHOLD; attempt++) {
    const result = await recordFailedPasswordLogin('expert', null, ipAddress);
    assert.equal(result.lockedUntil, null);
    assert.equal(result.ipLockedUntil, null);
    assert.equal(await getPasswordLoginIpLockout(ipAddress), null);
  }

  const locked = await recordFailedPasswordLogin('expert', null, ipAddress);
  assert.equal(locked.lockedUntil, null);
  assert.equal(locked.ipLockedUntil, now + LOGIN_IP_LOCKOUT_MINUTES * 60 * 1000);
  assert.equal((await getPasswordLoginIpLockout(ipAddress)).lockedUntil, locked.ipLockedUntil);
  assert.equal(rows.has(`${LOGIN_LOCKOUT_PREFIX}expert:null`), false);
  assert.equal(deliveries.length, 0);
  assert.equal(deliveryAttempts, 0);
});

test('unknown IPs do not share a single global IP lockout bucket', async (t) => {
  rows.clear();
  deliveries.length = 0;
  deliveryAttempts = 0;
  let now = 4_000_000;
  t.mock.method(Date, 'now', () => now);
  const account = { id: 'unknown-ip-account', email: 'unknown@example.com' };

  assert.equal(await getPasswordLoginIpLockout('unknown'), null);
  const result = await recordFailedPasswordLogin('expert', account, 'unknown');
  assert.equal(result.ipLockedUntil, null);
  assert.equal(await getPasswordLoginIpLockout('unknown'), null);
  assert.equal(rows.has('_PASSWORD_LOGIN_IP_LOCKOUT:unknown'), false);
});

test('clears consecutive failures after a successful password', async () => {
  rows.clear();
  deliveries.length = 0;
  deliveryAttempts = 0;
  const account = { id: 'seeker-1', email: 'seeker@example.com' };
  await recordFailedPasswordLogin('seeker', account);
  assert.deepEqual(await clearPasswordLoginFailures('seeker', account.id), { lockedUntil: null });
  assert.equal(rows.has(`${LOGIN_LOCKOUT_PREFIX}seeker:${account.id}`), false);
});

test('does not clear an active lock or fail open when email delivery fails', async (t) => {
  rows.clear();
  deliveries.length = 0;
  deliveryAttempts = 0;
  deliveryFails = true;
  t.after(() => { deliveryFails = false; });
  let now = 2_000_000;
  t.mock.method(Date, 'now', () => now);
  const account = { id: 'admin-1', email: 'admin@example.com' };

  for (let attempt = 0; attempt < LOGIN_LOCKOUT_THRESHOLD; attempt++) {
    await recordFailedPasswordLogin('admin', account);
  }
  const lock = await getPasswordLoginLockout('admin', account.id);
  assert.ok(lock);
  assert.equal(deliveryAttempts, 1);
  for (let attempt = 0; attempt < 3; attempt++) {
    assert.equal((await recordFailedPasswordLogin('admin', account)).lockedUntil, lock.lockedUntil);
  }
  assert.equal(deliveryAttempts, 1, 'blocked attempts must not retry lockout email delivery');
  assert.deepEqual(await clearPasswordLoginFailures('admin', account.id), lock);
  assert.deepEqual(await getPasswordLoginLockout('admin', account.id), lock);

  now = lock.lockedUntil;
  assert.equal(await getPasswordLoginLockout('admin', account.id), null);
});