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
import RegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import ExpertSocialAuth from "@/components/expert/onboarding/ExpertSocialAuth";
import ContinueButton from "@/components/ui/ContinueButton";
import register from "./register.shared.module.css";
import styles from "./RegisterStep.module.css";
import { register as registerExpert, type AuthResponse } from "@/lib/api";
import { getEmailValidationError, normalizeEmail } from "@/lib/emailValidation";
import { isDuplicateRegistrationMessage } from "@/lib/authUtils";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";
import {
  buildPasswordContext,
  getPasswordHint,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordValidationError,
} from "@/lib/passwordValidation";

type RegisterStepProps = {
  onContinue: (data: { expertId: string; phone: string; fullName: string; email: string }) => void;
  onOAuthSuccess: (response: AuthResponse) => void;
  onSwitchToLogin?: (email?: string) => void;
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
  onOAuthSuccess,
  onSwitchToLogin,
  loginHref = EXPERT_LOGIN_HREF,
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
      const response = await registerExpert({
        fullName,
        email: normalizeEmail(email),
        password,
        phone,
      });

      onContinue({
        expertId: response.expertId,
        phone,
        fullName,
        email: normalizeEmail(email),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      if (isDuplicateRegistrationMessage(message)) {
        setSubmitError(
          `${message} Please log in to continue your onboarding or check your application status.`,
        );
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

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel />

      <div className={register.registerRight}>
        <p className={styles.registerFormIntro}>
          Enter your details to register as expert
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
            <div role="alert">
              <p className={register.fieldErrorBelow}>{submitError}</p>
              {isDuplicateRegistrationMessage(submitError) ? (
                <p className={register.authToggle}>
                  Already registered?{" "}
                  {onSwitchToLogin ? (
                    <button type="button" className={register.authToggleBtn} onClick={() => onSwitchToLogin(email)}>
                      Log in to your account
                    </button>
                  ) : (
                    <Link href={loginHref} className={register.authToggleBtn}>
                      Log in to your account
                    </Link>
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          <ContinueButton
            type="submit"
            label={isSubmitting ? "Sending Code..." : "Send Verification Code"}
            disabled={!canSubmit || isSubmitting}
            className={`${styles.registerSubmitBtn} ${canSubmit && !isSubmitting ? "" : styles.registerSubmitBtnInactive}`}
          />

          <ExpertSocialAuth
            onSuccess={onOAuthSuccess}
            onError={setSubmitError}
            disabled={isSubmitting}
          />

          <p className={register.authToggle}>
            Already have an account?{" "}
            {onSwitchToLogin ? (
              <button type="button" className={register.authToggleBtn} onClick={() => onSwitchToLogin(email)}>
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
