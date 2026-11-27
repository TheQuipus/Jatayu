import { Expert } from '../../models/index.js';
import { matchesNonSearchFilters, parsePublicExpertListQuery, serializePublicExpert } from '../publicExpertService.js';
import {
  comparePriorityEvaluations,
  rankExpertsByPriority,
} from './priorityExpertMatcher.js';

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 20;
const DISCOVER_CANDIDATE_LIMIT = 200;

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

function splitListValues(value) {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return [...new Set(list.flatMap((item) => String(item || '').split(',')).map((item) => item.trim()).filter(Boolean))];
}

function serializeMatch(expert, evaluation, rank) {
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
    languages: asStringArray(expert.languages),
    price: expert.price ?? null,
    rating: expert.rating ?? null,
    rank,
    matchTier: evaluation.matchTier,
    matchScore: evaluation.matchScore,
    matchedOn: evaluation.matchedOn,
    matchedTopics: evaluation.matchedTopics,
    matchedFormats: evaluation.matchedFormats,
  };
}

function sortEntriesByCriteria(entries, sortKey) {
  const ordered = [...entries];

  const timestampValue = (entry) => {
    const raw = entry?.updatedAt ?? entry?.submittedAt ?? entry?.expert?.updatedAt ?? entry?.expert?.submittedAt ?? 0;
    return Number(new Date(raw).getTime()) || 0;
  };

  switch (sortKey) {
    case 'price-asc':
      return ordered.sort((left, right) => {
        const leftPrice = Number.isFinite(Number(left.expert.price)) ? Number(left.expert.price) : Number.POSITIVE_INFINITY;
        const rightPrice = Number.isFinite(Number(right.expert.price)) ? Number(right.expert.price) : Number.POSITIVE_INFINITY;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;
        return comparePriorityEvaluations(left, right);
      });
    case 'price-desc':
      return ordered.sort((left, right) => {
        const leftPrice = Number.isFinite(Number(left.expert.price)) ? Number(left.expert.price) : -1;
        const rightPrice = Number.isFinite(Number(right.expert.price)) ? Number(right.expert.price) : -1;
        if (leftPrice !== rightPrice) return rightPrice - leftPrice;
        return comparePriorityEvaluations(left, right);
      });
    case 'alphabetical':
      return ordered.sort((left, right) => {
        const nameComparison = String(left.expert.fullName || '').localeCompare(String(right.expert.fullName || ''));
        if (nameComparison !== 0) return nameComparison;
        return comparePriorityEvaluations(left, right);
      });
    case 'newest':
      return ordered.sort((left, right) => {
        const leftUpdated = timestampValue(left);
        const rightUpdated = timestampValue(right);
        if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
        return comparePriorityEvaluations(left, right);
      });
    case 'popularity':
    default:
      return ordered.sort(comparePriorityEvaluations);
  }
}

export function parseMatchLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  const limit = Number.parseInt(value, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;
  return limit;
}

function parseDiscoverCriteria(rawCriteria = {}, { ignoreCategoryAndTopics = false } = {}) {
  const categoryValues = ignoreCategoryAndTopics
    ? []
    : [...new Set([
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
    ].map((value) => normalize(value)).join(' ');
    if (!searchable.includes(normalize(filters.search))) return false;
  }

  return matchesNonSearchFilters(expert, filters);
}

export async function findFeaturedMatches(seeker = {}, limit = DEFAULT_LIMIT, rawCriteria = {}, options = {}) {
  const treatCategoryTopicsAsRankingOnly = Boolean(options.treatCategoryTopicsAsRankingOnly);
  const filters = parseDiscoverCriteria(rawCriteria, {
    ignoreCategoryAndTopics: treatCategoryTopicsAsRankingOnly,
  });
  if (filters.errors && filters.errors.length > 0) {
    throw Object.assign(new Error(filters.errors.join('; ')), { statusCode: 400 });
  }

  const experts = await Expert.findAll({
    attributes: [
      'id',
      'fullName',
      'professionalTitle',
      'tagLine',
      'bio',
      'profilePhotoSrc',
      'category',
      'skills',
      'focusAreas',
      'experienceLevel',
      'timezone',
      'selectedFormats',
      'selectedLengths',
      'formatPrices',
      'targetAudience',
      'onboardingMetadata',
      'submittedAt',
      'updatedAt',
    ],
    where: { status: 'approved' },
    order: [['submittedAt', 'DESC'], ['updatedAt', 'DESC']],
    limit: DISCOVER_CANDIDATE_LIMIT,
  });

  if (experts.length === 0) {
    return [];
  }

  const eligiblePublicExperts = [];
  const rawExpertById = new Map();

  for (const expert of experts) {
    const publicExpert = serializePublicExpert(expert, { includeCredentials: false });
    if (!matchesDiscoverQuery(publicExpert, filters)) continue;
    eligiblePublicExperts.push({
      ...publicExpert,
      submittedAt: expert.submittedAt ?? expert.updatedAt ?? null,
      updatedAt: expert.updatedAt ?? expert.submittedAt ?? null,
    });
    rawExpertById.set(String(publicExpert.id), expert);
  }

  if (eligiblePublicExperts.length === 0) {
    return [];
  }

  const rankingOptions = {};
  if (treatCategoryTopicsAsRankingOnly) {
    const queryCategories = splitListValues(rawCriteria.category ?? rawCriteria.categories);
    if (queryCategories.length > 0) {
      rankingOptions.categoryOverride = queryCategories[0];
    }
    const queryTopics = splitListValues(rawCriteria.topics ?? rawCriteria.topic);
    if (queryTopics.length > 0) {
      rankingOptions.topicsOverride = queryTopics;
    }
  }

  const prioritized = rankExpertsByPriority(seeker, eligiblePublicExperts, rankingOptions)
    .map((entry) => {
      const rawExpert = rawExpertById.get(String(entry.expert.id));
      return {
        ...entry,
        submittedAt: rawExpert?.submittedAt ?? rawExpert?.updatedAt ?? null,
        updatedAt: rawExpert?.updatedAt ?? rawExpert?.submittedAt ?? null,
      };
    });

  const deduped = new Map();
  const uniqueEntries = prioritized.filter((entry) => {
    const id = String(entry.expert.id);
    if (deduped.has(id)) return false;
    deduped.set(id, true);
    return true;
  });

  const sortedEntries = sortEntriesByCriteria(uniqueEntries, filters.sort);

  return sortedEntries.map(({ expert, evaluation }, index) => serializeMatch(expert, evaluation, index + 1));
}
