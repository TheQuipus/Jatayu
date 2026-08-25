import { OAuth2Client } from 'google-auth-library';
import { getDatabaseSetting, getDatabaseSettingBool } from './settingsHelper.js';

export function isRealGoogleClientId(value) {
  if (!value) return false;
  const normalized = String(value).trim();
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  if (lower.includes('your_google') || lower.includes('placeholder')) return false;
  return normalized.includes('.apps.googleusercontent.com') || normalized.length > 24;
}

function googleAuthError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapGoogleProfile({ googleId, email, fullName, givenName, familyName, picture, locale, emailVerified }) {
  const nameFromParts = [givenName, familyName].filter(Boolean).join(' ').trim();
  return {
    googleId: String(googleId || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    fullName: String(fullName || nameFromParts || '').trim(),
    givenName: String(givenName || '').trim(),
    familyName: String(familyName || '').trim(),
    picture: String(picture || '').trim(),
    locale: String(locale || '').trim(),
    emailVerified: emailVerified === true || emailVerified === 'true',
  };
}

export async function getGoogleAuthConfig() {
  const clientId = String((await getDatabaseSetting('GOOGLE_CLIENT_ID')) || '').trim();
  const enabledSetting = await getDatabaseSettingBool('GOOGLE_LOGIN_ENABLED', true);
  const configured = isRealGoogleClientId(clientId);
  return {
    clientId,
    configured,
    enabled: configured && enabledSetting,
  };
}

async function verifyGoogleAccessToken(accessToken, clientId) {
  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  );
  const tokenInfo = await tokenInfoResponse.json().catch(() => ({}));
  if (!tokenInfoResponse.ok) {
    throw googleAuthError(tokenInfo.error_description || 'Google access token is invalid', 401);
  }

  const audience = String(tokenInfo.aud || tokenInfo.audience || '');
  if (audience && audience !== clientId) {
    throw googleAuthError('Google token was issued for a different client', 401);
  }

  const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userinfo = await userinfoResponse.json().catch(() => ({}));
  if (!userinfoResponse.ok) {
    throw googleAuthError(userinfo.error_description || 'Failed to fetch Google profile', 401);
  }

  return mapGoogleProfile({
    googleId: userinfo.sub,
    email: userinfo.email,
    fullName: userinfo.name,
    givenName: userinfo.given_name,
    familyName: userinfo.family_name,
    picture: userinfo.picture,
    locale: userinfo.locale,
    emailVerified: userinfo.email_verified,
  });
}

async function verifyGoogleIdToken(idToken, clientId) {
  const authClient = new OAuth2Client(clientId);
  const ticket = await authClient.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload() || {};
  return mapGoogleProfile({
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name,
    givenName: payload.given_name,
    familyName: payload.family_name,
    picture: payload.picture,
    locale: payload.locale,
    emailVerified: payload.email_verified,
  });
}

export async function verifyGoogleLogin({ idToken, accessToken } = {}) {
  if (idToken === 'mock-google-token') {
    throw googleAuthError('Google simulation is disabled. Use real Google Sign-In.');
  }

  const { clientId, configured, enabled } = await getGoogleAuthConfig();
  if (!configured) {
    throw googleAuthError('Google Sign-In is not configured');
  }
  if (!enabled) {
    throw googleAuthError('Google Login is disabled by administrator settings');
  }

  const profile = accessToken
    ? await verifyGoogleAccessToken(accessToken, clientId)
    : idToken
      ? await verifyGoogleIdToken(idToken, clientId)
      : null;

  if (!profile) {
    throw googleAuthError('Google ID token or access token is required');
  }
  if (!profile.googleId || !profile.email) {
    throw googleAuthError('Google did not return a verified email address', 401);
  }
  if (!profile.emailVerified) {
    throw googleAuthError('Google email address is not verified', 401);
  }

  return profile;
}

export function isDefaultProfilePhoto(src) {
  const value = String(src || '');
  return !value || value.includes('manportrait');
}
