"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import ShinyText from "@/components/ui/ShinyText";
import shared from "./onboarding.shared.module.css";
import styles from "./SuccessStep.module.css";
import ExpertCard from "@/components/ui/ExpertCard";
import { featuredExperts, type Expert } from "@/lib/experts";
import { getFeaturedMatches } from "@/lib/api";

const FOOTER_TIPS = [
  {
    id: "secured",
    title: "Matches secured!",
    subtitle: "Click any expert card to book your consultation.",
  },
  {
    id: "browse",
    step: 1,
    title: "Browse matches",
    subtitle: "Compare expertise and reviews",
  },
  {
    id: "profiles",
    step: 2,
    title: "View profiles",
    subtitle: "Check history and availability",
  },
  {
    id: "book",
    step: 3,
    title: "Book session",
    subtitle: "Secure your first consultation",
  },
  {
    id: "guidance",
    step: 4,
    title: "Get guidance",
    subtitle: "Start solving your challenges",
  },
] as const;

const FOOTER_TIP_INTERVAL_MS = 8000;
const MATCHING_DURATION_MS = 2800;
const MATCHING_MESSAGE_INTERVAL_MS = 850;

const MATCHING_MESSAGES = [
  "Analyzing your preferences...",
  "Scanning verified expert profiles...",
  "Ranking your best matches...",
] as const;

const reelPool1 = featuredExperts.slice(0, 4);
const reelPool2 = [...featuredExperts.slice(2, 6), ...featuredExperts.slice(0, 2)].slice(0, 4);
const reelPool3 = [...featuredExperts.slice(4), ...featuredExperts.slice(0, 4)].slice(0, 4);

const track1 = [...reelPool1, ...reelPool1];
const track2 = [...reelPool2, ...reelPool2];
const track3 = [...reelPool3, ...reelPool3];

type SuccessStepProps = {
  userName: string;
  selectedCategory: string;
  selectedTopics?: string[];
};

export default function SuccessStep({
  userName,
  selectedCategory,
  selectedTopics = [],
}: SuccessStepProps) {
  const [matches, setMatches] = useState<Expert[]>([]);
  const [isMatching, setIsMatching] = useState(true);
  const [matchingMessageIndex, setMatchingMessageIndex] = useState(0);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const activeTip = FOOTER_TIPS[activeTipIndex];

  const topicsKey = (selectedTopics || []).join(",");

  useEffect(() => {
    let isMounted = true;

    // Fetch featured matches dynamically from backend / API helper
    getFeaturedMatches({ category: selectedCategory, topics: selectedTopics, limit: 3 })
      .then((data) => {
        if (isMounted) {
          setMatches(data || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMatches([]);
        }
      });

    const messageTimer = window.setInterval(() => {
      setMatchingMessageIndex((current) =>
        Math.min(current + 1, MATCHING_MESSAGES.length - 1),
      );
    }, MATCHING_MESSAGE_INTERVAL_MS);

    const completeTimer = window.setTimeout(() => {
      if (isMounted) setIsMatching(false);
    }, MATCHING_DURATION_MS);

    return () => {
      isMounted = false;
      window.clearInterval(messageTimer);
      window.clearTimeout(completeTimer);
    };
  }, [selectedCategory, topicsKey]);

  useEffect(() => {
    if (isMatching) return;

    const timer = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % FOOTER_TIPS.length);
    }, FOOTER_TIP_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isMatching]);

  return (
    <section className={`${shared.card} ${styles.resultsCard}`}>
      <div className={shared.cardHeader}>
        <div className={`${shared.topHeader} ${styles.successHeader}`}>
          <OnboardingStepTitle userName={userName} />
        </div>
      </div>

      <div className={`${shared.cardBody} ${styles.resultsBody} ${styles.resultsReveal}`}>
        <h1 className={`${shared.questionTitle} ${styles.resultsTitle}`}>
          {isMatching ? (
            <>Finding your <span className={shared.accentWord}>expert matches</span>...</>
          ) : (
            <>Your <span className={shared.accentWord}>expert matches</span> are ready!</>
          )}
        </h1>

        {!isMatching ? (
          <p className={`${shared.questionSubtitle} ${styles.resultsSubtitle}`}>
            {matches.length > 0
              ? `We found ${matches.length} verified expert${matches.length > 1 ? "s" : ""} that match your profile.`
              : "No live expert matches found for your selected criteria."}
          </p>
        ) : null}

        <div className={styles.featuredHeaderRow}>
          <h2 className={styles.featuredTitle}>
            {isMatching ? "Scanning Expert Database..." : "Featured Matches"}
          </h2>
          {!isMatching && matches.length > 0 && (
            <div className={styles.featuredHeaderMeta}>
              <button
                type="button"
                className={styles.browseMoreBtn}
                onClick={() => {
                  window.location.href = "/seeker/discover";
                }}
              >
                <ShinyText
                  text="Browse more"
                  speed={2.5}
                  color="#E53B17"
                  shineColor="#ffffff"
                  className={styles.browseMoreShinyText}
                />
              </button>
            </div>
          )}
        </div>

        <div className={styles.matchesGrid}>
          {isMatching ? (
            <>
              {/* Slot 1: First card goes DOWN */}
              <div className={styles.slotWindow}>
                <div className={`${styles.slotTrack} ${styles.slotTrackDown}`}>
                  {track1.map((expert, idx) => (
                    <div key={`reel1-${idx}`} className={styles.slotCardWrap}>
                      <ExpertCard
                        expert={expert}
                        linkToDetail={false}
                        className={styles.matchCardShell}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot 2: Second card goes UP */}
              <div className={styles.slotWindow}>
                <div className={`${styles.slotTrack} ${styles.slotTrackUp}`}>
                  {track2.map((expert, idx) => (
                    <div key={`reel2-${idx}`} className={styles.slotCardWrap}>
                      <ExpertCard
                        expert={expert}
                        linkToDetail={false}
                        className={styles.matchCardShell}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot 3: Third card goes DOWN */}
              <div className={styles.slotWindow}>
                <div className={`${styles.slotTrack} ${styles.slotTrackDownSlow}`}>
                  {track3.map((expert, idx) => (
                    <div key={`reel3-${idx}`} className={styles.slotCardWrap}>
                      <ExpertCard
                        expert={expert}
                        linkToDetail={false}
                        className={styles.matchCardShell}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : matches.length > 0 ? (
            matches.slice(0, 3).map((expert, index) => (
              <div
                key={expert.name}
                className={`${styles.slotLandedCard} ${styles[`slotLanded${index + 1}` as keyof typeof styles]}`}
              >
                <ExpertCard
                  expert={expert}
                  linkToDetail={true}
                  seeker={true}
                  className={styles.matchCardShell}
                />
              </div>
            ))
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
              No matches found for this search.
            </div>
          )}
        </div>
      </div>

      {!isMatching ? (
        <div className={`${shared.onboardingFooter} ${styles.resultsFooter}`}>
          <div className={shared.footerLeft}>
            <div className={shared.avatarMiniWrap}>
              <Image
                src="/assets/img/avatar1.png"
                alt="Guide Advisor"
                width={36}
                height={36}
                className={shared.avatarMini}
              />
            </div>
            <div className={shared.footerTip} aria-live="polite">
              <strong key={`tip-title-${activeTip.id}`} className={styles.footerTipTitle}>
                {"step" in activeTip && activeTip.step
                  ? `${activeTip.step}. ${activeTip.title}`
                  : activeTip.title}
              </strong>
              <small key={`tip-subtitle-${activeTip.id}`} className={styles.footerTipSubtitle}>
                {activeTip.subtitle}
              </small>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
