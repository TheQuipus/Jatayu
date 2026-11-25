import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const rows = new Map();
let txQueue = Promise.resolve();

const Setting = {
  sequelize: {
    transaction: (callback) => {
      const next = txQueue.then(() => callback({ LOCK: { UPDATE: 'UPDATE' } }));
      txQueue = next.catch(() => {});
      return next;
    },
  },
  findOrCreate: async ({ where: { key }, defaults }) => {
    if (!rows.has(key)) {
      rows.set(key, {
        key,
        value: defaults.value,
        save: async function () {
          rows.set(this.key, this);
        },
        destroy: async function () {
          rows.delete(this.key);
        },
      });
    }
  },
  findByPk: async (key) => rows.get(key) || null,
  destroy: async ({ where: { key } }) => {
    const keys = Array.isArray(key) ? key : [key];
    for (const k of keys) {
      rows.delete(k);
    }
  },
};

mock.module('../models/index.js', { namedExports: { Setting } });

const {
  MAX_RESEND_ATTEMPTS,
  OTP_RESEND_LIMIT_PREFIX,
  RESEND_BLOCK_DURATION_MS,
  RESEND_WINDOW_MS,
  buildResendLimitKeys,
  clearOtpResendLimits,
  getActiveOtpResendBlock,
  getOtpResendStatus,
  releaseResendAttempt,
  reserveResendAttempt,
} = await import('./otpResendLimit.js');

test('1st/2nd/3rd resends increment to 1, 2, 3 and set blockedUntil only on 3rd; 4th is blocked', async () => {
  rows.clear();
  const baseNow = 10_000_000;
  const email = 'User@Example.COM';
  const phone = '+91 98765-43210';

  const initial = await getOtpResendStatus({ email, phone, now: baseNow });
  assert.deepEqual(initial, { resendAttempts: 0, maxResendAttempts: 3, blockedUntil: null });
  assert.equal(rows.size, 0, 'getOtpResendStatus must not create rows');

  const first = await reserveResendAttempt({ email, phone, now: baseNow });
  assert.equal(first.blocked, false);
  assert.equal(first.resendAttempts, 1);
  assert.equal(first.maxResendAttempts, MAX_RESEND_ATTEMPTS);
  assert.equal(first.blockedUntil, null);

  const second = await reserveResendAttempt({ email, phone, now: baseNow + 30_000 });
  assert.equal(second.blocked, false);
  assert.equal(second.resendAttempts, 2);
  assert.equal(second.blockedUntil, null);

  const thirdNow = baseNow + 60_000;
  const third = await reserveResendAttempt({ email, phone, now: thirdNow });
  assert.equal(third.blocked, false);
  assert.equal(third.resendAttempts, 3);
  assert.equal(third.blockedUntil, new Date(thirdNow + RESEND_BLOCK_DURATION_MS).toISOString());

  const fourth = await reserveResendAttempt({ email, phone, now: thirdNow + 5_000 });
  assert.equal(fourth.blocked, true);
  assert.equal(fourth.resendAttempts, 3);
  assert.equal(fourth.maxResendAttempts, 3);
  assert.equal(fourth.blockedUntil, third.blockedUntil);
  assert.ok(fourth.retryAfterSeconds > 0);
});

test('block expires after 30 minutes and resets counter to 0', async () => {
  rows.clear();
  const baseNow = 20_000_000;
  const target = { email: 'expire@example.com', phone: '9111111111' };

  await reserveResendAttempt({ ...target, now: baseNow });
  await reserveResendAttempt({ ...target, now: baseNow + 1000 });
  const third = await reserveResendAttempt({ ...target, now: baseNow + 2000 });
  assert.equal(third.resendAttempts, 3);

  const afterBlock = baseNow + 2000 + RESEND_BLOCK_DURATION_MS;
  const status = await getOtpResendStatus({ ...target, now: afterBlock });
  assert.deepEqual(status, { resendAttempts: 0, maxResendAttempts: 3, blockedUntil: null });

  const next = await reserveResendAttempt({ ...target, now: afterBlock });
  assert.equal(next.blocked, false);
  assert.equal(next.resendAttempts, 1);
  assert.equal(next.blockedUntil, null);
});

test('partial count (1 or 2) expires 30 minutes after firstAttemptAt', async () => {
  rows.clear();
  const baseNow = 30_000_000;
  const target = { email: 'partial@example.com', phone: '9222222222' };

  await reserveResendAttempt({ ...target, now: baseNow });
  const second = await reserveResendAttempt({ ...target, now: baseNow + 10 * 60 * 1000 });
  assert.equal(second.resendAttempts, 2);

  const expiredNow = baseNow + RESEND_WINDOW_MS;
  const status = await getOtpResendStatus({ ...target, now: expiredNow });
  assert.deepEqual(status, { resendAttempts: 0, maxResendAttempts: 3, blockedUntil: null });

  const fresh = await reserveResendAttempt({ ...target, now: expiredNow });
  assert.equal(fresh.blocked, false);
  assert.equal(fresh.resendAttempts, 1);
});

