"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import styles from "./ApplicationReview.module.css";

interface RejectConfirmModalProps {
  name: string;
  appId: string;
  rejectedSections: { sectionTitle: string; note: string; decision?: string | null }[];
  onCancel: () => void;
  onConfirm: (notes: string, isBlacklisted: boolean) => void;
}

export default function RejectConfirmModal({
  name,
  appId,
  rejectedSections,
  onCancel,
  onConfirm,
}: RejectConfirmModalProps) {
  const [notes, setNotes] = useState("");
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const hasIssues = rejectedSections.length > 0;

  const handleConfirmAction = () => {
    let finalNote = notes.trim();
    if (hasIssues) {
      const compiled = rejectedSections
        .map((item) => {
          const statusLabel = item.decision === "reject" ? "Rejected" : "Needs Clarification";
          return `[${item.sectionTitle} - ${statusLabel}]: ${item.note || "No feedback notes entered"}`;
        })
        .join("; ");
      onConfirm(compiled, isBlacklisted);
    } else {
      if (!finalNote) {
        if (isBlacklisted) {
          finalNote = "Profile blacklisted and rejected by administrator.";
        } else {
          setErrorMsg("Please provide a reason for rejecting the application.");
          return;
        }
      }
      onConfirm(finalNote, isBlacklisted);
    }
  };

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={handleConfirmAction}
      title="Reject Application"
      confirmText={isBlacklisted ? "Confirm Rejection & Blacklist" : "Confirm Rejection"}
      cancelText="Cancel"
      variant="danger"
      icon={<AlertTriangle size={32} style={{ color: "#ef4444" }} />}
      message={
        <div>
          <p style={{ margin: "0 0 12px 0" }}>
            You are rejecting the expert application for <strong>{name}</strong> ({appId}). This decision is final.
          </p>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalFormLabel}>Rejection Reasons from Section Reviews</label>
            {rejectedSections.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(239, 68, 68, 0.05)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.12)" }}>
                {rejectedSections.map((item) => {
                  const isReject = item.decision === "reject";
                  const statusLabel = isReject ? "Rejected" : "Needs Clarification";
                  return (
                    <div key={item.sectionTitle} style={{ fontSize: "12px", lineHeight: "1.4" }}>
                      <strong style={{ color: isReject ? "#b91c1c" : "#b45309" }}>
                        {item.sectionTitle} ({statusLabel}):
                      </strong>
                      <span style={{ marginLeft: "6px", color: "var(--scorpion)" }}>
                        {item.note || "No feedback notes entered"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: "var(--scorpion)", margin: 0, fontStyle: "italic" }}>
                No sections have review issues.
              </p>
            )}
          </div>

          {!hasIssues && (
            <div className={styles.modalFormGroup} style={{ marginTop: "12px" }}>
              <label className={styles.modalFormLabel}>Explain why you are rejecting this application</label>
              <textarea
                className={styles.modalTextarea}
                style={errorMsg ? { borderColor: "#ef4444" } : undefined}
                placeholder="Provide a reason for rejecting the application..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                required
              />
              {errorMsg && (
                <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>
                  {errorMsg}
                </p>
              )}
            </div>
          )}

          <div className={styles.modalBlacklistOption}>
            <label className={styles.modalBlacklistLabel}>
              <input
                type="checkbox"
                checked={isBlacklisted}
                onChange={(e) => setIsBlacklisted(e.target.checked)}
                className={styles.modalBlacklistCheckbox}
              />
              <div className={styles.modalBlacklistContent}>
                <span className={styles.modalBlacklistTitle}>Blacklist this profile</span>
                <span className={styles.modalBlacklistSubtext}>
                  Prevents this applicant from logging in or registering with these credentials in the future.
                </span>
              </div>
            </label>
          </div>

          <p style={{ marginTop: "16px", margin: "16px 0 0 0", fontSize: "12px", color: "var(--scorpion)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#E53B17" }}>ℹ</span>
            <span>Note: These details will be shared with the expert in their application detail.</span>
          </p>
        </div>
      }
    />
  );
}
