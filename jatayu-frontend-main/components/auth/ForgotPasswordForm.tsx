"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import AdminLoginLeftPanel from "@/components/admin/AdminLoginLeftPanel";
import SeekerRegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import ExpertRegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import register from "@/components/seeker/onboarding/register.shared.module.css";
import formStyles from "@/components/seeker/onboarding/RegisterStep.module.css";
import recoveryStyles from "./PasswordRecovery.module.css";
import { getEmailValidationError, normalizeEmail } from "@/lib/emailValidation";
import { requestPasswordReset, type PasswordRecoveryRole } from "@/lib/api";

type ForgotPasswordFormProps = {
  loginHref?: string;
  role?: PasswordRecoveryRole;
};

export default function ForgotPasswordForm({ loginHref, role = "user" }: ForgotPasswordFormProps) {
  const effectiveLoginHref = loginHref || (role === "expert" ? "/login?role=expert" : role === "admin" ? "/admin" : "/login?role=user");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const emailError = touched || submitAttempted ? getEmailValidationError(email) : null;
  const canSubmit = !getEmailValidationError(email);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await requestPasswordReset({ role, email: normalizeEmail(email) });
      setIsSent(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to send the reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftPanel = role === "admin"
    ? <AdminLoginLeftPanel />
    : role === "expert"
      ? <ExpertRegisterLeftPanel variant="login" />
      : <SeekerRegisterLeftPanel variant="login" />;

  return (
    <section className={register.registerCard}>
      {leftPanel}
      <div className={register.registerRight}>
        {isSent ? (
          <div className={`${formStyles.registerForm} ${recoveryStyles.centered}`} role="status">
            <div className={recoveryStyles.successIcon}><CheckCircle2 size={32} /></div>
            <h1 className={recoveryStyles.title}>Check Your Email</h1>
            <p className={recoveryStyles.description}>
              If an account exists for that email, a password reset link has been sent. The link expires in 10 minutes.
            </p>
            <Link href={effectiveLoginHref} className={recoveryStyles.backButton}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <p className={formStyles.registerFormIntro}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <form className={formStyles.registerForm} onSubmit={handleSubmit} noValidate>
              <div className={register.fieldGroup}>
                <label className={register.registerFieldLabel} htmlFor="forgotEmail">Email Address</label>
                <div className={register.inputFieldWrap}>
                  <div className={`${register.inputWithIconWrap} ${emailError ? register.inputWithIconWrapError : ""}`}>
                    <Mail className={register.inputInnerIcon} size={16} />
                    <input
                      id="forgotEmail"
                      type="email"
                      className={register.textFieldWithIcon}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onBlur={() => setTouched(true)}
                      autoComplete="email"
                      aria-invalid={Boolean(emailError)}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  {emailError ? <span className={register.fieldErrorBelow}>{emailError}</span> : null}
                </div>
              </div>
              {submitError ? <p className={register.fieldErrorBelow} role="alert">{submitError}</p> : null}
              <ContinueButton
                type="submit"
                label={isSubmitting ? "Sending..." : "Send Reset Link"}
                disabled={!canSubmit || isSubmitting}
                className={`${formStyles.registerSubmitBtn} ${canSubmit && !isSubmitting ? "" : formStyles.registerSubmitBtnInactive}`}
                arrowSize={16}
              />
              <p className={register.authToggle}>
                <Link href={effectiveLoginHref} className={register.authToggleBtn}>Back to Login</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
