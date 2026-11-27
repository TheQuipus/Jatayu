import {
  normalizeCategoryKey,
  normalizeFormatKey,
  normalizeLanguageKey,
} from '../../utils/expertCategory.js';

export { normalizeCategoryKey, normalizeFormatKey, normalizeLanguageKey };

// Bounds sourced from jatayu-frontend-main/components/seeker/onboarding/BudgetStep.tsx (lines 26-63).
// `elite` has no upper cap (`maxPrice: null`) per JAT-150 specification.
export const BUDGET_RANGES = Object.freeze({
  budget: Object.freeze({ id: 'budget', minPrice: 49, maxPrice: 2500 }),
  standard: Object.freeze({ id: 'standard', minPrice: 2501, maxPrice: 8000 }),
  premium: Object.freeze({ id: 'premium', minPrice: 8001, maxPrice: 20000 }),
  elite: Object.freeze({ id: 'elite', minPrice: 20001, maxPrice: null }),
});

export const CATEGORY_KEYWORDS = Object.freeze({
  software: [
    'software', 'frontend', 'backend', 'mobile', 'cloud', 'devops', 'system',
    'design', 'security', 'cryptography', 'database', 'tuning', 'ai', 'ml',
    'api', 'integrations', 'engineering', 'development', 'architecture', 'code',
  ],
  design: [
    'design', 'ui', 'ux', 'interaction', 'wireframing', 'branding', 'visual',
    'research', 'prototyping', 'motion', 'webflow', 'framer', 'creative', 'product',
  ],
  business: [
    'business', 'strategy', 'market', 'research', 'financial', 'modeling',
    'growth', 'operations', 'mergers', 'acquisitions', 'startup', 'scaling',
    'gtm', 'consulting', 'entrepreneurship', 'pricing', 'competitive',
  ],
  marketing: [
    'marketing', 'ads', 'meta', 'google', 'seo', 'content', 'brand', 'email',
    'automation', 'conversion', 'influencer', 'growth', 'hacking', 'acquisition',
  ],
  finance: [
    'finance', 'vc', 'fundraising', 'tax', 'gst', 'bookkeeping', 'equity',
    'cap', 'cfo', 'treasury', 'valuation', 'audit', 'investment', 'budgeting',
  ],
  health: [
    'health', 'wellness', 'diet', 'nutrition', 'mental', 'fitness', 'yoga',
    'mindfulness', 'sleep', 'hygiene', 'corporate', 'holistic', 'therapy',
    'medical', 'healthcare',
  ],
  legal: [
    'legal', 'compliance', 'contracts', 'agreements', 'esop', 'saas', 'ip',
    'patents', 'regulatory', 'incorporation', 'privacy', 'gdpr', 'law', 'founder',
  ],
  product: [
    'product', 'management', 'strategy', 'roadmapping', 'roadmap', 'agile',
    'scrum', 'analytics', 'testing', 'prioritization', 'user', 'story',
  ],
  data: [
    'data', 'science', 'analytics', 'warehousing', 'sql', 'postgres', 'python',
    'predictive', 'modeling', 'bi', 'dashboards', 'pipelines', 'big',
  ],
  'career-work': [
    'career', 'work', 'interview', 'resume', 'salary', 'negotiation',
    'leadership', 'pivot', 'coaching', 'remote', 'networking', 'branding',
    'promotion', 'burnout', 'portfolio', 'linkedin', 'speaking', 'freelancing',
  ],
  'personal-growth': [
    'personal', 'growth', 'mindset', 'coaching', 'habit', 'confidence',
    'life', 'direction', 'stress', 'balance', 'clarity',
  ],
});

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

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value, minLength = 3) {
  return new Set(
    normalizeText(value)
      .split(/\s+/)
      .filter((term) => term.length >= minLength),
  );
}

function normalizeUnique(values, normalizer) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizer).filter(Boolean))];
}

export function parseBudgetRange(selectedBudget) {
  const key = String(selectedBudget || '').trim().toLowerCase();
  return BUDGET_RANGES[key] || null;
}

function extractNormalizedFormatPrices(formatPricesRaw) {
  const parsed = parseJson(formatPricesRaw, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return new Map();

  const priceMap = new Map();
  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    const key = normalizeFormatKey(rawKey);
    const num = Number(rawValue);
    if (!key || !Number.isFinite(num) || num <= 0) continue;
    const existing = priceMap.get(key);
    priceMap.set(key, existing === undefined ? num : Math.min(existing, num));
  }
  return priceMap;
}

