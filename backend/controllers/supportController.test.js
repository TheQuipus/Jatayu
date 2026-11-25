import assert from 'node:assert/strict';
import test from 'node:test';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import {
  adminDb,
  Admin,
  Expert,
  Seeker,
  Setting,
  SupportReply,
  SupportTicket,
} from '../models/index.js';
import {
  createSupportTicket,
  getAdminSupportTicket,
  getSupportMe,
  normalizeSupportPhone,
  PREDEFINED_SUPPORT_SUBJECTS,
  replyAdminSupportTicket,
  resetSupportRateLimiter,
  validateSupportTicketInput,
} from './supportController.js';
import { getConfiguredSenderEmail } from '../utils/emailService.js';
import { generateSupportTicketNumber } from '../utils/supportTicketNumber.js';

function response() {
  return {
    statusCode: 200,
    body: null,
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

test('generateSupportTicketNumber orders numerically by length and value including SUP-9999 -> SUP-10000', async (t) => {
  const existingNumbers = [];

  t.mock.method(SupportTicket, 'findOne', async (options) => {
    assert.ok(Array.isArray(options?.order), 'findOne must specify order');
    assert.equal(options.order.length, 2, 'findOne must order by length DESC then ticketNumber DESC');
    assert.equal(options?.lock, undefined, 'findOne must not use a row lock');

    if (existingNumbers.length === 0) return null;
    const sorted = [...existingNumbers].sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return b.localeCompare(a);
    });
    return { ticketNumber: sorted[0] };
  });

  assert.equal(await generateSupportTicketNumber(), 'SUP-1000');

  existingNumbers.push('SUP-1000');
  assert.equal(await generateSupportTicketNumber(), 'SUP-1001');

  existingNumbers.push('SUP-9999');
  assert.equal(await generateSupportTicketNumber(), 'SUP-10000');

  existingNumbers.push('SUP-10000');
  assert.equal(await generateSupportTicketNumber(), 'SUP-10001');
});

test('validateSupportTicketInput normalizes phone formats (9876543210, +919876543210, +91 98765 43210, 09876543210)', () => {
  for (const phoneInput of [
    '9876543210',
    '+919876543210',
    '+91 98765 43210',
    '09876543210',
    '+91 09876543210',
  ]) {
    assert.equal(normalizeSupportPhone(phoneInput), '9876543210', `normalizeSupportPhone failed for ${phoneInput}`);
    const result = validateSupportTicketInput({
      email: 'priya@example.com',
      phone: phoneInput,
      subject: PREDEFINED_SUPPORT_SUBJECTS[0],
      description: 'Valid description.',
    });
    assert.equal(result.valid, true, `Expected ${phoneInput} to pass validation`);
    assert.equal(result.values.phone, '9876543210');
  }
});

test('validateSupportTicketInput validates predefined subjects, custom plain-text subjects (2-120 chars), and rejects HTML or invalid lengths', () => {
  const missing = validateSupportTicketInput({});
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.email);
  assert.ok(missing.errors.phone);
  assert.ok(missing.errors.subject);
  assert.ok(missing.errors.description);

  // Valid custom subject
  const validCustom = validateSupportTicketInput({
    email: 'Priya@Example.com',
    phone: '+91 98765 43210',
    subject: '  Invoice GST number mismatch  ',
    description: 'Need GST invoice updated.',
  });
  assert.equal(validCustom.valid, true);
  assert.equal(validCustom.values.subject, 'Invoice GST number mismatch');

  // Custom subject too short (< 2 chars)
  const shortSubject = validateSupportTicketInput({
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'A',
    description: 'Valid description',
  });
  assert.equal(shortSubject.valid, false);
  assert.match(shortSubject.errors.subject, /between 2 and 120/i);

  // Custom subject too long (> 120 chars)
  const longSubject = validateSupportTicketInput({
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'S'.repeat(121),
    description: 'Valid description',
  });
  assert.equal(longSubject.valid, false);
  assert.match(longSubject.errors.subject, /between 2 and 120/i);

  // HTML in custom subject rejected
  const htmlSubject = validateSupportTicketInput({
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'Billing <script>alert(1)</script> issue',
    description: 'Valid description',
  });
  assert.equal(htmlSubject.valid, false);
  assert.match(htmlSubject.errors.subject, /plain text only/i);

  // Description > 160 chars rejected
  const longDesc = validateSupportTicketInput({
    email: 'priya@example.com',
    phone: '9876543210',
    subject: PREDEFINED_SUPPORT_SUBJECTS[0],
    description: 'd'.repeat(161),
  });
  assert.equal(longDesc.valid, false);
  assert.match(longDesc.errors.description, /1 and 160/i);
});

