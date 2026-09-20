import crypto from 'crypto';
import { Op } from 'sequelize';
import { Booking, BookingCalendarEvent, ExpertCalendarConnection, Seeker } from '../models/index.js';
import { getDatabaseSetting, getDatabaseSettingBool } from '../utils/settingsHelper.js';
import { decryptCalendarToken, encryptCalendarToken } from './calendarTokenCrypto.js';

const PROVIDERS = new Set(['google', 'microsoft']);
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
const MICROSOFT_SCOPE = 'openid profile email offline_access Calendars.ReadWrite';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function providerConfig(provider) {
  if (!PROVIDERS.has(provider)) throw new Error('CALENDAR_PROVIDER_INVALID');
  if (provider === 'google') {
    return {
      enabled: await getDatabaseSettingBool('GOOGLE_ENABLE_CALENDAR', false),
      clientId: await getDatabaseSetting('GOOGLE_CLIENT_ID'),
      clientSecret: await getDatabaseSetting('GOOGLE_CALENDAR_CLIENT_SECRET'),
      redirectUri: await getDatabaseSetting('GOOGLE_CALENDAR_REDIRECT_URI'),
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: GOOGLE_SCOPE,
    };
  }
  const tenant = await getDatabaseSetting('MICROSOFT_CALENDAR_TENANT_ID', 'common');
  return {
    enabled: await getDatabaseSettingBool('MICROSOFT_CALENDAR_ENABLED', false),
    clientId: await getDatabaseSetting('MICROSOFT_CALENDAR_CLIENT_ID'),
    clientSecret: await getDatabaseSetting('MICROSOFT_CALENDAR_CLIENT_SECRET'),
    redirectUri: await getDatabaseSetting('MICROSOFT_CALENDAR_REDIRECT_URI'),
    authorizationUrl: `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
    scope: MICROSOFT_SCOPE,
  };
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error_description || body?.error?.message || body?.error || `HTTP ${response.status}`;
    const error = new Error(String(message));
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function listCalendarConnections(expertId) {
  const connections = await ExpertCalendarConnection.findAll({ where: { expertId }, order: [['provider', 'ASC']] });
  const byProvider = new Map(connections.map((item) => [item.provider, item]));
  return Promise.all(['google', 'microsoft'].map(async (provider) => {
    const config = await providerConfig(provider);
    const item = byProvider.get(provider);
    return {
      provider,
      available: Boolean(config.enabled && config.clientId && config.clientSecret && config.redirectUri),
      status: item?.status === 'connected' ? 'connected' : item?.status === 'error' ? 'error' : 'disconnected',
      accountEmail: item?.accountEmail || null,
      lastSyncedAt: item?.lastSyncedAt || null,
      lastError: item?.lastError || null,
    };
  }));
}

export async function beginCalendarConnection(expertId, provider) {
  const config = await providerConfig(provider);
  if (!config.enabled || !config.clientId || !config.clientSecret || !config.redirectUri) throw new Error('CALENDAR_PROVIDER_NOT_CONFIGURED');
  const state = crypto.randomBytes(32).toString('base64url');
  await ExpertCalendarConnection.upsert({
    expertId, provider, status: 'pending', oauthStateHash: sha256(state),
    oauthStateExpiresAt: new Date(Date.now() + 10 * 60 * 1000), lastError: null,
  });
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri,
    response_type: 'code', scope: config.scope, state });
  if (provider === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
    params.set('include_granted_scopes', 'true');
  } else {
    params.set('response_mode', 'query');
  }
  return `${config.authorizationUrl}?${params}`;
}

export async function completeCalendarConnection(provider, state, code) {
  if (!state || !code) throw new Error('CALENDAR_OAUTH_CALLBACK_INVALID');
  const connection = await ExpertCalendarConnection.findOne({
    where: { provider, oauthStateHash: sha256(state), oauthStateExpiresAt: { [Op.gt]: new Date() } },
  });
  if (!connection) throw new Error('CALENDAR_OAUTH_STATE_INVALID');
  const config = await providerConfig(provider);
  const token = await requestJson(config.tokenUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri,
      client_id: config.clientId, client_secret: config.clientSecret }),
  });
  const user = provider === 'google'
    ? await requestJson('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } })
    : await requestJson('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', { headers: { Authorization: `Bearer ${token.access_token}` } });
  connection.accessToken = encryptCalendarToken(token.access_token);
  connection.refreshToken = token.refresh_token ? encryptCalendarToken(token.refresh_token) : connection.refreshToken;
  connection.tokenExpiresAt = new Date(Date.now() + Number(token.expires_in || 3600) * 1000);
  connection.scopes = token.scope || config.scope;
  connection.accountEmail = user.email || user.mail || user.userPrincipalName || null;
  connection.status = 'connected';
  connection.oauthStateHash = null;
  connection.oauthStateExpiresAt = null;
  connection.lastError = null;
  await connection.save();
  await syncConfirmedBookings(connection.expertId, provider);
  return connection;
}

async function accessToken(connection) {
  if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt).getTime() > Date.now() + 60_000) {
    return decryptCalendarToken(connection.accessToken);
  }
  const config = await providerConfig(connection.provider);
  const refreshToken = decryptCalendarToken(connection.refreshToken);
  if (!refreshToken) throw new Error('CALENDAR_RECONNECT_REQUIRED');
  const token = await requestJson(config.tokenUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken,
      client_id: config.clientId, client_secret: config.clientSecret,
      ...(connection.provider === 'microsoft' ? { scope: config.scope } : {}) }),
  });
  connection.accessToken = encryptCalendarToken(token.access_token);
  if (token.refresh_token) connection.refreshToken = encryptCalendarToken(token.refresh_token);
  connection.tokenExpiresAt = new Date(Date.now() + Number(token.expires_in || 3600) * 1000);
  await connection.save();
  return token.access_token;
}

function eventBody(booking, seeker, provider) {
  const frontend = String(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://jatayuconnect.in').split(',')[0].replace(/\/$/, '');
  const common = {
    subject: booking.subject || 'Jatayu consultation',
    description: `Jatayu consultation with ${seeker?.fullName || 'a seeker'}.\nOpen session: ${frontend}/expert/requests/${booking.id}/`,
  };
  if (provider === 'google') return { summary: common.subject, description: common.description,
    start: { dateTime: new Date(booking.scheduledStartAt).toISOString(), timeZone: booking.timezone },
    end: { dateTime: new Date(booking.scheduledEndAt).toISOString(), timeZone: booking.timezone } };
  return { subject: common.subject, body: { contentType: 'text', content: common.description },
    start: { dateTime: new Date(booking.scheduledStartAt).toISOString().replace(/Z$/, ''), timeZone: 'UTC' },
    end: { dateTime: new Date(booking.scheduledEndAt).toISOString().replace(/Z$/, ''), timeZone: 'UTC' } };
}

async function syncOne(connection, booking, seeker) {
  const token = await accessToken(connection);
  const existing = await BookingCalendarEvent.findOne({ where: { bookingId: booking.id, provider: connection.provider } });
  const body = eventBody(booking, seeker, connection.provider);
  let response;
  if (connection.provider === 'google') {
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendarId || 'primary')}/events`;
    response = await requestJson(existing ? `${base}/${encodeURIComponent(existing.externalEventId)}` : base, {
      method: existing ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } else {
    const base = 'https://graph.microsoft.com/v1.0/me/events';
    response = await requestJson(existing ? `${base}/${encodeURIComponent(existing.externalEventId)}` : base, {
      method: existing ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  }
  await BookingCalendarEvent.upsert({ bookingId: booking.id, expertId: booking.expertId,
    provider: connection.provider, externalEventId: response.id || existing.externalEventId,
    externalCalendarId: connection.calendarId || 'primary', externalEventUrl: response.htmlLink || response.webLink || existing?.externalEventUrl || null,
    status: 'synced', lastSyncedAt: new Date(), lastError: null });
  connection.lastSyncedAt = new Date(); connection.lastError = null; connection.status = 'connected'; await connection.save();
}

export async function syncBookingToExternalCalendars(bookingOrId) {
  const booking = typeof bookingOrId === 'string' ? await Booking.findByPk(bookingOrId) : bookingOrId;
  if (!booking || booking.status !== 'confirmed') return;
  const [seeker, connections] = await Promise.all([
    Seeker.findByPk(booking.seekerId, { attributes: ['fullName'] }),
    ExpertCalendarConnection.findAll({ where: { expertId: booking.expertId, status: 'connected' } }),
  ]);
  await Promise.allSettled(connections.map(async (connection) => {
    try { await syncOne(connection, booking, seeker); }
    catch (error) { connection.status = error.message === 'CALENDAR_RECONNECT_REQUIRED' ? 'error' : connection.status; connection.lastError = error.message; await connection.save(); }
  }));
}

export async function syncConfirmedBookings(expertId, provider) {
  const connection = await ExpertCalendarConnection.findOne({ where: { expertId, provider, status: 'connected' } });
  if (!connection) throw new Error('CALENDAR_NOT_CONNECTED');
  const bookings = await Booking.findAll({ where: { expertId, status: 'confirmed', scheduledEndAt: { [Op.gt]: new Date() } } });
  for (const booking of bookings) await syncBookingToExternalCalendars(booking);
  return bookings.length;
}

export async function disconnectCalendar(expertId, provider) {
  const connection = await ExpertCalendarConnection.findOne({ where: { expertId, provider } });
  if (connection) await connection.destroy();
}

export async function calendarFrontendReturn(provider, status, message = '') {
  const configured = await getDatabaseSetting('CALENDAR_FRONTEND_RETURN_URL');
  const base = configured || `${String(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://jatayuconnect.in').split(',')[0].replace(/\/$/, '')}/expert/availability/`;
  const url = new URL(base);
  url.searchParams.set('calendarProvider', provider);
  url.searchParams.set('calendarStatus', status);
  if (message) url.searchParams.set('calendarMessage', message.slice(0, 160));
  return url.toString();
}
