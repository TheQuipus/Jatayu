"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XCircle, X } from "lucide-react";
import { type ClientRequest } from "@/lib/expertRequests";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./DeclineRequestModal.module.css";

const DECLINE_REASONS = [
  "Scheduling Conflict / Not Available",
  "Out of Scope / Outside Expertise",
  "Budget / Fee Mismatch",
  "Short Notice / Insufficient Lead Time",
  "Other Reason",
];

interface DeclineRequestModalProps {
  request: ClientRequest;
  onClose: () => void;
  onConfirm: (requestId: string, reason: string, notes: string) => void;
}

export default function DeclineRequestModal({
  request,
  onClose,
  onConfirm,
}: DeclineRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  const handleToggleReason = (reason: string) => {
    setSelectedReason((prev) => (prev === reason ? "" : reason));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError("Please select a reason for declining this request.");
      return;
    }
    setError("");
    onConfirm(request.id, selectedReason, customNotes);
  };

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalContainer}>
        {/* Header matching ConfirmModal style */}
        <div className={styles.modalHeader}>
          <span className={styles.modalHeaderTitle}>DECLINE REQUEST</span>
          <span className={styles.modalHeaderDots} />
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={25} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.iconWrapper}>
              <XCircle size={26} />
            </div>

            <p className={styles.modalIntroText}>
              Are you sure you want to decline <strong>"{request.title}"</strong>?
              <span className={styles.clientNameSpan}>
                Client: <strong>{request.clientName}</strong>
              </span>
            </p>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Reason for declining <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.reasonsRadioList}>
                {DECLINE_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      className={`${styles.reasonRadioCard} ${isSelected ? styles.reasonRadioCardActive : ""}`}
                      onClick={() => handleToggleReason(reason)}
                    >
                      <span>{reason}</span>
                    </button>
                  );
                })}
              </div>
              {error && <p className={styles.formErrorText}>{error}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Additional notes for client <span className={styles.optionalText}>(optional)</span>
              </label>
              <textarea
                className={styles.formTextarea}
                placeholder="Share any additional details or suggest an alternative..."
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            </div>

            {/* Action buttons */}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <ContinueButton
                type="submit"
                label="DECLINE"
                disabled={!selectedReason}
                className={styles.confirmBtn}
              />
            </div>
          </div>
        </form>

        {/* Footer matching ConfirmModal style */}
        <div className={styles.modalFooter} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
