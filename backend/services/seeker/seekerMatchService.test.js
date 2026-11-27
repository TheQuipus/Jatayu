import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const expertModel = { findAll: async () => [] };
const seekerModel = { findByPk: async () => null };

mock.module('../../models/index.js', {
  namedExports: { Expert: expertModel, Seeker: seekerModel, Availability: {}, Credential: {}, Setting: {} },
});

const seekerMatchModule = await import('./seekerMatchService.js');
const { findFeaturedMatches, parseMatchLimit } = seekerMatchModule;
const { getFeaturedMatches, getSeekerDiscover } = await import('../../controllers/seeker/seekerMatchController.js');

function createExpert(overrides = {}) {
  return {
    id: overrides.id || 'expert-1',
    fullName: overrides.fullName || 'Test Expert',
    professionalTitle: overrides.professionalTitle || 'Consultant',
    tagLine: overrides.tagLine || 'Practical advice',
    bio: overrides.bio || 'Helpful guidance',
    category: overrides.category || 'Career',
    skills: overrides.skills || [],
    focusAreas: overrides.focusAreas || [],
    onboardingMetadata: overrides.onboardingMetadata || { languages: ['English'] },
    formatPrices: overrides.formatPrices || { video: 1000 },
    selectedFormats: overrides.selectedFormats || ['video'],
    selectedLengths: overrides.selectedLengths || [],
    profilePhotoSrc: overrides.profilePhotoSrc || '',
    experienceLevel: overrides.experienceLevel || 'Senior',
    timezone: overrides.timezone || 'UTC',
    targetAudience: overrides.targetAudience || 'Professionals',
    status: overrides.status || 'approved',
    submittedAt: overrides.submittedAt || new Date('2024-01-01'),
    updatedAt: overrides.updatedAt || new Date('2024-01-02'),
    rating: overrides.rating ?? null,
    ...overrides,
  };
}

function buildRes(target) {
  return {
    status(code) {
      target.statusCode = code;
      return {
        json(body) {
          target.body = body;
        },
      };
    },
  };
}

test('parseMatchLimit validates bounds', () => {
  assert.equal(parseMatchLimit('3'), 3);
  assert.equal(parseMatchLimit('0'), null);
  assert.equal(parseMatchLimit('99'), null);
});

test('findFeaturedMatches limits database candidate retrieval to 200 approved experts', async (t) => {
  let queryOptions;

  t.mock.method(expertModel, 'findAll', async (options) => {
    queryOptions = options;
    return [];
  });

  await findFeaturedMatches({
    category: 'Career',
    topics: [],
    needsText: '',
    selectedNeedChips: [],
    selectedFormats: [],
  });

  assert.equal(queryOptions.limit, 200);
  assert.deepEqual(queryOptions.where, { status: 'approved' });
  assert.deepEqual(queryOptions.order, [
    ['submittedAt', 'DESC'],
    ['updatedAt', 'DESC'],
  ]);
});

test('findFeaturedMatches ranks experts across Tiers 1-5 deterministically without AI fallback', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 't5', category: 'Marketing & Growth', skills: ['Diet & Nutrition'], selectedFormats: ['video'], formatPrices: { video: '1000' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 't4', category: 'Health & Wellness', selectedFormats: ['shoutout'], formatPrices: { shoutout: '1000' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 't3', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '9000' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 't2', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '1500' }, onboardingMetadata: { languages: ['Tamil'] } }),
    createExpert({ id: 't1', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '1500' }, onboardingMetadata: { languages: ['English'] } }),
  ]);

  const results = await findFeaturedMatches({
    category: 'health',
    selectedFormats: ['video'],
    selectedBudget: 'budget',
    selectedLanguages: ['english'],
    topics: ['Diet & Nutrition'],
  });

  assert.deepEqual(results.map((item) => item.id), ['t1', 't2', 't3', 't4', 't5']);
  assert.deepEqual(results.map((item) => item.matchTier), [1, 2, 3, 4, 5]);
});

test('findFeaturedMatches returns an empty list when there are no approved experts', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => []);

  const results = await findFeaturedMatches({
    category: 'Career',
    topics: ['career'],
    needsText: 'Need guidance',
    selectedNeedChips: ['career'],
    selectedFormats: [],
  }, 3);

  assert.deepEqual(results, []);
});

