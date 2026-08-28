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
  onConfirm: (notes: string) => void;
}

export default function RejectConfirmModal({
  name,
  appId,
  rejectedSections,
  onCancel,
  onConfirm,
}: RejectConfirmModalProps) {
  const [notes, setNotes] = useState("");

  const hasIssues = rejectedSections.length > 0;
  const isValid = hasIssues ? true : notes.trim().length > 0;

  const handleConfirmAction = () => {
    if (!isValid) return;
    if (hasIssues) {
      const compiled = rejectedSections
        .map((item) => {
          const statusLabel = item.decision === "reject" ? "Rejected" : "Needs Clarification";
          return `[${item.sectionTitle} - ${statusLabel}]: ${item.note || "No feedback notes entered"}`;
        })
        .join("; ");
      onConfirm(compiled);
    } else {
      onConfirm(notes.trim());
    }
  };

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={handleConfirmAction}
      title="Reject Application"
      confirmText="Confirm Rejection"
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
                placeholder="Provide a reason for rejecting the application..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>
          )}

          <p style={{ marginTop: "16px", margin: "16px 0 0 0", fontSize: "12px", color: "var(--scorpion)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#E53B17" }}>ℹ</span>
            <span>Note: These details will be shared with the expert in their application detail.</span>
          </p>
        </div>
      }
    />
  );
}
