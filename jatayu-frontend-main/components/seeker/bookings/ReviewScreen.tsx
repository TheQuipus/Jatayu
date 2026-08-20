"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Star, CheckCircle2, X } from "lucide-react";
import Lottie from "lottie-react";
import starAnimation from "@/public/Lottie/Star.json";
import coinAnimation from "@/public/Lottie/coin_p.json";
import ContinueButton from "@/components/ui/ContinueButton";
import type { BookingDetail } from "@/lib/seekerDashboard";
import styles from "./ReviewScreen.module.css";

type ReviewScreenProps = {
  booking: BookingDetail;
  onSubmit: (rating: number, comment: string) => void;
  onCancel?: () => void;
};

export default function ReviewScreen({
  booking,
  onSubmit,
  onCancel,
}: ReviewScreenProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating first.");
      return;
    }
    onSubmit(rating, comment.trim());
    setSubmittedData({ rating, comment: comment.trim() });
    setIsSubmitted(true);
  };

  const ratingLabels: Record<number, string> = {
    1: "Bad",
    2: "Poor",
    3: "Fair",
    4: "Good",
    5: "Excellent",
  };

  const emojiMap: Record<number, { name: string; url: string }> = {
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

  if (isSubmitted) {
    const finalRating = submittedData?.rating || rating;
    const finalComment = submittedData?.comment || comment.trim();

    return (
      <section className={styles.reviewSection}>
        <div className={`container ${styles.reviewContainer}`}>
          <div className={`${styles.reviewCard} ${styles.animatedSuccessCard}`}>
            <div className={styles.reviewHeader}>
              <span className={styles.reviewHeaderTitle}>Thanks for your review!</span>
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className={styles.headerCloseBtn}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              ) : (
                <X size={18} className={styles.headerCrossIcon} />
              )}
            </div>

            <div className={styles.submittedBody}>
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
                Thank you for sharing your experience with <strong>{booking.expert.name}</strong>.
                <br />
                You have earned <strong>15 credits</strong> for your feedback!
              </p>

              <div className={styles.submittedSummaryBox}>
                <div className={styles.submittedStarsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={22}
                      fill={i < finalRating ? "#FFBC09" : "transparent"}
                      stroke={i < finalRating ? "#FFBC09" : "#9E9E9E"}
                      className={styles.animatedSummaryStar}
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                  <span className={styles.submittedRatingLabel}>
                    {ratingLabels[finalRating]}
                  </span>
                </div>
                {finalComment ? (
                  <p className={styles.submittedCommentQuote}>
                    &ldquo;{finalComment}&rdquo;
                  </p>
                ) : (
                  <p className={styles.noCommentText}>No written review provided</p>
                )}
              </div>
            </div>
            <div className={styles.reviewFooter} aria-hidden="true" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.reviewSection}>
      <div className={`container ${styles.reviewContainer}`}>
        <div className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewHeaderTitle}>Session Feedback</span>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className={styles.headerCloseBtn}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            ) : (
              <X size={18} className={styles.headerCrossIcon} />
            )}
          </div>

          <div className={styles.reviewBody}>
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
                      style={{ width: 34, height: 34 }}
                    />
                  </span>
                </span>
              </h2>
              <div className={styles.avatarRow}>
                <div
                  className={`${styles.reviewAvatar} ${activeTarget > 0 ? styles.reviewAvatarShifted : ""
                    }`}
                >
                  <Image
                    src={booking.expert.image}
                    alt={booking.expert.name}
                    fill
                    className={styles.reviewAvatarImg}
                    sizes="80px"
                  />
                </div>
                <div
                  className={`${styles.emojiBadgeCircle} ${activeTarget > 0 ? styles.emojiBadgeCircleActive : ""
                    }`}
                  title={activeTarget > 0 ? emojiMap[activeTarget]?.name : undefined}
                >
                  {activeTarget > 0 ? (
                    <Image
                      key={`emoji-img-${activeTarget}`}
                      src={emojiMap[activeTarget].url}
                      alt={emojiMap[activeTarget].name}
                      width={64}
                      height={64}
                      unoptimized
                      className={styles.emojiImg}
                    />
                  ) : null}
                </div>
              </div>
              <h3 className={styles.expertNameTitle}>{booking.expert.name}</h3>
              <p>Your feedback is vital to help other seekers choose the right expert.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.reviewForm}>
              <div className={styles.ratingFormGroup}>
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
                        onClick={() => setRating((prev) => (prev === starValue ? 0 : starValue))}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                      >
                        {isSelectedLottie ? (
                          <Lottie
                            key={`lottie-${starValue}-${activeTarget}`}
                            animationData={starAnimation}
                            loop={false}
                            autoplay={true}
                            style={{
                              width: 108,
                              height: 108,
                              transform: "translateY(-5px) scale(1.65)",
                              pointerEvents: "none",
                            }}
                          />
                        ) : isHighlighted ? (
                          <Star
                            key={`star-filled-${starValue}-${activeTarget}`}
                            size={44}
                            fill="#FFBC09"
                            stroke="#FFBC09"
                            className={`${styles.ratingStarIcon} ${styles.ratingStarIconFilled}`}
                            style={{ animationDelay: `${(starValue - 1) * 70}ms` }}
                          />
                        ) : (
                          <Star
                            size={44}
                            fill="transparent"
                            stroke="#9E9E9E"
                            className={styles.ratingStarIcon}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.commentFormGroup}>
                <label className={styles.formLabel} htmlFor="review-comment">
                  Write a review
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about what advice was helpful, communication quality, or general takeaways (optional)..."
                  className={styles.commentTextarea}
                  rows={4}
                />
              </div>

              <div className={styles.formActions}>
                <ContinueButton
                  type="submit"
                  label="Submit Feedback"
                  disabled={rating === 0}
                  className={styles.submitReviewBtn}
                />
              </div>
            </form>
          </div>
          <div className={styles.reviewFooter} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