test('getFeaturedMatches returns top 3 across tiers and fills from Tier 5 when fewer than 3 higher-tier experts exist', async (t) => {
  const seeker = {
    id: 'seeker-top3',
    category: 'health',
    topics: ['Yoga & Mindfulness'],
    selectedFormats: ['video'],
    selectedBudget: 'budget',
    selectedLanguages: ['english'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'tier5-unrelated', category: 'Legal & Compliance', skills: ['ESOP Structuring'], rating: 4.0 }),
    createExpert({ id: 'tier5-skill', category: 'Business Strategy', skills: ['Yoga & Mindfulness'], rating: 4.2 }),
    createExpert({ id: 'tier1-health', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '1200' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'tier4-health', category: 'Health & Wellness', selectedFormats: ['shoutout'], formatPrices: { shoutout: '1200' }, onboardingMetadata: { languages: ['English'] } }),
  ]);

  const holder = {};
  // Query params category/topics must NOT hard-filter out Tier 5 experts on featured-matches
  await getFeaturedMatches({ user: { id: seeker.id }, query: { category: 'health', topics: 'Yoga & Mindfulness', limit: '3' } }, buildRes(holder));

  assert.equal(holder.statusCode, 200);
  assert.equal(holder.body.count, 3);
  assert.deepEqual(holder.body.matches.map((item) => item.id), ['tier1-health', 'tier4-health', 'tier5-skill']);
  assert.deepEqual(holder.body.matches.map((item) => item.matchTier), [1, 4, 5]);
});

test('getFeaturedMatches works with no query params using seeker stored profile and returns fewer than 3 when fewer exist', async (t) => {
  const seeker = {
    id: 'seeker-no-params',
    category: 'software',
    topics: ['System Design'],
    selectedFormats: ['written'],
    selectedBudget: 'standard',
    selectedLanguages: ['hindi'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'sw-1', category: 'Software Engineering', selectedFormats: ['text'], formatPrices: { text: '4000' }, onboardingMetadata: { languages: ['Hindi'] } }),
    createExpert({ id: 'other-2', category: 'Design', skills: ['System Design'], selectedFormats: ['video'], formatPrices: { video: '2000' }, onboardingMetadata: { languages: ['English'] } }),
  ]);

  const holder = {};
  await getFeaturedMatches({ user: { id: seeker.id }, query: {} }, buildRes(holder));

  assert.equal(holder.statusCode, 200);
  assert.equal(holder.body.count, 2);
  assert.deepEqual(holder.body.matches.map((item) => item.id), ['sw-1', 'other-2']);
  assert.equal(holder.body.criteria.selectedBudget, 'standard');
  assert.deepEqual(holder.body.criteria.selectedLanguages, ['hindi']);
});

test('getSeekerDiscover orders all approved experts by tier BEFORE pagination', async (t) => {
  const seeker = {
    id: 'seeker-paginate',
    category: 'health',
    topics: ['Diet & Nutrition'],
    selectedFormats: ['video'],
    selectedBudget: 'budget',
    selectedLanguages: ['english'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    // Deliberately put Tier 5 first and Tier 1 last in DB order
    createExpert({ id: 'p5-a', category: 'Legal & Compliance', skills: ['ESOP'] }),
    createExpert({ id: 'p5-b', category: 'Marketing & Growth', skills: ['SEO'] }),
    createExpert({ id: 'p4-a', category: 'Health & Wellness', selectedFormats: ['shoutout'], formatPrices: { shoutout: '1000' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'p3-a', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '9000' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'p2-a', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '1000' }, onboardingMetadata: { languages: ['Tamil'] } }),
    createExpert({ id: 'p1-a', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '1000' }, onboardingMetadata: { languages: ['English'] } }),
  ]);

  const pageOne = {};
  const pageTwo = {};
  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '1' } }, buildRes(pageOne));
  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '2' } }, buildRes(pageTwo));

  assert.deepEqual(pageOne.body.experts.map((item) => item.id), ['p1-a', 'p2-a', 'p3-a']);
  assert.deepEqual(pageTwo.body.experts.map((item) => item.id), ['p4-a', 'p5-a', 'p5-b']);
  assert.equal(pageOne.body.pagination.total, 6);
  assert.equal(pageOne.body.pagination.hasNextPage, true);
  assert.equal(pageTwo.body.pagination.hasNextPage, false);
});

test('findFeaturedMatches applies explicit sort options over tier order and uses tier as secondary tie-break', async (t) => {
  const seeker = {
    category: 'health',
    selectedFormats: ['video'],
    selectedBudget: 'budget',
    selectedLanguages: ['english'],
  };

  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'expensive-t1', fullName: 'Zoe', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '2000' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'cheap-t5', fullName: 'Amy', category: 'Design', selectedFormats: ['video'], formatPrices: { video: '500' }, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'mid-t1', fullName: 'Mia', category: 'Health & Wellness', selectedFormats: ['video'], formatPrices: { video: '1200' }, onboardingMetadata: { languages: ['English'] } }),
  ]);

  const byDefault = await findFeaturedMatches(seeker, 10, {});
  assert.deepEqual(byDefault.map((item) => item.id), ['expensive-t1', 'mid-t1', 'cheap-t5']);

  const byPriceAsc = await findFeaturedMatches(seeker, 10, { sort: 'price-asc' });
  assert.deepEqual(byPriceAsc.map((item) => item.id), ['cheap-t5', 'mid-t1', 'expensive-t1']);

  const byAlphabetical = await findFeaturedMatches(seeker, 10, { sort: 'alphabetical' });
  assert.deepEqual(byAlphabetical.map((item) => item.id), ['cheap-t5', 'mid-t1', 'expensive-t1']);
});

