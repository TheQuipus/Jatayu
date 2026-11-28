const CATEGORY_ALIASES = new Map([
  ['software', 'software'],
  ['software engineering', 'software'],
  ['software development', 'software'],
  ['software and development', 'software'],
  ['technology', 'software'],

  ['design', 'design'],
  ['product design', 'design'],
  ['design creative', 'design'],
  ['design and creative', 'design'],

  ['business', 'business'],
  ['business strategy', 'business'],
  ['business consulting', 'business'],
  ['business and consulting', 'business'],
  ['business entrepreneurship', 'business'],
  ['business and entrepreneurship', 'business'],
  ['startup', 'business'],
  ['startup fundraising', 'business'],
  ['startup and fundraising', 'business'],
  ['smb growth', 'business'],

  ['marketing', 'marketing'],
  ['marketing growth', 'marketing'],
  ['marketing and growth', 'marketing'],

  ['finance', 'finance'],
  ['finance vc', 'finance'],
  ['finance and vc', 'finance'],
  ['finance tax', 'finance'],
  ['finance and tax', 'finance'],
  ['tax finance', 'finance'],
  ['tax and finance', 'finance'],
  ['finance investment', 'finance'],
  ['finance and investment', 'finance'],

  ['health', 'health'],
  ['health wellness', 'health'],
  ['health and wellness', 'health'],
  ['healthcare', 'health'],

  ['legal', 'legal'],
  ['legal compliance', 'legal'],
  ['legal and compliance', 'legal'],
  ['legal founder contracts', 'legal'],
  ['legal and founder contracts', 'legal'],
  ['law', 'legal'],

  ['product', 'product'],
  ['product management', 'product'],

  ['data', 'data'],
  ['data science', 'data'],
  ['data analytics', 'data'],
  ['data and analytics', 'data'],

  ['career work', 'career-work'],
  ['career and work', 'career-work'],
  ['career', 'career-work'],
  ['career jobs', 'career-work'],
  ['career and jobs', 'career-work'],

  ['personal growth', 'personal-growth'],
]);

const NONE_CATEGORIES = new Set(['', 'other', 'other not sure']);

const FORMAT_ALIASES = new Map([
  ['written', 'written'],
  ['text', 'written'],
  ['chat', 'written'],
  ['text messaging', 'written'],
  ['messaging', 'written'],

  ['video', 'video'],
  ['1 1 video call', 'video'],
  ['1:1 video call', 'video'],
  ['video call', 'video'],

  ['shoutout', 'shoutout'],
  ['audio', 'shoutout'],
  ['video shoutout', 'shoutout'],

  ['group', 'group'],
  ['live chat', 'group'],
  ['group session', 'group'],
]);

const LANGUAGE_CODE_MAP = new Map([
  ['en', 'english'],
  ['hi', 'hindi'],
  ['bn', 'bengali'],
  ['te', 'telugu'],
  ['mr', 'marathi'],
  ['ta', 'tamil'],
  ['ur', 'urdu'],
  ['gu', 'gujarati'],
  ['kn', 'kannada'],
  ['ml', 'malayalam'],
  ['or', 'odia'],
  ['pa', 'punjabi'],
  ['as', 'assamese'],
  ['ko', 'konkani'],
  ['kok', 'konkani'],
  ['ks', 'kashmiri'],
  ['sd', 'sindhi'],
  ['ne', 'nepali'],
  ['mt', 'maithili'],
  ['mai', 'maithili'],
  ['st', 'santali'],
  ['sat', 'santali'],
  ['bo', 'bodo'],
  ['brx', 'bodo'],
  ['dg', 'dogri'],
  ['doi', 'dogri'],
  ['mn', 'manipuri'],
  ['mni', 'manipuri'],
  ['sa', 'sanskrit'],
]);

function cleanPunctuation(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeCategoryKey(value) {
  const cleaned = cleanPunctuation(value);
  if (NONE_CATEGORIES.has(cleaned)) return '';

  const withoutCustomPrefix = cleaned.replace(/^custom\s+/, '').trim();
  if (NONE_CATEGORIES.has(withoutCustomPrefix)) return '';

  return CATEGORY_ALIASES.get(withoutCustomPrefix)
    || CATEGORY_ALIASES.get(cleaned)
    || withoutCustomPrefix;
}

export function normalizeFormatKey(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (FORMAT_ALIASES.has(raw)) return FORMAT_ALIASES.get(raw);

  const cleaned = cleanPunctuation(raw);
  return FORMAT_ALIASES.get(cleaned) || raw;
}

export function normalizeLanguageKey(value) {
  const cleaned = String(value || '').trim().toLowerCase();
  if (!cleaned) return '';
  return LANGUAGE_CODE_MAP.get(cleaned) || cleaned;
}
