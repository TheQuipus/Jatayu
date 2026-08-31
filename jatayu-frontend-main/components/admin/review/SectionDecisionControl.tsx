"use client";

import Image from "next/image";
import { ADMIN_PROFILE } from "@/lib/adminDashboard";
import ContinueButton from "@/components/ui/ContinueButton";
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
  submittedDecision?: SectionDecision;
  onChange: (nextState: SectionReviewState) => void;
  onNextSection?: () => void;
  onSubmitDecision?: (sectionId: string, decision: SectionDecision, updatedState?: SectionReviewState) => void;
  disabled?: boolean;
}

export default function SectionDecisionControl({
  sectionId,
  sectionTitle,
  state,
  submittedDecision,
  onChange,
  onNextSection,
  onSubmitDecision,
  disabled = false,
}: SectionDecisionControlProps) {
  const currentDecision = state?.decision || null;

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

    onChange({
      decision: target,
      note: state?.decision === target ? state?.note : "",
      notes: state?.notes,
    });
  };

  const isAlreadySubmitted = Boolean(
    submittedDecision !== undefined &&
    submittedDecision !== null &&
    submittedDecision === currentDecision &&
    (!state?.note || !state.note.trim())
  );

  const isSubmitDisabled =
    disabled ||
    !currentDecision ||
    isAlreadySubmitted ||
    ((currentDecision === "clarification" || currentDecision === "reject") &&
      !state?.note?.trim() &&
      !isAlreadySubmitted);

  const handleSubmitContinueClick = () => {
    if (isSubmitDisabled) return;

    const trimmed = state?.note?.trim() || "";
    let updatedNotes = state?.notes || [];

    if (trimmed && (currentDecision === "clarification" || currentDecision === "reject")) {
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

    const nextState: SectionReviewState = {
      ...state,
      note: "", // Reset the textarea input once submitted into history list
      notes: updatedNotes,
    };

    onChange(nextState);

    if (onSubmitDecision) {
      onSubmitDecision(sectionId, currentDecision, nextState);
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
          onClick={(e) => {
            e.preventDefault();
            handleSelectClick("approve");
          }}
        >
          <input
            type="radio"
            name={`decision-${sectionId}`}
            value="approve"
            checked={currentDecision === "approve"}
            readOnly
            tabIndex={-1}
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
          onClick={(e) => {
            e.preventDefault();
            handleSelectClick("clarification");
          }}
        >
          <input
            type="radio"
            name={`decision-${sectionId}`}
            value="clarification"
            checked={currentDecision === "clarification"}
            readOnly
            tabIndex={-1}
            disabled={disabled}
          />
          <span>Need Clarification</span>
        </label>

        <label
          className={`${styles.radioLabel} ${
            currentDecision === "reject" ? styles.radioLabelActiveReject : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            handleSelectClick("reject");
          }}
        >
          <input
            type="radio"
            name={`decision-${sectionId}`}
            value="reject"
            checked={currentDecision === "reject"}
            readOnly
            tabIndex={-1}
            disabled={disabled}
          />
          <span>Reject</span>
        </label>
      </div>

      <div className={`${styles.inlineReasonContainer} ${
        (currentDecision === "clarification" || currentDecision === "reject") ? styles.inlineReasonContainerActive : ""
      }`}>
        <p style={{ marginBottom: "8px", fontSize: "13px", color: "var(--dove-gray)", fontWeight: 600 }}>
          {currentDecision === "reject"
            ? `Reason for Rejection (Required):`
            : `Clarification Details Required (Required):`}
        </p>
        <textarea
          style={{
            width: "100%",
            minHeight: "80px",
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
            currentDecision === "reject"
              ? "Enter reason for rejection..."
              : "Enter details required for clarification..."
          }
          value={state?.note || ""}
          onChange={(e) => {
            onChange({
              ...state,
              note: e.target.value,
            });
          }}
          disabled={disabled}
        />
      </div>

      {state?.notes && state.notes.length > 0 && (
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
          disabled={isSubmitDisabled}
        />
      </div>
    </div>
  );
}
