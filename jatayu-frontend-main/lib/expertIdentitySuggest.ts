export type IdentitySuggestIntent = "suggest" | "regenerate" | "improve";

export type IdentitySuggestContext = {
  fullName?: string;
  category?: string;
  skills?: string[];
  experienceLevel?: string;
  professionalTitle?: string;
  currentTagLine?: string;
  currentBio?: string;
  intent?: IdentitySuggestIntent;
  variantIndex?: number;
  field?: "tagLine" | "bio";
};

export const AI_FALLBACK_NOTICE =
  "Suggested from your profile details. Live AI is temporarily unavailable.";

const TAGLINE_MAX = 160;
const BIO_MAX = 160;

function clip(value: unknown, max: number): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function asSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clip(item, 80)).filter(Boolean).slice(0, 4);
}

function normalize(value: unknown): string {
  return clip(value, 400).toLowerCase();
}

type IdentityPair = { tagLine: string; bio: string };

function buildTemplates(context: IdentitySuggestContext): IdentityPair[] {
  const name = clip(context.fullName, 40);
  const category = clip(context.category, 40);
  const title = clip(context.professionalTitle, 70);
  const skills = asSkills(context.skills);
  const level = clip(context.experienceLevel, 40);
  const role = title || (category ? `${category} expert` : "consultant");
  const roleLower = role.toLowerCase();
  const skillPhrase =
    skills.length > 0 ? skills.slice(0, 3).join(", ") : category || "practical, clear advice";
  const who = name || "I";
  const introName = who === "I" ? "I'm" : `I'm ${who},`;
  const levelPrefix = level ? `${level} ` : "";

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
      bio: `${who === "I" ? "I help" : `${who} helps`} clients with ${skillPhrase}. Expect practical ${roleLower} guidance you can use right away.`,
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

function isSameCopy(candidate: IdentityPair, avoidTag: string, avoidBio: string): boolean {
  return (
    (avoidTag.length > 0 && normalize(candidate.tagLine) === normalize(avoidTag)) ||
    (avoidBio.length > 0 && normalize(candidate.bio) === normalize(avoidBio))
  );
}

function withFieldLock(pair: IdentityPair, field: IdentitySuggestContext["field"], avoidTag: string, avoidBio: string): IdentityPair {
  if (field === "tagLine") return { tagLine: pair.tagLine, bio: avoidBio || pair.bio };
  if (field === "bio") return { tagLine: avoidTag || pair.tagLine, bio: pair.bio };
  return pair;
}

function forceRevise(pair: IdentityPair, avoidTag: string, avoidBio: string): IdentityPair {
  let tagLine = pair.tagLine;
  let bio = pair.bio;
  if (avoidTag && normalize(tagLine) === normalize(avoidTag)) {
    tagLine = clip(`Revised: ${tagLine.replace(/^Revised:\s*/i, "")}`, TAGLINE_MAX);
    if (normalize(tagLine) === normalize(avoidTag)) {
      tagLine = clip(`${tagLine} Different angle, same expertise.`, TAGLINE_MAX);
    }
  }
  if (avoidBio && normalize(bio) === normalize(avoidBio)) {
    bio = clip(`In short: ${bio.replace(/^In short:\s*/i, "")}`, BIO_MAX);
    if (normalize(bio) === normalize(avoidBio)) {
      bio = clip(`${bio} Sharper, more specific, and ready to use.`, BIO_MAX);
    }
  }
  return { tagLine, bio };
}

function polishLine(text: string, max: number): string {
  const original = clip(text, max);
  if (!original) return "";

  const replacements: Array<[RegExp, string]> = [
    [/I help people with /i, "I work with clients on "],
    [/I help clients with /i, "I partner with people on "],
    [/^Hands-on /i, "Practical "],
    [/ focused on /i, " specialising in "],
    [/ that moves work forward\.?$/i, "."],
    [/, not generic advice\.?$/i, ", grounded in real delivery."],
    [/confident decisions\.?$/i, "clear, timely decisions."],
    [/you can use right away\.?$/i, "you can apply in the next conversation."],
    [/^Expect practical /i, "You’ll get practical "],
    [/^I'm a /i, "As a "],
    [/^I work as a /i, "I'm a "],
    [/^As a /i, "I work as a "],
    [/no fluff\.?$/i, "straight to the point."],
    [/immediately\.?$/i, "in the same session."],
  ];

  for (const [from, to] of replacements) {
    if (from.test(original)) {
      const next = clip(original.replace(from, to), max);
      if (normalize(next) !== normalize(original)) return next;
    }
  }

  if (original.endsWith(".")) {
    return clip(`${original.slice(0, -1)} — clearer, more specific, and easier to act on.`, max);
  }
  return clip(`${original}. Sharper wording, same expertise.`, max);
}

function pickUnusedTemplate(
  templates: IdentityPair[],
  avoidTag: string,
  avoidBio: string,
  startIndex: number,
): IdentityPair {
  const start = ((startIndex % templates.length) + templates.length) % templates.length;
  for (let i = 0; i < templates.length; i += 1) {
    const candidate = templates[(start + i) % templates.length];
    if (!isSameCopy(candidate, avoidTag, avoidBio)) return candidate;
  }
  return forceRevise(templates[start], avoidTag, avoidBio);
}

/** Local copy used when the paid AI provider is down, unconfigured, or returns an error. */
export function buildLocalIdentityCopy(context: IdentitySuggestContext = {}): IdentityPair {
  const templates = buildTemplates(context);
  const avoidTag = clip(context.currentTagLine, TAGLINE_MAX);
  const avoidBio = clip(context.currentBio, BIO_MAX);
  const field = context.field;
  const intent: IdentitySuggestIntent =
    context.intent || (avoidTag || avoidBio ? "regenerate" : "suggest");

  if (intent === "improve" && (avoidTag || avoidBio)) {
    const polished = {
      tagLine: field === "bio" ? avoidTag : avoidTag ? polishLine(avoidTag, TAGLINE_MAX) : templates[0].tagLine,
      bio: field === "tagLine" ? avoidBio : avoidBio ? polishLine(avoidBio, BIO_MAX) : templates[0].bio,
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
  const requested =
    typeof context.variantIndex === "number" && Number.isFinite(context.variantIndex)
      ? context.variantIndex
      : null;

  let startIndex = 0;
  if (intent === "suggest" && !avoidTag && !avoidBio) {
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
