"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import ContinueButton from "@/components/ui/ContinueButton";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";
import { registerSeeker } from "@/lib/api";
import { getEmailValidationError, normalizeEmail } from "@/lib/emailValidation";
import { isDuplicateRegistrationMessage } from "@/lib/expertOnboardingStatus";
import {
  buildPasswordContext,
  getPasswordHint,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordValidationError,
} from "@/lib/passwordValidation";

type RegisterStepProps = {
  onContinue: (data: { seekerId: string; phone: string; fullName: string; email: string }) => void;
  onSwitchToLogin?: () => void;
  loginHref?: string;
};

type FieldKey = "firstName" | "lastName" | "email" | "password" | "phone";

const emptyTouched: Record<FieldKey, boolean> = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  phone: false,
};

function getFieldError(
  field: FieldKey,
  values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  },
): string | null {
  const { firstName, lastName, email, password, phone } = values;
  const passwordContext = buildPasswordContext({ email, firstName, lastName });

  switch (field) {
    case "firstName":
      if (!firstName.trim()) return "Required";
      if (firstName.trim().length < 2) return "Too short";
      return null;
    case "lastName":
      if (!lastName.trim()) return "Required";
      if (lastName.trim().length < 2) return "Too short";
      return null;
    case "email":
      return getEmailValidationError(email);
    case "password":
      return getPasswordValidationError(password, passwordContext);
    case "phone":
      if (!phone) return "Required";
      if (phone.length !== 10) return "Enter 10-digit number";
      return null;
    default:
      return null;
  }
}

function isFormComplete(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone: string,
): boolean {
  const values = { firstName, lastName, email, password, phone };
  return (
    !getFieldError("firstName", values) &&
    !getFieldError("lastName", values) &&
    !getFieldError("email", values) &&
    !getFieldError("password", values) &&
    !getFieldError("phone", values)
  );
}

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export default function RegisterStep({
  onContinue,
  onSwitchToLogin,
  loginHref = "/seeker/seeker-onboarding/?auth=login",
}: RegisterStepProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(emptyTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const values = { firstName, lastName, email, password, phone };
  const passwordContext = buildPasswordContext({ email, firstName, lastName });
  const strength = getPasswordStrength(password, passwordContext);
  const strengthColor = getPasswordStrengthColor(password, passwordContext);
  const strengthLabel = getPasswordStrengthLabel(password, passwordContext);
  const passwordHint = getPasswordHint(password, passwordContext);
  const canSubmit = isFormComplete(firstName, lastName, email, password, phone);
  const fullName = buildFullName(firstName, lastName);

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

  const submitRegistration = async () => {
    setSubmitAttempted(true);
    setSubmitError(null);
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await registerSeeker({
        fullName,
        email: normalizeEmail(email),
        password,
        phone,
      });

      onContinue({
        seekerId: response.seekerId,
        phone,
        fullName,
        email: normalizeEmail(email),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      if (isDuplicateRegistrationMessage(message)) {
        setSubmitError(`${message} Please log in to continue.`);
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitRegistration();
  };

  const handleValidatedContinue = () => {
    void submitRegistration();
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel />

      <div className={register.registerRight}>
        <p className={styles.registerFormIntro}>
          Enter your details to register as a seeker
        </p>

        <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.nameFieldsRow}>
            <div className={`${register.fieldGroup} ${styles.nameFieldGroup}`}>
              <label className={register.registerFieldLabel} htmlFor="firstName">
                First Name
              </label>
              <div className={register.inputFieldWrap}>
                <div className={inputWrapClass("firstName")}>
                  <User className={register.inputInnerIcon} size={16} />
                  <input
                    id="firstName"
                    type="text"
                    className={register.textFieldWithIcon}
                    placeholder="Aryan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => markTouched("firstName")}
                    autoComplete="given-name"
                    aria-invalid={Boolean(fieldError("firstName"))}
                  />
                </div>
                {fieldError("firstName") && (
                  <span className={register.fieldErrorBelow}>{fieldError("firstName")}</span>
                )}
              </div>
            </div>

            <div className={`${register.fieldGroup} ${styles.nameFieldGroup}`}>
              <label className={register.registerFieldLabel} htmlFor="lastName">
                Last Name
              </label>
              <div className={register.inputFieldWrap}>
                <div className={inputWrapClass("lastName")}>
                  <input
                    id="lastName"
                    type="text"
                    className={register.textFieldWithIcon}
                    placeholder="Singh"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => markTouched("lastName")}
                    autoComplete="family-name"
                    aria-invalid={Boolean(fieldError("lastName"))}
                  />
                </div>
                {fieldError("lastName") && (
                  <span className={register.fieldErrorBelow}>{fieldError("lastName")}</span>
                )}
              </div>
            </div>
          </div>

          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="email">
              Email Address
            </label>
            <div className={register.inputFieldWrap}>
              <div className={inputWrapClass("email")}>
                <Mail className={register.inputInnerIcon} size={16} />
                <input
                  id="email"
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
            <label className={register.registerFieldLabel} htmlFor="password">
              Password
            </label>
            <div className={inputWrapClass("password")}>
              <Lock className={register.inputInnerIcon} size={16} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${register.textFieldWithIcon} ${styles.textFieldWithToggle}`}
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                autoComplete="new-password"
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

          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="phone">
              Phone
            </label>
            <div className={register.inputFieldWrap}>
              <div className={inputWrapClass("phone")}>
                <Phone className={register.inputInnerIcon} size={16} />
                <span className={styles.phonePrefix} aria-hidden="true">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  className={register.textFieldWithIcon}
                  placeholder="9898675444"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onBlur={() => markTouched("phone")}
                  autoComplete="tel-national"
                  maxLength={10}
                  aria-invalid={Boolean(fieldError("phone"))}
                />
              </div>
              {fieldError("phone") && (
                <span className={register.fieldErrorBelow}>{fieldError("phone")}</span>
              )}
            </div>
          </div>

          {submitError ? (
            <p className={register.fieldErrorBelow} role="alert">
              {submitError}
            </p>
          ) : null}

          <ContinueButton
            type="submit"
            label={isSubmitting ? "Sending code..." : "Send Verification Code"}
            disabled={!canSubmit || isSubmitting}
            className={`${styles.registerSubmitBtn} ${canSubmit && !isSubmitting ? "" : styles.registerSubmitBtnInactive}`}
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
              onClick={handleValidatedContinue}
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
              onClick={handleValidatedContinue}
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
              onClick={handleValidatedContinue}
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
              onClick={handleValidatedContinue}
              aria-label="Continue with Instagram"
              title="Continue with Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <radialGradient id="ig-grad-sek-reg" cx="30%" cy="107%" r="130%">
                  <stop offset="0%" stopColor="#fdf497" />
                  <stop offset="5%" stopColor="#fdf497" />
                  <stop offset="45%" stopColor="#fd5949" />
                  <stop offset="60%" stopColor="#d6249f" />
                  <stop offset="100%" stopColor="#285AEB" />
                </radialGradient>
                <path
                  fill="url(#ig-grad-sek-reg)"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
            </button>
          </div>

          <p className={register.authToggle}>
            Already have an account?{" "}
            {onSwitchToLogin ? (
              <button type="button" className={register.authToggleBtn} onClick={onSwitchToLogin}>
                Login
              </button>
            ) : (
              <Link href={loginHref} className={register.authToggleBtn}>
                Login
              </Link>
            )}
          </p>
        </form>
      </div>
    </section>
  );
}
