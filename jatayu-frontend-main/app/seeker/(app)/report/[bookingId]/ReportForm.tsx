"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { BookingDetail } from "@/lib/seekerDashboard";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./page.module.css";

type ReportFormProps = {
  booking: BookingDetail;
};

export default function ReportForm({ booking }: ReportFormProps) {
  const router = useRouter();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasons = [
    "Harassment",
    "Spam",
    "Off-platform payment request",
    "Inappropriate question",
    "Fake credentials",
    "Dangerous advice",
    "Hate/abuse",
    "Fraud",
    "Privacy violation",
    "Review abuse",
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

  if (isSuccess) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <CheckCircle2 size={48} className={styles.successCheck} />
        </div>
        <h2 className={styles.successTitle}>Report Submitted</h2>
        <p className={styles.successText}>
          Thank you for bringing this to our attention. We have received your report regarding <strong>{booking.expert.name}</strong>.
        </p>
        <p className={styles.successSubtitle}>
          Our moderation team will review the session transcripts and details within 24 hours. If necessary, we will contact you via email.
        </p>
        <button
          type="button"
          onClick={() => router.push("/seeker/dashboard")}
          className={styles.backHomeBtn}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.reportCard}>
        <div className={styles.reportHeader}>
          <span className={styles.reportHeaderTitle}>Report Expert</span>
          <span className={styles.reportHeaderDots} />
          <div className={styles.soundwaveIcon} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <div className={styles.expertBrief}>
            <div className={styles.avatarWrap}>
              <Image
                src={booking.expert.image}
                alt={booking.expert.name}
                fill
                className={styles.avatarImg}
                sizes="64px"
              />
            </div>
            <div className={styles.expertBriefInfo}>
              <h3 className={styles.expertName}>{booking.expert.name}</h3>
              <p className={styles.specialty}>{booking.specialty} &bull; {booking.consultationLabel}</p>
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
              placeholder="Please explain the issue in detail, including specific questions asked, behavior, or requests made by the expert..."
              className={styles.detailsArea}
              required
            />
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={() => router.back()}
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
    </div>
  );
}
