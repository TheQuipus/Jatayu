import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const expertModel = { findAll: async () => [] };
const seekerModel = { findByPk: async () => null };
const aiModel = { recommendExpertMatches: async () => ({ matches: [] }) };

mock.module('../../models/index.js', {
  namedExports: { Expert: expertModel, Seeker: seekerModel, Availability: {}, Credential: {}, Setting: {} },
});
mock.module('../../utils/aiService.js', {
  namedExports: {
    get recommendExpertMatches() {
      return aiModel.recommendExpertMatches;
    },
  },
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
    formatPrices: overrides.formatPrices || { consultation: 1000 },
    selectedFormats: overrides.selectedFormats || [],
    selectedLengths: overrides.selectedLengths || [],
    profilePhotoSrc: overrides.profilePhotoSrc || '',
    experienceLevel: overrides.experienceLevel || 'Senior',
    timezone: overrides.timezone || 'UTC',
    targetAudience: overrides.targetAudience || 'Professionals',
    status: overrides.status || 'approved',
    submittedAt: overrides.submittedAt || new Date('2024-01-01'),
    updatedAt: overrides.updatedAt || new Date('2024-01-02'),
    rating: overrides.rating ?? null,
  };
}

test('parseMatchLimit validates bounds', () => {
  assert.equal(parseMatchLimit('3'), 3);
  assert.equal(parseMatchLimit('0'), null);
  assert.equal(parseMatchLimit('99'), null);
});

test('findFeaturedMatches limits database candidate retrieval to 200 experts', async (t) => {
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

test('findFeaturedMatches prefers exact category and topic matches before fallback matches', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'exact', category: 'Career', skills: ['resume writing'] }),
    createExpert({ id: 'fallback', category: 'Marketing', skills: ['branding'] }),
  ]);

  const results = await findFeaturedMatches({
    category: 'Career',
    topics: ['resume writing'],
    needsText: 'Need help with my resume',
    selectedNeedChips: ['resume'],
    selectedFormats: [],
  }, 3);

  assert.deepEqual(results.map((item) => item.id), ['exact']);
  assert.ok(results[0].matchScore >= 50);
});

test('findFeaturedMatches uses common-feature fallback when exact matches are unavailable', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'shared-skill', category: 'Product', skills: ['Product strategy'], focusAreas: ['Roadmaps'] }),
    createExpert({ id: 'unrelated', category: 'Design', skills: ['Brand identity'] }),
  ]);

  const results = await findFeaturedMatches({
    category: 'Strategy',
    topics: ['roadmaps'],
    needsText: 'Need product strategy help',
    selectedNeedChips: ['strategy'],
    selectedFormats: [],
  }, 3);

  assert.deepEqual(results.map((item) => item.id), ['shared-skill']);
  assert.ok(results[0].matchScore >= 12);
});

test('findFeaturedMatches uses AI fallback when no exact or common-feature matches exist', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'candidate-a', category: 'Legal', skills: ['Contracts'] }),
    createExpert({ id: 'candidate-b', category: 'Finance', skills: ['Accounting'] }),
  ]);
  t.mock.method(aiModel, 'recommendExpertMatches', async () => ({
    matches: [{ expertId: 'candidate-b', relevanceReason: 'Closest category match to strategy and planning', confidence: 0.93 }],
  }));

  const results = await findFeaturedMatches({
    category: 'Strategy',
    topics: ['planning'],
    needsText: 'Need strategic planning support',
    selectedNeedChips: ['planning'],
    selectedFormats: [],
  }, 3);

  assert.deepEqual(results.map((item) => item.id), ['candidate-b']);
  assert.equal(results[0].matchedOn.includes('category') || results[0].matchedOn.length > 0, true);
  assert.equal(results[0].relevanceReason, 'Closest category match to strategy and planning');
  assert.equal(results[0].confidence, 0.93);
});

