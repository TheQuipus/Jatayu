"use client";

import { useEffect, useState } from "react";
import { fetchExpertProfileRecord } from "@/lib/expertProfileApi";
import { updateProfile } from "@/lib/api";
import { CalendarOff, Plus, Trash2, Check, Save } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

type ExceptionItem = {
  id: number | string;
  title: string;
  fromDate: string;
  toDate: string;
};

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
  const [items, setItems] = useState<ExceptionItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchExpertProfileRecord().then((profile) => {
      if (!active) return;
      const saved = profile.onboardingMetadata?.timeOff;
      setItems(Array.isArray(saved) ? saved : []);
    }).catch(() => {
      if (active) {
        setLoadFailed(true);
        setError("Unable to load time off. Reload this page to try again.");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile({ onboardingMetadata: { timeOff: items } });
      setIsSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save time off.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !fromDate) return;

    if (toDate && toDate < fromDate) return;

    const newItem: ExceptionItem = {
      id: Date.now(),
      title: newTitle.trim(),
      fromDate,
      toDate: toDate || fromDate,
    };

    setItems((current) => [newItem, ...current]);
    setIsSaved(false);
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
            disabled={loading || saving || loadFailed}
          >
            <Plus size={13} />
            <span>Add</span>
          </button>
          <button
            type="button"
            className={`${styles.panelSaveBtn} ${isSaved ? styles.savedState : ""}`}
            onClick={handleSave}
            disabled={isSaved || loading || saving || loadFailed}
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
                <span>{saving ? "Saving…" : "Save"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading time off…</p>}
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
                maxLength={200}
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
            <button type="submit" className={styles.confirmAddBtn} disabled={saving}>
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
                  <span className={styles.dateLabel}>From:</span> {formatDate(from)}
                </span>
                <span className={styles.dateArrow}>→</span>
                <span className={styles.dateChip}>
                  <span className={styles.dateLabel}>To:</span> {formatDate(to)}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.deleteActionBtn}
              disabled={saving}
              onClick={() => {
                setItems((current) => current.filter((item) => item.id !== id));
                setIsSaved(false);
              }}
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
