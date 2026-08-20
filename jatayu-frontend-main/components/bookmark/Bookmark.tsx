"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExpertCard from "../ui/ExpertCard";
import { featuredExperts, getAvailableTopics, type ExpertiseTag } from "@/lib/experts";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "./Bookmark.module.css";

export default function Bookmark({ seeker = false }: { seeker?: boolean }) {
  const topicRowShellRef = useRef<HTMLDivElement>(null);
  const [isTopicRowStuck, setIsTopicRowStuck] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ExpertiseTag | null>(null);
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();

  const bookmarkedCards = useMemo(
    () => featuredExperts.filter((expert) => bookmarkedExperts.has(expert.name)),
    [bookmarkedExperts]
  );

  const availableTopics = useMemo(
    () => getAvailableTopics(bookmarkedCards),
    [bookmarkedCards]
  );

  const activeTopic =
    selectedTopic && availableTopics.includes(selectedTopic) ? selectedTopic : null;

  const filteredExperts = activeTopic
    ? bookmarkedCards.filter((expert) => expert.topics.includes(activeTopic))
    : bookmarkedCards;

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
  }, [availableTopics.length]);

  return (
    <>
      <section className={styles.services}>
        <div className={`container ${styles.servicesInner}`}>
          <div className={`${styles.speaks} ${styles.speaksFirst}`}>
            <h2 className={`display ${styles.speaksTitle}`}>
              <span className="t-dark">My </span>
              <span className="t-muted">Experts</span>
            </h2>
            <div className={styles.speaksRight}>
              <span className="eyebrow eyebrow--dark">
                <i className="dot"></i>
                {String(bookmarkedExperts.size).padStart(2, "0")}&nbsp;&nbsp;BOOKMARKED
              </span>
            </div>
            <span className={styles.speaksRule} aria-hidden="true"></span>
            <p className={styles.speaksDesc}>
              Guidance that feels human. Have a closer look at expertise before you book.
            </p>

            {availableTopics.length > 0 && (
              <div
                ref={topicRowShellRef}
                className={`${styles.topicRowShell} ${isTopicRowStuck ? styles.topicRowShellStuck : ""}`}
              >
                <div className={styles.topicRowBackdrop} aria-hidden="true" />
                <ul className={styles.topicRow} role="list">
                  {availableTopics.map((tag) => (
                    <li key={tag}>
                      <button
                        type="button"
                        className={`${styles.topicPill} ${activeTopic === tag ? styles.topicPillActive : ""}`}
                        aria-pressed={activeTopic === tag}
                        onClick={() => toggleTopic(tag)}
                      >
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.speaksCards}>
              {bookmarkedCards.length === 0 ? (
                <p className={styles.noResults}>No bookmarked experts yet.</p>
              ) : filteredExperts.length === 0 ? (
                <p className={styles.noResults}>No experts match this topic yet.</p>
              ) : (
                filteredExperts.map((expert) => (
                  <ExpertCard
                    key={expert.name}
                    expert={expert}
                    isBookmarked={true}
                    onBookmarkToggle={() => toggleBookmark(expert.name)}
                    seeker={seeker}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
