import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Seeker } from '../../models/index.js';

const deliveries = [];
let deliveryFails = false;
let currentClientIp = '127.0.0.1';
const failures = new Map();
const lockKey = (type, id, sourceIp = '127.0.0.1') => `${type}:${id}:${sourceIp}`;
const seekerLoginLockoutState = {
  getPasswordLoginIpLockout: async () => null,
  getPasswordLoginLockout: async (type, id, sourceIp = '127.0.0.1') => {
    const state = failures.get(lockKey(type, id, sourceIp));
    return state?.lockedUntil > Date.now() ? { lockedUntil: state.lockedUntil } : null;
  },
  recordFailedPasswordLogin: async (type, account, sourceIp = '127.0.0.1') => {
    if (!account) {
      return { lockedUntil: null, ipLockedUntil: null };
    }
    const key = lockKey(type, account.id, sourceIp);
    const state = failures.get(key) || { attempts: 0 };
    if (state.lockedUntil > Date.now()) return { lockedUntil: state.lockedUntil, ipLockedUntil: null };
    state.attempts += 1;
    state.lockedUntil = state.attempts >= 5 ? Date.now() + 10 * 60 * 1000 : null;
    failures.set(key, state);
    return { lockedUntil: state.lockedUntil, ipLockedUntil: null };
  },
  clearPasswordLoginFailures: async (type, id, sourceIp = '127.0.0.1') => {
    const key = lockKey(type, id, sourceIp);
    const state = failures.get(key);
    if (state?.lockedUntil > Date.now()) return { lockedUntil: state.lockedUntil };
    failures.delete(key);
    return { lockedUntil: null };
  },
  clearPasswordLoginIpFailures: async () => ({ lockedUntil: null }),
};
const originalSeekerLoginLockoutState = { ...seekerLoginLockoutState };
mock.module('../../utils/otpDelivery.js', {
  namedExports: {
    deliverOtpChannels: async (payload) => {
      if (deliveryFails) throw Object.assign(new Error('Delivery unavailable'), { name: 'OtpDeliveryError' });
      deliveries.push(payload);
    },
    handleOtpDeliveryError: (error, res) => error.name === 'OtpDeliveryError'
      ? res.status(503).json({ code: 'OTP_DELIVERY_FAILED' }) : null,
  },
});
mock.module('../../utils/accountLoginLockout.js', {
  namedExports: {
    buildPasswordLoginLockedResponse: (lockedUntil) => ({ code: 'ACCOUNT_LOCKED', lockedUntil }),
    buildPasswordLoginRateLimitResponse: (lockedUntil) => ({ code: 'IP_RATE_LIMITED', lockedUntil }),
    getClientIpAddress: () => currentClientIp,
    getPasswordLoginIpLockout: async (...args) => seekerLoginLockoutState.getPasswordLoginIpLockout(...args),
    getPasswordLoginLockout: async (...args) => seekerLoginLockoutState.getPasswordLoginLockout(...args),
    recordFailedPasswordLogin: async (...args) => seekerLoginLockoutState.recordFailedPasswordLogin(...args),
    clearPasswordLoginFailures: async (...args) => seekerLoginLockoutState.clearPasswordLoginFailures(...args),
    clearPasswordLoginIpFailures: async (...args) => seekerLoginLockoutState.clearPasswordLoginIpFailures(...args),
  },
});

