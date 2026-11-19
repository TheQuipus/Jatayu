import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Expert, ExpertSession, ExpertSecurityChallenge } from '../models/index.js';
import { deliverOtpChannels } from '../utils/otpDelivery.js';
import { constantTimeCodeEqual, MAX_OTP_ATTEMPTS, withOtpVerificationLock } from '../utils/otpPersistence.js';
import { DEFAULT_EXPERT_NOTIFICATION_PREFERENCES, normalizeExpertNotificationPreferences } from '../config/expertNotificationPreferences.js';

const contactChallengeAttempts = new Map();

const maskPhone = (phone) => phone ? `${String(phone).slice(0, -5)}•••••` : null;
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const preferenceKeys = Object.keys(DEFAULT_EXPERT_NOTIFICATION_PREFERENCES);
const sessionJson = (item, currentId) => ({
  id: item.id, device: item.device, ipAddress: item.ipAddress, loginMethod: item.loginMethod,
  lastSeenAt: item.lastSeenAt, createdAt: item.createdAt, expiresAt: item.expiresAt,
  activeNow: item.id === currentId, revokedAt: item.revokedAt,
});

export async function getSecurity(req, res) {
  const expert = await Expert.findByPk(req.user.id, { attributes: ['email', 'phone', 'isEmailVerified', 'isPhoneVerified', 'twoFactorEnabled', 'password'] });
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  const all = await ExpertSession.findAll({ where: { expertId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
  const active = all.filter((item) => !item.revokedAt && new Date(item.expiresAt) > new Date());
  return res.json({
    email: expert.email, phone: expert.phone, maskedPhone: maskPhone(expert.phone),
    emailVerified: expert.isEmailVerified, phoneVerified: expert.isPhoneVerified,
    twoFactorEnabled: expert.twoFactorEnabled, hasPassword: Boolean(expert.password),
    sessions: active.map((item) => sessionJson(item, req.user.jti)),
    loginHistory: all.map((item) => sessionJson(item, req.user.jti)),
  });
}

export async function updateTwoFactor(req, res) {
  if (typeof req.body.enabled !== 'boolean') return res.status(422).json({ message: 'enabled must be a boolean' });
  const expert = await Expert.findByPk(req.user.id);
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  if (req.body.enabled && !expert.isEmailVerified && !expert.isPhoneVerified) {
    return res.status(409).json({ message: 'Verify an email address or phone number before enabling two-factor authentication' });
  }
  expert.twoFactorEnabled = req.body.enabled;
  await expert.save();
  return res.json({ twoFactorEnabled: expert.twoFactorEnabled });
}

export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
    return res.status(422).json({ message: 'New password must be at least 8 characters and include a letter, number, and symbol' });
  }
  const expert = await Expert.findByPk(req.user.id);
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  if (expert.password && (!currentPassword || !(await bcrypt.compare(currentPassword, expert.password)))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  expert.password = await bcrypt.hash(newPassword, 12);
  await expert.save();
  await ExpertSession.update({ revokedAt: new Date() }, { where: { expertId: expert.id, id: { [Op.ne]: req.user.jti || '' }, revokedAt: null } });
  return res.json({ message: 'Password updated successfully' });
}

export async function logoutOtherSessions(req, res) {
  await ExpertSession.update({ revokedAt: new Date() }, { where: { expertId: req.user.id, id: { [Op.ne]: req.user.jti || '' }, revokedAt: null } });
  return res.json({ message: 'Other sessions logged out' });
}

export async function revokeSession(req, res) {
  if (req.params.sessionId === req.user.jti) return res.status(409).json({ message: 'Use account logout to end the current session' });
  const [count] = await ExpertSession.update({ revokedAt: new Date() }, { where: { id: req.params.sessionId, expertId: req.user.id, revokedAt: null } });
  if (!count) return res.status(404).json({ message: 'Active session not found' });
  return res.json({ message: 'Session removed' });
}

export async function requestContactVerification(req, res) {
  const type = req.body.type;
  const value = String(req.body.value || '').trim().toLowerCase();
  if (!['email', 'phone'].includes(type)) return res.status(422).json({ message: 'type must be email or phone' });
  if (type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) return res.status(422).json({ message: 'Enter a valid email address' });
  if (type === 'phone' && !/^\+?[1-9]\d{9,14}$/.test(value)) return res.status(422).json({ message: 'Enter a valid phone number including country code' });
  const duplicate = await Expert.findOne({ where: { [type]: value, id: { [Op.ne]: req.user.id } } });
  if (duplicate) return res.status(409).json({ message: `That ${type} is already registered` });
  const expert = await Expert.findByPk(req.user.id);
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  const code = String(crypto.randomInt(100000, 1000000));
  await ExpertSecurityChallenge.update({ usedAt: new Date() }, { where: { expertId: expert.id, type, usedAt: null } });
  const challenge = await ExpertSecurityChallenge.create({ expertId: expert.id, type, value, codeHash: hashCode(code), expiresAt: new Date(Date.now() + 10 * 60000) });
  await deliverOtpChannels({ email: type === 'email' ? value : null, phone: type === 'phone' ? value : null, fullName: expert.fullName, otpCode: code, logPrefix: 'Security OTP' });
  return res.status(202).json({ challengeId: challenge.id, message: `Verification code sent to the new ${type}` });
}

export async function verifyContact(req, res) {
  const challengeId = req.body?.challengeId;
  if (!challengeId) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  return withOtpVerificationLock(`contact:${req.user.id}:${challengeId}`, async () => {
    const challenge = await ExpertSecurityChallenge.findOne({
      where: { id: challengeId, expertId: req.user.id, usedAt: null },
    });
    if (!challenge || new Date(challenge.expiresAt) <= new Date()) {
      contactChallengeAttempts.delete(challengeId);
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const submittedHash = hashCode(String(req.body.code || ''));
    if (!constantTimeCodeEqual(challenge.codeHash, submittedHash)) {
      const nextAttempts = (contactChallengeAttempts.get(challenge.id) || 0) + 1;
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        contactChallengeAttempts.delete(challenge.id);
        challenge.usedAt = new Date();
        await challenge.save();
        return res.status(429).json({
          message: 'Too many invalid verification attempts. Please request a new verification code.',
          code: 'OTP_ATTEMPTS_EXCEEDED',
        });
      }
      contactChallengeAttempts.set(challenge.id, nextAttempts);
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const duplicate = await Expert.findOne({
      where: { [challenge.type]: challenge.value, id: { [Op.ne]: req.user.id } },
    });
    if (duplicate) {
      return res.status(409).json({ message: `That ${challenge.type} is already registered` });
    }

    const expert = await Expert.findByPk(req.user.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    expert[challenge.type] = challenge.value;
    expert[challenge.type === 'email' ? 'isEmailVerified' : 'isPhoneVerified'] = true;
    challenge.usedAt = new Date();
    contactChallengeAttempts.delete(challenge.id);
    await Promise.all([expert.save(), challenge.save()]);
    return res.json({ message: `${challenge.type} updated and verified` });
  });
}

export async function getNotificationPreferences(req, res) {
  const expert = await Expert.findByPk(req.user.id, { attributes: ['notificationPreferences'] });
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  return res.json({ preferences: normalizeExpertNotificationPreferences(expert.notificationPreferences) });
}

export async function updateNotificationPreferences(req, res) {
  if (!req.body.preferences || typeof req.body.preferences !== 'object' || Array.isArray(req.body.preferences)) {
    return res.status(422).json({ message: 'preferences must be an object' });
  }
  const invalidCategory = Object.keys(req.body.preferences).find((key) => !preferenceKeys.includes(key));
  const invalidChannel = Object.values(req.body.preferences).some((category) =>
    !category || typeof category !== 'object' || Object.entries(category).some(([key, value]) =>
      !['push', 'email', 'sms'].includes(key) || typeof value !== 'boolean'));
  if (invalidCategory || invalidChannel) return res.status(422).json({ message: 'Invalid notification preference category or channel' });
  const expert = await Expert.findByPk(req.user.id);
  if (!expert) return res.status(404).json({ message: 'Expert not found' });
  expert.notificationPreferences = normalizeExpertNotificationPreferences({ ...normalizeExpertNotificationPreferences(expert.notificationPreferences), ...req.body.preferences });
  await expert.save({ fields: ['notificationPreferences'] });
  return res.json({ preferences: expert.notificationPreferences });
}
