import { Expert } from '../../models/index.js';
import { matchesNonSearchFilters, parsePublicExpertListQuery, serializePublicExpert } from '../publicExpertService.js';

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 20;
const AI_CANDIDATE_LIMIT = 20;
const MIN_COMMON_FEATURE_SCORE = 12;

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asStringArray(value) {
  const parsed = parseJson(value, []);
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeList(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalize).filter(Boolean))];
}

function terms(value) {
  return new Set(normalize(value).split(/\s+/).filter((term) => term.length > 2));
}

function intersection(left, right) {
  const rightSet = new Set(right.map(normalize));
  return left.filter((value) => rightSet.has(normalize(value)));
}

function keywordOverlap(seeker, expert) {
  const seekerTerms = terms([
    seeker.needsText,
    seeker.additionalContext,
    ...asStringArray(seeker.selectedNeedChips),
    ...asStringArray(seeker.topics),
  ].filter(Boolean).join(' '));
  const expertTerms = terms([
    expert.professionalTitle,
    expert.tagLine,
    expert.bio,
    expert.targetAudience,
    ...asStringArray(expert.skills),
    ...asStringArray(expert.focusAreas),
  ].filter(Boolean).join(' '));

  return [...seekerTerms].filter((term) => expertTerms.has(term));
}

function scoreExpert(seeker, expert) {
  let score = 0;
  const matchedOn = [];
  const categoryMatches = normalize(seeker.category)
    && normalize(seeker.category) === normalize(expert.category);

  if (categoryMatches) {
    score += 50;
    matchedOn.push('category');
  }

  const seekerTopics = asStringArray(seeker.topics);
  const expertTopics = [
    ...asStringArray(expert.skills),
    ...asStringArray(expert.focusAreas),
  ];
  const matchedTopics = intersection(seekerTopics, expertTopics);
  if (matchedTopics.length > 0) {
    score += Math.min(matchedTopics.length * 10, 30);
    matchedOn.push('topics');
  }

  const matchedFormats = intersection(
    asStringArray(seeker.selectedFormats),
    asStringArray(expert.selectedFormats),
  );
  if (matchedFormats.length > 0) {
    score += Math.min(matchedFormats.length * 5, 10);
    matchedOn.push('formats');
  }

  const matchedKeywords = keywordOverlap(seeker, expert);
  if (matchedKeywords.length > 0) {
    score += Math.min(matchedKeywords.length * 2, 10);
    matchedOn.push('needs');
  }

  return {
    score: Math.min(score, 100),
    matchedOn,
    matchedTopics,
    matchedFormats,
  };
}

function categorySimilarity(seeker, expert) {
  const seekerCategory = normalize(seeker.category);
  const expertCategory = normalize(expert.category);
  if (!seekerCategory || !expertCategory) return 0;
  if (seekerCategory === expertCategory) return 18;
  if (seekerCategory.includes(expertCategory) || expertCategory.includes(seekerCategory)) return 12;
  const seekerCategoryTerms = new Set(seekerCategory.split(/\s+/));
  const expertCategoryTerms = new Set(expertCategory.split(/\s+/));
  const overlap = [...seekerCategoryTerms].filter((term) => term.length > 2 && expertCategoryTerms.has(term));
  return overlap.length > 0 ? 8 : 0;
}

function commonFeatureScore(seeker, expert) {
  const seekerTopics = normalizeList(asStringArray(seeker.topics));
  const expertTopics = normalizeList([
    ...asStringArray(expert.skills),
    ...asStringArray(expert.focusAreas),
    expert.category,
    expert.professionalTitle,
    expert.tagLine,
  ]);
  let score = categorySimilarity(seeker, expert);

  const sharedTopics = intersection(seekerTopics.map((topic) => topic), expertTopics);
  if (sharedTopics.length > 0) {
    score += Math.min(sharedTopics.length * 10, 30);
  }

  const seekerKeywords = terms([
    seeker.needsText,
    seeker.additionalContext,
    ...asStringArray(seeker.selectedNeedChips),
    ...seekerTopics,
    seeker.category,
  ].filter(Boolean).join(' '));
  const expertKeywords = terms([
    expert.professionalTitle,
    expert.tagLine,
    expert.bio,
    expert.targetAudience,
    ...asStringArray(expert.skills),
    ...asStringArray(expert.focusAreas),
    expert.category,
  ].filter(Boolean).join(' '));
  const sharedKeywords = [...seekerKeywords].filter((term) => expertKeywords.has(term));
  if (sharedKeywords.length > 0) {
    score += Math.min(sharedKeywords.length * 4, 20);
  }

  return score;
}

