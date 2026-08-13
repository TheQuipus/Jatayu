"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  Flag,
  Headphones,
  Info,
  Languages,
  MapPin,
  Star,
  Video,
  X,
  Zap,
} from "lucide-react";
import { getRequestDetailById } from "@/lib/expertRequestDetailStore";
import ExpertReportForm from "@/app/expert/(app)/report/[requestId]/ExpertReportForm";
import AcceptRequestModal from "./AcceptRequestModal";
import DeclineRequestModal from "./DeclineRequestModal";
import ExpertActiveRoom from "./ExpertActiveRoom";
import ContinueButton from "@/components/ui/ContinueButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { updateStoredRequestStatus, getStoredRequests, type ClientRequest } from "@/lib/expertRequests";
import styles from "./ExpertRequestDetail.module.css";

export default function ExpertRequestDetail({ requestId }: { requestId?: string }) {
  const router = useRouter();
  const params = useParams();
  const activeRequestId = (params?.id as string) || requestId || "req-1";
  const data = getRequestDetailById(activeRequestId);

  const [requestStatus, setRequestStatus] = useState<"new" | "pending" | "accepted" | "declined">(() => {
    if (typeof window !== "undefined") {
      const stored = getStoredRequests();
      const match = stored.find((r) => r.id === activeRequestId);
      if (match) return match.status;
    }
    return data.status;
  });

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isInActiveRoom, setIsInActiveRoom] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    if (requestStatus !== "accepted") return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [requestStatus]);

  const targetTimeMs = React.useMemo(() => {
    const text = data.sessionDetails.requestedDate;
    if (text.includes("Tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(14, 0, 0, 0);
      return d.getTime();
    }
    const parsed = Date.parse(text);
    if (!isNaN(parsed) && parsed > Date.now()) {
      return parsed;
    }
    // Demo countdown target: 1 hour 45 minutes from mount time if past/mocked
    return Date.now() + (1 * 60 * 60 + 45 * 60) * 1000;
  }, [data.sessionDetails.requestedDate]);

  const countdownText = React.useMemo(() => {
    if (requestStatus !== "accepted") return null;

    const diffMs = targetTimeMs - currentTime;
    // Within 5 minutes or past start time => JOIN SESSION is active!
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
  }, [requestStatus, targetTimeMs, currentTime]);

  // Sync state if activeRequestId changes
  useEffect(() => {
    const stored = getStoredRequests();
    const match = stored.find((r) => r.id === activeRequestId);
    if (match) {
      setRequestStatus(match.status);
    } else {
      setRequestStatus(data.status);
    }
  }, [activeRequestId, data.status]);

  const clientRequestAdapter: ClientRequest = {
    id: data.id,
    clientName: data.client.name,
    clientAvatar: data.client.avatar,
    title: data.title,
    description: data.proposal.summary,
    status: requestStatus,
    price: 2400,
    timeAgo: data.timeReceivedAgo,
    dateLabel: data.sessionDetails.requestedDate,
    durationLabel: data.sessionDetails.duration,
    formatLabel: data.sessionDetails.format,
    createdAt: Date.now(),
  };

  const handleConfirmAccept = () => {
    updateStoredRequestStatus(data.id, "accepted");
    setRequestStatus("accepted");
    setShowAcceptModal(false);
  };

  const handleConfirmDecline = (reqId: string, reason: string, notes: string) => {
    updateStoredRequestStatus(data.id, "declined", reason, notes);
    setRequestStatus("declined");
    setShowDeclineModal(false);
  };

  const nameParts = data.client.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  if (isInActiveRoom) {
    return (
      <ExpertActiveRoom
        requestId={data.id}
        clientName={data.client.name}
        clientAvatar={data.client.avatar}
        clientRole={`${data.client.role} · ${data.client.company}`}
        title={data.title}
        proposedPrice={data.sessionDetails.proposedPrice}
        formatLabel={data.sessionDetails.format}
        onLeaveRoom={() => setIsInActiveRoom(false)}
        onFinishSession={() => {
          setIsInActiveRoom(false);
          updateStoredRequestStatus(data.id, "accepted");
        }}
      />
    );
  }

  return (
    <section className={styles.detail}>
      <div className={`container ${styles.detailInner}`}>
        {/* Page Top / Back Button */}
        <div className={styles.pageTop}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/expert/requests");
              }
            }}
            className={styles.backLink}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back to Requests</span>
          </button>
        </div>

        {/* Main Layout Grid matching Seeker BookingDetailInfo */}
        <div className={styles.mainGrid}>
          {/* Main Column */}
          <div className={styles.mainCol}>
            {/* Booking Hero (Client Photo Card & Info Header) */}
            <div className={styles.bookingHero}>
              <article className={styles.bookingExpertCard}>
                <div className={styles.expertCategoryBadge}>
                  <span className={styles.expertCategoryDot} />
                  CLIENT REQUEST
                </div>
                <div className={styles.bookingExpertImageWrap}>
                  <Image
                    src={data.client.avatar}
                    alt={data.client.name}
                    fill
                    className={styles.bookingExpertImage}
                    sizes="348px"
                    priority
                  />
                </div>
                <div className={styles.bookingExpertOverlay}>
                  <p className={styles.bookingExpertName}>
                    {data.client.name.toUpperCase()}
                    {data.client.isVerified && (
                      <BadgeCheck size={18} className={styles.expertVerified} aria-hidden="true" />
                    )}
                  </p>
                  <p className={styles.bookingExpertDesc}>
                    {data.client.role} at {data.client.company}
                  </p>
                </div>
              </article>

              <div className={styles.bookingExpertInfo}>
                <h1 className={`display ${styles.displayName}`}>
                  <span>{firstName}</span>
                  <span className="t-muted">{lastName}</span>
                </h1>

                <p className={styles.roleSub}>
                  {data.client.role} at <strong>{data.client.company}</strong>
                </p>

                <div className={styles.starDivider}>
                  <span className={styles.dividerStar}>✦</span>
                  <span className={styles.dividerLine} />
                </div>

                <div className={styles.ratingsRow}>
                  <div className={styles.ratingItem}>
                    <Star size={16} fill="#EAB308" stroke="#EAB308" />
                    <span className={styles.ratingText}>
                      <strong>{data.client.rating.toFixed(1)}</strong> ({data.client.totalSessions} sessions completed)
                    </span>
                  </div>
                  <div className={styles.ratingItem}>
                    <Briefcase size={16} className={styles.statsIcon} />
                    <span className={styles.ratingText}>
                      <strong>{data.client.stats.sessionsBooked} Bookings</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaIconBadge}>
                      <MapPin size={13} />
                    </div>
                    <span className={styles.metaVal}>{data.client.location}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaIconBadge}>
                      <Clock size={13} />
                    </div>
                    <span className={styles.metaVal}>{data.client.timezone}</span>
                  </div>
                  {data.client.isOnline && (
                    <div className={`${styles.metaItem} ${styles.metaItemGreen}`}>
                      <Zap size={14} fill="currentColor" />
                      <span className={styles.metaVal}>Online now</span>
                    </div>
                  )}
                </div>

                <p className={styles.bioText}>{data.proposal.summary}</p>
              </div>
            </div>

            {/* Request Details Card */}
            <article className={styles.sessionCard}>
              <div className={styles.sectionHead}>
                <ClipboardList size={16} aria-hidden="true" />
                <h2 className={styles.sectionTitle}>Request Details</h2>
              </div>

              <div className={styles.sessionSummary}>
                <div className={styles.summaryMain}>
                  <span className={styles.summaryIconWrap} aria-hidden="true">
                    <Video size={22} strokeWidth={2} />
                  </span>
                  <div className={styles.summaryCopy}>
                    <h1 className={styles.summaryTitle}>{data.title}</h1>
                    <p className={styles.summaryMeta}>
                      Request ID: {data.id} • Submitted on {data.submittedDate}
                    </p>
                  </div>
                </div>

                <div className={styles.completedBadgeWrap}>
                  {requestStatus === "accepted" ? (
                    countdownText ? (
                      <div className={styles.countdownWrapper}>
                        <span className={styles.countdownTimer}>
                          {countdownText}
                        </span>
                        <span className={styles.countdownHint}>
                          Join room activates 5m prior
                        </span>
                      </div>
                    ) : (
                      <ContinueButton
                        label="JOIN SESSION"
                        onClick={() => setIsInActiveRoom(true)}
                      />
                    )
                  ) : requestStatus === "declined" ? (
                    <span className={styles.cancelledBadge}>Request Declined</span>
                  ) : null}
                </div>
              </div>

              <div className={styles.sessionGrid}>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Requested Date</span>
                  <strong className={styles.sessionValue}>{data.sessionDetails.requestedDate}</strong>
                  <span className={styles.sessionHint}>{data.sessionDetails.duration}</span>
                </div>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Format & Language</span>
                  <strong className={styles.sessionValue}>{data.sessionDetails.format}</strong>
                  <span className={styles.sessionHint}>{data.sessionDetails.language} • {data.sessionDetails.recurrence}</span>
                </div>
              </div>

              <div className={styles.contextSection}>
                <span className={styles.fieldLabel}>Client Request Details</span>
                <p className={styles.contextSubject}>{data.subtitle}</p>
                {data.proposal.paragraphs.map((p, idx) => (
                  <p key={idx} className={styles.contextText} style={{ marginBottom: 10 }}>
                    {p}
                  </p>
                ))}
                <div className={styles.tagsRow} style={{ marginTop: 12 }}>
                  {data.proposal.tags.map((tag) => (
                    <span key={tag} className={styles.tagChip}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </div>

          {/* Right Column / Sidebar */}
          <aside className={styles.rightCol}>
            <div className={styles.rightColInner}>
              {/* Card 1: Payment Summary */}
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Payment Summary</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <div className={styles.paymentHead}>
                    <span className={styles.paymentStatusLabel}>Status</span>
                    <span className={`${styles.paymentBadge} ${styles.paymentBadgePaid}`}>
                      Escrow Authorized
                    </span>
                  </div>

                  <div className={styles.priceList}>
                    <div className={styles.priceRow}>
                      <span>Proposed Fee</span>
                      <strong>{data.sessionDetails.proposedPrice}</strong>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Escrow Guarantee</span>
                      <strong>100% Secured</strong>
                    </div>
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total Payout</span>
                    <strong>{data.sessionDetails.proposedPrice}</strong>
                  </div>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>

              {/* Card 2: Manage Request */}
              {requestStatus !== "declined" ? (
                <div className={styles.bookingBox}>
                  <div className={styles.bookingHeader}>
                    <span className={styles.bookingHeaderTitle}>Manage Request</span>
                    <span className={styles.bookingHeaderDots} />
                    <div className={styles.soundwaveIcon} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className={styles.panelBody}>
                    <div className={styles.manageActions}>
                      {requestStatus === "new" || requestStatus === "pending" ? (
                        <>
                          <button
                            type="button"
                            className={styles.manageAction}
                            onClick={() => setShowAcceptModal(true)}
                          >
                            <span
                              className={styles.manageActionIcon}
                              style={{ background: "color-mix(in srgb, var(--green) 16%, var(--white))", color: "var(--green)" }}
                              aria-hidden="true"
                            >
                              <Check size={18} />
                            </span>
                            <span className={styles.manageActionCopy}>
                              <strong>Accept Request</strong>
                              <span>Confirm session for {data.sessionDetails.proposedPrice}</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            className={styles.manageAction}
                            onClick={() => setShowDeclineModal(true)}
                          >
                            <span
                              className={`${styles.manageActionIcon} ${styles.manageActionIconDanger}`}
                              aria-hidden="true"
                            >
                              <X size={18} />
                            </span>
                            <span className={styles.manageActionCopy}>
                              <strong>Decline Request</strong>
                              <span>Decline booking and notify client</span>
                            </span>
                          </button>
                        </>
                      ) : requestStatus === "accepted" ? (
                        <>
                          <button
                            type="button"
                            className={styles.manageAction}
                            onClick={() => setShowRescheduleModal(true)}
                          >
                            <span
                              className={styles.manageActionIcon}
                              style={{ background: "color-mix(in srgb, var(--ink) 10%, var(--white))", color: "var(--ink)" }}
                              aria-hidden="true"
                            >
                              <CalendarDays size={18} />
                            </span>
                            <span className={styles.manageActionCopy}>
                              <strong>Reschedule Session</strong>
                              <span>Propose a new date or time for this session</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            className={styles.manageAction}
                            onClick={() => setShowDeclineModal(true)}
                          >
                            <span
                              className={`${styles.manageActionIcon} ${styles.manageActionIconDanger}`}
                              aria-hidden="true"
                            >
                              <X size={18} />
                            </span>
                            <span className={styles.manageActionCopy}>
                              <strong>Cancel Session</strong>
                              <span>Cancel accepted session & notify client</span>
                            </span>
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className={styles.policyBox}>
                      <Info size={16} className={styles.policyIcon} aria-hidden="true" />
                      <p className={styles.policyText}>
                        <strong>Response Window:</strong> {data.respondTimeLeft}. Escrow funds are held safely until session completion.
                      </p>
                    </div>
                  </div>

                  <div className={styles.bookingFooter} aria-hidden="true" />
                </div>
              ) : null}

              {/* Card 3: Need Help? */}
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Need Assistance?</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <div className={styles.helpList}>
                    <a href="#support" className={styles.helpItem}>
                      <Headphones size={16} aria-hidden="true" />
                      <span>Contact Expert Support</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className={styles.helpItem}
                    >
                      <Flag size={16} aria-hidden="true" />
                      <span>Report Client Issue</span>
                    </button>
                  </div>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      {showAcceptModal && (
        <AcceptRequestModal
          request={clientRequestAdapter}
          onClose={() => setShowAcceptModal(false)}
          onConfirm={handleConfirmAccept}
        />
      )}

      {showDeclineModal && (
        <DeclineRequestModal
          request={clientRequestAdapter}
          onClose={() => setShowDeclineModal(false)}
          onConfirm={handleConfirmDecline}
        />
      )}

      {showRescheduleModal && (
        <ConfirmModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          onConfirm={() => {
            setShowRescheduleModal(false);
          }}
          title="Reschedule Session"
          message={`Propose a new date or time for the session with ${data.client.name}? A request notification will be sent to the client.`}
          confirmText="Send Reschedule Request"
          cancelText="Keep Original Time"
        />
      )}

      {isReportModalOpen && (
        <ExpertReportForm
          request={data}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </section>
  );
}
