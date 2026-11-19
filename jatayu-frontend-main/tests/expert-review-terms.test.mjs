import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';

const reviewStep = fs.readFileSync(
  new URL('../components/expert/onboarding/ReviewStep.tsx', import.meta.url),
  'utf8',
);
const reviewStyles = fs.readFileSync(
  new URL('../components/expert/onboarding/ReviewStep.module.css', import.meta.url),
  'utf8',
);
const onboardingPage = fs.readFileSync(
  new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
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

test('profile preview renders current onboarding data in profile and detail sections', () => {
  for (const section of [
    'Profile preview',
    'Experience',
    'Education',
    'Consultation Details',
    'Audience & Languages',
    'Portfolio',
    'Credentials',
    'Availability',
  ]) {
    assert.ok(reviewStep.includes(section), `preview should retain ${section}`);
  }
  assert.match(reviewStep, /profileName \|\| "Name not provided"/);
  assert.match(reviewStep, /profilePhotoSrc/);
  assert.match(reviewStep, /location\.trim\(\)/);
  assert.match(onboardingPage, /setProfileLocation\(getExpertProfileLocation\(metadata\)\)/);
  assert.match(onboardingPage, /location=\{profileLocation\}/);
  assert.match(reviewStep, /filledEmployment\.map/);
  assert.match(reviewStep, /filledEducation\.map/);
  assert.match(reviewStep, /formatPositionDates\(position\)/);
  assert.match(reviewStep, /formatPreferencesPricingSummary\(selectedFormats, formatPrices\)/);
  assert.match(reviewStep, /selectedLengths\.map\(getSessionLengthLabel\)/);
  assert.match(reviewStep, /selectedAudiences\.map/);
  assert.match(reviewStep, /languages\.join\(", "\)/);
  assert.doesNotMatch(reviewStep, /0\.0|0 Sessions Completed/);
});

test('profile preview remains responsive and preserves Back and submission callbacks', () => {
  assert.match(reviewStyles, /@media \(max-width: 700px\)/);
  assert.match(reviewStyles, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(reviewStyles, /overflow-wrap: anywhere/);
  assert.match(reviewStep, /onClick=\{onBack\}/);
  assert.match(reviewStep, /onClick=\{\(\) =>\s*onSubmit\(\{/);
  assert.match(reviewStep, /termsAccepted: agreedToTerms/);
  assert.match(reviewStep, /disabled=\{!agreedToTerms\}/);
});
