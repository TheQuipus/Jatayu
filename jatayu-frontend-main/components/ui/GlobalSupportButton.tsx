"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Headphones, X } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import DropdownFilter from "@/components/ui/DropdownFilter";
import Spinner from "@/components/ui/Spinner";
import {
  fetchSupportMe,
  isAdminRoutePath,
  isOnboardingDarkThemePath,
  normalizeSupportPhone,
  OPEN_SUPPORT_FORM_EVENT,
  resolveSupportAuthToken,
  submitSupportTicket,
  SUPPORT_CUSTOM_SUBJECT_MAX_LENGTH,
  SUPPORT_DESCRIPTION_MAX_LENGTH,
  SUPPORT_SUBJECT_OPTIONS,
  validateSupportCustomSubject,
  validateSupportFormInput,
  type SupportFormValidationErrors,
} from "@/lib/supportApi";
import styles from "./GlobalSupportButton.module.css";

function isClickInsidePortaledSelectMenu(target: Node | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest('[class*="DropdownFilter_menu"]') ||
      target.closest('[class*="DropdownFilter_otherSection"]') ||
      target.closest('[id^="react-select-"]'),
  );
}

function subscribeSupportAuth(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener("seeker-profile-updated", onStoreChange);
  window.addEventListener("expert-profile-updated", onStoreChange);
  window.addEventListener("jatayu:auth:force_logout", onStoreChange);

  const intervalId = window.setInterval(onStoreChange, 1500);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener("seeker-profile-updated", onStoreChange);
    window.removeEventListener("expert-profile-updated", onStoreChange);
    window.removeEventListener("jatayu:auth:force_logout", onStoreChange);
    window.clearInterval(intervalId);
  };
}

function getServerAuthSnapshot(): string | null {
  return null;
}