test('findFeaturedMatches does not fill empty results with unrelated experts', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'unrelated-a', category: 'Design', skills: ['Branding'] }),
    createExpert({ id: 'unrelated-b', category: 'Law', skills: ['Contracts'] }),
  ]);

  const results = await findFeaturedMatches({
    category: 'Strategy',
    topics: ['planning'],
    needsText: 'Need strategic planning guidance',
    selectedNeedChips: ['planning'],
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

test('findFeaturedMatches rejects invalid and duplicate AI IDs', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'valid-1', category: 'Design', skills: ['Brand identity'] }),
    createExpert({ id: 'valid-2', category: 'Strategy', skills: ['Planning'] }),
  ]);
  t.mock.method(aiModel, 'recommendExpertMatches', async () => ({
    matches: [
      { expertId: 'valid-2', relevanceReason: 'Best fit', confidence: 0.8 },
      { expertId: 'valid-2', relevanceReason: 'Duplicate', confidence: 0.9 },
      { expertId: 'not-real', relevanceReason: 'Fake', confidence: 0.7 },
    ],
  }));

  const results = await findFeaturedMatches({
    category: 'Strategy',
    topics: ['planning'],
    needsText: 'Need help with planning',
    selectedNeedChips: ['planning'],
    selectedFormats: [],
  }, 3);

  assert.deepEqual(results.map((item) => item.id), ['valid-2']);
});

test('findFeaturedMatches falls back to deterministic results when AI returns no matches', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'fallback-1', category: 'Career', skills: ['Career coaching'] }),
    createExpert({ id: 'fallback-2', category: 'Legal', skills: ['Regulatory review'] }),
  ]);
  t.mock.method(aiModel, 'recommendExpertMatches', async () => ({ matches: [] }));

  const results = await findFeaturedMatches({
    category: 'Career',
    topics: ['career'],
    needsText: 'Need career guidance',
    selectedNeedChips: ['career'],
    selectedFormats: [],
  }, 3);

  assert.deepEqual(results.map((item) => item.id), ['fallback-1', 'fallback-2']);
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

test('getSeekerDiscover paginates a full ranked result set across pages', async (t) => {
  const seeker = {
    id: 'seeker-paginate',
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => Array.from({ length: 15 }, (_, index) => createExpert({
    id: `page-${index + 1}`,
    category: 'Career',
    skills: ['resume writing'],
    focusAreas: ['interview prep'],
    formatPrices: { consultation: 1000 + (index + 1) * 50 },
    rating: 5,
    selectedFormats: ['consultation'],
    onboardingMetadata: { languages: ['English'], replyTimeMinutes: 15 },
  })));

  let pageOne = null;
  let pageTwo = null;
  const pageOneHolder = { body: null };
  const pageTwoHolder = { body: null };
  const buildRes = (target) => ({
    status(code) {
      return {
        json(body) {
          target.body = body;
        },
      };
    },
  });

  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '1' } }, buildRes(pageOneHolder));
  pageOne = pageOneHolder.body;
  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '2' } }, buildRes(pageTwoHolder));
  pageTwo = pageTwoHolder.body;

  assert.deepEqual(pageOne.experts.map((item) => item.id), ['page-1', 'page-2', 'page-3']);
  assert.deepEqual(pageTwo.experts.map((item) => item.id), ['page-4', 'page-5', 'page-6']);
  assert.equal(pageOne.pagination.total, 15);
  assert.equal(pageOne.pagination.hasNextPage, true);
  assert.equal(pageTwo.pagination.hasNextPage, true);
  assert.notDeepEqual(pageOne.experts.map((item) => item.id), pageTwo.experts.map((item) => item.id));
});

test('findFeaturedMatches applies explicit sort options to the ranked result set', async (t) => {
  const seeker = {
    category: 'Career',
    topics: ['resume'],
    needsText: 'Need help with my resume',
    selectedNeedChips: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({
      id: 'expensive',
      category: 'Career',
      skills: ['resume writing'],
      formatPrices: { consultation: 4000 },
      rating: 5,
      selectedFormats: ['consultation'],
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 15 },
      fullName: 'Zoe Expert',
    }),
    createExpert({
      id: 'cheap',
      category: 'Career',
      skills: ['resume writing'],
      formatPrices: { consultation: 800 },
      rating: 5,
      selectedFormats: ['consultation'],
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 15 },
      fullName: 'Amy Expert',
    }),
    createExpert({
      id: 'middle',
      category: 'Career',
      skills: ['resume writing'],
      formatPrices: { consultation: 1800 },
      rating: 5,
      selectedFormats: ['consultation'],
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 15 },
      fullName: 'Mia Expert',
    }),
  ]);

  const byPriceAsc = await findFeaturedMatches(seeker, 10, { category: 'Career', sort: 'price-asc', search: 'resume' });
  const byAlphabetical = await findFeaturedMatches(seeker, 10, { category: 'Career', sort: 'alphabetical', search: 'resume' });

  assert.deepEqual(byPriceAsc.map((item) => item.id), ['cheap', 'middle', 'expensive']);
  assert.deepEqual(byAlphabetical.map((item) => item.id), ['Amy Expert', 'Mia Expert', 'Zoe Expert']
    .map((fullName) => ({ fullName })).map(({ fullName }) => {
      const match = [
        { id: 'cheap', fullName: 'Amy Expert' },
        { id: 'middle', fullName: 'Mia Expert' },
        { id: 'expensive', fullName: 'Zoe Expert' },
      ].find((entry) => entry.fullName === fullName);
      return match ? match.id : null;
    }));
});

