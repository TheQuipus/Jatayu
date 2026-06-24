"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";

type LoginStepProps = {
  onContinue: (data: { email: string }) => void;
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
      if (!email.trim()) return "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email";
      return null;
    case "password":
      if (!password) return "Required";
      if (password.length < 8) return "Min 8 characters";
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
  onSwitchToRegister,
  registerHref = "/seeker/seeker-onboarding",
}: LoginStepProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(emptyTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const values = { email, password };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!canSubmit) return;
    onContinue({ email: email.trim() });
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
              {fieldError("email") && (
                <span className={register.fieldErrorInline}>{fieldError("email")}</span>
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
              {fieldError("password") && (
                <span className={register.fieldErrorInline}>{fieldError("password")}</span>
              )}
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
          </div>

          <button
            type="submit"
            className={`${styles.registerSubmitBtn} ${canSubmit ? "" : styles.registerSubmitBtnInactive}`}
          >
            <span>Login</span>
            <ArrowRight size={16} />
          </button>

          <div className={styles.registerDivider}>
            <span className={styles.registerDividerLine} />
            <span className={styles.registerDividerText}>Or continue with</span>
            <span className={styles.registerDividerLine} />
          </div>

          <div className={styles.socialButtonsRow}>
            <button
              type="button"
              className={styles.socialButton}
              onClick={() => onContinue({ email: email.trim() || "user@example.com" })}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.97 7.29C4.678 5.163 6.662 3.58 9 3.58z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              className={styles.socialButton}
              onClick={() => onContinue({ email: email.trim() || "user@example.com" })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                />
              </svg>
              <span>Apple</span>
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
