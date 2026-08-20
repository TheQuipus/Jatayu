"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, X } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import styles from "./ConfirmModal.module.css";

export type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  icon?: React.ReactNode;
  className?: string;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Yes",
  cancelText = "No",
  variant = "default",
  icon,
  className = "",
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const defaultIcon =
    variant === "danger" ? (
      <AlertTriangle size={36} className={styles.iconDanger} />
    ) : variant === "warning" ? (
      <AlertTriangle size={36} className={styles.iconWarning} />
    ) : (
      <HelpCircle size={24} className={styles.iconDefault} />
    );

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${styles.modalContainer} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalHeaderTitle}>{title}</span>
          {/* <span className={styles.modalHeaderDots} /> */}
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={25} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.iconWrapper}>
            {icon || defaultIcon}
          </div>

          <div className={styles.messageText}>{message}</div>

          <div className={styles.modalActions}>
            <SecondaryCTA
              label={cancelText}
              showArrow={false}
              onClick={onClose}
              className={styles.cancelBtn}
            />
            <ContinueButton
              label={confirmText}
              showArrow={false}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`${styles.confirmBtn} ${variant === "danger"
                ? styles.confirmDanger
                : variant === "warning"
                  ? styles.confirmWarning
                  : ""
                }`}
            />
          </div>
        </div>
        <div className={styles.modalFooter} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
