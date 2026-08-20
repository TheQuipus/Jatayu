"use client";

import { CheckCircle2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  return (
    <ConfirmModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Approve Section"
      message={
        <span>
          Are you sure you want to approve the <strong>{sectionTitle}</strong> section?
        </span>
      }
      confirmText="Yes"
      cancelText="No"
      variant="default"
      icon={<CheckCircle2 size={32} style={{ color: "#10b981" }} />}
    />
  );
}