function serializeMatch(expert, match, rank, aiMeta = {}) {
  const confidence = Number.isFinite(aiMeta.confidence) ? Number(aiMeta.confidence) : null;
  const relevanceReason = typeof aiMeta.relevanceReason === 'string' ? aiMeta.relevanceReason.trim() : '';
  return {
    id: expert.id,
    fullName: expert.fullName,
    professionalTitle: expert.professionalTitle,
    tagLine: expert.tagLine,
    bio: expert.bio,
    profilePhotoSrc: expert.profilePhotoSrc,
    category: expert.category,
    skills: asStringArray(expert.skills),
    focusAreas: asStringArray(expert.focusAreas),
    experienceLevel: expert.experienceLevel,
    timezone: expert.timezone,
    selectedFormats: asStringArray(expert.selectedFormats),
    selectedLengths: asStringArray(expert.selectedLengths),
    formatPrices: parseJson(expert.formatPrices, {}),
    rank,
    matchScore: confidence !== null ? confidence * 100 : match.score,
    matchedOn: match.matchedOn,
    matchedTopics: match.matchedTopics,
    matchedFormats: match.matchedFormats,
    ...(relevanceReason ? { relevanceReason } : {}),
    ...(confidence !== null ? { confidence } : {}),
  };
}

function sortMatchesByScore(entries) {
  return [...entries].sort((left, right) => {
    if (right.exact.score !== left.exact.score) {
      return right.exact.score - left.exact.score;
    }
    if (right.commonScore !== left.commonScore) {
      return right.commonScore - left.commonScore;
    }
    return left.originalIndex - right.originalIndex;
  });
}

function toAiCandidate(expert) {
  return {
    id: expert.id,
    fullName: expert.fullName,
    category: expert.category,
    professionalTitle: expert.professionalTitle,
    skills: asStringArray(expert.skills),
    focusAreas: asStringArray(expert.focusAreas),
    topics: [...new Set([...asStringArray(expert.skills), ...asStringArray(expert.focusAreas)])],
    bio: expert.bio,
    languages: [
      ...new Set([
        ...(Array.isArray(expert.languages) ? expert.languages : []),
        ...asStringArray(expert.onboardingMetadata?.languages),
      ]),
    ],
  };
}

function normalizeAiMatches(matches, candidateMap) {
  const seen = new Set();
  return matches
    .map((entry) => ({
      expertId: String(entry?.expertId || entry?.id || '').trim(),
      relevanceReason: String(entry?.relevanceReason || entry?.reason || '').trim(),
      confidence: Number(entry?.confidence ?? entry?.score ?? 0),
    }))
    .filter((entry) => {
      if (!entry.expertId || !candidateMap.has(entry.expertId)) return false;
      if (!Number.isFinite(entry.confidence) || entry.confidence <= 0) return false;
      if (seen.has(entry.expertId)) return false;
      seen.add(entry.expertId);
      return true;
    })
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 5);
}