const resendLimitMap = new Map();
const resendLimitState = {
  getOtpResendStatus: async ({ email, phone } = {}) => {
    const key = `${String(email || '').toLowerCase()}|${String(phone || '').slice(-10)}`;
    const entry = resendLimitMap.get(key);
    if (!entry || (entry.blockedUntil && entry.blockedUntil <= Date.now())) {
      return { resendAttempts: 0, maxResendAttempts: 3, blockedUntil: null };
    }
    return {
      resendAttempts: entry.count,
      maxResendAttempts: 3,
      blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil).toISOString() : null,
    };
  },
  reserveResendAttempt: async ({ email, phone } = {}) => {
    const key = `${String(email || '').toLowerCase()}|${String(phone || '').slice(-10)}`;
    const entry = resendLimitMap.get(key) || { count: 0, blockedUntil: null };
    if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
      return {
        blocked: true,
        resendAttempts: 3,
        maxResendAttempts: 3,
        blockedUntil: new Date(entry.blockedUntil).toISOString(),
        retryAfterSeconds: Math.max(1, Math.ceil((entry.blockedUntil - Date.now()) / 1000)),
      };
    }
    const nextCount = Math.min(3, entry.count + 1);
    const blockedUntil = nextCount >= 3 ? Date.now() + 30 * 60 * 1000 : null;
    resendLimitMap.set(key, { count: nextCount, blockedUntil });
    return {
      blocked: false,
      resendAttempts: nextCount,
      maxResendAttempts: 3,
      blockedUntil: blockedUntil ? new Date(blockedUntil).toISOString() : null,
      reservation: { key },
    };
  },
  releaseResendAttempt: async (reservation) => {
    if (!reservation?.key) return;
    const entry = resendLimitMap.get(reservation.key);
    if (!entry) return;
    const nextCount = Math.max(0, entry.count - 1);
    if (nextCount === 0) resendLimitMap.delete(reservation.key);
    else resendLimitMap.set(reservation.key, { count: nextCount, blockedUntil: null });
  },
  clearOtpResendLimits: async ({ email, phone } = {}) => {
    const key = `${String(email || '').toLowerCase()}|${String(phone || '').slice(-10)}`;
    resendLimitMap.delete(key);
  },
  buildResendBlockedPayload: ({ blockedUntil, retryAfterSeconds }) => ({
    message: 'Resend OTP limit reached. Please try again in 30 mins.',
    code: 'OTP_RESEND_LIMIT_REACHED',
    resendAttempts: 3,
    maxResendAttempts: 3,
    blockedUntil,
    retryAfterSeconds,
  }),
  getActiveOtpResendBlock: async ({ email, phone, now = Date.now() } = {}) => {
    const status = await resendLimitState.getOtpResendStatus({ email, phone });
    if (!status.blockedUntil) return null;
    const blockedMs = Date.parse(status.blockedUntil);
    if (!Number.isFinite(blockedMs) || blockedMs <= now) return null;
    return resendLimitState.buildResendBlockedPayload({
      blockedUntil: status.blockedUntil,
      retryAfterSeconds: Math.max(1, Math.ceil((blockedMs - now) / 1000)),
    });
  },
};
mock.module('../../utils/otpResendLimit.js', { namedExports: resendLimitState });

const { login, register, resendOtp, resendStatus, verifyOtp } = await import('./seekerAuthController.js');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

