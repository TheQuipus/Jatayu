"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import register from "@/components/seeker/onboarding/register.shared.module.css";
import formStyles from "@/components/seeker/onboarding/RegisterStep.module.css";
import { getEmailValidationError, normalizeEmail } from "@/lib/emailValidation";

type ForgotPasswordFormProps = {
  loginHref?: string;
};

export default function ForgotPasswordForm({
  loginHref = "/login",
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const emailError = (touched || submitAttempted) ? getEmailValidationError(email) : null;
  const canSubmit = !getEmailValidationError(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    // Simulate API network call to send reset email
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSent(true);
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel variant="login" />

      <div className={register.registerRight}>
        {isSent ? (
          <div className={formStyles.registerForm}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(18, 136, 7, 0.15)",
                  border: "1px solid rgba(18, 136, 7, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#128807",
                  marginBottom: 16,
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                Check Your Email
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>
                We have sent a password reset link to{" "}
                <strong style={{ color: "#fff" }}>{normalizeEmail(email)}</strong>.
              </p>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", marginBottom: 12 }}>
                Demo Environment: Click below to simulate opening the reset email link.
              </p>
              <Link
                href={`/reset-password?email=${encodeURIComponent(normalizeEmail(email))}&token=demo-token`}
                style={{ textDecoration: "none" }}
              >
                <ContinueButton
                  label="Open Reset Password Link"
                  className={formStyles.registerSubmitBtn}
                  arrowSize={16}
                />
              </Link>
            </div>

            <Link href={loginHref} style={{ textDecoration: "none" }}>
              <button
                type="button"
                className={register.authToggleBtn}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </Link>
          </div>
        ) : (
          <>
            <p className={formStyles.registerFormIntro}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form className={formStyles.registerForm} onSubmit={handleSubmit} noValidate>
              <div className={register.fieldGroup}>
                <label className={register.registerFieldLabel} htmlFor="forgotEmail">
                  Email Address
                </label>
                <div className={register.inputFieldWrap}>
                  <div
                    className={`${register.inputWithIconWrap} ${
                      emailError ? register.inputWithIconWrapError : ""
                    }`}
                  >
                    <Mail className={register.inputInnerIcon} size={16} />
                    <input
                      id="forgotEmail"
                      type="email"
                      className={register.textFieldWithIcon}
                      placeholder="admin@thequipus.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      autoComplete="email"
                      aria-invalid={Boolean(emailError)}
                      autoFocus
                    />
                  </div>
                  {emailError && (
                    <span className={register.fieldErrorBelow}>{emailError}</span>
                  )}
                </div>
              </div>

              <ContinueButton
                type="submit"
                label={isSubmitting ? "Sending..." : "Send Reset Link"}
                disabled={!canSubmit || isSubmitting}
                className={`${formStyles.registerSubmitBtn} ${
                  canSubmit && !isSubmitting ? "" : formStyles.registerSubmitBtnInactive
                }`}
                arrowSize={16}
              />

              <p className={register.authToggle} style={{ marginTop: 12 }}>
                Remembered your password?{" "}
                <Link href={loginHref} className={register.authToggleBtn}>
                  Back to Login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
