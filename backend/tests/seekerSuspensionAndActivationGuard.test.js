import assert from 'node:assert/strict';
import test from 'node:test';
import { Seeker } from '../models/index.js';
import { isSeekerSuspended } from '../controllers/seeker/seekerAuthController.js';
import { updateAdminSeekerStatus } from '../controllers/adminSeekerController.js';

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test('isSeekerSuspended identifies direct status and metadata status', () => {
  assert.equal(isSeekerSuspended(null), false);
  assert.equal(isSeekerSuspended({ status: 'active' }), false);
  assert.equal(isSeekerSuspended({ status: 'draft' }), false);
  assert.equal(isSeekerSuspended({ status: 'suspended' }), true);
  assert.equal(isSeekerSuspended({ status: 'active', onboardingMetadata: { status: 'suspended' } }), true);
  assert.equal(isSeekerSuspended({ status: 'active', onboardingMetadata: '{"status":"suspended"}' }), true);
});

test('updateAdminSeekerStatus blocks activating an incomplete draft seeker profile with 422', async (t) => {
  const draftSeeker = {
    id: 'seeker-draft-1',
    status: 'draft',
    onboardingCompletedAt: null,
    onboardingMetadata: {},
    update: async () => {},
    save: async () => {},
  };
  t.mock.method(Seeker, 'findByPk', async () => draftSeeker);

  const req = {
    params: { seekerId: 'seeker-draft-1' },
    body: { status: 'active' },
  };
  const res = mockRes();

  await updateAdminSeekerStatus(req, res);

  assert.equal(res.statusCode, 422);
  assert.match(res.body.message, /not been fully submitted/i);
});

test('updateAdminSeekerStatus permits activating a fully submitted draft seeker profile', async (t) => {
  const completedSeeker = {
    id: 'seeker-completed-1',
    fullName: 'Submitted Seeker',
    email: 'sub@example.com',
    status: 'draft',
    onboardingCompletedAt: new Date(),
    onboardingMetadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON() {
      return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        status: this.status,
        onboardingCompletedAt: this.onboardingCompletedAt,
        onboardingMetadata: this.onboardingMetadata,
      };
    },
    save: async function () {},
  };
  t.mock.method(Seeker, 'findByPk', async () => completedSeeker);

  const req = {
    params: { seekerId: 'seeker-completed-1' },
    body: { status: 'active' },
  };
  const res = mockRes();

  await updateAdminSeekerStatus(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(completedSeeker.status, 'active');
  assert.equal(res.body.seeker.status, 'active');
});

test('updateAdminSeekerStatus suspending a seeker sets suspendedAt and updates status', async (t) => {
  const activeSeeker = {
    id: 'seeker-to-suspend',
    fullName: 'Active Seeker',
    email: 'active@example.com',
    status: 'active',
    onboardingCompletedAt: new Date(),
    onboardingMetadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON() {
      return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        status: this.status,
        onboardingCompletedAt: this.onboardingCompletedAt,
        onboardingMetadata: this.onboardingMetadata,
      };
    },
    save: async function () {},
  };
  t.mock.method(Seeker, 'findByPk', async () => activeSeeker);

  const req = {
    params: { seekerId: 'seeker-to-suspend' },
    body: { status: 'suspended' },
  };
  const res = mockRes();

  await updateAdminSeekerStatus(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(activeSeeker.status, 'suspended');
  assert.ok(activeSeeker.onboardingMetadata.suspendedAt);
});

test('updateAdminSeekerStatus activating a suspended seeker removes suspendedAt', async (t) => {
  const suspendedSeeker = {
    id: 'seeker-to-reactivate',
    fullName: 'Suspended Seeker',
    email: 'suspended@example.com',
    status: 'suspended',
    onboardingCompletedAt: new Date(),
    onboardingMetadata: { suspendedAt: new Date().toISOString() },
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON() {
      return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        status: this.status,
        onboardingCompletedAt: this.onboardingCompletedAt,
        onboardingMetadata: this.onboardingMetadata,
      };
    },
    save: async function () {},
  };
  t.mock.method(Seeker, 'findByPk', async () => suspendedSeeker);

  const req = {
    params: { seekerId: 'seeker-to-reactivate' },
    body: { status: 'active' },
  };
  const res = mockRes();

  await updateAdminSeekerStatus(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(suspendedSeeker.status, 'active');
  assert.equal(suspendedSeeker.onboardingMetadata.suspendedAt, undefined);
});
