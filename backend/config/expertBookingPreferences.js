const DEFAULTS = Object.freeze({
  autoAcceptBookings: false,
  allowInstantBookings: false,
  syncCalendar: true,
  automatedReminders: true,
  minimumNoticeMinutes: 120,
  advanceBookingWindowDays: 90,
});

function objectValue(value) {
  let parsed = value;
  for (let attempt = 0; attempt < 3 && typeof parsed === 'string'; attempt += 1) {
    try { parsed = JSON.parse(parsed); } catch { return {}; }
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : fallback;
}

export function normalizeExpertBookingPreferences(value) {
  const input = objectValue(value);
  return {
    autoAcceptBookings: input.autoAcceptBookings === true,
    allowInstantBookings: input.allowInstantBookings === true,
    syncCalendar: true,
    automatedReminders: input.automatedReminders !== false,
    minimumNoticeMinutes: boundedInteger(input.minimumNoticeMinutes, DEFAULTS.minimumNoticeMinutes, 0, 10080),
    advanceBookingWindowDays: boundedInteger(input.advanceBookingWindowDays, DEFAULTS.advanceBookingWindowDays, 1, 365),
  };
}

export function getExpertBookingPreferences(expert) {
  const metadata = objectValue(expert?.onboardingMetadata);
  return normalizeExpertBookingPreferences(metadata.bookingPreferences);
}

export function effectiveExpertLeadTimeMinutes(expert, globalMinimumLeadTimeMinutes) {
  const preferences = getExpertBookingPreferences(expert);
  return preferences.allowInstantBookings
    ? preferences.minimumNoticeMinutes
    : Math.max(globalMinimumLeadTimeMinutes, preferences.minimumNoticeMinutes);
}

export const DEFAULT_EXPERT_BOOKING_PREFERENCES = DEFAULTS;