test('createSupportTicket commits and escapes HTML when admin email succeeds, and rolls back when email fails', async (t) => {
  resetSupportRateLimiter();

  t.mock.method(Seeker, 'findByPk', async () => ({
    id: 'seeker-1',
    fullName: 'Priya <script>alert(1)</script>',
    email: 'priya@example.com',
    phone: '09876543210',
    status: 'active',
    onboardingMetadata: {},
  }));

  const settings = new Map([
    ['EMAIL_ENABLED', 'true'],
    ['SMTP_HOST', 'smtp.example.com'],
    ['SMTP_PORT', '465'],
    ['SMTP_SECURE', 'true'],
    ['SMTP_USER', 'smtp-sender@example.com'],
    ['SMTP_PASS', 'secret-pass'],
    ['FROM_EMAIL', 'support@jatayuconnect.in'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) => (settings.has(key) ? { value: settings.get(key) } : null));
  t.mock.method(Admin, 'findOne', async () => ({
    id: 'admin-1',
    email: 'admin@thequipus.com',
    fullName: 'Quipus Admin',
  }));
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));

  const committedTickets = [];
  t.mock.method(adminDb, 'transaction', async (callback) => {
    const staged = [];
    const tx = { LOCK: { UPDATE: 'UPDATE' }, staged };
    const result = await callback(tx);
    committedTickets.push(...staged);
    return result;
  });

  t.mock.method(SupportTicket, 'findOne', async () =>
    committedTickets.length ? { ticketNumber: committedTickets.at(-1).ticketNumber } : null,
  );
  t.mock.method(SupportTicket, 'create', async (data, options) => {
    assert.ok(options?.transaction, 'SupportTicket.create must run inside adminDb transaction');
    const row = {
      id: `ticket-${options.transaction.staged.length + 1}`,
      ...data,
      createdAt: new Date('2026-11-22T00:00:00.000Z'),
      updatedAt: new Date('2026-11-22T00:00:00.000Z'),
      toJSON() {
        return { ...this };
      },
    };
    options.transaction.staged.push(row);
    return row;
  });

  let shouldFailEmail = false;
  const sentEmails = [];
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (mail) => {
      if (shouldFailEmail) {
        throw new Error('SMTP connection refused');
      }
      sentEmails.push(mail);
    },
  }));

  // 1. Successful ticket creation + email delivery commits transaction
  const okRes = response();
  await createSupportTicket(
    {
      user: { id: 'seeker-1', role: 'seeker' },
      body: {
        email: 'priya@example.com',
        phone: '09876543210',
        subject: 'Custom Billing & "Tax" Enquiry',
        description: 'Button <img src=x onerror=alert(1)> not working',
      },
    },
    okRes,
  );

  assert.equal(okRes.statusCode, 201);
  assert.equal(committedTickets.length, 1);
  assert.equal(committedTickets[0].ticketNumber, 'SUP-1000');
  assert.equal(committedTickets[0].phone, '9876543210');
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'admin@thequipus.com');
  assert.equal(sentEmails[0].from, '"Jatayu" <support@jatayuconnect.in>');
  assert.ok(!sentEmails[0].html.includes('<script>'), 'Requester name HTML must be escaped');
  assert.ok(!sentEmails[0].html.includes('<img src=x'), 'Issue description HTML must be escaped');
  assert.ok(sentEmails[0].html.includes('Custom Billing &amp; &quot;Tax&quot; Enquiry'), 'Subject must be HTML-escaped in email');
  assert.ok(sentEmails[0].html.includes('&lt;img src=x onerror=alert(1)&gt;'));

  // 2. Failed email rolls back transaction so no ticket is committed
  shouldFailEmail = true;
  const failRes = response();
  await createSupportTicket(
    {
      user: { id: 'seeker-1', role: 'seeker' },
      body: {
        email: 'priya@example.com',
        phone: '9876543210',
        subject: 'Technical Bug',
        description: 'Second attempt when SMTP is down',
      },
    },
    failRes,
  );

  assert.equal(failRes.statusCode, 502);
  assert.equal(failRes.body.message, 'Something went wrong, please raise the ticket again.');
  assert.equal(committedTickets.length, 1, 'Failed email must roll back and not leave a second ticket in DB');
});

