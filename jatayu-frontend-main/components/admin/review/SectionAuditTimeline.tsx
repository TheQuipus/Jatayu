"use client";

import { useMemo } from "react";
import { History, Clock, AlertCircle } from "lucide-react";
import type { SectionAuditLogEntry } from "@/lib/adminApplicationReview";
import styles from "./SectionAuditTimeline.module.css";

interface SectionAuditTimelineProps {
  auditLogs?: SectionAuditLogEntry[];
  onSelectSection?: (sectionId: string) => void;
  className?: string;
}

function formatAuditTimestamp(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const formattedHours = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm} • section-review`;
}

function getBadgeClassName(action: string): string {
  switch (action) {
    case "approve":
    case "approved":
      return styles.badgeApproved;
    case "clarification":
      return styles.badgeClarification;
    case "reject":
    case "rejected":
      return styles.badgeRejected;
    case "on_hold":
      return styles.badgeHold;
    case "clarification_response":
      return styles.badgeResponse;
    default:
      return styles.badgeDefault;
  }
}

function getBulletClassName(action: string): string {
  switch (action) {
    case "approve":
    case "approved":
      return styles.bulletApprove;
    case "clarification":
      return styles.bulletClarification;
    case "reject":
    case "rejected":
      return styles.bulletReject;
    case "on_hold":
      return styles.bulletHold;
    case "clarification_response":
      return styles.bulletResponse;
    default:
      return styles.bulletDefault;
  }
}

function getDefaultActionDescription(action: string, sectionTitle: string): string {
  switch (action) {
    case "approve":
      return `Marked ${sectionTitle} as Approved.`;
    case "approved":
      return "Application approved officially.";
    case "clarification":
      return `Requested clarification for ${sectionTitle}.`;
    case "reject":
      return `Marked ${sectionTitle} as Rejected.`;
    case "rejected":
      return "Application rejected.";
    case "on_hold":
      return "Application put on hold.";
    case "in_review":
      return "Application marked In Review.";
    case "cleared":
      return `Cleared review decision for ${sectionTitle}.`;
    case "clarification_response":
      return `Expert submitted updated information for ${sectionTitle}.`;
    default:
      return `Updated review for ${sectionTitle}.`;
  }
}

export default function SectionAuditTimeline({
  auditLogs = [],
  onSelectSection,
  className,
}: SectionAuditTimelineProps) {
  const sortedLogs = useMemo(() => {
    const raw = [...auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const seen = new Set<string>();
    const deduped: SectionAuditLogEntry[] = [];

    for (const item of raw) {
      const secKey = item.sectionId || "application";
      const key = `${secKey}:${item.action}:${(item.note || "").trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push({
          ...item,
          sectionTitle:
            secKey === "preferences" || item.sectionTitle === "Preferences & Pricing"
              ? "Consultation Preferences"
              : item.sectionTitle,
        });
      }
    }
    return deduped;
  }, [auditLogs]);

  return (
    <div className={`${styles.timelineCard} ${className || ""}`}>
      <div className={styles.timelineHeader}>
        <div className={styles.timelineTitleRow}>
          <h3 className={styles.timelineTitle}>Timeline</h3>
          {sortedLogs.length > 0 && (
            <span className={styles.timelineCountBadge}>
              {sortedLogs.length} {sortedLogs.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>
        <p className={styles.timelineSubtitle}>Scrollable review activity rail</p>
      </div>

      <div className={styles.timelineScrollContainer}>
        {sortedLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={20} className={styles.emptyStateIcon} aria-hidden="true" />
            <p>No review activity recorded yet. Decisions made on sections will appear here.</p>
          </div>
        ) : (
          <ul className={styles.timelineList} role="list">
            {sortedLogs.map((entry, index) => {
              const isLast = index === sortedLogs.length - 1;
              const isClickable =
                Boolean(onSelectSection) &&
                Boolean(entry.sectionId) &&
                entry.sectionId !== "application";
              const noteText = entry.note?.trim() || getDefaultActionDescription(entry.action, entry.sectionTitle);
              const actorLabel = entry.actor?.role === "Expert"
                ? `Updated by ${entry.actor?.name || "Expert"}`
                : `Reviewed by ${entry.actor?.name || "Super Admin"}${entry.actor?.role ? ` (${entry.actor.role})` : ""}`;

              return (
                <li key={entry.id || `${entry.sectionId}-${entry.timestamp}-${index}`} className={styles.timelineItem} role="listitem">
                  {!isLast && <div className={styles.timelineRailLine} aria-hidden="true" />}
                  <div
                    className={`${styles.timelineBullet} ${getBulletClassName(entry.action)}`}
                    aria-hidden="true"
                  />

                  <div
                    className={`${styles.itemCard} ${isClickable ? styles.itemCardInteractive : ""}`}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onClick={() => {
                      if (isClickable && onSelectSection) {
                        onSelectSection(entry.sectionId);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (isClickable && onSelectSection && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onSelectSection(entry.sectionId);
                      }
                    }}
                    title={isClickable ? `Jump to ${entry.sectionTitle}` : undefined}
                  >
                    <div className={styles.itemHeaderRow}>
                      <h4 className={styles.itemTitle}>{entry.sectionTitle}</h4>
                      <span className={`${styles.itemBadge} ${getBadgeClassName(entry.action)}`}>
                        {entry.badgeLabel || entry.action.toUpperCase()}
                      </span>
                    </div>

                    <div className={styles.itemMetaRow}>
                      <span>{formatAuditTimestamp(entry.timestamp)}</span>
                    </div>

                    <div className={styles.itemActorRow}>
                      <span>{actorLabel}</span>
                    </div>

                    <p className={styles.itemBody}>
                      {noteText}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

