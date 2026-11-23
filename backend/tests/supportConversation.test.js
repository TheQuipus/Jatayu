import assert from 'node:assert/strict';
import test from 'node:test';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import {
  adminDb,
  Admin,
  Seeker,
  Setting,
  SupportReply,
  SupportTicket,
} from '../models/index.js';
import {
  closeAdminSupportTicket,
  createMySupportReply,
  listAdminSupportTickets,
  reopenAdminSupportTicket,
  replyAdminSupportTicket,
  resetSupportRateLimiter,
} from '../controllers/supportController.js';
import {
  buildViewerStatusWhere,
  deriveViewerStatus,
  isValidStatusFilter,
} from '../utils/supportStatus.js';
import { migrateSupportTicketsConversation } from '../scripts/migrateSupportTicketsConversation.js';

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

test('deriveViewerStatus covers every state and viewerRole combination', () => {
  const createdTicket = { status: 'open', lastReplyBy: null };
  assert.deepEqual(deriveViewerStatus(createdTicket, 'admin'), { key: 'new', label: 'New' });
  assert.deepEqual(deriveViewerStatus(createdTicket, 'seeker'), { key: 'in_progress', label: 'In Progress' });
  assert.deepEqual(deriveViewerStatus(createdTicket, 'expert'), { key: 'in_progress', label: 'In Progress' });

  const adminRepliedTicket = { status: 'open', lastReplyBy: 'admin' };
  assert.deepEqual(deriveViewerStatus(adminRepliedTicket, 'admin'), { key: 'in_progress', label: 'In Progress' });
  assert.deepEqual(deriveViewerStatus(adminRepliedTicket, 'seeker'), { key: 'response_received', label: 'Response Received' });
  assert.deepEqual(deriveViewerStatus(adminRepliedTicket, 'expert'), { key: 'response_received', label: 'Response Received' });

  const requesterRepliedTicket = { status: 'open', lastReplyBy: 'requester' };
  assert.deepEqual(deriveViewerStatus(requesterRepliedTicket, 'admin'), { key: 'response_received', label: 'Response Received' });
  assert.deepEqual(deriveViewerStatus(requesterRepliedTicket, 'seeker'), { key: 'in_progress', label: 'In Progress' });
  assert.deepEqual(deriveViewerStatus(requesterRepliedTicket, 'expert'), { key: 'in_progress', label: 'In Progress' });

  for (const lastReplyBy of [null, 'admin', 'requester']) {
    const closedTicket = { status: 'closed', lastReplyBy };
    assert.deepEqual(deriveViewerStatus(closedTicket, 'admin'), { key: 'closed', label: 'Closed' });
    assert.deepEqual(deriveViewerStatus(closedTicket, 'seeker'), { key: 'closed', label: 'Closed' });
    assert.deepEqual(deriveViewerStatus(closedTicket, 'expert'), { key: 'closed', label: 'Closed' });
  }
});

test('buildViewerStatusWhere and isValidStatusFilter generate correct DB filters', () => {
  assert.equal(isValidStatusFilter('admin', 'new'), true);
  assert.equal(isValidStatusFilter('admin', 'response_received'), true);
  assert.equal(isValidStatusFilter('requester', 'new'), false);
  assert.equal(isValidStatusFilter('requester', 'in_progress'), true);

  assert.deepEqual(buildViewerStatusWhere('admin', 'new'), { status: 'open', lastReplyBy: null });
  assert.deepEqual(buildViewerStatusWhere('admin', 'in_progress'), { status: 'open', lastReplyBy: 'admin' });
  assert.deepEqual(buildViewerStatusWhere('admin', 'response_received'), { status: 'open', lastReplyBy: 'requester' });
  assert.deepEqual(buildViewerStatusWhere('admin', 'closed'), { status: 'closed' });

  assert.deepEqual(buildViewerStatusWhere('requester', 'in_progress'), {
    status: 'open',
    [Op.or]: [{ lastReplyBy: null }, { lastReplyBy: 'requester' }],
  });
  assert.deepEqual(buildViewerStatusWhere('requester', 'response_received'), {
    status: 'open',
    lastReplyBy: 'admin',
  });
});