test('findFeaturedMatches respects hard filters during deterministic and AI matching', async (t) => {
  const deterministicSeeker = {
    category: 'Career',
    topics: ['resume'],
    needsText: 'Need help with my resume',
    selectedNeedChips: ['resume'],
    selectedFormats: [],
  };
  const aiSeeker = {
    category: 'Strategy',
    topics: ['planning'],
    needsText: 'Need planning support',
    selectedNeedChips: ['planning'],
    selectedFormats: [],
  };

  const eligibleExpert = createExpert({
    id: 'eligible',
    category: 'Career',
    skills: ['resume writing'],
    rating: 5,
    formatPrices: { consultation: 1500 },
    selectedFormats: [],
    onboardingMetadata: { languages: ['English'], replyTimeMinutes: 15 },
  });
  const filteredOutExpert = createExpert({
    id: 'filtered-out',
    category: 'Career',
    skills: ['resume writing'],
    rating: 2,
    formatPrices: { consultation: 2500 },
    selectedFormats: [],
    onboardingMetadata: { languages: ['Spanish'], replyTimeMinutes: 30 },
  });

  t.mock.method(expertModel, 'findAll', async () => [eligibleExpert, filteredOutExpert]);

  const aiCalls = [];
  t.mock.method(aiModel, 'recommendExpertMatches', async ({ candidates }) => {
    aiCalls.push(candidates.map((candidate) => candidate.id));
    return {
      matches: [{ expertId: 'eligible', relevanceReason: 'Best AI fit for planning support', confidence: 0.91 }],
    };
  });

  const deterministicOnly = await findFeaturedMatches(deterministicSeeker, 10, {
    category: 'Career',
    language: 'English',
    ratings: '4',
    minPrice: '1200',
    maxPrice: '2000',
    availability: '15',
    search: 'resume',
  });

  const aiResults = await findFeaturedMatches(aiSeeker, 10, {
    category: 'Career',
    language: 'English',
    ratings: '4',
    minPrice: '1200',
    maxPrice: '2000',
    availability: '15',
    sort: 'popularity',
  });

  assert.deepEqual(deterministicOnly.map((item) => item.id), ['eligible']);
  assert.deepEqual(aiCalls[0], ['eligible']);
  assert.deepEqual(aiResults.map((item) => item.id), ['eligible']);
});

test('findFeaturedMatches returns an empty result when no eligible experts remain after filters', async (t) => {
  const seeker = {
    category: 'Strategy',
    topics: ['planning'],
    needsText: 'Need planning support',
    selectedNeedChips: ['planning'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({
      id: 'not-eligible',
      category: 'Career',
      skills: ['resume writing'],
      rating: 3,
      formatPrices: { consultation: 1200 },
      selectedFormats: ['consultation'],
      onboardingMetadata: { languages: ['English'], replyTimeMinutes: 20 },
    }),
  ]);

  const results = await findFeaturedMatches(seeker, 10, {
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
  const seeker = {
    id: 'seeker-ratingless',
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'discover-ok', category: 'Career', skills: ['resume writing'] }),
  ]);

  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        },
      };
    },
  };

  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '1', sort: 'popularity' } }, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(payload.experts));
  assert.equal(payload.pagination.total, 1);
});

test('getSeekerDiscover rejects invalid filter and pagination values', async (t) => {
  const seeker = {
    id: 'seeker-invalid',
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'invalid-filter', category: 'Career', skills: ['resume writing'] }),
  ]);

  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        },
      };
    },
  };

  await getSeekerDiscover({ user: { id: seeker.id }, query: {
    limit: '0',
    page: '0',
    ratings: '9',
    sort: 'bogus',
    minPrice: '-1',
    availability: '999',
  } }, res);

  assert.equal(statusCode, 400);
  assert.ok(payload.message.includes('limit') || payload.message.includes('page') || payload.message.includes('ratings') || payload.message.includes('sort') || payload.message.includes('minPrice') || payload.message.includes('availability'));
});

