"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X, CalendarDays, Clock, Video, AlertCircle } from "lucide-react";
import { type ClientRequest, formatRequestPrice } from "@/lib/expertRequests";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./AcceptRequestModal.module.css";

interface AcceptRequestModalProps {
  request: ClientRequest;
  onClose: () => void;
  onConfirm: (requestId: string) => void;
}

export default function AcceptRequestModal({
  request,
  onClose,
  onConfirm,
}: AcceptRequestModalProps) {
  const [mounted, setMounted] = useState(false);

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
          <span className={styles.modalHeaderTitle}>ACCEPT REQUEST</span>
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

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.iconWrapper}>
            <CheckCircle2 size={26} />
          </div>

          <p className={styles.modalIntroText}>
            Are you sure you want to accept this request?
          </p>

          <div className={styles.modalSummaryBox}>
            <span className={styles.clientNameLabel}>
              Client: <strong>{request.clientName}</strong>
            </span>
            <h4 className={styles.summaryTitle}>{request.title}</h4>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <CalendarDays size={14} />
                <span>{request.dateLabel}</span>
              </div>
              <div className={styles.summaryItem}>
                <Clock size={14} />
                <span>{request.durationLabel}</span>
              </div>
              <div className={styles.summaryItem}>
                <Video size={14} />
                <span>{request.formatLabel}</span>
              </div>
            </div>
            <div className={styles.summaryPriceRow}>
              <span>Total Session Payout</span>
              <strong>{formatRequestPrice(request.price)}</strong>
            </div>
          </div>

          <div className={styles.modalNoticeBox}>
            <AlertCircle size={16} className={styles.noticeIcon} />
            <p>
              By accepting this request, you commit to hosting this session at the scheduled time. Escrow funds will be held securely until completion.
            </p>
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
              type="button"
              label="CONFIRM & ACCEPT"
              onClick={() => onConfirm(request.id)}
              className={styles.confirmBtn}
            />
          </div>
        </div>

        {/* Footer matching ConfirmModal style */}
        <div className={styles.modalFooter} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
