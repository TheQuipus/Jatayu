import Seeker from '../models/seeker/Seeker.js';

export async function isValidSeekerRegistrationEmail(value) {
  if (typeof value !== 'string' || value.trim().length > 254) return false;

  try {
    await Seeker.build({ email: value.trim() }).validate({ fields: ['email'] });
    return true;
  } catch (error) {
    if (error.name === 'SequelizeValidationError') return false;
    throw error;
  }
}

export function isValidSeekerRegistrationPhone(value) {
  return typeof value === 'string' && /^\d{10}$/.test(value);
}