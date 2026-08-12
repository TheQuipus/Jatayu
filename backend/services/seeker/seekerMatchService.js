import { Expert } from '../../models/index.js';

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 20;

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

function serializeMatch(expert, match, rank) {
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
    matchScore: match.score,
    matchedOn: match.matchedOn,
    matchedTopics: match.matchedTopics,
    matchedFormats: match.matchedFormats,
  };
}

export function parseMatchLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  const limit = Number.parseInt(value, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;
  return limit;
}

export async function findFeaturedMatches(seeker, limit = DEFAULT_LIMIT) {
  const experts = await Expert.findAll({
    where: { status: 'approved' },
    order: [['submittedAt', 'DESC'], ['updatedAt', 'DESC']],
  });

  return experts
    .map((expert, originalIndex) => ({
      expert,
      originalIndex,
      match: scoreExpert(seeker, expert),
    }))
    .sort((left, right) => (
      right.match.score - left.match.score || left.originalIndex - right.originalIndex
    ))
    .slice(0, limit)
    .map(({ expert, match }, index) => serializeMatch(expert, match, index + 1));
}
