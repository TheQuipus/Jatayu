"use client";

import {
  OTP_RESEND_BLOCK_MESSAGES,
  OTP_RESEND_MAX_ATTEMPTS,
  formatResendCounter,
  isResendBlocked,
} from "@/lib/otpResend";
import styles from "./OtpResendControl.module.css";

export type OtpResendControlProps = {
  resendSeconds: number;
  isResending: boolean;
  resendAttempts: number;
  maxResendAttempts?: number;
  blockedUntil?: string | null;
  variant?: "dark" | "light";
  onResend: () => void;
};

export default function OtpResendControl({
  resendSeconds,
  isResending,
  resendAttempts,
  maxResendAttempts = OTP_RESEND_MAX_ATTEMPTS,
  blockedUntil = null,
  variant = "light",
  onResend,
}: OtpResendControlProps) {
  const blocked = isResendBlocked({
    resendAttempts,
    maxResendAttempts,
    blockedUntil,
  });
  const counterText = formatResendCounter(
    blocked ? maxResendAttempts : resendAttempts,
    maxResendAttempts,
  );
  const inCooldown = !blocked && resendSeconds > 0;
  const disabled = blocked || isResending || inCooldown;

  const buttonLabel = isResending
    ? "Resending..."
    : inCooldown
      ? `Resend OTP in ${resendSeconds}s`
      : "Resend OTP";

  return (
    <div className={`${styles.wrapper} ${variant === "dark" ? styles.dark : styles.light}`}>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.resendButton}
          onClick={onResend}
          disabled={disabled}
        >
          {buttonLabel}
        </button>
        <span className={styles.counter} aria-label={`Resend attempts ${counterText}`}>
          {counterText}
        </span>
      </div>

      {blocked ? (
        <ul className={styles.blockList} role="status" aria-live="polite">
          {OTP_RESEND_BLOCK_MESSAGES.map((line) => (
            <li key={line} className={styles.blockMessageLine}>
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
