import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyRegistrationConflict,
  createOtpCooldownTracker,
  mapRegistrationUniqueError,
} from './authRegistrationGuard.js';
import {
  constantTimeCodeEqual,
  isStoredOtpValid,
  MAX_OTP_ATTEMPTS,
  recordOtpFailure,
  storeOtpOnModel,
  withOtpVerificationLock,
} from './otpPersistence.js';

test('classifyRegistrationConflict strictly rejects any existing email or phone including drafts', () => {
  // Neither exists -> CREATE
  assert.deepEqual(
    classifyRegistrationConflict({ existingEmail: null, existingPhone: null }),
    { action: 'CREATE' },
  );

  // Email draft -> EMAIL_EXISTS
  const draftEmail = { id: 'e1', status: 'draft', password: 'hash', phone: '9111111111' };
  const activePhone = { id: 'p2', status: 'active', password: 'hash', phone: '9222222222' };
  const emailConflict = classifyRegistrationConflict({
    existingEmail: draftEmail,
    existingPhone: activePhone,
  });
  assert.equal(emailConflict.action, 'CONFLICT');
  assert.equal(emailConflict.code, 'EMAIL_EXISTS');

  // New email + Phone belongs to an existing draft -> PHONE_EXISTS
  const phoneOnlyDraft = classifyRegistrationConflict({
    existingEmail: null,
    existingPhone: { id: 'p3', status: 'draft', password: 'hash', phone: '9222222222' },
  });
  assert.equal(phoneOnlyDraft.action, 'CONFLICT');
  assert.equal(phoneOnlyDraft.code, 'PHONE_EXISTS');

  // OAuth-created draft (password: null) -> EMAIL_EXISTS (prevents bcrypt.compare crash)
  const oauthDraft = { id: 'o1', status: 'draft', password: null, phone: null };
  const socialConflict = classifyRegistrationConflict({
    existingEmail: oauthDraft,
    existingPhone: null,
  });
  assert.equal(socialConflict.action, 'CONFLICT');
  assert.equal(socialConflict.code, 'EMAIL_EXISTS');

  // Same account draft with matching email & phone -> strictly rejected with EMAIL_EXISTS
  const sameDraft = classifyRegistrationConflict({
    existingEmail: draftEmail,
    existingPhone: draftEmail,
  });
  assert.equal(sameDraft.action, 'CONFLICT');
  assert.equal(sameDraft.code, 'EMAIL_EXISTS');
});

test('mapRegistrationUniqueError converts Sequelize duplicate errors into clean 409 codes', () => {
  const emailDup = mapRegistrationUniqueError({
    name: 'SequelizeUniqueConstraintError',
    fields: { email: 'a@b.com' },
  });
  assert.equal(emailDup.status, 409);
  assert.equal(emailDup.code, 'EMAIL_EXISTS');

  const phoneDup = mapRegistrationUniqueError({
    name: 'SequelizeUniqueConstraintError',
    fields: { phone: '9876543210' },
  });
  assert.equal(phoneDup.status, 409);
  assert.equal(phoneDup.code, 'PHONE_EXISTS');

  assert.equal(mapRegistrationUniqueError(new Error('unrelated')), null);
});

test('createOtpCooldownTracker enforces cooldown window and supports clear', () => {
  const tracker = createOtpCooldownTracker(30_000, 10);
  assert.equal(tracker.canIssueNow('user-1'), true);
  tracker.markIssued('user-1');
  assert.equal(tracker.canIssueNow('user-1'), false);
  tracker.clear('user-1');
  assert.equal(tracker.canIssueNow('user-1'), true);
});

test('otpPersistence uses constant-time comparison and invalidates after MAX_OTP_ATTEMPTS', async () => {
  assert.equal(constantTimeCodeEqual('123456', '123456'), true);
  assert.equal(constantTimeCodeEqual('123456', '123457'), false);
  assert.equal(constantTimeCodeEqual('123456', '12345'), false);

  const cache = new Map();
  const model = {
    id: 'otp-user',
    onboardingMetadata: {},
    save: async () => {},
  };
  const entry = await storeOtpOnModel(model, '654321');
  cache.set(model.id, entry);

  assert.equal(isStoredOtpValid(entry, '654321'), true);
  for (let i = 1; i < MAX_OTP_ATTEMPTS; i += 1) {
    const res = await recordOtpFailure(model, cache, model.id);
    assert.equal(res.exhausted, false);
    assert.equal(res.attempts, i);
  }
  const finalFailure = await recordOtpFailure(model, cache, model.id);
  assert.equal(finalFailure.exhausted, true);
  assert.equal(cache.has(model.id), false);
  assert.equal(model.onboardingMetadata.pendingOtp, undefined);
});

test('withOtpVerificationLock serializes concurrent verifications to prevent double-redemption', async () => {
  let active = true;
  let successes = 0;

  await Promise.all([
    withOtpVerificationLock('test:user-1', async () => {
      if (!active) return;
      await new Promise((r) => setTimeout(r, 15));
      active = false;
      successes += 1;
    }),
    withOtpVerificationLock('test:user-1', async () => {
      if (!active) return;
      await new Promise((r) => setTimeout(r, 5));
      active = false;
      successes += 1;
    }),
  ]);

  assert.equal(successes, 1);
});

