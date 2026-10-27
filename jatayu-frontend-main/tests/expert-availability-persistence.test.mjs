import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';

const page = fs.readFileSync(
  new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
  'utf8',
);
const step = fs.readFileSync(
  new URL('../components/expert/onboarding/AvailabilityStep.tsx', import.meta.url),
  'utf8',
);
const availability = fs.readFileSync(
  new URL('../components/expert/availability/ExpertAvailability.tsx', import.meta.url),
  'utf8',
);

test('availability drafts are retained in the parent even when invalid', () => {
  assert.match(page, /useState<TimeSlot\[\] \| null>\(null\)/);
  assert.match(page, /setAvailabilitySlots\(slots\)/);
  assert.match(availability, /variant === "onboarding" \|\| \(isValid && timezone\)/);
});

test('Step 8 restores the parent timezone and slots when it mounts again', () => {
  assert.match(page, /initialTimezone=\{timezone \|\| undefined\}/);
  assert.match(page, /initialSlots=\{availabilitySlots \?\? undefined\}/);
  assert.match(step, /initialTimezone=\{initialTimezone\}/);
  assert.match(step, /initialSlots=\{initialSlots\}/);
  assert.match(availability, /useState<TimeSlot\[\]>\(\(\) => initialSlots \?\? \[DEFAULT_SLOT\]\)/);
});

test('Continue saves the retained schedule and review receives an array', () => {
  assert.match(page, /\(availabilitySlots \?\? \[\]\)\.map\(\(slot\) =>/);
  assert.match(page, /availabilitySlots=\{availabilitySlots \?\? \[\]\}/);
});
