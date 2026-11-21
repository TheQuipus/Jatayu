"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Inbox,
  Star,
  TimerReset,
  TrendingUp,
  Users,
} from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  EXPERT_PROFILE_HREF,
  EXPERT_PROFILE_EDIT_HREF,
  formatExpertCurrency,
  type EarningsDataPoint,
  type EarningsTimeframe,
  type ExpertRecentSession,
  type ExpertSession,
  type ExpertStat,
  type ExpertTopReview,
} from "@/lib/expertDashboard";
import { fetchExpertDashboardProfile } from "@/lib/expertProfileApi";
import { getExpertDashboardProfileCache } from "@/lib/expertStore";
import {
  getExpertDashboardStats,
  getExpertEarnings,
  getExpertRequests,
  type ClientRequest,
  type ExpertEarningsResponse,
} from "@/lib/api";
import { getExpertReviews, type SessionReview } from "@/lib/reviewApi";
import styles from "./ExpertDashboard.module.css";

const STAT_ICONS = {
  calendar: CalendarDays,
  star: Star,
  users: Users,
  inbox: Inbox,
  "calendar-check": CalendarCheck,
  clock: Clock3,
  timer: TimerReset,
  trend: TrendingUp,
} as const;

type ReviewStepState = "done" | "active" | "pending" | "attention";

type ReviewDisplay = {
  steps: Array<{ label: string; state: ReviewStepState }>;
  note: string;
};

