"use client";

import { useState } from "react";
import Image from "next/image";
import { ADMIN_PROFILE } from "@/lib/adminDashboard";
import ContinueButton from "@/components/ui/ContinueButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import styles from "./ApplicationReview.module.css";

export type SectionDecision = "approve" | "reject" | "clarification" | null;

export type SectionNote = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  text: string;
};

export type SectionReviewState = {
  decision: SectionDecision;
  note: string;
  notes?: SectionNote[];
};

interface SectionDecisionControlProps {
  sectionId: string;
  sectionTitle: string;
  state: SectionReviewState;
  onChange: (nextState: SectionReviewState) => void;
  onNextSection?: () => void;
  disabled?: boolean;
}

export default function SectionDecisionControl({
  sectionId,
  sectionTitle,
  state,
  onChange,
  onNextSection,
  disabled = false,
}: SectionDecisionControlProps) {
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [modalDecision, setModalDecision] = useState<"clarification" | "reject" | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  const currentDecision = state?.decision || null;

  const openReasonModal = (target: "clarification" | "reject") => {
    if (disabled) return;
    setModalDecision(target);
    setReasonInput(state?.note || "");
    setReasonModalOpen(true);
  };

  const handleSelectClick = (target: "approve" | "reject" | "clarification") => {
    if (disabled) return;

    if (currentDecision === target) {
      // Toggle off if already selected
      onChange({
        decision: null,
        note: "",
        notes: state?.notes,
      });
      return;
    }

    if (target === "approve") {
      onChange({
        decision: "approve",
        note: "",
        notes: state?.notes,
      });
      return;
    }

    openReasonModal(target);
  };

  const handleConfirmReasonModal = () => {
    if (!modalDecision) return;
    const trimmed = reasonInput.trim();

    let updatedNotes = state?.notes || [];
    if (trimmed) {
      const newNote: SectionNote = {
        id: `sn-${Date.now()}`,
        author: ADMIN_PROFILE.name,
        avatar: ADMIN_PROFILE.avatar,
        timestamp: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        text: trimmed,
      };
      updatedNotes = [...updatedNotes, newNote];
    }

    onChange({
      decision: modalDecision,
      note: trimmed,
      notes: updatedNotes,
    });

    setReasonModalOpen(false);
    setModalDecision(null);
    setReasonInput("");

    if (onNextSection) {
      onNextSection();
    }
  };

  const handleSubmitContinueClick = () => {
    if (disabled || !currentDecision) return;

    if (currentDecision === "clarification" || currentDecision === "reject") {
      openReasonModal(currentDecision);
      return;
    }

    if (onNextSection) {
      onNextSection();
    }
  };

  return (
    <div className={styles.sectionDecisionBoxCenter}>
      <div
        className={styles.sectionRadioGroup}
        role="radiogroup"
        aria-label={`${sectionTitle} decision`}
        style={disabled ? { pointerEvents: "none", opacity: 0.65 } : undefined}
      >
        <label
          className={`${styles.radioLabel} ${
            currentDecision === "approve" ? styles.radioLabelActiveApprove : ""
          }`}
        >
          <input
            type="radio"
            name={`decision-${sectionId}`}
            value="approve"
            checked={currentDecision === "approve"}
            onClick={() => handleSelectClick("approve")}
            onChange={() => handleSelectClick("approve")}
            disabled={disabled}
          />
          <span>Approve</span>
        </label>

        <label
          className={`${styles.radioLabel} ${
            currentDecision === "clarification"
              ? styles.radioLabelActiveClarification
              : ""
          }`}
        >
          <input
            type="radio"
            name={`decision-${sectionId}`}
            value="clarification"
            checked={currentDecision === "clarification"}
            onClick={() => handleSelectClick("clarification")}
            onChange={() => handleSelectClick("clarification")}
            disabled={disabled}
          />
          <span>Need Clarification</span>
        </label>

        <label
          className={`${styles.radioLabel} ${
            currentDecision === "reject" ? styles.radioLabelActiveReject : ""
          }`}
        >
          <input
            type="radio"
            name={`decision-${sectionId}`}
            value="reject"
            checked={currentDecision === "reject"}
            onClick={() => handleSelectClick("reject")}
            onChange={() => handleSelectClick("reject")}
            disabled={disabled}
          />
          <span>Reject</span>
        </label>
      </div>

      {state.notes && state.notes.length > 0 && (
        <div className={styles.sectionNoteBoxContent} style={{ width: "100%" }}>
          <div className={styles.sectionNotesList}>
            {state.notes.map((note) => (
              <div key={note.id} className={styles.sectionNoteItem}>
                <Image
                  src={note.avatar}
                  alt=""
                  width={24}
                  height={24}
                  className={styles.sectionNoteAvatar}
                />
                <div className={styles.sectionNoteBody}>
                  <span className={styles.sectionNoteAuthor}>
                    {note.author}
                    <span className={styles.sectionNoteTime}>{note.timestamp}</span>
                  </span>
                  <p className={styles.sectionNoteText}>{note.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.submitContinueWrapper}>
        <ContinueButton
          label="Submit & Continue"
          onClick={handleSubmitContinueClick}
          disabled={disabled || !currentDecision}
        />
      </div>

      {/* Pop-up Reason Modal for Need Clarification / Reject */}
      <ConfirmModal
        isOpen={reasonModalOpen}
        onClose={() => {
          setReasonModalOpen(false);
          setModalDecision(null);
        }}
        onConfirm={handleConfirmReasonModal}
        title={
          modalDecision === "reject"
            ? `REJECT REASON: ${sectionTitle}`
            : `CLARIFICATION DETAILS: ${sectionTitle}`
        }
        variant={modalDecision === "reject" ? "danger" : "warning"}
        confirmText="Submit & Continue"
        cancelText="Cancel"
        message={
          <div style={{ width: "100%", textTransform: "none", textAlign: "left" }}>
            <p style={{ marginBottom: "12px", fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>
              {modalDecision === "reject"
                ? `Please state the reason for rejecting ${sectionTitle}:`
                : `Please specify what details are required for clarification on ${sectionTitle}:`}
            </p>
            <textarea
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--mercury)",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                color: "var(--ink)",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder={
                modalDecision === "reject"
                  ? "Add reason for rejection..."
                  : "Add details for clarification..."
              }
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              autoFocus
            />
          </div>
        }
      />
    </div>
  );
}


