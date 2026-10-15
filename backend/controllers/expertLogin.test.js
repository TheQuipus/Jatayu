import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Expert } from '../models/index.js';

const deliveries = [];
let deliveryFails = false;
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
mock.module('../services/expertSessionService.js', { namedExports: { issueExpertToken: async () => 'test-expert-token' } });
mock.module('../utils/expertApplicationQueue.js', { namedExports: { promoteExpertToApplicationQueue: async () => {} } });
const { login, verifyOtp } = await import('./authController.js');

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
