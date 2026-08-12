"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import ContinueButton from "@/components/ui/ContinueButton";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";
import { seekerLogin, SeekerOtpRequiredError, type AuthResponse } from "@/lib/api";
import { getEmailValidationError, normalizeEmail } from "@/lib/emailValidation";
import { savePendingSeekerOtpSession } from "@/lib/seekerAuth";
import {
  buildPasswordContext,
  getPasswordHint,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from "@/lib/passwordValidation";

type LoginStepProps = {
  onContinue: (response: AuthResponse) => void;
  onRequiresOtp?: (data: { seekerId: string; email: string; phone: string; fullName?: string }) => void;
  onSwitchToRegister?: () => void;
  registerHref?: string;
};

type FieldKey = "email" | "password";

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
      return null;
    default:
      return null;
  }
}

function isFormComplete(email: string, password: string): boolean {
  return (
    !getFieldError("email", { email, password }) &&
    !getFieldError("password", { email, password })
  );
}

export default function LoginStep({
  onContinue,
  onRequiresOtp,
  onSwitchToRegister,
  registerHref = "/seeker/seeker-onboarding/",
}: LoginStepProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(emptyTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const values = { email, password };
  const passwordContext = buildPasswordContext({ email });
  const strength = getPasswordStrength(password, passwordContext);
  const strengthColor = getPasswordStrengthColor(password, passwordContext);
  const passwordHint = getPasswordHint(password, passwordContext);
  const strengthLabel = getPasswordStrengthLabel(password, passwordContext);
  const canSubmit = isFormComplete(email, password);

  const markTouched = (field: FieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldError = (field: FieldKey) => {
    if (!touched[field] && !submitAttempted) return null;
    return getFieldError(field, values);
  };

  const inputWrapClass = (field: FieldKey, extraClass?: string) =>
    [
      register.inputWithIconWrap,
      fieldError(field) ? register.inputWithIconWrapError : "",
      extraClass,
    ]
      .filter(Boolean)
      .join(" ");

  const submitLogin = async () => {
    setSubmitAttempted(true);
    setSubmitError(null);
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await seekerLogin({
        email: normalizeEmail(email),
        password,
      });
      onContinue(response);
    } catch (error) {
      if (error instanceof SeekerOtpRequiredError) {
        savePendingSeekerOtpSession({
          seekerId: error.seekerId,
          email: error.email,
          phone: error.phone,
        });
        onRequiresOtp?.({
          seekerId: error.seekerId,
          email: error.email,
          phone: error.phone,
        });
        return;
      }
      setSubmitError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitLogin();
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel variant="login" />

      <div className={register.registerRight}>
        <p className={styles.registerFormIntro}>Enter your details to login to your account</p>

        <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="loginEmail">
              Email Address
            </label>
            <div className={register.inputFieldWrap}>
              <div className={inputWrapClass("email")}>
                <Mail className={register.inputInnerIcon} size={16} />
                <input
                  id="loginEmail"
                  type="email"
                  className={register.textFieldWithIcon}
                  placeholder="Aryan23@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldError("email"))}
                />
              </div>
              {fieldError("email") && (
                <span className={register.fieldErrorBelow}>{fieldError("email")}</span>
              )}
            </div>
          </div>

          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="loginPassword">
              Password
            </label>
            <div className={inputWrapClass("password")}>
              <Lock className={register.inputInnerIcon} size={16} />
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                className={`${register.textFieldWithIcon} ${styles.textFieldWithToggle}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                autoComplete="current-password"
                aria-invalid={Boolean(fieldError("password"))}
              />
              <button
                type="button"
                className={styles.passwordToggle}
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
            <div className={styles.passwordStrengthRow}>
              <div className={styles.passwordStrengthBars}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={styles.passwordStrengthBar}
                    style={{
                      background:
                        i < strength ? strengthColor : "rgba(255, 255, 255, 0.08)",
                    }}
                  />
                ))}
              </div>
              <div className={styles.passwordStrengthLabels}>
                {strengthLabel ? (
                  <span
                    className={styles.passwordStrengthLabel}
                    style={{ color: strengthColor }}
                  >
                    {strengthLabel}
                  </span>
                ) : passwordHint ? (
                  <span
                    className={`${styles.passwordHint} ${fieldError("password") ? styles.passwordHintError : ""}`}
                    aria-live="polite"
                  >
                    {passwordHint}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {submitError ? (
            <p className={register.fieldErrorBelow} role="alert">
              {submitError}
            </p>
          ) : null}

          <ContinueButton
            type="submit"
            label={isSubmitting ? "Logging in..." : "Login"}
            disabled={!canSubmit || isSubmitting}
            className={`${styles.registerSubmitBtn} ${canSubmit && !isSubmitting ? "" : styles.registerSubmitBtnInactive}`}
            arrowSize={16}
          />

          <div className={styles.registerDivider}>
            <span className={styles.registerDividerLine} />
            <span className={styles.registerDividerText}>Or continue with</span>
            <span className={styles.registerDividerLine} />
          </div>

          <div className={styles.socialButtonsRow}>
            <button
              type="button"
              className={styles.socialButton}
              onClick={() =>
                onContinue({
                  token: "mock-token",
                  user: {
                    id: "seeker-mock",
                    email: email.trim() || "user@example.com",
                    fullName: "Seeker User",
                    onboardingStep: "category",
                    status: "active",
                    role: "seeker",
                  },
                })
              }
              aria-label="Continue with Google"
              title="Continue with Google"
            >
              <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.97 7.29C4.678 5.163 6.662 3.58 9 3.58z" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.socialButton}
              onClick={() =>
                onContinue({
                  token: "mock-token",
                  user: {
                    id: "seeker-mock",
                    email: email.trim() || "user@example.com",
                    fullName: "Seeker User",
                    onboardingStep: "category",
                    status: "active",
                    role: "seeker",
                  },
                })
              }
              aria-label="Continue with LinkedIn"
              title="Continue with LinkedIn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#0A66C2"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.063 2.063 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
            </button>
            <button
              type="button"
              className={styles.socialButton}
              onClick={() =>
                onContinue({
                  token: "mock-token",
                  user: {
                    id: "seeker-mock",
                    email: email.trim() || "user@example.com",
                    fullName: "Seeker User",
                    onboardingStep: "category",
                    status: "active",
                    role: "seeker",
                  },
                })
              }
              aria-label="Continue with Facebook"
              title="Continue with Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </button>
            <button
              type="button"
              className={styles.socialButton}
              onClick={() =>
                onContinue({
                  token: "mock-token",
                  user: {
                    id: "seeker-mock",
                    email: email.trim() || "user@example.com",
                    fullName: "Seeker User",
                    onboardingStep: "category",
                    status: "active",
                    role: "seeker",
                  },
                })
              }
              aria-label="Continue with Instagram"
              title="Continue with Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <radialGradient id="ig-grad-sek-login" cx="30%" cy="107%" r="130%">
                  <stop offset="0%" stopColor="#fdf497" />
                  <stop offset="5%" stopColor="#fdf497" />
                  <stop offset="45%" stopColor="#fd5949" />
                  <stop offset="60%" stopColor="#d6249f" />
                  <stop offset="100%" stopColor="#285AEB" />
                </radialGradient>
                <path
                  fill="url(#ig-grad-sek-login)"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
            </button>
          </div>

          <p className={register.authToggle}>
            Don&apos;t have an account?{" "}
            {onSwitchToRegister ? (
              <button type="button" className={register.authToggleBtn} onClick={onSwitchToRegister}>
                Create one
              </button>
            ) : (
              <Link href={registerHref} className={register.authToggleBtn}>
                Create one
              </Link>
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
