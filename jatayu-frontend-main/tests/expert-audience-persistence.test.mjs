import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';

const page = fs.readFileSync(
  new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
  'utf8',
);
const audienceStep = fs.readFileSync(
  new URL('../components/expert/onboarding/AudienceStep.tsx', import.meta.url),
  'utf8',
);

test('parent passes saved languages and audiences back to Step 7 on remount', () => {
  assert.match(page, /initialLanguages=\{languages\}/);
  assert.match(page, /initialAudiences=\{selectedAudiences\}/);
  assert.match(page, /setLanguages\(nextLanguages\)/);
  assert.match(page, /setSelectedAudiences\(audiences\)/);
});

test('Step 7 restores preset and custom languages and selected audience types', () => {
  assert.match(audienceStep, /useState<string\[\]>\(\(\) => initialLanguages\)/);
  assert.match(
    audienceStep,
    /initialLanguages\.filter\(\(language\) => !PRESET_LANGUAGES\.includes\(language\)\)/,
  );
  assert.match(audienceStep, /useState<string\[\]>\(\(\) => initialAudiences\)/);
  assert.match(audienceStep, /onContinueWithAudience\?\.\(\{ languages, audiences: selectedAudiences \}\)/);
});
