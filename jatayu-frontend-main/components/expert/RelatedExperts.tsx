"use client";

import { useState, useRef, useEffect } from "react";
import ExpertCard from "@/components/ui/ExpertCard";
import { getRelatedExperts, expertiseTags, type Expert, type ExpertiseTag } from "@/lib/experts";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "@/components/homepage/Services.module.css";

type RelatedExpertsProps = {
  expert: Expert;
  seeker?: boolean;
};

export default function RelatedExperts({ expert, seeker = false }: RelatedExpertsProps) {
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();
  const relatedExperts = getRelatedExperts(expert);

  const [selectedCategory, setSelectedCategory] = useState<ExpertiseTag | null>(null);
  const [displayedExperts, setDisplayedExperts] = useState<Expert[]>(relatedExperts);
  const [animationState, setAnimationState] = useState<'normal' | 'warp'>('normal');

  const swapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
      if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    };
  }, []);

  // Update displayedExperts if the expert prop (and thus relatedExperts) changes
  useEffect(() => {
    setDisplayedExperts(getRelatedExperts(expert));
    setSelectedCategory(null);
  }, [expert]);

  const handleCategoryClick = (category: ExpertiseTag) => {
    const nextCategory = selectedCategory === category ? null : category;
    setSelectedCategory(nextCategory);

    // Cancel any running timeouts
    if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);

    // Start warp-settle animation sequence
    setAnimationState("warp");

    // Swap the cards at the peak of the warp (300ms)
    swapTimeoutRef.current = setTimeout(() => {
      const filtered = nextCategory
        ? relatedExperts.filter((candidate) => candidate.topics.includes(category))
        : relatedExperts;
      setDisplayedExperts(filtered);
    }, 300);

    // Return back to normal slow scroll after animation finishes (1400ms)
    endTimeoutRef.current = setTimeout(() => {
      setAnimationState("normal");
    }, 1400);
  };

  // Helper to ensure the total array length is always exactly 24.
  // The first 12 items are filled by repeating the displayedExperts.
  // The next 12 items are an exact clone of the first 12.
  // This guarantees the track width remains 100% constant, preventing layout shifts
  // or translation jerks when changing filters.
  const getDisplayExperts = () => {
    const targetHalfLength = 12;
    const halfList: typeof displayedExperts = [];

    if (displayedExperts.length > 0) {
      while (halfList.length < targetHalfLength) {
        halfList.push(...displayedExperts);
      }
      halfList.length = targetHalfLength; // Slice to exactly 12
    }

    return [...halfList, ...halfList];
  };

  if (relatedExperts.length === 0) return null;

  const displayExperts = getDisplayExperts();
  const carouselClass = animationState === "warp" ? styles.carouselWarp : styles.carouselLtr;

  return (
    <>
      <section
        className={`${styles.services} ${seeker ? styles.servicesSeeker : ""} dark`}
        data-nav-surface="dark"
      >
        <div className={`container ${styles.servicesInner}`}>
          <div className={`${styles.speaks} ${styles.speaksFirst}`}>
            <div className={styles.speaksTop}>
              <h2 className={`display ${styles.speaksTitle}`}>
                <span className={`t-white ${styles.keepTogether}`}>More experts</span>
                <br />
                <span className={styles.keepTogether}>
                  <span className="t-white">like </span>
                  <span className="t-muted">this</span>
                </span>
              </h2>
              <div className={styles.speaksRight}>
                <span className="eyebrow eyebrow--dark">
                  <i className="dot"></i>related Experts
                </span>
              </div>
              <span className={styles.speaksRule} aria-hidden="true"></span>
              <p className={styles.speaksDesc}>
                Compare verified professionals in the same expertise area before you book.
              </p>
            </div>

            <ul className={styles.topicRow}>
              {expertiseTags.map((tag) => {
                const isActive = selectedCategory === tag;
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(tag)}
                      className={`${styles.topicPill} ${isActive ? styles.topicPillActive : ""}`}
                    >
                      {tag}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className={styles.speaksCards}>
              <div className={`${styles.carouselTrack} ${carouselClass}`}>
                {displayExperts.map((candidate, i) => (
                  <ExpertCard
                    key={`${candidate.name}-${i}`}
                    expert={candidate}
                    isBookmarked={bookmarkedExperts.has(candidate.name)}
                    onBookmarkToggle={() => toggleBookmark(candidate.name)}
                    className={styles.expertCardSlide}
                    seeker={seeker}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