function sortEntriesByCriteria(entries, sortKey) {
  const ordered = [...entries];
  const relevanceSort = (left, right) => {
    if (right.exact.score !== left.exact.score) return right.exact.score - left.exact.score;
    if (right.commonScore !== left.commonScore) return right.commonScore - left.commonScore;
    if (Number.isFinite(right.aiConfidence) || Number.isFinite(left.aiConfidence)) {
      const rightConfidence = Number.isFinite(right.aiConfidence) ? right.aiConfidence : 0;
      const leftConfidence = Number.isFinite(left.aiConfidence) ? left.aiConfidence : 0;
      if (rightConfidence !== leftConfidence) return rightConfidence - leftConfidence;
    }
    return left.originalIndex - right.originalIndex;
  };

  const timestampValue = (entry) => {
    const raw = entry?.updatedAt ?? entry?.submittedAt ?? entry?.expert?.updatedAt ?? entry?.expert?.submittedAt ?? 0;
    return Number(new Date(raw).getTime());
  };

  switch (sortKey) {
    case 'price-asc':
      return ordered.sort((left, right) => {
        const leftPrice = Number.isFinite(Number(left.expert.price)) ? Number(left.expert.price) : Number.POSITIVE_INFINITY;
        const rightPrice = Number.isFinite(Number(right.expert.price)) ? Number(right.expert.price) : Number.POSITIVE_INFINITY;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;
        return relevanceSort(left, right);
      });
    case 'price-desc':
      return ordered.sort((left, right) => {
        const leftPrice = Number.isFinite(Number(left.expert.price)) ? Number(left.expert.price) : -1;
        const rightPrice = Number.isFinite(Number(right.expert.price)) ? Number(right.expert.price) : -1;
        if (leftPrice !== rightPrice) return rightPrice - leftPrice;
        return relevanceSort(left, right);
      });
    case 'alphabetical':
      return ordered.sort((left, right) => {
        const nameComparison = String(left.expert.fullName || '').localeCompare(String(right.expert.fullName || ''));
        if (nameComparison !== 0) return nameComparison;
        return relevanceSort(left, right);
      });
    case 'newest':
      return ordered.sort((left, right) => {
        const leftUpdated = timestampValue(left);
        const rightUpdated = timestampValue(right);
        if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
        return relevanceSort(left, right);
      });
    case 'popularity':
    default:
      return ordered.sort(relevanceSort);
  }
}

export function parseMatchLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  const limit = Number.parseInt(value, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;
  return limit;
}

function parseDiscoverCriteria(rawCriteria = {}) {
  const categoryValues = [...new Set([
    ...(Array.isArray(rawCriteria.categories) ? rawCriteria.categories : []),
    ...(Array.isArray(rawCriteria.category) ? rawCriteria.category : [rawCriteria.category]),
    ...(Array.isArray(rawCriteria.topics) ? rawCriteria.topics : [rawCriteria.topics]),
    ...(Array.isArray(rawCriteria.topic) ? rawCriteria.topic : [rawCriteria.topic]),
  ].flatMap((value) => String(value || '').split(',')).map((value) => value.trim()).filter(Boolean))];

  const languageValues = [...new Set([
    ...(Array.isArray(rawCriteria.languages) ? rawCriteria.languages : []),
    ...(Array.isArray(rawCriteria.language) ? rawCriteria.language : [rawCriteria.language]),
  ].flatMap((value) => String(value || '').split(',')).map((value) => value.trim()).filter(Boolean))];

  const ratingValues = [...new Set([
    ...(Array.isArray(rawCriteria.ratings) ? rawCriteria.ratings : [rawCriteria.ratings]),
    ...(Array.isArray(rawCriteria.rating) ? rawCriteria.rating : [rawCriteria.rating]),
  ].flatMap((value) => String(value || '').split(',')).map((value) => value.trim()).filter(Boolean))];

  const availabilityValues = [...new Set([
    ...(Array.isArray(rawCriteria.availability) ? rawCriteria.availability : [rawCriteria.availability]),
  ].flatMap((value) => String(value || '').split(',')).map((value) => value.trim()).filter(Boolean))];

  const parsedQuery = {
    page: rawCriteria.page ?? 1,
    limit: rawCriteria.limit ?? DEFAULT_LIMIT,
    search: rawCriteria.search || rawCriteria.query || '',
    ...(categoryValues.length > 0 ? { category: categoryValues.join(',') } : {}),
    ...(languageValues.length > 0 ? { language: languageValues.join(',') } : {}),
    ...(ratingValues.length > 0 ? { ratings: ratingValues.join(',') } : {}),
    ...(availabilityValues.length > 0 ? { availability: availabilityValues.join(',') } : {}),
    ...(rawCriteria.minPrice !== undefined && rawCriteria.minPrice !== null && rawCriteria.minPrice !== '' ? { minPrice: rawCriteria.minPrice } : {}),
    ...(rawCriteria.maxPrice !== undefined && rawCriteria.maxPrice !== null && rawCriteria.maxPrice !== '' ? { maxPrice: rawCriteria.maxPrice } : {}),
    sort: rawCriteria.sort || rawCriteria.sortBy || 'popularity',
  };

  const parsed = parsePublicExpertListQuery(parsedQuery);
  return {
    ...parsed,
    categories: parsed.categories,
    languages: parsed.languages,
    ratings: parsed.ratings,
    availability: parsed.availability,
  };
}