for (const onboardingStep of ['otp', 'budget', 'completed']) {
  test(`password login requires a fresh OTP at ${onboardingStep}`, async (t) => {
    const seeker = {
      id: `seeker-${onboardingStep}`, email: 'test@example.com', phone: '+919999999999',
      password: await bcrypt.hash('TestPassword1!', 4), onboardingStep,
      isEmailVerified: onboardingStep !== 'otp', isPhoneVerified: onboardingStep !== 'otp',
      save: async () => {},
    };
    t.mock.method(Seeker, 'findOne', async () => seeker);
    t.mock.method(Seeker, 'findByPk', async () => seeker);
    const before = deliveries.length;
    const res = response();
    await login({ body: { email: seeker.email, password: 'TestPassword1!' } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.requiresOtp, true);
    assert.equal(res.body.token, undefined);
    assert.equal(deliveries.length, before + 1);
    assert.match(seeker.onboardingMetadata.pendingOtp.code, /^\d{6}$/);

    const wrong = response();
    await verifyOtp({ body: { seekerId: seeker.id, code: 'wrong' } }, wrong);
    assert.equal(wrong.statusCode, 400);
    assert.equal(wrong.body.token, undefined);

    const code = seeker.onboardingMetadata.pendingOtp.code;
    const verified = response();
    await verifyOtp({ body: { seekerId: seeker.id, code } }, verified);
    assert.equal(verified.statusCode, 200);
    assert.ok(verified.body.token);
    assert.equal(seeker.onboardingStep, onboardingStep === 'otp' ? 'category' : onboardingStep);

    const replay = response();
    await verifyOtp({ body: { seekerId: seeker.id, code } }, replay);
    assert.equal(replay.statusCode, 400);

    const nextLogin = response();
    await login({ body: { email: seeker.email, password: 'TestPassword1!' } }, nextLogin);
    assert.equal(nextLogin.statusCode, 403);
    assert.equal(nextLogin.body.token, undefined);
  });
}

test('rapid repeated seeker logins reuse the existing OTP challenge within the cooldown window', async (t) => {
  const seeker = {
    id: 'cooldown-seeker',
    email: 'cooldown@example.com',
    phone: '+919999999999',
    password: await bcrypt.hash('TestPassword1!', 4),
    onboardingStep: 'completed',
    save: async () => {},
  };
  t.mock.method(Seeker, 'findOne', async () => seeker);

  const first = response();
  await login({ body: { email: seeker.email, password: 'TestPassword1!' } }, first);
  assert.equal(first.statusCode, 403);
  const firstCode = seeker.onboardingMetadata.pendingOtp.code;
  const deliveryCountAfterFirst = deliveries.length;

  const second = response();
  await login({ body: { email: seeker.email, password: 'TestPassword1!' } }, second);
  assert.equal(second.statusCode, 403);
  assert.equal(second.body.requiresOtp, true);
  assert.equal(second.body.token, undefined);
  assert.equal(deliveries.length, deliveryCountAfterFirst);
  assert.equal(seeker.onboardingMetadata.pendingOtp.code, firstCode);
});

test('seeker resendOtp enforces the cooldown and stops duplicate OTP delivery', async (t) => {
  const seeker = {
    id: 'resend-cooldown-seeker',
    email: 'resend-cooldown@example.com',
    phone: '+919876543210',
    onboardingStep: 'otp',
    save: async () => {},
  };
  t.mock.method(Seeker, 'findByPk', async (id) => (id === seeker.id ? seeker : null));

  const before = deliveries.length;

  const firstResend = response();
  await resendOtp({ body: { seekerId: seeker.id } }, firstResend);
  assert.equal(firstResend.statusCode, 200);
  assert.equal(firstResend.body.message, 'Verification code resent to your email and phone.');
  assert.equal(deliveries.length, before + 1);
  assert.equal(deliveries.at(-1).email, seeker.email);
  assert.equal(deliveries.at(-1).phone, seeker.phone);

  const secondResend = response();
  await resendOtp({ body: { seekerId: seeker.id } }, secondResend);
  assert.equal(secondResend.statusCode, 429);
  assert.match(secondResend.body.message, /Please wait before requesting another OTP/i);
  assert.equal(deliveries.length, before + 1);
});

test('delivery failure and incorrect passwords never issue a token', async (t) => {
  const seeker = {
    id: 'delivery-failure', email: 'test@example.com', onboardingStep: 'completed',
    password: await bcrypt.hash('TestPassword1!', 4), save: async () => {},
  };
  t.mock.method(Seeker, 'findOne', async () => seeker);
  const before = deliveries.length;
  const invalid = response();
  await login({ body: { email: seeker.email, password: 'incorrect' } }, invalid);
  assert.equal(invalid.statusCode, 401);
  assert.equal(invalid.body.token, undefined);
  assert.equal(deliveries.length, before);
  deliveryFails = true;
  t.after(() => { deliveryFails = false; });
  const unavailable = response();
  await login({ body: { email: seeker.email, password: 'TestPassword1!' } }, unavailable);
  assert.equal(unavailable.statusCode, 503);
  assert.equal(unavailable.body.token, undefined);
});

test('seeker password login locks after five incorrect passwords', async (t) => {
  const seeker = {
    id: 'lockout-seeker', email: 'locked@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4), save: async () => {},
  };
  t.mock.method(Seeker, 'findOne', async () => seeker);

  for (let attempt = 1; attempt < 5; attempt++) {
    const invalid = response();
    await login({ body: { email: seeker.email, password: 'wrong' } }, invalid);
    assert.equal(invalid.statusCode, 401);
  }
  const locked = response();
  await login({ body: { email: seeker.email, password: 'wrong' } }, locked);
  assert.equal(locked.statusCode, 429);
  assert.equal(locked.body.code, 'ACCOUNT_LOCKED');

  const correct = response();
  await login({ body: { email: seeker.email, password: 'CorrectPassword1!' } }, correct);
  assert.equal(correct.statusCode, 429);
  assert.equal(correct.body.code, 'ACCOUNT_LOCKED');
});

test('seeker login normalizes email and keeps invalid-account responses generic', async (t) => {
  const seeker = {
    id: 'normalized-login-seeker',
    email: 'normalized@example.com',
    password: null,
  };
  const lookups = [];
  t.mock.method(Seeker, 'findOne', async ({ where }) => {
    lookups.push(where.email);
    return where.email === seeker.email ? seeker : null;
  });

  const unknown = response();
  await login({ body: { email: ' unknown@example.com ', password: 'wrong' } }, unknown);
  seeker.password = await bcrypt.hash('CorrectPassword1!', 4);
  const wrongPassword = response();
  await login({
    body: { email: ' NORMALIZED@EXAMPLE.COM ', password: 'wrong' },
  }, wrongPassword);
  seeker.password = null;
  const socialOnly = response();
  await login({ body: { email: 'NORMALIZED@example.com', password: 'wrong' } }, socialOnly);

  assert.deepEqual(lookups, [
    'unknown@example.com',
    'normalized@example.com',
    'normalized@example.com',
  ]);
  assert.deepEqual(
    [unknown.statusCode, unknown.body],
    [wrongPassword.statusCode, wrongPassword.body],
  );
  assert.deepEqual(
    [unknown.statusCode, unknown.body],
    [socialOnly.statusCode, socialOnly.body],
  );
  assert.equal(unknown.statusCode, 401);
  assert.equal(unknown.body.message, 'Invalid email or password');
});

test('seeker login blocks active IP lockouts and clears IP state on success', async (t) => {
  t.after(() => {
    Object.assign(seekerLoginLockoutState, originalSeekerLoginLockoutState);
  });

  const seeker = {
    id: 'ip-lockout-seeker',
    email: 'ip-lockout@example.com',
    phone: '+919876543210',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    onboardingStep: 'completed',
    save: async () => {},
  };
  const lookupCalls = { count: 0 };
  const clearCalls = [];

  seekerLoginLockoutState.getPasswordLoginIpLockout = async () => ({ lockedUntil: Date.now() + 60_000 });
  t.mock.method(Seeker, 'findOne', async ({ where }) => {
    lookupCalls.count += 1;
    return where.email === seeker.email ? seeker : null;
  });

  const lockedIp = response();
  await login({ body: { email: seeker.email, password: 'CorrectPassword1!' } }, lockedIp);
  assert.equal(lockedIp.statusCode, 429);
  assert.equal(lockedIp.body.code, 'IP_RATE_LIMITED');
  assert.equal(lookupCalls.count, 0);

  seekerLoginLockoutState.getPasswordLoginIpLockout = async () => null;
  const unknownAccountCalls = [];
  seekerLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => {
    unknownAccountCalls.push({ type, account, sourceIp });
    return { lockedUntil: null, ipLockedUntil: null };
  };
  const unknown = response();
  await login({ body: { email: 'missing-seeker@example.com', password: 'wrong' } }, unknown);
  assert.equal(unknown.statusCode, 401);
  assert.equal(unknown.body.message, 'Invalid email or password');
  assert.equal(unknownAccountCalls.at(-1).account, null);
  assert.equal(unknownAccountCalls.at(-1).sourceIp, '127.0.0.1');

  seekerLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => ({
    lockedUntil: null,
    ipLockedUntil: Date.now() + 60_000,
  });
  const rateLimited = response();
  await login({ body: { email: 'missing-seeker@example.com', password: 'wrong' } }, rateLimited);
  assert.equal(rateLimited.statusCode, 429);
  assert.equal(rateLimited.body.code, 'IP_RATE_LIMITED');

  seekerLoginLockoutState.getPasswordLoginIpLockout = async () => null;
  seekerLoginLockoutState.recordFailedPasswordLogin = async () => ({ lockedUntil: null, ipLockedUntil: null });
  seekerLoginLockoutState.clearPasswordLoginIpFailures = async (ip) => {
    clearCalls.push(ip);
    return { lockedUntil: null };
  };
  const success = response();
  await login({ body: { email: seeker.email, password: 'CorrectPassword1!' } }, success);
  assert.equal(success.statusCode, 403);
  assert.equal(success.body.requiresOtp, true);
  assert.deepEqual(clearCalls, ['127.0.0.1']);
});

test('seeker login uses the requesting IP when checking account lockout state across IPs', async (t) => {
  const seeker = {
    id: 'cross-ip-seeker',
    email: 'cross-ip-seeker@example.com',
    phone: '+919876543210',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    onboardingStep: 'completed',
    save: async () => {},
  };
  const attackerIp = '203.0.113.10';
  const legitimateIp = '198.51.100.20';
  const attackerLockUntil = Date.now() + 60_000;
  const lookupCalls = [];
  const originalLookup = seekerLoginLockoutState.getPasswordLoginLockout.bind(seekerLoginLockoutState);
  const originalClear = seekerLoginLockoutState.clearPasswordLoginFailures.bind(seekerLoginLockoutState);
  const originalClearIp = seekerLoginLockoutState.clearPasswordLoginIpFailures.bind(seekerLoginLockoutState);

  failures.set(lockKey('seeker', seeker.id, attackerIp), { attempts: 5, lockedUntil: attackerLockUntil });
  currentClientIp = legitimateIp;

  seekerLoginLockoutState.getPasswordLoginLockout = async (...args) => {
    lookupCalls.push(args);
    return originalLookup(...args);
  };
  seekerLoginLockoutState.clearPasswordLoginFailures = async (...args) => {
    lookupCalls.push(['clear', ...args]);
    return originalClear(...args);
  };
  seekerLoginLockoutState.clearPasswordLoginIpFailures = async (...args) => {
    lookupCalls.push(['clear-ip', ...args]);
    return originalClearIp(...args);
  };

  t.after(() => {
    currentClientIp = '127.0.0.1';
    failures.clear();
    seekerLoginLockoutState.getPasswordLoginLockout = originalLookup;
    seekerLoginLockoutState.clearPasswordLoginFailures = originalClear;
    seekerLoginLockoutState.clearPasswordLoginIpFailures = originalClearIp;
    Object.assign(seekerLoginLockoutState, originalSeekerLoginLockoutState);
  });

  t.mock.method(Seeker, 'findOne', async ({ where }) => where.email === seeker.email ? seeker : null);

  const res = response();
  await login({ body: { email: seeker.email, password: 'CorrectPassword1!' } }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.requiresOtp, true);
  assert.equal(lookupCalls.some(([type, id, sourceIp]) => type === 'seeker' && id === seeker.id && sourceIp === legitimateIp), true);
  assert.equal(lookupCalls.some(([type, id, sourceIp]) => type === 'seeker' && id === seeker.id && sourceIp === attackerIp), false);
  assert.equal(failures.get(lockKey('seeker', seeker.id, attackerIp))?.lockedUntil, attackerLockUntil);
  assert.equal(failures.has(lockKey('seeker', seeker.id, legitimateIp)), false);
});

test('registration rejects numeric-only names before account lookup or OTP delivery', async (t) => {
  let accountLookups = 0;
  t.mock.method(Seeker, 'findOne', async () => {
    accountLookups += 1;
    return null;
  });
  const before = deliveries.length;

  for (const fullName of ['12345', "'- ,", 'Priya!']) {
    const res = response();
    await register({ body: { fullName, email: 'new@example.com', password: 'TestPassword1!', phone: '9898675444' } }, res);
    assert.equal(res.statusCode, 400, fullName);
  }

  assert.equal(accountLookups, 0);
  assert.equal(deliveries.length, before);
});

test('registration rejects malformed email and phone before account lookup or OTP delivery', async (t) => {
  let accountLookups = 0;
  t.mock.method(Seeker, 'findOne', async () => {
    accountLookups += 1;
    return null;
  });
  const before = deliveries.length;
  const invalidRegistrations = [
    { email: 'not-an-email', phone: '9898675444' },
    { email: 'valid@example.com', phone: '123456789' },
    { email: 'valid@example.com', phone: '12345678901' },
    { email: 'valid@example.com', phone: '12345a7890' },
  ];

  for (const { email, phone } of invalidRegistrations) {
    const res = response();
    await register({ body: { fullName: 'Priya Sharma', email, password: 'TestPassword1!', phone } }, res);
    assert.equal(res.statusCode, 400);
  }

  assert.equal(accountLookups, 0);
  assert.equal(deliveries.length, before);
});

test('duplicate email registrations never generate or send an OTP, even with the existing password', async (t) => {
  const existingEmail = {
    id: 'existing-registration-email',
    email: 'existing@example.com',
    phone: '9876543210',
    fullName: 'Existing Seeker',
    password: await bcrypt.hash('ExistingPassword1!', 4),
    onboardingMetadata: { existing: true },
  };
  t.mock.method(Seeker, 'findOne', async ({ where }) =>
    where.email === existingEmail.email ? existingEmail : null);
  let creates = 0;
  t.mock.method(Seeker, 'create', async () => {
    creates += 1;
    return null;
  });
  const before = deliveries.length;

  for (const password of ['ExistingPassword1!', 'DifferentPassword1!']) {
    const res = response();
    await register({
      body: {
        fullName: 'New Seeker',
        email: ' EXISTING@example.com ',
        password,
        phone: '9123456789',
      },
    }, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'EMAIL_EXISTS');
    assert.match(res.body.message, /already exists/i);
  }

  assert.deepEqual(existingEmail.onboardingMetadata, { existing: true });
  assert.equal(creates, 0);
  assert.equal(deliveries.length, before);
});

test('duplicate phone registration does not create an account or send an OTP', async (t) => {
  const lookups = [];
  const existingPhone = {
    id: 'existing-registration-phone',
    email: 'other@example.com',
    phone: '9123456789',
  };
  t.mock.method(Seeker, 'findOne', async ({ where }) => {
    lookups.push(where);
    return where.email ? null : existingPhone;
  });
  let creates = 0;
  t.mock.method(Seeker, 'create', async () => {
    creates += 1;
    return null;
  });
  const before = deliveries.length;

  const res = response();
  await register({
    body: {
      fullName: 'New Seeker',
      email: 'new@example.com',
      password: 'NewPassword1!',
      phone: existingPhone.phone,
    },
  }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'PHONE_EXISTS');
  assert.match(res.body.message, /already exists/i);
  assert.deepEqual(lookups, [
    { email: 'new@example.com' },
    { phone: existingPhone.phone },
  ]);
  assert.equal(creates, 0);
  assert.equal(deliveries.length, before);
});

test('new seeker registration creates DB account immediately in draft state and completes on OTP verification', async (t) => {
  t.mock.method(Seeker, 'findOne', async () => null);
  let createdValues;
  const seeker = {
    id: 'new-registration-seeker',
    get fullName() { return createdValues?.fullName; },
    get email() { return createdValues?.email; },
    get phone() { return createdValues?.phone; },
    onboardingStep: 'otp',
    status: 'draft',
    isEmailVerified: false,
    isPhoneVerified: false,
    onboardingMetadata: null,
    save: async () => {},
  };
  t.mock.method(Seeker, 'create', async (values) => {
    createdValues = values;
    return seeker;
  });
  t.mock.method(Seeker, 'findByPk', async () => seeker);
  const before = deliveries.length;

  const res = response();
  await register({
    body: {
      fullName: 'New Seeker',
      email: ' NEW@example.com ',
      password: 'NewPassword1!',
      phone: '9123456789',
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdValues.email, 'new@example.com');
  assert.equal(createdValues.phone, '9123456789');
  assert.equal(createdValues.onboardingStep, 'otp');
  assert.equal(createdValues.status, 'draft');
  assert.equal(deliveries.length, before + 1);
  assert.equal(deliveries.at(-1).email, 'new@example.com');
  const deliveredCode = deliveries.at(-1).otpCode;
  assert.match(deliveredCode, /^\d{6}$/);

  // Now verify OTP -> onboardingStep becomes category and contacts verified
  const verifyRes = response();
  await verifyOtp({
    body: {
      seekerId: res.body.seekerId,
      code: deliveredCode,
    },
  }, verifyRes);

  assert.equal(verifyRes.statusCode, 200);
  assert.equal(seeker.isEmailVerified, true);
  assert.equal(seeker.isPhoneVerified, true);
  assert.equal(seeker.onboardingStep, 'category');
});

test('seeker register handles OAuth null-password draft without 500 crash (Bug #1)', async (t) => {
  const oauthDraft = {
    id: 'oauth-draft-seeker',
    email: 'oauth-draft@example.com',
    phone: null,
    password: null,
    status: 'draft',
    onboardingStep: 'category',
  };
  t.mock.method(Seeker, 'findOne', async ({ where }) =>
    where.email === oauthDraft.email ? oauthDraft : null);

  const res = response();
  await register({
    body: {
      fullName: 'OAuth Seeker',
      email: oauthDraft.email,
      password: 'NewPassword1!',
      phone: '9876543210',
    },
  }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'EMAIL_EXISTS');
});

test('seeker register strictly rejects existing draft accounts with 409 without sending OTP or issuing token', async (t) => {
  const draft = {
    id: 'draft-resume-seeker',
    email: 'draft-resume@example.com',
    phone: '9876543211',
    fullName: 'Draft Seeker',
    password: await bcrypt.hash('DraftPass1!', 4),
    status: 'draft',
    onboardingStep: 'category',
    onboardingMetadata: {},
    save: async () => {},
  };
  t.mock.method(Seeker, 'findOne', async ({ where }) =>
    where.email === draft.email || where.phone === draft.phone ? draft : null);

  const beforeDeliveries = deliveries.length;
  for (const password of ['DraftPass1!', 'WrongPassword1!']) {
    const res = response();
    await register({
      body: { fullName: 'Draft Seeker', email: draft.email, password, phone: draft.phone },
    }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'EMAIL_EXISTS');
    assert.equal(res.body.token, undefined);
  }
  assert.equal(deliveries.length, beforeDeliveries);
});

test('seeker register rejects cross-account email/phone collisions and concurrent unique errors', async (t) => {
  const draftEmail = {
    id: 'draft-email-1',
    email: 'draft1@example.com',
    phone: '9111111111',
    password: await bcrypt.hash('DraftPass1!', 4),
    status: 'draft',
  };
  const activePhone = {
    id: 'active-phone-2',
    email: 'active2@example.com',
    phone: '9222222222',
    password: await bcrypt.hash('ActivePass1!', 4),
    status: 'active',
  };

  t.mock.method(Seeker, 'findOne', async ({ where }) => {
    if (where.email === draftEmail.email) return draftEmail;
    if (where.phone === activePhone.phone) return activePhone;
    return null;
  });

  const collisionRes = response();
  await register({
    body: { fullName: 'Test User', email: draftEmail.email, password: 'DraftPass1!', phone: activePhone.phone },
  }, collisionRes);
  assert.equal(collisionRes.statusCode, 409);
  assert.equal(collisionRes.body.code, 'EMAIL_EXISTS');

  const phoneOnlyRes = response();
  await register({
    body: { fullName: 'Test User', email: 'brandnew@example.com', password: 'DraftPass1!', phone: activePhone.phone },
  }, phoneOnlyRes);
  assert.equal(phoneOnlyRes.statusCode, 409);
  assert.equal(phoneOnlyRes.body.code, 'PHONE_EXISTS');

  // Concurrent DB unique constraint error maps to 409
  t.mock.method(Seeker, 'findOne', async () => null);
  t.mock.method(Seeker, 'create', async () => {
    throw Object.assign(new Error('Duplicate entry'), {
      name: 'SequelizeUniqueConstraintError',
      fields: { email: 'race@example.com' },
    });
  });
  const raceRes = response();
  await register({
    body: { fullName: 'Race User', email: 'race@example.com', password: 'RacePassword1!', phone: '9333333333' },
  }, raceRes);
  assert.equal(raceRes.statusCode, 409);
  assert.equal(raceRes.body.code, 'EMAIL_EXISTS');
});

test('seeker verifyOtp locks out after 5 invalid attempts and blocks concurrent replay', async (t) => {
  const seeker = {
    id: 'otp-bruteforce-seeker',
    email: 'bf@example.com',
    phone: '9444444444',
    onboardingStep: 'otp',
    status: 'draft',
    onboardingMetadata: { pendingOtp: { code: '112233', expiresAt: Date.now() + 60_000, attempts: 0 } },
    save: async () => {},
  };
  t.mock.method(Seeker, 'findByPk', async () => seeker);

  for (let i = 1; i < 5; i += 1) {
    const bad = response();
    await verifyOtp({ body: { seekerId: seeker.id, code: '000000' } }, bad);
    assert.equal(bad.statusCode, 400);
  }
  const exhausted = response();
  await verifyOtp({ body: { seekerId: seeker.id, code: '000000' } }, exhausted);
  assert.equal(exhausted.statusCode, 429);
  assert.equal(exhausted.body.code, 'OTP_ATTEMPTS_EXCEEDED');

  // Even the original valid code is now rejected
  const afterExhausted = response();
  await verifyOtp({ body: { seekerId: seeker.id, code: '112233' } }, afterExhausted);
  assert.equal(afterExhausted.statusCode, 400);
});

test('seeker login and OTP flows strictly block suspended seeker with 403 ACCOUNT_SUSPENDED', async (t) => {
  const suspendedSeeker = {
    id: 'suspended-seeker-account',
    email: 'suspended.seeker@example.com',
    phone: '9555555555',
    password: await bcrypt.hash('CorrectPass123!', 10),
    status: 'suspended',
    onboardingStep: 'category',
    onboardingMetadata: { suspendedAt: new Date().toISOString() },
    save: async () => {},
  };

  t.mock.method(Seeker, 'findOne', async () => suspendedSeeker);
  t.mock.method(Seeker, 'findByPk', async () => suspendedSeeker);

  // 1. Password login is blocked with 403 ACCOUNT_SUSPENDED
  const loginRes = response();
  await login(
    {
      body: { email: 'suspended.seeker@example.com', password: 'CorrectPass123!' },
      ip: '127.0.0.1',
    },
    loginRes,
  );
  assert.equal(loginRes.statusCode, 403);
  assert.equal(loginRes.body.code, 'ACCOUNT_SUSPENDED');
  assert.equal(loginRes.body.message, 'Your Profile has been suspended. Contact Us?');

  // 2. verifyOtp is blocked with 403 ACCOUNT_SUSPENDED
  const verifyRes = response();
  await verifyOtp(
    { body: { seekerId: suspendedSeeker.id, code: '123456' } },
    verifyRes,
  );
  assert.equal(verifyRes.statusCode, 403);
  assert.equal(verifyRes.body.code, 'ACCOUNT_SUSPENDED');

  // 3. resendOtp is blocked with 403 ACCOUNT_SUSPENDED
  const resendRes = response();
  await resendOtp(
    { body: { seekerId: suspendedSeeker.id } },
    resendRes,
  );
  assert.equal(resendRes.statusCode, 403);
  assert.equal(resendRes.body.code, 'ACCOUNT_SUSPENDED');
});

test('seeker resendOtp returns attempt fields, handles delivery failure, blocks at 3, and clears on verify', async (t) => {
  resendLimitMap.clear();
  const seeker = {
    id: 'resend-limit-seeker',
    email: 'resend-limit-seeker@example.com',
    phone: '9777788888',
    onboardingStep: 'otp',
    status: 'draft',
    onboardingMetadata: {},
    save: async () => {},
  };
  t.mock.method(Seeker, 'findByPk', async (id) => (id === seeker.id ? seeker : null));

  const statusBefore = response();
  await resendStatus({ body: { seekerId: seeker.id } }, statusBefore);
  assert.equal(statusBefore.statusCode, 200);
  assert.deepEqual(statusBefore.body, { resendAttempts: 0, maxResendAttempts: 3, blockedUntil: null });

  deliveryFails = true;
  const failed = response();
  await resendOtp({ body: { seekerId: seeker.id } }, failed);
  assert.equal(failed.statusCode, 503);
  deliveryFails = false;

  const first = response();
  await resendOtp({ body: { seekerId: seeker.id } }, first);
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.resendAttempts, 1);
  assert.equal(first.body.maxResendAttempts, 3);
  assert.equal(first.body.blockedUntil, null);

  const cooldown = response();
  await resendOtp({ body: { seekerId: seeker.id } }, cooldown);
  assert.equal(cooldown.statusCode, 429);
  assert.equal(cooldown.body.code, 'OTP_RESEND_COOLDOWN');
  assert.ok(cooldown.body.retryAfterSeconds > 0);

  const code = seeker.onboardingMetadata.pendingOtp.code;
  const verified = response();
  await verifyOtp({ body: { seekerId: seeker.id, code } }, verified);
  assert.equal(verified.statusCode, 200);

  const statusAfterVerify = response();
  await resendStatus({ body: { seekerId: seeker.id } }, statusAfterVerify);
  assert.equal(statusAfterVerify.body.resendAttempts, 0);

  const blockedSeeker = {
    id: 'blocked-seeker-id',
    email: 'blocked-seeker@example.com',
    phone: '9777799999',
    onboardingStep: 'otp',
    status: 'draft',
    onboardingMetadata: {},
    save: async () => {},
  };
  t.mock.method(Seeker, 'findByPk', async (id) => (id === blockedSeeker.id ? blockedSeeker : null));
  await resendLimitState.reserveResendAttempt({ email: blockedSeeker.email, phone: blockedSeeker.phone });
  await resendLimitState.reserveResendAttempt({ email: blockedSeeker.email, phone: blockedSeeker.phone });
  await resendLimitState.reserveResendAttempt({ email: blockedSeeker.email, phone: blockedSeeker.phone });

  const blocked = response();
  await resendOtp({ body: { seekerId: blockedSeeker.id } }, blocked);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.code, 'OTP_RESEND_LIMIT_REACHED');
  assert.equal(blocked.body.resendAttempts, 3);
  assert.equal(blocked.body.maxResendAttempts, 3);
  assert.ok(blocked.body.blockedUntil);
  assert.ok(blocked.body.retryAfterSeconds > 0);
});

test('blocked seeker login returns 429 without sending OTP, wrong password returns 401, and expired block allows login OTP', async (t) => {
  deliveries.length = 0;
  failures.clear();
  const passwordHash = await bcrypt.hash('Secret123!', 10);
  const seeker = {
    id: 'seeker-login-block-test',
    email: 'blocked-login-seeker@example.com',
    phone: '9777755555',
    password: passwordHash,
    onboardingStep: 'otp',
    status: 'draft',
    onboardingMetadata: {},
    save: async () => {},
  };

  t.mock.method(Seeker, 'findOne', async ({ where: { email } }) => (email === seeker.email ? seeker : null));

  const key = `${seeker.email}|${seeker.phone}`;
  const futureBlockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  resendLimitMap.set(key, { count: 3, blockedUntil: futureBlockedUntil });

  // Wrong password while blocked still returns 401
  const wrongPwRes = response();
  await login({ body: { email: seeker.email, password: 'WrongPassword!' }, headers: {} }, wrongPwRes);
  assert.equal(wrongPwRes.statusCode, 401);
  assert.equal(wrongPwRes.body.message, 'Invalid email or password');
  assert.equal(deliveries.length, 0);

  // Valid password while blocked returns 429 without sending OTP or mutating counter/block
  const blockedLoginRes = response();
  await login({ body: { email: seeker.email, password: 'Secret123!' }, headers: {} }, blockedLoginRes);
  assert.equal(blockedLoginRes.statusCode, 429);
  assert.equal(blockedLoginRes.body.code, 'OTP_RESEND_LIMIT_REACHED');
  assert.equal(blockedLoginRes.body.blockedUntil, futureBlockedUntil);
  assert.ok(blockedLoginRes.body.retryAfterSeconds > 0);
  assert.equal(deliveries.length, 0);
  assert.deepEqual(resendLimitMap.get(key), { count: 3, blockedUntil: futureBlockedUntil });

  // After block expires, login sends OTP normally
  resendLimitMap.set(key, { count: 3, blockedUntil: new Date(Date.now() - 1000).toISOString() });
  const unblockedRes = response();
  await login({ body: { email: seeker.email, password: 'Secret123!' }, headers: {} }, unblockedRes);
  assert.equal(unblockedRes.statusCode, 403);
  assert.equal(unblockedRes.body.requiresOtp, true);
  assert.equal(deliveries.length, 1);
});
