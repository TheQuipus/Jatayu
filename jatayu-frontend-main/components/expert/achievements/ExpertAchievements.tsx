"use client";

import { useState } from "react";
import {
  Award,
  CheckCircle2,
  Crown,
  Lock,
  Medal,
  Shield,
  Star,
  Zap,
  TrendingUp,
  Sparkles,
  Flame,
  ShieldCheck,
} from "lucide-react";
import styles from "./ExpertAchievements.module.css";

type Badge = {
  id: string;
  title: string;
  description: string;
  icon: "star" | "shield" | "zap" | "medal" | "crown" | "lock";
  unlocked: boolean;
  earnedDate?: string;
  progressPercent?: number;
  perk: string;
};

const ALL_BADGES: Badge[] = [
  {
    id: "b1",
    title: "Top Rated Expert",
    description: "Maintained a 4.8+ client rating over 20+ consultations.",
    icon: "star",
    unlocked: true,
    earnedDate: "Oct 2024",
    perk: "Featured gold star badge on expert directory",
  },
  {
    id: "b2",
    title: "Verified Credentials",
    description: "Background check, degrees, and identity fully verified.",
    icon: "shield",
    unlocked: true,
    earnedDate: "Aug 2024",
    perk: "Verified green trust shield icon",
  },
  {
    id: "b3",
    title: "Lightning Fast Responder",
    description: "Average response time to client requests under 2 hours.",
    icon: "zap",
    unlocked: true,
    earnedDate: "Nov 2024",
    perk: "Priority placement in instant call queue",
  },
  {
    id: "b4",
    title: "30+ Consultations Club",
    description: "Successfully conducted over 30 verified 1:1 sessions.",
    icon: "medal",
    unlocked: true,
    earnedDate: "Dec 2024",
    perk: "Access to higher consultation fee tiers",
  },
  {
    id: "b5",
    title: "Domain Master: UX Strategy",
    description: "Recognized as a verified top subject matter leader.",
    icon: "crown",
    unlocked: true,
    earnedDate: "Jan 2025",
    perk: "Exclusive invite to Jatayu Roundtables",
  },
  {
    id: "b6",
    title: "Platform Legend",
    description: "Attain 100 5-star ratings across all consultative sessions.",
    icon: "lock",
    unlocked: false,
    progressPercent: 78,
    perk: "Lifetime 0% platform commission privilege",
  },
];

const TIMELINE = [
  {
    id: 1,
    title: "Domain Master: UX Strategy Badge Earned",
    description: "Awarded top subject matter expert status by the editorial board.",
    date: "12 Jan 2025",
  },
  {
    id: 2,
    title: "Promoted to Level 5 Expert",
    description: "Reached 94 reputation score milestone with 100% 5-star rating streak.",
    date: "04 Dec 2024",
  },
  {
    id: 3,
    title: "Fast Responder Badge Unlocked",
    description: "Achieved average reply time of 1.4 hours across 15 requests.",
    date: "18 Nov 2024",
  },
];

