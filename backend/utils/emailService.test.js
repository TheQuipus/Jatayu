import assert from 'node:assert/strict';
import test from 'node:test';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { Setting } from '../models/index.js';
import { isSmtpConfigured, sendGenericEmail } from './emailService.js';

test('email configuration uses admin settings exclusively', async (t) => {
  const saved = new Map();
  t.mock.method(Setting, 'findByPk', async (key) => saved.has(key) ? { value: saved.get(key) } : null);
  const env = {
    SMTP_HOST: 'smtp.env.invalid', SMTP_PORT: '465', SMTP_USER: 'env@example.com',
    SMTP_PASS: 'env-test-secret', SMTP_USERNAME: 'alias@example.com',
    SMTP_PASSWORD: 'alias-test-secret', EMAIL_ENABLED: 'true',
  };
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  assert.equal(await isSmtpConfigured(), false, 'environment credentials must not enable SMTP');
  saved.set('SMTP_HOST', 'smtp.admin.invalid');
  saved.set('SMTP_USER', 'admin@example.com');
  saved.set('SMTP_PASS', 'admin-test-secret');
  assert.equal(await isSmtpConfigured(), true);
  saved.delete('SMTP_PASS');
  assert.equal(await isSmtpConfigured(), false, 'missing admin password must not fall back to environment');
  saved.set('SMTP_PASSWORD', 'admin-alias-test-secret');
  assert.equal(await isSmtpConfigured(), true, 'admin database aliases remain supported');

  saved.set('EMAIL_ENABLED', 'false');
  // A disabled admin switch must return before transport creation, despite EMAIL_ENABLED=true in env.
  await sendGenericEmail({ recipientEmail: 'test@example.com', subject: 'Disabled test' });
});

test('SMTP sender defaults to the mailbox saved in admin', async (t) => {
  const saved = new Map([
    ['SMTP_HOST', 'smtp.admin.invalid'], ['SMTP_USER', 'admin@example.com'],
    ['SMTP_PASS', 'test-secret'], ['SMTP_PORT', '465'],
  ]);
  t.mock.method(Setting, 'findByPk', async (key) => saved.has(key) ? { value: saved.get(key) } : null);
  t.mock.method(dns, 'lookup', (host, options, callback) => callback(null, '192.0.2.1'));
  let message;
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async (mail) => { message = mail; } }));
  await sendGenericEmail({ recipientEmail: 'recipient@example.com', subject: 'Test' });
  assert.equal(message.from, '"Jatayu" <admin@example.com>');
  saved.set('FROM_EMAIL', 'sender@example.com');
  await sendGenericEmail({ recipientEmail: 'recipient@example.com', subject: 'Test' });
  assert.equal(message.from, '"Jatayu" <sender@example.com>');
});
