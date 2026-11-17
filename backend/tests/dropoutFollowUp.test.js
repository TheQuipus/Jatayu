import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { Expert, Setting } from '../models/index.js';
import { sendDropoutFollowUp } from '../controllers/adminApplicationController.js';

test('sendDropoutFollowUp - returns 404 if application not found', async (t) => {
  t.mock.method(Expert, 'findOne', async () => null);

  const req = { params: { id: 'APP-9999' }, body: {}, admin: { id: 'admin-1', fullName: 'Super Admin' } };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await sendDropoutFollowUp(req, res);
  assert.equal(statusCode, 404);
  assert.match(responseBody.message, /not found/i);
});

test('sendDropoutFollowUp - returns 400 if application is already submitted or approved', async (t) => {
  t.mock.method(Expert, 'findOne', async () => ({
    id: 'exp-1',
    status: 'pending_review',
    email: 'test@expert.com',
  }));

  const req = { params: { id: 'APP-1011' }, body: {}, admin: { id: 'admin-1', fullName: 'Super Admin' } };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await sendDropoutFollowUp(req, res);
  assert.equal(statusCode, 400);
  assert.match(responseBody.message, /already been submitted or completed/i);
});

test('sendDropoutFollowUp - returns 400 if expert has no email', async (t) => {
  t.mock.method(Expert, 'findOne', async () => ({
    id: 'exp-2',
    status: 'draft',
    email: '',
  }));

  const req = { params: { id: 'APP-1012' }, body: {}, admin: { id: 'admin-1', fullName: 'Super Admin' } };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await sendDropoutFollowUp(req, res);
  assert.equal(statusCode, 400);
  assert.match(responseBody.message, /valid email address/i);
});

test('sendDropoutFollowUp - enforces 5-minute cooldown unless force=true', async (t) => {
  const recentSent = new Date(Date.now() - 2 * 60 * 1000).toISOString(); // 2 minutes ago
  t.mock.method(Expert, 'findOne', async () => ({
    id: 'exp-3',
    status: 'draft',
    email: 'cooldown@expert.com',
    onboardingMetadata: {
      lastFollowUpSentAt: recentSent,
    },
  }));

  const req = { params: { id: 'APP-1013' }, body: { force: false }, admin: { id: 'admin-1', fullName: 'Super Admin' } };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await sendDropoutFollowUp(req, res);
  assert.equal(statusCode, 429);
  assert.match(responseBody.message, /already sent recently/i);
});

test('sendDropoutFollowUp - sends email and updates audit log on valid dropout application', async (t) => {
  const savedSettings = new Map([
    ['SMTP_HOST', 'smtp.admin.invalid'],
    ['SMTP_USER', 'admin@example.com'],
    ['SMTP_PASS', 'test-secret'],
    ['SMTP_PORT', '465'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) => savedSettings.has(key) ? { value: savedSettings.get(key) } : null);
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));

  let sentMailMessage = null;
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (mail) => {
      sentMailMessage = mail;
    },
  }));

  const expertMock = {
    id: 'exp-4',
    applicationNumber: 'APP-1014',
    status: 'draft',
    email: 'applicant@jatayu.com',
    fullName: 'Test Applicant',
    category: 'Data Science',
    skills: ['Python', 'SQL'],
    onboardingStep: 'audience',
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    onboardingMetadata: {},
    changed() {},
    save: async function () {
      return this;
    },
    toJSON() {
      return {
        ...this,
        onboardingMetadata: this.onboardingMetadata,
      };
    },
  };

  t.mock.method(Expert, 'findOne', async () => expertMock);
  t.mock.method(Expert, 'findByPk', async () => expertMock);

  const req = {
    params: { id: 'APP-1014' },
    body: {},
    admin: { id: 'admin-test', fullName: 'Jane Admin', role: 'Super Admin' },
  };
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  await sendDropoutFollowUp(req, res);
  assert.equal(statusCode, 200);
  assert.match(responseBody.message, /sent successfully/i);
  assert.ok(responseBody.lastFollowUpSentAt);

  // Verify email transport was called with correct message
  assert.ok(sentMailMessage);
  assert.equal(sentMailMessage.to, 'applicant@jatayu.com');
  assert.match(sentMailMessage.subject, /Audience & Languages/);
  assert.match(sentMailMessage.html, /Audience & Languages/);
  assert.match(sentMailMessage.html, /Resume Application/);

  // Verify audit log
  const meta = expertMock.onboardingMetadata;
  assert.ok(meta.lastFollowUpSentAt);
  assert.equal(meta.followUpCount, 1);
  assert.ok(Array.isArray(meta.sectionAuditLogs));
  const followUpLog = meta.sectionAuditLogs.find((l) => l.action === 'dropout_followup_sent');
  assert.ok(followUpLog);
  assert.equal(followUpLog.badgeLabel, 'FOLLOW-UP SENT');
  assert.equal(followUpLog.actor.name, 'Jane Admin');
  assert.match(followUpLog.note, /Audience & Languages/);
});