test('findFeaturedMatches respects hard filters on discover', async (t) => {
  const seeker = {
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['video'],
  };

  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({
      id: 'eligible',
      category: 'Career',
      skills: ['resume writing'],
      rating: 5,
      formatPrices: { video: 1500 },
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 15 },
    }),
    createExpert({
      id: 'filtered-out',
      category: 'Career',
      skills: ['resume writing'],
      rating: 2,
      formatPrices: { video: 2500 },
      onboardingMetadata: { languages: ['Spanish'], replyTimeMinutes: 30 },
    }),
  ]);

  const results = await findFeaturedMatches(seeker, 10, {
    category: 'Career',
    language: 'English',
    ratings: '4',
    minPrice: '1200',
    maxPrice: '2000',
    availability: '15',
    search: 'resume',
  });

  assert.deepEqual(results.map((item) => item.id), ['eligible']);
});

test('getSeekerDiscover rejects invalid filter and pagination values', async (t) => {
  const seeker = { id: 'seeker-invalid', category: 'Career', topics: [], selectedFormats: [] };
  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));

  const res = {};
  await getSeekerDiscover({
    user: { id: seeker.id },
    query: { page: '0', limit: '3' },
  }, buildRes(res));

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /page/i);
});

test('getSeekerDiscover controller applies category hard filter with id-vs-label normalization', async (t) => {
  const seeker = {
    id: 'seeker-2',
    category: 'health',
    topics: ['Diet & Nutrition'],
    selectedFormats: ['video'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'discover-health', category: 'Health & Wellness', skills: ['Diet & Nutrition'], rating: 5 }),
    createExpert({ id: 'discover-other', category: 'Design', skills: ['Branding'], rating: 5 }),
  ]);

  const res = {};
  await getSeekerDiscover({
    user: { id: seeker.id },
    query: { limit: '3', page: '1', category: 'health', ratings: '4' },
  }, buildRes(res));

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.experts.map((item) => item.id), ['discover-health']);
  assert.equal(res.body.pagination.total, 1);
});

test('findFeaturedMatches does not fill empty results with unrelated experts when hard filters exclude all candidates', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'unrelated-a', category: 'Design', skills: ['Branding'], rating: 3 }),
    createExpert({ id: 'unrelated-b', category: 'Law', skills: ['Contracts'], rating: 3 }),
  ]);

  const results = await findFeaturedMatches({
    category: 'Strategy',
    topics: ['planning'],
    selectedFormats: [],
  }, 3, {
    search: 'urgent planning',
    ratings: ['5'],
    minPrice: 1000,
    maxPrice: 2000,
    availability: ['15'],
  });

  assert.deepEqual(results, []);
});

test('findFeaturedMatches returns an empty result when no eligible experts remain after filters', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({
      id: 'not-eligible',
      category: 'Career',
      skills: ['resume writing'],
      rating: 3,
      formatPrices: { video: 1200 },
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 20 },
    }),
  ]);

  const results = await findFeaturedMatches({ category: 'Career' }, 10, {
    category: 'Career',
    language: 'English',
    ratings: '4',
    minPrice: '2000',
    maxPrice: '3000',
    availability: '15',
  });

  assert.deepEqual(results, []);
});

test('getSeekerDiscover accepts requests without a rating filter', async (t) => {
  const seeker = { id: 'seeker-ratingless', category: 'Career', topics: ['resume'], selectedFormats: ['video'] };
  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'exp-1', category: 'Career', skills: ['resume'] }),
  ]);

  const res = {};
  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '1', sort: 'popularity' } }, buildRes(res));

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.experts.map((item) => item.id), ['exp-1']);
});

test('findFeaturedMatches sorts newest results by updatedAt descending', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'older', category: 'Career', updatedAt: new Date('2024-01-01'), submittedAt: new Date('2024-01-01') }),
    createExpert({ id: 'newer', category: 'Career', updatedAt: new Date('2025-01-01'), submittedAt: new Date('2025-01-01') }),
  ]);

  const results = await findFeaturedMatches({ category: 'Career' }, 10, { sort: 'newest' });
  assert.deepEqual(results.map((item) => item.id), ['newer', 'older']);
});

test('getFeaturedMatches controller respects explicit limit query parameter', async (t) => {
  const seeker = { id: 'seeker-limit2', category: 'Career', topics: [], selectedFormats: ['video'] };
  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'e1', category: 'Career', rating: 5 }),
    createExpert({ id: 'e2', category: 'Career', rating: 4 }),
    createExpert({ id: 'e3', category: 'Career', rating: 3 }),
  ]);

  const res = {};
  await getFeaturedMatches({ user: { id: seeker.id }, query: { limit: '2' } }, buildRes(res));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.count, 2);
  assert.deepEqual(res.body.matches.map((item) => item.id), ['e1', 'e2']);
});
