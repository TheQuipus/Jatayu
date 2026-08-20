"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CalendarDays,
  Clock,
  Video,
  CalendarClock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { type ClientRequest, formatRequestPrice } from "@/lib/expertRequests";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./RescheduleRequestModal.module.css";

function getAvailable48hSlots() {
  const date1 = new Date();
  date1.setDate(date1.getDate() + 1);

  const date2 = new Date();
  date2.setDate(date2.getDate() + 2);

  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

  const d1 = formatShort(date1);
  const d2 = formatShort(date2);

  return [
    { id: "slot-1", label: `${d1}, 10:00 AM` },
    { id: "slot-2", label: `${d1}, 02:30 PM` },
    { id: "slot-3", label: `${d2}, 11:00 AM` },
    { id: "slot-4", label: `${d2}, 04:00 PM` },
  ];
}

interface RescheduleRequestModalProps {
  request: ClientRequest;
  onClose: () => void;
  onConfirmReschedule?: (requestId: string, slotLabel: string, note: string) => void;
}

export default function RescheduleRequestModal({
  request,
  onClose,
  onConfirmReschedule,
}: RescheduleRequestModalProps) {
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
      setError("Please select an available 48-hour time slot to propose.");
      return;
    }
    setError("");

    const slots = getAvailable48hSlots();
    const chosenSlot = slots.find((s) => s.id === selectedSlot)?.label || selectedSlot;

    if (onConfirmReschedule) {
      onConfirmReschedule(request.id, chosenSlot, customNote);
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
            <span className={styles.modalHeaderTitle}>RESCHEDULE REQUEST</span>
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
                  Reschedule Proposal Sent!
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--dove-gray)" }}>
                  We have notified <strong>{request.clientName}</strong> of your proposed alternative slot.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.iconWrapper}>
                  <CalendarClock size={24} />
                </div>

                <p className={styles.modalIntroText}>
                  Propose alternative time slot for <strong>{request.clientName}</strong>
                </p>

                {/* Summary Box */}
                <div className={styles.modalSummaryBox}>
                  <h4 className={styles.summaryTitle}>
                    <span className={styles.summaryPrefix}>Subject: </span>
                    {request.title}
                  </h4>
                  <p className={styles.summaryDescription}>
                    <span className={styles.summaryPrefix}>Seeking advice on: </span>
                    {request.description}
                  </p>
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

                {/* Reschedule Notice Box */}
                <div className={styles.rescheduleNotice}>
                  <Sparkles size={16} className={styles.noticeIcon} />
                  <p>
                    Rescheduling allows you to propose an alternative time slot within the next 48 hours without degrading your profile rating.
                  </p>
                </div>

                {/* 48h Available Slots Selection */}
                <div className={styles.slotsSection}>
                  <span className={styles.sectionTitle}>
                    <Clock size={15} />
                    Next 48 Hours Available Slots
                  </span>
                  <p className={styles.slotsSubtitle}>
                    Select a convenient slot to propose to {request.clientName}:
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
                        <Clock size={12} />
                        <span>{slot.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note Input */}
                <div className={styles.customMessageGroup}>
                  <label className={styles.formLabel}>Note to Client (Optional)</label>
                  <textarea
                    className={styles.notesInput}
                    placeholder="e.g. Please let me know if this proposed slot works for you..."
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
                CANCEL
              </button>
              <ContinueButton label="PROPOSE RESCHEDULE" />
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
