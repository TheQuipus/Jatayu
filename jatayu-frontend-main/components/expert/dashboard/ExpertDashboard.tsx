"use client";

import { useEffect, useState } from "react";
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
import problemStyles from "@/components/homepage/Problem.module.css";
import {
  EARNINGS_BY_MONTH,
  EARNINGS_DATA,
  EARNINGS_DELTA,
  EARNINGS_TOTAL,
  EXPERT_PROFILE,
  EXPERT_PROFILE_HREF,
  EXPERT_STATS,
  PROFILE_CHECKLIST,
  PROFILE_STRENGTH,
  RECENT_SESSIONS,
  TOP_REVIEWS,
  UPCOMING_SESSIONS,
  formatExpertCurrency,
  type EarningsDataPoint,
  type EarningsTimeframe,
} from "@/lib/expertDashboard";
import { getExpertProfile } from "@/lib/expertStore";
import { fetchExpertProfileData } from "@/lib/expertProfileApi";
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
    const x = padLeft + (index / (points.length - 1)) * chartW;
    const y = padTop + chartH - ((entry.amount - minVal) / range) * chartH;
    return { x, y, label: entry.label, amount: entry.amount };
  });

  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${padTop + chartH} L ${chartPoints[0].x} ${padTop + chartH} Z`;

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
  const [profile, setProfile] = useState({
    name: EXPERT_PROFILE.name,
    greeting: EXPERT_PROFILE.greeting,
  });
  const [earningsTimeframe, setEarningsTimeframe] = useState<EarningsTimeframe>("month");

  useEffect(() => {
    const handleUpdate = () => {
      const saved = getExpertProfile();
      setProfile({
        name: saved.name || EXPERT_PROFILE.name,
        greeting: EXPERT_PROFILE.greeting,
      });
    };

    void fetchExpertProfileData()
      .then((saved) => {
        setProfile({
          name: saved.name || EXPERT_PROFILE.name,
          greeting: EXPERT_PROFILE.greeting,
        });
      })
      .catch(handleUpdate);

    if (typeof window !== "undefined") {
      window.addEventListener("expert-profile-updated", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("expert-profile-updated", handleUpdate);
      }
    };
  }, []);

  const firstName = profile.name.split(" ")[0];
  const currentEarnings = EARNINGS_DATA[earningsTimeframe] || EARNINGS_DATA.month;

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.welcomeBlock}>
          <div className={styles.welcomeText}>
            <h1 className={styles.pageTitle}>
              {profile.greeting},{" "}
              <span className={styles.accentWord}>{firstName}</span>
            </h1>
          </div>
        </header>

        <div className={styles.topGrid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile Completion</h2>
              <span className={styles.strengthBadge}>Strong</span>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressMeta}>
                <span className={styles.progressLabel}>Profile Strength</span>
                <span className={styles.progressValue}>{PROFILE_STRENGTH}%</span>
              </div>
              <div className={styles.progressTrack} role="progressbar" aria-valuenow={PROFILE_STRENGTH} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${PROFILE_STRENGTH}%` }}
                />
              </div>
            </div>

            <ul className={styles.checklist}>
              {PROFILE_CHECKLIST.map((item) => (
                <li key={item.id} className={styles.checklistItem}>
                  {item.status === "done" ? (
                    <CheckCircle2 size={16} className={styles.checkDone} aria-hidden="true" />
                  ) : (
                    <AlertCircle size={16} className={styles.checkPending} aria-hidden="true" />
                  )}
                  <span
                    className={
                      item.status === "done" ? styles.checklistDone : styles.checklistPending
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <p className={styles.cardHint}>
              Complete pending onboarding steps to reach <strong>Verification Ready</strong>
            </p>
            <PrimaryButton
              href={EXPERT_PROFILE_HREF}
              label="Complete Profile"
              variant="orange"
              fullWidth
              className={styles.cardAction}
            />
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Review Status</h2>

            <div className={styles.reviewStepper}>
              <div className={styles.reviewStep}>
                <span className={`${styles.reviewDot} ${styles.reviewDotDone}`} aria-hidden="true">
                  <CheckCircle2 size={14} />
                </span>
                <div className={styles.reviewStepBody}>
                  <span className={styles.reviewStepLabel}>Application Submitted</span>
                </div>
              </div>

              <div className={styles.reviewConnector} aria-hidden="true" />

              <div className={styles.reviewStep}>
                <span className={`${styles.reviewDot} ${styles.reviewDotActive}`} aria-hidden="true" />
                <div className={styles.reviewStepBody}>
                  <span className={styles.reviewStepLabel}>Under Review</span>
                </div>
              </div>

              <div className={styles.reviewConnector} aria-hidden="true" />

              <div className={styles.reviewStep}>
                <span className={styles.reviewDot} aria-hidden="true" />
                <div className={styles.reviewStepBody}>
                  <span className={`${styles.reviewStepLabel} ${styles.reviewStepMuted}`}>
                    Approved
                  </span>
                </div>
              </div>
            </div>

            <p className={styles.reviewNote}>
              Review typically completes within 24–48 hours. We&apos;ll notify you by email.
            </p>
          </article>
        </div>

        <div className={styles.statsGrid}>
          {EXPERT_STATS.map((stat) => {
            const Icon = STAT_ICONS[stat.icon];
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
                  <span
                    className={`${styles.statDelta} ${
                      stat.deltaType === "positive"
                        ? styles.statDeltaPositive
                        : stat.deltaType === "alert"
                          ? styles.statDeltaAlert
                          : ""
                    }`}
                  >
                    {stat.delta}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.middleGrid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitleGroup}>
                <h2 className={styles.cardTitle}>Earnings Snapshot</h2>
                <span className={`${styles.statDelta} ${styles.statDeltaPositive}`}>
                  {currentEarnings.delta}
                </span>
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
            <p className={styles.earningsTotal}>
              Total Earned{" "}
              <strong>{formatExpertCurrency(currentEarnings.total)}</strong>
            </p>
            <EarningsChart points={currentEarnings.points} />
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming Sessions</h2>
              <Link href="/expert/requests/" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <ul className={styles.sessionList}>
              {UPCOMING_SESSIONS.map((session) => (
                <li
                  key={session.id}
                  className={`${styles.sessionRow} ${session.isToday ? styles.sessionRowToday : ""}`}
                >
                  <div className={styles.sessionBody}>
                    <div className={styles.sessionTop}>
                      <span className={styles.sessionTitle}>{session.title}</span>
                      <span
                        className={`${styles.sessionDay} ${session.isToday ? styles.sessionDayToday : ""}`}
                      >
                        {session.dayLabel}
                      </span>
                    </div>
                    <p className={styles.sessionClient}>
                      with {session.client} · {session.timeLabel}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className={styles.bottomGrid}>
          <section className={styles.contentSection} id="sessions">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Recent Sessions</h2>
              <Link href="/expert/requests/" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <p className={styles.unreadHint}>24 completed sessions</p>
            <div className={styles.panel}>
              <ul className={styles.panelList}>
                {RECENT_SESSIONS.map((session) => (
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
            </div>
          </section>

          <section className={styles.contentSection} id="reviews">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Top Reviews</h2>
              <Link href="/expert/reviews" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <p className={styles.unreadHint}>
              <span className={styles.ratingHintHighlight}>★ 4.9</span> · 34 verified client reviews
            </p>
            <div className={styles.panel}>
              <ul className={styles.panelList}>
                {TOP_REVIEWS.map((review) => (
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
                          <span className={styles.reviewClientRole}>· {review.role}</span>
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
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
