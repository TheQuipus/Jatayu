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
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;

  const sliced = normalized.slice(0, max);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > max * 0.5) {
    const trimmedPart = sliced.slice(0, lastSpace).replace(/[,;:\-\s.]+$/, '');
    return trimmedPart + '.';
  }
  return sliced;
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

  // Fallback AI provider settings (e.g. Gemini)
  const fallbackProviderName = await getSetting('AI_FALLBACK_PROVIDER_NAME', 'Google Gemini');
  const fallbackApiKey = (await getSetting('GEMINI_API_KEY')) || (await getSetting('AI_FALLBACK_API_KEY'));
  const fallbackModel = (await getSetting('GEMINI_MODEL')) || (await getSetting('AI_FALLBACK_MODEL', 'gemini-2.0-flash'));

  const primaryConfigured = Boolean(apiKey && !hasPlaceholderCredential(apiKey));
  const fallbackConfigured = Boolean(fallbackApiKey && !hasPlaceholderCredential(fallbackApiKey));
  const configured = primaryConfigured || fallbackConfigured;

  return {
    providerName,
    apiKey,
    modelOverride,
    baseUrl,
    fallbackProviderName,
    fallbackApiKey,
    fallbackModel,
    configured,
  };
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
  if (/^(gpt-4o|gpt-4o-mini|gpt-4-turbo|gpt-3\.5-turbo|claude-[\w.-]+|gemini-[\w.-]+|llama[\w.-]*)/i.test(value)) return value;
  if (lower.startsWith('gpt-')) return 'gpt-4o-mini';
  return value;
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
    const objStart = raw.indexOf('{');
    const objEnd = raw.lastIndexOf('}');
    if (objStart >= 0 && objEnd > objStart) {
      try {
        return JSON.parse(raw.slice(objStart, objEnd + 1));
      } catch {}
    }
    const arrStart = raw.indexOf('[');
    const arrEnd = raw.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return JSON.parse(raw.slice(arrStart, arrEnd + 1));
      } catch {}
    }

    // Enhanced auto-repair for truncated JSON output (e.g., cut off inside a string literal)
    if (objStart >= 0) {
      let snippet = raw.slice(objStart).trim();
      const unescapedQuotes = (snippet.match(/(?<!\\)"/g) || []).length;
      if (unescapedQuotes % 2 !== 0) {
        snippet += '"'; // Close open string
      }
      snippet = snippet.replace(/,\s*$/, '');
      const openBrackets = Math.max(0, (snippet.match(/\[/g) || []).length - (snippet.match(/\]/g) || []).length);
      const openBraces = Math.max(0, (snippet.match(/\{/g) || []).length - (snippet.match(/\}/g) || []).length);
      for (let i = 0; i < openBrackets; i++) snippet += ']';
      for (let i = 0; i < openBraces; i++) snippet += '}';
      try {
        const repaired = JSON.parse(snippet);
        return repaired;
      } catch (repairErr) {
        console.warn('[AI Auto-Repair Failed]:', repairErr.message);
      }
    }

    throw new AiProviderError(`AI returned an invalid JSON response: ${trimmed.slice(0, 200)}`);
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
    max_tokens: 1500,
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
    console.error(`[OpenAI Error ${response.status}]:`, detail);
    throw new AiProviderError(`AI provider error: ${detail}`);
  }

  const resultText = data?.choices?.[0]?.message?.content || '';
  return resultText;
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
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
    console.error(`[Anthropic Error ${response.status}]:`, detail);
    throw new AiProviderError(`AI provider error: ${detail}`);
  }

  const blocks = Array.isArray(data?.content) ? data.content : [];
  const resultText = blocks.map((block) => block?.text || '').join('\n');
  return resultText;
}

