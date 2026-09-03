"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  CalendarDays,
  Clock,
  Video,
  CalendarClock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { BookingDetail } from "@/lib/seekerDashboard";
import { getAvailable48hSlots } from "@/lib/rescheduleSlots";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./SeekerRescheduleModal.module.css";

interface SeekerRescheduleModalProps {
  booking: BookingDetail;
  onClose: () => void;
  onConfirmReschedule?: (bookingId: string, slotLabel: string, note: string) => void;
}

export default function SeekerRescheduleModal({
  booking,
  onClose,
  onConfirmReschedule,
}: SeekerRescheduleModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

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

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot((prev) => (prev === slotId ? "" : slotId));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select an available 48-hour time slot for your expert.");
      return;
    }
    setError("");

    const slots = getAvailable48hSlots();
    const chosenSlot = slots.find((s) => s.id === selectedSlot)?.label || selectedSlot;

    if (onConfirmReschedule) {
      onConfirmReschedule(booking.id, chosenSlot, customNote);
    }

    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1400);
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
            <CalendarClock size={18} />
            <span className={styles.modalHeaderTitle}>RESCHEDULE CONSULTATION</span>
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
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {isSuccess ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <CheckCircle2 size={46} style={{ color: "var(--green)", marginBottom: "12px" }} />
                <h4 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: "19px" }}>
                  Reschedule Request Sent!
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--dove-gray)" }}>
                  We have notified <strong>{booking.expert.name}</strong> of your requested new session time.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.iconWrapper}>
                  <CalendarClock size={24} />
                </div>

                <p className={styles.modalIntroText}>
                  Choose from <strong>{booking.expert.name}&apos;s</strong> available slots in the next 48 hours.
                </p>

                {/* Summary Box */}
                <div className={styles.modalSummaryBox}>
                  <div className={styles.expertInfoRow}>
                    <div className={styles.expertAvatarWrap}>
                      <Image
                        src={booking.expert.image || "/assets/img/avatar1.png"}
                        alt={booking.expert.name}
                        fill
                        className="object-cover"
                        sizes="42px"
                      />
                    </div>
                    <div className={styles.expertMeta}>
                      <h4 className={styles.expertName}>{booking.expert.name}</h4>
                      <p className={styles.expertRole}>{booking.expert.role} • {booking.consultationLabel}</p>
                    </div>
                  </div>

                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <CalendarDays size={14} />
                      <span>Current: {booking.scheduledDateLabel}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <Clock size={14} />
                      <span>{booking.scheduledTimeLabel} ({booking.durationLabel})</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <Video size={14} />
                      <span>{booking.consultationLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Reschedule Notice Box */}
                <div className={styles.rescheduleNotice}>
                  <Sparkles size={16} className={styles.noticeIcon} />
                  <p>
                    Free reschedule up to 24 hours before session. Choose any verified available slot within the next 48 hours.
                  </p>
                </div>

                {/* 48h Available Slots Selection */}
                <div className={styles.slotsSection}>
                  <span className={styles.sectionTitle}>
                    <Clock size={15} />
                    Available 48-Hour Slots
                  </span>
                  <p className={styles.slotsSubtitle}>
                    Select an alternative slot that fits your schedule:
                  </p>
                  <div className={styles.slotsGrid}>
                    {getAvailable48hSlots().map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className={`${styles.slotChip} ${
                          selectedSlot === slot.id ? styles.slotChipSelected : ""
                        }`}
                        onClick={() => handleSelectSlot(slot.id)}
                      >
                        <span className={styles.slotDay}>{slot.dayLabel}</span>
                        <span className={styles.slotTime}>
                          <Clock size={11} />
                          {slot.timeLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note Input */}
                <div className={styles.customMessageGroup}>
                  <label className={styles.formLabel}>Message for {booking.expert.name} (Optional)</label>
                  <textarea
                    className={styles.notesInput}
                    placeholder="Let the expert know why you are moving the time..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                  />
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}
              </>
            )}
          </div>

          {!isSuccess && (
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                KEEP CURRENT TIME
              </button>
              <ContinueButton label="CONFIRM RESCHEDULE" />
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
