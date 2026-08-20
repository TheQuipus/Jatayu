/**
 * One-off SMTP delivery test. Usage:
 *   node scripts/testSmtpEmail.js sarangafle@gmail.com
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { sequelize } from '../models/index.js';
import { getSetting } from '../utils/settingsHelper.js';

dotenv.config();

const recipient = process.argv[2] || 'sarangafle@gmail.com';

async function trySend({ host, port, secure, user, pass, fromEmail }) {
  console.log(`\n--- Trying ${host}:${port} secure=${secure} ---`);
  const transport = nodemailer.createTransport({
    host,
    port: Number(port),
    secure,
    auth: { user, pass },
    connectionTimeout: 20000,
    socketTimeout: 20000,
    greetingTimeout: 10000,
    tls: { servername: host },
  });

  await transport.verify();
  console.log('SMTP verify OK');

  const info = await transport.sendMail({
    from: `"Jatayu" <${fromEmail}>`,
    to: recipient,
    subject: 'Jatayu SMTP test',
    text: `Test email sent at ${new Date().toISOString()}. If you received this, SMTP is working.`,
    html: `<p>Test email sent at <strong>${new Date().toISOString()}</strong>.</p><p>If you received this, SMTP is working.</p>`,
  });

  console.log('Message sent:', info.messageId);
  console.log('Response:', info.response);
  return true;
}

async function main() {
  await sequelize.authenticate();

  const smtpHost = await getSetting('SMTP_HOST', 'smtp.hostinger.com');
  const smtpUser = await getSetting('SMTP_USER');
  const smtpPass = await getSetting('SMTP_PASS');
  const fromEmail = await getSetting('FROM_EMAIL', smtpUser);
  const dbPort = await getSetting('SMTP_PORT', '465');
  const dbSecure = (await getSetting('SMTP_SECURE', 'true')) === 'true';

  console.log('Settings:', {
    smtpHost,
    smtpUser,
    fromEmail,
    dbPort,
    dbSecure,
    recipient,
  });

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER or SMTP_PASS missing in settings');
  }

  const attempts = [
    { port: dbPort, secure: dbSecure },
    { port: 465, secure: true },
    { port: 587, secure: false },
  ];

  const seen = new Set();
  for (const attempt of attempts) {
    const key = `${attempt.port}-${attempt.secure}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      await trySend({
        host: smtpHost,
        port: attempt.port,
        secure: attempt.secure,
        user: smtpUser,
        pass: smtpPass,
        fromEmail,
      });
      console.log('\nSUCCESS — check inbox for:', recipient);
      process.exit(0);
    } catch (err) {
      console.error('FAILED:', err.message);
    }
  }

  console.error('\nAll SMTP attempts failed.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
