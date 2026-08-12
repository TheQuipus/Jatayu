"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hourglass,
  Inbox,
  Video,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  formatRequestPrice,
  getStoredRequests,
  updateStoredRequestStatus,
  type ClientRequest,
  type RequestStatusFilter,
} from "@/lib/expertRequests";
import ContinueButton from "@/components/ui/ContinueButton";
import AcceptRequestModal from "./AcceptRequestModal";
import DeclineRequestModal from "./DeclineRequestModal";
import styles from "./ExpertRequests.module.css";

const SUMMARY_CARDS = [
  { id: "new", label: "New Requests", icon: Inbox },
  { id: "pending", label: "Pending", icon: Hourglass },
  { id: "accepted", label: "Accepted", icon: CheckCircle2 },
  { id: "declined", label: "Declined", icon: XCircle },
] as const;

function getTargetTimeMs(dateLabel: string): number {
  if (dateLabel.includes("Tomorrow")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    return d.getTime();
  }
  const parsed = Date.parse(dateLabel);
  if (!isNaN(parsed) && parsed > Date.now()) {
    return parsed;
  }
  return Date.now() + (1 * 60 * 60 + 45 * 60) * 1000;
}

function getCountdownTextForRequest(dateLabel: string, currentTime: number): string | null {
  const targetMs = getTargetTimeMs(dateLabel);
  const diffMs = targetMs - currentTime;

  if (diffMs <= 5 * 60 * 1000) {
    return null;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const remainingSecs = totalSeconds % 60;
  const remainingMins = totalMinutes % 60;
  const remainingHrs = totalHours % 24;

  const hh = String(remainingHrs).padStart(2, "0");
  const mm = String(remainingMins).padStart(2, "0");
  const ss = String(remainingSecs).padStart(2, "0");

  if (totalDays > 0) {
    const dd = String(totalDays).padStart(2, "0");
    return `${dd}D:${hh}H:${mm}M`;
  }
  return `${hh}:${mm}:${ss}`;
}

export default function ExpertRequests() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");

  const [acceptingRequest, setAcceptingRequest] = useState<ClientRequest | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<ClientRequest | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    setRequests(getStoredRequests());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic counts calculated from current requests state
  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    declined: requests.filter((r) => r.status === "declined").length,
  };

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((request) => request.status === statusFilter);

  const handleConfirmAccept = (requestId: string) => {
    const updated = updateStoredRequestStatus(requestId, "accepted");
    setRequests(updated);
    setAcceptingRequest(null);
  };

  const handleConfirmDecline = (requestId: string, reason: string, notes: string) => {
    const updated = updateStoredRequestStatus(requestId, "declined", reason, notes);
    setRequests(updated);
    setDecliningRequest(null);
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <p className={styles.pageSubtitle}>
              Manage incoming session and consultation requests
            </p>
            <h1 className={styles.pageTitle}>
              Client <span className={styles.accentWord}>Requests</span>
            </h1>
          </div>
        </header>

        {/* Summary Stat Cards / KPI Row */}
        <div className={`${styles.summaryGrid} ${styles.kpiRow}`} role="group" aria-label="Filter by status">
          {SUMMARY_CARDS.map((card) => {
            const Icon = card.icon;
            const count = counts[card.id];
            const isActive = statusFilter === card.id;

            return (
              <button
                key={card.id}
                type="button"
                className={`${styles.summaryCard} ${styles.kpiCard} ${
                  isActive ? `${styles.summaryCardActive} ${styles.kpiCardActive}` : ""
                }`}
                onClick={() =>
                  setStatusFilter((prev) => (prev === card.id ? "all" : card.id))
                }
                aria-pressed={isActive}
              >
                <div className={`${styles.summaryHeader} ${styles.kpiHeader}`}>
                  <span className={`${styles.summaryLabel} ${styles.kpiLabel}`}>{card.label}</span>
                  <span className={`${styles.summaryIconBox} ${styles.kpiIconBox}`}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                </div>
                <p className={`${styles.summaryValue} ${styles.kpiValue}`}>
                  {String(count).padStart(2, "0")}
                </p>
              </button>
            );
          })}
        </div>

        {/* Request Cards */}
        <div className={styles.requestList}>
          {filteredRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={32} aria-hidden="true" />
              <p>No requests match your filters.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <article key={request.id} className={styles.requestCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatarWrapper}>
                    <Image
                      src={request.clientAvatar}
                      alt={request.clientName}
                      width={72}
                      height={82}
                      className={styles.clientAvatar}
                    />
                  </div>

                  <div className={styles.headerMain}>
                    <div className={styles.clientRow}>
                      <span className={styles.clientName}>{request.clientName}</span>
                      {request.status === "new" && <span className={styles.badgeNew}>• New</span>}
                      {request.urgent && (
                        <span className={styles.badgeUrgent}>
                          <Zap size={11} aria-hidden="true" /> Urgent
                        </span>
                      )}
                      {request.repeatClient && (
                        <span className={styles.badgeRepeat}>Repeat client</span>
                      )}
                    </div>

                    <h3 className={styles.requestTitle}>{request.title}</h3>
                    <p className={styles.requestDescription}>{request.description}</p>

                    <div className={styles.cardMetaRow}>
                      <span className={styles.metaItem}>
                        <CalendarDays size={14} aria-hidden="true" />
                        {request.dateLabel}
                      </span>
                      <span className={styles.metaItem}>
                        <Clock size={14} aria-hidden="true" />
                        {request.durationLabel}
                      </span>
                      <span className={styles.metaItem}>
                        <Video size={14} aria-hidden="true" />
                        {request.formatLabel}
                      </span>
                    </div>
                  </div>

                  <div className={styles.priceMeta}>
                    <span className={styles.priceTag}>{formatRequestPrice(request.price)}</span>
                    <span className={styles.timeAgo}>{request.timeAgo}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {request.status === "accepted" ? (
                    (() => {
                      const countdown = getCountdownTextForRequest(request.dateLabel, currentTime);
                      if (countdown) {
                        return (
                          <Link href={`/expert/requests/${request.id}/`}>
                            <ContinueButton
                              label={countdown}
                              disabled
                              className={styles.timerButton}
                            />
                          </Link>
                        );
                      }
                      return (
                        <Link href={`/expert/requests/${request.id}/`}>
                          <ContinueButton label="JOIN SESSION" />
                        </Link>
                      );
                    })()
                  ) : request.status === "declined" ? (
                    <span className={styles.statusBadgeDeclined}>
                      <XCircle size={14} aria-hidden="true" />
                      Declined
                    </span>
                  ) : (
                    <>
                      <div onClick={() => setAcceptingRequest(request)}>
                        <ContinueButton label="ACCEPT" />
                      </div>
                      <button
                        type="button"
                        className={styles.btnDecline}
                        onClick={() => setDecliningRequest(request)}
                      >
                        <X size={14} aria-hidden="true" />
                        DECLINE
                      </button>
                    </>
                  )}
                  <Link href={`/expert/requests/${request.id}/`} className={styles.btnDetails}>
                    <ExternalLink size={14} aria-hidden="true" />
                    VIEW DETAILS
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Accept Confirmation Modal */}
      {acceptingRequest && (
        <AcceptRequestModal
          request={acceptingRequest}
          onClose={() => setAcceptingRequest(null)}
          onConfirm={handleConfirmAccept}
        />
      )}

      {/* Decline Reason Modal */}
      {decliningRequest && (
        <DeclineRequestModal
          request={decliningRequest}
          onClose={() => setDecliningRequest(null)}
          onConfirm={handleConfirmDecline}
        />
      )}
    </section>
  );
}
