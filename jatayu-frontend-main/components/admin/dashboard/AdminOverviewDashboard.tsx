"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  IndianRupee,
  Info,
  RefreshCw,
  Scale,
  Star,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import problemStyles from "@/components/homepage/Problem.module.css";
import { useExpertApplications } from "@/hooks/useExpertApplications";
import { getFirstReviewAppId } from "@/lib/adminNavigation";
import {
  ADMIN_PROFILE,
  GMV_TREND_14D,
  PRIMARY_METRICS,
  QUICK_ACTIONS,
  RECENT_ACTIVITY,
  SECONDARY_METRICS,
  SESSION_TYPES,
  type AdminMetric,
} from "@/lib/adminDashboard";
import styles from "./AdminOverviewDashboard.module.css";

const TAG_CLASS: Record<NonNullable<AdminMetric["tagVariant"]>, string> = {
  urgent: styles.tagUrgent,
  high: styles.tagHigh,
  review: styles.tagReview,
  auto: styles.tagAuto,
  hold: styles.tagHold,
};

const PRIMARY_ICONS = {
  gmv: IndianRupee,
  users: Users,
  experts: Star,
  approvals: Clock,
} as const;

const SECONDARY_ICONS = {
  sla: Zap,
  disputes: Scale,
  refunds: RefreshCw,
  payouts: Wallet,
} as const;

const ACTIVITY_ICONS = {
  check: CheckCircle2,
  alert: AlertTriangle,
  user: UserPlus,
  refund: RefreshCw,
} as const;

const ACTIVITY_ICON_CLASS = {
  check: styles.activityIconCheck,
  alert: styles.activityIconAlert,
  user: styles.activityIconUser,
  refund: styles.activityIconRefund,
} as const;

function DashboardKpiCard({
  metric,
  icon: Icon,
  size = "primary",
}: {
  metric: AdminMetric;
  icon: LucideIcon;
  size?: "primary" | "secondary";
}) {
  const badge = metric.delta ? (
    <span className={`${styles.statDelta} ${styles.statDeltaPositive}`}>{metric.delta}</span>
  ) : metric.tag ? (
    <span className={`${styles.metricTag} ${TAG_CLASS[metric.tagVariant!]}`}>{metric.tag}</span>
  ) : null;

  return (
    <article
      className={`${problemStyles.scardMini} ${styles.kpiCard} ${size === "secondary" ? styles.kpiCardSecondary : styles.kpiCardPrimary}`}
    >
      <div className={styles.kpiTop}>
        <span className={styles.kpiIconWrap}>
          <Icon size={14} aria-hidden="true" />
        </span>
        {badge}
      </div>
      <p className={styles.kpiMetricValue}>{metric.value}</p>
      <span className={styles.kpiLabelBelow}>{metric.label}</span>
      {size === "primary" && metric.footer ? (
        <>
          <div className={problemStyles.scardMiniRule} aria-hidden="true" />
          <p className={styles.kpiFooter}>
            {metric.footerHighlight ? (
              <span className={styles.kpiFooterDot} aria-hidden="true" />
            ) : null}
            {metric.footer}
          </p>
        </>
      ) : null}
    </article>
  );
}

