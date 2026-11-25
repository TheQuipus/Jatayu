import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  evaluateExpertTier,
  parseBudgetRange,
  rankExpertsByPriority,
} from './priorityExpertMatcher.js';

function makeExpert(overrides = {}) {
  return {
    id: overrides.id || 'exp-1',
    fullName: overrides.fullName || 'Expert One',
    professionalTitle: overrides.professionalTitle || 'Advisor',
    tagLine: overrides.tagLine || '',
    bio: overrides.bio || '',
    category: overrides.category || 'Health & Wellness',
    skills: overrides.skills || [],
    focusAreas: overrides.focusAreas || [],
    selectedFormats: overrides.selectedFormats || ['video'],
    formatPrices: overrides.formatPrices || { video: '1500' },
    languages: overrides.languages || ['English'],
    rating: overrides.rating ?? 4.5,
    submittedAt: overrides.submittedAt || '2025-01-10T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2025-01-10T00:00:00.000Z',
    ...overrides,
  };
}

test('assigns Tiers 1 through 5 strictly according to nested criteria', () => {
  const seeker = {
    category: 'health',
    selectedFormats: ['video'],
    selectedBudget: 'budget',
    selectedLanguages: ['english'],
    topics: ['Diet & Nutrition'],
  };

  const t1 = makeExpert({ id: 't1', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '2000' }, languages: ['English'] });
  const t2 = makeExpert({ id: 't2', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '2000' }, languages: ['Tamil'] });
  const t3 = makeExpert({ id: 't3', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '9000' }, languages: ['English'] });
  const t4 = makeExpert({ id: 't4', category: 'Health & Wellness', selectedFormats: ['shoutout'], formatPrices: { shoutout: '1500' }, languages: ['English'] });
  const t5 = makeExpert({ id: 't5', category: 'Software Engineering', skills: ['Corporate Wellness'], selectedFormats: ['video'], formatPrices: { video: '1500' }, languages: ['English'] });

  assert.equal(evaluateExpertTier(seeker, t1).matchTier, 1);
  assert.equal(evaluateExpertTier(seeker, t2).matchTier, 2);
  // Literal nesting check: Category + Format + Language without Price lands in Tier 3, not Tier 1/2
  assert.equal(evaluateExpertTier(seeker, t3).matchTier, 3);
  assert.equal(evaluateExpertTier(seeker, t4).matchTier, 4);
  assert.equal(evaluateExpertTier(seeker, t5).matchTier, 5);

  const ranked = rankExpertsByPriority(seeker, [t5, t4, t3, t2, t1]);
  assert.deepEqual(ranked.map((entry) => entry.expert.id), ['t1', 't2', 't3', 't4', 't5']);
});

test('skips unprovided seeker criteria (budget, language, format) so Tier 1 stays reachable', () => {
  const seekerNoBudgetNoLang = {
    category: 'software',
    selectedFormats: ['written'],
    selectedBudget: '',
    selectedLanguages: [],
  };

  const expert = makeExpert({
    id: 'exp-sw',
    category: 'Software Engineering',
    selectedFormats: ['text'],
    formatPrices: { text: '15000' },
    languages: ['Hindi'],
  });

  assert.equal(evaluateExpertTier(seekerNoBudgetNoLang, expert).matchTier, 1);

  const seekerNoFormat = {
    category: 'software',
    selectedFormats: [],
    selectedBudget: 'budget',
    selectedLanguages: ['en'],
  };
  assert.equal(evaluateExpertTier(seekerNoFormat, makeExpert({
    id: 'exp-sw-2',
    category: 'Software Engineering',
    selectedFormats: ['video'],
    formatPrices: { video: '2500' },
    languages: ['English'],
  })).matchTier, 1);
});

test('puts all experts in Tier 5 when seeker has no category or other-not-sure', () => {
  const expert = makeExpert({ id: 'exp-1', category: 'Health & Wellness', skills: ['Nutrition'] });
  assert.equal(evaluateExpertTier({ category: '' }, expert).matchTier, 5);
  assert.equal(evaluateExpertTier({ category: 'other-not-sure' }, expert).matchTier, 5);
});

test('normalizes category id vs label and seeker vs expert label differences', () => {
  const seekerHealth = { category: 'health' };
  const seekerSoftware = { category: 'software' };
  const seekerFinance = { category: 'finance-investment' };

  assert.equal(evaluateExpertTier(seekerHealth, makeExpert({ category: 'Health & Wellness' })).matchTier, 1);
  assert.equal(evaluateExpertTier(seekerSoftware, makeExpert({ category: 'Software Engineering' })).matchTier, 1);
  assert.equal(evaluateExpertTier(seekerFinance, makeExpert({ category: 'Finance & VC' })).matchTier, 1);
});

