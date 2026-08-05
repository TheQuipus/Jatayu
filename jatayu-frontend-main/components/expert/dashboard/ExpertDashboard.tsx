"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Star,
  Users,
} from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import problemStyles from "@/components/homepage/Problem.module.css";
import {
  EARNINGS_BY_MONTH,
  EARNINGS_DELTA,
  EARNINGS_TOTAL,
  EXPERT_PROFILE,
  EXPERT_PROFILE_HREF,
  EXPERT_STATS,
  PROFILE_CHECKLIST,
  PROFILE_STRENGTH,
  RECENT_MESSAGES,
  UPCOMING_SESSIONS,
  formatExpertCurrency,
} from "@/lib/expertDashboard";
import { getExpertProfile } from "@/lib/expertStore";
import { fetchExpertProfileData } from "@/lib/expertProfileApi";
import styles from "./ExpertDashboard.module.css";

const STAT_ICONS = {
  calendar: CalendarDays,
  star: Star,
  users: Users,
  inbox: Inbox,
} as const;


function EarningsChart() {
  const amounts = EARNINGS_BY_MONTH.map((m) => m.amount);
  const min = Math.min(...amounts) * 0.85;
  const max = Math.max(...amounts) * 1.05;
  const range = max - min || 1;
  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = EARNINGS_BY_MONTH.map((entry, index) => {
    const x = padX + (index / (EARNINGS_BY_MONTH.length - 1)) * chartW;
    const y = padY + chartH - ((entry.amount - min) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <div className={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.chartSvg}
        role="img"
        aria-label="Earnings trend over six months"
      >
        <defs>
          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pomegranate)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--pomegranate)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#earningsGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--pomegranate)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--pomegranate)" />
        ))}
      </svg>
      <div className={styles.chartLabels}>
        {EARNINGS_BY_MONTH.map((entry) => (
          <span key={entry.month} className={styles.chartLabel}>
            {entry.month}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ExpertDashboard() {
  const [profile, setProfile] = useState({
    name: EXPERT_PROFILE.name,
    greeting: EXPERT_PROFILE.greeting,
  });

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
  const unreadCount = RECENT_MESSAGES.filter((m) => m.unread).length;

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
              Add video intro to reach <strong>Verification Ready</strong>
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
              <article key={stat.id} className={problemStyles.scardMini}>
                <span className={problemStyles.scardMiniLabel}>
                  <Icon size={14} aria-hidden="true" />
                  {stat.label}
                </span>
                <p className={problemStyles.scardMiniQuote}>{stat.value}</p>
                <div className={problemStyles.scardMiniRule} aria-hidden="true" />
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
              </article>
            );
          })}
        </div>

        <div className={styles.middleGrid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Earnings Snapshot</h2>
              <span className={`${styles.statDelta} ${styles.statDeltaPositive}`}>
                {EARNINGS_DELTA}
              </span>
            </div>
            <p className={styles.earningsTotal}>
              Total Earned{" "}
              <strong>{formatExpertCurrency(EARNINGS_TOTAL)}</strong>
            </p>
            <EarningsChart />
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming Sessions</h2>
              <Link href="/expert/availability" className={styles.viewAllLink}>
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
          <section className={styles.contentSection} id="messages">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Recent Messages</h2>
              <Link href="/expert/dashboard#messages" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <p className={styles.unreadHint}>{unreadCount} unread conversations</p>
            <div className={styles.panel}>
              <ul className={styles.panelList}>
                {RECENT_MESSAGES.map((message) => (
                  <li key={message.id} className={styles.panelRow}>
                    <Image
                      src={message.avatar}
                      alt={message.client}
                      width={40}
                      height={40}
                      className={styles.panelAvatar}
                    />
                    <div className={styles.panelBody}>
                      <div className={styles.panelTop}>
                        <span className={styles.panelTitle}>{message.client}</span>
                        <span className={styles.panelMeta}>{message.timeAgo}</span>
                      </div>
                      <p className={styles.panelCopy}>{message.preview}</p>
                    </div>
                    {message.unread ? (
                      <span className={styles.unreadDot} aria-label="Unread" />
                    ) : null}
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
