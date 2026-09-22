import { Op } from 'sequelize';
import { Booking, BookingReview, Seeker, SeekerCreditTransaction, seekerDb } from '../models/index.js';
import { sendNotification } from '../services/notificationService.js';

const fail = (status, message) => Object.assign(new Error(message), { status });
export const reviewAction = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (error) {
    if (!error.status) console.error('Review operation failed:', error.message);
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to process review' });
  }
};

export async function getBookingReview(req, res) {
  const booking = await Booking.findOne({ where: { id: req.params.bookingId, seekerId: req.user.id } });
  if (!booking) throw fail(404, 'Booking not found');
  const review = await BookingReview.findOne({ where: { bookingId: booking.id } });
  res.json({ review, canReview: booking.status === 'completed' && !review });
}

export async function submitReview(req, res) {
  const { rating, comment = '' } = req.body;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw fail(422, 'Select a rating from 1 to 5');
  if (typeof comment !== 'string' || comment.trim().length > 5000) throw fail(422, 'Review must be at most 5000 characters');
  const result = await seekerDb.transaction(async (transaction) => {
    const booking = await Booking.findOne({ where: { id: req.params.bookingId, seekerId: req.user.id }, transaction, lock: transaction.LOCK.UPDATE });
    if (!booking) throw fail(404, 'Booking not found');
    if (booking.status !== 'completed') throw fail(409, 'Only completed sessions can be reviewed');
    const existing = await BookingReview.findOne({ where: { bookingId: booking.id }, transaction });
    if (existing) {
      if (existing.rating !== rating || existing.comment !== comment.trim()) throw fail(409, 'You have already reviewed this session');
      return { review: existing, created: false, creditsAwarded: 0 };
    }
    const review = await BookingReview.create({ bookingId: booking.id, seekerId: booking.seekerId, expertId: booking.expertId, rating, comment: comment.trim() }, { transaction });
    const seeker = await Seeker.findByPk(booking.seekerId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!seeker) throw fail(404, 'Seeker not found');
    const balanceAfter = Number(seeker.credits || 0) + 15;
    await SeekerCreditTransaction.create({
      seekerId: seeker.id, amount: 15, balanceAfter, type: 'credit',
      source: 'booking_review', reference: booking.id,
      description: 'Reward for reviewing a completed session',
      metadata: { bookingId: booking.id, reviewId: review.id },
    }, { transaction });
    await seeker.update({ credits: balanceAfter }, { transaction });
    return { review, created: true, creditsAwarded: 15, creditBalance: balanceAfter };
  });
  if (result.created) void sendNotification({ recipientType: 'expert', recipientId: result.review.expertId,
    eventType: 'review.created', dedupeKey: `review:${result.review.id}`, title: 'New session review',
    body: `A seeker rated your session ${rating}/5.`, href: '/expert/reviews/', data: { reviewId: result.review.id, bookingId: result.review.bookingId },
  }).catch((error) => console.error('Review notification failed:', error.message));
  res.status(result.created ? 201 : 200).json({ review: result.review, creditsAwarded: result.creditsAwarded, ...(result.creditBalance !== undefined ? { creditBalance: result.creditBalance } : {}) });
}

export async function expertReviews(req, res) {
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 20)));
  const where = { expertId: req.user.id };
  if (req.query.filter === 'needsReply') where.reply = null;
  if (req.query.filter === 'fiveStar') where.rating = 5;
  if (req.query.filter === 'recent') where.createdAt = { [Op.gte]: new Date(Date.now() - 30 * 86400000) };
  const { rows, count } = await BookingReview.findAndCountAll({ where, include: [{ model: Booking, as: 'booking', attributes: ['subject'] }], order: req.query.sort === 'highest' ? [['rating', 'DESC'], ['createdAt', 'DESC']] : req.query.sort === 'lowest' ? [['rating', 'ASC'], ['createdAt', 'DESC']] : [['createdAt', 'DESC']], limit, offset: (page - 1) * limit });
  const seekers = await Seeker.findAll({ where: { id: { [Op.in]: rows.map((row) => row.seekerId) } }, attributes: ['id', 'fullName'] });
  const names = new Map(seekers.map((seeker) => [seeker.id, seeker.fullName]));
  const stats = await BookingReview.findAll({ where: { expertId: req.user.id }, attributes: ['rating', 'createdAt', 'repliedAt'] });
  const total = stats.length;
  const replied = stats.filter((item) => item.repliedAt);
  res.json({ items: rows.map((row) => ({ ...row.toJSON(), clientName: names.get(row.seekerId) || 'Seeker', sessionTitle: row.booking?.subject || 'Consultation' })),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    summary: { totalReviews: total, overallRating: total ? Number((stats.reduce((sum, row) => sum + row.rating, 0) / total).toFixed(1)) : 0,
      needsReply: total - replied.length,
      responseRatePercent: total ? Math.round(replied.length / total * 100) : 0,
      avgReplyTimeHours: replied.length ? Number((replied.reduce((sum, row) => sum + (new Date(row.repliedAt) - new Date(row.createdAt)) / 3600000, 0) / replied.length).toFixed(1)) : 0,
      starDistribution: [5, 4, 3, 2, 1].map((stars) => { const count = stats.filter((row) => row.rating === stars).length; return { stars, count, percent: total ? Math.round(count / total * 100) : 0 }; }),
    }, trend: stats.map((row) => ({ rating: row.rating, createdAt: row.createdAt })),
  });
}

export async function replyToReview(req, res) {
  const text = req.body.reply;
  if (typeof text !== 'string' || !text.trim() || text.trim().length > 5000) throw fail(422, 'Reply must contain 1 to 5000 characters');
  const review = await BookingReview.findOne({ where: { id: req.params.reviewId, expertId: req.user.id } });
  if (!review) throw fail(404, 'Review not found');
  await review.update({ reply: text.trim(), repliedAt: review.repliedAt || new Date() });
  void sendNotification({ recipientType: 'seeker', recipientId: review.seekerId, eventType: 'review.replied', dedupeKey: `review.reply:${review.id}`,
    title: 'Expert replied to your review', body: 'Your expert has responded to your session feedback.', href: `/seeker/bookings/${review.bookingId}/`, data: { bookingId: review.bookingId },
  }).catch((error) => console.error('Review reply notification failed:', error.message));
  res.json({ review });
}
