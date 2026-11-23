import assert from 'node:assert/strict';
import test from 'node:test';
import { Seeker, Expert, SupportTicket } from '../models/index.js';
import {
  listMySupportTickets,
  getMySupportTicketDetail,
} from '../controllers/supportController.js';

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

test('listMySupportTickets returns caller tickets with safe fields, counts, and pagination', async (t) => {
  const mockSeeker = {
    id: 'seeker-101',
    role: 'seeker',
    fullName: 'Test Seeker',
    email: 'seeker@example.com',
    phone: '9876543210',
    status: 'active',
  };

  t.mock.method(Seeker, 'findByPk', async () => mockSeeker);

  const mockTickets = [
    {
      id: 'st-1',
      ticketNumber: 'SUP-1001',
      requesterType: 'seeker',
      requesterId: 'seeker-101',
      requesterName: 'Test Seeker',
      email: 'seeker@example.com',
      phone: '9876543210',
      subject: 'Billing Issue',
      description: 'Need help with payment',
      status: 'open',
      adminNotifiedAt: new Date().toISOString(),
      lastRepliedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
      toJSON() {
        return { ...this };
      },
    },
    {
      id: 'st-2',
      ticketNumber: 'SUP-1002',
      requesterType: 'seeker',
      requesterId: 'seeker-101',
      requesterName: 'Test Seeker',
      email: 'seeker@example.com',
      phone: '9876543210',
      subject: 'Account Question',
      description: 'How to update profile',
      status: 'open',
      lastReplyBy: 'admin',
      adminNotifiedAt: new Date().toISOString(),
      lastRepliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [{ id: 'reply-1' }],
      toJSON() {
        return { ...this };
      },
    },
  ];

  t.mock.method(SupportTicket, 'count', async ({ where }) => {
    if (where.status === 'closed') return 0;
    if (where.status === 'open' && where.lastReplyBy === 'admin') return 1;
    if (where.status === 'open') return 2;
    return 2;
  });

  t.mock.method(SupportTicket, 'findAndCountAll', async () => ({
    count: 2,
    rows: mockTickets,
  }));

  const req = {
    user: { id: 'seeker-101', role: 'seeker' },
    query: { page: '1', limit: '10' },
  };
  const res = mockRes();

  await listMySupportTickets(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.items.length, 2);
  assert.deepEqual(res.body.counts, {
    all: 2,
    in_progress: 2,
    response_received: 1,
    closed: 0,
    open: 2,
    replied: 1,
  });
  assert.deepEqual(res.body.pagination, { page: 1, limit: 10, total: 2, totalPages: 1 });

  // Safe fields check: NO adminId, fromEmail, toEmail, phone, adminNotifiedAt
  const item = res.body.items[0];
  assert.equal(item.id, 'st-1');
  assert.equal(item.ticketNumber, 'SUP-1001');
  assert.equal(item.subject, 'Billing Issue');
  assert.equal(item.description, 'Need help with payment');
  assert.equal(item.status, 'open');
  assert.deepEqual(item.viewerStatus, { key: 'in_progress', label: 'In Progress' });
  assert.equal(item.statusLabel, 'In Progress');
  assert.equal(item.replyCount, 0);
  assert.equal(item.phone, undefined, 'Phone must not be exposed');
  assert.equal(item.email, undefined, 'Email must not be exposed in user list');
  assert.equal(item.adminId, undefined, 'adminId must not be exposed');
  assert.equal(item.fromEmail, undefined, 'fromEmail must not be exposed');
  assert.equal(item.toEmail, undefined, 'toEmail must not be exposed');
  assert.equal(item.adminNotifiedAt, undefined, 'adminNotifiedAt must not be exposed');
});