test('createSupportTicket uses authenticated account email/phone and only falls back to body when account field is missing', async (t) => {
  resetSupportRateLimiter();

  let accountRecord = {
    id: 'seeker-enforce-1',
    fullName: 'Priya Sharma',
    email: 'account-email@example.com',
    phone: '+91 98765 43210',
    status: 'active',
    onboardingMetadata: {},
  };
  t.mock.method(Seeker, 'findByPk', async () => accountRecord);

  const settings = new Map([
    ['EMAIL_ENABLED', 'true'],
    ['SMTP_HOST', 'smtp.example.com'],
    ['SMTP_PORT', '465'],
    ['SMTP_SECURE', 'true'],
    ['SMTP_USER', 'smtp-sender@example.com'],
    ['SMTP_PASS', 'secret-pass'],
    ['FROM_EMAIL', 'support@jatayuconnect.in'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) => (settings.has(key) ? { value: settings.get(key) } : null));
  t.mock.method(Admin, 'findOne', async () => ({
    id: 'admin-1',
    email: 'admin@thequipus.com',
    fullName: 'Quipus Admin',
  }));
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => {} }));
  t.mock.method(SupportTicket, 'findOne', async () => null);
  t.mock.method(adminDb, 'transaction', async (callback) => callback({ id: 'tx-enforce' }));

  const createdPayloads = [];
  t.mock.method(SupportTicket, 'create', async (data) => {
    createdPayloads.push(data);
    return {
      id: `ticket-${createdPayloads.length}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON() {
        return { ...this };
      },
    };
  });

  // 1. Spoofed body email/phone must be ignored when account has both
  const res1 = response();
  await createSupportTicket(
    {
      user: { id: 'seeker-enforce-1', role: 'seeker' },
      body: {
        email: 'spoofed@evil.com',
        phone: '1111111111',
        subject: 'Technical Bug',
        description: 'Testing account email/phone enforcement',
      },
    },
    res1,
  );
  assert.equal(res1.statusCode, 201);
  assert.equal(createdPayloads[0].email, 'account-email@example.com');
  assert.equal(createdPayloads[0].phone, '9876543210');

  // 2. Missing phone on account falls back to validated body phone while still enforcing account email
  accountRecord = { ...accountRecord, phone: '' };
  const res2 = response();
  await createSupportTicket(
    {
      user: { id: 'seeker-enforce-1', role: 'seeker' },
      body: {
        email: 'spoofed@evil.com',
        phone: '+91 91234 56789',
        subject: 'Technical Bug',
        description: 'Testing missing phone fallback',
      },
    },
    res2,
  );
  assert.equal(res2.statusCode, 201);
  assert.equal(createdPayloads[1].email, 'account-email@example.com');
  assert.equal(createdPayloads[1].phone, '9123456789');
});

test('createSupportTicket retries up to 5 times on SequelizeUniqueConstraintError for ticketNumber inside the same transaction', async (t) => {
  resetSupportRateLimiter();

  t.mock.method(Seeker, 'findByPk', async () => ({
    id: 'seeker-retry',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    status: 'active',
    onboardingMetadata: {},
  }));

  const settings = new Map([
    ['EMAIL_ENABLED', 'true'],
    ['SMTP_HOST', 'smtp.example.com'],
    ['SMTP_PORT', '465'],
    ['SMTP_SECURE', 'true'],
    ['SMTP_USER', 'smtp-sender@example.com'],
    ['SMTP_PASS', 'secret-pass'],
    ['FROM_EMAIL', 'support@jatayuconnect.in'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) => (settings.has(key) ? { value: settings.get(key) } : null));
  t.mock.method(Admin, 'findOne', async () => ({
    id: 'admin-1',
    email: 'admin@thequipus.com',
    fullName: 'Quipus Admin',
  }));
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));

  const sentEmails = [];
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (mail) => sentEmails.push(mail),
  }));

  let latestSeenNumber = 'SUP-1000';
  t.mock.method(SupportTicket, 'findOne', async () => ({ ticketNumber: latestSeenNumber }));

  let createAttempts = 0;
  let activeTransaction = null;
  t.mock.method(adminDb, 'transaction', async (callback) => {
    activeTransaction = { id: 'tx-retry-1' };
    return callback(activeTransaction);
  });

  t.mock.method(SupportTicket, 'create', async (data, options) => {
    assert.equal(options?.transaction, activeTransaction, 'All retries must use the same transaction');
    createAttempts += 1;
    if (createAttempts < 3) {
      // Simulate another concurrent transaction having just taken this ticket number
      latestSeenNumber = data.ticketNumber;
      const err = new Error('Duplicate entry for key support_tickets_ticket_number_unique');
      err.name = 'SequelizeUniqueConstraintError';
      throw err;
    }
    return {
      id: 'ticket-after-retry',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON() {
        return { ...this };
      },
    };
  });

  const res = response();
  await createSupportTicket(
    {
      user: { id: 'seeker-retry', role: 'seeker' },
      body: {
        email: 'priya@example.com',
        phone: '9876543210',
        subject: 'Technical Bug',
        description: 'Testing duplicate ticketNumber retry',
      },
    },
    res,
  );

  assert.equal(res.statusCode, 201);
  assert.equal(createAttempts, 3);
  assert.equal(res.body.ticket.ticketNumber, 'SUP-1003');
  assert.equal(sentEmails.length, 1, 'Email must be sent only once after successful insert');
});

test('createSupportTicket enforces rate limiting per requester', async (t) => {
  resetSupportRateLimiter();

  t.mock.method(Expert, 'findByPk', async () => ({
    id: 'expert-rate-1',
    fullName: 'Dr. Expert',
    email: 'expert@example.com',
    phone: '9123456789',
    status: 'approved',
  }));
  t.mock.method(adminDb, 'transaction', async () => ({
    id: 'ticket-1',
    ticketNumber: 'SUP-1000',
    requesterType: 'expert',
    requesterId: 'expert-rate-1',
    requesterName: 'Dr. Expert',
    email: 'expert@example.com',
    phone: '9123456789',
    subject: 'Technical Bug',
    description: 'Testing rate limiter',
    status: 'open',
  }));

  for (let i = 0; i < 5; i += 1) {
    const res = response();
    await createSupportTicket(
      {
        user: { id: 'expert-rate-1', role: 'expert' },
        body: {
          email: 'expert@example.com',
          phone: '9123456789',
          subject: 'Technical Bug',
          description: `Request #${i + 1}`,
        },
      },
      res,
    );
    assert.equal(res.statusCode, 201);
  }

  const throttledRes = response();
  await createSupportTicket(
    {
      user: { id: 'expert-rate-1', role: 'expert' },
      body: {
        email: 'expert@example.com',
        phone: '9123456789',
        subject: 'Technical Bug',
        description: 'Request #6 should be rate limited',
      },
    },
    throttledRes,
  );
  assert.equal(throttledRes.statusCode, 429);
  assert.equal(throttledRes.body.code, 'SUPPORT_RATE_LIMITED');
});

