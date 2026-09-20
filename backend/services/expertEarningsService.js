import { Op } from 'sequelize';
import { Booking, BookingExtension, BookingPayment, Expert, Seeker } from '../models/index.js';
import { getDatabaseSetting } from '../utils/settingsHelper.js';
import { completeEndedBookings } from './seeker/bookingService.js';

const money = (value) => Math.max(0, Math.round(Number(value || 0)));
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

function addToBucket(map, label, amount) {
  map.set(label, (map.get(label) || 0) + amount);
}

function charts(bookings) {
  const now = new Date();
  const dailyDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now); date.setDate(now.getDate() - (6 - index)); date.setHours(0, 0, 0, 0); return date;
  });
  const monthDates = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  const years = Array.from({ length: 4 }, (_, index) => now.getFullYear() - (3 - index));
  const dayMap = new Map(dailyDates.map((date) => [date.toISOString().slice(0, 10), 0]));
  const monthMap = new Map(monthDates.map((date) => [`${date.getFullYear()}-${date.getMonth()}`, 0]));
  const yearMap = new Map(years.map((year) => [String(year), 0]));
  for (const booking of bookings) {
    const completedAt = new Date(booking.scheduledEndAt);
    const amount = money(booking.expertEarning);
    const dayKey = completedAt.toISOString().slice(0, 10);
    const monthKey = `${completedAt.getFullYear()}-${completedAt.getMonth()}`;
    const yearKey = String(completedAt.getFullYear());
    if (dayMap.has(dayKey)) addToBucket(dayMap, dayKey, amount);
    if (monthMap.has(monthKey)) addToBucket(monthMap, monthKey, amount);
    if (yearMap.has(yearKey)) addToBucket(yearMap, yearKey, amount);
  }
  return {
    day: dailyDates.map((date) => ({ label: date.toLocaleDateString('en-IN', { weekday: 'short' }), amount: dayMap.get(date.toISOString().slice(0, 10)) || 0 })),
    month: monthDates.map((date) => ({ label: date.toLocaleDateString('en-IN', { month: 'short' }), amount: monthMap.get(`${date.getFullYear()}-${date.getMonth()}`) || 0 })),
    year: years.map((year) => ({ label: String(year), amount: yearMap.get(String(year)) || 0 })),
  };
}

function nextMonday() {
  const date = new Date();
  const days = (8 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + days); date.setHours(0, 0, 0, 0);
  return date;
}

export async function getExpertEarnings(expertId) {
  await completeEndedBookings();
  const expert = await Expert.findByPk(expertId, { attributes: ['id', 'fullName'] });
  if (!expert) throw new Error('EXPERT_NOT_FOUND');
  const bookings = await Booking.findAll({
    where: { expertId, status: { [Op.in]: ['confirmed', 'completed'] }, paymentStatus: { [Op.in]: ['paid', 'paid_with_credits'] } },
    include: [
      { model: Seeker, as: 'seeker', attributes: ['id', 'fullName'] },
      { model: BookingPayment, as: 'payments', required: false, attributes: ['id', 'provider', 'razorpayPaymentId', 'status', 'paidAt'] },
      { model: BookingExtension, as: 'extension', required: false },
    ],
    order: [['scheduledEndAt', 'DESC']],
  });
  const normalized = bookings.map((instance) => {
    const booking = instance.toJSON();
    const extensionFee = booking.extension?.status === 'paid' ? money(booking.extension.consultationFee) : 0;
    return { ...booking, expertEarning: money(booking.consultationFee) + extensionFee };
  });
  const completed = normalized.filter((booking) => booking.status === 'completed');
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = completed.filter((booking) => new Date(booking.scheduledEndAt) >= thisMonthStart);
  const previousMonth = completed.filter((booking) => {
    const date = new Date(booking.scheduledEndAt); return date >= previousMonthStart && date < thisMonthStart;
  });
  const totalEarned = completed.reduce((sum, booking) => sum + booking.expertEarning, 0);
  const thisMonthRevenue = thisMonth.reduce((sum, booking) => sum + booking.expertEarning, 0);
  const previousMonthRevenue = previousMonth.reduce((sum, booking) => sum + booking.expertEarning, 0);
  const growthPercent = previousMonthRevenue > 0 ? Math.round(((thisMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 1000) / 10 : null;
  const payoutMinimum = money(await getDatabaseSetting('EXPERT_PAYOUT_MINIMUM_PAISE', '100000'));

  const transactions = completed.map((booking) => ({
    id: `earning-${booking.id}`, description: booking.subject, subtext: `${booking.consultationType} session with ${booking.seeker?.fullName || 'Seeker'}`,
    date: booking.scheduledEndAt, method: 'bank', methodLabel: 'Jatayu balance', transactionId: booking.payments?.[0]?.razorpayPaymentId || booking.id,
    amount: booking.expertEarning, status: 'Pending', bookingId: booking.id,
  }));
  const invoices = normalized.map((booking) => ({
    id: booking.id, number: `INV-${String(booking.id).split('-')[0].toUpperCase()}`, client: booking.seeker?.fullName || 'Seeker',
    issueDate: booking.payments?.[0]?.paidAt || booking.confirmedAt || booking.createdAt,
    dueDate: booking.scheduledEndAt, amount: money(booking.totalAmount), status: 'Paid', bookingId: booking.id,
    subject: booking.subject, scheduledAt: booking.scheduledStartAt, consultationFee: money(booking.consultationFee),
    platformFee: money(booking.platformFee), gst: money(booking.gst), paymentMethod: booking.payments?.[0]?.provider || (booking.paymentStatus === 'paid_with_credits' ? 'credits' : 'Jatayu'),
  }));
  return {
    expertName: expert.fullName,
    summary: {
      availableBalance: totalEarned, nextPayoutDate: nextMonday(), totalEarned,
      annualGoalPercent: 0, thisMonthRevenue, thisMonthSessions: thisMonth.length,
      pendingPayout: totalEarned, totalInvoices: invoices.length,
      avgPerSession: completed.length ? Math.round(totalEarned / completed.length) : 0,
      credits: 0, platformFeePercent: null, growthPercent, year: now.getFullYear(),
    },
    charts: charts(completed),
    payoutMethods: [],
    payoutSchedule: { frequency: 'Weekly (Mondays)', minimum: payoutMinimum, processing: '1-3 business days' },
    transactions,
    invoices,
  };
}
