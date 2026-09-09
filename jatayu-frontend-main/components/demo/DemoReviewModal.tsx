"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Star, CheckCircle2, X } from "lucide-react";
import Lottie from "lottie-react";
import starAnimation from "@/public/Lottie/Star.json";
import coinAnimation from "@/public/Lottie/coin_p.json";
import confettiAnimation from "@/public/Lottie/Confetti.json";
import ContinueButton from "@/components/ui/ContinueButton";
import styles from "./DemoReviewModal.module.css";

export type DemoReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  expertName?: string;
  expertImage?: string;
  expertRole?: string;
  onSubmit?: (rating: number, comment: string) => void;
};

const RATING_LABELS: Record<number, string> = {
  1: "Bad",
  2: "Poor",
  3: "Fair",
  4: "Good",
  5: "Excellent",
};

const EMOJI_MAP: Record<number, { name: string; url: string }> = {
  1: {
    name: "Rage",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.webp",
  },
  2: {
    name: "Sad",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f61e/512.webp",
  },
  3: {
    name: "Neutral Face",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/512.webp",
  },
  4: {
    name: "Smile with Big Eyes",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f603/512.webp",
  },
  5: {
    name: "Heart-Face",
    url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.webp",
  },
};

export default function DemoReviewModal({
  isOpen,
  onClose,
  expertName = "Dr. Ananya Sharma",
  expertImage = "/assets/img/team1.png",
  expertRole = "Senior Cardiologist",
  onSubmit,
}: DemoReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [animatedStar, setAnimatedStar] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ rating: number; comment: string } | null>(null);

  const activeTarget = hoveredRating !== null ? hoveredRating : rating;

  useEffect(() => {
    if (!activeTarget) {
      setAnimatedStar(null);
      return;
    }
    const delay = (activeTarget - 1) * 70;
    const timer = setTimeout(() => {
      setAnimatedStar(activeTarget);
    }, delay);
    return () => clearTimeout(timer);
  }, [activeTarget]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredRating(null);
      setComment("");
      setIsSubmitted(false);
      setSubmittedData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit?.(rating, comment.trim());
    setSubmittedData({ rating, comment: comment.trim() });
    setIsSubmitted(true);
  };

  const handleStarClick = (starValue: number) => {
    setRating((prev) => (prev === starValue ? 0 : starValue));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Jatayu Angled Polygon Header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalHeaderTitle}>
            {isSubmitted ? "Thanks for your review!" : "Session Feedback"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={styles.headerCloseBtn}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {isSubmitted ? (
            /* Success State */
            <div className={styles.submittedContainer}>
              {/* Confetti Overlay */}
              <div className={styles.confettiWrap} aria-hidden="true">
                <Lottie animationData={confettiAnimation} loop={false} autoplay={true} />
              </div>

              <div className={styles.animatedBadgeWrap}>
                <div className={styles.successIconBadge}>
                  <CheckCircle2 size={44} className={styles.successCheckIcon} />
                </div>
              </div>

              <h2 className={styles.submittedTitle}>Thanks for your review!</h2>
              <div className={styles.creditsEarnedBadge}>
                <Lottie
                  animationData={coinAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: 28, height: 28 }}
                />
                <span>+15 Credits Earned</span>
              </div>
              <p className={styles.submittedDesc}>
                Thank you for sharing your experience with <strong>{expertName}</strong>.
                <br />
                You have earned <strong>15 credits</strong> for your feedback!
              </p>

              <div className={styles.submittedSummaryBox}>
                <div className={styles.submittedStarsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={22}
                      fill={i < (submittedData?.rating || rating) ? "#FFBC09" : "transparent"}
                      stroke={i < (submittedData?.rating || rating) ? "#FFBC09" : "#9E9E9E"}
                      className={styles.animatedSummaryStar}
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                  <span className={styles.submittedRatingLabel}>
                    {RATING_LABELS[submittedData?.rating || rating]}
                  </span>
                </div>
                {submittedData?.comment ? (
                  <p className={styles.submittedCommentQuote}>
                    &ldquo;{submittedData.comment}&rdquo;
                  </p>
                ) : (
                  <p className={styles.noCommentText}>No written review provided</p>
                )}
              </div>

              <div className={styles.modalActions}>
                <ContinueButton label="Done" onClick={onClose} />
              </div>
            </div>
          ) : (
            /* Review Rating Form */
            <div className={styles.formContainer}>
              <div className={styles.reviewIntro}>
                <h2>
                  <span className={styles.headingLineOne}>Rate your session</span>
                  <span className={styles.headingLineTwo}>
                    & earn 15 credits
                    <span className={styles.coinLottieWrap}>
                      <Lottie
                        animationData={coinAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: 32, height: 32 }}
                      />
                    </span>
                  </span>
                </h2>

                <div className={styles.avatarRow}>
                  <div
                    className={`${styles.reviewAvatar} ${
                      activeTarget > 0 ? styles.reviewAvatarShifted : ""
                    }`}
                  >
                    <Image
                      src={expertImage}
                      alt={expertName}
                      fill
                      className={styles.reviewAvatarImg}
                      sizes="80px"
                    />
                  </div>
                  <div
                    className={`${styles.emojiBadgeCircle} ${
                      activeTarget > 0 ? styles.emojiBadgeCircleActive : ""
                    }`}
                    title={activeTarget > 0 ? EMOJI_MAP[activeTarget]?.name : undefined}
                  >
                    {activeTarget > 0 ? (
                      <Image
                        key={`emoji-img-${activeTarget}`}
                        src={EMOJI_MAP[activeTarget].url}
                        alt={EMOJI_MAP[activeTarget].name}
                        width={64}
                        height={64}
                        unoptimized
                        className={styles.emojiImg}
                      />
                    ) : null}
                  </div>
                </div>
                <h3 className={styles.expertNameTitle}>{expertName}</h3>
                {expertRole && <span className={styles.expertRoleSubtitle}>{expertRole}</span>}
                <p className={styles.introHelperText}>
                  Your feedback is vital to help other seekers choose the right expert.
                </p>
              </div>

              <form onSubmit={handleSubmit} className={styles.reviewForm}>
                <div className={styles.starRatingSelector}>
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isSelectedLottie =
                      animatedStar === starValue && activeTarget === starValue;
                    const isHighlighted =
                      activeTarget !== 0 && starValue <= activeTarget;

                    return (
                      <button
                        key={starValue}
                        type="button"
                        className={styles.starBtn}
                        onMouseEnter={() => setHoveredRating(starValue)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => handleStarClick(starValue)}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                      >
                        {isSelectedLottie ? (
                          <Lottie
                            key={`lottie-${starValue}-${activeTarget}`}
                            animationData={starAnimation}
                            loop={false}
                            autoplay={true}
                            style={{
                              width: 104,
                              height: 104,
                              transform: "translateY(-5px) scale(1.65)",
                              pointerEvents: "none",
                            }}
                          />
                        ) : isHighlighted ? (
                          <Star
                            key={`star-filled-${starValue}-${activeTarget}`}
                            size={42}
                            fill="#FFBC09"
                            stroke="#FFBC09"
                            className={`${styles.ratingStarIcon} ${styles.ratingStarIconFilled}`}
                            style={{ animationDelay: `${(starValue - 1) * 70}ms` }}
                          />
                        ) : (
                          <Star
                            size={42}
                            fill="transparent"
                            stroke="#9E9E9E"
                            className={styles.ratingStarIcon}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeTarget > 0 && (
                  <span className={styles.currentRatingText}>
                    {RATING_LABELS[activeTarget]}
                  </span>
                )}

                <div className={styles.commentFormGroup}>
                  <label className={styles.formLabel} htmlFor="demo-review-comment">
                    Write a review
                  </label>
                  <textarea
                    id="demo-review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share details about what advice was helpful, communication quality, or general takeaways (optional)..."
                    className={styles.commentTextarea}
                    rows={3}
                  />
                </div>

                <div className={styles.modalActions}>
                  <ContinueButton
                    type="submit"
                    label="Submit Feedback"
                    disabled={rating === 0}
                  />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Jatayu Angled Polygon Footer */}
        <div className={styles.modalFooter} />
      </div>
    </div>
  );
}
