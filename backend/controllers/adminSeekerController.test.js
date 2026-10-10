import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Seeker, Booking, BookingReview, Notification, SeekerCreditTransaction, seekerDb } from '../models/index.js';
import * as actions from './adminSeekerController.js';

afterEach(() => mock.restoreAll());
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = (body = {}) => ({ params: { seekerId: 'seeker' }, query: {}, body, admin: { id: 'admin' } });

test('credit grants validate numeric input and the stored description length', async () => {
  mock.method(seekerDb, 'transaction', async () => { throw Error('must not access storage'); });
  for (const amount of [0, -1, 1.5, 100001, '10', true, null]) {
    const res = response(); await actions.grantAdminSeekerCredits(request({ amount }), res);
    assert.equal(res.statusCode, 422);
  }
  const res = response();
  await actions.grantAdminSeekerCredits(request({ amount: 1, description: 'a'.repeat(256) }), res);
  assert.equal(res.statusCode, 422);
});

test('credit grants lock the balance and retain the authenticated admin in the ledger', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  mock.method(seekerDb, 'transaction', async fn => fn(transaction));
  mock.method(Seeker, 'findByPk', async (id, options) => {
    assert.equal(id, 'seeker'); assert.equal(options.lock, 'UPDATE');
    assert.equal(options.transaction, transaction);
    return { id, credits: 20, status: 'active', update: async (data, options) => {
      assert.equal(data.credits, 30); assert.equal(options.transaction, transaction);
    } };
  });
  mock.method(SeekerCreditTransaction, 'create', async (data, options) => {
    assert.equal(data.metadata.adminId, 'admin'); assert.equal(data.balanceAfter, 30);
    assert.equal(data.source, 'admin_adjustment'); assert.equal(options.transaction, transaction);
    return data;
  });
  const res = response(); await actions.grantAdminSeekerCredits(request({ amount: 10 }), res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.credits, 30);
});

test('deleted seeker grants return a conflict without changing the ledger', async () => {
  mock.method(seekerDb, 'transaction', async fn => fn({ LOCK: { UPDATE: 'UPDATE' } }));
  mock.method(Seeker, 'findByPk', async () => ({ status: 'deleted' }));
  const write = mock.method(SeekerCreditTransaction, 'create', async () => assert.fail('must not write'));
  const res = response(); await actions.grantAdminSeekerCredits(request({ amount: 10 }), res);
  assert.equal(res.statusCode, 409); assert.equal(write.mock.callCount(), 0);
});

test('missing seekers return 404 before creating a credit entry', async () => {
  mock.method(seekerDb, 'transaction', async fn => fn({ LOCK: { UPDATE: 'UPDATE' } }));
  mock.method(Seeker, 'findByPk', async () => null);
  const res = response(); await actions.grantAdminSeekerCredits(request({ amount: 10 }), res);
  assert.equal(res.statusCode, 404);
});

test('detail includes history after 100 entries and preserves monetary precision', async () => {
  mock.method(Seeker, 'findByPk', async () => ({ id: 'seeker', credits: 100, toJSON: () => ({ id: 'seeker', status: 'active' }) }));
  const bookings = Array.from({ length: 101 }, (_, i) => ({ id: String(i), totalAmount: 149, paymentStatus: 'paid', status: 'completed', consultationType: 'video', scheduledStartAt: new Date('2026-01-01T10:00:00Z'), scheduledEndAt: new Date('2026-01-01T10:30:00Z') }));
  mock.method(Booking, 'findAll', async options => options.limit ? bookings.slice(0, options.limit) : bookings);
  mock.method(BookingReview, 'findAll', async () => []);
  mock.method(Notification, 'count', async () => 0);
  const credits = Array.from({ length: 101 }, () => ({ amount: 1 }));
  mock.method(SeekerCreditTransaction, 'findAll', async options => options.limit ? credits.slice(0, options.limit) : credits);
  const res = response(); await actions.getAdminSeeker(request(), res);
  assert.equal(res.body.seeker.totalBookings, 101);
  assert.equal(res.body.seeker.totalSpent, 150.49);
  assert.equal(res.body.bookings[0].amount, 1.49);
  assert.equal(res.body.credits.earned, 101);
});

test('notifications use recipient scoping and count unread entries outside the display window', async () => {
  mock.method(Seeker, 'findByPk', async () => ({ id: 'seeker' }));
  mock.method(Notification, 'findAll', async ({ where }) => {
    assert.equal(where.recipientType, 'seeker'); assert.equal(where.recipientId, 'seeker'); return [];
  });
  mock.method(Notification, 'count', async ({ where }) => {
    assert.equal(where.recipientId, 'seeker'); assert.equal(where.readAt, null); return 101;
  });
  const res = response(); await actions.listAdminSeekerNotifications(request(), res);
  assert.equal(res.body.unreadCount, 101);
});

test('route wrapper responds safely when storage fails', async () => {
  mock.method(console, 'error', () => {});
  const res = response();
  await actions.adminSeekerAction(async () => { throw Error('private database detail'); })(request(), res);
  assert.equal(res.statusCode, 500); assert.equal(res.body.message, 'Unable to process seeker request');
});