async function completeGemini({ apiKey, model, prompt }) {
  const modelName = model || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${prompt}\n\nIMPORTANT: Respond strictly with valid JSON.`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
    },
  };

  let response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data = await response.json().catch(() => ({}));

  if (!response.ok && String(data?.error?.message || '').toLowerCase().includes('responsemimetype')) {
    delete payload.generationConfig.responseMimeType;
    response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    data = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.message || `HTTP ${response.status}`;
    console.error(`[Gemini Error ${response.status}]:`, detail);
    throw new AiProviderError(`Gemini error: ${detail}`);
  }

  const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return resultText;
}

async function completeChat({ settings, prompt }) {
  const hasPrimary = Boolean(settings.apiKey && !hasPlaceholderCredential(settings.apiKey));
  const hasFallback = Boolean(settings.fallbackApiKey && !hasPlaceholderCredential(settings.fallbackApiKey));

  if (!hasPrimary && hasFallback) {
    const fallbackTarget = resolveAiTarget(
      settings.fallbackProviderName || 'Google Gemini',
      settings.fallbackModel || 'gemini-2.0-flash'
    );
    return await completeGemini({
      apiKey: settings.fallbackApiKey,
      model: fallbackTarget.model,
      prompt,
    });
  }

  const primaryTarget = resolveAiTarget(settings.providerName, settings.modelOverride);

  try {
    if (primaryTarget.vendor === 'anthropic') {
      return await completeAnthropic({ apiKey: settings.apiKey, model: primaryTarget.model, prompt });
    }
    if (primaryTarget.vendor === 'gemini') {
      return await completeGemini({ apiKey: settings.apiKey, model: primaryTarget.model, prompt });
    }
    if (primaryTarget.vendor === 'groq') {
      return await completeOpenAiCompatible({
        apiKey: settings.apiKey,
        model: primaryTarget.model,
        baseUrl: settings.baseUrl || 'https://api.groq.com/openai/v1',
        prompt,
      });
    }

    return await completeOpenAiCompatible({
      apiKey: settings.apiKey,
      model: primaryTarget.model,
      baseUrl: settings.baseUrl || 'https://api.openai.com/v1',
      prompt,
    });
  } catch (primaryError) {
    if (hasFallback) {
      console.warn(
        `Primary AI provider (${primaryTarget.vendor}/${primaryTarget.model}) failed: ${primaryError.message}. Falling back to Gemini...`
      );
      const fallbackTarget = resolveAiTarget(
        settings.fallbackProviderName || 'Google Gemini',
        settings.fallbackModel || 'gemini-2.0-flash'
      );
      return await completeGemini({
        apiKey: settings.fallbackApiKey,
        model: fallbackTarget.model,
        prompt,
      });
    }
    throw primaryError;
  }
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
    'Do not include internal experience level labels like "emerging" or "established" in the text.',
    field ? `Only generate the ${fieldLabel}. Do not change the other field.` : '',
    intentInstructions[intent],
    '',
    'Context:',
    `- Name: ${clip(context.fullName, 80) || 'Expert'}`,
    `- Category: ${clip(context.category, 80) || 'Not specified'}`,
    `- Professional title: ${clip(context.professionalTitle, 80) || 'Not specified'}`,
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
  const role = (title || (category ? `${category} expert` : 'consultant')).replace(/\.+$/, '');
  const roleLower = role.toLowerCase();
  const skillPhrase = skills.length > 0 ? skills.slice(0, 3).join(', ') : category || 'practical, clear advice';
  const who = name || 'I';
  const introName = who === 'I' ? "I'm" : `I'm ${who},`;

  return [
    {
      tagLine: `I help people with ${skillPhrase} — practical ${roleLower} guidance that moves work forward.`,
      bio: `${introName} a ${role}. I focus on ${skillPhrase} and help clients make confident decisions.`,
    },
    {
      tagLine: `${role} focused on ${skillPhrase}. Clear next steps, not generic advice.`,
      bio: `I work as a ${role}, with a focus on ${skillPhrase}. I keep recommendations concrete so you can act quickly.`,
    },
    {
      tagLine: `Hands-on ${roleLower} support for ${skillPhrase}.`,
      bio: `${who === 'I' ? 'I help' : `${who} helps`} clients with ${skillPhrase}. Expect practical ${roleLower} guidance you can use right away.`,
    },
    {
      tagLine: `I bring clarity to ${skillPhrase} so you can decide and ship with confidence.`,
      bio: `As a ${role}, I turn ${skillPhrase} into a simple plan you can follow this week.`,
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

function buildMultiTonePrompt(context) {
  const skills = asStringList(context.skills);
  const languages = asStringList(context.languages);
  const employment = formatEmployment(context.employment);
  const education = formatEducation(context.education);

  return [
    'Write expert profile tagline and brief introduction suggestions for a consultation marketplace in 3 distinct tones: "professional", "casual", and "concise".',
    'Return JSON strictly in this structure: {"professional": {"tagLine": "...", "bio": "..."}, "casual": {"tagLine": "...", "bio": "..."}, "concise": {"tagLine": "...", "bio": "..."}}',
    'Each tone object MUST contain "tagLine" (one line, max 160 characters, no quotes) and "bio" (one short paragraph, max 160 characters, first person, concrete, no hype).',
    'Tones guidelines:',
    '- professional: polished, authoritative, corporate tone.',
    '- casual: warm, friendly, approachable tone.',
    '- concise: short, punchy, direct tone.',
    'Do not invent employers, degrees, or skills not in the context.',
    'DO NOT include internal experience level labels like "emerging" or "established" in the tagline or bio text.',
    '',
    'Context:',
    `- Name: ${clip(context.fullName, 80) || 'Expert'}`,
    `- Category: ${clip(context.category, 80) || 'Not specified'}`,
    `- Professional title: ${clip(context.professionalTitle, 80) || 'Not specified'}`,
    `- Skills: ${skills.join(', ') || 'Not specified'}`,
    `- Languages: ${languages.join(', ') || 'Not specified'}`,
    `- Experience: ${employment.join('; ') || 'Not specified'}`,
    `- Education: ${education.join('; ') || 'Not specified'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function suggestExpertIdentityCopy(context = {}) {
  const localProf = buildLocalIdentityCopy({ ...context, variantIndex: 0 });
  const localCasual = buildLocalIdentityCopy({ ...context, variantIndex: 2 });
  const localConcise = buildLocalIdentityCopy({ ...context, variantIndex: 4 });

  const fallbackAll = {
    professional: { tagLine: localProf.tagLine, bio: localProf.bio },
    casual: { tagLine: localCasual.tagLine, bio: localCasual.bio },
    concise: { tagLine: localConcise.tagLine, bio: localConcise.bio },
  };

  const requestedTone = String(context.tone || '').toLowerCase();
  const selectedFallback = fallbackAll[requestedTone] || fallbackAll.professional;

  const settings = await readAiSettings();

  if (!settings.configured) {
    return {
      tagLine: selectedFallback.tagLine,
      bio: selectedFallback.bio,
      options: fallbackAll,
      suggestions: fallbackAll,
      source: 'fallback',
      notice: AI_FALLBACK_NOTICE,
    };
  }

  try {
    const raw = await completeChat({
      settings,
      prompt: buildMultiTonePrompt(context),
    });
    const parsed = parseJsonObject(raw);

    const profTag = clip(parsed.professional?.tagLine || parsed.professional?.tagline || localProf.tagLine, TAGLINE_MAX);
    const profBio = clip(parsed.professional?.bio || parsed.professional?.briefIntroduction || localProf.bio, BIO_MAX);

    const casTag = clip(parsed.casual?.tagLine || parsed.casual?.tagline || localCasual.tagLine, TAGLINE_MAX);
    const casBio = clip(parsed.casual?.bio || parsed.casual?.briefIntroduction || localCasual.bio, BIO_MAX);

    const conTag = clip(parsed.concise?.tagLine || parsed.concise?.tagline || localConcise.tagLine, TAGLINE_MAX);
    const conBio = clip(parsed.concise?.bio || parsed.concise?.briefIntroduction || localConcise.bio, BIO_MAX);

    const options = {
      professional: { tagLine: profTag, bio: profBio },
      casual: { tagLine: casTag, bio: casBio },
      concise: { tagLine: conTag, bio: conBio },
    };

    const selected = options[requestedTone] || options.professional;

    return {
      tagLine: selected.tagLine,
      bio: selected.bio,
      options,
      suggestions: options,
      source: 'ai',
    };
  } catch (error) {
    return {
      tagLine: selectedFallback.tagLine,
      bio: selectedFallback.bio,
      options: fallbackAll,
      suggestions: fallbackAll,
      source: 'fallback',
      notice: AI_FALLBACK_NOTICE,
    };
  }
}

export async function recommendExpertSkills(context = {}) {
  const settings = await readAiSettings();

  if (!settings.configured) {
    return { skills: [], source: 'ai' };
  }

  try {
    const prompt = `Suggest EXACTLY 10 highly relevant, real-world professional skills directly for an expert with the following profile:
Category: ${context.category || 'Professional Services'}
Title: ${context.professionalTitle || 'Expert'}
Experience Level: ${context.experienceLevel || 'Senior'}
Existing Skills: ${(context.skills || context.existingSkills || []).join(', ') || 'None'}

Return a JSON object strictly in this format:
{
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8", "Skill 9", "Skill 10"]
}`;

    const raw = await completeChat({ settings, prompt });
    const parsed = parseJsonObject(raw);
    const skillsList = Array.isArray(parsed.skills) ? parsed.skills : Array.isArray(parsed) ? parsed : [];

    const cleanedSkills = skillsList
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 10);

    return { skills: cleanedSkills, source: 'ai' };
  } catch (error) {
    return { skills: [], source: 'ai' };
  }
}

export const SEEKER_GOAL_OPTIONS = [
  'Clarity & Direction',
  'Actionable Plan',
  'Deep Knowledge',
  'Help & Support',
  'Specific Solution',
];

function autoSelectSeekerGoals(text = '', subject = '') {
  const combined = `${subject} ${text}`.toLowerCase();
  const selected = new Set();

  if (/\b(plan|action|step|roadmap|strategy|how to|milestone)\b/i.test(combined)) {
    selected.add('Actionable Plan');
  }
  if (/\b(fix|bug|issue|solution|solve|code|error|debug|implement)\b/i.test(combined)) {
    selected.add('Specific Solution');
  }
  if (/\b(learn|understand|deep|knowledge|concept|architecture|explain|insight)\b/i.test(combined)) {
    selected.add('Deep Knowledge');
  }
  if (/\b(help|support|assist|guidance|mentor|review|advice)\b/i.test(combined)) {
    selected.add('Help & Support');
  }
  if (/\b(clarity|direction|choose|decision|path|where to|career|confused)\b/i.test(combined)) {
    selected.add('Clarity & Direction');
  }

  if (selected.size === 0) {
    selected.add('Clarity & Direction');
    selected.add('Actionable Plan');
  }

  return Array.from(selected);
}

function normalizeSeekerGoals(inputGoals, userText, subject) {
  const rawList = Array.isArray(inputGoals) ? inputGoals : typeof inputGoals === 'string' ? [inputGoals] : [];
  const validMap = new Map(SEEKER_GOAL_OPTIONS.map((g) => [g.toLowerCase(), g]));
  
  const matched = rawList
    .map((item) => validMap.get(String(item || '').trim().toLowerCase()))
    .filter(Boolean);

  const unique = [...new Set(matched)];
  if (unique.length > 0) {
    return { goals: unique, autoSelected: false };
  }

  return {
    goals: autoSelectSeekerGoals(userText, subject),
    autoSelected: true,
  };
}

export function buildLocalSeekerNeedsCopy(context = {}) {
  const subject = clip(context.subject, 100);
  const text = clip(context.userText || context.needsText || context.text, 500);
  const goalsInfo = normalizeSeekerGoals(context.selectedGoals || context.selectedNeedChips || context.goals, text, subject);
  const goalsStr = goalsInfo.goals.join(' & ');

  let rawDetail = String(text || '').trim();
  let detail = rawDetail;

  if (!detail) {
    detail = subject ? `I need guidance regarding ${subject}.` : 'I need assistance from an expert.';
  } else {
    // Trim trailing prepositions or conjunctions if user input is incomplete (e.g. "I want clarity on")
    detail = detail.replace(/\s+(on|about|for|with|to|in|of|regarding|at|from|and|or)\s*$/i, '');
    
    // Check if the fragment ends after removing preposition
    if (/^(i want|i need|help with|seeking)\s*$/i.test(detail)) {
      detail = subject ? `I need guidance on ${subject}` : 'I need expert assistance';
    } else if (/\b(clarity|guidance|advice|direction|help|support|plan|solution)$/i.test(detail)) {
      detail = `${detail} on my current goals and next steps`;
    }

    if (!/[.!?]$/.test(detail)) {
      detail = `${detail}.`;
    }
  }

  const goalPhrase = goalsStr ? `Looking for ${goalsStr.toLowerCase()}` : 'Looking for expert guidance';

  // Professional tone: Formal, natural spoken/written request without labels like "Subject:"
  const profDetail = detail.replace(/^(i need|i want|help with)\s+/i, 'I am seeking expertise for ');
  const professional = clip(
    subject
      ? `I am seeking professional guidance in ${subject}. ${goalPhrase}. ${profDetail}`
      : `I am seeking expert consultation. ${goalPhrase}. ${profDetail}`,
    600,
  );

  // Casual tone: Warm, friendly spoken language
  const casual = clip(
    `${subject ? `Hey! I need help with ${subject}` : 'Hey! I need some expert help'}. ${goalPhrase}. ${detail}`,
    600,
  );

  // Concise tone: Direct statement without metadata labels
  const concise = clip(
    `${subject ? `In ${subject}: ` : ''}${goalsStr}. ${detail}`,
    600,
  );

  const options = { professional, casual, concise };
  return {
    subject,
    selectedGoals: goalsInfo.goals,
    autoSelected: goalsInfo.autoSelected,
    options,
    suggestions: options,
  };
}

function buildSeekerNeedsPrompt(context = {}, goalsInfo = {}) {
  const subject = clip(context.subject, 120);
  const text = clip(context.userText || context.needsText || context.text, 800);
  const goals = goalsInfo.goals;

  return [
    'You are an expert consultation request copywriter for a consultation marketplace.',
    'A client (seeker) wants expert guidance. Rewrite and improve their request based on the subject and selected goal(s).',
    '',
    `Selected Goal(s): ${goals.join(', ')} (${goalsInfo.autoSelected ? 'auto-selected' : 'chosen by user'})`,
    subject ? `Subject/Topic: ${subject}` : 'Subject/Topic: Not specified',
    text ? `User Original Input: "${text}"` : 'User Original Input: Not specified',
    '',
    'Task:',
    'Write improved versions of the consultation request in 3 distinct tones: "professional", "casual", and "concise".',
    'Rules:',
    '- Keep each tone description focused, natural, and concise (under 250 characters per tone).',
    '- Incorporate the subject and selected goals naturally into human spoken/written text.',
    '- DO NOT include metadata labels like "Subject:", "Topic:", "Goal:", or bracketed tags. Write natural sentences as a real person would say or write them when requesting a consultation.',
    '- IMPORTANT: If the user input is partial, incomplete, or ends with a trailing phrase/preposition (e.g. "I want clarity on"), complete and expand it into full, natural, grammatically correct sentences for each tone.',
    '',
    'Return JSON strictly in this structure:',
    `{"selectedGoals": ${JSON.stringify(goals)}, "professional": "...", "casual": "...", "concise": "..."}`,
  ].join('\n');
}


export async function improveSeekerNeedsCopy(context = {}) {
  const subject = clip(context.subject, 120);
  const userText = clip(context.userText || context.needsText || context.text, 800);
  const goalsInfo = normalizeSeekerGoals(
    context.selectedGoals || context.selectedNeedChips || context.goals,
    userText,
    subject,
  );

  const fallback = buildLocalSeekerNeedsCopy({
    subject,
    userText,
    selectedGoals: goalsInfo.goals,
  });

  const settings = await readAiSettings();

  if (!settings.configured) {
    return {
      subject,
      selectedGoals: goalsInfo.goals,
      autoSelected: goalsInfo.autoSelected,
      options: fallback.options,
      suggestions: fallback.suggestions,
      source: 'fallback',
      notice: AI_FALLBACK_NOTICE,
    };
  }

  try {
    const prompt = buildSeekerNeedsPrompt(
      { subject, userText },
      goalsInfo,
    );

    const raw = await completeChat({ settings, prompt });
    const parsed = parseJsonObject(raw);

    const prof = clip(parsed.professional || parsed.prof || fallback.options.professional, 700);
    const cas = clip(parsed.casual || parsed.cas || fallback.options.casual, 700);
    const con = clip(parsed.concise || parsed.con || fallback.options.concise, 700);

    const activeGoals = Array.isArray(parsed.selectedGoals) && parsed.selectedGoals.length > 0
      ? parsed.selectedGoals
      : goalsInfo.goals;

    const options = {
      professional: prof,
      casual: cas,
      concise: con,
    };

    return {
      subject,
      selectedGoals: activeGoals,
      autoSelected: goalsInfo.autoSelected,
      options,
      suggestions: options,
      source: 'ai',
    };
  } catch (error) {
    return {
      subject,
      selectedGoals: goalsInfo.goals,
      autoSelected: goalsInfo.autoSelected,
      options: fallback.options,
      suggestions: fallback.suggestions,
      source: 'fallback',
      notice: AI_FALLBACK_NOTICE,
    };
  }
}


