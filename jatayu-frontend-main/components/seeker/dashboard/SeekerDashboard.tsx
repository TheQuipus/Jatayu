"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ExpertCard from "@/components/ui/ExpertCard";
import problemStyles from "@/components/homepage/Problem.module.css";
import {
  ACTIVITY_STATS,
  EXPERT_UPDATES,
  RECOMMENDED_EXPERTS,
  SAVED_EXPERTS,
  SEEKER_PROFILE,
  TRENDING_CATEGORIES,
  WALLET_BALANCE,
  formatCurrency,
  getExpertHref,
} from "@/lib/seekerDashboard";
import {
  fetchSeekerProfileData,
  getStoredSeekerProfile,
  SEEKER_PROFILE_UPDATED_EVENT,
} from "@/lib/seekerProfileApi";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "./SeekerDashboard.module.css";

const DASHBOARD_TRENDING_PREVIEW = TRENDING_CATEGORIES.slice(0, 6);

export default function SeekerDashboard() {
  const [activeCategory, setActiveCategory] = useState<string>(TRENDING_CATEGORIES[0]);
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();
  const [profile, setProfile] = useState({
    name: SEEKER_PROFILE.name,
    avatar: SEEKER_PROFILE.avatar,
    isPro: SEEKER_PROFILE.isPro,
  });

  useEffect(() => {
    const handleUpdate = () => {
      const stored = getStoredSeekerProfile();
      setProfile({
        name: stored.name || SEEKER_PROFILE.name,
        avatar: stored.avatar || SEEKER_PROFILE.avatar,
        isPro: stored.isPro ?? SEEKER_PROFILE.isPro,
      });
    };

    handleUpdate();

    void fetchSeekerProfileData()
      .then((saved) => {
        setProfile({
          name: saved.name || SEEKER_PROFILE.name,
          avatar: saved.avatar || SEEKER_PROFILE.avatar,
          isPro: saved.isPro ?? SEEKER_PROFILE.isPro,
        });
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      window.addEventListener(SEEKER_PROFILE_UPDATED_EVENT, handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(SEEKER_PROFILE_UPDATED_EVENT, handleUpdate);
      }
    };
  }, []);

  const firstName = (profile.name || SEEKER_PROFILE.name).trim().split(" ")[0];

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.welcomeBlock}>
          <h1 className={styles.pageTitle}>
            {SEEKER_PROFILE.greeting},{" "}
            <span className={styles.accentWord}>{firstName}</span>
          </h1>
          <p className={styles.pageSubtitle}>
            You have 2 upcoming sessions this week.<br/> Your next call is tomorrow at 10:00 AM.
          </p>
        </header>

        <div className={styles.statsGrid}>
          <article className={problemStyles.scardMini}>
            <span className={problemStyles.scardMiniLabel}>
              <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
              Wallet Balance
            </span>
            <p className={problemStyles.scardMiniQuote}>{formatCurrency(WALLET_BALANCE)}</p>
            <div className={problemStyles.scardMiniRule} aria-hidden="true" />
            <p className={problemStyles.scardMiniDesc}>Available credits for consultations</p>
            <PrimaryButton
              type="button"
              label="Add Funds"
              variant="orange"
              fullWidth
              className={styles.scardMiniAction}
            />
          </article>

          <article className={problemStyles.scardMini}>
            <span className={problemStyles.scardMiniLabel}>
              <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
              Your Activity
            </span>
            <p className={problemStyles.scardMiniQuote}>{ACTIVITY_STATS[0].value} sessions completed</p>
            <div className={problemStyles.scardMiniRule} aria-hidden="true" />
            <div className={styles.activityList}>
              {ACTIVITY_STATS.map((stat) => (
                <div key={stat.label} className={styles.activityRow}>
                  <span className={styles.activityLabel}>{stat.label}</span>
                  <strong className={styles.activityValue}>{stat.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className={problemStyles.scardMini} id="tickets">
            <span className={problemStyles.scardMiniLabel}>
              <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
              Open Tickets
            </span>
            <p className={problemStyles.scardMiniQuote}>1 Active</p>
            <div className={problemStyles.scardMiniRule} aria-hidden="true" />
            <p className={problemStyles.scardMiniDesc}>Last updated 2 hours ago</p>
            <PrimaryButton
              type="button"
              label="View Tickets"
              variant="dark"
              fullWidth
              className={styles.scardMiniAction}
            />
          </article>
        </div>

        <section className={styles.contentSection}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>Trending Categories</h2>
            <Link href="/seeker/discover" className={styles.sortedText}>
              See all
            </Link>
          </div>
          <ul className={styles.categoryGrid}>
            {DASHBOARD_TRENDING_PREVIEW.map((category) => {
              const isActive = activeCategory === category;
              return (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ""}`}
                  >
                    {category}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${styles.contentSection} ${styles.featuredSection}`}>
          <div className={styles.featuredHeaderRow}>
            <h2 className={styles.featuredTitle}>
              Recommended for You
            </h2>
            <Link href="/seeker/discover" className={styles.sortedText}>
              See all
            </Link>
          </div>
          <div className={styles.recommendedGrid}>
            {RECOMMENDED_EXPERTS.map((expert, index) => (
              <ExpertCard
                key={expert.name}
                expert={expert}
                isBookmarked={bookmarkedExperts.has(expert.name)}
                onBookmarkToggle={() => toggleBookmark(expert.name)}
                seeker
                priority={index < 2}
                className={styles.recommendedCard}
              />
            ))}
          </div>
        </section>

        <div className={styles.bottomGrid}>
          <section className={styles.contentSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Saved Experts</h2>
              <Link href="/seeker/bookmark" className={styles.sortedText}>
                See all
              </Link>
            </div>
            <div className={styles.panel}>
              <ul className={styles.panelList}>
                {SAVED_EXPERTS.map(({ expert, rating }) => (
                  <li key={expert.name} className={styles.panelRow}>
                    <Image
                      src={expert.image}
                      alt={expert.name}
                      width={40}
                      height={40}
                      className={styles.panelAvatar}
                    />
                    <div className={styles.panelBody}>
                      <div className={styles.panelTop}>
                        <span className={styles.panelTitle}>{expert.name}</span>
                        <span className={styles.panelMeta}>★ {rating}</span>
                      </div>
                      <p className={styles.panelCopy}>{expert.role}</p>
                    </div>
                    <Link href={getExpertHref(expert)} className={styles.panelAction}>
                      Book
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={styles.contentSection} id="messages">
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Expert Updates</h2>
              <Link href="/seeker/dashboard#messages" className={styles.sortedText}>
                See all
              </Link>
            </div>
            <div className={styles.panel}>
              <ul className={styles.panelList}>
                {EXPERT_UPDATES.map((update) => (
                  <li key={update.id} className={styles.panelRow}>
                    <Image
                      src={update.expert.image}
                      alt={update.expert.name}
                      width={40}
                      height={40}
                      className={styles.panelAvatar}
                    />
                    <div className={styles.panelBody}>
                      <div className={styles.panelTop}>
                        <span className={styles.panelTitle}>{update.expert.name}</span>
                        <span className={styles.panelMeta}>{update.timeAgo}</span>
                      </div>
                      <p className={styles.panelCopy}>{update.text}</p>
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