test('createMySupportReply: own ticket ok, other user 404, closed 409, email failure rolls back', async (t) => {
  resetSupportRateLimiter();

  const mockSeeker = {
    id: 'seeker-1',
    role: 'seeker',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    status: 'active',
  };
  t.mock.method(Seeker, 'findByPk', async () => mockSeeker);
  t.mock.method(Admin, 'findOne', async () => ({ email: 'admin@thequipus.com', fullName: 'Platform Admin' }));

  const smtpSettings = new Map([
    ['EMAIL_ENABLED', 'true'],
    ['EMAIL_PROVIDER', 'smtp'],
    ['SMTP_HOST', '192.0.2.1'],
    ['SMTP_PORT', '465'],
    ['SMTP_USER', 'support@jatayuconnect.in'],
    ['SMTP_PASS', 'secret'],
    ['SMTP_SECURE', 'true'],
    ['FROM_EMAIL', 'support@jatayuconnect.in'],
    ['EMAIL_FROM_NAME', 'Jatayu Support'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) =>
    smtpSettings.has(key) ? { value: smtpSettings.get(key) } : null,
  );

  const ticketState = {
    id: 'ticket-1',
    ticketNumber: 'SUP-1001',
    requesterType: 'seeker',
    requesterId: 'seeker-1',
    requesterName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'Payment, Wallet & Refunds',
    description: 'Initial issue',
    status: 'open',
    lastReplyBy: 'admin',
    lastRepliedAt: null,
    closedAt: null,
    createdAt: new Date('2026-11-20T10:00:00Z'),
  };
  const persistedReplies = [];

  t.mock.method(adminDb, 'transaction', async (callback) => {
    const snapshot = { ...ticketState };
    const replyCountBefore = persistedReplies.length;
    try {
      return await callback({ LOCK: { UPDATE: 'UPDATE' } });
    } catch (err) {
      Object.assign(ticketState, snapshot);
      persistedReplies.length = replyCountBefore;
      throw err;
    }
  });

  t.mock.method(SupportTicket, 'findOne', async () => ({
    ...ticketState,
    async save() {
      ticketState.status = this.status;
      ticketState.lastReplyBy = this.lastReplyBy;
      ticketState.lastRepliedAt = this.lastRepliedAt;
    },
  }));

  t.mock.method(SupportTicket, 'findByPk', async () => ({
    ...ticketState,
    replies: [...persistedReplies],
  }));

  t.mock.method(SupportReply, 'create', async (payload) => {
    const row = { id: `rep-${persistedReplies.length + 1}`, ...payload, createdAt: new Date() };
    persistedReplies.push(row);
    return row;
  });

  // 1. Email failure rolls back reply and keeps lastReplyBy = 'admin'
  let shouldFailEmail = true;
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async () => {
      if (shouldFailEmail) throw new Error('SMTP down');
    },
  }));

  const failRes = mockRes();
  await createMySupportReply(
    {
      user: { id: 'seeker-1', role: 'seeker' },
      params: { ticketId: 'SUP-1001' },
      body: { message: 'Here is my screenshot info.' },
    },
    failRes,
  );
  assert.equal(failRes.statusCode, 502);
  assert.equal(persistedReplies.length, 0);
  assert.equal(ticketState.lastReplyBy, 'admin');

  // 2. Successful requester reply
  shouldFailEmail = false;
  const okRes = mockRes();
  await createMySupportReply(
    {
      user: { id: 'seeker-1', role: 'seeker' },
      params: { ticketId: 'SUP-1001' },
      body: { message: 'Here is my follow-up reply.' },
    },
    okRes,
  );
  assert.equal(okRes.statusCode, 201);
  assert.equal(persistedReplies.length, 1);
  assert.equal(persistedReplies[0].authorType, 'seeker');
  assert.equal(persistedReplies[0].authorId, 'seeker-1');
  assert.equal(ticketState.lastReplyBy, 'requester');
  assert.deepEqual(okRes.body.ticket.viewerStatus, { key: 'in_progress', label: 'In Progress' });

  // 3. Closed ticket returns 409 SUPPORT_TICKET_CLOSED
  ticketState.status = 'closed';
  const closedRes = mockRes();
  await createMySupportReply(
    {
      user: { id: 'seeker-1', role: 'seeker' },
      params: { ticketId: 'SUP-1001' },
      body: { message: 'Trying to reply while closed.' },
    },
    closedRes,
  );
  assert.equal(closedRes.statusCode, 409);
  assert.equal(closedRes.body.code, 'SUPPORT_TICKET_CLOSED');

  // 4. Other user's ticket returns 404
  t.mock.method(Seeker, 'findByPk', async () => ({ ...mockSeeker, id: 'seeker-999' }));
  const otherRes = mockRes();
  await createMySupportReply(
    {
      user: { id: 'seeker-999', role: 'seeker' },
      params: { ticketId: 'SUP-1001' },
      body: { message: 'Cross-tenant attempt.' },
    },
    otherRes,
  );
  assert.equal(otherRes.statusCode, 404);
});

