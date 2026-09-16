"use client";

import Link from "next/link";
import { CalendarClock, MessageCircle, Mic, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getExpertRequests } from "@/lib/api";
import type { ClientRequest } from "@/lib/expertRequests";
import styles from "./ExpertShell.module.css";

const ATTENTION_WINDOW_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 30 * 1000;

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function sessionIcon(formatLabel: string) {
  const normalized = formatLabel.toLowerCase();
  if (normalized.includes("text") || normalized.includes("chat")) return MessageCircle;
  if (normalized.includes("audio") || normalized.includes("voice")) return Mic;
  return Video;
}

export default function ActiveSessionAttention() {
  const [sessions, setSessions] = useState<ClientRequest[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const refreshSessions = useCallback(async () => {
    try {
      const response = await getExpertRequests({
        status: "accepted",
        page: 1,
        limit: 100,
        sort: "oldest",
      });
      setSessions(response.requests);
    } catch (error) {
      console.error("Could not check upcoming expert sessions:", error);
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
    const refreshTimer = window.setInterval(() => void refreshSessions(), REFRESH_INTERVAL_MS);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshSessions();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshSessions]);

  const session = useMemo(() => sessions
    .filter((item) => {
      const startsAt = item.scheduledStartAt ? new Date(item.scheduledStartAt).getTime() : NaN;
      const endsAt = item.scheduledEndAt ? new Date(item.scheduledEndAt).getTime() : NaN;
      return Number.isFinite(startsAt)
        && Number.isFinite(endsAt)
        && now >= startsAt - ATTENTION_WINDOW_MS
        && now <= endsAt;
    })
    .sort((a, b) => new Date(a.scheduledStartAt || 0).getTime() - new Date(b.scheduledStartAt || 0).getTime())[0],
  [now, sessions]);

  if (!session?.scheduledStartAt || !session.scheduledEndAt) return null;

  const startsAt = new Date(session.scheduledStartAt);
  const endsAt = new Date(session.scheduledEndAt);
  const isLive = now >= startsAt.getTime();
  const Icon = sessionIcon(session.formatLabel);

  return (
    <aside className={styles.sessionAttention} role="alert" aria-live="assertive">
      <div className={styles.sessionAttentionAccent} aria-hidden="true" />
      <div className={styles.sessionAttentionHeader}>
        <span className={styles.sessionAttentionIcon}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <span className={styles.sessionAttentionEyebrow}>
            <i className={styles.sessionAttentionPulse} aria-hidden="true" />
            {isLive ? "Session live now" : `Starts in ${formatCountdown(startsAt.getTime() - now)}`}
          </span>
          <strong className={styles.sessionAttentionTitle}>{session.title}</strong>
        </div>
      </div>

      <p className={styles.sessionAttentionClient}>with {session.clientName}</p>

      <div className={styles.sessionAttentionMeta}>
        <span><CalendarClock size={14} aria-hidden="true" /></span>
        <span>
          {startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className={styles.sessionAttentionFormat}>{session.formatLabel}</span>
      </div>

      <Link href={`/expert/requests/${session.id}/`} className={styles.sessionAttentionAction}>
        {isLive ? "Join session now" : "Open session"}
      </Link>
    </aside>
  );
}