function getReviewDisplay(status: string, reviewerNote?: string | null): ReviewDisplay {
  const note = reviewerNote?.trim();
  switch (status) {
    case "approved":
      return {
        steps: [
          { label: "Application Submitted", state: "done" },
          { label: "Review Completed", state: "done" },
          { label: "Approved", state: "done" },
        ],
        note: note || "Your expert application has been approved and your profile is ready.",
      };
    case "rejected":
      return {
        steps: [
          { label: "Application Submitted", state: "done" },
          { label: "Review Completed", state: "done" },
          { label: "Not Approved", state: "attention" },
        ],
        note: note || "Your application was not approved. Contact support if you need more information.",
      };
    case "on_hold":
      return {
        steps: [
          { label: "Application Submitted", state: "done" },
          { label: "Application On Hold", state: "attention" },
          { label: "Approved", state: "pending" },
        ],
        note: note || "Your application is on hold while the review team waits for more information.",
      };
    case "in_review":
      return {
        steps: [
          { label: "Application Submitted", state: "done" },
          { label: "Under Review", state: "active" },
          { label: "Approved", state: "pending" },
        ],
        note: note || "Your application is currently being reviewed by our team.",
      };
    case "pending_review":
      return {
        steps: [
          { label: "Application Submitted", state: "done" },
          { label: "Waiting for Review", state: "active" },
          { label: "Approved", state: "pending" },
        ],
        note: note || "Your application is in the review queue. We'll notify you when its status changes.",
      };
    default:
      return {
        steps: [
          { label: "Application Not Submitted", state: "active" },
          { label: "Under Review", state: "pending" },
          { label: "Approved", state: "pending" },
        ],
        note: note || "Complete your expert profile and submit it to begin the review process.",
      };
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatShortMoney(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₹${Math.round(amount)}`;
}

const DEFAULT_ZERO_STATS: ExpertStat[] = [
  { id: "sessions", label: "Sessions Done", value: "0", delta: "0 this month", deltaType: "neutral", icon: "calendar" },
  { id: "rating", label: "Avg Rating", value: "0.0", delta: "No reviews", deltaType: "neutral", icon: "star" },
  { id: "clients", label: "Total Clients", value: "0", delta: "0 this month", deltaType: "neutral", icon: "users" },
  { id: "requests", label: "Pending Requests", value: "0", delta: "All clear", deltaType: "neutral", icon: "inbox" },
  { id: "weekly-hours", label: "Weekly hours", value: "0 hrs", delta: "This week", deltaType: "neutral", icon: "clock" },
  { id: "avg-response", label: "Average response", value: "N/A", delta: "No requests", deltaType: "neutral", icon: "timer" },
  { id: "booking-rate", label: "Booking rate", value: "100%", delta: "No requests", deltaType: "neutral", icon: "trend" },
];

const DEFAULT_POINTS: Record<EarningsTimeframe, EarningsDataPoint[]> = {
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, amount: 0 })),
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label) => ({ label, amount: 0 })),
  year: [
    String(new Date().getFullYear() - 3),
    String(new Date().getFullYear() - 2),
    String(new Date().getFullYear() - 1),
    String(new Date().getFullYear()),
  ].map((label) => ({ label, amount: 0 })),
};

function formatUpcomingSession(booking: ClientRequest): ExpertSession {
  const start = new Date(booking.scheduledStartAt || booking.createdAt);
  const now = new Date();
  const isToday =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    start.getFullYear() === tomorrow.getFullYear() &&
    start.getMonth() === tomorrow.getMonth() &&
    start.getDate() === tomorrow.getDate();

  const dayLabel = isToday
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : start.toLocaleDateString("en-US", { weekday: "short" });

  const timeLabel = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return {
    id: booking.id,
    title: booking.title || "Consultation Session",
    client: booking.clientName || "Seeker",
    timeLabel,
    dayLabel,
    isToday,
  };
}

function formatRecentSession(booking: ClientRequest): ExpertRecentSession {
  const start = new Date(booking.scheduledStartAt || booking.createdAt);
  const end = new Date(booking.scheduledEndAt || booking.createdAt);
  const diffMins = Math.max(
    15,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );

  const durationLabel = `${diffMins} mins · ${booking.formatLabel || "1:1 Video"}`;
  const dateLabel = (booking.scheduledEndAt ? new Date(booking.scheduledEndAt) : start).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const seekerRaw = booking.rawItem?.seeker;
  const clientRole = seekerRaw && typeof seekerRaw === "object"
    ? (seekerRaw as { category?: string }).category
    : undefined;

  return {
    id: booking.id,
    client: booking.clientName || "Seeker",
    clientRole,
    avatar: booking.clientAvatar || "/assets/img/avatar2.png",
    sessionTitle: booking.title || "Consultation",
    dateLabel,
    durationLabel,
    payout: formatExpertCurrency(Math.round(booking.price || 0)),
    status: "Completed",
  };
}

function formatTopReview(rev: SessionReview): ExpertTopReview {
  return {
    id: rev.id,
    client: rev.clientName || "Seeker",
    role: rev.clientRole || "Verified Seeker",
    avatar: rev.clientAvatar || "/assets/img/avatar2.png",
    rating: Number(rev.rating) || 5,
    sessionTitle: rev.sessionTitle || "Consultation",
    comment: rev.comment || "",
    date: new Date(rev.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  };
}

interface EarningsChartProps {
  points: EarningsDataPoint[];
}

function EarningsChart({ points }: EarningsChartProps) {
  const amounts = points.map((m) => m.amount);
  const maxVal = Math.max(...amounts) * 1.15 || 100;
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const width = 360;
  const height = 145;
  const padLeft = 44;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 24;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const yTickRatios = [1.0, 0.66, 0.33, 0];
  const yTicks = yTickRatios.map((ratio) => {
    const val = ratio * maxVal;
    const y = padTop + chartH - ((val - minVal) / range) * chartH;
    return { val, y };
  });

  const chartPoints = points.map((entry, index) => {
    const divisor = points.length > 1 ? points.length - 1 : 1;
    const x = padLeft + (index / divisor) * chartW;
    const y = padTop + chartH - ((entry.amount - minVal) / range) * chartH;
    return { x, y, label: entry.label, amount: entry.amount };
  });

  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const lastPoint = chartPoints[chartPoints.length - 1] || { x: padLeft + chartW, y: padTop + chartH };
  const firstPoint = chartPoints[0] || { x: padLeft, y: padTop + chartH };
  const areaPath = `${linePath} L ${lastPoint.x} ${padTop + chartH} L ${firstPoint.x} ${padTop + chartH} Z`;

  return (
    <div className={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chartSvg}
        role="img"
        aria-label="Earnings chart with money Y-axis"
      >
        <defs>
          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pomegranate)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--pomegranate)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines & Y-Axis Money Labels */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={tick.y}
              x2={padLeft + chartW}
              y2={tick.y}
              className={styles.chartGridLine}
            />
            <text
              x={padLeft - 6}
              y={tick.y + 3.5}
              textAnchor="end"
              className={styles.chartAxisText}
            >
              {formatShortMoney(tick.val)}
            </text>
          </g>
        ))}

        {/* Gradient Fill Area */}
        <path d={areaPath} fill="url(#earningsGradient)" />

        {/* Primary Trend Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--pomegranate)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Point Circles with Tooltip and X-Axis Labels */}
        {chartPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="var(--pomegranate)"
              className={styles.chartDot}
            >
              <title>{`${p.label}: ₹${p.amount.toLocaleString("en-IN")}`}</title>
            </circle>
            <text
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className={styles.chartAxisText}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function ExpertDashboard() {
  const [profile, setProfile] = useState({ name: "", greeting: getGreeting() });
  const [earningsTimeframe, setEarningsTimeframe] = useState<EarningsTimeframe>("month");
  const [reviewStatus, setReviewStatus] = useState("draft");
  const [reviewerNote, setReviewerNote] = useState<string | null>(null);
  const [completion, setCompletion] = useState<{
    percentage: number;
    checklist: Array<{ id: string; label: string; status: "done" | "pending" }>;
  }>({ percentage: 0, checklist: [] });

  // Per-section: profile
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [profileStale, setProfileStale] = useState(false);

  // Per-section: stats
  const [stats, setStats] = useState<ExpertStat[] | null>(null);
  const [statsError, setStatsError] = useState(false);

  // Per-section: earnings
  const [earningsData, setEarningsData] = useState<ExpertEarningsResponse | null>(null);
  const [earningsError, setEarningsError] = useState(false);

  // Per-section: upcoming sessions
  const [upcomingSessions, setUpcomingSessions] = useState<ExpertSession[] | null>(null);
  const [upcomingError, setUpcomingError] = useState(false);

  // Per-section: recent sessions
  const [recentSessions, setRecentSessions] = useState<ExpertRecentSession[] | null>(null);
  const [recentCompletedCount, setRecentCompletedCount] = useState<number>(0);
  const [recentError, setRecentError] = useState(false);

  // Per-section: reviews
  const [topReviews, setTopReviews] = useState<ExpertTopReview[] | null>(null);
  const [reviewsSummary, setReviewsSummary] = useState<{
    totalReviews: number;
    overallRating: number;
  }>({ totalReviews: 0, overallRating: 0 });
  const [reviewsError, setReviewsError] = useState(false);

  // ── Individual loaders (each independently retryable) ──────────────────────

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(false);
    setProfileStale(false);
    try {
      const { profile: saved, reviewStatus: status, reviewerNote: note, completion: currentCompletion } =
        await fetchExpertDashboardProfile();
      setProfile({ name: saved.name || "", greeting: getGreeting() });
      setReviewStatus(status);
      setReviewerNote(note);
      setCompletion(currentCompletion);
    } catch (err) {
      console.error("Failed to load expert profile:", err);
      // Fall back to persisted cache — do NOT show defaults
      const cached = getExpertDashboardProfileCache();
      if (cached) {
        setProfile({ name: cached.profile.name || "", greeting: getGreeting() });
        setReviewStatus(cached.reviewStatus);
        setReviewerNote(cached.reviewerNote);
        setCompletion(cached.completion);
        setProfileStale(true);
      } else {
        setProfileError(true);
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsError(false);
    try {
      const statsRes = await getExpertDashboardStats();
      setStats(Array.isArray(statsRes.stats) && statsRes.stats.length > 0 ? statsRes.stats : []);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setStatsError(true);
    }
  }, []);

  const loadEarnings = useCallback(async () => {
    setEarningsError(false);
    try {
      setEarningsData(await getExpertEarnings());
    } catch (err) {
      console.error("Failed to load earnings:", err);
      setEarningsError(true);
    }
  }, []);

  const loadUpcoming = useCallback(async () => {
    setUpcomingError(false);
    try {
      const res = await getExpertRequests({ status: "upcoming", limit: 5 });
      setUpcomingSessions((res.requests || []).map(formatUpcomingSession));
    } catch (err) {
      console.error("Failed to load upcoming sessions:", err);
      setUpcomingError(true);
    }
  }, []);

  const loadRecent = useCallback(async () => {
    setRecentError(false);
    try {
      const res = await getExpertRequests({ status: "completed", limit: 5, sort: "newest" });
      const mapped = (res.requests || []).map(formatRecentSession);
      setRecentSessions(mapped);
      setRecentCompletedCount(res.counts?.completed ?? mapped.length);
    } catch (err) {
      console.error("Failed to load recent sessions:", err);
      setRecentError(true);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewsError(false);
    try {
      const res = await getExpertReviews(1, "all", "recent");
      const mapped = (res.items || []).slice(0, 5).map(formatTopReview);
      setTopReviews(mapped);
      setReviewsSummary({
        totalReviews: res.summary?.totalReviews ?? mapped.length,
        overallRating: res.summary?.overallRating ?? 0,
      });
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setReviewsError(true);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    await Promise.all([
      loadProfile(),
      loadStats(),
      loadEarnings(),
      loadUpcoming(),
      loadRecent(),
      loadReviews(),
    ]);
  }, [loadProfile, loadStats, loadEarnings, loadUpcoming, loadRecent, loadReviews]);

  useEffect(() => {
    void loadDashboard();

    if (typeof window !== "undefined") {
      window.addEventListener("expert-profile-updated", loadDashboard);
      window.addEventListener("expert-requests-updated", loadDashboard);
      window.addEventListener("expert-dashboard-refresh", loadDashboard);
      const handleVisibility = () => {
        if (document.visibilityState === "visible") void loadDashboard();
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        window.removeEventListener("expert-profile-updated", loadDashboard);
        window.removeEventListener("expert-requests-updated", loadDashboard);
        window.removeEventListener("expert-dashboard-refresh", loadDashboard);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }
  }, [loadDashboard]);

  // ── Derived display values ─────────────────────────────────────────────────

  const firstName = profileError ? null : (profile.name.trim() ? profile.name.trim().split(" ")[0] : null);
  const displayStats = stats ?? DEFAULT_ZERO_STATS;

  const currentPoints = useMemo(() => {
    const rawPoints = earningsData?.charts?.[earningsTimeframe];
    if (Array.isArray(rawPoints) && rawPoints.length > 0) {
      return rawPoints.map((p) => ({ label: p.label, amount: Math.round((p.amount || 0) / 100) }));
    }
    return DEFAULT_POINTS[earningsTimeframe];
  }, [earningsData, earningsTimeframe]);

  const currentTotal = useMemo(() => {
    if (!earningsData?.summary) return 0;
    if (earningsTimeframe === "month") return Math.round((earningsData.summary.thisMonthRevenue || 0) / 100);
    if (earningsTimeframe === "year") return Math.round((earningsData.summary.totalEarned || 0) / 100);
    return currentPoints.reduce((sum, p) => sum + p.amount, 0);
  }, [earningsData, earningsTimeframe, currentPoints]);

  const currentDelta = useMemo(() => {
    if (!earningsData?.summary) {
      return earningsTimeframe === "day" ? "Past 7 Days" : earningsTimeframe === "year" ? "Past 4 Years" : "0% this month";
    }
    if (earningsTimeframe === "month") {
      const growth = earningsData.summary.growthPercent;
      if (growth !== null && growth !== undefined) return `${growth >= 0 ? "+" : ""}${growth}% this month`;
      return (earningsData.summary.thisMonthRevenue || 0) > 0 ? "+100% this month" : "0% this month";
    }
    return earningsTimeframe === "day" ? "Past 7 Days" : "Past 4 Years";
  }, [earningsData, earningsTimeframe]);

  const reviewDisplay = getReviewDisplay(profileError ? "unknown" : reviewStatus, reviewerNote);
  const completionLoading = profileLoading;
  const strengthLabel = profileError
    ? "Unavailable"
    : completion.percentage === 100 ? "Complete"
    : completion.percentage >= 75 ? "Strong"
    : completion.percentage >= 50 ? "Good"
    : "Getting started";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.welcomeBlock}>
          <div className={styles.welcomeText}>
            <h1 className={styles.pageTitle}>
              {profile.greeting},{" "}
              {profileLoading ? (
                <span className={styles.accentWord}>…</span>
              ) : profileError ? (
                <span className={styles.accentWord} style={{ opacity: 0.45 }}>Expert</span>
              ) : (
                <>
                  <span className={styles.accentWord}>{firstName ?? "Expert"}</span>
                  {profileStale && (
                    <span className={styles.staleLabel} title="Loaded from cache — backend unavailable"> (cached)</span>
                  )}
                </>
              )}
            </h1>
          </div>
        </header>

        <div className={styles.topGrid}>
          {/* Profile Completion card */}
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile Completion</h2>
              <span className={styles.strengthBadge}>
                {completionLoading ? "Loading…" : strengthLabel}
              </span>
            </div>

            {profileError ? (
              <div className={styles.sectionUnavailable}>
                <AlertCircle size={18} aria-hidden="true" />
                <span>Profile data unavailable — backend unreachable.</span>
                <button className={styles.retryBtn} onClick={() => void loadProfile()}>Retry</button>
              </div>
            ) : (
              <>
                <div className={styles.progressBlock}>
                  <div className={styles.progressMeta}>
                    <span className={styles.progressLabel}>
                      Profile Strength
                      {profileStale && <span className={styles.staleLabel}> (cached)</span>}
                    </span>
                    <span className={styles.progressValue}>{completion.percentage}%</span>
                  </div>
                  <div className={styles.progressTrack} role="progressbar" aria-valuenow={completion.percentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className={styles.progressFill} style={{ width: `${completion.percentage}%` }} />
                  </div>
                </div>

                <ul className={styles.checklist}>
                  {completion.checklist.map((item) => (
                    <li key={item.id} className={styles.checklistItem}>
                      {item.status === "done" ? (
                        <CheckCircle2 size={16} className={styles.checkDone} aria-hidden="true" />
                      ) : (
                        <AlertCircle size={16} className={styles.checkPending} aria-hidden="true" />
                      )}
                      <span className={item.status === "done" ? styles.checklistDone : styles.checklistPending}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className={styles.cardHint}>
                  {completion.percentage === 100
                    ? <>Your profile is <strong>Verification Ready</strong></>
                    : <>Complete pending onboarding steps to reach <strong>Verification Ready</strong></>}
                </p>
                <PrimaryButton
                  href={completion.percentage === 100 ? EXPERT_PROFILE_HREF : EXPERT_PROFILE_EDIT_HREF}
                  label={completion.percentage === 100 ? "View Profile" : "Complete Profile"}
                  variant="orange"
                  fullWidth
                  className={styles.cardAction}
                />
              </>
            )}
          </article>

          {/* Review Status card */}
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>
              Review Status
              {profileStale && !profileError && <span className={styles.staleLabel}> (cached)</span>}
            </h2>

            {profileError ? (
              <div className={styles.sectionUnavailable}>
                <AlertCircle size={18} aria-hidden="true" />
                <span>Application status unavailable.</span>
                <button className={styles.retryBtn} onClick={() => void loadProfile()}>Retry</button>
              </div>
            ) : (
              <>
                <div className={styles.reviewStepper}>
                  {reviewDisplay.steps.map((step, index) => (
                    <div key={step.label}>
                      <div className={styles.reviewStep}>
                        <span
                          className={`${styles.reviewDot} ${
                            step.state === "done" ? styles.reviewDotDone
                            : step.state === "active" ? styles.reviewDotActive
                            : step.state === "attention" ? styles.reviewDotAttention
                            : ""
                          }`}
                          aria-hidden="true"
                        >
                          {step.state === "done" ? <CheckCircle2 size={14} /> : null}
                          {step.state === "attention" ? <AlertCircle size={14} /> : null}
                        </span>
                        <div className={styles.reviewStepBody}>
                          <span className={`${styles.reviewStepLabel} ${step.state === "pending" ? styles.reviewStepMuted : ""}`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                      {index < reviewDisplay.steps.length - 1 ? (
                        <div className={styles.reviewConnector} aria-hidden="true" />
                      ) : null}
                    </div>
                  ))}
                </div>

                <p className={styles.reviewNote}>{reviewDisplay.note}</p>
              </>
            )}
          </article>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          {statsError ? (
            <div className={styles.sectionUnavailable} style={{ gridColumn: "1 / -1" }}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>Statistics unavailable — could not reach backend.</span>
              <button className={styles.retryBtn} onClick={() => void loadStats()}>Retry</button>
            </div>
          ) : (
            displayStats.map((stat) => {
              const Icon = STAT_ICONS[stat.icon] || STAT_ICONS.calendar;
              return (
                <article key={stat.id} className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <div className={styles.statIconBox}>
                      <Icon size={20} aria-hidden="true" />
                    </div>
                  </div>
                  <div className={styles.statFooter}>
                    <p className={styles.statValue}>{stat.value}</p>
                    <span className={`${styles.statDelta} ${
                      stat.deltaType === "positive" ? styles.statDeltaPositive
                      : stat.deltaType === "alert" ? styles.statDeltaAlert
                      : ""
                    }`}>
                      {stat.delta}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className={styles.middleGrid}>
          {/* Earnings card */}
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitleGroup}>
                <h2 className={styles.cardTitle}>Earnings Snapshot</h2>
                {!earningsError && (
                  <span className={`${styles.statDelta} ${styles.statDeltaPositive}`}>{currentDelta}</span>
                )}
              </div>
              <div className={styles.timeframeSelectWrapper}>
                <select
                  className={styles.timeframeSelect}
                  value={earningsTimeframe}
                  onChange={(e) => setEarningsTimeframe(e.target.value as EarningsTimeframe)}
                  aria-label="Filter earnings by timeframe"
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
            {earningsError ? (
              <div className={styles.sectionUnavailable}>
                <AlertCircle size={18} aria-hidden="true" />
                <span>Earnings data unavailable.</span>
                <button className={styles.retryBtn} onClick={() => void loadEarnings()}>Retry</button>
              </div>
            ) : (
              <>
                <p className={styles.earningsTotal}>
                  Total Earned <strong>{formatExpertCurrency(currentTotal)}</strong>
                </p>
                <EarningsChart points={currentPoints} />
              </>
            )}
          </article>

          {/* Upcoming Sessions card */}
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming Sessions</h2>
              <Link href="/expert/requests/" className={styles.viewAllLink}>View All</Link>
            </div>
            {upcomingError ? (
              <div className={styles.sectionUnavailable}>
                <AlertCircle size={18} aria-hidden="true" />
                <span>Sessions unavailable.</span>
                <button className={styles.retryBtn} onClick={() => void loadUpcoming()}>Retry</button>
              </div>
            ) : upcomingSessions !== null && upcomingSessions.length > 0 ? (
              <ul className={styles.sessionList}>
                {upcomingSessions.map((session) => (
                  <li
                    key={session.id}
                    className={`${styles.sessionRow} ${session.isToday ? styles.sessionRowToday : ""}`}
                  >
                    <div className={styles.sessionBody}>
                      <div className={styles.sessionTop}>
                        <span className={styles.sessionTitle}>{session.title}</span>
                        <span className={`${styles.sessionDay} ${session.isToday ? styles.sessionDayToday : ""}`}>
                          {session.dayLabel}
                        </span>
                      </div>
                      <p className={styles.sessionClient}>with {session.client} · {session.timeLabel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className={styles.sessionList}>
                <li className={styles.sessionRow}>
                  <div className={styles.sessionBody}>
                    <p className={styles.sessionClient}>No upcoming sessions scheduled.</p>
                  </div>
                </li>
              </ul>
            )}
          </article>
        </div>

        <div className={styles.bottomGrid}>
          {/* Recent Sessions section */}
          <section className={styles.contentSection} id="sessions">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Recent Sessions</h2>
              <Link href="/expert/requests/" className={styles.viewAllLink}>View All</Link>
            </div>
            {!recentError && (
              <p className={styles.unreadHint}>
                {recentCompletedCount} completed session{recentCompletedCount === 1 ? "" : "s"}
              </p>
            )}
            <div className={styles.panel}>
              {recentError ? (
                <div className={styles.sectionUnavailable}>
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>Recent sessions unavailable.</span>
                  <button className={styles.retryBtn} onClick={() => void loadRecent()}>Retry</button>
                </div>
              ) : recentSessions !== null && recentSessions.length > 0 ? (
                <ul className={styles.panelList}>
                  {recentSessions.map((session) => (
                    <li key={session.id} className={styles.panelRow}>
                      <Image
                        src={session.avatar}
                        alt={session.client}
                        width={40}
                        height={40}
                        className={styles.panelAvatar}
                      />
                      <div className={styles.panelBody}>
                        <div className={styles.panelTop}>
                          <span className={styles.panelTitle}>{session.client}</span>
                          <span className={styles.sessionStatusPill}>{session.status}</span>
                        </div>
                        <p className={styles.panelCopy}>{session.sessionTitle}</p>
                        <div className={styles.sessionMetaRow}>
                          <span>{session.dateLabel}</span>
                          <span className={styles.metaDot}>•</span>
                          <span>{session.durationLabel}</span>
                          <span className={styles.metaDot}>•</span>
                          <span className={styles.sessionPayoutVal}>{session.payout}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.cardHint}>No completed sessions yet.</p>
              )}
            </div>
          </section>

          {/* Top Reviews section */}
          <section className={styles.contentSection} id="reviews">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Top Reviews</h2>
              <Link href="/expert/reviews" className={styles.viewAllLink}>View All</Link>
            </div>
            {!reviewsError && (
              <p className={styles.unreadHint}>
                {reviewsSummary.totalReviews > 0 ? (
                  <>
                    <span className={styles.ratingHintHighlight}>★ {reviewsSummary.overallRating.toFixed(1)}</span>
                    {" · "}{reviewsSummary.totalReviews} verified client review{reviewsSummary.totalReviews === 1 ? "" : "s"}
                  </>
                ) : (
                  "No client reviews yet"
                )}
              </p>
            )}
            <div className={styles.panel}>
              {reviewsError ? (
                <div className={styles.sectionUnavailable}>
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>Reviews unavailable.</span>
                  <button className={styles.retryBtn} onClick={() => void loadReviews()}>Retry</button>
                </div>
              ) : topReviews !== null && topReviews.length > 0 ? (
                <ul className={styles.panelList}>
                  {topReviews.map((review) => (
                    <li key={review.id} className={styles.panelRow}>
                      <Image
                        src={review.avatar}
                        alt={review.client}
                        width={40}
                        height={40}
                        className={styles.panelAvatar}
                      />
                      <div className={styles.panelBody}>
                        <div className={styles.panelTop}>
                          <div className={styles.reviewClientInfo}>
                            <span className={styles.panelTitle}>{review.client}</span>
                            {review.role ? <span className={styles.reviewClientRole}>· {review.role}</span> : null}
                          </div>
                          <div className={styles.ratingBadge}>
                            <span>{review.rating.toFixed(1)}</span>
                            <Star size={11} fill="currentColor" />
                          </div>
                        </div>
                        <p className={styles.panelCopy}>{review.comment}</p>
                        <div className={styles.reviewFooterRow}>
                          <span className={styles.reviewSessionBadge}>{review.sessionTitle}</span>
                          <span className={styles.panelMeta}>{review.date}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.cardHint}>No reviews yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