function evaluatePriceMatch(budgetRange, expert, matchedFormats, formatProvided) {
  if (!budgetRange) {
    return { priceProvided: false, priceMatched: false, comparedPrice: null };
  }

  const priceMap = extractNormalizedFormatPrices(expert.formatPrices);
  let candidatePrices = [];

  if (formatProvided && matchedFormats.length > 0) {
    candidatePrices = matchedFormats
      .map((format) => priceMap.get(format))
      .filter((price) => Number.isFinite(price) && price > 0);
  } else {
    candidatePrices = [...priceMap.values()];
    if (candidatePrices.length === 0 && Number.isFinite(Number(expert.price)) && Number(expert.price) > 0) {
      candidatePrices = [Number(expert.price)];
    }
  }

  if (candidatePrices.length === 0) {
    return { priceProvided: true, priceMatched: false, comparedPrice: null };
  }

  const lowestCandidate = Math.min(...candidatePrices);
  const priceMatched = budgetRange.maxPrice === null
    ? lowestCandidate > 0
    : lowestCandidate <= budgetRange.maxPrice;

  return {
    priceProvided: true,
    priceMatched,
    comparedPrice: lowestCandidate,
  };
}

function computeTopicAndKeywordSignals(seeker, expert, seekerCategoryKey) {
  const seekerTopics = asStringArray(seeker.topics);
  const expertSkills = asStringArray(expert.skills);
  const expertFocusAreas = asStringArray(expert.focusAreas);
  const expertTopicList = [...expertSkills, ...expertFocusAreas];

  const expertTopicNormSet = new Set(expertTopicList.map(normalizeText).filter(Boolean));
  const matchedTopics = seekerTopics.filter((topic) => expertTopicNormSet.has(normalizeText(topic)));

  const seekerNeedsTerms = tokenize([
    seeker.needsText,
    seeker.additionalContext,
    ...asStringArray(seeker.selectedNeedChips),
    ...seekerTopics,
  ].filter(Boolean).join(' '));

  const expertProfileTerms = tokenize([
    expert.professionalTitle,
    expert.tagLine,
    expert.bio,
    expert.targetAudience,
    ...expertTopicList,
  ].filter(Boolean).join(' '));

  const matchedNeedTerms = [...seekerNeedsTerms].filter((term) => expertProfileTerms.has(term));
  const topicOverlapScore = Math.min(matchedTopics.length * 10, 40) + Math.min(matchedNeedTerms.length * 2, 20);

  // Tier 5 nearest-match scoring: skills/focusAreas weighted highest against category keywords + seeker topics/needs
  const categoryKeywordList = seekerCategoryKey && CATEGORY_KEYWORDS[seekerCategoryKey]
    ? CATEGORY_KEYWORDS[seekerCategoryKey]
    : [];
  const seekerKeywordSet = new Set([
    ...categoryKeywordList,
    ...tokenize(seeker.category || '', 2),
    ...seekerNeedsTerms,
  ]);

  let skillKeywordMatches = 0;
  for (const skill of expertTopicList) {
    const skillTerms = tokenize(skill, 2);
    if ([...skillTerms].some((term) => seekerKeywordSet.has(term))) {
      skillKeywordMatches += 1;
    }
  }

  const profileKeywordMatches = [...seekerKeywordSet].filter((term) => expertProfileTerms.has(term)).length;
  const nearestMatchBase = (skillKeywordMatches * 15) + Math.min(profileKeywordMatches * 4, 24);

  return {
    matchedTopics,
    matchedNeedTerms,
    topicOverlapScore,
    nearestMatchBase,
  };
}

