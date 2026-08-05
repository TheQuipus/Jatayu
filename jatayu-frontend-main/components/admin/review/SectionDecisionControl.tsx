"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ADMIN_PROFILE } from "@/lib/adminDashboard";
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
  disabled?: boolean;
}

export default function SectionDecisionControl({
  sectionId,
  sectionTitle,
  state,
  onChange,
  disabled = false,
}: SectionDecisionControlProps) {
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    setNoteInput(state?.note || "");
  }, [state?.note]);

  const handleSelectClick = (target: "approve" | "reject" | "clarification") => {
    if (disabled) return;
    const nextDecision = state?.decision === target ? null : target;
    onChange({
      decision: nextDecision,
      note: state?.note || "",
      notes: state?.notes,
    });
  };

  const handlePostSectionNote = () => {
    if (disabled) return;
    const trimmed = noteInput.trim();
    if (!trimmed) return;

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

    onChange({
      decision: state?.decision || null,
      note: "",
      notes: [...(state?.notes || []), newNote],
    });

    setNoteInput("");
  };

  const currentDecision = state?.decision || null;

  return (
    <div className={styles.sectionDecisionBox}>
      <div className={styles.sectionDecisionHeader}>
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
      </div>

      <AnimatePresence initial={false}>
        {currentDecision && currentDecision !== "approve" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.sectionNoteBoxContent}>
              {/* Existing notes for this section */}
              {state.notes && state.notes.length > 0 && (
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
              )}

              {/* Input for new note */}
              <div className={styles.sectionNoteInputRow}>
                <Image
                  src={ADMIN_PROFILE.avatar}
                  alt=""
                  width={24}
                  height={24}
                  className={styles.sectionNoteInputAvatar}
                />
                <textarea
                  className={styles.sectionNoteInputTextarea}
                  placeholder={
                    state.decision === "reject"
                      ? "Add a reason for rejection..."
                      : "Add a detail for clarification..."
                  }
                  value={noteInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNoteInput(val);
                    onChange({
                      decision: state?.decision || null,
                      note: val,
                      notes: state?.notes,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePostSectionNote();
                    }
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
