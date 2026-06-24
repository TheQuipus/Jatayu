"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExpertCard from "../ui/ExpertCard";
import { expertiseTags, featuredExperts, type ExpertiseTag } from "@/lib/experts";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "./Expert.module.css";

export default function Expert() {
  const topicRowShellRef = useRef<HTMLDivElement>(null);
  const [isTopicRowStuck, setIsTopicRowStuck] = useState(false);
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();
  const [selectedTopic, setSelectedTopic] = useState<ExpertiseTag | null>(null);

  const filteredExperts = selectedTopic
    ? featuredExperts.filter((expert) => expert.topics.includes(selectedTopic))
    : featuredExperts;

  const toggleTopic = (tag: ExpertiseTag) => {
    setSelectedTopic((prev) => (prev === tag ? null : tag));
  };

  useEffect(() => {
    const shell = topicRowShellRef.current;
    if (!shell) return;

    const updateStuckState = () => {
      if (getComputedStyle(shell).position !== "sticky") {
        setIsTopicRowStuck(false);
        return;
      }

      const stickyTopPx = parseFloat(getComputedStyle(shell).top) || 82;
      setIsTopicRowStuck(shell.getBoundingClientRect().top <= stickyTopPx + 0.5);
    };

    updateStuckState();
    window.addEventListener("scroll", updateStuckState, { passive: true });
    window.addEventListener("resize", updateStuckState);

    return () => {
      window.removeEventListener("scroll", updateStuckState);
      window.removeEventListener("resize", updateStuckState);
    };
  }, []);

  return (
    <>
      <section className={styles.services}>
        <div className={`container ${styles.servicesInner}`}>
          <div className={`${styles.speaks} ${styles.speaksFirst}`}>
            <h2 className={`display ${styles.speaksTitle}`}>
              <span className={`t-dark ${styles.keepTogether}`}>Find the right expert</span>
              <br />
              <span className={styles.keepTogether}>
                <span className="t-dark">for </span>
                <span className="t-muted">your decision</span>
              </span>
            </h2>
            <div className={styles.speaksRight}>
              <Link href="/bookmark" className="eyebrow eyebrow--dark">
                <i className="dot"></i>
                {String(bookmarkedExperts.size).padStart(2, "0")}&nbsp;&nbsp;BOOKMARKED
              </Link>
            </div>
            <span className={styles.speaksRule} aria-hidden="true"></span>
            <p className={styles.speaksDesc}>
              Guidance that feels human. Have a closer look at expertise before you book.
            </p>

            <div
              ref={topicRowShellRef}
              className={`${styles.topicRowShell} ${isTopicRowStuck ? styles.topicRowShellStuck : ""}`}
            >
              <div className={styles.topicRowBackdrop} aria-hidden="true" />
              <ul className={styles.topicRow} role="list">
                {expertiseTags.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      className={`${styles.topicPill} ${selectedTopic === tag ? styles.topicPillActive : ""}`}
                      aria-pressed={selectedTopic === tag}
                      onClick={() => toggleTopic(tag)}
                    >
                      {tag}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.speaksCards}>
              {filteredExperts.length === 0 ? (
                <p className={styles.noResults}>No experts match this topic yet.</p>
              ) : (
                filteredExperts.map((expert, index) => {
                  const isBookmarked = bookmarkedExperts.has(expert.name);

                  return (
                    <ExpertCard
                      key={expert.name}
                      expert={expert}
                      isBookmarked={isBookmarked}
                      onBookmarkToggle={() => toggleBookmark(expert.name)}
                      priority={index === 0}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
