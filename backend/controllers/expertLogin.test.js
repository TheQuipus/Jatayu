import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Expert } from '../models/index.js';

const deliveries = [];
let deliveryFails = false;
let currentClientIp = '127.0.0.1';
const failures = new Map();
const lockKey = (type, id, sourceIp = '127.0.0.1') => `${type}:${id}:${sourceIp}`;
const expertLoginLockoutState = {
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
const originalExpertLoginLockoutState = { ...expertLoginLockoutState };
mock.module('../utils/otpDelivery.js', {
  namedExports: {
    deliverOtpChannels: async (payload) => {
      if (deliveryFails) throw Object.assign(new Error('Delivery unavailable'), { name: 'OtpDeliveryError' });
      deliveries.push(payload);
    },
    handleOtpDeliveryError: (error, res) => error.name === 'OtpDeliveryError'
      ? res.status(503).json({ code: 'OTP_DELIVERY_FAILED' }) : null,
  },
});
mock.module('../utils/accountLoginLockout.js', {
  namedExports: {
    buildPasswordLoginLockedResponse: (lockedUntil) => ({ code: 'ACCOUNT_LOCKED', lockedUntil }),
    buildPasswordLoginRateLimitResponse: (lockedUntil) => ({ code: 'IP_RATE_LIMITED', lockedUntil }),
    getClientIpAddress: () => currentClientIp,
    getPasswordLoginIpLockout: async (...args) => expertLoginLockoutState.getPasswordLoginIpLockout(...args),
    getPasswordLoginLockout: async (...args) => expertLoginLockoutState.getPasswordLoginLockout(...args),
    recordFailedPasswordLogin: async (...args) => expertLoginLockoutState.recordFailedPasswordLogin(...args),
    clearPasswordLoginFailures: async (...args) => expertLoginLockoutState.clearPasswordLoginFailures(...args),
    clearPasswordLoginIpFailures: async (...args) => expertLoginLockoutState.clearPasswordLoginIpFailures(...args),
  },
});
mock.module('../services/expertSessionService.js', { namedExports: { issueExpertToken: async () => 'test-expert-token' } });
mock.module('../utils/expertApplicationQueue.js', { namedExports: { promoteExpertToApplicationQueue: async () => {} } });

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
};
mock.module('../utils/otpResendLimit.js', { namedExports: resendLimitState });

const { login, register, resendOtp, resendStatus, verifyOtp } = await import('./authController.js');

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('new expert accounts enable 2FA by default', () => {
  const expert = Expert.build({ email: 'new@example.com', fullName: 'New Expert' });
  assert.equal(expert.twoFactorEnabled, true);
});

