"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  ClipboardList,
  Coins,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Headphones,
  Info,
  Languages,
  Lock,
  MapPin,
  MessageSquare,
  Play,
  Save,
  Shield,
  ShieldCheck,
  Star,
  Unlock,
  Users,
  Video,
  X,
  Zap,
  Bell,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import ReviewScreen from "@/components/seeker/bookings/ReviewScreen";
import Lottie from "lottie-react";
import coinAnimation from "@/public/Lottie/coin_p.json";
import ReportForm from "@/app/seeker/report/[bookingId]/ReportForm";
import { formatCurrency, getPokeState, savePokeState, type BookingDetail } from "@/lib/seekerDashboard";
import type { ConsultationType } from "@/lib/booking";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import styles from "./AdminBookingDetailInfo.module.css";

type AdminBookingDetailInfoProps = {
  booking: BookingDetail;
  sessionState?: "detail" | "active" | "review" | "completed";
  onJoinSession?: () => void;
  onSubmitReview?: (rating: number, comment: string) => void;
  submittedReview?: {
    rating: number;
    comment: string;
    date: string;
  } | null;
  notes?: string;
  isAdmin?: boolean;
  onBack?: () => void;
  user?: ExpertUser | SeekerUser;
  isExpert?: boolean;
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

export default function AdminBookingDetailInfo({
  booking,
  sessionState = "detail",
  onJoinSession,
  onSubmitReview = () => {},
  submittedReview = null,
  notes = "",
  isAdmin = true,
  onBack,
  user,
  isExpert = false,
}: AdminBookingDetailInfoProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEffectiveAdmin = true;
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Seeker Visibility Toggles for Session Artifacts
  const [seekerVisibility, setSeekerVisibility] = useState({
    transcript: true,
    video: true,
    chat: true,
    notes: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSeekerVisibility = (key: "transcript" | "video" | "chat" | "notes") => {
    setSeekerVisibility((prev) => {
      const nextVal = !prev[key];
      const labelMap = {
        transcript: "Full Transcript",
        video: "Recording (Video)",
        chat: "Chat Log",
        notes: "Shared Notes",
      };
      showToast(
        nextVal
          ? `✓ Seeker can now view ${labelMap[key]}`
          : `🔒 ${labelMap[key]} is now HIDDEN from Seeker (Admin & Expert only)`
      );
      return { ...prev, [key]: nextVal };
    });
  };

  const [fastForwarded, setFastForwarded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.sessionStorage.getItem("fast_forward_timer") === "true" ||
        window.location.search.includes("testJoin") ||
        window.location.search.includes("action=join")
      );
    }
    return false;
  });

  useEffect(() => {
    setMounted(true);
    if (searchParams?.get("action") === "review") {
      setIsReviewModalOpen(true);
    }
  }, [searchParams]);

  const [activeContentTab, setActiveContentTab] = useState<"transcript" | "video" | "chat" | "notes">("transcript");
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const [pokeState, setPokeState] = useState<{
    count: number;
    lastPokedAt: number | null;
  }>({
    count: 0,
    lastPokedAt: null,
  });

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    if (searchParams?.get("action") === "review") {
      router.replace(pathname);
    }
  };

  const isVideoCall =
    booking.consultationType === "video" ||
    booking.consultationType === "shoutout" ||
    booking.consultationType === "group";

  const handleDownloadTranscript = () => {
    const text = `SESSION TRANSCRIPT - ${booking.referenceId}
Consultation: ${booking.consultationLabel} with ${booking.expert.name}
Date: ${booking.scheduledDateLabel}, ${booking.scheduledTimeLabel}
Topic: ${booking.subject || "General Consultation"}

[00:01] ${booking.expert.name}: Hello! Thanks for joining today's session. I've reviewed your context on "${booking.subject || 'your question'}". Let me share my screen and walk through the details.
[00:03] You: Hi! Yes, I'm excited. I specifically want to focus on cap table structure, valuation benchmarks, and key execution steps.
[00:07] ${booking.expert.name}: Great question. For early-stage funding rounds, your primary focus should be keeping dilution bounded to 15-20% rather than optimizing solely for valuation.
[00:15] ${booking.expert.name}: Let's break this down into three core milestones for your investor decks and cap table assumptions.
[00:28] You: That makes complete sense. How do we structure the convertible notes in this scenario?
[00:35] ${booking.expert.name}: I recommend using a standard post-money SAFE with a valuation cap aligned with current revenue multiples in your sector.
[00:45] ${booking.expert.name}: I have listed the checklist of documents you will need in the session notes.`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Transcript_${booking.referenceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadChatLog = () => {
    const text = `SAVED CHAT LOG - ${booking.referenceId}
Expert: ${booking.expert.name}
Date: ${booking.scheduledDateLabel}, ${booking.scheduledTimeLabel}
Subject: ${booking.subject || "Consultation Chat"}

[12:00 PM] ${booking.expert.name}: Hello! Thanks for scheduling our session.
[12:01 PM] You: Hi! Excited for this discussion.
[12:02 PM] ${booking.expert.name}: Sure thing, let's review your question: "${booking.subject || "Consultation"}".
[12:05 PM] ${booking.expert.name}: I have uploaded the financial projection template in the shared workspace.
[12:12 PM] You: Received! Looking through the cap table assumptions now.
[12:20 PM] ${booking.expert.name}: Let me know if you need help with any specific formulas.
[12:35 PM] You: This is super helpful, thank you so much!`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Chat_Log_${booking.referenceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNotes = () => {
    const text = `SAVED SESSION NOTES - ${booking.referenceId}
Expert: ${booking.expert.name}
Date: ${booking.scheduledDateLabel}, ${booking.scheduledTimeLabel}
Topic: ${booking.subject || "Consultation"}

${notes || `1. Valuation & Cap Table:
   - Dilution target: 15-20% max for seed round.
   - Ensure clean anti-dilution terms & post-money SAFE standard.

2. Financial Model & Projections:
   - Separate SaaS recurring revenue from one-off setup fees.
   - Refine gross margin calculations factoring in cloud hosting & customer success.

3. Action Items & Next Steps:
   - Refine financial projections slide with 3-year scenario analysis.
   - Prepare target investor list for warm introductions.
   - Complete trademark & IP assignment documentation.`}`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Session_Notes_${booking.referenceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyNotes = () => {
    const text = notes || `1. Valuation & Cap Table:\n   - Dilution target: 15-20% max for seed round.\n   - Ensure clean anti-dilution terms.\n2. Action Items:\n   - Refine financial projections slide.\n   - Prepare target investor list for warm intros.`;
    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleCopyTranscript = () => {
    const text = `[00:01] ${booking.expert.name}: Hello! Thanks for joining today's session.\n[00:03] You: Hi! I want to focus on cap table structure.\n[00:07] ${booking.expert.name}: Dilution bounded to 15-20% is recommended.`;
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  useEffect(() => {
    setPokeState(getPokeState(booking.id));
  }, [booking.id]);

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const ConsultationIcon = CONSULTATION_ICONS[booking.consultationType] || Video;
  const nameParts = booking.expert.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const expertDomain =
    booking.expert.category ||
    booking.specialty ||
    booking.expert.topics?.[0] ||
    (isExpert && user ? (user as ExpertUser).category : null) ||
    booking.expert.role ||
    "Domain";

  return (
    <section className={styles.detail}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toastAlert}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className={`container ${styles.detailInner}`}>
        {/* Top Navigation */}
        <div className={styles.pageTop}>
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                router.back();
              }
            }}
            className={styles.backLink}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Session History &amp; Calendar
          </button>
        </div>

        <div className={styles.mainGrid}>
          {/* Column 1: Expert Photo Card + Payment Summary + Manage Booking (Single Column Stack) */}
          <div className={styles.expertLeftCol}>
            {/* Expert Photo Card */}
            <article className={styles.bookingExpertCard}>
              {expertDomain ? (
                <div className={styles.expertCategoryBadge}>
                  <span className={styles.expertCategoryDot} />
                  {expertDomain.toUpperCase()}
                </div>
              ) : null}
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

            {/* Payment Summary Box */}
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
                    className={`${styles.paymentBadge} ${
                      booking.paymentStatus === "paid"
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

            {/* Manage Booking Box */}
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
                  <button
                    type="button"
                    onClick={() => showToast("Admin: Reschedule prompt dispatched.")}
                    className={styles.manageAction}
                  >
                    <span className={styles.manageActionIcon} aria-hidden="true">
                      <CalendarClock size={18} />
                    </span>
                    <span className={styles.manageActionCopy}>
                      <strong>Reschedule Session</strong>
                      <span>Change date or time (Free up to 24h before)</span>
                    </span>
                  </button>

                  {booking.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => showToast("Admin: Cancellation process triggered.")}
                      className={styles.manageAction}
                    >
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
          </div>

          {/* Column 2: 2-Column Expert Info + Session Details + Artifacts */}
          <div className={styles.rightMainCol}>
            {/* 2-Column Expert Info */}
            <div className={styles.bookingExpertInfo}>
              <div className={styles.bookingExpertInfoCol1}>
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
              </div>

              <div className={styles.bookingExpertInfoCol2}>
                <p className={styles.bioText}>{booking.expert.bio || booking.expert.desc}</p>
              </div>
            </div>

            {/* Session Details Card */}
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
              </div>

              <div className={styles.sessionGrid}>
                {/* Column 1: Scheduled For */}
                <div className={styles.sessionInset}>
                  <span className={styles.sessionLabel}>Scheduled For</span>
                  <strong className={styles.sessionValue}>{booking.scheduledDateLabel}</strong>
                  <span className={styles.sessionHint}>{booking.scheduledTimeLabel}</span>
                </div>

                {/* Column 2: Duration */}
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

            {/* Session Recordings & Notes Artifacts Card */}
            <article className={styles.artifactsCard}>
              <div className={styles.artifactsHeader}>
                <div className={styles.artifactsHeaderLeft}>
                  <ClipboardList size={18} className={styles.artifactsHeaderIcon} />
                  <h3 className={styles.artifactsTitle}>Session Recordings &amp; Notes</h3>
                </div>

                {/* Content Toggle Buttons */}
                <div className={styles.contentToggleBar} role="tablist" aria-label="Session content toggle">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeContentTab === "transcript"}
                    className={`${styles.contentToggleBtn} ${activeContentTab === "transcript" ? styles.contentToggleBtnActive : ""}`}
                    onClick={() => setActiveContentTab("transcript")}
                  >
                    <FileText size={14} />
                    <span>Transcript</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeContentTab === "video"}
                    className={`${styles.contentToggleBtn} ${activeContentTab === "video" ? styles.contentToggleBtnActive : ""}`}
                    onClick={() => setActiveContentTab("video")}
                  >
                    <Video size={14} />
                    <span>Recording (Video)</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeContentTab === "chat"}
                    className={`${styles.contentToggleBtn} ${activeContentTab === "chat" ? styles.contentToggleBtnActive : ""}`}
                    onClick={() => setActiveContentTab("chat")}
                  >
                    <MessageSquare size={14} />
                    <span>Chat Log</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeContentTab === "notes"}
                    className={`${styles.contentToggleBtn} ${activeContentTab === "notes" ? styles.contentToggleBtnActive : ""}`}
                    onClick={() => setActiveContentTab("notes")}
                  >
                    <ClipboardList size={14} />
                    <span>Shared Notes</span>
                  </button>
                </div>
              </div>

              <div className={styles.artifactsContentPanel}>
                {/* 1. Transcript Tab Content */}
                {activeContentTab === "transcript" && (
                  <div className={styles.tabContentFadeIn}>
                    {/* Seeker Permission & Visibility Toggle */}
                    <div className={styles.visibilityControlBar}>
                      <div className={styles.visibilityControlLeft}>
                        <div
                          className={`${styles.visibilityIconWrap} ${
                            seekerVisibility.transcript ? styles.visibilityIconWrapActive : styles.visibilityIconWrapLocked
                          }`}
                        >
                          {seekerVisibility.transcript ? <Eye size={16} /> : <EyeOff size={16} />}
                        </div>
                        <div className={styles.visibilityControlText}>
                          <strong>Seeker Access: Conversation Transcript</strong>
                          <span>
                            {seekerVisibility.transcript
                              ? "Seeker can read and export the full conversation transcript"
                              : "Restricted to Admin & Expert only. Hidden from Seeker."}
                          </span>
                        </div>
                      </div>

                      <div className={styles.visibilityToggleSwitchWrap}>
                        <label className={styles.switch} title="Toggle Seeker Access">
                          <input
                            type="checkbox"
                            checked={seekerVisibility.transcript}
                            onChange={() => handleToggleSeekerVisibility("transcript")}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.tabContentTopBar}>
                      <div className={styles.tabContentMeta}>
                        <strong>Full Conversation Transcript</strong>
                        <span>Auto-generated speaker-diarized transcript</span>
                      </div>
                      <div className={styles.tabActionGroup}>
                        <SecondaryCTA
                          label="Download (.txt)"
                          showArrow={false}
                          leadingIcon={<Download size={13} />}
                          onClick={handleDownloadTranscript}
                          className={styles.tabDownloadCTA}
                        />
                      </div>
                    </div>

                    <div className={styles.transcriptBox}>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:01</span>
                        <strong className={styles.transcriptSpeaker}>{booking.expert.name}:</strong>
                        <span>Hello! Thanks for joining today&apos;s session. I&apos;ve reviewed your context on &quot;{booking.subject || 'your question'}&quot;. Let me share my screen and walk through the details.</span>
                      </div>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:03</span>
                        <strong className={styles.transcriptSpeaker}>You:</strong>
                        <span>Hi! Yes, I&apos;m excited. I specifically want to focus on cap table structure, valuation benchmarks, and key execution steps.</span>
                      </div>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:07</span>
                        <strong className={styles.transcriptSpeaker}>{booking.expert.name}:</strong>
                        <span>Great question. For early-stage funding rounds, your primary focus should be keeping dilution bounded to 15-20% rather than optimizing solely for valuation.</span>
                      </div>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:15</span>
                        <strong className={styles.transcriptSpeaker}>{booking.expert.name}:</strong>
                        <span>Let&apos;s break this down into three core milestones for your investor decks and cap table assumptions.</span>
                      </div>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:28</span>
                        <strong className={styles.transcriptSpeaker}>You:</strong>
                        <span>That makes complete sense. How do we structure the convertible notes in this scenario?</span>
                      </div>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:35</span>
                        <strong className={styles.transcriptSpeaker}>{booking.expert.name}:</strong>
                        <span>I recommend using a standard post-money SAFE with a valuation cap aligned with current revenue multiples in your sector.</span>
                      </div>
                      <div className={styles.transcriptLine}>
                        <span className={styles.transcriptTime}>00:45</span>
                        <strong className={styles.transcriptSpeaker}>{booking.expert.name}:</strong>
                        <span>I have listed the checklist of documents you will need in the session notes.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Recording (Video) Tab Content */}
                {activeContentTab === "video" && (
                  <div className={styles.tabContentFadeIn}>
                    {/* Seeker Permission & Visibility Toggle */}
                    <div className={styles.visibilityControlBar}>
                      <div className={styles.visibilityControlLeft}>
                        <div
                          className={`${styles.visibilityIconWrap} ${
                            seekerVisibility.video ? styles.visibilityIconWrapActive : styles.visibilityIconWrapLocked
                          }`}
                        >
                          {seekerVisibility.video ? <Eye size={16} /> : <EyeOff size={16} />}
                        </div>
                        <div className={styles.visibilityControlText}>
                          <strong>Seeker Access: Video Recording</strong>
                          <span>
                            {seekerVisibility.video
                              ? "Seeker can stream, playback, and download the full video recording"
                              : "Video recording playback is hidden from Seeker dashboard"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.visibilityToggleSwitchWrap}>
                        <label className={styles.switch} title="Toggle Seeker Access">
                          <input
                            type="checkbox"
                            checked={seekerVisibility.video}
                            onChange={() => handleToggleSeekerVisibility("video")}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.tabContentTopBar}>
                      <div className={styles.tabContentMeta}>
                        <strong>Recorded Videos &amp; Clips</strong>
                        <span>High-definition video captures available for playback</span>
                      </div>
                    </div>

                    <div className={styles.videoGrid}>
                      <div className={styles.videoCard}>
                        <div className={styles.videoThumbWrap}>
                          <Image
                            src={booking.expert.image}
                            alt="Session Video Recording"
                            fill
                            className={styles.videoThumbImg}
                          />
                          <div
                            className={styles.videoPlayOverlay}
                            onClick={() => showToast("Playing full session recording...")}
                          >
                            <Play size={28} color="#ffffff" fill="#ffffff" />
                          </div>
                          <span className={styles.videoDurationTag}>45:12</span>
                        </div>
                        <div className={styles.videoInfo}>
                          <div className={styles.videoTitleRow}>
                            <strong className={styles.videoTitle}>Full Session Recording</strong>
                            <button
                              type="button"
                              className={styles.videoDownloadIconBtn}
                              onClick={() => {
                                showToast("Downloading full session video MP4 (320 MB)...");
                              }}
                              aria-label="Download Full Session Recording"
                              title="Download Video"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                          <span className={styles.videoMeta}>1080p MP4 Video • 320 MB</span>
                        </div>
                      </div>

                      <div className={styles.videoCard}>
                        <div className={styles.videoThumbWrap}>
                          <Image
                            src={booking.expert.image}
                            alt="Session Highlight Clip"
                            fill
                            className={styles.videoThumbImg}
                          />
                          <div
                            className={styles.videoPlayOverlay}
                            onClick={() => showToast("Playing highlight clip...")}
                          >
                            <Play size={28} color="#ffffff" fill="#ffffff" />
                          </div>
                          <span className={styles.videoDurationTag}>05:15</span>
                        </div>
                        <div className={styles.videoInfo}>
                          <div className={styles.videoTitleRow}>
                            <strong className={styles.videoTitle}>Key Highlights &amp; Summary Clip</strong>
                            <button
                              type="button"
                              className={styles.videoDownloadIconBtn}
                              onClick={() => {
                                showToast("Downloading highlight clip MP4...");
                              }}
                              aria-label="Download Session Highlight Clip"
                              title="Download Clip"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                          <span className={styles.videoMeta}>MP4 Video • 42 MB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Chat Log Tab Content */}
                {activeContentTab === "chat" && (
                  <div className={styles.tabContentFadeIn}>
                    {/* Seeker Permission & Visibility Toggle */}
                    <div className={styles.visibilityControlBar}>
                      <div className={styles.visibilityControlLeft}>
                        <div
                          className={`${styles.visibilityIconWrap} ${
                            seekerVisibility.chat ? styles.visibilityIconWrapActive : styles.visibilityIconWrapLocked
                          }`}
                        >
                          {seekerVisibility.chat ? <Eye size={16} /> : <EyeOff size={16} />}
                        </div>
                        <div className={styles.visibilityControlText}>
                          <strong>Seeker Access: In-Call Chat Log</strong>
                          <span>
                            {seekerVisibility.chat
                              ? "Seeker can review message history and shared resource links"
                              : "Chat history is restricted from seeker view"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.visibilityToggleSwitchWrap}>
                        <label className={styles.switch} title="Toggle Seeker Access">
                          <input
                            type="checkbox"
                            checked={seekerVisibility.chat}
                            onChange={() => handleToggleSeekerVisibility("chat")}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.tabContentTopBar}>
                      <div className={styles.tabContentMeta}>
                        <strong>Saved Chat History</strong>
                        <span>Complete session conversation &amp; resources shared</span>
                      </div>
                      <SecondaryCTA
                        label="Download Chat Log (.txt)"
                        showArrow={false}
                        leadingIcon={<Download size={13} />}
                        onClick={handleDownloadChatLog}
                        className={styles.tabDownloadCTA}
                      />
                    </div>

                    <div className={styles.chatLogContainer}>
                      <div className={styles.chatMessageItem}>
                        <div className={styles.chatMsgAvatar}>
                          <Image src={booking.expert.image} alt={booking.expert.name} fill className={styles.chatAvatarImg} />
                        </div>
                        <div className={styles.chatMsgBubble}>
                          <div className={styles.chatMsgHeader}>
                            <strong>{booking.expert.name}</strong>
                            <span className={styles.chatMsgTime}>12:00 PM</span>
                          </div>
                          <p className={styles.chatMsgText}>
                            Hello! Thanks for scheduling our session. I&apos;ve reviewed your question: &quot;{booking.subject || "Consultation"}&quot;.
                          </p>
                        </div>
                      </div>

                      <div className={`${styles.chatMessageItem} ${styles.chatMessageItemSeeker}`}>
                        <div className={styles.chatMsgBubble}>
                          <div className={styles.chatMsgHeader}>
                            <strong>You</strong>
                            <span className={styles.chatMsgTime}>12:01 PM</span>
                          </div>
                          <p className={styles.chatMsgText}>
                            Hi, yes! I&apos;m ready. I want to dive into the specifics.
                          </p>
                        </div>
                      </div>

                      <div className={styles.chatMessageItem}>
                        <div className={styles.chatMsgAvatar}>
                          <Image src={booking.expert.image} alt={booking.expert.name} fill className={styles.chatAvatarImg} />
                        </div>
                        <div className={styles.chatMsgBubble}>
                          <div className={styles.chatMsgHeader}>
                            <strong>{booking.expert.name}</strong>
                            <span className={styles.chatMsgTime}>12:05 PM</span>
                          </div>
                          <p className={styles.chatMsgText}>
                            I have uploaded the valuation framework and templates in our shared call notes for you.
                          </p>
                        </div>
                      </div>

                      <div className={`${styles.chatMessageItem} ${styles.chatMessageItemSeeker}`}>
                        <div className={styles.chatMsgBubble}>
                          <div className={styles.chatMsgHeader}>
                            <strong>You</strong>
                            <span className={styles.chatMsgTime}>12:12 PM</span>
                          </div>
                          <p className={styles.chatMsgText}>
                            Thank you! This is very helpful.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Shared Notes Tab Content */}
                {activeContentTab === "notes" && (
                  <div className={styles.tabContentFadeIn}>
                    {/* Seeker Permission & Visibility Toggle */}
                    <div className={styles.visibilityControlBar}>
                      <div className={styles.visibilityControlLeft}>
                        <div
                          className={`${styles.visibilityIconWrap} ${
                            seekerVisibility.notes ? styles.visibilityIconWrapActive : styles.visibilityIconWrapLocked
                          }`}
                        >
                          {seekerVisibility.notes ? <Eye size={16} /> : <EyeOff size={16} />}
                        </div>
                        <div className={styles.visibilityControlText}>
                          <strong>Seeker Access: Shared Notes &amp; Action Items</strong>
                          <span>
                            {seekerVisibility.notes
                              ? "Seeker can view, copy, and download all shared session notes"
                              : "Session notes are currently hidden from the seeker"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.visibilityToggleSwitchWrap}>
                        <label className={styles.switch} title="Toggle Seeker Access">
                          <input
                            type="checkbox"
                            checked={seekerVisibility.notes}
                            onChange={() => handleToggleSeekerVisibility("notes")}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.tabContentTopBar}>
                      <div className={styles.tabContentMeta}>
                        <strong>Saved Session Notes &amp; Action Items</strong>
                        <span>Key decisions, recommendations, and next steps</span>
                      </div>
                      <div className={styles.tabActionGroup}>
                        <SecondaryCTA
                          label="Download Notes (.txt)"
                          showArrow={false}
                          leadingIcon={<Download size={13} />}
                          onClick={handleDownloadNotes}
                          className={styles.tabDownloadCTA}
                        />
                      </div>
                    </div>

                    <div className={styles.notesBox}>
                      <pre className={styles.notesText}>
                        {notes ||
                          `1. Valuation & Cap Table Strategy:\n   - Target equity dilution: 15-20% maximum for seed stage.\n   - Ensure clean anti-dilution terms & post-money SAFE standard.\n\n2. Financial Model & Unit Economics:\n   - Segregate SaaS recurring subscriptions from custom onboarding fees.\n   - Calculate gross margins factoring in cloud compute and 3rd party AI API costs.\n\n3. Action Items & Next Steps:\n   - Refine financial deck slide with 3-year scenario analysis.\n   - Prepare target investor list for warm introductions.\n   - Complete IP assignment and founder vesting schedule documentation.`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>

      {isReportModalOpen && (
        <ReportForm
          booking={booking}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {isReviewModalOpen && mounted && createPortal(
        <div className={styles.reviewModalOverlay} onClick={handleCloseReviewModal}>
          <div
            className={styles.reviewModalWrapper}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <ReviewScreen
              booking={booking}
              onSubmit={(rating, comment) => {
                onSubmitReview(rating, comment);
              }}
              onCancel={handleCloseReviewModal}
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
