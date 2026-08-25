import { getDatabaseSetting, getDatabaseSettingBool } from './settingsHelper.js';

function linkedinAuthError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isPlaceholder(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('your_linkedin') || normalized.includes('placeholder');
}

export async function getLinkedinAuthConfig() {
  const clientId = String((await getDatabaseSetting('LINKEDIN_CLIENT_ID')) || '').trim();
  const clientSecret = String((await getDatabaseSetting('LINKEDIN_CLIENT_SECRET')) || '').trim();
  const redirectUriSetting = String(
    (await getDatabaseSetting('LINKEDIN_REDIRECT_URIS'))
      || (await getDatabaseSetting('LINKEDIN_REDIRECT_URI'))
      || '',
  );
  const redirectUris = redirectUriSetting.split(',').map((value) => value.trim()).filter(Boolean);
  const enabledSetting = await getDatabaseSettingBool('LINKEDIN_LOGIN_ENABLED', true);
  const configured = !isPlaceholder(clientId) && !isPlaceholder(clientSecret) && redirectUris.length > 0;

  return {
    clientId,
    clientSecret,
    redirectUris,
    configured,
    enabled: configured && enabledSetting,
  };
}

export async function verifyLinkedinLogin({ authCode, redirectUri } = {}) {
  if (!authCode) {
    throw linkedinAuthError('LinkedIn authorization code is required');
  }

  const config = await getLinkedinAuthConfig();
  if (!config.configured) {
    throw linkedinAuthError('LinkedIn Sign-In is not configured', 503);
  }
  if (!config.enabled) {
    throw linkedinAuthError('LinkedIn Login is disabled by administrator settings', 403);
  }
  const requestedRedirectUri = String(redirectUri || '').trim();
  const selectedRedirectUri = requestedRedirectUri || (config.redirectUris.length === 1 ? config.redirectUris[0] : '');
  if (!selectedRedirectUri || !config.redirectUris.includes(selectedRedirectUri)) {
    throw linkedinAuthError('LinkedIn redirect URI does not match the configured redirect URI');
  }

  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: selectedRedirectUri,
    }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw linkedinAuthError(tokenData.error_description || 'Failed to exchange LinkedIn authorization code', 401);
  }

  const userinfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userinfo = await userinfoResponse.json().catch(() => ({}));
  if (!userinfoResponse.ok) {
    throw linkedinAuthError(userinfo.error_description || 'Failed to fetch LinkedIn profile', 401);
  }

  const linkedinId = String(userinfo.sub || '').trim();
  const email = String(userinfo.email || '').trim().toLowerCase();
  const fullName = String(
    userinfo.name || [userinfo.given_name, userinfo.family_name].filter(Boolean).join(' '),
  ).trim();

  if (!linkedinId || !email) {
    throw linkedinAuthError('LinkedIn did not return an email address', 401);
  }

  return {
    linkedinId,
    email,
    fullName,
    picture: String(userinfo.picture || '').trim(),
    emailVerified: userinfo.email_verified === true,
  };
}
