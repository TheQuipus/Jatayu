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
import SeekerSocialAuth from "./SeekerSocialAuth";

type LoginStepProps = {
  onContinue: (response: AuthResponse) => void;
  onRequiresOtp?: (data: { seekerId: string; email: string; phone: string; fullName?: string }) => void;
  onSwitchToRegister?: () => void;
  registerHref?: string;
  initialEmail?: string;
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
  initialEmail = "",
}: LoginStepProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(emptyTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
            <div className={register.inputFieldWrap}>
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
            <div className={styles.forgotPasswordRow}>
              {(fieldError("password") || submitError) ? (
                <span className={styles.forgotPasswordError} role="alert">
                  {fieldError("password") || submitError}
                </span>
              ) : <span />}
              <Link href="/forgot-password?role=user" className={styles.forgotPasswordLink}>
                Forgot Password?
              </Link>
            </div>
          </div>

          <ContinueButton
            type="submit"
            label={isSubmitting ? "Logging in..." : "Login"}
            disabled={!canSubmit || isSubmitting}
            className={`${styles.registerSubmitBtn} ${canSubmit && !isSubmitting ? "" : styles.registerSubmitBtnInactive}`}
            arrowSize={16}
          />

          <SeekerSocialAuth
            onSuccess={onContinue}
            onError={setSubmitError}
            disabled={isSubmitting}
          />

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