test('Admin close, reopen, and reply-while-closed enforce state transitions', async (t) => {
  const ticketState = {
    id: 'ticket-2',
    ticketNumber: 'SUP-2001',
    requesterType: 'expert',
    requesterId: 'expert-1',
    requesterName: 'Dr. Expert',
    email: 'expert@example.com',
    phone: '9876543210',
    subject: 'Technical Bug',
    description: 'Video froze',
    status: 'open',
    lastReplyBy: 'admin',
    lastRepliedAt: new Date('2026-11-20T10:00:00Z'),
    closedAt: null,
    closedByAdminId: null,
    createdAt: new Date('2026-11-20T09:00:00Z'),
  };

  t.mock.method(Setting, 'findByPk', async (key) =>
    key === 'FROM_EMAIL' ? { value: 'support@jatayuconnect.in' } : null,
  );

  t.mock.method(adminDb, 'transaction', async (callback) =>
    callback({ LOCK: { UPDATE: 'UPDATE' } }),
  );

  t.mock.method(SupportTicket, 'findOne', async () => ({
    ...ticketState,
    async save() {
      ticketState.status = this.status;
      ticketState.lastReplyBy = this.lastReplyBy;
      ticketState.closedAt = this.closedAt;
      ticketState.closedByAdminId = this.closedByAdminId;
    },
  }));

  t.mock.method(SupportTicket, 'findByPk', async () => ({
    ...ticketState,
    replies: [],
  }));

  // 1. Reopen before closed -> 409 SUPPORT_TICKET_NOT_CLOSED
  const prematureReopen = mockRes();
  await reopenAdminSupportTicket(
    { params: { ticketId: 'SUP-2001' }, admin: { id: 'admin-1' } },
    prematureReopen,
  );
  assert.equal(prematureReopen.statusCode, 409);
  assert.equal(prematureReopen.body.code, 'SUPPORT_TICKET_NOT_CLOSED');

  // 2. Close open ticket -> 200
  const closeRes = mockRes();
  await closeAdminSupportTicket(
    { params: { ticketId: 'SUP-2001' }, admin: { id: 'admin-1' } },
    closeRes,
  );
  assert.equal(closeRes.statusCode, 200);
  assert.equal(ticketState.status, 'closed');
  assert.equal(ticketState.closedByAdminId, 'admin-1');
  assert.ok(ticketState.closedAt);
  assert.deepEqual(closeRes.body.ticket.viewerStatus, { key: 'closed', label: 'Closed' });

  // 3. Close already closed -> 409 SUPPORT_TICKET_ALREADY_CLOSED
  const doubleCloseRes = mockRes();
  await closeAdminSupportTicket(
    { params: { ticketId: 'SUP-2001' }, admin: { id: 'admin-1' } },
    doubleCloseRes,
  );
  assert.equal(doubleCloseRes.statusCode, 409);
  assert.equal(doubleCloseRes.body.code, 'SUPPORT_TICKET_ALREADY_CLOSED');

  // 4. Admin reply while closed -> 409 SUPPORT_TICKET_CLOSED
  const replyWhileClosed = mockRes();
  await replyAdminSupportTicket(
    {
      params: { ticketId: 'SUP-2001' },
      admin: { id: 'admin-1', fullName: 'Platform Admin' },
      body: { message: 'Should fail while closed' },
    },
    replyWhileClosed,
  );
  assert.equal(replyWhileClosed.statusCode, 409);
  assert.equal(replyWhileClosed.body.code, 'SUPPORT_TICKET_CLOSED');

  // 5. Reopen closed ticket -> resets to New for admin (status='open', lastReplyBy=null)
  const reopenRes = mockRes();
  await reopenAdminSupportTicket(
    { params: { ticketId: 'SUP-2001' }, admin: { id: 'admin-1' } },
    reopenRes,
  );
  assert.equal(reopenRes.statusCode, 200);
  assert.equal(ticketState.status, 'open');
  assert.equal(ticketState.lastReplyBy, null);
  assert.equal(ticketState.closedAt, null);
  assert.equal(ticketState.closedByAdminId, null);
  assert.deepEqual(reopenRes.body.ticket.viewerStatus, { key: 'new', label: 'New' });
});