function matchesDiscoverQuery(expert, filters) {
  if (filters.search) {
    const searchable = [
      expert.fullName,
      expert.professionalTitle,
      expert.tagLine,
      expert.bio,
      expert.category,
      ...asStringArray(expert.skills),
      ...asStringArray(expert.focusAreas),
      ...asStringArray(expert.languages),
    ].map((value) => String(value || '').trim().toLowerCase()).join(' ');
  if (!searchable.includes(normalize(filters.search))) return false;
  }

  return matchesNonSearchFilters(expert, filters);
}

export async function findFeaturedMatches(seeker, limit = DEFAULT_LIMIT, rawCriteria = {}) {
  const experts = await Expert.findAll({
    where: { status: 'approved' },
    order: [['submittedAt', 'DESC'], ['updatedAt', 'DESC']],
  });

  if (experts.length === 0) {
    return [];
  }

  const filters = parseDiscoverCriteria(rawCriteria);
  if (filters.errors && filters.errors.length > 0) {
    throw Object.assign(new Error(filters.errors.join('; ')), { statusCode: 400 });
  }
  const candidatePairs = experts
    .map((expert) => ({
      expert,
      publicExpert: serializePublicExpert(expert, { includeCredentials: false }),
    }))
    .filter(({ publicExpert }) => matchesDiscoverQuery(publicExpert, filters));

  if (candidatePairs.length === 0) {
    return [];
  }

  const rankedEntries = candidatePairs
    .map(({ expert, publicExpert }, originalIndex) => {
      const exact = scoreExpert(seeker, publicExpert);
      const commonScore = commonFeatureScore(seeker, publicExpert);
      return {
        expert: publicExpert,
        originalExpert: expert,
        originalIndex,
        exact,
        commonScore,
        updatedAt: expert.updatedAt ?? expert.submittedAt ?? null,
        submittedAt: expert.submittedAt ?? expert.updatedAt ?? null,
      };
    })
    .sort((left, right) => {
      if (right.exact.score !== left.exact.score) return right.exact.score - left.exact.score;
      if (right.commonScore !== left.commonScore) return right.commonScore - left.commonScore;
      return left.originalIndex - right.originalIndex;
    });

  const thresholdEntries = rankedEntries.filter((entry) => entry.exact.score > 0 || entry.commonScore >= MIN_COMMON_FEATURE_SCORE);
  let selected = thresholdEntries;

  if (selected.length === 0) {
    const aiPool = rankedEntries.slice(0, AI_CANDIDATE_LIMIT).map((entry) => toAiCandidate(entry.expert));
    const { recommendExpertMatches } = await import('../../utils/aiService.js');
    const aiResult = await recommendExpertMatches({
      seeker: {
        category: seeker.category,
        topics: asStringArray(seeker.topics),
        needsText: seeker.needsText,
        additionalContext: seeker.additionalContext,
      },
      candidates: aiPool,
    });

    const aiMatches = normalizeAiMatches(aiResult.matches || [], new Map(aiPool.map((candidate) => [String(candidate.id), candidate])));
    const aiEntryMap = new Map(rankedEntries.map((entry) => [String(entry.expert.id), entry]));
    selected = aiMatches
      .map((match) => ({
        ...aiEntryMap.get(match.expertId),
        aiRelevanceReason: match.relevanceReason,
        aiConfidence: match.confidence,
      }))
      .filter(Boolean)
      .sort((left, right) => right.aiConfidence - left.aiConfidence);
  }

  const deduped = new Map();
  const sortedSelected = sortEntriesByCriteria(
    [...selected].filter((entry) => {
      const id = String(entry.expert.id);
      if (deduped.has(id)) return false;
      deduped.set(id, true);
      return true;
    }),
    filters.sort,
  );

  return sortedSelected.map(({ expert, exact, aiRelevanceReason, aiConfidence }, index) => {
    const effectiveExact = exact && Array.isArray(exact.matchedOn) && exact.matchedOn.length > 0
      ? exact
      : { ...exact, matchedOn: ['ai'], score: exact?.score ?? 0 };
    return serializeMatch(
      expert,
      effectiveExact,
      index + 1,
      aiRelevanceReason !== undefined ? { relevanceReason: aiRelevanceReason, confidence: aiConfidence } : {},
    );
  });
}