test('findFeaturedMatches sorts newest results by updatedAt descending', async (t) => {
  const seeker = {
    category: 'Career',
    topics: ['resume'],
    needsText: 'Need resume guidance',
    selectedNeedChips: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'older', category: 'Career', skills: ['resume writing'], updatedAt: new Date('2024-01-01') }),
    createExpert({ id: 'newer', category: 'Career', skills: ['resume writing'], updatedAt: new Date('2024-02-01') }),
  ]);

  const results = await findFeaturedMatches(seeker, 10, { category: 'Career', sort: 'newest', search: 'resume' });

  assert.deepEqual(results.map((item) => item.id), ['newer', 'older']);
});

test('getFeaturedMatches controller keeps the onboarding contract while respecting a limit', async (t) => {
  const seeker = {
    id: 'seeker-featured',
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'featured-1', category: 'Career', skills: ['resume writing'], rating: 5, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'featured-2', category: 'Career', skills: ['resume writing'], rating: 4, onboardingMetadata: { languages: ['English'] } }),
    createExpert({ id: 'featured-3', category: 'Career', skills: ['resume writing'], rating: 5, onboardingMetadata: { languages: ['English'] } }),
  ]);

  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        },
      };
    },
  };

  await getFeaturedMatches({ user: { id: seeker.id }, query: { limit: '2' } }, res);

  assert.equal(statusCode, 200);
  assert.equal(payload.count, 2);
  assert.deepEqual(payload.matches.map((item) => item.id), ['featured-1', 'featured-2']);
});

test('getFeaturedMatches controller reads seeker category and topics from the authenticated seeker', async (t) => {
  const seeker = {
    id: 'seeker-1',
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));

  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        },
      };
    },
  };

  await getFeaturedMatches({ user: { id: seeker.id }, query: { limit: '3' } }, res);

  assert.equal(statusCode, 200);
  assert.equal(payload.criteria.category, 'Career');
  assert.deepEqual(payload.criteria.topics, ['resume']);
  assert.ok(Array.isArray(payload.matches));
});

test('getSeekerDiscover controller returns normalized expert list for the seeker discover flow', async (t) => {
  const seeker = {
    id: 'seeker-2',
    category: 'Career',
    topics: ['resume'],
    selectedFormats: ['consultation'],
  };

  t.mock.method(seekerModel, 'findByPk', async (id) => (id === seeker.id ? seeker : null));
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'discover-exact', category: 'Career', skills: ['resume writing'], rating: 5 }),
    createExpert({ id: 'discover-other', category: 'Design', skills: ['Branding'] }),
  ]);

  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(body) {
          payload = body;
        },
      };
    },
  };

  await getSeekerDiscover({ user: { id: seeker.id }, query: { limit: '3', page: '1', search: 'resume', category: 'Career', ratings: '4' } }, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(payload.experts));
  assert.deepEqual(payload.experts.map((item) => item.id), ['discover-exact']);
  assert.equal(payload.pagination.total, 1);
  assert.equal(payload.pagination.page, 1);
});

test('findFeaturedMatches rejects AI confidence outside the 0 to 1 range', async (t) => {
  t.mock.method(expertModel, 'findAll', async () => [
    createExpert({ id: 'below-zero', category: 'Design', skills: ['Brand identity'] }),
    createExpert({ id: 'valid-zero', category: 'Strategy', skills: ['Planning'] }),
    createExpert({ id: 'valid-one', category: 'Career', skills: ['Career coaching'] }),
    createExpert({ id: 'above-one', category: 'Finance', skills: ['Accounting'] }),
  ]);

  t.mock.method(aiModel, 'recommendExpertMatches', async () => ({
    matches: [
      { expertId: 'below-zero', relevanceReason: 'Invalid low confidence', confidence: -0.1 },
      { expertId: 'valid-zero', relevanceReason: 'Boundary zero', confidence: 0 },
      { expertId: 'valid-one', relevanceReason: 'Boundary one', confidence: 1 },
      { expertId: 'above-one', relevanceReason: 'Invalid high confidence', confidence: 1.5 },
    ],
  }));

  const results = await findFeaturedMatches({
    category: 'Unmatched',
    topics: ['unrelated'],
    needsText: 'Need unrelated support',
    selectedNeedChips: ['unrelated'],
    selectedFormats: [],
  }, 5);

  assert.deepEqual(results.map((item) => item.id), ['valid-one', 'valid-zero']);
  assert.deepEqual(results.map((item) => item.confidence), [1, 0]);
  assert.deepEqual(results.map((item) => item.matchScore), [100, 0]);
});
