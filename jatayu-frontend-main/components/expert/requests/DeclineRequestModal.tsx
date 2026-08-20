"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, XCircle, AlertTriangle } from "lucide-react";
import { type ClientRequest } from "@/lib/expertRequests";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import styles from "./DeclineRequestModal.module.css";

const DECLINE_REASONS = [
  "Not Available",
  "Outside Expertise",
  "Out of Scope",
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
  const [mounted, setMounted] = useState<boolean>(false);
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

  const handleSubmitDecline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError("Please select a reason for declining.");
      return;
    }
    if (!customNotes.trim()) {
      setError("Please enter a note for the client.");
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
        {/* Header */}
        <div className={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <XCircle size={18} />
            <span className={styles.modalHeaderTitle}>DECLINE REQUEST</span>
          </div>
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
        <form className={styles.modalForm} onSubmit={handleSubmitDecline}>
          <div className={styles.modalBody}>
            <div className={styles.iconWrapper}>
              <XCircle size={26} />
            </div>

            <p className={styles.modalIntroText}>
              Decline request from <strong>{request.clientName}</strong>
            </p>

            {/* Warning Notice Box */}
            <div className={styles.modalWarningNotice}>
              <AlertTriangle size={16} className={styles.warningIcon} />
              <p>
                Declining requests will degrade your profile rating. We strongly suggest to reschedule the session instead.
              </p>
            </div>

            {/* Reasons Selection */}
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
                      className={`${styles.reasonRadioCard} ${
                        isSelected ? styles.reasonRadioCardActive : ""
                      }`}
                      onClick={() => handleToggleReason(reason)}
                    >
                      <span>{reason}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Note <span className={styles.requiredStar}>*</span>
              </label>
              <textarea
                className={styles.formTextarea}
                placeholder="Share your note for the client..."
                rows={2}
                value={customNotes}
                onChange={(e) => {
                  setCustomNotes(e.target.value);
                  setError("");
                }}
                required
              />
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            {/* Action buttons */}
            <div className={styles.modalActions}>
              <SecondaryCTA
                type="button"
                label="CANCEL"
                showArrow={false}
                onClick={onClose}
                className={styles.cancelBtn}
              />
              <ContinueButton
                type="submit"
                label="CONFIRM & DECLINE"
                showArrow={false}
                className={styles.confirmBtn}
              />
            </div>
          </div>

          <div className={styles.modalFooter} aria-hidden="true" />
        </form>
      </div>
    </div>,
    document.body
  );
}
