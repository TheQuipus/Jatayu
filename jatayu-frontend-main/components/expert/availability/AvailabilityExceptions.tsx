"use client";

import { useState } from "react";
import { CalendarOff, Plus, Trash2, Check, Save } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

type ExceptionItem = {
  id: number | string;
  title: string;
  fromDate: string;
  toDate: string;
};

const INITIAL_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 1,
    title: "Diwali festival break",
    fromDate: "20 Oct 2026",
    toDate: "22 Oct 2026",
  },
  {
    id: 2,
    title: "Annual technology conference",
    fromDate: "14 Nov 2026",
    toDate: "16 Nov 2026",
  },
  {
    id: 3,
    title: "Personal leave",
    fromDate: "05 Dec 2026",
    toDate: "08 Dec 2026",
  },
];

function formatDate(dateString: string): string {
  if (!dateString) return "";
  if (!dateString.includes("-")) return dateString;
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AvailabilityExceptions() {
  const [items, setItems] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleSave = () => {
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 2200);
  };

  const handleCreateException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !fromDate) return;

    const formattedFrom = formatDate(fromDate);
    const formattedTo = toDate ? formatDate(toDate) : formattedFrom;

    const newItem: ExceptionItem = {
      id: Date.now(),
      title: newTitle.trim(),
      fromDate: formattedFrom,
      toDate: formattedTo,
    };

    setItems((current) => [newItem, ...current]);
    setNewTitle("");
    setFromDate("");
    setToDate("");
    setIsAdding(false);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionIndex}>02</span>
          <h2>Time off and availability</h2>
          <p>Override your standard schedule for specific date ranges.</p>
        </div>
        <div className={styles.panelHeaderActions}>
          <button
            type="button"
            className={styles.outlineButton}
            onClick={() => setIsAdding((prev) => !prev)}
            aria-label="Add time off"
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
          <button
            type="button"
            className={`${styles.panelSaveBtn} ${isSaved ? styles.savedState : ""}`}
            onClick={handleSave}
            disabled={isSaved}
            aria-label="Save time off"
          >
            {isSaved ? (
              <>
                <Check size={13} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateException} className={styles.addExceptionForm}>
          <h4 className={styles.addExceptionFormTitle}>Add Time Off / Availability</h4>
          <div className={styles.addExceptionGrid}>
            <div className={styles.formField}>
              <label htmlFor="exception-title">Name / Reason</label>
              <input
                id="exception-title"
                type="text"
                className={styles.formInput}
                placeholder="e.g. Vacation / Conference"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="exception-from">From date</label>
              <input
                id="exception-from"
                type="date"
                className={styles.formInput}
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  if (toDate && e.target.value > toDate) {
                    setToDate(e.target.value);
                  }
                }}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="exception-to">To date</label>
              <input
                id="exception-to"
                type="date"
                className={styles.formInput}
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.addExceptionActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </button>
            <button type="submit" className={styles.confirmAddBtn}>
              <Plus size={13} />
              <span>Add to list</span>
            </button>
          </div>
        </form>
      )}

      <div className={styles.exceptionList}>
        {items.map(({ id, title, fromDate: from, toDate: to }) => (
          <article key={id} className={styles.exceptionRow}>
            <span className={`${styles.exceptionIcon} ${styles.warm}`}>
              <CalendarOff size={16} />
            </span>
            <div className={styles.exceptionDetails}>
              <strong className={styles.exceptionTitle}>{title}</strong>
              <div className={styles.exceptionDateRow}>
                <span className={styles.dateChip}>
                  <span className={styles.dateLabel}>From:</span> {from}
                </span>
                <span className={styles.dateArrow}>→</span>
                <span className={styles.dateChip}>
                  <span className={styles.dateLabel}>To:</span> {to}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.deleteActionBtn}
              onClick={() => setItems((current) => current.filter((item) => item.id !== id))}
              aria-label={`Remove ${title}`}
            >
              <Trash2 size={14} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
