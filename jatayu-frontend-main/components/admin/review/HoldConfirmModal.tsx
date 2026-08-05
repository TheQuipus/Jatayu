"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasIssues = clarificationSections.length > 0;
  const isValid = hasIssues ? true : notes.trim().length > 0;

  if (!mounted) return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className={styles.modalCard} style={{ maxWidth: "480px" }}>
        <div className={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className={`${styles.confirmIconWrap} ${styles.confirmIconClarification}`} style={{ width: "32px", height: "32px", background: "rgba(245, 158, 11, 0.12)", color: "#b45309" }}>
              <AlertCircle size={18} />
            </div>
            <h2 className={styles.modalTitle}>Place Application on Hold</h2>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onCancel}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <p className={styles.modalText} style={{ marginTop: "12px" }}>
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
          <div className={styles.modalFormGroup}>
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

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalCancelBtn}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.modalConfirmBtn} ${styles.modalBtnClarification}`}
            disabled={!isValid}
            onClick={() => {
              if (hasIssues) {
                // Combine reasons from sections
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
            }}
          >
            Place on Hold
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