test('clearOtpResendLimits resets both email and phone keys', async () => {
  rows.clear();
  const baseNow = 40_000_000;
  const target = { email: 'clear@example.com', phone: '9333333333' };

  await reserveResendAttempt({ ...target, now: baseNow });
  await reserveResendAttempt({ ...target, now: baseNow + 1000 });
  assert.equal((await getOtpResendStatus({ ...target, now: baseNow + 2000 })).resendAttempts, 2);

  await clearOtpResendLimits(target);
  assert.equal(rows.size, 0);
  assert.deepEqual(await getOtpResendStatus({ ...target, now: baseNow + 2000 }), {
    resendAttempts: 0,
    maxResendAttempts: 3,
    blockedUntil: null,
  });
});

test('blocks by email only and by phone only without incrementing either key while blocked', async () => {
  rows.clear();
  const baseNow = 50_000_000;
  const emailA = 'blocked-email@example.com';
  const phoneA = '9444444444';
  const phoneB = '9555555555';
  const emailB = 'other-email@example.com';

  await reserveResendAttempt({ email: emailA, phone: phoneA, now: baseNow });
  await reserveResendAttempt({ email: emailA, phone: phoneA, now: baseNow + 1000 });
  await reserveResendAttempt({ email: emailA, phone: phoneA, now: baseNow + 2000 });

  // Different phone with blocked email -> blocked, and phoneB must NOT be incremented.
  const byEmail = await reserveResendAttempt({ email: emailA, phone: phoneB, now: baseNow + 3000 });
  assert.equal(byEmail.blocked, true);
  assert.equal((await getOtpResendStatus({ email: emailB, phone: phoneB, now: baseNow + 3000 })).resendAttempts, 0);

  // Different email with blocked phone -> blocked, and emailB must NOT be incremented.
  const byPhone = await reserveResendAttempt({ email: emailB, phone: phoneA, now: baseNow + 4000 });
  assert.equal(byPhone.blocked, true);
  assert.equal((await getOtpResendStatus({ email: emailB, phone: phoneB, now: baseNow + 4000 })).resendAttempts, 0);
});

test('two concurrent reserve calls at count 2 never exceed 3', async () => {
  rows.clear();
  const baseNow = 60_000_000;
  const target = { email: 'race@example.com', phone: '9666666666' };

  await reserveResendAttempt({ ...target, now: baseNow });
  await reserveResendAttempt({ ...target, now: baseNow + 1000 });

  const [resA, resB] = await Promise.all([
    reserveResendAttempt({ ...target, now: baseNow + 2000 }),
    reserveResendAttempt({ ...target, now: baseNow + 2000 }),
  ]);

  const allowed = [resA, resB].filter((r) => !r.blocked);
  const blocked = [resA, resB].filter((r) => r.blocked);
  assert.equal(allowed.length, 1);
  assert.equal(blocked.length, 1);
  assert.equal(allowed[0].resendAttempts, 3);
  assert.equal(blocked[0].resendAttempts, 3);
});

test('releaseResendAttempt restores count and clears blockedUntil when releasing the 3rd attempt', async () => {
  rows.clear();
  const baseNow = 70_000_000;
  const target = { email: 'release@example.com', phone: '9777777777' };

  const first = await reserveResendAttempt({ ...target, now: baseNow });
  await releaseResendAttempt(first.reservation, { now: baseNow });
  assert.equal(rows.size, 0);
  assert.equal((await getOtpResendStatus({ ...target, now: baseNow })).resendAttempts, 0);

  await reserveResendAttempt({ ...target, now: baseNow + 1000 });
  await reserveResendAttempt({ ...target, now: baseNow + 2000 });
  const third = await reserveResendAttempt({ ...target, now: baseNow + 3000 });
  assert.equal(third.resendAttempts, 3);
  assert.ok(third.blockedUntil);

  await releaseResendAttempt(third.reservation, { now: baseNow + 3500 });
  const afterRelease = await getOtpResendStatus({ ...target, now: baseNow + 3500 });
  assert.equal(afterRelease.resendAttempts, 2);
  assert.equal(afterRelease.blockedUntil, null);
});

test('keys are hashed and contain no raw email or phone', () => {
  const email = 'sensitive.user@example.com';
  const phone = '9876543210';
  const keys = buildResendLimitKeys({ email, phone });
  assert.equal(keys.length, 2);
  for (const key of keys) {
    assert.ok(key.startsWith(OTP_RESEND_LIMIT_PREFIX));
    assert.equal(key.includes('sensitive.user'), false);
    assert.equal(key.includes('example.com'), false);
    assert.equal(key.includes(phone), false);
  }
});

test('getActiveOtpResendBlock is read-only and returns the longer remaining block across email and phone', async () => {
  rows.clear();
  const baseNow = 80_000_000;
  const email = 'dual-block@example.com';
  const phone = '9888811111';

  assert.equal(await getActiveOtpResendBlock({ email, phone, now: baseNow }), null);
  assert.equal(rows.size, 0);

  const [keyA, keyB] = buildResendLimitKeys({ email, phone });
  rows.set(keyA, { key: keyA, value: JSON.stringify({ count: 3, firstAttemptAt: baseNow, blockedUntil: baseNow + 120_000 }) });
  rows.set(keyB, { key: keyB, value: JSON.stringify({ count: 3, firstAttemptAt: baseNow, blockedUntil: baseNow + 300_000 }) });

  const block = await getActiveOtpResendBlock({ email, phone, now: baseNow });
  assert.equal(block.code, 'OTP_RESEND_LIMIT_REACHED');
  assert.equal(block.retryAfterSeconds, 300);
  assert.equal(block.blockedUntil, new Date(baseNow + 300_000).toISOString());
});
