"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import AdminLoginLeftPanel from "@/components/admin/AdminLoginLeftPanel";
import register from "@/components/expert/onboarding/register.shared.module.css";
import formStyles from "@/components/expert/onboarding/RegisterStep.module.css";
import otpStyles from "@/components/expert/onboarding/OtpStep.module.css";
import pageStyles from "@/app/expert/expert-onboarding/page.module.css";
import { ADMIN_DASHBOARD_HREF } from "@/lib/adminDashboard";
import { getEmailValidationError } from "@/lib/emailValidation";

type FieldKey = "email" | "password";

const OTP_LENGTH = 6;

const emptyTouched: Record<FieldKey, boolean> = {
  email: false,
  password: false,
};

function getFieldError(
  field: FieldKey,
  values: { email: string; password: string },
): string | null {
  const { email, password } = values;

  switch (field) {
    case "email":
      return getEmailValidationError(email);
    case "password":
      if (!password) return "Required";
      if (password.length < 8) return "Min 8 characters";
      return null;
    default:
      return null;
  }
}

function isCredentialsComplete(email: string, password: string): boolean {
  return (
    !getFieldError("email", { email, password }) &&
    !getFieldError("password", { email, password })
  );
}

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(emptyTouched);
  const [otpTouched, setOtpTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const values = { email, password };
  const otpComplete = digits.every((digit) => digit !== "");
  const canSubmit = isCredentialsComplete(email, password) && otpComplete;

  const markTouched = (field: FieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldError = (field: FieldKey) => {
    if (!touched[field] && !submitAttempted) return null;
    return getFieldError(field, values);
  };

  const otpError =
    (otpTouched || submitAttempted) && !otpComplete ? "Enter the 6-digit code" : null;

  const inputWrapClass = (field: FieldKey, extraClass?: string) =>
    [
      register.inputWithIconWrap,
      fieldError(field) ? register.inputWithIconWrapError : "",
      extraClass,
    ]
      .filter(Boolean)
      .join(" ");

  const updateDigit = useCallback((index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);
    setOtpTouched(true);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setOtpTouched(true);
    if (!canSubmit) return;
    router.push(ADMIN_DASHBOARD_HREF);
  };

  return (
    <main className={pageStyles.pageContainer}>
      <div className={pageStyles.bgWrapper}>
        <img
          src="/assets/img/hero-bg.png"
          alt=""
          className={pageStyles.bgImage}
          role="presentation"
        />
        <div className={pageStyles.bgOverlay} />
      </div>

      <section className={register.registerCard}>
        <AdminLoginLeftPanel />

        <div className={register.registerRight}>
          <p className={formStyles.registerFormIntro}>
            Enter your details to login
          </p>

          <form className={formStyles.registerForm} onSubmit={handleSubmit} noValidate>
            <div className={register.fieldGroup}>
              <label className={register.registerFieldLabel} htmlFor="adminLoginEmail">
                Email Address
              </label>
              <div className={inputWrapClass("email")}>
                <Mail className={register.inputInnerIcon} size={16} />
                <input
                  id="adminLoginEmail"
                  type="email"
                  className={register.textFieldWithIcon}
                  placeholder="admin@jatayu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  autoComplete="username"
                  aria-invalid={Boolean(fieldError("email"))}
                />
              </div>
              {fieldError("email") && (
                <span className={formStyles.fieldErrorBelow}>{fieldError("email")}</span>
              )}
            </div>

            <div className={register.fieldGroup}>
              <label className={register.registerFieldLabel} htmlFor="adminLoginPassword">
                Password
              </label>
              <div className={inputWrapClass("password")}>
                <Lock className={register.inputInnerIcon} size={16} />
                <input
                  id="adminLoginPassword"
                  type={showPassword ? "text" : "password"}
                  className={`${register.textFieldWithIcon} ${formStyles.textFieldWithToggle}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldError("password"))}
                />
                {fieldError("password") && (
                  <span className={register.fieldErrorInline}>{fieldError("password")}</span>
                )}
                <button
                  type="button"
                  className={formStyles.passwordToggle}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={otpStyles.otpFieldGroup}>
              <span className={otpStyles.otpFieldLabel}>OTP</span>
              <div className={otpStyles.otpInputRow} onPaste={handleOtpPaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={otpStyles.otpInput}
                    value={digit}
                    placeholder="__"
                    aria-label={`OTP digit ${index + 1}`}
                    aria-invalid={Boolean(otpError)}
                    onChange={(e) => {
                      setOtpTouched(true);
                      updateDigit(index, e.target.value);
                    }}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onBlur={() => setOtpTouched(true)}
                  />
                ))}
              </div>
              {otpError ? (
                <span className={formStyles.fieldErrorBelow}>{otpError}</span>
              ) : (
                <p className={otpStyles.otpResendText}>
                  <span className={otpStyles.otpResendMuted}>
                    Use Google Authenticator, Authy, or any TOTP app.
                  </span>
                </p>
              )}
            </div>

            <ContinueButton
              type="submit"
              label="Login"
              aria-disabled={!canSubmit}
              className={`${formStyles.registerSubmitBtn} ${canSubmit ? "" : formStyles.registerSubmitBtnInactive}`}
              arrowSize={16}
            />
          </form>
        </div>
      </section>
    </main>
  );
}