test('listAdminSupportTickets returns viewerStatus counts, needsAttention, and filters in DB', async (t) => {
  let capturedWhere = null;
  t.mock.method(SupportTicket, 'findAndCountAll', async ({ where }) => {
    capturedWhere = where;
    return {
      count: 1,
      rows: [
        {
          id: 't-1',
          ticketNumber: 'SUP-3001',
          requesterType: 'seeker',
          requesterId: 's-1',
          requesterName: 'Test User',
          email: 't@example.com',
          phone: '9876543210',
          subject: 'Other',
          description: 'Need help',
          status: 'open',
          lastReplyBy: 'requester',
          createdAt: new Date(),
          updatedAt: new Date(),
          toJSON() {
            return { ...this };
          },
        },
      ],
    };
  });

  t.mock.method(SupportTicket, 'count', async ({ where }) => {
    if (where.status === 'closed') return 2;
    if (where.lastReplyBy === null) return 3;
    if (where.lastReplyBy === 'admin') return 4;
    if (where.lastReplyBy === 'requester') return 1;
    return 0;
  });

  const res = mockRes();
  await listAdminSupportTickets(
    { query: { status: 'response_received', page: '1', limit: '25' } },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedWhere, { status: 'open', lastReplyBy: 'requester' });
  assert.deepEqual(res.body.counts, {
    all: 10,
    new: 3,
    in_progress: 4,
    response_received: 1,
    closed: 2,
    needsAttention: 4,
    open: 8,
    replied: 4,
  });
  assert.deepEqual(res.body.items[0].viewerStatus, {
    key: 'response_received',
    label: 'Response Received',
  });
});

test('migrateSupportTicketsConversation executes idempotent backfill & enum transition SQL', async () => {
  const executedQueries = [];
  const addedColumns = [];
  const changedColumns = [];

  const mockQueryInterface = {
    async describeTable(tableName) {
      if (tableName === 'SupportTickets') {
        return {
          status: { type: "ENUM('open','replied')" },
        };
      }
      return {
        fromEmail: { allowNull: false },
        toEmail: { allowNull: false },
      };
    },
    async addColumn(table, column) {
      addedColumns.push(`${table}.${column}`);
    },
    async changeColumn(table, column) {
      changedColumns.push(`${table}.${column}`);
    },
    async showIndex() {
      return [];
    },
    async addIndex() {},
  };

  const mockDb = {
    getQueryInterface: () => mockQueryInterface,
    getDialect: () => 'mysql',
    async query(sql) {
      executedQueries.push(sql);
      if (/SELECT COUNT/i.test(sql)) {
        return [[{ cnt: 0 }]];
      }
      return [[]];
    },
  };

  await migrateSupportTicketsConversation(mockDb);

  assert.ok(addedColumns.includes('SupportTickets.lastReplyBy'));
  assert.ok(addedColumns.includes('SupportTickets.closedAt'));
  assert.ok(addedColumns.includes('SupportTickets.closedByAdminId'));
  assert.ok(addedColumns.includes('SupportReplies.authorType'));
  assert.ok(addedColumns.includes('SupportReplies.authorId'));
  assert.ok(addedColumns.includes('SupportReplies.authorName'));
  assert.ok(changedColumns.includes('SupportReplies.fromEmail'));
  assert.ok(changedColumns.includes('SupportReplies.toEmail'));

  assert.ok(
    executedQueries.some((q) => q.includes("ENUM('open', 'replied', 'closed')")),
    'Must extend ENUM before backfill',
  );
  assert.ok(
    executedQueries.some((q) => q.includes("SET `status` = 'open', `lastReplyBy` = COALESCE(`lastReplyBy`, 'admin') WHERE `status` = 'replied'")),
    'Must backfill replied tickets to open + lastReplyBy=admin',
  );
  assert.ok(
    executedQueries.some((q) => q.includes("ENUM('open', 'closed')")),
    'Must narrow ENUM after backfill',
  );
  assert.ok(
    executedQueries.some((q) => q.includes("UPDATE SupportReplies SET authorType = COALESCE(authorType, 'admin')")),
    'Must backfill SupportReplies author fields',
  );
});
