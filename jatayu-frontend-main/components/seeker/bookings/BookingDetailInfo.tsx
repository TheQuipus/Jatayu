"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Clapperboard,
  ClipboardList,
  Download,
  Flag,
  Headphones,
  Info,
  Languages,
  MapPin,
  MessageSquare,
  Shield,
  Star,
  Users,
  Video,
  X,
  Zap,
  Bell,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import ReportForm from "@/app/seeker/report/[bookingId]/ReportForm";
import { formatCurrency, getPokeState, savePokeState, type BookingDetail } from "@/lib/seekerDashboard";
import type { ConsultationType } from "@/lib/booking";
import styles from "./BookingDetailInfo.module.css";

type BookingDetailInfoProps = {
  booking: BookingDetail;
  sessionState: "detail" | "active" | "review" | "completed";
  onJoinSession: () => void;
  onSubmitReview: (rating: number, comment: string) => void;
  submittedReview: {
    rating: number;
    comment: string;
    date: string;
  } | null;
  notes: string;
};

const CONSULTATION_ICONS: Record<ConsultationType, typeof MessageSquare> = {
  text: MessageSquare,
  video: Video,
  shoutout: Clapperboard,
  group: Users,
};

function handleDownloadInvoice(booking: BookingDetail) {
  const lines = [
    "JATAYU INVOICE",
    "",
    `Invoice ID: ${booking.invoiceId}`,
    `Booking ID: ${booking.referenceId}`,
    `Date: ${booking.placedOnLabel}`,
    "",
    `Expert: ${booking.expert.name}`,
    `Consultation: ${booking.consultationLabel}`,
    `Schedule: ${booking.scheduledDateLabel}, ${booking.scheduledTimeLabel}`,
    "",
    "LINE ITEMS",
    `${booking.consultationLabel}\t${formatCurrency(booking.consultationFee)}`,
    `Platform Fee\t${formatCurrency(booking.platformFee)}`,
    `GST (18%)\t${formatCurrency(booking.gst)}`,
    ...(booking.walletApplied > 0
      ? [`Jatayu Credits Applied\t− ${formatCurrency(booking.walletApplied)}`]
      : []),
    "",
    `Total Paid\t${formatCurrency(booking.totalPaid)}`,
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${booking.invoiceId}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BookingDetailInfo({
  booking,
  sessionState,
  onJoinSession,
  onSubmitReview,
  submittedReview,
  notes,
}: BookingDetailInfoProps) {
  const router = useRouter();
  const [pokeState, setPokeState] = useState<{
    count: number;
    lastPokedAt: number | null;
  }>({
    count: 0,
    lastPokedAt: null,
  });

  useEffect(() => {
    setPokeState(getPokeState(booking.id));
  }, [booking.id]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [pokeFeedback, setPokeFeedback] = useState<string | null>(null);

  const [feedbackStates, setFeedbackStates] = useState<Record<string, {
    rating: number | null;
    category: string | null;
    comment: string;
    submitted: boolean;
  }>>({});

  const [completedRating, setCompletedRating] = useState<number>(0);
  const [completedHoverRating, setCompletedHoverRating] = useState<number | null>(null);
  const [completedComment, setCompletedComment] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);



  const handleSelectRating = (rating: number) => {
    setFeedbackStates((prev) => {
      const current = prev[booking.id];
      const newRating = current?.rating === rating ? null : rating;
      return {
        ...prev,
        [booking.id]: {
          ...(current || { category: null, comment: "", submitted: false }),
          rating: newRating,
          category: newRating === null ? null : (current?.category || null),
        },
      };
    });
  };

  const handleSelectCategory = (category: string) => {
    setFeedbackStates((prev) => ({
      ...prev,
      [booking.id]: {
        ...(prev[booking.id] || { rating: null, comment: "", submitted: false }),
        category,
      },
    }));
  };

  const handleChangeComment = (comment: string) => {
    setFeedbackStates((prev) => ({
      ...prev,
      [booking.id]: {
        ...(prev[booking.id] || { rating: null, category: null, submitted: false }),
        comment,
      },
    }));
  };

  const handleSubmitFeedback = () => {
    setFeedbackStates((prev) => ({
      ...prev,
      [booking.id]: {
        ...(prev[booking.id] || { rating: null, category: null, comment: "" }),
        submitted: true,
      },
    }));
  };

  useEffect(() => {
    const shouldRunInterval =
      (booking.status === "pending" && pokeState.lastPokedAt !== null && pokeState.count < 2) ||
      (booking.status === "confirmed" && sessionState !== "completed");

    if (!shouldRunInterval) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [pokeState.lastPokedAt, pokeState.count, booking.status, sessionState]);

  const cooldownSeconds = (() => {
    if (pokeState.lastPokedAt === null || pokeState.count >= 2) {
      return 0;
    }
    const elapsedMs = currentTime - pokeState.lastPokedAt;
    const remainingMs = (4 * 60 * 60 * 1000) - elapsedMs;
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  })();

  const isOneHourPassed = booking.placedDaysAgo > 0 || booking.placedDaysAgo === undefined;

  const timeStatus = useMemo(() => {
    if (booking.status !== "confirmed") return booking.status;

    const targetDate = new Date(currentTime);
    targetDate.setDate(targetDate.getDate() + booking.dayOffset);
    targetDate.setHours(booking.startHour, booking.startMinute, 0, 0);

    const startDiffMs = targetDate.getTime() - currentTime;

    if (startDiffMs > 5 * 60 * 1000) {
      return "upcoming";
    } else {
      return "active";
    }
  }, [booking, currentTime]);

  const isCompletedSession = sessionState === "completed" || booking.status === "completed";

  const countdownText = useMemo(() => {
    if (isCompletedSession || timeStatus !== "upcoming") {
      return null;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + booking.dayOffset);
    targetDate.setHours(booking.startHour, booking.startMinute, 0, 0);

    const diffMs = targetDate.getTime() - currentTime;
    // Activate join session button 5 minutes prior to meeting start time
    if (diffMs <= 5 * 60 * 1000) {
      return null;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    if (totalDays > 0) {
      const remainingHours = totalHours % 24;
      const dd = String(totalDays).padStart(2, "0");
      const hh = String(remainingHours).padStart(2, "0");
      return `${dd}D:${hh}H`;
    } else {
      const remainingMinutes = totalMinutes % 60;
      const hh = String(totalHours).padStart(2, "0");
      const mm = String(remainingMinutes).padStart(2, "0");
      return `${hh}H:${mm}M`;
    }
  }, [booking, currentTime, sessionState]);

  const formatCooldown = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const handlePoke = () => {
    if (pokeState.count >= 2) return;
    if (!isOneHourPassed) return;
    if (cooldownSeconds > 0) return;

    const nextCount = pokeState.count + 1;
    const now = Date.now();

    setPokeState({
      count: nextCount,
      lastPokedAt: now,
    });
    savePokeState(booking.id, nextCount, now);

    setPokeFeedback("Expert poked successfully! A priority alert has been sent.");
    setTimeout(() => {
      setPokeFeedback(null);
    }, 4000);
  };

  const renderCancelledFeedbackForm = () => {
    const feedback = feedbackStates[booking.id] || {
      rating: null,
      category: null,
      comment: "",
      submitted: false,
    };

    const ratingLabels: Record<number, string> = {
      1: "Bad",
      2: "Poor",
      3: "Fare",
      4: "Good",
      5: "Excellent",
    };

    if (feedback.submitted) {
      return (
        <div className={styles.feedbackSuccess}>
          <span className={styles.successStar}>✦</span>
          <p className={styles.successText}>
            Review submitted.
          </p>
        </div>
      );
    }

    return (
      <div className={styles.detailFeedbackForm}>
        <div className={styles.detailStarsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.detailStarBtn}
              onClick={() => handleSelectRating(star)}
              aria-label={`Rate ${star} star`}
            >
              <Star
                size={24}
                fill={feedback.rating && star <= feedback.rating ? "#EAB308" : "transparent"}
                stroke={feedback.rating && star <= feedback.rating ? "#EAB308" : "var(--dove-gray)"}
              />
            </button>
          ))}
          {feedback.rating && (
            <span className={styles.detailRatingLabelText}>
              {ratingLabels[feedback.rating]}
            </span>
          )}
        </div>

        {feedback.rating && (
          <div className={styles.detailFeedbackDetailsBlock}>
            {feedback.rating <= 3 ? (
              <div className={styles.detailWrongCategoryBox}>
                <span className={styles.detailInputLabel}>What went wrong? *</span>
                <div className={styles.detailCategoriesList}>
                  {["Expert No show", "Didnt Accepted Request", "Other"].map((cat) => (
                    <label key={cat} className={styles.detailCategoryLabel}>
                      <input
                        type="radio"
                        name={`detail_wrong_category_${booking.id}`}
                        checked={feedback.category === cat}
                        onChange={() => handleSelectCategory(cat)}
                        className={styles.detailCategoryRadio}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)..."
                  value={feedback.comment}
                  onChange={(e) => handleChangeComment(e.target.value)}
                  className={styles.detailFeedbackTextarea}
                />
                <ContinueButton
                  disabled={!feedback.category && !feedback.comment.trim()}
                  onClick={handleSubmitFeedback}
                  label="Submit Feedback"
                  className={styles.detailSubmitReviewBtn}
                />
              </div>
            ) : (
              <div className={styles.detailPositiveFeedbackBox}>
                <span className={styles.detailInputLabel}>Write a review (optional)</span>
                <p className={styles.detailEarnCreditsHint}>Earn credits for sharing your review!</p>
                <textarea
                  placeholder="Share details about your experience..."
                  value={feedback.comment}
                  onChange={(e) => handleChangeComment(e.target.value)}
                  className={styles.detailFeedbackTextarea}
                />
                <ContinueButton
                  disabled={!feedback.rating && !feedback.comment.trim()}
                  onClick={handleSubmitFeedback}
                  label="Submit & Earn Credits"
                  className={styles.detailSubmitReviewBtn}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleCompletedReviewSubmit = () => {
    if (completedRating === 0) return;
    onSubmitReview(completedRating, completedComment.trim());
  };

  const renderCompletedFeedbackForm = () => {
    const ratingLabels: Record<number, string> = {
      1: "Bad",
      2: "Poor",
      3: "Fare",
      4: "Good",
      5: "Excellent",
    };

    return (
      <div className={styles.detailFeedbackForm}>
        <div className={styles.detailStarsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.detailStarBtn}
              onMouseEnter={() => setCompletedHoverRating(star)}
              onMouseLeave={() => setCompletedHoverRating(null)}
              onClick={() => setCompletedRating((prev) => (prev === star ? 0 : star))}
              aria-label={`Rate ${star} star`}
            >
              <Star
                size={24}
                fill={
                  completedHoverRating !== null
                    ? star <= completedHoverRating
                      ? "#EAB308"
                      : "transparent"
                    : star <= completedRating
                      ? "#EAB308"
                      : "transparent"
                }
                stroke={
                  completedHoverRating !== null
                    ? star <= completedHoverRating
                      ? "#EAB308"
                      : "var(--dove-gray)"
                    : star <= completedRating
                      ? "#EAB308"
                      : "var(--dove-gray)"
                }
              />
            </button>
          ))}
          {completedRating > 0 && (
            <span className={styles.detailRatingLabelText}>
              {ratingLabels[completedRating]}
            </span>
          )}
        </div>

        <div className={styles.detailFeedbackDetailsBlock} style={{ marginTop: 10 }}>
          <span className={styles.detailInputLabel}>Write a review</span>
          <textarea
            placeholder="Share details about your experience..."
            value={completedComment}
            onChange={(e) => setCompletedComment(e.target.value)}
            className={styles.detailFeedbackTextarea}
            rows={4}
          />
          <ContinueButton
            disabled={completedRating === 0 && !completedComment.trim()}
            onClick={handleCompletedReviewSubmit}
            label="Submit Review"
            className={styles.detailSubmitReviewBtn}
            style={{ marginTop: 10 }}
          />
        </div>
      </div>
    );
  };

  const ConsultationIcon = CONSULTATION_ICONS[booking.consultationType];
  const nameParts = booking.expert.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <section className={styles.detail}>
      <div className={`container ${styles.detailInner}`}>
        <div className={styles.pageTop}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/seeker/bookings");
              }
            }}
            className={styles.backLink}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Bookings
          </button>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.mainCol}>
            <div className={styles.bookingHero}>
              <article className={styles.bookingExpertCard}>
                <div className={styles.expertCategoryBadge}>
                  <span className={styles.expertCategoryDot} />
                  {(booking.expert.category || booking.expert.topics[0] || "Expert").toUpperCase()}
                </div>
                <div className={styles.bookingExpertImageWrap}>
                  <Image
                    src={booking.expert.image}
                    alt={booking.expert.name}
                    fill
                    className={styles.bookingExpertImage}
                    sizes="348px"
                    priority
                  />
                </div>
                <div className={styles.bookingExpertOverlay}>
                  <p className={styles.bookingExpertName}>
                    {booking.expert.name.toUpperCase()}
                    <BadgeCheck size={18} className={styles.expertVerified} aria-hidden="true" />
                  </p>
                  <p className={styles.bookingExpertDesc}>{booking.expert.desc}</p>
                </div>
              </article>

              <div className={styles.bookingExpertInfo}>
                <h1 className={`display ${styles.displayName}`}>
                  <span>{firstName}</span>
                  <span className="t-muted">{lastName}</span>
                </h1>

                <p className={styles.roleSub}>{booking.expert.role}</p>

                <div className={styles.starDivider}>
                  <span className={styles.dividerStar}>✦</span>
                  <span className={styles.dividerLine} />
                </div>

                <div className={styles.ratingsRow}>
                  <div className={styles.ratingItem}>
                    <Star size={16} fill="#EAB308" stroke="#EAB308" />
                    <span className={styles.ratingText}>
                      <strong>{booking.expert.rating}</strong> ({booking.expert.reviewsCount || 120} reviews)
                    </span>
                  </div>
                  <div className={styles.ratingItem}>
                    <Briefcase size={16} className={styles.statsIcon} />
                    <span className={styles.ratingText}>
                      <strong>{booking.expert.sessionsCompleted || "350+ Sessions Completed"}</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaIconBadge}>
                      <Languages size={13} />
                    </div>
                    <span className={styles.metaVal}>{booking.expert.languages.join(", ")}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaIconBadge}>
                      <MapPin size={13} />
                    </div>
                    <span className={styles.metaVal}>{booking.expert.location || "India"}</span>
                  </div>
                  <div className={`${styles.metaItem} ${styles.metaItemGreen}`}>
                    <Zap size={14} fill="currentColor" />
                    <span className={styles.metaVal}>Replies in {booking.expert.replyTime}</span>
                  </div>
                </div>

                <p className={styles.bioText}>{booking.expert.bio || booking.expert.desc}</p>
              </div>
            </div>

            <div className={styles.badgeFloatAnchor}>
              {(isCompletedSession || submittedReview) ? (
                <div className={styles.completedBadgeWrap}>
                  <span className={styles.completedBadge}>
                    Session Completed
                  </span>
                </div>
              ) : booking.status === "cancelled" ? (
                <div className={styles.cancelledBadgeWrap}>
                  <span className={styles.cancelledBadge}>
                    Session Cancelled
                  </span>
                </div>
              ) : null}
            </div>

            <article className={styles.sessionCard}>
              <div className={styles.sectionHead}>
                <ClipboardList size={16} aria-hidden="true" />
                <h2 className={styles.sectionTitle}>Session Details</h2>
              </div>

              <div className={styles.sessionSummary}>
                <div className={styles.summaryMain}>
                  <span className={styles.summaryIconWrap} aria-hidden="true">
                    <ConsultationIcon size={22} strokeWidth={2} />
                  </span>
                  <div className={styles.summaryCopy}>
                    <h1 className={styles.summaryTitle}>{booking.consultationLabel}</h1>
                    <p className={styles.summaryMeta}>
                      Booking ID: {booking.referenceId} • Placed on {booking.placedOnLabel}
                    </p>
                  </div>
                </div>

                {booking.status === "pending" ? (
                  <div className={styles.sessionSummaryAction}>
                    {!isOneHourPassed ? (
                      <ContinueButton
                        leadingIcon={
                          <Image
                            src="/pointright.svg"
                            alt=""
                            width={16}
                            height={16}
                            className={styles.pokeIconSvg}
                            aria-hidden="true"
                          />
                        }
                        label="Poke Expert (Locked 1h)"
                        disabled
                        className={styles.sessionPokeBtn}
                      />
                    ) : pokeState.count === 0 ? (
                      <ContinueButton
                        leadingIcon={
                          <Image
                            src="/pointright.svg"
                            alt=""
                            width={16}
                            height={16}
                            className={styles.pokeIconSvg}
                            aria-hidden="true"
                          />
                        }
                        label="Poke Expert"
                        onClick={handlePoke}
                        className={styles.sessionPokeBtn}
                      />
                    ) : pokeState.count === 1 && cooldownSeconds > 0 ? (
                      <ContinueButton
                        leadingIcon={
                          <Image
                            src="/pointright.svg"
                            alt=""
                            width={16}
                            height={16}
                            className={styles.pokeIconSvg}
                            aria-hidden="true"
                          />
                        }
                        label={`Poke Cooldown (${formatCooldown(cooldownSeconds)})`}
                        disabled
                        className={styles.sessionPokeBtn}
                      />
                    ) : pokeState.count === 1 && cooldownSeconds === 0 ? (
                      <ContinueButton
                        leadingIcon={
                          <Image
                            src="/pointright.svg"
                            alt=""
                            width={16}
                            height={16}
                            className={styles.pokeIconSvg}
                            aria-hidden="true"
                          />
                        }
                        label="Poke Expert Again"
                        onClick={handlePoke}
                        className={styles.sessionPokeBtn}
                      />
                    ) : (
                      <ContinueButton
                        leadingIcon={
                          <Image
                            src="/pointright.svg"
                            alt=""
                            width={16}
                            height={16}
                            className={styles.pokeIconSvg}
                            aria-hidden="true"
                          />
                        }
                        label="No Pokes Remaining"
                        disabled
                        className={styles.sessionPokeBtn}
                      />
                    )}
                  </div>
                ) : timeStatus === "active" ? (
                  <div className={styles.sessionSummaryAction}>
                    <ContinueButton
                      label="Join Session"
                      onClick={onJoinSession}
                      className={styles.joinSessionBtn}
                    />
                  </div>
                ) : timeStatus === "upcoming" && countdownText ? (
                  <div className={styles.sessionSummaryAction}>
                    <div className={styles.countdownActionWrapper}>
                      <div className={styles.countdownActionText}>
                        {countdownText}
                      </div>
                      <span className={styles.countdownActionHint}>
                        Join room activates 5m prior
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={styles.sessionGrid}>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Scheduled For</span>
                  <strong className={styles.sessionValue}>{booking.scheduledDateLabel}</strong>
                  <span className={styles.sessionHint}>{booking.scheduledTimeLabel}</span>
                </div>
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Duration</span>
                  <strong className={styles.sessionValue}>{booking.durationLabel}</strong>
                  <span className={styles.sessionHint}>{booking.consultationLabel}</span>
                </div>
              </div>

              <div className={styles.contextSection}>
                <span className={styles.fieldLabel}>Your Context / Question</span>
                {booking.subject ? (
                  <p className={styles.contextSubject}>{booking.subject}</p>
                ) : null}
                <p className={styles.contextText}>{booking.context}</p>
              </div>
            </article>

          </div>

          <aside className={styles.rightCol}>
            <div className={styles.rightColInner}>
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
                    <span
                      className={`${styles.paymentBadge} ${booking.paymentStatus === "paid"
                        ? styles.paymentBadgePaid
                        : styles.paymentBadgePending
                        }`}
                    >
                      {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>

                  <div className={styles.priceList}>
                    <div className={styles.priceRow}>
                      <span>Consultation Fee</span>
                      <strong>{formatCurrency(booking.consultationFee)}</strong>
                    </div>
                    {booking.platformFee > 0 ? (
                      <div className={styles.priceRow}>
                        <span>Platform Fee</span>
                        <strong>{formatCurrency(booking.platformFee)}</strong>
                      </div>
                    ) : null}
                    <div className={styles.priceRow}>
                      <span>GST (18%)</span>
                      <strong>{formatCurrency(booking.gst)}</strong>
                    </div>
                    {booking.walletApplied > 0 ? (
                      <div className={`${styles.priceRow} ${styles.walletRow}`}>
                        <span>Wallet Applied</span>
                        <strong>− {formatCurrency(booking.walletApplied)}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total Paid</span>
                    <strong>{formatCurrency(booking.totalPaid)}</strong>
                  </div>

                  <SecondaryCTA
                    label="Download Invoice"
                    showArrow={false}
                    leadingIcon={<Download size={14} aria-hidden="true" />}
                    onClick={() => handleDownloadInvoice(booking)}
                    className={styles.sidebarInvoiceBtn}
                  />
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>

              {sessionState !== "completed" && (
                <div className={styles.bookingBox}>
                  <div className={styles.bookingHeader}>
                    <span className={styles.bookingHeaderTitle}>Manage Booking</span>
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
                      <button type="button" className={styles.manageAction}>
                        <span className={styles.manageActionIcon} aria-hidden="true">
                          <CalendarClock size={18} />
                        </span>
                        <span className={styles.manageActionCopy}>
                          <strong>Reschedule Session</strong>
                          <span>Change date or time (Free up to 24h before)</span>
                        </span>
                      </button>
                      {booking.status !== "cancelled" && (
                        <button type="button" className={styles.manageAction}>
                          <span
                            className={`${styles.manageActionIcon} ${styles.manageActionIconDanger}`}
                            aria-hidden="true"
                          >
                            <X size={18} />
                          </span>
                          <span className={styles.manageActionCopy}>
                            <strong>Cancel Booking</strong>
                            <span>Review cancellation policy before proceeding</span>
                          </span>
                        </button>
                      )}
                    </div>

                    {booking.status !== "cancelled" && (
                      <div className={styles.policyBox}>
                        <Info size={16} className={styles.policyIcon} aria-hidden="true" />
                        <p className={styles.policyText}>
                          <strong>Cancellation Policy:</strong> Free cancellation up to 24
                          hours before the session. 50% refund within 24 hours. No-shows
                          are non-refundable.{" "}
                          <Link href="/terms-of-service/" className={styles.policyLink}>
                            Read full policy
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className={styles.bookingFooter} aria-hidden="true" />
                </div>
              )}

              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Need Help?</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <p className={styles.helpCopy}>
                    Having issues with your booking or the expert? Our support team is
                    here to help.
                  </p>
                  <ul className={styles.helpLinks}>
                    <li>
                      <Link href="/seeker/dashboard/#support" className={styles.helpLink}>
                        <Headphones size={14} aria-hidden="true" />
                        Contact Support
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms-of-service/" className={styles.helpLink}>
                        <Shield size={14} aria-hidden="true" />
                        Quality Assurance Policy
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className={styles.helpLinkDanger}
                      >
                        <Flag size={14} aria-hidden="true" />
                        Report an Issue
                      </button>
                    </li>
                  </ul>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isReportModalOpen && (
        <ReportForm
          booking={booking}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </section>
  );
}
