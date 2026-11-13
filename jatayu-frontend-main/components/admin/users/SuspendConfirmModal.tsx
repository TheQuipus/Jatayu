"use client";

import { AlertTriangle, Ban } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import styles from "@/components/admin/review/ApplicationReview.module.css";

interface SuspendConfirmModalProps {
  name: string;
  appId?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SuspendConfirmModal({
  name,
  appId,
  onCancel,
  onConfirm,
}: SuspendConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="SUSPEND EXPERT ACCOUNT"
      confirmText="YES, SUSPEND"
      cancelText="CANCEL"
      variant="danger"
      icon={<AlertTriangle size={36} style={{ color: "#ef4444" }} />}
      message={
        <div>
          <p style={{ margin: "0 0 14px 0", fontSize: "14px", lineHeight: "1.5", color: "var(--foreground, #1e293b)" }}>
            You are suspending the expert profile for <strong>{name}</strong>
            {appId ? ` (${appId})` : ""}. This profile will be suspended from accessing any services as an expert.
          </p>

          <div className={styles.modalBlacklistOption} style={{ cursor: "default" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Ban size={18} style={{ color: "#ef4444", marginTop: "2px", flexShrink: 0 }} />
              <div className={styles.modalBlacklistContent}>
                <span className={styles.modalBlacklistTitle}>Immediate Access Revocation</span>
                <span className={styles.modalBlacklistSubtext}>
                  Immediately terminates all active sessions, revokes authentication tokens, and blocks this expert from logging in or registering with these credentials until reactivated.
                </span>
              </div>
            </div>
          </div>

          <p
            style={{
              marginTop: "16px",
              margin: "16px 0 0 0",
              fontSize: "12px",
              color: "var(--scorpion, #64748b)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ color: "#E53B17" }}>ℹ</span>
            <span>Note: This action takes effect immediately. You can reactivate this profile at any time from User Management.</span>
          </p>
        </div>
      }
    />
  );
}

