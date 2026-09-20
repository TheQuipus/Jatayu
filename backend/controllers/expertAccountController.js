import { Op } from 'sequelize';
import {
  Availability, Booking, BookingMessage, BookingPayment, BookingTranscriptSegment,
  Credential, Expert, ExpertSession, Notification, expertDb,
} from '../models/index.js';

function safeExpert(expert) {
  const data = expert.toJSON();
  delete data.password;
  if (data.onboardingMetadata && typeof data.onboardingMetadata === 'object') {
    const { pendingOtp, ...metadata } = data.onboardingMetadata;
    data.onboardingMetadata = metadata;
  }
  return data;
}

export async function exportAccountData(req, res) {
  const expert = await Expert.findByPk(req.user.id);
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  const [credentials, availabilities, sessions, notifications, bookings] = await Promise.all([
    Credential.findAll({ where: { expertId: expert.id } }),
    Availability.findAll({ where: { expertId: expert.id } }),
    ExpertSession.findAll({ where: { expertId: expert.id }, order: [['createdAt', 'DESC']] }),
    Notification.findAll({ where: { recipientType: 'expert', recipientId: expert.id }, order: [['createdAt', 'DESC']] }),
    Booking.findAll({ where: { expertId: expert.id }, order: [['createdAt', 'DESC']] }),
  ]);
  const bookingIds = bookings.map((booking) => booking.id);
  const [payments, messages, transcriptSegments] = bookingIds.length ? await Promise.all([
    BookingPayment.findAll({ where: { bookingId: { [Op.in]: bookingIds } } }),
    BookingMessage.findAll({ where: { bookingId: { [Op.in]: bookingIds } }, order: [['createdAt', 'ASC']] }),
    BookingTranscriptSegment.findAll({ where: { bookingId: { [Op.in]: bookingIds } }, order: [['createdAt', 'ASC']] }),
  ]) : [[], [], []];
  return res.json({
    exportedAt: new Date().toISOString(),
    expert: safeExpert(expert), credentials, availabilities,
    sessions: sessions.map(({ id, device, loginMethod, lastSeenAt, createdAt, expiresAt, revokedAt }) =>
      ({ id, device, loginMethod, lastSeenAt, createdAt, expiresAt, revokedAt })),
    notifications, bookings: bookings.map((item) => {
      const data = item.toJSON(); delete data.idempotencyKey; delete data.activeSlotKey; return data;
    }),
    payments: payments.map((item) => { const data = item.toJSON(); delete data.providerPayload; return data; }),
    messages, transcriptSegments,
  });
}

export async function logoutCurrentSession(req, res) {
  if (req.user.jti) await ExpertSession.update({ revokedAt: new Date() }, { where: { id: req.user.jti, expertId: req.user.id, revokedAt: null } });
  return res.json({ message: 'Logged out successfully' });
}

export async function softDeleteAccount(req, res) {
  if (req.body.confirmation !== 'DELETE') return res.status(422).json({ message: 'Type DELETE to confirm account deletion' });
  const result = await expertDb.transaction(async (transaction) => {
    const expert = await Expert.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!expert) return false;
    await ExpertSession.update({ revokedAt: new Date() }, { where: { expertId: expert.id, revokedAt: null }, transaction });
    await expert.destroy({ transaction });
    return true;
  });
  if (!result) return res.status(404).json({ message: 'Expert not found' });
  return res.json({ message: 'Account deleted successfully', recoverable: true });
}
