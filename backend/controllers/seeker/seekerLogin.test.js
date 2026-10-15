import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Seeker } from '../../models/index.js';

const deliveries = [];
let deliveryFails = false;
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
const { login, verifyOtp } = await import('./seekerAuthController.js');

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
