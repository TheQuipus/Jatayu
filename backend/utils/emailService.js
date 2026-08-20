import dns from 'dns';
import nodemailer from 'nodemailer';
import { getSetting, getSettingBool } from './settingsHelper.js';

function ipv4Lookup(hostname, options, callback) {
  dns.lookup(hostname, { family: 4, all: false }, callback);
}

function resolveSmtpIpv4(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4, all: false }, (err, address) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

const OTP_EXPIRY_MINUTES = 10;

function hasPlaceholderCredential(value) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return (
    normalized.includes('your_email') ||
    normalized.includes('your_twilio') ||
    normalized.includes('app_password') ||
    normalized.includes('change_me')
  );
}

export async function isSmtpConfigured() {
  const smtpHost = await getSetting('SMTP_HOST');
  const smtpPort = await getSetting('SMTP_PORT', '587');
  const smtpUser = await getSetting('SMTP_USER');
  const smtpPass = await getSetting('SMTP_PASS');

  return Boolean(
    smtpHost && smtpPort && smtpUser && smtpPass &&
    !hasPlaceholderCredential(smtpUser) &&
    !hasPlaceholderCredential(smtpPass)
  );
}

function buildOtpHtml(recipientName, otpCode) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 480px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px; color: #1a1a2e;">Verify your email</h2>
      <p>Hello ${recipientName || 'there'},</p>
      <p>Your one-time verification code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; color: #4f46e5;">${otpCode}</p>
      <p>This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <p style="color: #888; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
}

/**
 * Send OTP via Brevo (Sendinblue) HTTP API — works over HTTPS port 443.
 * This bypasses SMTP firewall blocks entirely.
 */
async function sendViaBrevo({ recipientEmail, recipientName, otpCode, fromEmail, brevoApiKey }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Jatayu', email: fromEmail },
      to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
      subject: 'Your Jatayu verification code',
      htmlContent: buildOtpHtml(recipientName, otpCode),
      textContent: `Your Jatayu verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error: ${error.message || response.statusText}`);
  }

  console.log(`[Email] OTP sent via Brevo to ${recipientEmail}`);
}

function buildSmtpTransport({ smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, tlsServername }) {
  const port = Number(smtpPort);
  const secure = smtpSecure === 'true' || port === 465;

  return nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 20000,
    socketTimeout: 20000,
    greetingTimeout: 10000,
    lookup: ipv4Lookup,
    tls: { servername: tlsServername || smtpHost },
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
  });
}

/**
 * Send OTP via SMTP (nodemailer).
 * Tries configured port first, then falls back to 465/SSL when 587 is blocked.
 */
async function sendViaSmtp({ recipientEmail, recipientName, otpCode, fromEmail, fromName, smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure }) {
  const smtpAddress = await resolveSmtpIpv4(smtpHost);
  const attempts = [
    { port: smtpPort, secure: smtpSecure },
    { port: '465', secure: 'true' },
    { port: '587', secure: 'false' },
  ];

  const seen = new Set();
  let lastError;

  for (const attempt of attempts) {
    const key = `${attempt.port}-${attempt.secure}`;
    if (seen.has(key)) continue;
    seen.add(key);

    console.log(`[Email] Connecting to SMTP: ${smtpHost} (${smtpAddress}):${attempt.port} (secure=${attempt.secure})`);

    try {
      const client = buildSmtpTransport({
        smtpHost: smtpAddress,
        tlsServername: smtpHost,
        smtpPort: attempt.port,
        smtpUser,
        smtpPass,
        smtpSecure: attempt.secure,
      });

      await client.sendMail({
        from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
        to: recipientEmail,
        subject: 'Your Jatayu verification code',
        html: buildOtpHtml(recipientName, otpCode),
        text: `Your Jatayu verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      });

      console.log(`[Email] OTP sent via SMTP to ${recipientEmail}`);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[Email] SMTP attempt failed (${smtpHost}:${attempt.port}):`, err.message);
    }
  }

  throw lastError || new Error('All SMTP delivery attempts failed.');
}

export async function sendOtpEmail({ recipientEmail, recipientName, otpCode }) {
  const emailEnabled = await getSettingBool('EMAIL_ENABLED', true);
  const emailProvider = await getSetting('EMAIL_PROVIDER', 'smtp');
  const fromEmail = await getSetting('FROM_EMAIL', 'noreply@jatayu.com');
  const fromName = await getSetting('EMAIL_FROM_NAME', 'Jatayu');
  const brevoApiKey = await getSetting('BREVO_API_KEY');

  // --- Brevo API path ---
  if (emailProvider === 'brevo' && brevoApiKey && !hasPlaceholderCredential(brevoApiKey)) {
    if (!emailEnabled) {
      console.log(`[Email OTP Dev] Brevo disabled. To: ${recipientEmail} | Code: ${otpCode}`);
      return;
    }
    return sendViaBrevo({ recipientEmail, recipientName, otpCode, fromEmail, brevoApiKey });
  }

  // --- SMTP path ---
  const smtpHost = await getSetting('SMTP_HOST');
  const smtpPort = await getSetting('SMTP_PORT', '587');
  const smtpUser = await getSetting('SMTP_USER');
  const smtpPass = await getSetting('SMTP_PASS');
  const smtpSecure = await getSetting('SMTP_SECURE', 'false');

  const smtpConfigured = await isSmtpConfigured();

  if (!smtpConfigured || !emailEnabled) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`[Email OTP Dev] To: ${recipientEmail}`);
      console.log(`Verification Code: ${otpCode}`);
      console.log(`======================================================\n`);
      return;
    }
    throw new Error('Email is not configured. Set SMTP credentials or configure Brevo API key in admin settings.');
  }

  return sendViaSmtp({
    recipientEmail,
    recipientName,
    otpCode,
    fromEmail,
    fromName,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpSecure,
  });
}
