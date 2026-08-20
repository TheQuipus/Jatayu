import { getSetting } from './settingsHelper.js';

const TAGLINE_MAX = 160;
const BIO_MAX = 160;

function hasPlaceholderCredential(value) {
  if (!value) return true;
  const normalized = String(value).toLowerCase().trim();
  return (
    normalized.includes('your_') ||
    normalized.includes('change_me') ||
    normalized.includes('placeholder') ||
    normalized === 'sk-...' ||
    normalized.startsWith('sk-xxxx')
  );
}

function clip(value, max) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function asStringList(value, limit = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clip(item, 80))
    .filter(Boolean)
    .slice(0, limit);
}

export class AiNotConfiguredError extends Error {
  constructor(message = 'AI is not configured. Ask an admin to add an API key in Settings → AI Config.') {
    super(message);
    this.name = 'AiNotConfiguredError';
    this.code = 'AI_NOT_CONFIGURED';
  }
}

export class AiProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiProviderError';
    this.code = 'AI_PROVIDER_ERROR';
  }
}

export async function readAiSettings() {
  const providerName = await getSetting('AI_PROVIDER_NAME', 'OpenAI GPT-4');
  const apiKey = await getSetting('AI_API_KEY');
  const modelOverride = await getSetting('AI_MODEL');
  const baseUrl = await getSetting('AI_API_BASE_URL');

  const configured = Boolean(apiKey && !hasPlaceholderCredential(apiKey));
  return { providerName, apiKey, modelOverride, baseUrl, configured };
}

export async function isAiConfigured() {
  const { configured } = await readAiSettings();
  return configured;
}

function extractModelToken(name) {
  const match = String(name || '').match(
    /\b(gpt-4o-mini|gpt-4o|gpt-4-turbo|gpt-4|gpt-3\.5-turbo|claude-[\w.-]+|gemini-[\w.-]+|llama[\w.-]*)\b/i,
  );
  return match ? match[1] : '';
}

/** Map admin display names like "OpenAI GPT-4" / "GPT-4" to a real API model id. */
function mapFriendlyModel(raw) {
  const value = String(raw || '').trim();
  const lower = value.toLowerCase();
  if (!lower) return '';
  if (lower.includes('gpt-4o-mini') || (lower.includes('mini') && lower.includes('gpt'))) {
    return 'gpt-4o-mini';
  }
  if (lower === 'gpt-4o' || lower === 'gpt4o') return 'gpt-4o';
  if (lower.includes('gpt-4-turbo') || lower.includes('gpt-4 turbo')) return 'gpt-4-turbo';
  if (lower === 'gpt-4' || lower === 'gpt4' || lower === 'openai gpt-4' || /^gpt-4$/.test(lower)) {
    return 'gpt-4o';
  }
  if (lower.includes('gpt-3.5')) return 'gpt-3.5-turbo';
  if (/^(gpt-|claude-|gemini-|llama)/i.test(value)) return value;
  return '';
}

function resolveAiTarget(providerName, modelOverride) {
  const name = String(providerName || '').trim();
  const lower = name.toLowerCase();
  const namedModel = mapFriendlyModel(extractModelToken(name) || name);
  const override = mapFriendlyModel(modelOverride);

  if (lower.includes('claude') || lower.includes('anthropic')) {
    return {
      vendor: 'anthropic',
      model: override || namedModel || 'claude-3-5-sonnet-latest',
    };
  }

  if (lower.includes('gemini') || (lower.includes('google') && lower.includes('gemini'))) {
    return {
      vendor: 'gemini',
      model: override || namedModel || 'gemini-2.0-flash',
    };
  }

  if (lower.includes('groq')) {
    return {
      vendor: 'groq',
      model: override || namedModel || 'llama-3.3-70b-versatile',
    };
  }

  let model = override || namedModel;
  if (!model) {
    if (lower.includes('gpt-3.5')) model = 'gpt-3.5-turbo';
    else if (lower.includes('mini')) model = 'gpt-4o-mini';
    else if (lower.includes('gpt-4')) model = 'gpt-4o';
    else model = 'gpt-4o-mini';
  }

  return { vendor: 'openai', model };
}

