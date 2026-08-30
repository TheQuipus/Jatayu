"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Download,
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
import { getRequestDetailById, type RequestDetailModel } from "@/lib/expertRequestDetailStore";
import ExpertReportForm from "@/app/expert/(app)/report/[requestId]/ExpertReportForm";
import AcceptRequestModal from "./AcceptRequestModal";
import DeclineRequestModal from "./DeclineRequestModal";
import ExpertActiveRoom from "./ExpertActiveRoom";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  updateStoredRequestStatus,
  getStoredRequests,
  updateRequestStatusAsync,
  fetchExpertRequests,
  type ClientRequest,
} from "@/lib/expertRequests";
import styles from "@/components/seeker/bookings/BookingDetailInfo.module.css";

export default function ExpertRequestDetail({ requestId }: { requestId?: string }) {
  const router = useRouter();
  const params = useParams();
  const activeRequestId = (params?.id as string) || requestId || "req-1";

  const [data, setData] = useState<RequestDetailModel>(() => getRequestDetailById(activeRequestId));
  const [loading, setLoading] = useState<boolean>(true);

  const [requestStatus, setRequestStatus] = useState<"new" | "pending" | "accepted" | "declined">(() => {
    if (typeof window !== "undefined") {
      const stored = getStoredRequests();
      const match = stored.find((r) => r.id === activeRequestId);
      if (match) return match.status;
    }
    return data.status;
  });

  const [fastForwarded, setFastForwarded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("fast_forward_timer") === "true";
    }
    return false;
  });

  const toggleFastForward = () => {
    if (typeof window === "undefined") return;
    const next = !fastForwarded;
    setFastForwarded(next);
    if (next) {
      window.sessionStorage.setItem("fast_forward_timer", "true");
    } else {
      window.sessionStorage.removeItem("fast_forward_timer");
    }
    setCurrentTime(Date.now());
  };

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);

    fetchExpertRequests({
      status: "all",
      page: 1,
      limit: 20,
      sort: "newest",
    })
      .then(() => {
        if (isSubscribed) {
          const detail = getRequestDetailById(activeRequestId);
          setData(detail);
          setRequestStatus(detail.status);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load expert request detail from API:", err);
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeRequestId]);

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

  const targetTimeMs = useMemo(() => {
    if (data.sessionAccess?.opensAt) {
      return new Date(data.sessionAccess.opensAt).getTime();
    }
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
    return Date.now() + (1 * 60 * 60 + 45 * 60) * 1000;
  }, [data.sessionDetails.requestedDate]);

  const countdownText = useMemo(() => {
    if (
      requestStatus !== "accepted" ||
      fastForwarded ||
      (typeof window !== "undefined" &&
        (window.location.search.includes("testJoin") ||
          window.location.search.includes("action=join")))
    ) {
      return null;
    }

    const diffMs = targetTimeMs - currentTime;
    if (diffMs <= 0) {
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
  }, [requestStatus, targetTimeMs, currentTime, fastForwarded]);

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

  const handleConfirmAccept = async () => {
    await updateRequestStatusAsync(data.id, "accepted");
    setRequestStatus("accepted");
    setShowAcceptModal(false);
  };

  const handleConfirmDecline = async (reqId: string, reason: string, notes: string) => {
    await updateRequestStatusAsync(data.id, "declined", reason, notes);
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

        {/* Main Layout Grid matched 1:1 with Seeker BookingDetailInfo */}
        <div className={styles.mainGrid}>
          {/* Left Main Column */}
          <div className={styles.mainCol}>
            {/* Booking Hero (Client Profile Card & Info Header) */}
            <div className={styles.bookingHero}>
              <article className={styles.bookingExpertCard}>
                {data.expertProfessionalTitle || data.client.role ? (
                  <div className={styles.expertCategoryBadge}>
                    <span className={styles.expertCategoryDot} />
                    {(data.expertProfessionalTitle || data.client.role).toUpperCase()}
                  </div>
                ) : null}
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
                    {data.client.role} • {data.client.company}
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

                <div className={styles.bioText}>
                  {data.title ? (
                    <p style={{ fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>
                      Subject: {data.title}
                    </p>
                  ) : null}
                  <p style={{ margin: 0 }}>{data.proposal.summary}</p>
                </div>
              </div>
            </div>

            {/* Status Chewy Banner Anchor matched 1:1 with BookingDetailInfo */}
            <div className={styles.badgeFloatAnchor}>
              {requestStatus === "declined" ? (
                <div className={styles.completedBadgeWrap}>
                  <div className={styles.chewyCard}>
                    <div className={`${styles.chewyTopHeader} ${styles.chewyTopHeaderRed}`}>
                      <span>Request Declined</span>
                    </div>
                    <div className={styles.chewyBody}>
                      <p className={styles.chewyDesc}>
                        This request was declined. The client has been notified and escrow funds released.
                      </p>
                    </div>
                  </div>
                </div>
              ) : requestStatus === "accepted" && !countdownText ? (
                <div className={styles.completedBadgeWrap}>
                  <div className={styles.chewyCard}>
                    <div className={styles.chewyTopHeader}>
                      <span>Session Active</span>
                    </div>
                    <div className={styles.chewyBody}>
                      <h3 className={styles.chewyTitle}>Your Session Is Live</h3>
                      <p className={styles.chewyDesc}>
                        Your client is waiting in the active room. Click below to join now.
                      </p>
                      <ContinueButton
                        label="Join Session"
                        onClick={() => setIsInActiveRoom(true)}
                        className={styles.giveReviewBtn}
                      />
                    </div>
                  </div>
                </div>
              ) : requestStatus === "accepted" && countdownText ? (
                <div className={styles.completedBadgeWrap}>
                  <div className={styles.chewyCard}>
                    <div className={`${styles.chewyTopHeader} ${styles.chewyTopHeaderBlue}`}>
                      <span>Your Session Starts In</span>
                    </div>
                    <div className={styles.chewyBody}>
                      <div className={styles.countdownValueDisplay}>{countdownText}</div>
                      <div className={styles.reviewEarnNotice}>
                        Join room activates {data.sessionAccess?.joinBeforeMinutes || 5}m prior
                      </div>
                    </div>
                  </div>
                </div>
              ) : (requestStatus === "new" || requestStatus === "pending") ? (
                <div className={styles.completedBadgeWrap}>
                  <div className={styles.chewyCard}>
                    <div className={`${styles.chewyTopHeader} ${styles.chewyTopHeaderAmber}`}>
                      <span>Awaiting Your Acceptance</span>
                    </div>
                    <div className={styles.chewyBody}>
                      <h3 className={styles.chewyTitle}>New Consultation Request</h3>
                      <p className={styles.chewyDesc}>
                        {data.client.name} requested a {data.sessionDetails.duration} session on {data.sessionDetails.requestedDate}.
                      </p>
                      <div style={{ display: "flex", gap: "10px", marginTop: "12px", width: "100%" }}>
                        <ContinueButton
                          label="Accept Request"
                          onClick={() => setShowAcceptModal(true)}
                          className={styles.giveReviewBtn}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeclineModal(true)}
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "14px",
                            border: "1px solid var(--scorpion)",
                            background: "transparent",
                            color: "var(--ink)",
                            cursor: "pointer",
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
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
                    <h1 className={styles.summaryTitle}>{data.sessionDetails.format}</h1>
                    <p className={styles.summaryMeta}>
                      Request ID: {data.id} • Submitted on {data.submittedDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.sessionGrid}>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Scheduled For</span>
                  <strong className={styles.sessionValue}>{data.sessionDetails.requestedDate}</strong>
                  <span className={styles.sessionHint}>{data.sessionDetails.duration}</span>
                </div>

                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Duration & Format</span>
                  <strong className={styles.sessionValue}>{data.sessionDetails.duration}</strong>
                  <span className={styles.sessionHint}>{data.sessionDetails.format} • {data.sessionDetails.language}</span>
                </div>
              </div>
            </article>
          </div>

          {/* Right Sidebar Column */}
          <aside className={styles.rightCol}>
            <div className={styles.rightColInner}>
              {/* Payment Summary Card */}
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
                      <span>Consultation Fee</span>
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

                  <SecondaryCTA
                    label="Download Summary PDF"
                    showArrow={false}
                    leadingIcon={<Download size={14} aria-hidden="true" />}
                    onClick={() => window.print()}
                    className={styles.sidebarInvoiceBtn}
                  />
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>

              {/* Manage Request Card */}
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

              {/* Need Assistance Box */}
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
