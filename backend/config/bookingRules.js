import { getDatabaseSetting } from '../utils/settingsHelper.js';

export async function getBookingRules() {
  const rawLeadTime = await getDatabaseSetting('BOOKING_MINIMUM_LEAD_TIME_MINUTES', '30');
  const parsedLeadTime = Number(rawLeadTime);
  return {
    minimumLeadTimeMinutes: Number.isFinite(parsedLeadTime) && parsedLeadTime >= 0
      ? parsedLeadTime
      : 30,
  };
}