test('replyAdminSupportTicket rolls back reply and keeps ticket open if requester email fails', async (t) => {
  const settings = new Map([
    ['EMAIL_ENABLED', 'true'],
    ['SMTP_HOST', 'smtp.example.com'],
    ['SMTP_PORT', '465'],
    ['SMTP_SECURE', 'true'],
    ['SMTP_USER', 'smtp-sender@example.com'],
    ['SMTP_PASS', 'secret-pass'],
    ['FROM_EMAIL', 'support@jatayuconnect.in'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) => (settings.has(key) ? { value: settings.get(key) } : null));
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));

  let persistedStatus = 'open';
  let persistedLastReplyBy = null;
  const persistedReplies = [];

  t.mock.method(SupportTicket, 'findByPk', async (id) => ({
    id,
    ticketNumber: 'SUP-1000',
    requesterType: 'seeker',
    requesterId: 'seeker-1',
    requesterName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'Booking & Scheduling Issue',
    description: 'Need help',
    status: persistedStatus,
    lastReplyBy: persistedLastReplyBy,
    replies: persistedReplies,
    async save(saveOptions) {
      assert.ok(saveOptions?.transaction);
      saveOptions.transaction.stagedStatus = this.status;
      saveOptions.transaction.stagedLastReplyBy = this.lastReplyBy;
    },
    toJSON() {
      return { ...this };
    },
  }));

  t.mock.method(SupportReply, 'create', async (data, options) => {
    assert.ok(options?.transaction);
    const reply = { id: 'reply-1', ...data, createdAt: new Date() };
    options.transaction.stagedReplies.push(reply);
    return reply;
  });

  t.mock.method(adminDb, 'transaction', async (callback) => {
    const tx = {
      LOCK: { UPDATE: 'UPDATE' },
      stagedStatus: persistedStatus,
      stagedLastReplyBy: persistedLastReplyBy,
      stagedReplies: [],
    };
    const result = await callback(tx);
    persistedStatus = tx.stagedStatus;
    persistedLastReplyBy = tx.stagedLastReplyBy;
    persistedReplies.push(...tx.stagedReplies);
    return result;
  });

  let shouldFailEmail = true;
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async () => {
      if (shouldFailEmail) throw new Error('SMTP failure');
    },
  }));

  const failedRes = response();
  await replyAdminSupportTicket(
    {
      params: { ticketId: 'ticket-1' },
      admin: { id: 'admin-1', fullName: 'Quipus Admin' },
      body: { message: 'We have resolved your issue.' },
    },
    failedRes,
  );

  assert.equal(failedRes.statusCode, 502);
  assert.equal(persistedStatus, 'open', 'Ticket must remain open when reply email fails');
  assert.equal(persistedReplies.length, 0, 'Reply must not be persisted when reply email fails');

  shouldFailEmail = false;
  const successRes = response();
  await replyAdminSupportTicket(
    {
      params: { ticketId: 'ticket-1' },
      admin: { id: 'admin-1', fullName: 'Quipus Admin' },
      body: { message: 'We have resolved your issue.' },
    },
    successRes,
  );

  assert.equal(successRes.statusCode, 201);
  assert.equal(persistedStatus, 'open');
  assert.equal(persistedReplies.length, 1);
  assert.equal(persistedReplies[0].fromEmail, 'support@jatayuconnect.in');
  assert.equal(persistedReplies[0].toEmail, 'priya@example.com');
  assert.equal(persistedReplies[0].authorType, 'admin');

  // Multi-reply conversation: admin can reply again while ticket is open
  const secondReplyRes = response();
  await replyAdminSupportTicket(
    {
      params: { ticketId: 'ticket-1' },
      admin: { id: 'admin-1', fullName: 'Quipus Admin' },
      body: { message: 'Following up with additional details.' },
    },
    secondReplyRes,
  );
  assert.equal(secondReplyRes.statusCode, 201);
  assert.equal(persistedReplies.length, 2);
  assert.equal(secondReplyRes.body.ticket.viewerStatus.key, 'in_progress');
});

