import { Availability, Credential, Expert } from '../models/index.js';

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

function asObject(value) {
  const parsed = parseJson(value, {});
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {};
  const numericKeys = Object.keys(parsed).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length === Object.keys(parsed).length && numericKeys.length > 0) {
    const reconstructed = numericKeys
      .sort((left, right) => Number(left) - Number(right))
      .map((key) => parsed[key])
      .join('');
    return asObject(reconstructed);
  }
  return parsed;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

function publicExpertValues(expert) {
  const metadata = asObject(expert.onboardingMetadata);
  const skills = asStringArray(expert.skills);
  const focusAreas = asStringArray(expert.focusAreas);
  const languages = uniqueStrings([
    ...asStringArray(metadata.languages),
    ...asStringArray(metadata.selectedLanguages),
    ...asStringArray(metadata.spokenLanguages),
  ]);
  const formatPrices = asObject(expert.formatPrices);
  const validPrices = Object.values(formatPrices)
    .map(Number)
    .filter((price) => Number.isFinite(price) && price >= 0);
  const price = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const replyTimeMinutesValue = Number(metadata.replyTimeMinutes ?? metadata.responseTimeMinutes);
  const replyTimeMinutes = Number.isFinite(replyTimeMinutesValue) && replyTimeMinutesValue >= 0
    ? replyTimeMinutesValue
    : null;
  const replyTime = typeof metadata.replyTime === 'string'
    ? metadata.replyTime
    : replyTimeMinutes === null ? null : `${replyTimeMinutes} min`;
  return { metadata, skills, focusAreas, languages, formatPrices, price, replyTime, replyTimeMinutes };
}

function serializeCredential(credential) {
  return {
    id: credential.id,
    type: credential.type,
    title: credential.title,
    institution: credential.institution,
    startYear: credential.startYear,
    endYear: credential.endYear,
    description: credential.description,
  };
}

function serializeAvailability(availability) {
  return {
    id: availability.id,
    days: asStringArray(availability.days),
    fromTime: availability.fromTime,
    toTime: availability.toTime,
  };
}

export function serializePublicExpert(expert, { includeCredentials = true } = {}) {
  const values = publicExpertValues(expert);
  return {
    id: expert.id,
    fullName: expert.fullName,
    professionalTitle: expert.professionalTitle,
    tagLine: expert.tagLine,
    bio: expert.bio,
    profilePhotoSrc: expert.profilePhotoSrc,
    category: expert.category,
    skills: values.skills,
    focusAreas: values.focusAreas,
    topics: uniqueStrings([...values.skills, ...values.focusAreas]),
    languages: values.languages,
    experienceLevel: expert.experienceLevel,
    targetAudience: parseJson(expert.targetAudience, expert.targetAudience),
    timezone: expert.timezone,
    selectedFormats: asStringArray(expert.selectedFormats),
    selectedLengths: asStringArray(expert.selectedLengths),
    formatPrices: values.formatPrices,
    price: values.price,
    replyTime: values.replyTime,
    replyTimeMinutes: values.replyTimeMinutes,
    credentials: includeCredentials
      ? (expert.credentials || []).map(serializeCredential)
      : undefined,
    availabilities: (expert.availabilities || []).map(serializeAvailability),
  };
}

function queryValues(value) {
  const source = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return uniqueStrings(source.flatMap((item) => String(item).split(',')));
}

