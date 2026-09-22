import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Booking, BookingReview, Seeker, SeekerCreditTransaction, Notification, seekerDb } from '../models/index.js';
import { submitReview, getBookingReview, replyToReview } from './reviewController.js';

const req = { user: { id: 'owner' }, params: { bookingId: 'booking', reviewId: 'review' }, body: { rating: 5, comment: 'Helpful' } };
const res = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
test('reject invalid ratings and long comments before accessing storage', async () => {
  for (const rating of [0, 6, 1.5, '5', null]) await assert.rejects(submitReview({ ...req, body: { rating } }, res()), { status: 422 });
  await assert.rejects(submitReview({ ...req, body: { rating: 5, comment: 'a'.repeat(5001) } }, res()), { status: 422 });
});
test('review requires ownership, completion, and a unique booking; exact retries succeed', async () => {
  mock.method(seekerDb, 'transaction', async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } }));
  let booking = null;
  mock.method(Booking, 'findOne', async (options) => {
    assert.equal(options.where.seekerId, 'owner');
    assert.equal(options.lock, 'UPDATE');
    return booking;
  });
  await assert.rejects(submitReview(req, res()), { status: 404 });
  booking = { id: 'booking', status: 'confirmed' };
  await assert.rejects(submitReview(req, res()), { status: 409 });
  booking.status = 'completed';
  mock.method(BookingReview, 'findOne', async () => ({ rating: 5, comment: 'Helpful' }));
  const response = res(); await submitReview(req, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.creditsAwarded, 0);
  await assert.rejects(submitReview({ ...req, body: { rating: 4 } }, res()), { status: 409 });
  mock.restoreAll();
});
test('a new review credits 15 once and uses the same transaction for balance and ledger', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  let savedReview = null;
  let balance = 25;
  let entries = 0;
  mock.method(seekerDb, 'transaction', async (fn) => fn(transaction));
  mock.method(Booking, 'findOne', async () => ({ id: 'booking', seekerId: 'owner', expertId: 'expert', status: 'completed' }));
  mock.method(BookingReview, 'findOne', async () => savedReview);
  mock.method(BookingReview, 'create', async (data, options) => { assert.equal(options.transaction, transaction); savedReview = { id: 'review', ...data }; return savedReview; });
  mock.method(Seeker, 'findByPk', async (id, options) => {
    assert.equal(id, 'owner'); assert.equal(options.lock, 'UPDATE');
    return { id, credits: balance, update: async (data, options) => { assert.equal(options.transaction, transaction); balance = data.credits; } };
  });
  mock.method(SeekerCreditTransaction, 'create', async (data, options) => {
    assert.equal(options.transaction, transaction); assert.equal(data.amount, 15);
    assert.equal(data.balanceAfter, 40); assert.equal(data.reference, 'booking');
    assert.equal(data.source, 'booking_review'); entries++;
  });
  mock.method(Notification, 'findOrCreate', async () => [{ toJSON: () => ({}) }, false]);
  try {
    const first = res(); await submitReview(req, first);
    assert.equal(first.body.creditsAwarded, 15); assert.equal(first.body.creditBalance, 40);
    const retry = res(); await submitReview(req, retry);
    assert.equal(retry.body.creditsAwarded, 0); assert.equal(balance, 40); assert.equal(entries, 1);
  } finally { mock.restoreAll(); }
});
test('reading and replying cannot access another user records', async () => {
  mock.method(Booking, 'findOne', async ({ where }) => { assert.equal(where.seekerId, 'owner'); return null; });
  await assert.rejects(getBookingReview(req, res()), { status: 404 });
  mock.method(BookingReview, 'findOne', async ({ where }) => { assert.equal(where.expertId, 'owner'); return null; });
  await assert.rejects(replyToReview({ ...req, body: { reply: 'Thanks' } }, res()), { status: 404 });
  await assert.rejects(replyToReview({ ...req, body: { reply: '' } }, res()), { status: 422 });
  mock.restoreAll();
});
