const PASSWORD_MAX_LENGTH = 128;

export function getPasswordPolicyError(password, email = '') {
  if (typeof password !== 'string' || password.length < 8 || password.length > PASSWORD_MAX_LENGTH) {
    return 'Password must be between 8 and 128 characters.';
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, number, and symbol characters.';
  }
  if (/(.)\1{3,}/.test(password)) {
    return 'Password must not contain four repeated characters.';
  }
  const localPart = String(email).trim().toLowerCase().split('@')[0];
  if (localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
    return 'Password must not contain your email username.';
  }
  return null;
}
