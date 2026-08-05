export type PasswordValidationContext = {
  email?: string;
  username?: string;
  names?: string[];
};

export type PasswordScoreRule = {
  id: string;
  label: string;
  points: 1;
  test: (password: string, context?: PasswordValidationContext) => boolean;
};

export const PASSWORD_SCORE_RULES: PasswordScoreRule[] = [
  {
    id: "length8",
    label: "At least 8 characters",
    points: 1,
    test: (password) => password.length >= 8,
  },
  {
    id: "length12",
    label: "At least 12 characters",
    points: 1,
    test: (password) => password.length >= 12,
  },
  {
    id: "lowercase",
    label: "Contains lowercase letter",
    points: 1,
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "Contains uppercase letter",
    points: 1,
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Contains a number",
    points: 1,
    test: (password) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "Contains a symbol",
    points: 1,
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
  {
    id: "noRepeats",
    label: "No repeated characters (e.g. aaaa)",
    points: 1,
    test: (password) =>
      password.length >= 4 && !/(.)\1{3,}/.test(password),
  },
  {
    id: "noPersonalInfo",
    label: "Doesn't contain username/email",
    points: 1,
    test: (password, context) => passwordPassesNoPersonalInfo(password, context),
  },
];

/** Minimum score (out of 8) required to accept a password on registration. */
export const PASSWORD_MIN_SCORE = 5;

export const PASSWORD_STRENGTH_COLORS = [
  "var(--pomegranate)",
  "var(--tango)",
  "var(--tango)",
  "var(--green)",
];

export const PASSWORD_STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];

/** Maps an 8-point score to the 1–4 visual strength level. */
export const PASSWORD_STRENGTH_THRESHOLDS = [
  { minScore: 1, maxScore: 2, level: 1 },
  { minScore: 3, maxScore: 4, level: 2 },
  { minScore: 5, maxScore: 6, level: 3 },
  { minScore: 7, maxScore: 8, level: 4 },
] as const;

export const PASSWORD_MAX_SCORE = PASSWORD_SCORE_RULES.length;

/** Required before the meter can rise above Weak. */
const PASSWORD_CHARACTER_CLASS_RULES = [
  "lowercase",
  "uppercase",
  "number",
  "symbol",
] as const;

/** Required before the meter can show Strong. */
const PASSWORD_STRONG_RULES = ["length12", "noRepeats"] as const;

function passwordContainsPersonalInfo(
  password: string,
  context?: PasswordValidationContext,
): boolean {
  const normalized = password.toLowerCase();
  const terms = getPersonalInfoTerms(context);
  if (terms.length === 0) return false;
  return terms.some((term) => normalized.includes(term));
}

function passwordPassesNoPersonalInfo(
  password: string,
  context?: PasswordValidationContext,
): boolean {
  if (password.length < 8) return false;
  const terms = getPersonalInfoTerms(context);
  if (terms.length === 0) return false;
  return !passwordContainsPersonalInfo(password, context);
}

function getPersonalInfoTerms(context?: PasswordValidationContext): string[] {
  const terms = new Set<string>();

  if (context?.email) {
    const email = context.email.trim().toLowerCase();
    if (email.length >= 3) terms.add(email);
    const localPart = email.split("@")[0];
    if (localPart && localPart.length >= 3) terms.add(localPart);
  }

  if (context?.username) {
    const username = context.username.trim().toLowerCase();
    if (username.length >= 3) terms.add(username);
    username.split(/\s+/).forEach((part) => {
      if (part.length >= 3) terms.add(part);
    });
  }

  for (const name of context?.names ?? []) {
    const normalized = name.trim().toLowerCase();
    if (normalized.length >= 3) terms.add(normalized);
  }

  return [...terms];
}

function isRuleMet(
  rules: ReturnType<typeof getPasswordScoreRules>,
  id: string,
): boolean {
  return rules.find((rule) => rule.id === id)?.met ?? false;
}

/** Detects predictable patterns like Mememan@ or Password!. */
function hasWeakPasswordPattern(password: string): boolean {
  if (password.length < 8) return false;

  // Letters-only word with a single symbol tacked on the end.
  if (/^[A-Za-z]{5,}[^A-Za-z0-9]$/.test(password)) return true;

  // Short password that is mostly letters with little complexity.
  if (password.length < 12 && /^[A-Za-z]+[^A-Za-z0-9]?$/.test(password)) {
    return true;
  }

  return false;
}