function parseJsonObject(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new AiProviderError('AI returned an invalid response.');
  }
}

async function fetchWithTimeout(url, options, ms = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new AiProviderError('AI request timed out. Please try again.');
    }
    throw new AiProviderError('Could not reach the AI provider.');
  } finally {
    clearTimeout(timer);
  }
}

async function completeOpenAiCompatible({ apiKey, model, baseUrl, prompt }) {
  const endpoint = `${String(baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;
  const payload = {
    model,
    temperature: 0.7,
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content:
          'You write concise expert-marketplace profile copy. Reply with JSON only.',
      },
      { role: 'user', content: prompt },
    ],
  };

  async function send(body) {
    return fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  let response = await send({ ...payload, response_format: { type: 'json_object' } });
  let data = await response.json().catch(() => ({}));

  if (!response.ok && String(data?.error?.message || '').toLowerCase().includes('response_format')) {
    response = await send(payload);
    data = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new AiProviderError(`AI provider error: ${detail}`);
  }

  return data?.choices?.[0]?.message?.content || '';
}

async function completeAnthropic({ apiKey, model, prompt }) {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new AiProviderError(`AI provider error: ${detail}`);
  }

  const blocks = Array.isArray(data?.content) ? data.content : [];
  return blocks.map((block) => block?.text || '').join('\n');
}

async function completeGemini({ apiKey, model, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
    throw new AiProviderError(`AI provider error: ${detail}`);
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function completeChat({ settings, prompt }) {
  const { vendor, model } = resolveAiTarget(settings.providerName, settings.modelOverride);

  if (vendor === 'anthropic') {
    return completeAnthropic({ apiKey: settings.apiKey, model, prompt });
  }
  if (vendor === 'gemini') {
    return completeGemini({ apiKey: settings.apiKey, model, prompt });
  }
  if (vendor === 'groq') {
    return completeOpenAiCompatible({
      apiKey: settings.apiKey,
      model,
      baseUrl: settings.baseUrl || 'https://api.groq.com/openai/v1',
      prompt,
    });
  }

  return completeOpenAiCompatible({
    apiKey: settings.apiKey,
    model,
    baseUrl: settings.baseUrl || 'https://api.openai.com/v1',
    prompt,
  });
}

function formatEmployment(list) {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, 6)
    .map((item) => {
      const title = clip(item?.jobTitle || item?.title, 80);
      const company = clip(item?.company || item?.institution, 80);
      const responsibilities = clip(item?.responsibilities || item?.description, 180);
      if (!title && !company) return '';
      return [title && company ? `${title} at ${company}` : title || company, responsibilities]
        .filter(Boolean)
        .join(' — ');
    })
    .filter(Boolean);
}

function formatEducation(list) {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, 4)
    .map((item) => {
      const degree = clip(item?.degree || item?.title, 80);
      const field = clip(item?.fieldOfStudy, 80);
      const institution = clip(item?.institution, 80);
      return [degree, field, institution].filter(Boolean).join(' · ');
    })
    .filter(Boolean);
}

function buildPrompt(context) {
  const skills = asStringList(context.skills);
  const languages = asStringList(context.languages);
  const employment = formatEmployment(context.employment);
  const education = formatEducation(context.education);
  const tone = clip(context.tone, 40);
  const field = context.field === 'bio' ? 'bio' : context.field === 'tagLine' ? 'tagLine' : '';
  const intent = context.intent === 'improve' || context.intent === 'regenerate'
    ? context.intent
    : 'suggest';

  const fieldLabel = field === 'bio' ? 'brief introduction' : field === 'tagLine' ? 'tag line' : 'tag line and brief introduction';
  const intentInstructions = {
    suggest: `Write a fresh ${fieldLabel} from the context.`,
    regenerate:
      `Rewrite the ${fieldLabel} with a clearly different angle and wording. Do not reuse sentences or distinctive phrases from the current copy. Keep the same facts.`,
    improve:
      `Polish and tighten the current ${fieldLabel}. Keep the same meaning and facts. Make it more specific and confident. Do not repeat the current wording verbatim.`,
  };

  const jsonKeys = field === 'bio'
    ? 'Return JSON with key bio only.'
    : field === 'tagLine'
      ? 'Return JSON with key tagLine only.'
      : 'Return JSON with keys tagLine and bio only.';

  return [
    `Write an expert profile ${fieldLabel} for a consultation marketplace.`,
    jsonKeys,
    field !== 'bio' ? `tagLine: one line, max ${TAGLINE_MAX} characters, no quotation marks around the whole line.` : '',
    field !== 'tagLine' ? `bio: one short paragraph, max ${BIO_MAX} characters, first person, concrete, no hype.` : '',
    'Do not invent employers, degrees, or skills that are not in the context.',
    field ? `Only generate the ${fieldLabel}. Do not change the other field.` : '',
    intentInstructions[intent],
    '',
    'Context:',
    `- Name: ${clip(context.fullName, 80) || 'Expert'}`,
    `- Category: ${clip(context.category, 80) || 'Not specified'}`,
    `- Professional title: ${clip(context.professionalTitle, 80) || 'Not specified'}`,
    `- Experience level: ${clip(context.experienceLevel, 40) || 'Not specified'}`,
    `- Skills: ${skills.join(', ') || 'Not specified'}`,
    `- Languages: ${languages.join(', ') || 'Not specified'}`,
    `- Experience: ${employment.join('; ') || 'Not specified'}`,
    `- Education: ${education.join('; ') || 'Not specified'}`,
    `- Task: ${intent}`,
    field ? `- Field: ${field}` : '',
    tone ? `- Tone: ${tone}` : '',
    context.currentTagLine ? `- Current tag line: ${clip(context.currentTagLine, TAGLINE_MAX)}` : '',
    context.currentBio ? `- Current introduction: ${clip(context.currentBio, BIO_MAX)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const AI_FALLBACK_NOTICE =
  'Suggested from your profile details. Live AI is temporarily unavailable.';

function normalizeCopy(value) {
  return clip(value, 400).toLowerCase();
}

function identityTemplates(context) {
  const name = clip(context.fullName, 40);
  const category = clip(context.category, 40);
  const title = clip(context.professionalTitle, 70);
  const skills = asStringList(context.skills, 4);
  const level = clip(context.experienceLevel, 40);
  const role = title || (category ? `${category} expert` : 'consultant');
  const roleLower = role.toLowerCase();
  const skillPhrase = skills.length > 0 ? skills.slice(0, 3).join(', ') : category || 'practical, clear advice';
  const who = name || 'I';
  const introName = who === 'I' ? "I'm" : `I'm ${who},`;
  const levelPrefix = level ? `${level} ` : '';

  return [
    {
      tagLine: `I help people with ${skillPhrase} — practical ${roleLower} guidance that moves work forward.`,
      bio: `${introName} a ${levelPrefix}${role}. I focus on ${skillPhrase} and help clients make confident decisions.`,
    },
    {
      tagLine: `${role} focused on ${skillPhrase}. Clear next steps, not generic advice.`,
      bio: `I work as a ${levelPrefix}${role}, with a focus on ${skillPhrase}. I keep recommendations concrete so you can act quickly.`,
    },
    {
      tagLine: `Hands-on ${roleLower} support for ${skillPhrase}.`,
      bio: `${who === 'I' ? 'I help' : `${who} helps`} clients with ${skillPhrase}. Expect practical ${roleLower} guidance you can use right away.`,
    },
    {
      tagLine: `I bring clarity to ${skillPhrase} so you can decide and ship with confidence.`,
      bio: `As a ${levelPrefix}${role}, I turn ${skillPhrase} into a simple plan you can follow this week.`,
    },
    {
      tagLine: `Specialist ${roleLower} for ${skillPhrase} — specific advice, no fluff.`,
      bio: `I specialise in ${skillPhrase}. Sessions stay on your situation, not a generic playbook.`,
    },
    {
      tagLine: `A thinking partner for ${skillPhrase}, from the first question to a usable next step.`,
      bio: `You get a ${roleLower} who listens first, then maps ${skillPhrase} to actions you can take immediately.`,
    },
  ].map((pair) => ({
    tagLine: clip(pair.tagLine, TAGLINE_MAX),
    bio: clip(pair.bio, BIO_MAX),
  }));
}

function isSameCopy(candidate, avoidTag, avoidBio) {
  return (
    (avoidTag && normalizeCopy(candidate.tagLine) === normalizeCopy(avoidTag)) ||
    (avoidBio && normalizeCopy(candidate.bio) === normalizeCopy(avoidBio))
  );
}

function forceRevise(pair, avoidTag, avoidBio) {
  let tagLine = pair.tagLine;
  let bio = pair.bio;
  if (avoidTag && normalizeCopy(tagLine) === normalizeCopy(avoidTag)) {
    tagLine = clip(`Revised: ${tagLine.replace(/^Revised:\s*/i, '')}`, TAGLINE_MAX);
    if (normalizeCopy(tagLine) === normalizeCopy(avoidTag)) {
      tagLine = clip(`${tagLine} Different angle, same expertise.`, TAGLINE_MAX);
    }
  }
  if (avoidBio && normalizeCopy(bio) === normalizeCopy(avoidBio)) {
    bio = clip(`In short: ${bio.replace(/^In short:\s*/i, '')}`, BIO_MAX);
    if (normalizeCopy(bio) === normalizeCopy(avoidBio)) {
      bio = clip(`${bio} Sharper, more specific, and ready to use.`, BIO_MAX);
    }
  }
  return { tagLine, bio };
}

function polishLine(text, max) {
  const original = clip(text, max);
  if (!original) return '';

  const replacements = [
    [/I help people with /i, 'I work with clients on '],
    [/I help clients with /i, 'I partner with people on '],
    [/^Hands-on /i, 'Practical '],
    [/ focused on /i, ' specialising in '],
    [/ that moves work forward\.?$/i, '.'],
    [/, not generic advice\.?$/i, ', grounded in real delivery.'],
    [/confident decisions\.?$/i, 'clear, timely decisions.'],
    [/you can use right away\.?$/i, 'you can apply in the next conversation.'],
    [/^Expect practical /i, 'You’ll get practical '],
    [/^I'm a /i, 'As a '],
    [/^I work as a /i, "I'm a "],
    [/^As a /i, 'I work as a '],
    [/no fluff\.?$/i, 'straight to the point.'],
    [/immediately\.?$/i, 'in the same session.'],
  ];

  for (const [from, to] of replacements) {
    if (from.test(original)) {
      const next = clip(original.replace(from, to), max);
      if (normalizeCopy(next) !== normalizeCopy(original)) return next;
    }
  }

  if (original.endsWith('.')) {
    return clip(`${original.slice(0, -1)} — clearer, more specific, and easier to act on.`, max);
  }
  return clip(`${original}. Sharper wording, same expertise.`, max);
}

function pickUnusedTemplate(templates, avoidTag, avoidBio, startIndex) {
  const start = ((startIndex % templates.length) + templates.length) % templates.length;
  for (let i = 0; i < templates.length; i += 1) {
    const candidate = templates[(start + i) % templates.length];
    if (!isSameCopy(candidate, avoidTag, avoidBio)) return candidate;
  }
  return forceRevise(templates[start], avoidTag, avoidBio);
}

function withFieldLock(pair, field, avoidTag, avoidBio) {
  if (field === 'tagLine') return { tagLine: pair.tagLine, bio: avoidBio || pair.bio };
  if (field === 'bio') return { tagLine: avoidTag || pair.tagLine, bio: pair.bio };
  return pair;
}

export function buildLocalIdentityCopy(context = {}) {
  const templates = identityTemplates(context);
  const avoidTag = clip(context.currentTagLine, TAGLINE_MAX);
  const avoidBio = clip(context.currentBio, BIO_MAX);
  const field = context.field === 'bio' || context.field === 'tagLine' ? context.field : '';
  const intent = context.intent === 'improve' || context.intent === 'regenerate'
    ? context.intent
    : avoidTag || avoidBio
      ? 'regenerate'
      : 'suggest';

  if (intent === 'improve' && (avoidTag || avoidBio)) {
    const polished = {
      tagLine: field === 'bio' ? avoidTag : avoidTag ? polishLine(avoidTag, TAGLINE_MAX) : templates[0].tagLine,
      bio: field === 'tagLine' ? avoidBio : avoidBio ? polishLine(avoidBio, BIO_MAX) : templates[0].bio,
    };
    if (!isSameCopy(polished, avoidTag, avoidBio)) {
      return withFieldLock(polished, field, avoidTag, avoidBio);
    }
    const matchIndex = templates.findIndex((pair) => isSameCopy(pair, avoidTag, avoidBio));
    return withFieldLock(
      pickUnusedTemplate(templates, avoidTag, avoidBio, matchIndex >= 0 ? matchIndex + 1 : 1),
      field,
      avoidTag,
      avoidBio,
    );
  }

  const matched = templates.findIndex((pair) => isSameCopy(pair, avoidTag, avoidBio));
  const requested = Number.isFinite(context.variantIndex) ? Number(context.variantIndex) : null;

  let startIndex = 0;
  if (intent === 'suggest' && !avoidTag && !avoidBio) {
    startIndex = requested ?? 0;
  } else if (requested != null) {
    startIndex = requested;
  } else if (matched >= 0) {
    startIndex = matched + 1;
  } else {
    startIndex = 1;
  }

  return withFieldLock(
    pickUnusedTemplate(templates, avoidTag, avoidBio, startIndex),
    field,
    avoidTag,
    avoidBio,
  );
}

export async function suggestExpertIdentityCopy(context = {}) {
  const local = buildLocalIdentityCopy(context);
  const settings = await readAiSettings();

  if (!settings.configured) {
    return { ...local, source: 'fallback', notice: AI_FALLBACK_NOTICE };
  }

  try {
    const raw = await completeChat({
      settings,
      prompt: buildPrompt(context),
    });
    const parsed = parseJsonObject(raw);

    const tagLine = clip(
      parsed.tagLine || parsed.tagline || parsed.headline || '',
      TAGLINE_MAX,
    );
    const bio = clip(
      parsed.bio || parsed.briefIntroduction || parsed.introduction || '',
      BIO_MAX,
    );
    const field = context.field === 'bio' ? 'bio' : context.field === 'tagLine' ? 'tagLine' : '';

    if ((field === 'tagLine' && !tagLine) || (field === 'bio' && !bio) || (!field && !tagLine && !bio)) {
      throw new AiProviderError('AI did not return usable copy.');
    }

    const avoidTag = clip(context.currentTagLine, TAGLINE_MAX);
    const avoidBio = clip(context.currentBio, BIO_MAX);
    const intent = context.intent === 'improve' || context.intent === 'regenerate'
      ? context.intent
      : 'suggest';

    const next = {
      tagLine: field === 'bio' ? avoidTag : (tagLine || local.tagLine),
      bio: field === 'tagLine' ? avoidBio : (bio || local.bio),
    };

    if (
      (intent === 'regenerate' || intent === 'improve') &&
      isSameCopy(next, avoidTag, avoidBio)
    ) {
      return { ...local, source: 'fallback', notice: AI_FALLBACK_NOTICE };
    }

    return { ...next, source: 'ai' };
  } catch (error) {
    console.warn('AI suggest falling back to local copy:', error?.message || error);
    return { ...local, source: 'fallback', notice: AI_FALLBACK_NOTICE };
  }
}