test('getMySupportTicketDetail returns caller ticket with sanitized replies', async (t) => {
  const mockSeeker = {
    id: 'seeker-101',
    role: 'seeker',
    fullName: 'Test Seeker',
    email: 'seeker@example.com',
    phone: '9876543210',
    status: 'active',
  };

  t.mock.method(Seeker, 'findByPk', async () => mockSeeker);

  const mockTicket = {
    id: 'st-1',
    ticketNumber: 'SUP-1001',
    requesterType: 'seeker',
    requesterId: 'seeker-101',
    requesterName: 'Test Seeker',
    subject: 'Billing Issue',
    description: 'Need help with payment',
    status: 'open',
    lastReplyBy: 'admin',
    createdAt: new Date().toISOString(),
    lastRepliedAt: new Date().toISOString(),
    replies: [
      {
        id: 'rep-1',
        ticketId: 'st-1',
        authorType: 'admin',
        adminId: 'admin-uuid-secret',
        adminName: 'admin@jatayu.com', // email format! Must never be exposed
        fromEmail: 'support@thequipus.com',
        toEmail: 'seeker@example.com',
        message: 'Your refund has been processed.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  t.mock.method(SupportTicket, 'findOne', async () => mockTicket);

  const req = {
    user: { id: 'seeker-101', role: 'seeker' },
    params: { ticketId: 'SUP-1001' },
  };
  const res = mockRes();

  await getMySupportTicketDetail(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ticket.id, 'st-1');
  assert.equal(res.body.ticket.ticketNumber, 'SUP-1001');
  assert.deepEqual(res.body.ticket.viewerStatus, {
    key: 'response_received',
    label: 'Response Received',
  });
  assert.equal(res.body.ticket.replies.length, 1);
  assert.equal(res.body.ticket.thread.length, 2);
  assert.equal(res.body.ticket.thread[0].isInitial, true);
  assert.equal(res.body.ticket.thread[0].message, 'Need help with payment');
  assert.equal(res.body.ticket.thread[1].isInitial, false);

  const reply = res.body.ticket.replies[0];
  assert.equal(reply.id, 'rep-1');
  assert.equal(reply.authorType, 'admin');
  assert.equal(reply.message, 'Your refund has been processed.');
  assert.equal(reply.adminName, 'Jatayu Support', 'Admin identity must be generic display name');
  assert.equal(reply.authorName, 'Jatayu Support');
  assert.equal(reply.adminId, undefined, 'adminId must not be exposed');
  assert.equal(reply.fromEmail, undefined, 'fromEmail must not be exposed');
  assert.equal(reply.toEmail, undefined, 'toEmail must not be exposed');
});

test('Cross-tenant isolation: requester reading another user ticket gets 404', async (t) => {
  const mockSeeker = {
    id: 'seeker-101',
    role: 'seeker',
    fullName: 'Seeker 1',
    email: 's1@example.com',
    status: 'active',
  };

  t.mock.method(Seeker, 'findByPk', async () => mockSeeker);

  // 1. Seeker trying to read another seeker's ticket
  const otherSeekerTicket = {
    id: 'st-other-seeker',
    ticketNumber: 'SUP-1002',
    requesterType: 'seeker',
    requesterId: 'seeker-999', // Different seeker!
    subject: 'Secret enquiry',
    replies: [],
  };

  t.mock.method(SupportTicket, 'findOne', async () => otherSeekerTicket);

  const req1 = {
    user: { id: 'seeker-101', role: 'seeker' },
    params: { ticketId: 'SUP-1002' },
  };
  const res1 = mockRes();

  await getMySupportTicketDetail(req1, res1);

  assert.equal(res1.statusCode, 404, 'Must return 404 (not 403) to avoid leaking existence');
  assert.match(res1.body.message, /not found/i);

  // 2. Seeker trying to read an expert's ticket
  const expertTicket = {
    id: 'st-expert',
    ticketNumber: 'SUP-2001',
    requesterType: 'expert', // Different role!
    requesterId: 'expert-101',
    subject: 'Expert question',
    replies: [],
  };

  t.mock.method(SupportTicket, 'findOne', async () => expertTicket);

  const req2 = {
    user: { id: 'seeker-101', role: 'seeker' },
    params: { ticketId: 'SUP-2001' },
  };
  const res2 = mockRes();

  await getMySupportTicketDetail(req2, res2);

  assert.equal(res2.statusCode, 404, 'Must return 404 when seeker attempts to read expert ticket');

  // 3. Expert trying to read a seeker's ticket
  const mockExpert = {
    id: 'expert-555',
    role: 'expert',
    fullName: 'Dr. Expert',
    email: 'expert@example.com',
    status: 'approved',
  };

  t.mock.method(Expert, 'findByPk', async () => mockExpert);

  const seekerTicket = {
    id: 'st-seeker',
    ticketNumber: 'SUP-3001',
    requesterType: 'seeker', // Seeker ticket!
    requesterId: 'seeker-101',
    subject: 'Seeker issue',
    replies: [],
  };

  t.mock.method(SupportTicket, 'findOne', async () => seekerTicket);

  const req3 = {
    user: { id: 'expert-555', role: 'expert' },
    params: { ticketId: 'SUP-3001' },
  };
  const res3 = mockRes();

  await getMySupportTicketDetail(req3, res3);

  assert.equal(res3.statusCode, 404, 'Must return 404 when expert attempts to read seeker ticket');
});