for (const onboardingStep of ['otp', 'budget', 'completed']) {
  test(`password login requires a fresh OTP at ${onboardingStep}`, async (t) => {
    const expert = {
      id: `expert-${onboardingStep}`, email: 'test@example.com', phone: '+919999999999',
      password: await bcrypt.hash('TestPassword1!', 4), onboardingStep,
      twoFactorEnabled: onboardingStep !== 'otp', isEmailVerified: onboardingStep !== 'otp', isPhoneVerified: onboardingStep !== 'otp',
      save: async () => {},
    };
    t.mock.method(Expert, 'findOne', async () => expert);
    t.mock.method(Expert, 'findByPk', async () => expert);
    const before = deliveries.length;
    const res = response();
    await login({ body: { email: expert.email, password: 'TestPassword1!' } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.requiresOtp, true);
    assert.equal(res.body.token, undefined);
    assert.equal(deliveries.length, before + 1);
    assert.match(expert.onboardingMetadata.pendingOtp.code, /^\d{6}$/);

    const wrong = response();
    await verifyOtp({ body: { expertId: expert.id, code: 'wrong' } }, wrong);
    assert.equal(wrong.statusCode, 400);
    assert.equal(wrong.body.token, undefined);

    const code = expert.onboardingMetadata.pendingOtp.code;
    const verified = response();
    await verifyOtp({ body: { expertId: expert.id, code } }, verified);
    assert.equal(verified.statusCode, 200);
    assert.ok(verified.body.token);
    assert.equal(expert.onboardingStep, onboardingStep === 'otp' ? 'category' : onboardingStep);

    const replay = response();
    await verifyOtp({ body: { expertId: expert.id, code } }, replay);
    assert.equal(replay.statusCode, 400);

    const nextLogin = response();
    await login({ body: { email: expert.email, password: 'TestPassword1!' } }, nextLogin);
    assert.equal(nextLogin.statusCode, expert.twoFactorEnabled ? 403 : 200);
    assert.equal(Boolean(nextLogin.body.token), !expert.twoFactorEnabled);
  });
}

test('delivery failure and incorrect passwords never issue a token', async (t) => {
  const expert = {
    twoFactorEnabled: true, id: 'delivery-failure', email: 'test@example.com', onboardingStep: 'completed',
    password: await bcrypt.hash('TestPassword1!', 4), save: async () => {},
  };
  t.mock.method(Expert, 'findOne', async () => expert);
  const before = deliveries.length;
  const invalid = response();
  await login({ body: { email: expert.email, password: 'incorrect' } }, invalid);
  assert.equal(invalid.statusCode, 401);
  assert.equal(invalid.body.token, undefined);
  assert.equal(deliveries.length, before);
  deliveryFails = true;
  t.after(() => { deliveryFails = false; });
  const unavailable = response();
  await login({ body: { email: expert.email, password: 'TestPassword1!' } }, unavailable);
  assert.equal(unavailable.statusCode, 503);
  assert.equal(unavailable.body.token, undefined);
});

test('expert password login locks after five incorrect passwords', async (t) => {
  const expert = {
    id: 'lockout-expert', email: 'locked@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4), save: async () => {},
  };
  t.mock.method(Expert, 'findOne', async () => expert);

  for (let attempt = 1; attempt < 5; attempt++) {
    const invalid = response();
    await login({ body: { email: expert.email, password: 'wrong' } }, invalid);
    assert.equal(invalid.statusCode, 401);
  }
  const locked = response();
  await login({ body: { email: expert.email, password: 'wrong' } }, locked);
  assert.equal(locked.statusCode, 429);
  assert.equal(locked.body.code, 'ACCOUNT_LOCKED');

  const correct = response();
  await login({ body: { email: expert.email, password: 'CorrectPassword1!' } }, correct);
  assert.equal(correct.statusCode, 429);
  assert.equal(correct.body.code, 'ACCOUNT_LOCKED');
});

test('expert login keeps unknown, incorrect-password, and social-only responses generic', async (t) => {
  const expert = {
    id: 'generic-login-expert',
    email: 'generic@example.com',
    password: null,
  };
  t.mock.method(Expert, 'findOne', async ({ where }) =>
    where.email === expert.email ? expert : null);

  const unknown = response();
  await login({ body: { email: 'unknown@example.com', password: 'wrong' } }, unknown);
  expert.password = await bcrypt.hash('CorrectPassword1!', 4);
  const wrongPassword = response();
  await login({ body: { email: expert.email, password: 'wrong' } }, wrongPassword);
  expert.password = null;
  const socialOnly = response();
  await login({ body: { email: expert.email, password: 'wrong' } }, socialOnly);

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

test('expert login blocks active IP lockouts and clears IP state on success', async (t) => {
  t.after(() => {
    Object.assign(expertLoginLockoutState, originalExpertLoginLockoutState);
  });

  const expert = {
    id: 'ip-lockout-expert',
    email: 'ip-lockout@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    onboardingStep: 'completed',
    twoFactorEnabled: false,
    role: 'expert',
    status: 'draft',
  };
  const lookupCalls = { count: 0 };
  const clearCalls = [];

  expertLoginLockoutState.getPasswordLoginIpLockout = async () => ({ lockedUntil: Date.now() + 60_000 });
  t.mock.method(Expert, 'findOne', async ({ where }) => {
    lookupCalls.count += 1;
    return where.email === expert.email ? expert : null;
  });

  const lockedIp = response();
  await login({ body: { email: expert.email, password: 'CorrectPassword1!' } }, lockedIp);
  assert.equal(lockedIp.statusCode, 429);
  assert.equal(lockedIp.body.code, 'IP_RATE_LIMITED');
  assert.equal(lookupCalls.count, 0);

  expertLoginLockoutState.getPasswordLoginIpLockout = async () => null;
  const unknownAccountCalls = [];
  expertLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => {
    unknownAccountCalls.push({ type, account, sourceIp });
    return { lockedUntil: null, ipLockedUntil: null };
  };
  const unknown = response();
  await login({ body: { email: 'missing-expert@example.com', password: 'wrong' } }, unknown);
  assert.equal(unknown.statusCode, 401);
  assert.equal(unknown.body.message, 'Invalid email or password');
  assert.equal(unknownAccountCalls.at(-1).account, null);
  assert.equal(unknownAccountCalls.at(-1).sourceIp, '127.0.0.1');

  expertLoginLockoutState.recordFailedPasswordLogin = async (type, account, sourceIp) => ({
    lockedUntil: null,
    ipLockedUntil: Date.now() + 60_000,
  });
  const rateLimited = response();
  await login({ body: { email: 'missing-expert@example.com', password: 'wrong' } }, rateLimited);
  assert.equal(rateLimited.statusCode, 429);
  assert.equal(rateLimited.body.code, 'IP_RATE_LIMITED');

  expertLoginLockoutState.getPasswordLoginIpLockout = async () => null;
  expertLoginLockoutState.recordFailedPasswordLogin = async () => ({ lockedUntil: null, ipLockedUntil: null });
  expertLoginLockoutState.clearPasswordLoginIpFailures = async (ip) => {
    clearCalls.push(ip);
    return { lockedUntil: null };
  };
  const success = response();
  await login({ body: { email: expert.email, password: 'CorrectPassword1!' } }, success);
  assert.equal(success.statusCode, 200);
  assert.ok(success.body.token);
  assert.deepEqual(clearCalls, ['127.0.0.1']);
});

test('expert login uses the requesting IP when checking account lockout state across IPs', async (t) => {
  const expert = {
    id: 'cross-ip-expert',
    email: 'cross-ip-expert@example.com',
    password: await bcrypt.hash('CorrectPassword1!', 4),
    onboardingStep: 'completed',
    twoFactorEnabled: false,
    role: 'expert',
    status: 'draft',
  };
  const attackerIp = '203.0.113.10';
  const legitimateIp = '198.51.100.20';
  const attackerLockUntil = Date.now() + 60_000;
  const lookupCalls = [];
  const originalLookup = expertLoginLockoutState.getPasswordLoginLockout.bind(expertLoginLockoutState);
  const originalClear = expertLoginLockoutState.clearPasswordLoginFailures.bind(expertLoginLockoutState);
  const originalClearIp = expertLoginLockoutState.clearPasswordLoginIpFailures.bind(expertLoginLockoutState);

  failures.set(lockKey('expert', expert.id, attackerIp), { attempts: 5, lockedUntil: attackerLockUntil });
  currentClientIp = legitimateIp;

  expertLoginLockoutState.getPasswordLoginLockout = async (...args) => {
    lookupCalls.push(args);
    return originalLookup(...args);
  };
  expertLoginLockoutState.clearPasswordLoginFailures = async (...args) => {
    lookupCalls.push(['clear', ...args]);
    return originalClear(...args);
  };
  expertLoginLockoutState.clearPasswordLoginIpFailures = async (...args) => {
    lookupCalls.push(['clear-ip', ...args]);
    return originalClearIp(...args);
  };

  t.after(() => {
    currentClientIp = '127.0.0.1';
    failures.clear();
    expertLoginLockoutState.getPasswordLoginLockout = originalLookup;
    expertLoginLockoutState.clearPasswordLoginFailures = originalClear;
    expertLoginLockoutState.clearPasswordLoginIpFailures = originalClearIp;
    Object.assign(expertLoginLockoutState, originalExpertLoginLockoutState);
  });

  t.mock.method(Expert, 'findOne', async ({ where }) => where.email === expert.email ? expert : null);

  const res = response();
  await login({ body: { email: expert.email, password: 'CorrectPassword1!' } }, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token);
  assert.equal(lookupCalls.some(([type, id, sourceIp]) => type === 'expert' && id === expert.id && sourceIp === legitimateIp), true);
  assert.equal(lookupCalls.some(([type, id, sourceIp]) => type === 'expert' && id === expert.id && sourceIp === attackerIp), false);
  assert.equal(failures.get(lockKey('expert', expert.id, attackerIp))?.lockedUntil, attackerLockUntil);
  assert.equal(failures.has(lockKey('expert', expert.id, legitimateIp)), false);
});

test('password login returns the persisted onboarding step for resume routing', async (t) => {
  const expert = {
    id: 'resume-expert',
    email: 'resume@example.com',
    fullName: 'Resume Expert',
    phone: '+919999999999',
    profilePhotoSrc: '/assets/img/manportrait.png',
    linkedinId: null,
    onboardingStep: 'audience',
    status: 'draft',
    twoFactorEnabled: false,
    password: await bcrypt.hash('TestPassword1!', 4),
  };
  t.mock.method(Expert, 'findOne', async () => expert);

  const res = response();
  await login({ body: { email: expert.email, password: 'TestPassword1!' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.onboardingStep, 'audience');
});

for (const onboardingStep of ['budget', 'completed']) {
  test(`2FA disabled allows password login at ${onboardingStep}`, async (t) => {
    const expert = {
      id: '2fa-disabled', email: 'test@example.com', onboardingStep,
      twoFactorEnabled: false, password: await bcrypt.hash('TestPassword1!', 4),
    };
    t.mock.method(Expert, 'findOne', async () => expert);
    const before = deliveries.length;
    const res = response();
    await login({ body: { email: expert.email, password: 'TestPassword1!' } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.requiresOtp, undefined);
    assert.equal(deliveries.length, before);
  });
}

test('new expert registration creates DB account immediately in draft state and completes on OTP verification', async (t) => {
  t.mock.method(Expert, 'findOne', async () => null);
  let createdValues;
  const expert = {
    id: 'new-expert-id',
    get fullName() { return createdValues?.fullName; },
    get email() { return createdValues?.email; },
    get phone() { return createdValues?.phone; },
    onboardingStep: 'otp',
    status: 'draft',
    isEmailVerified: false,
    isPhoneVerified: false,
    save: async () => {},
  };
  t.mock.method(Expert, 'create', async (values) => {
    createdValues = values;
    return expert;
  });
  t.mock.method(Expert, 'findByPk', async () => expert);
  const before = deliveries.length;

  const res = response();
  await register({
    body: {
      fullName: 'New Expert',
      email: 'newexpert@example.com',
      password: 'ExpertPassword1!',
      phone: '9876543210',
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdValues.email, 'newexpert@example.com');
  assert.equal(createdValues.phone, '9876543210');
  assert.equal(createdValues.onboardingStep, 'otp');
  assert.equal(createdValues.status, 'draft');
  assert.equal(deliveries.length, before + 1);
  assert.equal(deliveries.at(-1).email, 'newexpert@example.com');
  const deliveredCode = deliveries.at(-1).otpCode;
  assert.match(deliveredCode, /^\d{6}$/);

  // Now verify OTP -> onboardingStep becomes category and contacts verified
  const verifyRes = response();
  await verifyOtp({
    body: {
      expertId: res.body.expertId,
      code: deliveredCode,
    },
  }, verifyRes);

  assert.equal(verifyRes.statusCode, 200);
  assert.equal(expert.isEmailVerified, true);
  assert.equal(expert.isPhoneVerified, true);
  assert.equal(expert.onboardingStep, 'category');
  assert.equal(expert.status, 'draft');
});

test('expert register strictly rejects existing OAuth and password drafts with 409 without sending OTP', async (t) => {
  const oauthDraft = {
    id: 'oauth-draft-expert',
    email: 'oauth-expert@example.com',
    phone: null,
    password: null,
    status: 'draft',
    onboardingStep: 'category',
  };
  let findCall = 0;
  t.mock.method(Expert, 'findOne', async () => {
    findCall += 1;
    return findCall === 1 ? oauthDraft : null;
  });

  const oauthRes = response();
  await register({
    body: { fullName: 'OAuth Expert', email: oauthDraft.email, password: 'ExpertPassword1!', phone: '9876543210' },
  }, oauthRes);
  assert.equal(oauthRes.statusCode, 409);
  assert.equal(oauthRes.body.code, 'EMAIL_EXISTS');

  // Existing password draft -> strictly rejected with 409 EMAIL_EXISTS (directs user to /login)
  const draftExpert = {
    id: 'draft-2fa-expert',
    email: 'draft-2fa@example.com',
    phone: '9876543212',
    fullName: 'Draft Expert',
    password: await bcrypt.hash('DraftPass1!', 4),
    status: 'draft',
    onboardingStep: 'category',
    twoFactorEnabled: true,
    onboardingMetadata: {},
    save: async () => {},
  };
  t.mock.method(Expert, 'findOne', async () => draftExpert);

  const before = deliveries.length;
  const dupRes = response();
  await register({
    body: { fullName: 'Draft Expert', email: draftExpert.email, password: 'DraftPass1!', phone: draftExpert.phone },
  }, dupRes);
  assert.equal(dupRes.statusCode, 409);
  assert.equal(dupRes.body.code, 'EMAIL_EXISTS');
  assert.equal(dupRes.body.token, undefined);
  assert.equal(deliveries.length, before);
});

test('expert verifyOtp locks out after 5 invalid attempts', async (t) => {
  const expert = {
    id: 'otp-bruteforce-expert',
    email: 'bf-expert@example.com',
    phone: '9555555555',
    onboardingStep: 'otp',
    status: 'draft',
    isBlacklisted: false,
    onboardingMetadata: { pendingOtp: { code: '665544', expiresAt: Date.now() + 60_000, attempts: 0 } },
    save: async () => {},
  };
  t.mock.method(Expert, 'findByPk', async () => expert);

  for (let i = 1; i < 5; i += 1) {
    const bad = response();
    await verifyOtp({ body: { expertId: expert.id, code: '000000' } }, bad);
    assert.equal(bad.statusCode, 400);
  }
  const exhausted = response();
  await verifyOtp({ body: { expertId: expert.id, code: '000000' } }, exhausted);
  assert.equal(exhausted.statusCode, 429);
  assert.equal(exhausted.body.code, 'OTP_ATTEMPTS_EXCEEDED');
});

test('expert resendOtp tracks attempts, enforces 30s cooldown, releases on failure, blocks at 3, and clears on verify', async (t) => {
  resendLimitMap.clear();
  const expert = {
    id: 'resend-limit-expert',
    email: 'resend-limit-expert@example.com',
    phone: '9888877777',
    onboardingStep: 'otp',
    status: 'draft',
    isBlacklisted: false,
    onboardingMetadata: {},
    save: async () => {},
  };
  t.mock.method(Expert, 'findByPk', async (id) => (id === expert.id ? expert : null));

  const statusBefore = response();
  await resendStatus({ body: { expertId: expert.id } }, statusBefore);
  assert.equal(statusBefore.statusCode, 200);
  assert.deepEqual(statusBefore.body, { resendAttempts: 0, maxResendAttempts: 3, blockedUntil: null });

  // Delivery failure does not consume an attempt
  deliveryFails = true;
  const failedResend = response();
  await resendOtp({ body: { expertId: expert.id } }, failedResend);
  assert.equal(failedResend.statusCode, 503);
  deliveryFails = false;

  const statusAfterFail = response();
  await resendStatus({ body: { expertId: expert.id } }, statusAfterFail);
  assert.equal(statusAfterFail.body.resendAttempts, 0);

  // 1st resend succeeds and starts 30s cooldown
  const firstResend = response();
  await resendOtp({ body: { expertId: expert.id } }, firstResend);
  assert.equal(firstResend.statusCode, 200);
  assert.equal(firstResend.body.resendAttempts, 1);
  assert.equal(firstResend.body.maxResendAttempts, 3);
  assert.equal(firstResend.body.blockedUntil, null);

  // Immediate 2nd resend hits 30s cooldown
  const cooldownRes = response();
  await resendOtp({ body: { expertId: expert.id } }, cooldownRes);
  assert.equal(cooldownRes.statusCode, 429);
  assert.equal(cooldownRes.body.code, 'OTP_RESEND_COOLDOWN');
  assert.ok(cooldownRes.body.retryAfterSeconds > 0);

  // Verify clears resend counter
  const code = expert.onboardingMetadata.pendingOtp.code;
  const verifyRes = response();
  await verifyOtp({ body: { expertId: expert.id, code } }, verifyRes);
  assert.equal(verifyRes.statusCode, 200);

  const statusAfterVerify = response();
  await resendStatus({ body: { expertId: expert.id } }, statusAfterVerify);
  assert.equal(statusAfterVerify.body.resendAttempts, 0);

  // Blocked account gets 429 OTP_RESEND_LIMIT_REACHED
  const blockedExpert = {
    id: 'blocked-expert-id',
    email: 'blocked-expert@example.com',
    phone: '9888866666',
    onboardingStep: 'otp',
    status: 'draft',
    isBlacklisted: false,
    onboardingMetadata: {},
    save: async () => {},
  };
  t.mock.method(Expert, 'findByPk', async (id) => (id === blockedExpert.id ? blockedExpert : null));
  await resendLimitState.reserveResendAttempt({ email: blockedExpert.email, phone: blockedExpert.phone });
  await resendLimitState.reserveResendAttempt({ email: blockedExpert.email, phone: blockedExpert.phone });
  await resendLimitState.reserveResendAttempt({ email: blockedExpert.email, phone: blockedExpert.phone });

  const blockedRes = response();
  await resendOtp({ body: { expertId: blockedExpert.id } }, blockedRes);
  assert.equal(blockedRes.statusCode, 429);
  assert.equal(blockedRes.body.code, 'OTP_RESEND_LIMIT_REACHED');
  assert.equal(blockedRes.body.resendAttempts, 3);
  assert.equal(blockedRes.body.maxResendAttempts, 3);
  assert.ok(blockedRes.body.blockedUntil);
  assert.ok(blockedRes.body.retryAfterSeconds > 0);
});
