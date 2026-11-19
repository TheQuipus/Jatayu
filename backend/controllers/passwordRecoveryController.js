import { consumePasswordReset, issuePasswordReset } from '../utils/passwordRecovery.js';
import { getPasswordPolicyError } from '../utils/passwordPolicy.js';

const ROLES = new Set(['admin', 'expert', 'user']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const GENERIC_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

export async function requestPasswordReset(req, res) {
  const role = String(req.body?.role || '').trim().toLowerCase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!ROLES.has(role) || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(422).json({ message: 'Enter a valid email address and account type.' });
  }
  try {
    await issuePasswordReset({ role, email });
    return res.status(202).json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('[Password Recovery] Unable to send reset email:', error.message);
    return res.status(202).json({ message: GENERIC_MESSAGE });
  }
}

export async function resetPassword(req, res) {
  const role = String(req.body?.role || '').trim().toLowerCase();
  const userId = String(req.body?.userId || '').trim();
  const token = String(req.body?.token || '').trim();
  const password = req.body?.password;
  const passwordError = getPasswordPolicyError(password);
  if (!ROLES.has(role) || !userId || !TOKEN_PATTERN.test(token) || passwordError) {
    return res.status(422).json({ message: passwordError || 'The password reset request is invalid.' });
  }
  try {
    const changed = await consumePasswordReset({ role, userId, token, password });
    if (!changed) return res.status(400).json({ message: 'This password reset link is invalid or has expired.' });
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Password Recovery] Unable to reset password:', error.message);
    return res.status(500).json({ message: 'Unable to reset the password right now. Please try again later.' });
  }
}
