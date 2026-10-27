import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';

const reviewStep = fs.readFileSync(
  new URL('../components/expert/onboarding/ReviewStep.tsx', import.meta.url),
  'utf8',
);

test('only the checkbox is associated with toggling agreement state', () => {
  const termsMarkup = reviewStep.match(
    /<div className=\{styles\.termsBar\}>[\s\S]*?<\/div>\s*<\/div>/,
  )?.[0];
  assert.ok(termsMarkup, 'terms agreement container should be present');
  assert.match(termsMarkup, /<input[\s\S]*?type="checkbox"[\s\S]*?checked=\{agreedToTerms\}[\s\S]*?onChange=\{\(e\) => setAgreedToTerms\(e\.target\.checked\)\}/);
  assert.match(termsMarkup, /aria-label="By submitting, you agree to our terms and privacy policy"/);
  assert.doesNotMatch(termsMarkup, /<label|<\/label>/);
  assert.match(termsMarkup, /href="\/terms"/);
  assert.match(termsMarkup, /href="\/privacy"/);
});
