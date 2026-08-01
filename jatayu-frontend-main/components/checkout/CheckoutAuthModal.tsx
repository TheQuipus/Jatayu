import { type RefObject, type KeyboardEvent, type ClipboardEvent } from "react";
import { X, Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import {
  type CheckoutRegistrationFieldKey,
  type CheckoutRegistrationValues,
} from "./checkoutTypes";
import {
  maskCheckoutPhone,
  maskCheckoutEmail,
  getCheckoutRegistrationFieldError,
} from "./checkoutUtils";
import styles from "./CheckoutAuthModal.module.css";

export type CheckoutAuthModalProps = {
  onClose: () => void;
  registerOtpSent: boolean;
  isAuthLogin: boolean;
  onSetIsAuthLogin: (isLogin: boolean) => void;
  // Login form state
  loginEmail: string;
  onLoginEmailChange: (value: string) => void;
  loginPassword: string;
  onLoginPasswordChange: (value: string) => void;
  loginSubmitAttempted: boolean;
  onLoginSubmit: () => void;
  // Register form state
  registerFirstName: string;
  onRegisterFirstNameChange: (value: string) => void;
  registerLastName: string;
  onRegisterLastNameChange: (value: string) => void;
  registerEmail: string;
  onRegisterEmailChange: (value: string) => void;
  registerPhone: string;
  onRegisterPhoneChange: (value: string) => void;
  registerPassword: string;
  onRegisterPasswordChange: (value: string) => void;
  registerTouched: Record<CheckoutRegistrationFieldKey, boolean>;
  onMarkRegisterFieldTouched: (field: CheckoutRegistrationFieldKey) => void;
  registerSubmitAttempted: boolean;
  showRegisterPassword: boolean;
  onToggleShowRegisterPassword: () => void;
  registerPasswordStrength: number;
  registerPasswordStrengthColor: string;
  registerPasswordStrengthLabel: string | null;
  registerPasswordHint: string | null;
  canSendRegisterOtp: boolean;
  onSendRegisterOtp: () => void;
  // OTP state
  onResetRegisterOtpState: () => void;
  registerOtpDigits: string[];
  registerOtpInputRefs: RefObject<(HTMLInputElement | null)[]>;
  updateRegisterOtpDigit: (index: number, value: string) => void;
  handleRegisterOtpKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;
  handleRegisterOtpPaste: (event: ClipboardEvent) => void;
  registerOtpResendSeconds: number;
  onResendRegisterOtp: () => void;
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
  canContinueStep5: boolean;
  onAuthContinue: () => void;
};

export default function CheckoutAuthModal({
  onClose,
  registerOtpSent,
  isAuthLogin,
  onSetIsAuthLogin,
  loginEmail,
  onLoginEmailChange,
  loginPassword,
  onLoginPasswordChange,
  loginSubmitAttempted,
  onLoginSubmit,
  registerFirstName,
  onRegisterFirstNameChange,
  registerLastName,
  onRegisterLastNameChange,
  registerEmail,
  onRegisterEmailChange,
  registerPhone,
  onRegisterPhoneChange,
  registerPassword,
  onRegisterPasswordChange,
  registerTouched,
  onMarkRegisterFieldTouched,
  registerSubmitAttempted,
  showRegisterPassword,
  onToggleShowRegisterPassword,
  registerPasswordStrength,
  registerPasswordStrengthColor,
  registerPasswordStrengthLabel,
  registerPasswordHint,
  canSendRegisterOtp,
  onSendRegisterOtp,
  onResetRegisterOtpState,
  registerOtpDigits,
  registerOtpInputRefs,
  updateRegisterOtpDigit,
  handleRegisterOtpKeyDown,
  handleRegisterOtpPaste,
  registerOtpResendSeconds,
  onResendRegisterOtp,
  termsAccepted,
  onTermsAcceptedChange,
  canContinueStep5,
  onAuthContinue,
}: CheckoutAuthModalProps) {
  const registerFormValues: CheckoutRegistrationValues = {
    firstName: registerFirstName,
    lastName: registerLastName,
    email: registerEmail,
    phoneNumber: registerPhone,
    password: registerPassword,
  };

  const registerFieldError = (field: CheckoutRegistrationFieldKey) => {
    if (!registerTouched[field] && !registerSubmitAttempted) return null;
    return getCheckoutRegistrationFieldError(field, registerFormValues);
  };

  const registerInputWrapClass = (field: CheckoutRegistrationFieldKey, extraClass?: string) =>
    [
      styles.registerInputWrap,
      registerFieldError(field) ? styles.registerInputWrapError : "",
      extraClass,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div
      className={styles.authModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-auth-modal-title"
    >
      <div className={styles.authModal}>
        {registerOtpSent ? (
          <button
            type="button"
            className={styles.otpBackBtn}
            onClick={onResetRegisterOtpState}
          >
            <ArrowLeft size={14} className={styles.otpBackIcon} />
            <span>Back to details</span>
          </button>
        ) : null}

        <div className={styles.authModalHeader}>
          <div>
            <h2 id="checkout-auth-modal-title" className={styles.authModalTitle}>
              {registerOtpSent
                ? "Verification Code"
                : isAuthLogin
                  ? "Log In"
                  : "Sign Up"}
            </h2>
            {!registerOtpSent ? (
              <p className={styles.authModalSubtitle}>
                {isAuthLogin
                  ? "Welcome back! Enter your details to log in to your account."
                  : "Create your account to save this booking before final confirmation."}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.authModalClose}
            onClick={onClose}
            aria-label="Close auth popup"
          >
            <X size={18} />
          </button>
        </div>

        {!registerOtpSent ? (
          isAuthLogin ? (
            <div className={styles.registerPanel}>
              <div className={styles.registerForm}>
                <div className={styles.registerFieldGroup}>
                  <label className={styles.registerFieldLabel} htmlFor="checkout-login-email">
                    Email Address or Phone
                  </label>
                  <div className={styles.registerInputFieldWrap}>
                    <div
                      className={`${styles.registerInputWrap} ${
                        loginSubmitAttempted && !loginEmail.trim()
                          ? styles.registerInputWrapError
                          : ""
                      }`}
                    >
                      <Mail className={styles.registerInputIcon} size={16} />
                      <input
                        id="checkout-login-email"
                        type="text"
                        className={styles.registerInput}
                        placeholder="Aryan23@gmail.com or 9898675444"
                        value={loginEmail}
                        onChange={(event) => onLoginEmailChange(event.target.value)}
                        autoComplete="username"
                      />
                    </div>
                    {loginSubmitAttempted && !loginEmail.trim() ? (
                      <span className={styles.registerFieldError}>Required</span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.registerFieldGroup}>
                  <label className={styles.registerFieldLabel} htmlFor="checkout-login-password">
                    Password
                  </label>
                  <div className={styles.registerInputFieldWrap}>
                    <div
                      className={`${styles.registerInputWrap} ${styles.registerInputWrapWithToggle} ${
                        loginSubmitAttempted && !loginPassword.trim()
                          ? styles.registerInputWrapError
                          : ""
                      }`}
                    >
                      <Lock className={styles.registerInputIcon} size={16} />
                      <input
                        id="checkout-login-password"
                        type={showRegisterPassword ? "text" : "password"}
                        className={`${styles.registerInput} ${styles.registerInputWithToggle}`}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(event) => onLoginPasswordChange(event.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={styles.registerPasswordToggle}
                        onClick={onToggleShowRegisterPassword}
                        aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                      >
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginSubmitAttempted && !loginPassword.trim() ? (
                      <span className={styles.registerFieldError}>Required</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={styles.authModalActions}>
                <ContinueButton
                  type="button"
                  label="Log In"
                  disabled={!loginEmail.trim() || !loginPassword.trim()}
                  onClick={onLoginSubmit}
                  className={styles.registerSendOtpBtn}
                />
              </div>

              <div className={styles.authSwitchRow}>
                <span>Don&apos;t have an account?</span>
                <button
                  type="button"
                  className={styles.authSwitchBtn}
                  onClick={() => onSetIsAuthLogin(false)}
                >
                  Sign Up
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.registerPanel}>
              <div className={styles.registerForm}>
                <div className={styles.registerNameRow}>
                  <div className={styles.registerFieldGroup}>
                    <label className={styles.registerFieldLabel} htmlFor="checkout-first-name">
                      First Name
                    </label>
                    <div className={styles.registerInputFieldWrap}>
                      <div className={registerInputWrapClass("firstName")}>
                        <User className={styles.registerInputIcon} size={16} />
                        <input
                          id="checkout-first-name"
                          type="text"
                          className={styles.registerInput}
                          placeholder="Aryan"
                          value={registerFirstName}
                          onChange={(event) => onRegisterFirstNameChange(event.target.value)}
                          onBlur={() => onMarkRegisterFieldTouched("firstName")}
                          autoComplete="given-name"
                          aria-invalid={Boolean(registerFieldError("firstName"))}
                        />
                      </div>
                      {registerFieldError("firstName") ? (
                        <span className={styles.registerFieldError}>
                          {registerFieldError("firstName")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.registerFieldGroup}>
                    <label className={styles.registerFieldLabel} htmlFor="checkout-last-name">
                      Last Name
                    </label>
                    <div className={styles.registerInputFieldWrap}>
                      <div className={registerInputWrapClass("lastName")}>
                        <input
                          id="checkout-last-name"
                          type="text"
                          className={styles.registerInput}
                          placeholder="Singh"
                          value={registerLastName}
                          onChange={(event) => onRegisterLastNameChange(event.target.value)}
                          onBlur={() => onMarkRegisterFieldTouched("lastName")}
                          autoComplete="family-name"
                          aria-invalid={Boolean(registerFieldError("lastName"))}
                        />
                      </div>
                      {registerFieldError("lastName") ? (
                        <span className={styles.registerFieldError}>
                          {registerFieldError("lastName")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={styles.registerFieldGroup}>
                  <label className={styles.registerFieldLabel} htmlFor="checkout-email">
                    Email Address
                  </label>
                  <div className={styles.registerInputFieldWrap}>
                    <div className={registerInputWrapClass("email")}>
                      <Mail className={styles.registerInputIcon} size={16} />
                      <input
                        id="checkout-email"
                        type="email"
                        className={styles.registerInput}
                        placeholder="Aryan23@gmail.com"
                        value={registerEmail}
                        onChange={(event) => onRegisterEmailChange(event.target.value)}
                        onBlur={() => onMarkRegisterFieldTouched("email")}
                        autoComplete="email"
                        aria-invalid={Boolean(registerFieldError("email"))}
                      />
                    </div>
                    {registerFieldError("email") ? (
                      <span className={styles.registerFieldError}>
                        {registerFieldError("email")}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.registerFieldGroup}>
                  <label className={styles.registerFieldLabel} htmlFor="checkout-password">
                    Password
                  </label>
                  <div className={styles.registerInputFieldWrap}>
                    <div
                      className={registerInputWrapClass(
                        "password",
                        styles.registerInputWrapWithToggle
                      )}
                    >
                      <Lock className={styles.registerInputIcon} size={16} />
                      <input
                        id="checkout-password"
                        type={showRegisterPassword ? "text" : "password"}
                        className={`${styles.registerInput} ${styles.registerInputWithToggle}`}
                        placeholder="Create a secure password"
                        value={registerPassword}
                        onChange={(event) => onRegisterPasswordChange(event.target.value)}
                        onBlur={() => onMarkRegisterFieldTouched("password")}
                        autoComplete="new-password"
                        aria-invalid={Boolean(registerFieldError("password"))}
                      />
                      <button
                        type="button"
                        className={styles.registerPasswordToggle}
                        onClick={onToggleShowRegisterPassword}
                        aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                        aria-pressed={showRegisterPassword}
                      >
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className={styles.registerPasswordStrengthRow}>
                      <div className={styles.registerPasswordStrengthBars}>
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className={styles.registerPasswordStrengthBar}
                            style={{
                              background:
                                index < registerPasswordStrength
                                  ? registerPasswordStrengthColor
                                  : "var(--mercury)",
                            }}
                          />
                        ))}
                      </div>
                      <div className={styles.registerPasswordStrengthLabels}>
                        {registerPasswordStrengthLabel ? (
                          <span
                            className={styles.registerPasswordStrengthLabel}
                            style={{ color: registerPasswordStrengthColor }}
                          >
                            {registerPasswordStrengthLabel}
                          </span>
                        ) : registerPasswordHint ? (
                          <span
                            className={`${styles.registerPasswordHint} ${
                              registerFieldError("password")
                                ? styles.registerPasswordHintError
                                : ""
                            }`}
                            aria-live="polite"
                          >
                            {registerPasswordHint}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.registerFieldGroup}>
                  <label className={styles.registerFieldLabel} htmlFor="checkout-phone">
                    Phone
                  </label>
                  <div className={styles.registerInputFieldWrap}>
                    <div className={registerInputWrapClass("phoneNumber")}>
                      <Phone className={styles.registerInputIcon} size={16} />
                      <span className={styles.registerPhonePrefix} aria-hidden="true">
                        +91
                      </span>
                      <input
                        id="checkout-phone"
                        type="tel"
                        inputMode="numeric"
                        className={styles.registerInput}
                        placeholder="9898675444"
                        value={registerPhone}
                        onChange={(event) =>
                          onRegisterPhoneChange(
                            event.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                        }
                        onBlur={() => onMarkRegisterFieldTouched("phoneNumber")}
                        autoComplete="tel-national"
                        maxLength={10}
                        aria-invalid={Boolean(registerFieldError("phoneNumber"))}
                      />
                    </div>
                    {registerFieldError("phoneNumber") ? (
                      <span className={styles.registerFieldError}>
                        {registerFieldError("phoneNumber")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={styles.authModalActions}>
                <ContinueButton
                  type="button"
                  label="Send Verification Code"
                  disabled={!canSendRegisterOtp}
                  onClick={onSendRegisterOtp}
                  className={styles.registerSendOtpBtn}
                />
              </div>

              <div className={styles.authSwitchRow}>
                <span>Already have an account?</span>
                <button
                  type="button"
                  className={styles.authSwitchBtn}
                  onClick={() => onSetIsAuthLogin(true)}
                >
                  Log In
                </button>
              </div>
            </div>
          )
        ) : (
          <div className={styles.registerPanel}>
            <p className={styles.registerOtpSentText}>
              A 6 digit verification code has been sent to
              <br />
              <strong>{maskCheckoutPhone(registerPhone)}</strong> & <strong>{maskCheckoutEmail(registerEmail)}</strong>
            </p>

            <div className={styles.registerOtpFieldGroup}>
              <span className={styles.registerFieldLabel}>Enter the Code</span>
              <div
                className={styles.registerOtpInputRow}
                onPaste={handleRegisterOtpPaste}
              >
                {registerOtpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      if (registerOtpInputRefs.current) {
                        registerOtpInputRefs.current[index] = element;
                      }
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={styles.registerOtpInput}
                    value={digit}
                    placeholder="__"
                    aria-label={`Digit ${index + 1}`}
                    onChange={(event) =>
                      updateRegisterOtpDigit(index, event.target.value)
                    }
                    onKeyDown={(event) => handleRegisterOtpKeyDown(index, event)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <p className={styles.registerOtpResendText}>
              {registerOtpResendSeconds > 0 ? (
                <>
                  <span className={styles.registerOtpResendMuted}>
                    Resend the code again in{" "}
                  </span>
                  <span className={styles.registerOtpResendHighlight}>
                    {registerOtpResendSeconds} Seconds
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.registerOtpResendLink}
                  onClick={onResendRegisterOtp}
                >
                  Resend the code
                </button>
              )}
            </p>

            <label className={styles.termsAgreement}>
              <input
                type="checkbox"
                className={styles.termsAgreementCheckbox}
                checked={termsAccepted}
                onChange={(event) => onTermsAcceptedChange(event.target.checked)}
              />
              <span className={styles.termsAgreementText}>
                By confirming, you agree to our{" "}
                <a href="/terms-of-service/" className={styles.termsLink}>
                  Terms
                </a>
              </span>
            </label>

            <div className={styles.authModalActions}>
              <ContinueButton
                type="button"
                label="Continue to Confirm"
                disabled={!canContinueStep5}
                onClick={onAuthContinue}
                className={styles.registerSendOtpBtn}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
