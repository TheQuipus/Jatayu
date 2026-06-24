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
  ArrowRight,
} from "lucide-react";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";

type RegisterStepProps = {
  onContinue: (data: { phone: string; fullName: string; email: string }) => void;
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

const strengthColors = ["#FF3B30", "#FF9500", "#007AFF", "#34C759"];
const strengthLabels = ["Weak", "Moderate", "Good", "Strong"];

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (password: string) => password.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { id: "lowercase", label: "One lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { id: "number", label: "One number", test: (password: string) => /\d/.test(password) },
  {
    id: "special",
    label: "One special character",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

function getPasswordChecks(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));
}

function isPasswordValid(password: string) {
  return getPasswordChecks(password).every((rule) => rule.met);
}

function getPasswordStrength(password: string): number {
  if (!password) return 0;

  const checks = getPasswordChecks(password);
  const metCount = checks.filter((rule) => rule.met).length;

  if (checks.every((rule) => rule.met)) {
    return 4;
  }

  if (metCount <= 1) return 1;
  if (metCount <= 3) return 2;
  return 2;
}

function getPasswordHint(password: string) {
  if (isPasswordValid(password)) return "";
  return getPasswordChecks(password).find((rule) => !rule.met)?.label ?? "";
}

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
      if (!email.trim()) return "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email";
      return null;
    case "password":
      if (!password) return "Required";
      if (!isPasswordValid(password)) return "Password requirements not met";
      return null;
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
  loginHref = "/seeker/seeker-onboarding?auth=login",
}: RegisterStepProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(emptyTouched);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const values = { firstName, lastName, email, password, phone };
  const strength = getPasswordStrength(password);
  const passwordHint = getPasswordHint(password);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!canSubmit) return;
    onContinue({ phone, fullName, email });
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel />

      <div className={register.registerRight}>
        <p className={styles.registerFormIntro}>
          Enter your details to create a seeker account
        </p>

        <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.nameFieldsRow}>
            <div className={`${register.fieldGroup} ${styles.nameFieldGroup}`}>
              <label className={register.registerFieldLabel} htmlFor="firstName">
                First Name
              </label>
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
                <span className={styles.fieldErrorBelow}>{fieldError("firstName")}</span>
              )}
            </div>

            <div className={`${register.fieldGroup} ${styles.nameFieldGroup}`}>
              <label className={register.registerFieldLabel} htmlFor="lastName">
                Last Name
              </label>
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
                <span className={styles.fieldErrorBelow}>{fieldError("lastName")}</span>
              )}
            </div>
          </div>

          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="email">
              Email Address
            </label>
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
              {fieldError("email") && (
                <span className={register.fieldErrorInline}>{fieldError("email")}</span>
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
            <div className={styles.passwordStrengthRow}>
              <div className={styles.passwordStrengthBars}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={styles.passwordStrengthBar}
                    style={{
                      background:
                        i < strength
                          ? strengthColors[Math.min(strength - 1, 3)]
                          : "rgba(255, 255, 255, 0.08)",
                    }}
                  />
                ))}
              </div>
              <div className={styles.passwordStrengthLabels}>
                {passwordHint ? (
                  <span className={styles.passwordHint} aria-live="polite">
                    {passwordHint}
                  </span>
                ) : (
                  isPasswordValid(password) && (
                    <span
                      className={styles.passwordStrengthLabel}
                      style={{ color: strengthColors[3] }}
                    >
                      {strengthLabels[3]}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className={register.fieldGroup}>
            <label className={register.registerFieldLabel} htmlFor="phone">
              Phone
            </label>
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
              {fieldError("phone") && (
                <span className={register.fieldErrorInline}>{fieldError("phone")}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.registerSubmitBtn} ${canSubmit ? "" : styles.registerSubmitBtnInactive}`}
          >
            <span>Send Verification Code</span>
            <ArrowRight size={16} />
          </button>

          <div className={styles.registerDivider}>
            <span className={styles.registerDividerLine} />
            <span className={styles.registerDividerText}>Or continue with</span>
            <span className={styles.registerDividerLine} />
          </div>

          <div className={styles.socialButtonsRow}>
            <button type="button" className={styles.socialButton} onClick={() => onContinue({ phone, fullName, email })}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.97 7.29C4.678 5.163 6.662 3.58 9 3.58z" />
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className={styles.socialButton} onClick={() => onContinue({ phone, fullName, email })}>
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
