import { getDatabaseSetting } from '../utils/settingsHelper.js';

function positiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const DEFAULT_BOOKING_POKE_CONFIG = {
  initialDelayMs: 60 * 60 * 1000,
  cooldownMs: 4 * 60 * 60 * 1000,
  maxCount: 2,
};

export async function getBookingPokeConfig() {
  const [initialHours, cooldownHours, maxCount] = await Promise.all([
    getDatabaseSetting('BOOKING_POKE_INITIAL_DELAY_HOURS', '1'),
    getDatabaseSetting('BOOKING_POKE_COOLDOWN_HOURS', '4'),
    getDatabaseSetting('BOOKING_POKE_MAX_COUNT', '2'),
  ]);
  return {
    initialDelayMs: positiveNumber(Number(initialHours), 1) * 60 * 60 * 1000,
    cooldownMs: positiveNumber(Number(cooldownHours), 4) * 60 * 60 * 1000,
    maxCount: Math.floor(positiveNumber(Number(maxCount), 2)),
  };
}
