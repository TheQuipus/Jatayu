"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, X } from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import modalStyles from "@/components/ui/ConfirmModal.module.css";

type AdminIdleWarningModalProps = {
  isOpen: boolean;
  remainingSeconds: number;
  idleTimeoutMinutes: number;
  isExtending: boolean;
  onStaySignedIn: () => void;
  onLogoutNow: () => void;
};

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function AdminIdleWarningModal({
  isOpen,
  remainingSeconds,
  idleTimeoutMinutes,
  isExtending,
  onStaySignedIn,
  onLogoutNow,
}: AdminIdleWarningModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onStaySignedIn();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onStaySignedIn]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={modalStyles.backdrop}
      onClick={onStaySignedIn}
      aria-modal="true"
      role="dialog"
      aria-labelledby="admin-idle-modal-title"
    >
      <div
        className={modalStyles.modalContainer}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <span id="admin-idle-modal-title" className={modalStyles.modalHeaderTitle}>
            Session Expiring Soon
          </span>
          <button
            type="button"
            onClick={onStaySignedIn}
            className={modalStyles.closeBtn}
            aria-label="Stay signed in and close modal"
            disabled={isExtending}
          >
            <X size={25} />
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={modalStyles.iconWrapper}>
            <Clock size={34} style={{ color: "var(--pomegranate)" }} />
          </div>

          <div className={modalStyles.messageText}>
            <p style={{ margin: "0 0 12px 0" }}>
              You have been inactive. For security, your admin session will automatically sign out after{" "}
              <strong>{idleTimeoutMinutes} min</strong> of inactivity.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 18px",
                background: "var(--seashell)",
                border: "1px solid var(--mercury)",
                fontFamily: "var(--font-mono)",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--pomegranate)",
                letterSpacing: "0.06em",
              }}
              aria-live="polite"
            >
              {formatCountdown(remainingSeconds)}
            </div>
            <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "var(--dove-gray)" }}>
              Click <strong>Stay Signed In</strong> to continue working, or log out now.
            </p>
          </div>

          <div className={modalStyles.modalActions}>
            <SecondaryCTA
              label="Log Out Now"
              showArrow={false}
              onClick={onLogoutNow}
              className={modalStyles.cancelBtn}
            />
            <ContinueButton
              label={isExtending ? "Extending..." : "Stay Signed In"}
              showArrow={false}
              disabled={isExtending}
              onClick={onStaySignedIn}
              className={`${modalStyles.confirmBtn} ${modalStyles.confirmWarning}`}
            />
          </div>
        </div>
        <div className={modalStyles.modalFooter} aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
