import assert from 'node:assert/strict';
import test from 'node:test';
import {
  effectiveExpertLeadTimeMinutes,
  getExpertBookingPreferences,
  normalizeExpertBookingPreferences,
} from './expertBookingPreferences.js';

test('normalizes expert booking preferences', () => {
  assert.deepEqual(normalizeExpertBookingPreferences({
    autoAcceptBookings: true,
    allowInstantBookings: true,
    minimumNoticeMinutes: 60,
    advanceBookingWindowDays: 30,
  }), {
    autoAcceptBookings: true,
    allowInstantBookings: true,
    syncCalendar: true,
    automatedReminders: true,
    minimumNoticeMinutes: 60,
    advanceBookingWindowDays: 30,
  });
});

test('instant bookings bypass the global lead time but retain expert notice', () => {
  const instantExpert = {
    onboardingMetadata: { bookingPreferences: { allowInstantBookings: true, minimumNoticeMinutes: 15 } },
  };
  const standardExpert = {
    onboardingMetadata: { bookingPreferences: { allowInstantBookings: false, minimumNoticeMinutes: 15 } },
  };
  assert.equal(effectiveExpertLeadTimeMinutes(instantExpert, 120), 15);
  assert.equal(effectiveExpertLeadTimeMinutes(standardExpert, 120), 120);
});

test('reads preferences from serialized metadata', () => {
  const preferences = getExpertBookingPreferences({
    onboardingMetadata: JSON.stringify({ bookingPreferences: { autoAcceptBookings: true } }),
  });
  assert.equal(preferences.autoAcceptBookings, true);
  assert.equal(preferences.syncCalendar, true);
});

test('calendar sync remains enabled even when an old profile stored false', () => {
  assert.equal(normalizeExpertBookingPreferences({ syncCalendar: false }).syncCalendar, true);
});
