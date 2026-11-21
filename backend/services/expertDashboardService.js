import { Op } from 'sequelize';
import { Booking, BookingReview, Expert } from '../models/index.js';
import { completeEndedBookings } from './seeker/bookingService.js';

export async function getExpertDashboardStats(expertId) {
  await completeEndedBookings();

  const expert = await Expert.findByPk(expertId, { attributes: ['id', 'fullName'] });
  if (!expert) throw new Error('EXPERT_NOT_FOUND');

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // 1. Sessions Done
  const totalCompleted = await Booking.count({
    where: { expertId, status: 'completed' },
  });
  const completedThisMonth = await Booking.count({
    where: {
      expertId,
      status: 'completed',
      scheduledEndAt: { [Op.gte]: thisMonthStart },
    },
  });
  const completedLastMonth = await Booking.count({
    where: {
      expertId,
      status: 'completed',
      scheduledEndAt: { [Op.gte]: lastMonthStart, [Op.lt]: thisMonthStart },
    },
  });
  let sessionsDelta = `${completedThisMonth} this month`;
  let sessionsDeltaType = 'neutral';
  if (completedLastMonth > 0) {
    const change = Math.round(((completedThisMonth - completedLastMonth) / completedLastMonth) * 100);
    sessionsDelta = `${change >= 0 ? '+' : ''}${change}%`;
    sessionsDeltaType = change >= 0 ? 'positive' : 'neutral';
  } else if (completedThisMonth > 0) {
    sessionsDelta = `+${completedThisMonth} this month`;
    sessionsDeltaType = 'positive';
  }

  // 2. Avg Rating & Review Count
  const reviews = await BookingReview.findAll({
    where: { expertId },
    attributes: ['rating', 'createdAt'],
  });
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 0;
  const ratingVal = avgRating > 0 ? avgRating.toFixed(1) : '0.0';
  const ratingDelta = totalReviews > 0
    ? `${totalReviews} review${totalReviews === 1 ? '' : 's'}`
    : 'No reviews';
  const ratingDeltaType = totalReviews > 0 ? 'positive' : 'neutral';

  // 3. Total Clients
  const clientBookings = await Booking.findAll({
    where: {
      expertId,
      status: { [Op.in]: ['confirmed', 'completed'] },
    },
    attributes: ['seekerId', 'scheduledStartAt', 'createdAt'],
  });
  const uniqueClientIds = new Set(clientBookings.map((b) => b.seekerId));
  const totalClients = uniqueClientIds.size;
  const thisMonthClientIds = new Set(
    clientBookings
      .filter((b) => new Date(b.scheduledStartAt || b.createdAt) >= thisMonthStart)
      .map((b) => b.seekerId)
  );
  const thisMonthClients = thisMonthClientIds.size;
  const clientsDelta = thisMonthClients > 0 ? `+${thisMonthClients} this month` : '0 this month';
  const clientsDeltaType = thisMonthClients > 0 ? 'positive' : 'neutral';

  // 4. Pending Requests
  const pendingRequests = await Booking.count({
    where: { expertId, status: 'awaiting_expert' },
  });
  const requestsDelta = pendingRequests > 0 ? 'Action needed' : 'All clear';
  const requestsDeltaType = pendingRequests > 0 ? 'alert' : 'neutral';

  // 5. Weekly Hours
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const mondayThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
  const mondayLastWeek = new Date(mondayThisWeek.getTime() - 7 * 86400000);

  const weekBookings = await Booking.findAll({
    where: {
      expertId,
      status: { [Op.in]: ['confirmed', 'completed'] },
      scheduledStartAt: { [Op.gte]: mondayLastWeek },
    },
    attributes: ['scheduledStartAt', 'scheduledEndAt'],
  });

  let thisWeekMinutes = 0;
  let lastWeekMinutes = 0;
  for (const b of weekBookings) {
    const start = new Date(b.scheduledStartAt).getTime();
    const end = new Date(b.scheduledEndAt).getTime();
    const mins = Math.max(0, Math.round((end - start) / 60000));
    if (start >= mondayThisWeek.getTime()) {
      thisWeekMinutes += mins;
    } else {
      lastWeekMinutes += mins;
    }
  }
  const thisWeekHours = Math.round((thisWeekMinutes / 60) * 10) / 10;
  const lastWeekHours = Math.round((lastWeekMinutes / 60) * 10) / 10;
  const weeklyHoursVal = `${thisWeekHours % 1 === 0 ? thisWeekHours.toFixed(0) : thisWeekHours} hrs`;
  let weeklyHoursDelta = 'This week';
  let weeklyHoursDeltaType = 'neutral';
  if (lastWeekHours > 0) {
    const diff = Math.round((thisWeekHours - lastWeekHours) * 10) / 10;
    weeklyHoursDelta = `${diff >= 0 ? '+' : ''}${diff} hrs`;
    weeklyHoursDeltaType = diff >= 0 ? 'positive' : 'neutral';
  } else if (thisWeekHours > 0) {
    weeklyHoursDelta = `+${thisWeekHours} hrs`;
    weeklyHoursDeltaType = 'positive';
  }

  // 6. Avg Response Time
  const respondedBookings = await Booking.findAll({
    where: {
      expertId,
      expertRespondedAt: { [Op.ne]: null },
    },
    attributes: ['createdAt', 'expertRequestedAt', 'expertRespondedAt'],
  });
  let avgResponseVal = 'N/A';
  let avgResponseDelta = 'No requests';
  let avgResponseDeltaType = 'neutral';
  let avgResponseMinutes = null;
  if (respondedBookings.length > 0) {
    const totalResponseMinutes = respondedBookings.reduce((sum, b) => {
      const start = new Date(b.expertRequestedAt || b.createdAt).getTime();
      const end = new Date(b.expertRespondedAt).getTime();
      return sum + Math.max(0, Math.round((end - start) / 60000));
    }, 0);
    avgResponseMinutes = Math.round(totalResponseMinutes / respondedBookings.length);
    if (avgResponseMinutes <= 30) {
      avgResponseVal = '< 30m';
    } else if (avgResponseMinutes < 60) {
      avgResponseVal = `${avgResponseMinutes}m`;
    } else {
      const hrs = Math.floor(avgResponseMinutes / 60);
      const rem = avgResponseMinutes % 60;
      avgResponseVal = rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
    }
    avgResponseDelta = `${respondedBookings.length} responded`;
    avgResponseDeltaType = 'positive';
  }

  // 7. Booking Rate
  const decidedBookings = await Booking.findAll({
    where: {
      expertId,
      status: { [Op.in]: ['confirmed', 'completed', 'declined'] },
    },
    attributes: ['status'],
  });
  const totalDecided = decidedBookings.length;
  const acceptedCount = decidedBookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).length;
  let bookingRateVal = '100%';
  let bookingRateDelta = 'No requests';
  let bookingRateDeltaType = 'neutral';
  if (totalDecided > 0) {
    const pct = Math.round((acceptedCount / totalDecided) * 100);
    bookingRateVal = `${pct}%`;
    bookingRateDelta = `${acceptedCount}/${totalDecided} accepted`;
    bookingRateDeltaType = pct >= 80 ? 'positive' : 'neutral';
  }

  const stats = [
    {
      id: 'sessions',
      label: 'Sessions Done',
      value: String(totalCompleted),
      delta: sessionsDelta,
      deltaType: sessionsDeltaType,
      icon: 'calendar',
    },
    {
      id: 'rating',
      label: 'Avg Rating',
      value: ratingVal,
      delta: ratingDelta,
      deltaType: ratingDeltaType,
      icon: 'star',
    },
    {
      id: 'clients',
      label: 'Total Clients',
      value: String(totalClients),
      delta: clientsDelta,
      deltaType: clientsDeltaType,
      icon: 'users',
    },
    {
      id: 'requests',
      label: 'Pending Requests',
      value: String(pendingRequests),
      delta: requestsDelta,
      deltaType: requestsDeltaType,
      icon: 'inbox',
    },
    {
      id: 'weekly-hours',
      label: 'Weekly hours',
      value: weeklyHoursVal,
      delta: weeklyHoursDelta,
      deltaType: weeklyHoursDeltaType,
      icon: 'clock',
    },
    {
      id: 'avg-response',
      label: 'Average response',
      value: avgResponseVal,
      delta: avgResponseDelta,
      deltaType: avgResponseDeltaType,
      icon: 'timer',
    },
    {
      id: 'booking-rate',
      label: 'Booking rate',
      value: bookingRateVal,
      delta: bookingRateDelta,
      deltaType: bookingRateDeltaType,
      icon: 'trend',
    },
  ];

  return {
    stats,
    summary: {
      sessionsDone: totalCompleted,
      avgRating,
      totalReviews,
      totalClients,
      pendingRequests,
      weeklyHours: thisWeekHours,
      avgResponseMinutes,
      bookingRate: totalDecided > 0 ? Math.round((acceptedCount / totalDecided) * 100) : 100,
    },
  };
}
