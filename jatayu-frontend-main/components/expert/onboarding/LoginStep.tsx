"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import RegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";
import { getEmailValidationError, normalizeEmail } from "@/lib/emailValidation";

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
      return getEmailValidationError(email);
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
  registerHref = "/expert/expert-onboarding",
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
    onContinue({ email: normalizeEmail(email) });
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
          </div>

          <ContinueButton
            type="submit"
            label="Login"
            aria-disabled={!canSubmit}
            className={`${styles.registerSubmitBtn} ${canSubmit ? "" : styles.registerSubmitBtnInactive}`}
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
                  fill="#0A66C2"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.063 2.063 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
              <span>LinkedIn</span>
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