test('evaluates format aliases and picks the price of the matched preferred format', () => {
  const seeker = {
    category: 'legal',
    selectedFormats: ['written', 'video'],
    selectedBudget: 'budget',
  };

  // Video is over budget (5000 > 2500), but written/text is within budget (1200 <= 2500)
  const expert = makeExpert({
    id: 'multi-fmt',
    category: 'Legal & Compliance',
    selectedFormats: ['text', 'video'],
    formatPrices: { text: '1200', video: '5000' },
  });

  const evalResult = evaluateExpertTier(seeker, expert);
  assert.equal(evalResult.matchTier, 1);
  assert.deepEqual(evalResult.matchedFormats, ['written', 'video']);

  // Missing/zero prices fail the price criterion
  const noPriceExpert = makeExpert({
    id: 'no-price',
    category: 'Legal & Compliance',
    selectedFormats: ['text'],
    formatPrices: { text: '0' },
  });
  assert.equal(evaluateExpertTier(seeker, noPriceExpert).matchTier, 3);
});

test('handles budget bucket boundaries using at-or-below-max rule and unknown budget as unprovided', () => {
  assert.equal(parseBudgetRange('unknown-tier'), null);

  const checkPrice = (selectedBudget, price) => evaluateExpertTier(
    { category: 'data', selectedFormats: ['video'], selectedBudget },
    makeExpert({ category: 'Data Science', selectedFormats: ['video'], formatPrices: { video: String(price) } }),
  ).matchTier;

  assert.equal(checkPrice('budget', 49), 1);
  assert.equal(checkPrice('budget', 2500), 1);
  assert.equal(checkPrice('budget', 2501), 3);

  assert.equal(checkPrice('standard', 2501), 1);
  assert.equal(checkPrice('standard', 8000), 1);
  assert.equal(checkPrice('standard', 8001), 3);

  assert.equal(checkPrice('premium', 8001), 1);
  assert.equal(checkPrice('premium', 20000), 1);
  assert.equal(checkPrice('premium', 20001), 3);

  assert.equal(checkPrice('elite', 20001), 1);
  assert.equal(checkPrice('elite', 50000), 1);

  assert.equal(checkPrice('custom-unknown', 99999), 1);
});

test('ranks Tier 5 experts by skills nearest match with zero-overlap experts last', () => {
  const seeker = {
    category: 'health',
    topics: ['Sleep Hygiene'],
    needsText: 'Struggling with sleep and nutrition',
  };

  const skillMatch = makeExpert({
    id: 'skill-match',
    category: 'Business Strategy',
    skills: ['Corporate Wellness', 'Sleep Hygiene'],
    rating: 4.0,
  });
  const textMatch = makeExpert({
    id: 'text-match',
    category: 'Marketing & Growth',
    skills: ['SEO Strategy'],
    bio: 'Helps founders with nutrition habits',
    rating: 4.5,
  });
  const zeroOverlapHighRating = makeExpert({
    id: 'zero-high',
    category: 'Software Engineering',
    skills: ['Database Tuning'],
    rating: 5.0,
    submittedAt: '2025-02-01T00:00:00.000Z',
  });
  const zeroOverlapLowRating = makeExpert({
    id: 'zero-low',
    category: 'Legal & Compliance',
    skills: ['ESOP Structuring'],
    rating: 3.5,
    submittedAt: '2025-02-01T00:00:00.000Z',
  });

  const ranked = rankExpertsByPriority(seeker, [zeroOverlapLowRating, textMatch, zeroOverlapHighRating, skillMatch]);
  assert.deepEqual(ranked.map((r) => r.expert.id), ['skill-match', 'text-match', 'zero-high', 'zero-low']);
});

test('produces deterministic ordering regardless of input permutation', () => {
  const seeker = {
    category: 'business',
    selectedFormats: ['video'],
    selectedBudget: 'standard',
    selectedLanguages: ['hi'],
  };

  const experts = [
    makeExpert({ id: 'b', category: 'Business Strategy', selectedFormats: ['video'], formatPrices: { video: '9000' }, languages: ['Hindi'], rating: 4.5 }),
    makeExpert({ id: 'a', category: 'Business Strategy', selectedFormats: ['video'], formatPrices: { video: '9000' }, languages: ['Hindi'], rating: 4.5 }),
    makeExpert({ id: 'c', category: 'Business Strategy', selectedFormats: ['video'], formatPrices: { video: '9000' }, languages: ['English'], rating: 4.9 }),
  ];

  const first = rankExpertsByPriority(seeker, experts).map((r) => r.expert.id);
  const second = rankExpertsByPriority(seeker, [...experts].reverse()).map((r) => r.expert.id);

  assert.deepEqual(first, ['a', 'b', 'c']);
  assert.deepEqual(second, first);
});
