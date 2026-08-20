"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import styles from "./ApplicationReview.module.css";

interface HoldConfirmModalProps {
  name: string;
  appId: string;
  clarificationSections: { sectionTitle: string; note: string; decision?: string | null }[];
  onCancel: () => void;
  onConfirm: (notes: string) => void;
}

export default function HoldConfirmModal({
  name,
  appId,
  clarificationSections,
  onCancel,
  onConfirm,
}: HoldConfirmModalProps) {
  const [notes, setNotes] = useState("");

  const hasIssues = clarificationSections.length > 0;
  const isValid = hasIssues ? true : notes.trim().length > 0;

  const handleConfirmAction = () => {
    if (!isValid) return;
    if (hasIssues) {
      const compiled = clarificationSections
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
      title="Place Application on Hold"
      confirmText="Place on Hold"
      cancelText="Cancel"
      variant="warning"
      icon={<AlertCircle size={32} style={{ color: "#f59e0b" }} />}
      message={
        <div>
          <p style={{ margin: "0 0 12px 0" }}>
            You are placing the application for <strong>{name}</strong> ({appId}) on hold.
          </p>

          <div className={styles.modalFormGroup}>
            <label className={styles.modalFormLabel}>Issues Identified from Section Reviews</label>
            {clarificationSections.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--seashell)", padding: "12px", borderRadius: "8px", border: "1px solid var(--mercury)" }}>
                {clarificationSections.map((item) => {
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
              <label className={styles.modalFormLabel}>Explain why you are placing this application on hold</label>
              <textarea
                className={styles.modalTextarea}
                placeholder="Provide a reason for putting the application on hold..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>
          )}
        </div>
      }
    />
  );
}
