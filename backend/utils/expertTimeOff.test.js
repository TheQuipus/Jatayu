import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTimeOff, expertTimeOffSlots } from './expertTimeOff.js';

const range = { title: 'Vacation', fromDate: '2026-09-20', toDate: '2026-09-21' };
test('validates date ranges and supports removing all time off', () => {
  assert.deepEqual(validateTimeOff([]), []);
  assert.throws(() => validateTimeOff([{ ...range, fromDate: '2026-02-30' }]));
  assert.throws(() => validateTimeOff([{ ...range, toDate: '2026-09-19' }]));
  assert.throws(() => validateTimeOff([{ ...range, title: '' }]));
});
test('inclusive India dates become exclusive-end UTC blocking intervals', () => {
  assert.deepEqual(expertTimeOffSlots({ timezone: 'Asia/Kolkata', onboardingMetadata: JSON.stringify({ timeOff: [range] }) }), [
    { startAt: '2026-09-19T18:30:00.000Z', endAt: '2026-09-21T18:30:00.000Z' },
  ]);
});
test('handles daylight-saving boundary and absent time off', () => {
  assert.deepEqual(expertTimeOffSlots({}), []);
  assert.deepEqual(expertTimeOffSlots({ timezone: 'America/New_York', onboardingMetadata: { timeOff: [
    { title: 'Away', fromDate: '2026-03-08', toDate: '2026-03-08' },
  ] } }), [{ startAt: '2026-03-08T05:00:00.000Z', endAt: '2026-03-09T04:00:00.000Z' }]);
});
