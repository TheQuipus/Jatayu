import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const Seeker = {
  findByPk: async () => null,
  findOne: async () => null,
};
const SeekerCreditTransaction = {};
const seekerDb = {
  transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
};

mock.module('../../models/index.js', {
  namedExports: { Seeker, SeekerCreditTransaction, seekerDb },
});
mock.module('../../utils/aiService.js', {
  namedExports: {
    AiNotConfiguredError: class AiNotConfiguredError extends Error {},
    improveSeekerNeedsCopy: async () => ({}),
  },
});
mock.module('../../utils/templateNotificationService.js', {
  namedExports: { triggerNotification: async () => {} },
});
mock.module('../../utils/settingsHelper.js', {
  namedExports: { getSetting: async (_key, fallback) => fallback },
});
mock.module('../../services/notificationService.js', {
  namedExports: { sendNotification: async () => {} },
});
mock.module('../../utils/seekerOnboardingProgress.js', {
  namedExports: {
    getSeekerOnboardingProgress: () => ({
      completedSteps: [],
      resumeStep: 'category',
      onboardingComplete: false,
    }),
    hasCompletedSeekerStep: () => false,
  },
});

const { getProfile, updateProfile } = await import('./seekerController.js');

function response() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function makeSeeker(phone = null) {
  return {
    id: 'authenticated-seeker-id',
    fullName: 'Priya Sharma',
    category: 'Career',
    profilePhotoSrc: null,
    phone,
    isPhoneVerified: false,
    saves: 0,
    toJSON() {
      return {
        id: this.id,
        fullName: this.fullName,
        category: this.category,
        profilePhotoSrc: this.profilePhotoSrc,
        phone: this.phone,
        isPhoneVerified: this.isPhoneVerified,
      };
    },
    async save() {
      this.saves += 1;
    },
  };
}

test('profile read only fetches the authenticated seeker', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async (id) => {
    assert.equal(id, seeker.id);
    return seeker;
  });

  const res = response();
  await getProfile({ user: { id: seeker.id }, params: { seekerId: 'another-seeker' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, seeker.id);
});

test('profile update persists name and category only to the authenticated seeker', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async (id) => {
    assert.equal(id, seeker.id);
    return seeker;
  });

  const res = response();
  await updateProfile({
    user: { id: seeker.id },
    params: { seekerId: 'another-seeker' },
    body: {
      fullName: 'Asha Rao',
      category: 'Technology',
      seekerId: 'another-seeker',
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(seeker.fullName, 'Asha Rao');
  assert.equal(seeker.category, 'Technology');
  assert.equal(res.body.seeker.id, seeker.id);
  assert.equal(seeker.saves, 1);
});

test('profile update rejects an invalid name without saving', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async () => seeker);

  const res = response();
  await updateProfile({
    user: { id: seeker.id },
    body: { fullName: '123' },
  }, res);

  assert.equal(res.statusCode, 422);
  assert.match(res.body.errors.join(' '), /fullName must be a valid name/);
  assert.equal(seeker.fullName, 'Priya Sharma');
  assert.equal(seeker.saves, 0);
});

test('profile update persists an uploaded photo path for the authenticated seeker', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async (id) => {
    assert.equal(id, seeker.id);
    return seeker;
  });

  const res = response();
  await updateProfile({
    user: { id: seeker.id },
    body: {},
    file: { filename: 'seeker-profile-photo.png' },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(seeker.profilePhotoSrc, '/uploads/seeker-profile-photo.png');
  assert.equal(res.body.seeker.profilePhotoSrc, '/uploads/seeker-profile-photo.png');
});

test('profile phone update leaves a missing nullable phone unchanged', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async (id) => {
    assert.equal(id, 'authenticated-seeker-id');
    return seeker;
  });

  const res = response();
  await updateProfile({ user: { id: seeker.id }, body: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.seeker.phone, null);
  assert.equal(seeker.saves, 1);
});

test('profile phone update saves a valid number to the authenticated seeker and leaves it unverified', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async (id) => {
    assert.equal(id, 'authenticated-seeker-id');
    return seeker;
  });
  t.mock.method(Seeker, 'findOne', async () => null);

  const res = response();
  await updateProfile({
    user: { id: seeker.id },
    body: { phone: '9876543210' },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(seeker.phone, '9876543210');
  assert.equal(res.body.seeker.phone, '9876543210');
  assert.equal(seeker.isPhoneVerified, false);
  assert.equal(seeker.saves, 1);
});

test('profile phone update rejects an invalid number before loading the seeker', async (t) => {
  let lookups = 0;
  t.mock.method(Seeker, 'findByPk', async () => {
    lookups += 1;
    return makeSeeker();
  });

  const res = response();
  await updateProfile({
    user: { id: 'authenticated-seeker-id' },
    body: { phone: '98765abc' },
  }, res);

  assert.equal(res.statusCode, 422);
  assert.match(res.body.errors.join(' '), /exactly 10 digits/);
  assert.equal(lookups, 0);
});

test('profile phone update reports duplicate numbers without changing the seeker', async (t) => {
  const seeker = makeSeeker();
  t.mock.method(Seeker, 'findByPk', async () => seeker);
  t.mock.method(Seeker, 'findOne', async () => ({ id: 'another-seeker' }));

  const res = response();
  await updateProfile({
    user: { id: seeker.id },
    body: { phone: '9876543210' },
  }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'PHONE_EXISTS');
  assert.match(res.body.message, /already exists/i);
  assert.equal(seeker.phone, null);
  assert.equal(seeker.saves, 0);
});

test('profile phone update reports a unique-index race as a duplicate', async (t) => {
  const seeker = makeSeeker();
  seeker.save = async () => {
    throw Object.assign(new Error('Duplicate phone value'), {
      name: 'SequelizeUniqueConstraintError',
      fields: { phone: '9876543210' },
    });
  };
  t.mock.method(Seeker, 'findByPk', async () => seeker);
  t.mock.method(Seeker, 'findOne', async () => null);

  const res = response();
  await updateProfile({
    user: { id: seeker.id },
    body: { phone: '9876543210' },
  }, res);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'PHONE_EXISTS');
});
