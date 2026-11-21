import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Booking, BookingReview, Expert } from '../models/index.js';
import { getExpertDashboardStats } from '../services/expertDashboardService.js';

test('getExpertDashboardStats returns zero/default stats for an expert with no bookings or reviews', async () => {
  mock.method(Booking, 'update', async () => [0]);
  mock.method(Expert, 'findByPk', async (id) => ({ id, fullName: 'Test Expert' }));
  mock.method(Booking, 'count', async () => 0);
  mock.method(BookingReview, 'findAll', async () => []);
  mock.method(Booking, 'findAll', async () => []);

  try {
    const result = await getExpertDashboardStats('expert-1');
    assert.ok(result);
    assert.equal(Array.isArray(result.stats), true);
    assert.equal(result.stats.length, 7);

    const sessions = result.stats.find((s) => s.id === 'sessions');
    assert.equal(sessions.value, '0');
    assert.equal(sessions.delta, '0 this month');

    const rating = result.stats.find((s) => s.id === 'rating');
    assert.equal(rating.value, '0.0');
    assert.equal(rating.delta, 'No reviews');

    const clients = result.stats.find((s) => s.id === 'clients');
    assert.equal(clients.value, '0');

    const requests = result.stats.find((s) => s.id === 'requests');
    assert.equal(requests.value, '0');
    assert.equal(requests.delta, 'All clear');
    assert.equal(requests.deltaType, 'neutral');

    const weeklyHours = result.stats.find((s) => s.id === 'weekly-hours');
    assert.equal(weeklyHours.value, '0 hrs');

    const avgResponse = result.stats.find((s) => s.id === 'avg-response');
    assert.equal(avgResponse.value, 'N/A');

    const bookingRate = result.stats.find((s) => s.id === 'booking-rate');
    assert.equal(bookingRate.value, '100%');
  } finally {
    mock.restoreAll();
  }
});

test('getExpertDashboardStats throws EXPERT_NOT_FOUND if expert does not exist', async () => {
  mock.method(Booking, 'update', async () => [0]);
  mock.method(Expert, 'findByPk', async () => null);

  try {
    await assert.rejects(getExpertDashboardStats('nonexistent'), {
      message: 'EXPERT_NOT_FOUND',
    });
  } finally {
    mock.restoreAll();
  }
});

test('getExpertDashboardStats computes correct values from booking and review data', async () => {
  mock.method(Booking, 'update', async () => [0]);
  mock.method(Expert, 'findByPk', async (id) => ({ id, fullName: 'Active Expert' }));

  const now = new Date();
  const pastWeekStart = new Date(now.getTime() - 2 * 3600000);
  const pastWeekEnd = now;

  mock.method(Booking, 'count', async ({ where }) => {
    if (where.status === 'completed') return 5;
    if (where.status === 'awaiting_expert') return 2;
    return 0;
  });

  mock.method(BookingReview, 'findAll', async () => [
    { rating: 5, createdAt: new Date() },
    { rating: 4, createdAt: new Date() },
  ]);

  mock.method(Booking, 'findAll', async (options) => {
    // If checking weekly hours
    if (options.attributes && options.attributes.includes('scheduledStartAt') && options.attributes.includes('scheduledEndAt')) {
      return [
        { scheduledStartAt: pastWeekStart, scheduledEndAt: pastWeekEnd },
      ];
    }
    // If checking clientBookings
    if (options.attributes && options.attributes.includes('seekerId')) {
      return [
        { seekerId: 'seeker-1', scheduledStartAt: now, createdAt: now },
        { seekerId: 'seeker-2', scheduledStartAt: now, createdAt: now },
      ];
    }
    // If checking responded bookings
    if (options.where && options.where.expertRespondedAt) {
      return [
        {
          createdAt: new Date(now.getTime() - 25 * 60000),
          expertRequestedAt: new Date(now.getTime() - 25 * 60000),
          expertRespondedAt: now,
        },
      ];
    }
    // If checking decided bookings
    if (options.attributes && options.attributes.includes('status')) {
      return [
        { status: 'confirmed' },
        { status: 'completed' },
        { status: 'declined' },
      ];
    }
    return [];
  });

  try {
    const result = await getExpertDashboardStats('expert-active');
    assert.ok(result);

    const sessions = result.stats.find((s) => s.id === 'sessions');
    assert.equal(sessions.value, '5');

    const rating = result.stats.find((s) => s.id === 'rating');
    assert.equal(rating.value, '4.5');
    assert.equal(rating.delta, '2 reviews');

    const clients = result.stats.find((s) => s.id === 'clients');
    assert.equal(clients.value, '2');

    const requests = result.stats.find((s) => s.id === 'requests');
    assert.equal(requests.value, '2');
    assert.equal(requests.delta, 'Action needed');
    assert.equal(requests.deltaType, 'alert');

    const avgResponse = result.stats.find((s) => s.id === 'avg-response');
    assert.equal(avgResponse.value, '< 30m');

    const bookingRate = result.stats.find((s) => s.id === 'booking-rate');
    assert.equal(bookingRate.value, '67%'); // 2 accepted out of 3 decided = 67%
  } finally {
    mock.restoreAll();
  }
});
