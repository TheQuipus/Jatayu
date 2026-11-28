"use client";

import Link from "next/link";
import ExpertCard from "@/components/ui/ExpertCard";
import Spinner from "@/components/ui/Spinner";
import type { Expert } from "@/lib/experts";
import styles from "./SeekerDashboard.module.css";

export const RECOMMENDED_EXPERTS_COUNT = 4;

type RecommendedExpertsSectionProps = {
  matches: Expert[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  bookmarkedExperts: Set<string>;
  onBookmarkToggle: (name: string) => void;
};

export default function RecommendedExpertsSection({
  matches,
  isLoading,
  error,
  onRetry,
  bookmarkedExperts,
  onBookmarkToggle,
}: RecommendedExpertsSectionProps) {
  return (
    <section className={`${styles.contentSection} ${styles.featuredSection}`}>
      <div className={styles.featuredHeaderRow}>
        <h2 className={styles.featuredTitle}>Recommended for You</h2>
        <Link href="/seeker/discover/" className={styles.sortedText}>
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.recommendedStatePanel} role="status" aria-live="polite">
          <Spinner size={18} />
          <span className={styles.recommendedStateText}>Finding your best expert matches...</span>
        </div>
      ) : error ? (
        <div className={styles.recommendedStatePanel} role="alert">
          <span className={styles.recommendedStateText}>{error}</span>
          {onRetry ? (
            <button type="button" onClick={onRetry} className={styles.recommendedRetryBtn}>
              Try again
            </button>
          ) : null}
        </div>
      ) : matches.length === 0 ? (
        <div className={styles.recommendedStatePanel}>
          <span className={styles.recommendedStateText}>
            No expert matches found yet.
          </span>
          <Link href="/seeker/discover/" className={styles.recommendedStateLink}>
            Browse Our Experts
          </Link>
        </div>
      ) : (
        <div className={styles.recommendedGrid}>
          {matches.slice(0, RECOMMENDED_EXPERTS_COUNT).map((expert, index) => (
            <ExpertCard
              key={expert.id || expert.name}
              expert={expert}
              isBookmarked={bookmarkedExperts.has(expert.name)}
              onBookmarkToggle={() => onBookmarkToggle(expert.name)}
              linkToDetail={true}
              seeker={true}
              priority={index < 2}
              className={styles.recommendedCard}
            />
          ))}
        </div>
      )}
    </section>
  );
}
