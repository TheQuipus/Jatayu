"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import styles from "./ApplicationReview.module.css";

interface ApproveConfirmModalProps {
  name: string;
  appId: string;
  unapprovedSections: string[];
  onCancel: () => void;
  onConfirm: (notes: string) => void;
}

export default function ApproveConfirmModal({
  name,
  appId,
  unapprovedSections,
  onCancel,
  onConfirm,
}: ApproveConfirmModalProps) {
  const [checkedProceed, setCheckedProceed] = useState(unapprovedSections.length === 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            <div className={`${styles.confirmIconWrap} ${styles.confirmIconApprove}`} style={{ width: "32px", height: "32px" }}>
              <CheckCircle2 size={18} />
            </div>
            <h2 className={styles.modalTitle}>Approve Expert Profile</h2>
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
          You are about to activate the expert account for <strong>{name}</strong> ({appId}).
        </p>

        {unapprovedSections.length > 0 ? (
          <div className={styles.confirmWarningText} style={{ borderLeft: "none", background: "transparent", padding: 0 }}>
            <div style={{ display: "flex", gap: "8px", color: "var(--ink)", fontWeight: 600, marginBottom: "6px" }}>
              <CheckCircle2 size={16} style={{ color: "#10b981" }} />
              <span>Attention: Unapproved Sections Remain</span>
            </div>
            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--scorpion)" }}>
              The following sections have not been marked as approved:
            </p>
            <ul style={{ margin: "0 0 0 20px", padding: 0, fontSize: "12px", color: "var(--scorpion)", listStyleType: "disc" }}>
              {unapprovedSections.map((sec) => (
                <li key={sec} style={{ marginBottom: "2px" }}>{sec}</li>
              ))}
            </ul>
            <label className={styles.modalCheckItem} style={{ marginTop: "12px" }}>
              <input
                type="checkbox"
                checked={checkedProceed}
                onChange={(e) => setCheckedProceed(e.target.checked)}
              />
              <span style={{ fontWeight: 600, color: "var(--scorpion)" }}>I want to approve despite these unapproved sections</span>
            </label>
          </div>
        ) : (
          <div className={styles.confirmWarningText} style={{ borderLeftColor: "#10b981", background: "rgba(16, 185, 129, 0.05)", color: "#047857" }}>
            <div style={{ display: "flex", gap: "8px", fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>All 7 sections verified & approved successfully.</span>
            </div>
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
            className={`${styles.modalConfirmBtn} ${styles.modalBtnApprove}`}
            disabled={!checkedProceed}
            onClick={() => onConfirm("")}
          >
            Confirm Approval
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
