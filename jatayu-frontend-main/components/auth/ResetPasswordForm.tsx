"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import register from "@/components/seeker/onboarding/register.shared.module.css";
import formStyles from "@/components/seeker/onboarding/RegisterStep.module.css";

type ResetPasswordFormProps = {
  email?: string;
  loginHref?: string;
};

type FieldKey = "password" | "confirmPassword";

export default function ResetPasswordForm({
  loginHref = "/login",
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    password: false,
    confirmPassword: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const getFieldError = (field: FieldKey): string | null => {
    if (field === "password") {
      if (!password) return "Required";
      if (password.length < 8) return "Min 8 characters required";
      return null;
    }
    if (field === "confirmPassword") {
      if (!confirmPassword) return "Required";
      if (confirmPassword !== password) return "Passwords do not match";
      return null;
    }
    return null;
  };

  const fieldError = (field: FieldKey) => {
    if (!touched[field] && !submitAttempted) return null;
    return getFieldError(field);
  };

  const canSubmit =
    !getFieldError("password") &&
    !getFieldError("confirmPassword");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    // Simulate network call to update password
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel variant="login" />

      <div className={register.registerRight}>
        {isSuccess ? (
          <div className={formStyles.registerForm} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(18, 136, 7, 0.15)",
                border: "1px solid rgba(18, 136, 7, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#128807",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
              Password Reset Successfully!
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", marginBottom: 24, lineHeight: 1.5 }}>
              Your password has been updated. You can now log in with your new password.
            </p>

            <Link href={loginHref} style={{ textDecoration: "none" }}>
              <ContinueButton
                label="Back to Login"
                className={formStyles.registerSubmitBtn}
                arrowSize={16}
              />
            </Link>
          </div>
        ) : (
          <>
            <p className={formStyles.registerFormIntro}>
              Enter your new password below.
            </p>

            <form className={formStyles.registerForm} onSubmit={handleSubmit} noValidate>
              <div className={register.fieldGroup}>
                <label className={register.registerFieldLabel} htmlFor="newPassword">
                  New Password
                </label>
                <div
                  className={`${register.inputWithIconWrap} ${
                    fieldError("password") ? register.inputWithIconWrapError : ""
                  }`}
                >
                  <Lock className={register.inputInnerIcon} size={16} />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    className={`${register.textFieldWithIcon} ${formStyles.textFieldWithToggle}`}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldError("password"))}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={formStyles.passwordToggle}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword((prev) => !prev);
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldError("password") && (
                  <span className={register.fieldErrorBelow}>{fieldError("password")}</span>
                )}
              </div>

              <div className={register.fieldGroup}>
                <label className={register.registerFieldLabel} htmlFor="confirmNewPassword">
                  Confirm Password
                </label>
                <div
                  className={`${register.inputWithIconWrap} ${
                    fieldError("confirmPassword") ? register.inputWithIconWrapError : ""
                  }`}
                >
                  <Lock className={register.inputInnerIcon} size={16} />
                  <input
                    id="confirmNewPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${register.textFieldWithIcon} ${formStyles.textFieldWithToggle}`}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldError("confirmPassword"))}
                  />
                  <button
                    type="button"
                    className={formStyles.passwordToggle}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowConfirmPassword((prev) => !prev);
                    }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldError("confirmPassword") && (
                  <span className={register.fieldErrorBelow}>{fieldError("confirmPassword")}</span>
                )}
              </div>

              <ContinueButton
                type="submit"
                label={isSubmitting ? "Resetting..." : "Reset Password"}
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