function timestampValue(expert) {
  const raw = expert?.submittedAt ?? expert?.updatedAt ?? 0;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function evaluateExpertTier(seeker = {}, expert = {}, options = {}) {
  const rawCategory = options.categoryOverride !== undefined ? options.categoryOverride : seeker.category;
  const effectiveSeeker = options.topicsOverride !== undefined
    ? { ...seeker, topics: options.topicsOverride }
    : seeker;

  const seekerCategoryKey = normalizeCategoryKey(rawCategory);
  const expertCategoryKey = normalizeCategoryKey(expert.category);
  const categoryMatched = Boolean(seekerCategoryKey && expertCategoryKey && seekerCategoryKey === expertCategoryKey);

  const seekerFormats = normalizeUnique(asStringArray(effectiveSeeker.selectedFormats), normalizeFormatKey);
  const expertFormats = normalizeUnique(asStringArray(expert.selectedFormats), normalizeFormatKey);
  const expertFormatSet = new Set(expertFormats);
  const formatProvided = seekerFormats.length > 0;
  const matchedFormats = seekerFormats.filter((format) => expertFormatSet.has(format));
  const formatMatched = formatProvided && matchedFormats.length > 0;

  const budgetRange = parseBudgetRange(effectiveSeeker.selectedBudget);
  const { priceProvided, priceMatched } = evaluatePriceMatch(budgetRange, expert, matchedFormats, formatProvided);

  const seekerLanguages = normalizeUnique(asStringArray(effectiveSeeker.selectedLanguages), normalizeLanguageKey);
  const expertLanguages = normalizeUnique([
    ...asStringArray(expert.languages),
    ...asStringArray(expert.onboardingMetadata?.languages),
  ], normalizeLanguageKey);
  const expertLanguageSet = new Set(expertLanguages);
  const languageProvided = seekerLanguages.length > 0;
  const languageMatched = languageProvided && seekerLanguages.some((lang) => expertLanguageSet.has(lang));

  let matchTier = 5;
  if (categoryMatched) {
    const effectiveFormat = !formatProvided || formatMatched;
    const effectivePrice = !priceProvided || priceMatched;
    const effectiveLanguage = !languageProvided || languageMatched;

    if (effectiveFormat && effectivePrice && effectiveLanguage) {
      matchTier = 1;
    } else if (effectiveFormat && effectivePrice) {
      matchTier = 2;
    } else if (effectiveFormat) {
      matchTier = 3;
    } else {
      matchTier = 4;
    }
  }

  const secondaryMatchedCount = [formatMatched, priceMatched, languageMatched].filter(Boolean).length;
  const signals = computeTopicAndKeywordSignals(effectiveSeeker, expert, seekerCategoryKey);
  const secondaryBonus = (formatMatched ? 3 : 0) + (languageMatched ? 3 : 0) + (priceMatched ? 2 : 0);
  const nearestMatchScore = signals.nearestMatchBase + (signals.nearestMatchBase > 0 ? secondaryBonus : 0);

  const matchedOn = [];
  if (categoryMatched) matchedOn.push('category');
  if (formatMatched) matchedOn.push('formats');
  if (priceMatched) matchedOn.push('price');
  if (languageMatched) matchedOn.push('language');
  if (signals.matchedTopics.length > 0) matchedOn.push('topics');
  if (signals.matchedNeedTerms.length > 0) matchedOn.push('needs');

  // Deterministic score for backward-compatible matchScore field (100..0)
  const tierBaseScore = { 1: 90, 2: 75, 3: 60, 4: 45, 5: 10 }[matchTier];
  const matchScore = Math.min(100, tierBaseScore + Math.min(10, Math.round(signals.topicOverlapScore / 6)));

  const rating = Number.isFinite(Number(expert.rating)) ? Number(expert.rating) : 0;

  return {
    matchTier,
    matchScore,
    matchedOn,
    matchedTopics: signals.matchedTopics,
    matchedFormats,
    matchedCriteria: {
      category: categoryMatched,
      format: formatMatched,
      price: priceMatched,
      language: languageMatched,
    },
    secondaryMatchedCount,
    topicOverlapScore: signals.topicOverlapScore,
    nearestMatchScore,
    rating,
    recencyMs: timestampValue(expert),
  };
}

export function comparePriorityEvaluations(left, right) {
  if (left.evaluation.matchTier !== right.evaluation.matchTier) {
    return left.evaluation.matchTier - right.evaluation.matchTier;
  }
  if (right.evaluation.secondaryMatchedCount !== left.evaluation.secondaryMatchedCount) {
    return right.evaluation.secondaryMatchedCount - left.evaluation.secondaryMatchedCount;
  }
  if (right.evaluation.topicOverlapScore !== left.evaluation.topicOverlapScore) {
    return right.evaluation.topicOverlapScore - left.evaluation.topicOverlapScore;
  }
  if (right.evaluation.nearestMatchScore !== left.evaluation.nearestMatchScore) {
    return right.evaluation.nearestMatchScore - left.evaluation.nearestMatchScore;
  }
  if (right.evaluation.rating !== left.evaluation.rating) {
    return right.evaluation.rating - left.evaluation.rating;
  }
  if (right.evaluation.recencyMs !== left.evaluation.recencyMs) {
    return right.evaluation.recencyMs - left.evaluation.recencyMs;
  }
  return String(left.expert?.id || '').localeCompare(String(right.expert?.id || ''));
}

export function rankExpertsByPriority(seeker = {}, experts = [], options = {}) {
  return experts
    .map((expert) => ({
      expert,
      evaluation: evaluateExpertTier(seeker, expert, options),
    }))
    .sort(comparePriorityEvaluations);
}
