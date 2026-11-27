// Must match the backend 30-second OTP resend cooldown (OTP_RESEND_COOLDOWN_MS = 30_000).
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;
export const OTP_RESEND_MAX_ATTEMPTS = 3;

export const OTP_RESEND_BLOCK_MESSAGES = [
  "Check inbox/spam of your registered email and phone number.",
  "Make sure the email and phone number you entered are correct.",
  "Or try again in 30 mins.",
] as const;

export interface OtpResendState {
  resendAttempts: number;
  maxResendAttempts: number;
  blockedUntil: string | null;
  cooldownEndsAt: number | null;
}

export interface OtpResendResponseShape {
  resendAttempts?: number;
  maxResendAttempts?: number;
  blockedUntil?: string | null;
}

export interface OtpResendErrorLike {
  message?: string;
  code?: string;
  data?: {
    code?: string;
    retryAfterSeconds?: number;
    resendAttempts?: number;
    maxResendAttempts?: number;
    blockedUntil?: string | null;
  };
}

export function createInitialOtpResendState(
  initialCooldownSeconds = OTP_RESEND_COOLDOWN_SECONDS,
  now = Date.now(),
): OtpResendState {
  return {
    resendAttempts: 0,
    maxResendAttempts: OTP_RESEND_MAX_ATTEMPTS,
    blockedUntil: null,
    cooldownEndsAt: initialCooldownSeconds > 0 ? computeCooldownEndsAt(initialCooldownSeconds, now) : null,
  };
}

export function formatResendCounter(
  resendAttempts: number,
  maxResendAttempts = OTP_RESEND_MAX_ATTEMPTS,
): string {
  const max = Math.max(1, Number(maxResendAttempts) || OTP_RESEND_MAX_ATTEMPTS);
  const clamped = Math.max(0, Math.min(max, Number(resendAttempts) || 0));
  return `(${clamped}/${max})`;
}

export function isResendBlocked(
  state: Pick<OtpResendState, "resendAttempts" | "maxResendAttempts" | "blockedUntil">,
  now = Date.now(),
): boolean {
  const max = Math.max(1, Number(state.maxResendAttempts) || OTP_RESEND_MAX_ATTEMPTS);
  if (state.blockedUntil) {
    const blockedMs = Date.parse(state.blockedUntil);
    if (Number.isFinite(blockedMs)) {
      return blockedMs > now;
    }
  }
  return (Number(state.resendAttempts) || 0) >= max;
}

export function computeCooldownEndsAt(
  seconds = OTP_RESEND_COOLDOWN_SECONDS,
  now = Date.now(),
): number {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return now + safeSeconds * 1000;
}

export function cooldownRemainingSeconds(
  cooldownEndsAt: number | null,
  now = Date.now(),
): number {
  if (!cooldownEndsAt || !Number.isFinite(cooldownEndsAt)) return 0;
  const remainingMs = cooldownEndsAt - now;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function applyResendStatus(
  prev: OtpResendState,
  status: OtpResendResponseShape,
  now = Date.now(),
): OtpResendState {
  const max = Math.max(1, Number(status.maxResendAttempts) || prev.maxResendAttempts || OTP_RESEND_MAX_ATTEMPTS);
  const blockedUntil = status.blockedUntil ?? null;
  const blockedMs = blockedUntil ? Date.parse(blockedUntil) : NaN;
  const isActiveBlock = Number.isFinite(blockedMs) && blockedMs > now;

  const attempts = isActiveBlock
    ? max
    : Math.max(0, Math.min(max, Number(status.resendAttempts ?? prev.resendAttempts) || 0));

  return {
    resendAttempts: attempts,
    maxResendAttempts: max,
    blockedUntil: isActiveBlock ? blockedUntil : null,
    cooldownEndsAt: isActiveBlock ? null : prev.cooldownEndsAt,
  };
}

export function applyResendResponse(
  prev: OtpResendState,
  response: OtpResendResponseShape,
  now = Date.now(),
): OtpResendState {
  const max = Math.max(1, Number(response.maxResendAttempts) || prev.maxResendAttempts || OTP_RESEND_MAX_ATTEMPTS);
  const attempts = Math.max(
    0,
    Math.min(max, Number(response.resendAttempts ?? prev.resendAttempts + 1) || 0),
  );
  const blockedUntil = response.blockedUntil ?? null;
  const blocked = isResendBlocked({ resendAttempts: attempts, maxResendAttempts: max, blockedUntil }, now);

  return {
    resendAttempts: blocked ? max : attempts,
    maxResendAttempts: max,
    blockedUntil,
    cooldownEndsAt: blocked ? null : computeCooldownEndsAt(OTP_RESEND_COOLDOWN_SECONDS, now),
  };
}

export function applyResendError(
  prev: OtpResendState,
  error: unknown,
  now = Date.now(),
): { state: OtpResendState; errorMessage: string | null } {
  const err = (error ?? {}) as OtpResendErrorLike;
  const code = err.code || err.data?.code;
  const data = err.data;

  if (code === "OTP_RESEND_LIMIT_REACHED") {
    const max = Math.max(1, Number(data?.maxResendAttempts) || prev.maxResendAttempts || OTP_RESEND_MAX_ATTEMPTS);
    return {
      state: {
        resendAttempts: max,
        maxResendAttempts: max,
        blockedUntil: data?.blockedUntil ?? prev.blockedUntil ?? new Date(now + 30 * 60 * 1000).toISOString(),
        cooldownEndsAt: null,
      },
      errorMessage: null,
    };
  }

  if (code === "OTP_RESEND_COOLDOWN") {
    const retrySeconds = Math.max(
      1,
      Number(data?.retryAfterSeconds) || OTP_RESEND_COOLDOWN_SECONDS,
    );
    return {
      state: {
        ...prev,
        cooldownEndsAt: computeCooldownEndsAt(retrySeconds, now),
      },
      errorMessage: null,
    };
  }

  return {
    state: prev,
    errorMessage: error instanceof Error && error.message
      ? error.message
      : "Could not resend verification code.",
  };
}

export const OTP_RESEND_LIMIT_REACHED_CODE = "OTP_RESEND_LIMIT_REACHED";

export function extractOtpBlockDeadline(error: unknown, now = Date.now()): number | null {
  if (!error || typeof error !== "object") return null;
  const err = error as { status?: number; code?: string; data?: OtpResendErrorLike["data"] };
  const code = err.data?.code || err.code;
  if (err.status !== 429 || code !== OTP_RESEND_LIMIT_REACHED_CODE) {
    return null;
  }

  const blockedUntil = err.data?.blockedUntil;
  if (typeof blockedUntil === "string" && blockedUntil) {
    const parsed = Date.parse(blockedUntil);
    if (Number.isFinite(parsed) && parsed > now) {
      return parsed;
    }
  }

  const retrySeconds = Number(err.data?.retryAfterSeconds);
  if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
    return computeCooldownEndsAt(retrySeconds, now);
  }

  return null;
}

export function formatBlockRemaining(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  if (safe >= 60) {
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins} min ${secs} s`;
  }
  return `${safe} s`;
}

export function formatOtpLoginBlockParts(remainingSeconds: number): {
  prefix: string;
  countdown: string;
  suffix: string;
} {
  return {
    prefix: "OTP limit reached. Please try again in ",
    countdown: formatBlockRemaining(remainingSeconds),
    suffix: ".",
  };
}

export function formatOtpLoginBlockMessage(remainingSeconds: number): string {
  const { prefix, countdown, suffix } = formatOtpLoginBlockParts(remainingSeconds);
  return `${prefix}${countdown}${suffix}`;
}
