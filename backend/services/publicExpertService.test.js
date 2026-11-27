import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const experts = {
  findAll: async () => [],
};
mock.module('../models/index.js', {
  namedExports: {
    Availability: {},
    Credential: {},
    Expert: experts,
  },
});

const { findPublicExperts, parsePublicExpertListQuery } = await import('./publicExpertService.js');

function expert(id, values = {}) {
  return {
    id,
    fullName: `Expert ${id}`,
    professionalTitle: '',
    tagLine: '',
    bio: '',
    category: '',
    skills: [],
    focusAreas: [],
    onboardingMetadata: { languages: [] },
    formatPrices: { consultation: 1000 },
    selectedFormats: [],
    selectedLengths: [],
    ...values,
  };
}

function filters(query = {}) {
  return parsePublicExpertListQuery({ limit: '10', ...query });
}

test('keeps direct search results unchanged and does not add suggestions', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    expert('direct', { fullName: 'Startup Guide' }),
    expert('related', { category: 'Startup' }),
  ]);

  const result = await findPublicExperts(filters({ search: 'startup guide' }));

  assert.deepEqual(result.experts.map((item) => item.id), ['direct']);
  assert.equal(result.suggestions, undefined);
  assert.equal(result.pagination.total, 1);
});

test('ranks fallback suggestions by relevant public profile overlap', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    expert('weak', { bio: 'startup advice' }),
    expert('strong', {
      category: 'Startup & Fundraising',
      skills: ['Startup fundraising'],
      professionalTitle: 'Startup fundraising advisor',
    }),
    expert('unrelated', { bio: 'interior design' }),
  ]);

  const result = await findPublicExperts(filters({ search: 'startup seed round' }));

  assert.deepEqual(result.experts, []);
  assert.deepEqual(result.suggestions.map((item) => item.id), ['strong', 'weak']);
  assert.equal(result.pagination.total, 0);
});

test('requests only approved experts and deduplicates fallback results by ID', async (t) => {
  let query;
  t.mock.method(experts, 'findAll', async (options) => {
    query = options;
    return [
      expert('approved', { category: 'Career', skills: ['Career coaching'] }),
      expert('approved', { category: 'Career', skills: ['Career coaching'] }),
      expert('pending', { category: 'Career', skills: ['Career coaching'], status: 'pending_review' }),
    ].filter((item) => options.where.status === 'approved' && item.status !== 'pending_review');
  });

  const result = await findPublicExperts(filters({ search: 'career advice' }));

  assert.deepEqual(query.where, { status: 'approved' });
  assert.deepEqual(result.suggestions.map((item) => item.id), ['approved']);
});

test('does not add fallback suggestions when search is empty', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    expert('approved', { category: 'Career', skills: ['Career coaching'] }),
  ]);

  const result = await findPublicExperts(filters());

  assert.deepEqual(result.experts.map((item) => item.id), ['approved']);
  assert.equal(result.suggestions, undefined);
});

test('preserves category, language, price, and availability filters for suggestions', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    expert('matches', {
      category: 'Career',
      skills: ['Career coaching'],
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 10 },
      formatPrices: { consultation: 500 },
    }),
    expert('wrong-category', {
      category: 'Startup',
      skills: ['Career coaching'],
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 10 },
      formatPrices: { consultation: 500 },
    }),
    expert('wrong-language', {
      category: 'Career',
      skills: ['Career coaching'],
      onboardingMetadata: { languages: ['Hindi'], replyTimeMinutes: 10 },
      formatPrices: { consultation: 500 },
    }),
  ]);

  const result = await findPublicExperts(filters({
    search: 'career advice',
    category: 'Career',
    language: 'English',
    minPrice: '100',
    maxPrice: '1000',
    availability: '15',
  }));

  assert.deepEqual(result.suggestions.map((item) => item.id), ['matches']);
});

test('does not trigger fallback for an empty later page when direct matches exist', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    ...Array.from({ length: 12 }, (_, index) =>
      expert(`other-${index}`, { fullName: 'Career Coach' })),
  ]);

  const result = await findPublicExperts(filters({
    search: 'career coach',
    page: '2',
    limit: '12',
  }));

  assert.deepEqual(result.experts, []);
  assert.equal(result.pagination.total, 12);
  assert.equal(result.suggestions, undefined);
});

test('does not convert database errors into fallback suggestions', async (t) => {
  const failure = new Error('database unavailable');
  t.mock.method(experts, 'findAll', async () => { throw failure; });

  await assert.rejects(
    findPublicExperts(filters({ search: 'unmatched query' })),
    failure,
  );
});

test('category filter normalizes category ids to expert labels without breaking exact label or custom category filters', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    expert('health-expert', { category: 'Health & Wellness' }),
    expert('sw-expert', { category: 'Software Engineering' }),
    expert('custom-expert', { category: 'Vastu Shastra' }),
  ]);

  const byId = await findPublicExperts(filters({ category: 'health' }));
  assert.deepEqual(byId.experts.map((item) => item.id), ['health-expert']);

  const byLabel = await findPublicExperts(filters({ category: 'Health & Wellness' }));
  assert.deepEqual(byLabel.experts.map((item) => item.id), ['health-expert']);

  const bySwId = await findPublicExperts(filters({ category: 'software' }));
  assert.deepEqual(bySwId.experts.map((item) => item.id), ['sw-expert']);

  const byCustom = await findPublicExperts(filters({ category: 'Vastu Shastra' }));
  assert.deepEqual(byCustom.experts.map((item) => item.id), ['custom-expert']);
});

test('mixed-category regression: filtering by exact expert label returns identical expert set and custom category matches itself', async (t) => {
  t.mock.method(experts, 'findAll', async () => [
    expert('e-health-1', { category: 'Health & Wellness' }),
    expert('e-health-2', { category: 'Health & Wellness' }),
    expert('e-sw', { category: 'Software Engineering' }),
    expert('e-fin', { category: 'Finance & VC' }),
    expert('e-custom', { category: 'Vedic Astrology' }),
  ]);

  const healthRes = await findPublicExperts(filters({ category: 'Health & Wellness' }));
  assert.deepEqual(healthRes.experts.map((item) => item.id), ['e-health-1', 'e-health-2']);

  const swRes = await findPublicExperts(filters({ category: 'Software Engineering' }));
  assert.deepEqual(swRes.experts.map((item) => item.id), ['e-sw']);

  const finRes = await findPublicExperts(filters({ category: 'Finance & VC' }));
  assert.deepEqual(finRes.experts.map((item) => item.id), ['e-fin']);

  const customRes = await findPublicExperts(filters({ category: 'Vedic Astrology' }));
  assert.deepEqual(customRes.experts.map((item) => item.id), ['e-custom']);
});
