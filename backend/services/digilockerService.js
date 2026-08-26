import crypto from 'crypto';
import { getDatabaseSetting, getDatabaseSettingBool } from '../utils/settingsHelper.js';

const REQUIRED_KEYS = [
  'DIGILOCKER_CLIENT_ID',
  'DIGILOCKER_CLIENT_SECRET',
  'DIGILOCKER_REDIRECT_URI',
  'DIGILOCKER_AUTHORIZATION_URL',
  'DIGILOCKER_TOKEN_URL',
];

export class DigilockerConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DigilockerConfigurationError';
    this.code = 'DIGILOCKER_NOT_CONFIGURED';
  }
}

export async function getDigilockerConfig() {
  const values = await Promise.all([
    getDatabaseSettingBool('DIGILOCKER_ENABLED', false),
    ...REQUIRED_KEYS.map((key) => getDatabaseSetting(key)),
    getDatabaseSetting('DIGILOCKER_ISSUED_DOCUMENTS_URL'),
    getDatabaseSetting('DIGILOCKER_SCOPES', 'openid profile'),
    getDatabaseSetting('DIGILOCKER_FRONTEND_RETURN_URL', 'http://localhost:3000/expert/expert-onboarding/'),
    getDatabaseSettingBool('DIGILOCKER_SANDBOX', true),
  ]);
  const [enabled, clientId, clientSecret, redirectUri, authorizationUrl, tokenUrl,
    accountUrl, issuedDocumentsUrl, scopes, frontendReturnUrl, sandbox] = values;
  const config = {
    enabled, clientId, clientSecret, redirectUri, authorizationUrl, tokenUrl,
    accountUrl, issuedDocumentsUrl, scopes, frontendReturnUrl, sandbox,
  };
  const missing = REQUIRED_KEYS.filter((key) => {
    const property = {
      DIGILOCKER_CLIENT_ID: 'clientId', DIGILOCKER_CLIENT_SECRET: 'clientSecret',
      DIGILOCKER_REDIRECT_URI: 'redirectUri', DIGILOCKER_AUTHORIZATION_URL: 'authorizationUrl',
      DIGILOCKER_TOKEN_URL: 'tokenUrl',
    }[key];
    return !config[property];
  });
  return { ...config, configured: enabled && missing.length === 0, missing };
}

export function createAuthorization(config) {
  if (!config.configured) {
    throw new DigilockerConfigurationError(`DigiLocker is disabled or missing: ${config.missing.join(', ')}`);
  }
  const state = crypto.randomBytes(32).toString('base64url');
  const codeVerifier = crypto.randomBytes(64).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const url = new URL(config.authorizationUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (config.scopes) url.searchParams.set('scope', config.scopes);
  return { authorizationUrl: url.toString(), state, codeVerifier };
}

export function hashState(state) {
  return crypto.createHash('sha256').update(state).digest('hex');
}

async function readJsonResponse(response, operation) {
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : {}; } catch { data = { raw: body.slice(0, 500) }; }
  if (!response.ok) {
    const error = new Error(`${operation} failed with HTTP ${response.status}`);
    error.code = data.error || data.code || `HTTP_${response.status}`;
    error.providerDescription = data.error_description || data.message || operation;
    throw error;
  }
  return data;
}

export async function exchangeAuthorizationCode(config, code, codeVerifier) {
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  return readJsonResponse(response, 'DigiLocker token exchange');
}

export async function fetchDigilockerResource(url, accessToken, operation) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  return readJsonResponse(response, operation);
}

export function readIdTokenClaims(idToken, clientId) {
  if (!idToken || typeof idToken !== 'string') return null;
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('DigiLocker returned an invalid ID token');
  let claims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('DigiLocker returned unreadable ID token claims');
  }
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.aud && !audiences.includes(clientId)) {
    throw new Error('DigiLocker ID token audience does not match this client');
  }
  if (claims.exp && Number(claims.exp) * 1000 <= Date.now()) {
    throw new Error('DigiLocker returned an expired ID token');
  }
  return claims;
}

export function safeAccountDetails(data = {}) {
  const allowed = [
    'digilockerid', 'id', 'sub', 'name', 'given_name', 'dob', 'birthdate',
    'gender', 'eaadhaar', 'mobile', 'phone_number', 'email',
  ];
  return Object.fromEntries(allowed.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
}