export default function ExpertAchievements() {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const filteredBadges = ALL_BADGES.filter((badge) => {
    if (filter === "unlocked") return badge.unlocked;
    if (filter === "locked") return !badge.unlocked;
    return true;
  });

  const renderBadgeIcon = (icon: Badge["icon"]) => {
    switch (icon) {
      case "star":
        return <Star size={20} fill="#FFB800" color="#FFB800" />;
      case "shield":
        return <Shield size={20} color="#10B981" />;
      case "zap":
        return <Zap size={20} color="#E53B17" />;
      case "medal":
        return <Medal size={20} color="#8B5CF6" />;
      case "crown":
        return <Crown size={20} color="#F59E0B" />;
      case "lock":
      default:
        return <Lock size={20} color="#9E9E9E" />;
    }
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {/* ==========================================================================
            1. HEADER AREA
            ========================================================================== */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <div className={styles.eyebrow}>
              <span className={styles.livePulseDot} />
              <span>Expert Reputation &amp; Milestones // Achievements</span>
            </div>
            <h1 className={styles.pageTitle}>
              Achievements &amp; <span className={styles.accentWord}>REPUTATION</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Track earned badges, unlock higher platform privileges, and level up your standing across the Jatayu expert network.
            </p>
          </div>
          <div className={styles.titleRule} aria-hidden="true" />
        </header>

        {/* ==========================================================================
            2. KPI OVERVIEW CARDS
            ========================================================================== */}
        <div className={styles.summaryGrid}>
          <article className={styles.kpiCard} style={{ "--kpi-tone": "var(--green)" } as any}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Badges Earned</span>
              <span className={styles.kpiIconBox}>
                <Award size={18} />
              </span>
            </div>
            <div className={styles.kpiFooter}>
              <span className={styles.kpiValue}>5 / 6</span>
              <span className={styles.kpiNote}>83% Unlocked</span>
            </div>
          </article>

          <article className={styles.kpiCard} style={{ "--kpi-tone": "var(--pomegranate)" } as any}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Reputation Score</span>
              <span className={styles.kpiIconBox}>
                <Flame size={18} />
              </span>
            </div>
            <div className={styles.kpiFooter}>
              <span className={styles.kpiValue}>94 / 100</span>
              <span className={styles.kpiNote}>Level 5</span>
            </div>
          </article>

          <article className={styles.kpiCard} style={{ "--kpi-tone": "#8B5CF6" } as any}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Network Standing</span>
              <span className={styles.kpiIconBox}>
                <TrendingUp size={18} />
              </span>
            </div>
            <div className={styles.kpiFooter}>
              <span className={styles.kpiValue}>Top 5%</span>
              <span className={styles.kpiNote}>Elite Tier</span>
            </div>
          </article>

          <article className={styles.kpiCard} style={{ "--kpi-tone": "#D97706" } as any}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>Client Trust Score</span>
              <span className={styles.kpiIconBox}>
                <ShieldCheck size={18} />
              </span>
            </div>
            <div className={styles.kpiFooter}>
              <span className={styles.kpiValue}>99.8%</span>
              <span className={`${styles.kpiNote} ${styles.kpiNoteGold}`}>98% Repeat</span>
            </div>
          </article>
        </div>

        {/* ==========================================================================
            3. LEVEL & MILESTONE LADDER PANEL
            ========================================================================== */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionIndex}>01</span>
              <h2>Reputation Milestone Ladder</h2>
              <p>Your current mastery rank and platform perks unlocked at this tier.</p>
            </div>
          </div>

          <div className={styles.levelCardBody}>
            <div className={styles.levelProgressSection}>
              <div className={styles.levelProgressHeader}>
                <span className={styles.levelBadgeBig}>Level 5 — Senior Industry Mentor</span>
                <span className={styles.levelScoreLabel}>94 / 100 XP (6 pts to Level 6)</span>
              </div>
              <div className={styles.levelBarTrack}>
                <div className={styles.levelBarFill} style={{ width: "94%" }} />
              </div>
            </div>

            <div className={styles.perksGrid}>
              <div className={styles.perkItem}>
                <CheckCircle2 size={16} className={styles.perkIcon} />
                <div className={styles.perkText}>
                  <strong>Priority Matchmaking</strong>
                  <small>Your profile is featured first for seekers in UX &amp; Product Strategy.</small>
                </div>
              </div>
              <div className={styles.perkItem}>
                <CheckCircle2 size={16} className={styles.perkIcon} />
                <div className={styles.perkText}>
                  <strong>Instant Payout Release</strong>
                  <small>Earned session fees are cleared automatically with zero escrow hold.</small>
                </div>
              </div>
              <div className={styles.perkItem}>
                <CheckCircle2 size={16} className={styles.perkIcon} />
                <div className={styles.perkText}>
                  <strong>Gold Verified Badge</strong>
                  <small>Permanent verified credibility crest displayed across client search.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            4. ACHIEVEMENTS BADGES SHOWCASE
            ========================================================================== */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionIndex}>02</span>
              <h2>Platform Badges &amp; Accolades</h2>
              <p>Specialized milestones awarded for outstanding advisory performance.</p>
            </div>
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterBtn} ${filter === "all" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter("all")}
              >
                All (6)
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filter === "unlocked" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter("unlocked")}
              >
                Unlocked (5)
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filter === "locked" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter("locked")}
              >
                In Progress (1)
              </button>
            </div>
          </div>

          <div className={styles.badgesGrid}>
            {filteredBadges.map((badge) => (
              <article
                key={badge.id}
                className={`${styles.badgeCard} ${!badge.unlocked ? styles.badgeLocked : ""}`}
              >
                <div className={styles.badgeTopRow}>
                  <div className={styles.badgeIcon}>{renderBadgeIcon(badge.icon)}</div>
                  <div className={styles.badgeMeta}>
                    <h3 className={styles.badgeTitle}>{badge.title}</h3>
                    <p className={styles.badgeDesc}>{badge.description}</p>
                  </div>
                </div>

                <div className={styles.badgeFooter}>
                  {badge.unlocked ? (
                    <>
                      <span className={styles.badgeStatusUnlocked}>
                        <CheckCircle2 size={13} /> Unlocked
                      </span>
                      <span className={styles.badgeDate}>Earned {badge.earnedDate}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.badgeStatusLocked}>
                        <Lock size={13} /> 78/100 completed
                      </span>
                      <span className={styles.badgeDate}>78% Progress</span>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ==========================================================================
            5. RECENT MILESTONES TIMELINE
            ========================================================================== */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionIndex}>03</span>
              <h2>Recent Milestone Activity</h2>
              <p>Chronological history of earned achievements and reputation elevations.</p>
            </div>
          </div>

          <div className={styles.timelineList}>
            {TIMELINE.map((item) => (
              <article key={item.id} className={styles.timelineItem}>
                <div className={styles.timelineIconBox}>
                  <Sparkles size={16} />
                </div>
                <div className={styles.timelineDetails}>
                  <strong className={styles.timelineTitle}>{item.title}</strong>
                  <span className={styles.timelineDesc}>{item.description}</span>
                </div>
                <span className={styles.timelineDate}>{item.date}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
