"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./OtpStep.module.css";
import { resendSeekerOtp, verifySeekerOtp, type AuthResponse } from "@/lib/api";

type OtpStepProps = {
  seekerId: string;
  phone: string;
  email: string;
  onBack: () => void;
  onContinue: (response: AuthResponse) => void;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 24;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last3 = digits.slice(-3) || "444";
  return `+91 XXXXXXX${last3}`;
}

function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return trimmed;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (local.length <= 2) {
    return `${local[0] ?? ""}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

export default function OtpStep({ seekerId, phone, email, onBack, onContinue }: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const verifyCode = useCallback(
    async (code: string) => {
      if (verifyingRef.current) return;

      verifyingRef.current = true;
      setIsVerifying(true);
      setError(null);

      try {
        const response = await verifySeekerOtp({ seekerId, code });
        onContinue(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid verification code.");
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        verifyingRef.current = false;
        setIsVerifying(false);
      }
    },
    [seekerId, onContinue],
  );

  const updateDigit = useCallback(
    (index: number, value: string) => {
      const char = value.replace(/\D/g, "").slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = char;
        if (char && next.every((d) => d !== "")) {
          const code = next.join("");
          queueMicrotask(() => {
            void verifyCode(code);
          });
        }
        return next;
      });
      if (char && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [verifyCode],
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    if (next.every((d) => d !== "")) {
      void verifyCode(next.join(""));
    }
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      await resendSeekerOtp({ seekerId });
      setResendSeconds(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel />

      <div className={`${register.registerRight} ${styles.otpRightPanel}`}>
        <button type="button" className={styles.otpBackBtn} onClick={onBack}>
          <ArrowLeft className={styles.otpBackIcon} size={14} />
          <span>Back</span>
        </button>

        <p className={styles.otpSentText}>
          A 6 digit verification code has been sent to
          <br />
          {maskPhone(phone)} & {maskEmail(email)}
        </p>

        <div className={styles.otpFieldGroup}>
          <span className={styles.otpFieldLabel}>Enter the Code</span>
          <div className={styles.otpInputRow} onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={styles.otpInput}
                value={digit}
                placeholder="__"
                aria-label={`Digit ${index + 1}`}
                disabled={isVerifying}
                onChange={(e) => updateDigit(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        {error ? (
          <p className={register.fieldErrorBelow} role="alert">
            {error}
          </p>
        ) : null}

        {isVerifying ? (
          <p className={styles.otpResendText}>Verifying code...</p>
        ) : null}

        <p className={styles.otpResendText}>
          {resendSeconds > 0 ? (
            <>
              <span className={styles.otpResendMuted}>Resend the code again in </span>
              <span className={styles.otpResendHighlight}>{resendSeconds} Seconds</span>
            </>
          ) : (
            <button
              type="button"
              className={styles.otpResendLink}
              onClick={() => void handleResend()}
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend the code"}
            </button>
          )}
        </p>
      </div>
    </section>
  );
}