function getPasswordStrengthCeiling(
  password: string,
  context?: PasswordValidationContext,
): number {
  const rules = getPasswordScoreRules(password, context);

  if (!isRuleMet(rules, "length8")) return 1;

  const hasAllCharacterClasses = PASSWORD_CHARACTER_CLASS_RULES.every((id) =>
    isRuleMet(rules, id),
  );
  if (!hasAllCharacterClasses) return 1;

  const readyForStrong = PASSWORD_STRONG_RULES.every((id) => isRuleMet(rules, id));
  if (!readyForStrong || hasWeakPasswordPattern(password)) return 3;

  return 4;
}

export function buildPasswordContext(options: {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}): PasswordValidationContext {
  const names = [options.firstName, options.lastName]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);

  return {
    email: options.email?.trim(),
    username: options.username?.trim() || names.join(" "),
    names,
  };
}

export function getPasswordScoreRules(
  password: string,
  context?: PasswordValidationContext,
) {
  return PASSWORD_SCORE_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password, context),
  }));
}

export function getPasswordScore(
  password: string,
  context?: PasswordValidationContext,
): number {
  if (!password) return 0;
  return getPasswordScoreRules(password, context).filter((rule) => rule.met).length;
}

/** Maps the 8-rule score to 0–4 bars for the strength meter UI. */
export function getPasswordStrength(
  password: string,
  context?: PasswordValidationContext,
): number {
  const score = getPasswordScore(password, context);
  if (!password || score === 0) return 0;

  if (password.length < 8) return 1;

  const threshold = PASSWORD_STRENGTH_THRESHOLDS.find(
    ({ minScore, maxScore }) => score >= minScore && score <= maxScore,
  );
  const levelFromScore = threshold?.level ?? 4;
  const ceiling = getPasswordStrengthCeiling(password, context);

  return Math.min(levelFromScore, ceiling);
}

export function getPasswordStrengthLabel(
  password: string,
  context?: PasswordValidationContext,
): string {
  if (password.length < 8 || !isPasswordValid(password, context)) return "";
  const level = getPasswordStrength(password, context);
  if (level === 0) return "";
  return PASSWORD_STRENGTH_LABELS[level - 1];
}

export function getPasswordStrengthColor(
  password: string,
  context?: PasswordValidationContext,
): string {
  const level = getPasswordStrength(password, context);
  if (level === 0) return "rgba(255, 255, 255, 0.08)";
  return PASSWORD_STRENGTH_COLORS[level - 1];
}

export function isPasswordValid(
  password: string,
  context?: PasswordValidationContext,
): boolean {
  if (!password || password.length < 8) return false;

  const rules = getPasswordScoreRules(password, context);
  const hasRequiredCharacterClasses = PASSWORD_CHARACTER_CLASS_RULES.every((id) =>
    isRuleMet(rules, id),
  );
  if (!hasRequiredCharacterClasses || hasWeakPasswordPattern(password)) return false;

  return getPasswordScore(password, context) >= PASSWORD_MIN_SCORE;
}

export function getPasswordHint(
  password: string,
  context?: PasswordValidationContext,
): string {
  if (!password) return "At least 8 characters";
  if (isPasswordValid(password, context)) return "";

  if (password.length < 8) return "At least 8 characters";

  const rules = getPasswordScoreRules(password, context);
  const priority = [
    "length8",
    ...PASSWORD_CHARACTER_CLASS_RULES,
    "length12",
    "noRepeats",
    "noPersonalInfo",
  ];

  const unmet = priority
    .map((id) => rules.find((rule) => rule.id === id))
    .find((rule) => rule && !rule.met);

  if (unmet) return unmet.label;
  if (hasWeakPasswordPattern(password)) return "Use a less predictable password";

  return "Password is too weak";
}

export function getPasswordValidationError(
  password: string,
  context?: PasswordValidationContext,
): string | null {
  if (!password) return "At least 8 characters";
  if (!isPasswordValid(password, context)) {
    return getPasswordHint(password, context) || "Password is too weak";
  }
  return null;
}

/** @deprecated Use getPasswordScoreRules */
export const PASSWORD_RULES = PASSWORD_SCORE_RULES;

/** @deprecated Use getPasswordScoreRules */
export function getPasswordChecks(
  password: string,
  context?: PasswordValidationContext,
) {
  return getPasswordScoreRules(password, context);
}
