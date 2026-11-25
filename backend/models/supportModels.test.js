import assert from 'node:assert/strict';
import test from 'node:test';
import { adminDb, SupportTicket, SupportReply } from './index.js';

test('SupportTicket and SupportReply models are bound to adminDb with expected schema and associations', async () => {
  assert.equal(SupportTicket.sequelize, adminDb, 'SupportTicket must use adminDb connection');
  assert.equal(SupportReply.sequelize, adminDb, 'SupportReply must use adminDb connection');

  const ticketAttrs = SupportTicket.getAttributes();
  for (const field of [
    'id',
    'ticketNumber',
    'requesterType',
    'requesterId',
    'requesterName',
    'email',
    'phone',
    'subject',
    'description',
    'status',
    'lastReplyBy',
    'adminNotifiedAt',
    'lastRepliedAt',
    'closedAt',
    'closedByAdminId',
    'createdAt',
    'updatedAt',
  ]) {
    assert.ok(ticketAttrs[field], `SupportTicket missing attribute: ${field}`);
  }

  assert.equal(ticketAttrs.status.defaultValue, 'open');
  assert.deepEqual(ticketAttrs.requesterType.values, ['seeker', 'expert']);
  assert.deepEqual(ticketAttrs.status.values, ['open', 'closed']);
  assert.deepEqual(ticketAttrs.lastReplyBy.values, ['requester', 'admin']);

  const replyAttrs = SupportReply.getAttributes();
  for (const field of [
    'id',
    'ticketId',
    'authorType',
    'authorId',
    'authorName',
    'adminId',
    'adminName',
    'fromEmail',
    'toEmail',
    'message',
    'createdAt',
    'updatedAt',
  ]) {
    assert.ok(replyAttrs[field], `SupportReply missing attribute: ${field}`);
  }
  assert.deepEqual(replyAttrs.authorType.values, ['admin', 'seeker', 'expert']);
  assert.equal(replyAttrs.fromEmail.allowNull, true);
  assert.equal(replyAttrs.toEmail.allowNull, true);

  assert.ok(SupportTicket.associations.replies, 'SupportTicket must have replies association');
  assert.ok(SupportReply.associations.ticket, 'SupportReply must have ticket association');

  const ticket = SupportTicket.build({
    ticketNumber: 'SUP-100001',
    requesterType: 'seeker',
    requesterId: '00000000-0000-4000-8000-000000000001',
    requesterName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    subject: 'Booking & Scheduling Issue',
    description: 'Unable to reschedule my upcoming consultation slot.',
  });

  await ticket.validate();
  assert.equal(ticket.status, 'open');
});