export default function GlobalSupportButton() {
  const pathname = usePathname();
  const baseId = useId();

  const getClientAuthSnapshot = useCallback(() => {
    if (typeof window === "undefined") return null;
    return resolveSupportAuthToken(pathname, window.location.search);
  }, [pathname]);

  const activeToken = useSyncExternalStore(
    subscribeSupportAuth,
    getClientAuthSnapshot,
    getServerAuthSnapshot,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const [prefilledForToken, setPrefilledForToken] = useState<string | null>(null);
  const [accountHasEmail, setAccountHasEmail] = useState(false);
  const [accountHasPhone, setAccountHasPhone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SupportFormValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const isVisible = !isAdminRoutePath(pathname) && Boolean(activeToken);
  const isPopoverOpen = isVisible && isOpen;

  // External trigger to open popover (e.g. from "Raise a ticket" CTA on Support page)
  useEffect(() => {
    const handleOpen = () => {
      setSubmittedTicketNumber(null);
      setSubmitError("");
      setFieldErrors({});
      setIsOpen(true);
    };

    window.addEventListener(OPEN_SUPPORT_FORM_EVENT, handleOpen);
    return () => {
      window.removeEventListener(OPEN_SUPPORT_FORM_EVENT, handleOpen);
    };
  }, []);

  // Prefill account email & phone when popover opens or when active account token changes
  useEffect(() => {
    if (!isPopoverOpen || !activeToken || prefilledForToken === activeToken) {
      return;
    }

    let cancelled = false;
    fetchSupportMe(pathname)
      .then(({ user }) => {
        if (cancelled) return;
        const accountEmail = (user.email || "").trim();
        const accountPhone = normalizeSupportPhone(user.phone || "");
        const hasEmail = Boolean(accountEmail);
        const hasPhone = /^\d{10}$/.test(accountPhone);

        setAccountHasEmail(hasEmail);
        setAccountHasPhone(hasPhone);
        setEmail(hasEmail ? accountEmail : "");
        setPhone(hasPhone ? accountPhone : "");
        setPrefilledForToken(activeToken);
      })
      .catch(() => {
        if (cancelled) return;
        setAccountHasEmail(false);
        setAccountHasPhone(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeToken, isPopoverOpen, pathname, prefilledForToken]);

  // Outside click and Escape key handling (matching NotificationPanel.tsx)
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (isClickInsidePortaledSelectMenu(target)) {
        return;
      }
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPopoverOpen]);

  // Focus first editable field when opening form
  useEffect(() => {
    if (!isPopoverOpen || submittedTicketNumber || accountHasEmail) return;
    const timer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isPopoverOpen, submittedTicketNumber, accountHasEmail]);

  if (!isVisible) {
    return null;
  }

  const isDarkTrigger = isOnboardingDarkThemePath(pathname);
  const popoverId = `global-support-popover-${baseId}`;
  const emailId = `support-email-${baseId}`;
  const phoneId = `support-phone-${baseId}`;
  const subjectId = `support-subject-${baseId}`;
  const descriptionId = `support-description-${baseId}`;

  const resetFormForNewRequest = () => {
    setSubmittedTicketNumber(null);
    setSubject(null);
    setDescription("");
    setFieldErrors({});
    setSubmitError("");
    setPrefilledForToken(null);
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && submittedTicketNumber) {
        setSubmittedTicketNumber(null);
        setSubject(null);
        setDescription("");
        setFieldErrors({});
        setSubmitError("");
      }
      return next;
    });
  };

  const handleSubjectChange = (nextValue: string | null) => {
    setSubject(nextValue);
    setFieldErrors((prev) => ({ ...prev, subject: undefined }));
    setSubmitError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = validateSupportFormInput({
      email,
      phone,
      subject: subject ?? "",
      description,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await submitSupportTicket(validation.values, pathname);
      setSubmittedTicketNumber(response.ticket.ticketNumber);
      setSubject(null);
      setDescription("");
    } catch {
      // Keep user's entered form values intact so they can immediately retry
      setSubmitError("Something went wrong, please raise the ticket again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isPopoverOpen ? styles.containerOpen : ""}`}
    >
      <div
        id={popoverId}
        className={styles.popover}
        role="dialog"
        aria-modal="false"
        aria-label="Contact Support"
        aria-hidden={!isPopoverOpen}
      >
        <div className={styles.popoverHead}>
          <div className={styles.popoverTitleGroup}>
            <h2 className={styles.popoverTitle}>Contact Support</h2>
            <p className={styles.popoverSubtitle}>
              Report an issue without leaving this page
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close support form"
            title="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.popoverBody}>
          {submittedTicketNumber ? (
            <div className={styles.successState} role="status" aria-live="polite">
              <div className={styles.successIconWrap} aria-hidden="true">
                <CheckCircle2 size={24} />
              </div>
              <h3 className={styles.successTitle}>Request Submitted</h3>
              <span className={styles.ticketBadge}>
                Ticket #{submittedTicketNumber}
              </span>
              <p className={styles.successCopy}>
                We have received your support request and notified our team. We will
                reply to your email address shortly.
              </p>
              <div className={styles.successActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={resetFormForNewRequest}
                >
                  New Request
                </button>
                <ContinueButton
                  type="button"
                  label="Done"
                  showArrow={false}
                  onClick={() => {
                    setIsOpen(false);
                    setSubmittedTicketNumber(null);
                  }}
                  style={{ flex: 1, minHeight: "40px" }}
                />
              </div>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor={emailId} className={styles.fieldLabel}>
                    Email Address
                    <span className={styles.requiredMark} aria-hidden="true">
                      *
                    </span>
                  </label>
                </div>
                <input
                  ref={emailInputRef}
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  readOnly={accountHasEmail}
                  tabIndex={accountHasEmail ? -1 : undefined}
                  className={`${styles.input} ${
                    accountHasEmail ? styles.inputReadOnly : ""
                  } ${fieldErrors.email ? styles.inputError : ""}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    if (accountHasEmail) return;
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                    if (submitError) setSubmitError("");
                  }}
                  disabled={isSubmitting}
                  aria-readonly={accountHasEmail}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email
                      ? `${emailId}-error`
                      : accountHasEmail
                        ? `${emailId}-helper`
                        : undefined
                  }
                />
                {accountHasEmail ? (
                  <p id={`${emailId}-helper`} className={styles.fieldHelperText}>
                    From your account
                  </p>
                ) : null}
                {fieldErrors.email ? (
                  <p
                    id={`${emailId}-error`}
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor={phoneId} className={styles.fieldLabel}>
                    Mobile Number
                    <span className={styles.requiredMark} aria-hidden="true">
                      *
                    </span>
                  </label>
                </div>
                <div
                  className={`${styles.phoneInputWrap} ${
                    accountHasPhone ? styles.phoneInputWrapReadOnly : ""
                  } ${fieldErrors.phone ? styles.inputError : ""}`}
                >
                  <span className={styles.phonePrefix} aria-hidden="true">
                    +91
                  </span>
                  <input
                    id={phoneId}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    readOnly={accountHasPhone}
                    tabIndex={accountHasPhone ? -1 : undefined}
                    className={`${styles.phoneInput} ${
                      accountHasPhone ? styles.phoneInputReadOnly : ""
                    }`}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      if (accountHasPhone) return;
                      const normalized = normalizeSupportPhone(e.target.value).slice(
                        0,
                        10,
                      );
                      setPhone(normalized);
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                      if (submitError) setSubmitError("");
                    }}
                    disabled={isSubmitting}
                    aria-readonly={accountHasPhone}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone
                        ? `${phoneId}-error`
                        : accountHasPhone
                          ? `${phoneId}-helper`
                          : undefined
                    }
                  />
                </div>
                {accountHasPhone ? (
                  <p id={`${phoneId}-helper`} className={styles.fieldHelperText}>
                    From your account
                  </p>
                ) : null}
                {fieldErrors.phone ? (
                  <p
                    id={`${phoneId}-error`}
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>

              <div className={styles.fieldGroup}>
                <DropdownFilter
                  id={subjectId}
                  name="subject"
                  label="Subject"
                  required
                  variant="light"
                  options={SUPPORT_SUBJECT_OPTIONS}
                  value={subject}
                  onChange={handleSubjectChange}
                  placeholder="Select issue category..."
                  isSearchable={true}
                  allowCustomOption={true}
                  selectOnCreate={true}
                  customInputPlaceholder="Type custom subject..."
                  maxCustomOptionLength={SUPPORT_CUSTOM_SUBJECT_MAX_LENGTH}
                  validateCustomOption={validateSupportCustomSubject}
                  disabled={isSubmitting}
                  error={fieldErrors.subject}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor={descriptionId} className={styles.fieldLabel}>
                    Issue Description
                    <span className={styles.requiredMark} aria-hidden="true">
                      *
                    </span>
                  </label>
                  <span
                    className={`${styles.charCounter} ${
                      description.length >= SUPPORT_DESCRIPTION_MAX_LENGTH
                        ? styles.charCounterLimit
                        : ""
                    }`}
                  >
                    {description.length} / {SUPPORT_DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id={descriptionId}
                  rows={3}
                  maxLength={SUPPORT_DESCRIPTION_MAX_LENGTH}
                  className={`${styles.textarea} ${
                    fieldErrors.description ? styles.inputError : ""
                  }`}
                  placeholder="Briefly describe the issue you are facing (1–160 characters)..."
                  value={description}
                  onChange={(e) => {
                    setDescription(
                      e.target.value.slice(0, SUPPORT_DESCRIPTION_MAX_LENGTH),
                    );
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        description: undefined,
                      }));
                    }
                    if (submitError) setSubmitError("");
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? `${descriptionId}-error` : undefined
                  }
                />
                {fieldErrors.description ? (
                  <p
                    id={`${descriptionId}-error`}
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <div className={styles.submitErrorBanner} role="alert">
                  {submitError}
                </div>
              ) : null}

              <ContinueButton
                type="submit"
                label={isSubmitting ? "Submitting" : "Submit Request"}
                leadingIcon={isSubmitting ? <Spinner size={15} /> : undefined}
                showArrow={!isSubmitting}
                disabled={isSubmitting}
                className={styles.submitBtn}
              />
            </form>
          )}
        </div>
      </div>

      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isDarkTrigger ? styles.triggerDark : ""}`}
        aria-label="Support"
        title="Support"
        aria-expanded={isPopoverOpen}
        aria-controls={popoverId}
        onClick={handleToggleOpen}
      >
        <Headphones size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
