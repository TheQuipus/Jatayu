import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeCategoryKey,
  normalizeFormatKey,
  normalizeLanguageKey,
} from './expertCategory.js';

const CATEGORY_COUNTERPART_FIXTURES = [
  // Seeker onboarding ids & labels -> Expert onboarding labels & legacy tags
  { canonical: 'software', seekerValues: ['software', 'Software & Development', 'Technology'], expertValues: ['Software Engineering'] },
  { canonical: 'design', seekerValues: ['design', 'Design & Creative'], expertValues: ['Product Design'] },
  { canonical: 'business', seekerValues: ['business', 'Business & Consulting', 'business-entrepreneurship', 'Business & Entrepreneurship'], expertValues: ['Business Strategy', 'Startup & Fundraising', 'Startup', 'SMB Growth'] },
  { canonical: 'marketing', seekerValues: ['marketing', 'Marketing & Growth', 'Marketing'], expertValues: ['Marketing & Growth'] },
  { canonical: 'finance', seekerValues: ['finance', 'Finance & Tax', 'finance-investment', 'Finance & Investment', 'Finance'], expertValues: ['Finance & VC', 'Tax & Finance'] },
  { canonical: 'health', seekerValues: ['health', 'Health & Wellness'], expertValues: ['Health & Wellness', 'Healthcare'] },
  { canonical: 'legal', seekerValues: ['legal', 'Legal & Founder Contracts', 'legal-compliance', 'Legal & Compliance', 'Legal'], expertValues: ['Legal & Compliance'] },
  { canonical: 'product', seekerValues: ['product', 'Product Management'], expertValues: ['Product Management'] },
  { canonical: 'data', seekerValues: ['data', 'Data & Analytics'], expertValues: ['Data Science'] },
  { canonical: 'career-work', seekerValues: ['career-work', 'Career & Work', 'Career'], expertValues: ['Career & Jobs', 'Career'] },
  { canonical: 'personal-growth', seekerValues: ['personal-growth', 'Personal Growth'], expertValues: ['Personal Growth'] },
];

test('normalizeCategoryKey maps every seeker id/label and expert label to its canonical key', () => {
  for (const fixture of CATEGORY_COUNTERPART_FIXTURES) {
    for (const seekerVal of fixture.seekerValues) {
      assert.equal(
        normalizeCategoryKey(seekerVal),
        fixture.canonical,
        `Expected seeker value "${seekerVal}" to map to "${fixture.canonical}"`,
      );
    }
    for (const expertVal of fixture.expertValues) {
      assert.equal(
        normalizeCategoryKey(expertVal),
        fixture.canonical,
        `Expected expert value "${expertVal}" to map to "${fixture.canonical}"`,
      );
    }
  }
});

test('normalizeCategoryKey treats other-not-sure as empty and preserves custom categories', () => {
  assert.equal(normalizeCategoryKey('other-not-sure'), '');
  assert.equal(normalizeCategoryKey('Other'), '');
  assert.equal(normalizeCategoryKey(''), '');
  assert.equal(normalizeCategoryKey('custom-vastu-shastra'), 'vastu shastra');
  assert.equal(normalizeCategoryKey('Vastu Shastra'), 'vastu shastra');
});

test('normalizeFormatKey normalizes format aliases', () => {
  assert.equal(normalizeFormatKey('written'), 'written');
  assert.equal(normalizeFormatKey('text'), 'written');
  assert.equal(normalizeFormatKey('chat'), 'written');
  assert.equal(normalizeFormatKey('video'), 'video');
  assert.equal(normalizeFormatKey('shoutout'), 'shoutout');
  assert.equal(normalizeFormatKey('audio'), 'shoutout');
  assert.equal(normalizeFormatKey('group'), 'group');
  assert.equal(normalizeFormatKey('consultation'), 'consultation');
});

test('normalizeLanguageKey trims, lowercases, and expands ISO codes', () => {
  assert.equal(normalizeLanguageKey(' English '), 'english');
  assert.equal(normalizeLanguageKey('en'), 'english');
  assert.equal(normalizeLanguageKey('HI'), 'hindi');
  assert.equal(normalizeLanguageKey('ta'), 'tamil');
  assert.equal(normalizeLanguageKey(''), '');
});
