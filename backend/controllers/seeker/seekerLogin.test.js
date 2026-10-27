import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Seeker } from '../../models/index.js';

const deliveries = [];
let deliveryFails = false;
const failures = new Map();
const lockKey = (type, id) => `${type}:${id}`;
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
    getPasswordLoginLockout: async (type, id) => {
      const state = failures.get(lockKey(type, id));
      return state?.lockedUntil > Date.now() ? { lockedUntil: state.lockedUntil } : null;
    },
    recordFailedPasswordLogin: async (type, account) => {
      const key = lockKey(type, account.id);
      const state = failures.get(key) || { attempts: 0 };
      if (state.lockedUntil > Date.now()) return { lockedUntil: state.lockedUntil };
      state.attempts += 1;
      state.lockedUntil = state.attempts >= 5 ? Date.now() + 10 * 60 * 1000 : null;
      failures.set(key, state);
      return { lockedUntil: state.lockedUntil };
    },
    clearPasswordLoginFailures: async (type, id) => {
      const key = lockKey(type, id);
      const state = failures.get(key);
      if (state?.lockedUntil > Date.now()) return { lockedUntil: state.lockedUntil };
      failures.delete(key);
      return { lockedUntil: null };
    },
  },
});
const { login, register, verifyOtp } = await import('./seekerAuthController.js');

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

test('new seeker registration still creates the account and sends one OTP', async (t) => {
  t.mock.method(Seeker, 'findOne', async () => null);
  let createdValues;
  const seeker = {
    id: 'new-registration-seeker',
    get fullName() { return createdValues.fullName; },
    get email() { return createdValues.email; },
    get phone() { return createdValues.phone; },
    onboardingMetadata: null,
    save: async () => {},
  };
  t.mock.method(Seeker, 'create', async (values) => {
    createdValues = values;
    return seeker;
  });
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
  assert.equal(deliveries.length, before + 1);
  assert.equal(deliveries.at(-1).email, 'new@example.com');
  assert.match(seeker.onboardingMetadata.pendingOtp.code, /^\d{6}$/);
});