function GmvChart() {
  const amounts = GMV_TREND_14D.map((d) => d.amount);
  const min = Math.min(...amounts) * 0.9;
  const max = Math.max(...amounts) * 1.05;
  const range = max - min || 1;
  const width = 560;
  const height = 160;
  const padX = 12;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = GMV_TREND_14D.map((entry, index) => {
    const x = padX + (index / (GMV_TREND_14D.length - 1)) * chartW;
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
        aria-label="GMV trend over last 14 days"
      >
        <defs>
          <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pomegranate)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--pomegranate)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padX}
            y1={padY + chartH * (1 - ratio)}
            x2={width - padX}
            y2={padY + chartH * (1 - ratio)}
            stroke="var(--mercury)"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill="url(#gmvGradient)" />
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
        {GMV_TREND_14D.filter((_, i) => i % 2 === 0 || i === GMV_TREND_14D.length - 1).map(
          (entry) => (
            <span key={entry.day} className={styles.chartLabel}>
              {entry.day}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

function SessionsDonut() {
  const total = SESSION_TYPES.reduce((sum, s) => sum + s.value, 0);
  const cx = 70;
  const cy = 70;
  const outerR = 60;
  const innerR = 38;
  let startAngle = -Math.PI / 2;

  const slices = SESSION_TYPES.map((slice) => {
    const angle = (slice.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");
    startAngle = endAngle;
    return { ...slice, path };
  });

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 140 140" className={styles.donutSvg} role="img" aria-label="Sessions by type">
        {slices.map((slice) => (
          <path key={slice.label} d={slice.path} fill={slice.color} />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="18"
          fontWeight="700"
          fill="var(--ink)"
        >
          {total}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          fill="var(--dove-gray)"
        >
          TOTAL
        </text>
      </svg>
      <div className={styles.legend}>
        {SESSION_TYPES.map((slice) => (
          <div key={slice.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: slice.color }} />
            {slice.label}
            <span className={styles.legendValue}>{slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewDashboard() {
  const [chartRange, setChartRange] = useState<"14D" | "30D" | "90D">("14D");
  const { ready, pendingCount, applications } = useExpertApplications();
  const reviewHref = useMemo(() => {
    const appId = getFirstReviewAppId(applications);
    return appId ? `/admin/review/${appId}` : "/admin/applications";
  }, [applications]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstName = ADMIN_PROFILE.name.split(" ")[0];

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.welcomeBlock}>
          <div className={styles.welcomeText}>
            <h1 className={styles.pageTitle}>
              {ADMIN_PROFILE.greeting},{" "}
              <span className={styles.accentWord}>{firstName}</span>
            </h1>
            <p className={styles.pageDate}>{today}</p>
          </div>
          <div className={styles.headerActions}>
            <PrimaryButton
              href={reviewHref}
              label={
                ready && pendingCount > 0
                  ? `Review Queue (${pendingCount})`
                  : "Review Queue"
              }
              variant="orange"
            />
          </div>
        </header>

        <div className={styles.alertBanner} role="alert">
          <div className={styles.alertContent}>
            <Info className={styles.alertIcon} size={20} />
            <p className={styles.alertText}>
              {ready
                ? `${pendingCount} expert application${pendingCount === 1 ? "" : "s"} pending review in the queue.`
                : "Expert applications are loading."}
            </p>
          </div>
          <Link href="/admin/applications" className={styles.alertBtn}>
            Review Now
          </Link>
        </div>

        <div className={styles.statsGrid}>
          {PRIMARY_METRICS.map((metric) => {
            const Icon = PRIMARY_ICONS[metric.id as keyof typeof PRIMARY_ICONS] ?? IndianRupee;
            return <DashboardKpiCard key={metric.id} metric={metric} icon={Icon} />;
          })}
        </div>

        <div className={styles.secondaryGrid}>
          {SECONDARY_METRICS.map((metric) => {
            const Icon = SECONDARY_ICONS[metric.id as keyof typeof SECONDARY_ICONS] ?? AlertTriangle;
            return (
              <DashboardKpiCard key={metric.id} metric={metric} icon={Icon} size="secondary" />
            );
          })}
        </div>

        <div className={styles.middleGrid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>GMV Trend</h2>
              <div className={styles.chartToggles} role="group" aria-label="Chart range">
                {(["14D", "30D", "90D"] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`${styles.toggleBtn} ${chartRange === range ? styles.toggleBtnActive : ""}`}
                    onClick={() => setChartRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <GmvChart />
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Sessions by Type</h2>
            <SessionsDonut />
          </article>
        </div>

        <div className={styles.bottomGrid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <ul className={styles.activityList}>
              {RECENT_ACTIVITY.map((item) => {
                const Icon = ACTIVITY_ICONS[item.icon];
                return (
                  <li key={item.id} className={styles.activityRow}>
                    <span
                      className={`${styles.activityIcon} ${ACTIVITY_ICON_CLASS[item.icon]}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className={styles.activityBody}>
                      <p className={styles.activityText}>{item.text}</p>
                      <p className={styles.activityTime}>{item.timeAgo}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
            <ul className={styles.actionList}>
              {QUICK_ACTIONS.map((action) => (
                <li key={action.id}>
                  <Link href={action.href} className={styles.actionRow}>
                    <span className={styles.actionIconWrap}>
                      <ChevronRight size={16} />
                    </span>
                    <span className={styles.actionLabel}>{action.label}</span>
                    <ChevronRight className={styles.actionChevron} size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
