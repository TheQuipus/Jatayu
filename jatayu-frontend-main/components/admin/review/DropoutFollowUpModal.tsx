"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { ExpertOnboardingAnalytics } from "@/lib/expertDropoutTracker";
import styles from "./ApplicationReview.module.css";

interface DropoutFollowUpModalProps {
  name: string;
  appId: string;
  applicantEmail: string;
  analytics: ExpertOnboardingAnalytics;
  lastFollowUpSentAt?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DropoutFollowUpModal({
  name,
  appId,
  applicantEmail,
  analytics,
  lastFollowUpSentAt,
  onCancel,
  onConfirm,
}: DropoutFollowUpModalProps) {
  const dropoutStepTitle = analytics.dropoutStepTitle || "Incomplete Profile";
  const idleMinutes = analytics.idleMinutes || 0;
  const skippedSteps = analytics.steps.filter((s) => s.status === "skipped");
  const pendingSteps = analytics.steps.filter((s) => s.status === "pending");

  const hasEmail = Boolean(applicantEmail && applicantEmail.trim());

  const formattedLastSent = lastFollowUpSentAt
    ? new Date(lastFollowUpSentAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={() => {
        if (hasEmail) {
          onConfirm();
        }
      }}
      title="Send Onboarding Follow-Up"
      confirmText="Confirm & Send Follow-Up"
      cancelText="Cancel"
      variant="danger"
      confirmDisabled={!hasEmail}
      icon={<AlertTriangle size={32} style={{ color: "#ef4444" }} />}
      message={
        <div>
          <p style={{ margin: "0 0 12px 0", textAlign: "center" }}>
            You are sending an onboarding follow-up for <strong>{name}</strong> ({appId}).
          </p>

          <div className={styles.modalFormGroup} style={{ textAlign: "left" }}>
            <label className={styles.modalFormLabel} style={{ fontWeight: 700, marginBottom: "8px", display: "block" }}>
              Dropout & Incomplete Sections
            </label>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: "rgba(239, 68, 68, 0.05)",
                padding: "12px",
                borderRadius: "0",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                <strong style={{ color: "#b91c1c" }}>
                  {dropoutStepTitle} (Dropped Out - {idleMinutes}m idle):
                </strong>
                <span style={{ marginLeft: "6px", color: "var(--scorpion)" }}>
                  Last activity recorded on this step before leaving
                </span>
              </div>

              {skippedSteps.map((step) => (
                <div key={step.id} style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  <strong style={{ color: "var(--scorpion)" }}>{step.title} (Skipped):</strong>
                  <span style={{ marginLeft: "6px", color: "var(--scorpion)" }}>
                    Skipped by applicant during onboarding
                  </span>
                </div>
              ))}

              {pendingSteps.map((step) => (
                <div key={step.id} style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  <strong style={{ color: "#ea580c" }}>{step.title} (Pending):</strong>
                  <span style={{ marginLeft: "6px", color: "var(--scorpion)" }}>
                    Section has not been started yet
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "0",
              border: hasEmail ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #ef4444",
              background: "rgba(239, 68, 68, 0.05)",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#b91c1c", marginBottom: "4px" }}>
              Email Follow-Up Delivery
            </div>
            <div style={{ fontSize: "12px", color: "var(--scorpion)", lineHeight: 1.45 }}>
              Recipient:{" "}
              <strong style={{ color: hasEmail ? "var(--ink)" : "#ef4444" }}>
                {hasEmail ? applicantEmail : "No email address on file!"}
              </strong>
              <br />
              {/* {hasEmail
                ? "A branded email listing the missing sections and containing a direct 'Resume Application' link will be delivered to the applicant."
                : "Cannot dispatch email follow-up without an email address on file."} */}
            </div>
            {formattedLastSent && (
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#b45309" }}>
                Last reminder sent on {formattedLastSent}.
              </div>
            )}
          </div>

          <p
            style={{
              marginTop: "16px",
              margin: "16px 0 0 0",
              fontSize: "12px",
              color: "var(--scorpion)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textAlign: "left",
            }}
          >
            <span style={{ color: "#E53B17" }}></span>
            <span>Note: These details will be shared with the expert in their follow-up email.</span>
          </p>
        </div>
      }
    />
  );
}
