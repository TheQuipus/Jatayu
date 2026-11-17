"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  Clock,
  Mail,
  Minus,
  Send,
  X,
  Info,
} from "lucide-react";
import type { ExpertOnboardingAnalytics } from "@/lib/expertDropoutTracker";
import { sendAdminApplicationDropoutFollowUp } from "@/lib/api";
import styles from "./DropoutFollowUpModal.module.css";

interface DropoutFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedExpert: unknown, message: string) => void;
  appId: string;
  applicantName: string;
  applicantEmail: string;
  analytics: ExpertOnboardingAnalytics;
  lastFollowUpSentAt?: string | null;
}

export default function DropoutFollowUpModal({
  isOpen,
  onClose,
  onSuccess,
  appId,
  applicantName,
  applicantEmail,
  analytics,
  lastFollowUpSentAt,
}: DropoutFollowUpModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSending) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSending, onClose]);

  if (!isOpen || !mounted) return null;

  const dropoutStepTitle = analytics.dropoutStepTitle || "Incomplete Profile";
  const skippedSteps = analytics.steps
    .filter((s) => s.status === "skipped")
    .map((s) => s.title);
  const pendingSteps = analytics.steps
    .filter((s) => s.status === "pending")
    .map((s) => s.title);

  const hasEmail = Boolean(applicantEmail && applicantEmail.trim());

  const handleSendFollowUp = async () => {
    if (!hasEmail || isSending) return;
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await sendAdminApplicationDropoutFollowUp(appId);
      onSuccess(response.expert, response.message || "Follow-up email dispatched successfully.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send follow-up email.";
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const formattedLastSent = lastFollowUpSentAt
    ? new Date(lastFollowUpSentAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={() => {
        if (!isSending) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrapper}>
              <Mail size={20} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Send Onboarding Follow-Up</h2>
              <p className={styles.modalSubtitle}>
                <span>{applicantName || "Applicant"}</span>
                <span>·</span>
                <span>{appId}</span>
                {hasEmail ? (
                  <>
                    <span>·</span>
                    <span className={styles.recipientPill}>{applicantEmail}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSending}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className={styles.modalContent}>
          {/* Missing Email Alert */}
          {!hasEmail && (
            <div className={styles.alertWarning}>
              <AlertTriangle size={18} />
              <span>
                Applicant has no email address on file. Please request contact details directly before sending follow-up.
              </span>
            </div>
          )}

          {/* Previous Sent Alert */}
          {formattedLastSent && (
            <div className={styles.alertInfo}>
              <Info size={16} />
              <span>
                A reminder email was previously dispatched on <strong>{formattedLastSent}</strong>. Sending again will deliver a fresh reminder.
              </span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className={styles.alertError}>
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Visual Funnel Stepper */}
          <div>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionHeading}>Onboarding Sections & Dropout Funnel</h3>
              <span className={styles.progressPill}>
                {analytics.completionPercent}% Completed
              </span>
            </div>

            <div className={styles.stepperContainer}>
              <div className={styles.stepperRailLine} aria-hidden="true" />

              {analytics.steps.map((step, idx) => {
                const isDropout = step.status === "dropout";
                const isSubmitted = step.status === "submitted";
                const isSkipped = step.status === "skipped";

                return (
                  <div
                    key={step.id}
                    className={`${styles.stepRow} ${isDropout ? styles.stepRowDropout : ""}`}
                  >
                    <div className={styles.stepBadgeWrapper}>
                      {isDropout && <div className={styles.stepBeaconRed} />}
                      <div
                        className={`${styles.stepBadge} ${
                          isSubmitted
                            ? styles.stepBadgeSubmitted
                            : isDropout
                              ? styles.stepBadgeDropout
                              : isSkipped
                                ? styles.stepBadgeSkipped
                                : styles.stepBadgePending
                        }`}
                      >
                        {isSubmitted ? (
                          <Check size={13} strokeWidth={3} />
                        ) : isDropout ? (
                          <AlertTriangle size={13} />
                        ) : isSkipped ? (
                          <Minus size={13} strokeWidth={2.5} />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.stepContent}>
                      <div className={styles.stepTitleRow}>
                        <span className={styles.stepTitle}>{step.title}</span>
                        {isSubmitted ? (
                          <span className={styles.statusTagSubmitted}>Submitted</span>
                        ) : isDropout ? (
                          <span className={styles.statusTagDropout}>
                            <AlertTriangle size={10} />
                            Dropped Out ({analytics.idleMinutes}m idle)
                          </span>
                        ) : isSkipped ? (
                          <span className={styles.statusTagSkipped}>Skipped</span>
                        ) : (
                          <span className={styles.statusTagPending}>Unvisited</span>
                        )}
                      </div>

                      <p
                        className={`${styles.stepSummaryText} ${
                          isDropout ? styles.stepSummaryDropout : ""
                        }`}
                      >
                        {isDropout
                          ? "Applicant stopped progress here before completing the onboarding wizard."
                          : isSkipped
                            ? "Applicant chose to skip this optional section."
                            : isSubmitted
                              ? step.valueSummary || "Section details filled and verified."
                              : "Section has not been started yet."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Preview Card */}
          <div className={styles.emailPreviewCard}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>
                <Send size={13} /> Follow-Up Email Preview
              </span>
              <span className={styles.recipientPill}>
                To: {hasEmail ? applicantEmail : "No email configured"}
              </span>
            </div>

            <p className={styles.emailSubject}>
              Subject: Complete your Jatayu Expert Application – Finish {dropoutStepTitle}
            </p>

            <ul className={styles.emailChecklist}>
              <li>
                <span className={styles.checklistDropout}>● Where you left off:</span>{" "}
                <strong>{dropoutStepTitle}</strong>
              </li>
              {skippedSteps.length > 0 && (
                <li>
                  <span className={styles.checklistSkipped}>○ Skipped sections:</span>{" "}
                  {skippedSteps.join(", ")}
                </li>
              )}
              {pendingSteps.length > 0 && (
                <li>
                  <span className={styles.checklistPending}>○ Remaining sections:</span>{" "}
                  {pendingSteps.join(", ")}
                </li>
              )}
            </ul>

            <div className={styles.mockCtaButton}>
              Resume Application &rarr;
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleSendFollowUp}
            disabled={!hasEmail || isSending}
          >
            {isSending ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Sending Follow-Up...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Yes, Send Follow Up</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

