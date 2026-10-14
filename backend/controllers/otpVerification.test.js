import assert from 'node:assert/strict';
import test from 'node:test';
import { Expert, Seeker } from '../models/index.js';
import { verifyOtp as verifyExpertOtp } from './authController.js';
import { verifyOtp as verifySeekerOtp } from './seeker/seekerAuthController.js';

for (const [name, model, verify, idKey] of [
  ['expert', Expert, verifyExpertOtp, 'expertId'],
  ['seeker', Seeker, verifySeekerOtp, 'seekerId'],
]) {
  test(`${name} rejects an unissued code even when SMS is unconfigured`, async (t) => {
    t.mock.method(model, 'findByPk', async () => ({ onboardingMetadata: {} }));
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await verify({ body: { [idKey]: 'unverified-test-user', code: [1, 2, 3, 4, 5, 6].join('') } }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Invalid or expired/);
  });
}
