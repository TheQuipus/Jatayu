"use client";

import { useEffect, useState } from "react";
import { fetchExpertProfileRecord } from "@/lib/expertProfileApi";
import { getExpertRequests, updateProfile } from "@/lib/api";
import type { ClientRequest } from "@/lib/expertRequests";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { CalendarOff, Plus, Trash2, Check, Save, Clock3 } from "lucide-react";
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

function localDateKey(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSessionDateTime(dateValue?: string) {
  if (!dateValue) return "Scheduled time unavailable";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Scheduled time unavailable";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
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
  const [scheduledSessions, setScheduledSessions] = useState<ClientRequest[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsLoadFailed, setSessionsLoadFailed] = useState(false);
  const [conflictingSessions, setConflictingSessions] = useState<ClientRequest[]>([]);

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

  useEffect(() => {
    let active = true;
    void getExpertRequests({ status: "accepted", page: 1, limit: 100, sort: "oldest" })
      .then((response) => {
        if (active) setScheduledSessions(response.requests);
      })
      .catch(() => {
        if (active) setSessionsLoadFailed(true);
      })
      .finally(() => {
        if (active) setSessionsLoading(false);
      });
    return () => {
      active = false;
    };
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
    if (sessionsLoading || sessionsLoadFailed) {
      setError(sessionsLoading
        ? "Please wait while scheduled sessions are checked."
        : "Unable to verify scheduled sessions. Reload the page before adding time off.");
      return;
    }

    const rangeEnd = toDate || fromDate;
    const conflicts = scheduledSessions.filter((session) => {
      const sessionStart = session.scheduledStartAt ? localDateKey(session.scheduledStartAt) : "";
      const sessionEnd = session.scheduledEndAt ? localDateKey(session.scheduledEndAt) : sessionStart;
      return Boolean(sessionStart && sessionStart <= rangeEnd && sessionEnd >= fromDate);
    });
    if (conflicts.length > 0) {
      setConflictingSessions(conflicts);
      return;
    }

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
          <h2>Time off</h2>
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
          <h4 className={styles.addExceptionFormTitle}>Add Time Off</h4>
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
            <button type="submit" className={styles.confirmAddBtn} disabled={saving || sessionsLoading}>
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

      <ConfirmModal
        isOpen={conflictingSessions.length > 0}
        onClose={() => setConflictingSessions([])}
        onConfirm={() => setConflictingSessions([])}
        title="Time off is not available"
        message={
          <div className={styles.timeOffConflictContent}>
            <p>You cannot take time off during this period because you have active or scheduled sessions:</p>
            <ul className={styles.timeOffConflictList}>
              {conflictingSessions.map((session) => (
                <li key={session.id}>
                  <strong>{session.clientName}</strong>
                  <span>{session.title}</span>
                  <time><Clock3 size={12} /> {formatSessionDateTime(session.scheduledStartAt)}</time>
                </li>
              ))}
            </ul>
          </div>
        }
        confirmText="Close"
        cancelText="Change dates"
        variant="warning"
      />
    </section>
  );
}
