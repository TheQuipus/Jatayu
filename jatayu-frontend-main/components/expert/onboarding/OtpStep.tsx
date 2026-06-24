"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import RegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import { verifyOtp as apiVerifyOtp, resendOtp as apiResendOtp, setToken } from "@/lib/api";
import register from "./register.shared.module.css";
import styles from "./OtpStep.module.css";

type OtpStepProps = {
  phone: string;
  email: string;
  expertId: string;
  onBack: () => void;
  onContinue: () => void;
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

export default function OtpStep({ phone, email, expertId, onBack, onContinue }: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const verifyCode = useCallback(
    async (code: string) => {
      if (isVerifying) return;
      setOtpError("");
      setIsVerifying(true);
      try {
        const res = await apiVerifyOtp({ expertId, code });
        setToken(res.token);
        onContinue();
      } catch (err: unknown) {
        setOtpError(
          err instanceof Error ? err.message : "Invalid or expired code. Please try again."
        );
        // Clear the digits so user can re-enter
        setDigits(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } finally {
        setIsVerifying(false);
      }
    },
    [expertId, isVerifying, onContinue]
  );

  const updateDigit = useCallback(
    (index: number, value: string) => {
      const char = value.replace(/\D/g, "").slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = char;
        if (char && next.every((d) => d !== "")) {
          const code = next.join("");
          queueMicrotask(() => verifyCode(code));
        }
        return next;
      });
      if (char && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [verifyCode]
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
      const code = next.join("");
      queueMicrotask(() => verifyCode(code));
    }
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || isResending) return;

    setOtpError("");
    setResendMessage("");
    setIsResending(true);

    try {
      await apiResendOtp({ expertId });
      setResendSeconds(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      setResendMessage("A new verification code has been sent to your email and phone.");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setOtpError(
        err instanceof Error ? err.message : "Could not resend verification code. Please try again."
      );
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
          {maskPhone(phone)} &amp; {maskEmail(email)}
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
                className={`${styles.otpInput} ${otpError ? styles.otpInputError ?? "" : ""}`}
                value={digit}
                placeholder="__"
                aria-label={`Digit ${index + 1}`}
                onChange={(e) => updateDigit(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
                disabled={isVerifying}
              />
            ))}
          </div>
          {isVerifying && (
            <p className={styles.otpResendText}>
              <span className={styles.otpResendMuted}>Verifying...</span>
            </p>
          )}
          {otpError && (
            <p className={styles.otpResendText}>
              <span style={{ color: "#FF3B30", fontSize: "13px" }}>{otpError}</span>
            </p>
          )}
          {resendMessage && !otpError && (
            <p className={styles.otpResendText}>
              <span style={{ color: "#34A853", fontSize: "13px" }}>{resendMessage}</span>
            </p>
          )}
        </div>

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
              onClick={handleResend}
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
