"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import styles from "./ApplicationReview.module.css";

interface SectionApproveConfirmModalProps {
  sectionTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SectionApproveConfirmModal({
  sectionTitle,
  onCancel,
  onConfirm,
}: SectionApproveConfirmModalProps) {
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
      <div className={styles.modalCard} style={{ maxWidth: "400px" }}>
        <div className={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className={`${styles.confirmIconWrap} ${styles.confirmIconApprove}`} style={{ width: "32px", height: "32px" }}>
              <CheckCircle2 size={18} />
            </div>
            <h2 className={styles.modalTitle}>Approve Section</h2>
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
          Are you sure you want to approve the <strong>{sectionTitle}</strong> section?
        </p>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalCancelBtn}
            onClick={onCancel}
          >
            No
          </button>
          <button
            type="button"
            className={`${styles.modalConfirmBtn} ${styles.modalBtnApprove}`}
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>,
    window.document.body
  );
}
