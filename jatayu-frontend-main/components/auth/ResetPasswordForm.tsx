"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import AdminLoginLeftPanel from "@/components/admin/AdminLoginLeftPanel";
import SeekerRegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import ExpertRegisterLeftPanel from "@/components/expert/onboarding/RegisterLeftPanel";
import register from "@/components/seeker/onboarding/register.shared.module.css";
import formStyles from "@/components/seeker/onboarding/RegisterStep.module.css";
import recoveryStyles from "./PasswordRecovery.module.css";
import { getPasswordValidationError } from "@/lib/passwordValidation";
import { resetPassword, type PasswordRecoveryRole } from "@/lib/api";

type ResetPasswordFormProps = {
  token: string;
  userId: string;
  loginHref?: string;
  role?: PasswordRecoveryRole;
};

type FieldKey = "password" | "confirmPassword";

export default function ResetPasswordForm({ token, userId, loginHref, role = "user" }: ResetPasswordFormProps) {
  const effectiveLoginHref = loginHref || (role === "expert" ? "/login?role=expert" : role === "admin" ? "/admin" : "/login?role=user");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({ password: false, confirmPassword: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const validLink = /^[A-Za-z0-9_-]{43}$/.test(token) && Boolean(userId);

  const getFieldError = (field: FieldKey) => {
    if (field === "password") return getPasswordValidationError(password);
    if (!confirmPassword) return "Required";
    return confirmPassword === password ? null : "Passwords do not match";
  };
  const fieldError = (field: FieldKey) => touched[field] || submitAttempted ? getFieldError(field) : null;
  const canSubmit = validLink && !getFieldError("password") && !getFieldError("confirmPassword");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await resetPassword({ role, userId, token, password });
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to reset the password.");
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
        {isSuccess ? (
          <div className={`${formStyles.registerForm} ${recoveryStyles.centered}`} role="status">
            <div className={recoveryStyles.successIcon}><CheckCircle2 size={36} /></div>
            <h1 className={recoveryStyles.title}>Password Updated</h1>
            <p className={recoveryStyles.description}>You can now log in with your new password.</p>
            <Link href={effectiveLoginHref} className={recoveryStyles.primaryLink}>Back to Login</Link>
          </div>
        ) : !validLink ? (
          <div className={`${formStyles.registerForm} ${recoveryStyles.centered}`} role="alert">
            <h1 className={recoveryStyles.title}>Invalid Reset Link</h1>
            <p className={recoveryStyles.description}>This link is incomplete or invalid. Request a new password reset email.</p>
            <Link href={`/forgot-password?role=${role}`} className={recoveryStyles.primaryLink}>Request New Link</Link>
          </div>
        ) : (
          <>
            <p className={formStyles.registerFormIntro}>Choose a secure new password for your account.</p>
            <form className={formStyles.registerForm} onSubmit={handleSubmit} noValidate>
              <div className={register.fieldGroup}>
                <label className={register.registerFieldLabel} htmlFor="newPassword">New Password</label>
                <div className={`${register.inputWithIconWrap} ${fieldError("password") ? register.inputWithIconWrapError : ""}`}>
                  <Lock className={register.inputInnerIcon} size={16} />
                  <input id="newPassword" type={showPassword ? "text" : "password"} className={`${register.textFieldWithIcon} ${formStyles.textFieldWithToggle}`} placeholder="Enter new password" value={password} onChange={(event) => setPassword(event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, password: true }))} autoComplete="new-password" aria-invalid={Boolean(fieldError("password"))} disabled={isSubmitting} autoFocus />
                  <button type="button" className={formStyles.passwordToggle} onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {fieldError("password") ? <span className={register.fieldErrorBelow}>{fieldError("password")}</span> : null}
              </div>
              <div className={register.fieldGroup}>
                <label className={register.registerFieldLabel} htmlFor="confirmNewPassword">Confirm Password</label>
                <div className={`${register.inputWithIconWrap} ${fieldError("confirmPassword") ? register.inputWithIconWrapError : ""}`}>
                  <Lock className={register.inputInnerIcon} size={16} />
                  <input id="confirmNewPassword" type={showConfirmPassword ? "text" : "password"} className={`${register.textFieldWithIcon} ${formStyles.textFieldWithToggle}`} placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, confirmPassword: true }))} autoComplete="new-password" aria-invalid={Boolean(fieldError("confirmPassword"))} disabled={isSubmitting} />
                  <button type="button" className={formStyles.passwordToggle} onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {fieldError("confirmPassword") ? <span className={register.fieldErrorBelow}>{fieldError("confirmPassword")}</span> : null}
              </div>
              {submitError ? <p className={register.fieldErrorBelow} role="alert">{submitError}</p> : null}
              <ContinueButton type="submit" label={isSubmitting ? "Resetting..." : "Reset Password"} disabled={!canSubmit || isSubmitting} className={`${formStyles.registerSubmitBtn} ${canSubmit && !isSubmitting ? "" : formStyles.registerSubmitBtnInactive}`} arrowSize={16} />
              <p className={register.authToggle}><Link href={effectiveLoginHref} className={register.authToggleBtn}>Back to Login</Link></p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
