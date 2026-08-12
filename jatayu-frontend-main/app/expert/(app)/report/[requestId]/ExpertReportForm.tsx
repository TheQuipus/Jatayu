"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import type { RequestDetailModel } from "@/lib/expertRequestDetailStore";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./page.module.css";

type ExpertReportFormProps = {
  request: RequestDetailModel;
  onClose?: () => void;
};

export default function ExpertReportForm({ request, onClose }: ExpertReportFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/expert/requests");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
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

  const reasons = [
    "Harassment / Abusive behavior",
    "Spam / Unsolicited marketing",
    "Off-platform payment attempt",
    "Inappropriate content or requests",
    "Fraud / Misrepresentation",
    "Safety concern",
    "Privacy violation",
    "No-show / Abandoned session",
  ];

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReasons.length === 0 || !description.trim()) return;

    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1000);
  };

  const modalContent = (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.container}>
        {isSuccess ? (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={48} className={styles.successCheck} />
            </div>
            <h2 className={styles.successTitle}>Report Submitted</h2>
            <p className={styles.successText}>
              Thank you for bringing this to our attention. We have received your report regarding client <strong>{request.client.name}</strong>.
            </p>
            <p className={styles.successSubtitle}>
              Our trust & safety team will review the session log and details within 24 hours. Escrow funds remain secure during investigation.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className={styles.backHomeBtn}
            >
              Close Modal
            </button>
          </div>
        ) : (
          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <span className={styles.reportHeaderTitle}>Report Client</span>
              <span className={styles.reportHeaderDots} />
              <div className={styles.soundwaveIcon} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Close modal"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.reportForm}>
              <div className={styles.clientBrief}>
                <div className={styles.avatarWrap}>
                  <Image
                    src={request.client.avatar}
                    alt={request.client.name}
                    fill
                    className={styles.avatarImg}
                    sizes="64px"
                  />
                </div>
                <div className={styles.clientBriefInfo}>
                  <h3 className={styles.clientName}>{request.client.name}</h3>
                  <p className={styles.specialty}>{request.title} &bull; {request.sessionDetails.duration}</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <span className={styles.sectionLabel}>Select Reason for Report *</span>
                <div className={styles.reasonsGrid}>
                  {reasons.map((reason) => {
                    const isChecked = selectedReasons.includes(reason);
                    return (
                      <label key={reason} className={styles.reasonLabel}>
                        <input
                          type="checkbox"
                          name="report_reason"
                          value={reason}
                          checked={isChecked}
                          onChange={() => handleToggleReason(reason)}
                          className={styles.reasonCheckbox}
                        />
                        <span>{reason}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="report_details" className={styles.sectionLabel}>
                  Provide detailed explanation *
                </label>
                <textarea
                  id="report_details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please explain the issue in detail, including specific behavior, statements, or requests made by the client during the session..."
                  className={styles.detailsArea}
                  required
                />
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <ContinueButton
                  label={isSubmitting ? "Submitting..." : "Submit Report"}
                  type="submit"
                  disabled={selectedReasons.length === 0 || !description.trim() || isSubmitting}
                  className={styles.submitBtn}
                />
              </div>
            </form>

            <div className={styles.reportFooter} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
