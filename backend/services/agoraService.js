import agoraToken from 'agora-token';
import { getDatabaseSetting, getDatabaseSettingBool } from '../utils/settingsHelper.js';

const { RtcRole, RtcTokenBuilder } = agoraToken;

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getAgoraConfig() {
  const [enabled, appId, appCertificate, tokenTtl, joinBefore, joinAfter] = await Promise.all([
    getDatabaseSettingBool('AGORA_ENABLED', false),
    getDatabaseSetting('AGORA_APP_ID'),
    getDatabaseSetting('AGORA_APP_CERTIFICATE'),
    getDatabaseSetting('AGORA_TOKEN_TTL_SECONDS', '3600'),
    getDatabaseSetting('AGORA_JOIN_BEFORE_MINUTES', '15'),
    getDatabaseSetting('AGORA_JOIN_AFTER_MINUTES', '30'),
  ]);
  return {
    enabled,
    appId: String(appId || '').trim(),
    appCertificate: String(appCertificate || '').trim(),
    tokenTtlSeconds: positiveInt(tokenTtl, 3600),
    joinBeforeMinutes: positiveInt(joinBefore, 15),
    joinAfterMinutes: positiveInt(joinAfter, 30),
  };
}

export function bookingChannelName(bookingId) {
  return `booking_${String(bookingId).replace(/[^a-zA-Z0-9]/g, '')}`.slice(0, 63);
}

export function participantUid(role) {
  return role === 'expert' ? 2 : 1;
}

export async function getAgoraSessionAccess(booking) {
  const config = await getAgoraConfig();
  const startsAt = new Date(booking.scheduledStartAt).getTime();
  const endsAt = new Date(booking.scheduledEndAt).getTime();
  const opensAt = startsAt - config.joinBeforeMinutes * 60 * 1000;
  const closesAt = endsAt + config.joinAfterMinutes * 60 * 1000;
  const now = Date.now();

  return {
    enabled: config.enabled && Boolean(config.appId && config.appCertificate),
    opensAt: new Date(opensAt).toISOString(),
    closesAt: new Date(closesAt).toISOString(),
    canJoin: booking.status === 'confirmed' && now >= opensAt && now <= closesAt,
    joinBeforeMinutes: config.joinBeforeMinutes,
  };
}

export async function createAgoraSessionToken(booking, role) {
  const config = await getAgoraConfig();
  if (!config.enabled) throw new Error('AGORA_DISABLED');
  if (!config.appId || !config.appCertificate) throw new Error('AGORA_NOT_CONFIGURED');

  const now = Date.now();
  const startsAt = new Date(booking.scheduledStartAt).getTime();
  const endsAt = new Date(booking.scheduledEndAt).getTime();
  const opensAt = startsAt - config.joinBeforeMinutes * 60 * 1000;
  const closesAt = endsAt + config.joinAfterMinutes * 60 * 1000;
  if (now < opensAt) {
    const error = new Error('SESSION_NOT_OPEN');
    error.opensAt = new Date(opensAt).toISOString();
    throw error;
  }
  if (now > closesAt) throw new Error('SESSION_CLOSED');

  const uid = participantUid(role);
  const channel = bookingChannelName(booking.id);
  const expiresIn = Math.min(config.tokenTtlSeconds, Math.max(60, Math.ceil((closesAt - now) / 1000)));
  const token = RtcTokenBuilder.buildTokenWithUid(
    config.appId,
    config.appCertificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expiresIn,
    expiresIn,
  );
  const type = String(booking.consultationType || '').toLowerCase();
  const capabilities = type === 'text' || type === 'chat'
    ? ['chat']
    : type === 'audio' || type === 'shoutout'
      ? ['audio', 'chat']
      : ['video', 'audio', 'chat'];

  return {
    enabled: true,
    appId: config.appId,
    channel,
    token,
    uid,
    role,
    capabilities,
    expiresAt: new Date(now + expiresIn * 1000).toISOString(),
    scheduledStartAt: booking.scheduledStartAt,
    scheduledEndAt: booking.scheduledEndAt,
  };
}
