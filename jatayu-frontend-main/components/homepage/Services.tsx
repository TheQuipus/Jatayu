"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./Services.module.css";
import HeroLines from "../ui/HeroLines";
import ExpertCard from "../ui/ExpertCard";
import { featuredExperts, type ExpertiseTag } from "@/lib/experts";

const expertiseTags = [
  "Startup & Fundraising",
  "Career & Jobs",
  "Legal & Compliance",
  "Tax & Finance",
  "Education & Admissions",
  "SMB Growth",
  "Creator Access",
  "Enterprise Learning"
] as const;

export default function Services() {
  const [selectedCategory, setSelectedCategory] = useState<ExpertiseTag | null>(null);
  const [displayedExperts, setDisplayedExperts] = useState(featuredExperts);
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

  const handleCategoryClick = (category: ExpertiseTag, forceSelect = false) => {
    const nextCategory = forceSelect ? category : (selectedCategory === category ? null : category);
    setSelectedCategory(nextCategory);

    // Cancel any running timeouts
    if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);

    // Start warp-settle animation sequence
    setAnimationState("warp");

    // Swap the cards at the peak of the warp (300ms)
    swapTimeoutRef.current = setTimeout(() => {
      const filtered = nextCategory
        ? featuredExperts.filter((expert) => expert.topics.includes(category))
        : featuredExperts;
      setDisplayedExperts(filtered);
    }, 300);

    // Return back to normal slow scroll after animation finishes (1400ms)
    endTimeoutRef.current = setTimeout(() => {
      setAnimationState("normal");
    }, 1400);
  };

  useEffect(() => {
    const handleSelectTag = (e: Event) => {
      const customEvent = e as CustomEvent<{ tag: ExpertiseTag }>;
      if (customEvent && customEvent.detail && customEvent.detail.tag) {
        const tag = customEvent.detail.tag;
        handleCategoryClick(tag, true);

        // Smooth scroll to services section
        const servicesSection = document.querySelector(`.${styles.services}`);
        if (servicesSection) {
          servicesSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    window.addEventListener("select-expertise-tag", handleSelectTag);
    return () => {
      window.removeEventListener("select-expertise-tag", handleSelectTag);
    };
  }, [selectedCategory]);

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

  const displayExperts = getDisplayExperts();

  // Dynamic class name for the track based on animationState
  const carouselClass = animationState === "warp" ? styles.carouselWarp : styles.carouselLtr;

  return (
    <>

      <section className={`${styles.services} dark`} data-nav-surface="dark">
        <div className={`container ${styles.servicesInner}`}>
          <div className={`${styles.speaks} ${styles.speaksFirst}`}>
            <div className={styles.speaksTop}>
              <h2 className={`display ${styles.speaksTitle}`}>
                <span className={`t-white ${styles.keepTogether}`}>Find the right expert</span>
                <br />
                <span className={styles.keepTogether}>
                  <span className="t-white">for </span>
                  <span className="t-muted">your decision</span>
                </span>
              </h2>
              <div className={styles.speaksRight}>
                <span className="eyebrow eyebrow--dark">
                  <i className="dot"></i>04&nbsp;&nbsp;top categories
                </span>
              </div>
              <span className={styles.speaksRule} aria-hidden="true"></span>
              <p className={styles.speaksDesc}>
                Guidance that feels human. Have a closer look at expertise before you book.
              </p>
              <a href="/expert" className={styles.viewAll}>
                <span className={styles.viewAllText}>
                  <span className={styles.viewAllLabel}>View all</span>
                  <span className={styles.viewAllLabel} aria-hidden="true">
                    View all
                  </span>
                </span>
                <img
                  src="/assets/buttonsvg.svg"
                  alt=""
                  width={26}
                  height={26}
                  className={styles.viewAllIcon}
                  aria-hidden="true"
                />
              </a>
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
                {displayExperts.map((expert, i) => (
                  <ExpertCard
                    key={`${expert.name}-${i}`}
                    expert={expert}
                    className={styles.expertCardSlide}
                    priority={i === 0}
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
