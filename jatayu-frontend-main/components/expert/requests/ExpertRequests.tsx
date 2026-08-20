"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CalendarClock,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Handshake,
  Hourglass,
  Inbox,
  Layers,
  Video,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  formatRequestPrice,
  getStoredRequests,
  isRequestPoked,
  updateStoredRequestStatus,
  updateRequestStatusAsync,
  type ClientRequest,
  type RequestStatusFilter,
} from "@/lib/expertRequests";
import { getExpertRequests, type ExpertRequestsResponse } from "@/lib/api";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import AcceptRequestModal from "./AcceptRequestModal";
import DeclineRequestModal from "./DeclineRequestModal";
import RescheduleRequestModal from "./RescheduleRequestModal";
import styles from "./ExpertRequests.module.css";

const SUMMARY_CARDS = [
  { id: "all", label: "All", icon: Layers },
  { id: "urgent", label: "Urgent", icon: Zap },
  { id: "new", label: "New", icon: Inbox },
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
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [sort] = useState<string>("newest");
  const [loading, setLoading] = useState<boolean>(true);
  const [apiCounts, setApiCounts] = useState<Record<string, number> | null>(null);

  const [acceptingRequest, setAcceptingRequest] = useState<ClientRequest | null>(null);
  const [reschedulingRequest, setReschedulingRequest] = useState<ClientRequest | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<ClientRequest | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    getExpertRequests({
      status: statusFilter,
      page,
      limit,
      sort,
    })
      .then((res: ExpertRequestsResponse) => {
        if (isSubscribed) {
          setRequests(res.requests);
          if (res.counts) setApiCounts(res.counts);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [statusFilter, page, limit, sort]);

  // Dynamic counts calculated from state / API
  const allStored = getStoredRequests();
  const counts: Record<string, number> = {
    all: apiCounts?.all ?? allStored.length,
    urgent: apiCounts?.urgent ?? allStored.filter((r) => Boolean(r.urgent)).length,
    new: apiCounts?.new ?? allStored.filter((r) => r.status === "new").length,
    pending: apiCounts?.pending ?? allStored.filter((r) => r.status === "pending").length,
    accepted: apiCounts?.accepted ?? allStored.filter((r) => r.status === "accepted").length,
    declined: apiCounts?.declined ?? allStored.filter((r) => r.status === "declined").length,
  };

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : statusFilter === "urgent"
      ? requests.filter((request) => request.urgent)
      : requests.filter((request) => request.status === statusFilter);

  const handleConfirmAccept = async (requestId: string) => {
    await updateRequestStatusAsync(requestId, "accepted");
    try {
      const fresh = await getExpertRequests({ status: statusFilter, page, limit, sort });
      setRequests(fresh.requests);
      if (fresh.counts) setApiCounts(fresh.counts);
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "accepted" } : r)));
    }
    setAcceptingRequest(null);
  };

  const handleConfirmDecline = async (requestId: string, reason: string, notes: string) => {
    await updateRequestStatusAsync(requestId, "declined", reason, notes);
    try {
      const fresh = await getExpertRequests({ status: statusFilter, page, limit, sort });
      setRequests(fresh.requests);
      if (fresh.counts) setApiCounts(fresh.counts);
    } catch {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "declined" } : r)));
    }
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
            // Urgent card is only shown when there is at least 1 urgent request available
            if (card.id === "urgent" && counts.urgent === 0) {
              return null;
            }

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
            filteredRequests.map((request) => {
              const isPoked = isRequestPoked(request);
              return (
                <article
                  key={request.id}
                  className={`${styles.requestCard} ${
                    isPoked ? styles.requestCardPoked : request.status === "new" ? styles.requestCardNew : ""
                  }`}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarContainer}>
                      <div className={styles.avatarWrapper}>
                        <Image
                          src={request.clientAvatar}
                          alt={request.clientName}
                          width={72}
                          height={82}
                          className={styles.clientAvatar}
                        />
                      </div>
                      {isPoked && (
                        <div className={styles.avatarPokedBadge} title="Seeker poked this request!">
                          <picture className={styles.pokedPicture}>
                            <source
                              srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp"
                              type="image/webp"
                            />
                            <img
                              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif"
                              alt="🤔"
                              width={32}
                              height={32}
                              className={styles.pokedEmojiImg}
                            />
                          </picture>
                        </div>
                      )}
                    </div>

                  <div className={styles.headerMain}>
                    <div className={styles.clientRow}>
                      <span className={styles.clientName}>
                        {request.clientName}
                        {isRequestPoked(request) && " Has poked you"}
                      </span>
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

                    <h3 className={styles.requestTitle}>
                      <span className={styles.requestPrefix}>Topic: </span>
                      {request.title}
                    </h3>
                    <p className={styles.requestDescription}>
                      <span className={styles.requestPrefix}>Seeking advice on: </span>
                      {request.description}
                    </p>

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
                      <Ban size={14} aria-hidden="true" />
                      Declined
                    </span>
                  ) : (
                    <>
                      <div onClick={() => setAcceptingRequest(request)}>
                        <ContinueButton label="ACCEPT" icon={<Handshake size={15} />} />
                      </div>
                      <SecondaryCTA
                        type="button"
                        label="RESCHEDULE"
                        icon={<CalendarClock size={14} aria-hidden="true" />}
                        showArrow={false}
                        onClick={() => setReschedulingRequest(request)}
                      />
                      <SecondaryCTA
                        type="button"
                        label="DECLINE"
                        icon={<Ban size={14} aria-hidden="true" />}
                        showArrow={false}
                        onClick={() => setDecliningRequest(request)}
                      />
                    </>
                  )}
                  <Link href={`/expert/requests/${request.id}/`} className={styles.btnDetails}>
                    VIEW DETAILS
                    <ExternalLink size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })
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

      {/* Reschedule Proposal Modal */}
      {reschedulingRequest && (
        <RescheduleRequestModal
          request={reschedulingRequest}
          onClose={() => setReschedulingRequest(null)}
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
