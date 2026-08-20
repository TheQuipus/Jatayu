"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
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

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={() => {
        if (checkedProceed) onConfirm("");
      }}
      title="Approve Expert Profile"
      confirmText="Confirm Approval"
      cancelText="Cancel"
      variant="default"
      icon={<CheckCircle2 size={32} style={{ color: "#10b981" }} />}
      message={
        <div>
          <p style={{ margin: "0 0 12px 0" }}>
            You are about to activate the expert account for <strong>{name}</strong> ({appId}).
          </p>

          {unapprovedSections.length > 0 ? (
            <div style={{ background: "transparent", padding: 0 }}>
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
              <label className={styles.modalCheckItem} style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={checkedProceed}
                  onChange={(e) => setCheckedProceed(e.target.checked)}
                />
                <span style={{ fontWeight: 600, color: "var(--scorpion)", fontSize: "12px" }}>I want to approve despite these unapproved sections</span>
              </label>
            </div>
          ) : (
            <div style={{ borderLeft: "3px solid #10b981", background: "rgba(16, 185, 129, 0.05)", padding: "10px", borderRadius: "6px", color: "#047857", fontSize: "12px" }}>
              <div style={{ display: "flex", gap: "8px", fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>All 7 sections verified & approved successfully.</span>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
