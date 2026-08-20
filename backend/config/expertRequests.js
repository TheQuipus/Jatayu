import 'dotenv/config';

function positiveHours(name, fallback) {
  const rawValue = process.env[name];
  const value = rawValue === undefined || rawValue === '' ? fallback : Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number of hours`);
  }
  return value;
}

export const EXPERT_REQUEST_NEW_HOURS = positiveHours('EXPERT_REQUEST_NEW_HOURS', 1);
export const EXPERT_REQUEST_RESPONSE_HOURS = positiveHours('EXPERT_REQUEST_RESPONSE_HOURS', 24);

export const EXPERT_REQUEST_NEW_WINDOW_MS = EXPERT_REQUEST_NEW_HOURS * 60 * 60 * 1000;
export const EXPERT_REQUEST_RESPONSE_WINDOW_MS = EXPERT_REQUEST_RESPONSE_HOURS * 60 * 60 * 1000;
