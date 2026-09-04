import crypto from 'crypto';
import agoraToken from 'agora-token';
import {
  BookingTranscriptSegment,
  BookingTranscriptSession,
} from '../models/index.js';
import { getDatabaseSetting, getDatabaseSettingBool } from '../utils/settingsHelper.js';
import { bookingChannelName, getAgoraConfig } from './agoraService.js';

const { RtcRole, RtcTokenBuilder } = agoraToken;
const SUB_BOT_UID = 900001;
const PUB_BOT_UID = 900002;

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getAgoraTranscriptionConfig() {
  const [enabled, customerId, customerSecret, languageText, maxIdleTime, gateway] = await Promise.all([
    getDatabaseSettingBool('AGORA_TRANSCRIPTION_ENABLED', false),
    getDatabaseSetting('AGORA_CUSTOMER_ID'),
    getDatabaseSetting('AGORA_CUSTOMER_SECRET'),
    getDatabaseSetting('AGORA_TRANSCRIPTION_LANGUAGES', 'en-US'),
    getDatabaseSetting('AGORA_TRANSCRIPTION_MAX_IDLE_SECONDS', '60'),
    getDatabaseSetting('AGORA_TRANSCRIPTION_GATEWAY', 'https://api.agora.io'),
  ]);
  return {
    enabled,
    customerId: String(customerId || '').trim(),
    customerSecret: String(customerSecret || '').trim(),
    languages: String(languageText || 'en-US').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4),
    maxIdleTime: Math.min(300, positiveInt(maxIdleTime, 60)),
    gateway: String(gateway || 'https://api.agora.io').replace(/\/$/, ''),
  };
}

function botToken(appId, certificate, channel, uid, ttlSeconds) {
  return RtcTokenBuilder.buildTokenWithUid(
    appId, certificate, channel, uid, RtcRole.PUBLISHER,
    ttlSeconds, ttlSeconds,
  );
}

async function agoraRequest(config, path, options = {}) {
  const response = await fetch(`${config.gateway}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.customerId}:${config.customerSecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const bodyText = await response.text();
  let body = {};
  try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = { message: bodyText.slice(0, 500) }; }
  if (!response.ok) {
    const error = new Error('AGORA_TRANSCRIPTION_REQUEST_FAILED');
    error.status = response.status;
    error.providerDescription = body.message || body.reason || `Agora returned HTTP ${response.status}`;
    throw error;
  }
  return body;
}

export async function startAgoraTranscription(booking) {
  const [rtcConfig, config] = await Promise.all([getAgoraConfig(), getAgoraTranscriptionConfig()]);
  if (!config.enabled) throw new Error('AGORA_TRANSCRIPTION_DISABLED');
  if (!config.customerId || !config.customerSecret) throw new Error('AGORA_TRANSCRIPTION_NOT_CONFIGURED');
  if (!rtcConfig.appId || !rtcConfig.appCertificate) throw new Error('AGORA_NOT_CONFIGURED');

  const [session, created] = await BookingTranscriptSession.findOrCreate({
    where: { bookingId: booking.id },
    defaults: { bookingId: booking.id, status: 'starting', languages: config.languages },
  });
  if (!created && ['starting', 'running'].includes(session.status)) return session;

  session.status = 'starting';
  session.languages = config.languages;
  session.failureCode = null;
  session.failureDescription = null;
  await session.save();

  const channel = bookingChannelName(booking.id);
  const ttl = Math.max(rtcConfig.tokenTtlSeconds, 3600);
  try {
    const response = await agoraRequest(
      config,
      `/api/speech-to-text/v1/projects/${encodeURIComponent(rtcConfig.appId)}/join`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: `booking-${booking.id}`.slice(0, 64),
          languages: config.languages,
          maxIdleTime: config.maxIdleTime,
          rtcConfig: {
            channelName: channel,
            subBotUid: String(SUB_BOT_UID),
            subBotToken: botToken(rtcConfig.appId, rtcConfig.appCertificate, channel, SUB_BOT_UID, ttl),
            pubBotUid: String(PUB_BOT_UID),
            pubBotToken: botToken(rtcConfig.appId, rtcConfig.appCertificate, channel, PUB_BOT_UID, ttl),
          },
        }),
      },
    );
    session.providerAgentId = response.agent_id;
    session.status = String(response.status || '').toUpperCase() === 'RUNNING' ? 'running' : 'starting';
    session.startedAt = new Date();
    await session.save();
    return session;
  } catch (error) {
    session.status = 'failed';
    session.failureCode = error.message;
    session.failureDescription = error.providerDescription || error.message;
    await session.save();
    throw error;
  }
}

export async function stopAgoraTranscription(bookingId) {
  const session = await BookingTranscriptSession.findOne({ where: { bookingId } });
  if (!session || session.status === 'stopped') return session;
  if (!session.providerAgentId) return session;
  const [rtcConfig, config] = await Promise.all([getAgoraConfig(), getAgoraTranscriptionConfig()]);
  await agoraRequest(
    config,
    `/api/speech-to-text/v1/projects/${encodeURIComponent(rtcConfig.appId)}/agents/${encodeURIComponent(session.providerAgentId)}/leave`,
    { method: 'POST' },
  );
  session.status = 'stopped';
  session.stoppedAt = new Date();
  await session.save();
  return session;
}

export async function storeTranscriptSegment(bookingId, input) {
  const text = String(input.text || '').trim().slice(0, 10000);
  const speakerUid = String(input.speakerUid || '').trim().slice(0, 64);
  const sequence = Number.parseInt(input.sequence, 10);
  if (!text || !speakerUid || !Number.isSafeInteger(sequence) || sequence < 0 || input.isFinal !== true) {
    throw new Error('INVALID_TRANSCRIPT_SEGMENT');
  }
  const startMs = Math.max(0, Number.parseInt(input.startMs, 10) || 0);
  const providerSegmentKey = crypto.createHash('sha256')
    .update(`${bookingId}:${speakerUid}:${sequence}:${startMs}`)
    .digest('hex');
  const words = Array.isArray(input.words) ? input.words : [];
  const confidenceValues = words.map((word) => Number(word?.confidence)).filter(Number.isFinite);
  const confidence = confidenceValues.length
    ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
    : null;
  const [segment] = await BookingTranscriptSegment.findOrCreate({
    where: { providerSegmentKey },
    defaults: {
      bookingId,
      providerSegmentKey,
      speakerUid,
      speakerRole: speakerUid === '1' ? 'seeker' : speakerUid === '2' ? 'expert' : null,
      sequence,
      startMs,
      durationMs: Math.max(0, Number.parseInt(input.durationMs, 10) || 0),
      language: input.language ? String(input.language).slice(0, 20) : null,
      text,
      confidence,
      isFinal: true,
      providerTimestamp: Number.isSafeInteger(Number(input.providerTimestamp)) ? Number(input.providerTimestamp) : null,
    },
  });
  return segment;
}

export async function getBookingTranscript(bookingId) {
  const [session, segments] = await Promise.all([
    BookingTranscriptSession.findOne({ where: { bookingId } }),
    BookingTranscriptSegment.findAll({ where: { bookingId }, order: [['startMs', 'ASC'], ['sequence', 'ASC']] }),
  ]);
  return {
    status: session?.status || 'not_started',
    languages: session?.languages || [],
    startedAt: session?.startedAt || null,
    stoppedAt: session?.stoppedAt || null,
    segments: segments.map((segment) => segment.toJSON()),
  };
}