test('getConfiguredSenderEmail, getAdminSupportTicket, and replyAdminSupportTicket share exact FROM_EMAIL / SMTP_USER with null when unconfigured', async (t) => {
  const settings = new Map();
  t.mock.method(Setting, 'findByPk', async (key) => (settings.has(key) ? { value: settings.get(key) } : null));

  t.mock.method(SupportTicket, 'findByPk', async (id) => ({
    id,
    ticketNumber: 'SUP-1000',
    requesterType: 'seeker',
    requesterId: 'seeker-1',
    requesterName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'Booking & Scheduling Issue',
    description: 'Need help',
    status: 'open',
    replies: [],
    toJSON() {
      return { ...this };
    },
  }));

  // 1. Neither FROM_EMAIL nor SMTP_USER configured -> null
  assert.equal(await getConfiguredSenderEmail(), null);

  const unconfiguredDetailRes = response();
  await getAdminSupportTicket({ params: { ticketId: 'ticket-1' } }, unconfiguredDetailRes);
  assert.equal(unconfiguredDetailRes.statusCode, 200);
  assert.equal(unconfiguredDetailRes.body.supportFromEmail, null);

  const unconfiguredReplyRes = response();
  await replyAdminSupportTicket(
    {
      params: { ticketId: 'ticket-1' },
      admin: { id: 'admin-1', fullName: 'Quipus Admin' },
      body: { message: 'Attempt reply without sender address' },
    },
    unconfiguredReplyRes,
  );
  assert.equal(unconfiguredReplyRes.statusCode, 422);
  assert.equal(unconfiguredReplyRes.body.code, 'SUPPORT_SENDER_NOT_CONFIGURED');

  // 2. Only SMTP_USER configured -> falls back to SMTP_USER
  settings.set('SMTP_USER', 'smtp-only@thequipus.com');
  assert.equal(await getConfiguredSenderEmail(), 'smtp-only@thequipus.com');

  const smtpDetailRes = response();
  await getAdminSupportTicket({ params: { ticketId: 'ticket-1' } }, smtpDetailRes);
  assert.equal(smtpDetailRes.body.supportFromEmail, 'smtp-only@thequipus.com');

  // 3. FROM_EMAIL configured -> takes priority over SMTP_USER
  settings.set('FROM_EMAIL', 'support@thequipus.com');
  assert.equal(await getConfiguredSenderEmail(), 'support@thequipus.com');

  const fromDetailRes = response();
  await getAdminSupportTicket({ params: { ticketId: 'ticket-1' } }, fromDetailRes);
  assert.equal(fromDetailRes.body.supportFromEmail, 'support@thequipus.com');

  // 4. Lookup by human-readable SUP-xxxx ticketNumber also resolves via SupportTicket.findOne
  let capturedWhere = null;
  t.mock.method(SupportTicket, 'findOne', async (opts) => {
    capturedWhere = opts?.where;
    return {
      id: 'ticket-sup-1000',
      ticketNumber: 'SUP-1000',
      requesterType: 'seeker',
      requesterId: 'seeker-1',
      requesterName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543210',
      subject: 'Booking & Scheduling Issue',
      description: 'Need help',
      status: 'open',
      replies: [],
      toJSON() {
        return { ...this };
      },
    };
  });

  const byNumberRes = response();
  await getAdminSupportTicket({ params: { ticketId: 'SUP-1000' } }, byNumberRes);
  assert.equal(byNumberRes.statusCode, 200);
  assert.deepEqual(capturedWhere, { ticketNumber: 'SUP-1000' });
  assert.equal(byNumberRes.body.ticket.id, 'ticket-sup-1000');
});

test('getSupportMe returns requester profile with normalized phone and predefined categories', async (t) => {
  t.mock.method(Seeker, 'findByPk', async () => ({
    id: 'seeker-me',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '09876543210',
    status: 'active',
    onboardingMetadata: {},
  }));

  const res = response();
  await getSupportMe({ user: { id: 'seeker-me', role: 'seeker' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.email, 'priya@example.com');
  assert.equal(res.body.user.phone, '9876543210');
  assert.deepEqual(res.body.categories, PREDEFINED_SUPPORT_SUBJECTS);
});