function normalized(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesAny(selected, available) {
  if (selected.length === 0) return true;
  const normalizedAvailable = available.map(normalized);
  return selected.some((value) => normalizedAvailable.includes(normalized(value)));
}

export function parsePublicExpertListQuery(query) {
  const page = query.page === undefined ? 1 : Number.parseInt(query.page, 10);
  const limit = query.limit === undefined ? 12 : Number.parseInt(query.limit, 10);
  const minPrice = query.minPrice === undefined ? null : Number(query.minPrice);
  const maxPrice = query.maxPrice === undefined ? null : Number(query.maxPrice);
  const search = String(query.search || '').trim();
  const categories = queryValues(query.category);
  const languages = queryValues(query.language);
  const availability = queryValues(query.availability).map(Number);
  const allowedSorts = new Set(['popularity', 'price-asc', 'price-desc', 'alphabetical', 'newest']);
  const sort = String(query.sort || 'popularity');
  const errors = [];
  if (!Number.isInteger(page) || page < 1) errors.push('page must be a positive integer');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push('limit must be between 1 and 100');
  if (search.length > 100) errors.push('search must not exceed 100 characters');
  if (minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) errors.push('minPrice must be a non-negative number');
  if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) errors.push('maxPrice must be a non-negative number');
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) errors.push('minPrice must not exceed maxPrice');
  if (availability.some((value) => ![15, 30, 120].includes(value))) {
    errors.push('availability values must be 15, 30, or 120');
  }
  if (!allowedSorts.has(sort)) errors.push('sort is invalid');
  return { page, limit, minPrice, maxPrice, search, categories, languages, availability, sort, errors };
}

export async function findPublicExperts(filters) {
  const experts = await Expert.findAll({
    where: { status: 'approved' },
    include: [{ model: Availability, as: 'availabilities', required: false }],
    order: [['updatedAt', 'DESC']],
  });
  const all = experts.map((expert) => serializePublicExpert(expert, { includeCredentials: false }));
  const search = normalized(filters.search);
  const filtered = all.filter((expert) => {
    if (search) {
      const searchable = [
        expert.fullName, expert.professionalTitle, expert.tagLine, expert.bio,
        expert.category, ...expert.topics, ...expert.languages,
      ].map(normalized).join(' ');
      if (!searchable.includes(search)) return false;
    }
    if (!matchesAny(filters.categories, [expert.category, ...expert.topics])) return false;
    if (!matchesAny(filters.languages, expert.languages)) return false;
    if (filters.minPrice !== null && (expert.price === null || expert.price < filters.minPrice)) return false;
    if (filters.maxPrice !== null && (expert.price === null || expert.price > filters.maxPrice)) return false;
    if (filters.availability.length > 0 && (
      expert.replyTimeMinutes === null
      || !filters.availability.some((maximum) => expert.replyTimeMinutes <= maximum)
    )) return false;
    return true;
  });

  filtered.sort((left, right) => {
    if (filters.sort === 'price-asc') return (left.price ?? Infinity) - (right.price ?? Infinity);
    if (filters.sort === 'price-desc') return (right.price ?? -1) - (left.price ?? -1);
    if (filters.sort === 'alphabetical') return left.fullName.localeCompare(right.fullName);
    if (filters.sort === 'newest') return 0;
    return 0;
  });

  const total = filtered.length;
  const offset = (filters.page - 1) * filters.limit;
  return {
    experts: filtered.slice(offset, offset + filters.limit),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
      hasNextPage: offset + filters.limit < total,
      hasPreviousPage: filters.page > 1,
    },
    filters: {
      categories: uniqueStrings(all.flatMap((expert) => [expert.category, ...expert.topics])),
      languages: uniqueStrings(all.flatMap((expert) => expert.languages)).sort(),
      price: (() => {
        const prices = all.map((expert) => expert.price).filter((price) => price !== null);
        return { min: prices.length > 0 ? Math.min(...prices) : null, max: prices.length > 0 ? Math.max(...prices) : null };
      })(),
      availability: [
        { value: 15, label: 'Under 15 min' },
        { value: 30, label: 'Under 30 min' },
        { value: 120, label: 'Under 2 hours' },
      ],
    },
  };
}

export async function findPublicExpertById(expertId) {
  return Expert.findOne({
    where: {
      id: expertId,
      status: 'approved',
    },
    include: [
      { model: Credential, as: 'credentials', required: false },
      { model: Availability, as: 'availabilities', required: false },
    ],
  });
}
