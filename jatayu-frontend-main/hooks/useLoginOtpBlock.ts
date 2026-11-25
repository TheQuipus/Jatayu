"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cooldownRemainingSeconds,
  extractOtpBlockDeadline,
  formatOtpLoginBlockMessage,
} from "@/lib/otpResend";

export function useLoginOtpBlock() {
  const [blockedEndsAt, setBlockedEndsAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!blockedEndsAt) return;

    const syncRemaining = () => {
      const remaining = cooldownRemainingSeconds(blockedEndsAt, Date.now());
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setBlockedEndsAt(null);
      }
    };

    const timer = setInterval(syncRemaining, 250);
    return () => clearInterval(timer);
  }, [blockedEndsAt]);

  const handleLoginBlockError = useCallback((error: unknown): boolean => {
    const now = Date.now();
    const deadline = extractOtpBlockDeadline(error, now);
    if (!deadline) return false;

    setBlockedEndsAt(deadline);
    setRemainingSeconds(cooldownRemainingSeconds(deadline, now));
    return true;
  }, []);

  const clearBlock = useCallback(() => {
    setBlockedEndsAt(null);
    setRemainingSeconds(0);
  }, []);

  const blockMessage = remainingSeconds > 0
    ? formatOtpLoginBlockMessage(remainingSeconds)
    : null;

  return {
    blockedSeconds: remainingSeconds,
    blockMessage,
    handleLoginBlockError,
    clearBlock,
  };
}
