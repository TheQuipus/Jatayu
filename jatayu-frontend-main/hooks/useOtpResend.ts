"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  applyResendError,
  applyResendResponse,
  applyResendStatus,
  cooldownRemainingSeconds,
  createInitialOtpResendState,
  isResendBlocked,
  type OtpResendResponseShape,
  type OtpResendState,
} from "@/lib/otpResend";

export interface UseOtpResendOptions {
  active?: boolean;
  initialCooldownSeconds?: number;
  fetchStatus?: () => Promise<OtpResendResponseShape>;
  onResendRequest: () => Promise<OtpResendResponseShape>;
  onSuccess?: () => void;
  onError?: (message: string | null) => void;
}

export function useOtpResend({
  active = true,
  initialCooldownSeconds = OTP_RESEND_COOLDOWN_SECONDS,
  fetchStatus,
  onResendRequest,
  onSuccess,
  onError,
}: UseOtpResendOptions) {
  const [state, setState] = useState<OtpResendState>(() =>
    createInitialOtpResendState(active ? initialCooldownSeconds : 0),
  );
  const [resendSeconds, setResendSeconds] = useState<number>(() =>
    active ? Math.max(0, initialCooldownSeconds) : 0,
  );
  const [isResending, setIsResending] = useState(false);

  const stateRef = useRef(state);
  const fetchStatusRef = useRef(fetchStatus);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  // Hydrate resend counter and block status on mount / when flow becomes active
  useEffect(() => {
    if (!active || !fetchStatusRef.current) return;
    let cancelled = false;

    void fetchStatusRef.current()
      .then((status) => {
        if (cancelled) return;
        setState((prev) => applyResendStatus(prev, status, Date.now()));
      })
      .catch(() => {
        // Keep current/initial (0/3) silently; backend still enforces the limit.
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Deadline-based 30s cooldown ticker (immune to background-tab setInterval throttling)
  useEffect(() => {
    if (!active || !state.cooldownEndsAt) {
      return;
    }

    const syncRemaining = () => {
      const remaining = cooldownRemainingSeconds(state.cooldownEndsAt, Date.now());
      setResendSeconds(remaining);
      if (remaining <= 0) {
        setState((prev) => (prev.cooldownEndsAt ? { ...prev, cooldownEndsAt: null } : prev));
      }
    };

    const timer = setInterval(syncRemaining, 250);
    return () => clearInterval(timer);
  }, [active, state.cooldownEndsAt]);

  // Re-check status when blockedUntil passes (with 10s retry if clock skew keeps it blocked)
  useEffect(() => {
    if (!active || !state.blockedUntil) return;
    const blockedMs = Date.parse(state.blockedUntil);
    if (!Number.isFinite(blockedMs)) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleCheck = (delayMs: number) => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (!fetchStatusRef.current) {
          setState((prev) => ({
            ...prev,
            resendAttempts: 0,
            blockedUntil: null,
          }));
          return;
        }

        void fetchStatusRef.current()
          .then((status) => {
            if (cancelled) return;
            const next = applyResendStatus(stateRef.current, status, Date.now());
            if (!isResendBlocked(next, Date.now())) {
              setState({
                resendAttempts: 0,
                maxResendAttempts: next.maxResendAttempts,
                blockedUntil: null,
                cooldownEndsAt: null,
              });
            } else {
              setState(next);
              scheduleCheck(10_000);
            }
          })
          .catch(() => {
            if (!cancelled) {
              scheduleCheck(10_000);
            }
          });
      }, Math.max(0, delayMs));
    };

    scheduleCheck(blockedMs - Date.now());

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [active, state.blockedUntil]);

  const blocked = isResendBlocked(state);

  const handleResend = useCallback(async () => {
    const current = stateRef.current;
    if (isResending || isResendBlocked(current)) return;
    if (cooldownRemainingSeconds(current.cooldownEndsAt, Date.now()) > 0) return;

    setIsResending(true);
    onError?.(null);

    try {
      const response = await onResendRequest();
      const next = applyResendResponse(stateRef.current, response, Date.now());
      setState(next);
      setResendSeconds(cooldownRemainingSeconds(next.cooldownEndsAt, Date.now()));
      onSuccess?.();
    } catch (error) {
      const { state: next, errorMessage } = applyResendError(stateRef.current, error, Date.now());
      setState(next);
      setResendSeconds(cooldownRemainingSeconds(next.cooldownEndsAt, Date.now()));
      if (errorMessage) {
        onError?.(errorMessage);
      }
    } finally {
      setIsResending(false);
    }
  }, [isResending, onError, onResendRequest, onSuccess]);

  const resetCooldown = useCallback((seconds = OTP_RESEND_COOLDOWN_SECONDS) => {
    const now = Date.now();
    const endsAt = seconds > 0 ? now + seconds * 1000 : null;
    setState((prev) => ({
      ...prev,
      cooldownEndsAt: isResendBlocked(prev, now) ? null : endsAt,
    }));
    setResendSeconds(isResendBlocked(stateRef.current, now) ? 0 : Math.max(0, seconds));
  }, []);

  const effectiveResendSeconds =
    !active || blocked || !state.cooldownEndsAt ? 0 : resendSeconds;

  return {
    resendAttempts: state.resendAttempts,
    maxResendAttempts: state.maxResendAttempts,
    blockedUntil: state.blockedUntil,
    isBlocked: blocked,
    resendSeconds: effectiveResendSeconds,
    isResending,
    handleResend,
    resetCooldown,
  };
}
