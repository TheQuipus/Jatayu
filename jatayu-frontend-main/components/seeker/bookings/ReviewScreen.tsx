"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
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
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating first.");
      return;
    }
    onSubmit(rating, comment.trim());
  };

  return (
    <section className={styles.reviewSection}>
      <div className={`container ${styles.reviewContainer}`}>
        <div className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewHeaderTitle}>Session Feedback</span>
            <span className={styles.reviewHeaderDots} />
            <div className={styles.soundwaveIcon} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className={styles.reviewBody}>
            <div className={styles.reviewIntro}>
              <div className={styles.reviewAvatar}>
                <Image
                  src={booking.expert.image}
                  alt={booking.expert.name}
                  fill
                  className={styles.reviewAvatarImg}
                  sizes="80px"
                />
              </div>
              <h2>Rate your session with {booking.expert.name}</h2>
              <p>Your feedback is vital to help other seekers choose the right expert.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.reviewForm}>
              <div className={styles.ratingFormGroup}>
                <label className={styles.formLabel}>How would you rate this session?</label>
                <div className={styles.starRatingSelector}>
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isHighlighted =
                      hoveredRating !== null
                        ? starValue <= hoveredRating
                        : starValue <= rating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        className={styles.starBtn}
                        onMouseEnter={() => setHoveredRating(starValue)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => setRating((prev) => (prev === starValue ? 0 : starValue))}
                      >
                        <Star
                          size={36}
                          fill={isHighlighted ? "#EAB308" : "transparent"}
                          stroke={isHighlighted ? "#EAB308" : "#9E9E9E"}
                          className={styles.ratingStarIcon}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.commentFormGroup}>
                <label className={styles.formLabel} htmlFor="review-comment">
                  Review Comments
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share detail about what advice was helpful, communication quality, or general takeaways..."
                  className={styles.commentTextarea}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.formActions}>
                {onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className={styles.cancelReviewBtn}
                  >
                    Go Back
                  </button>
                ) : (
                  <Link
                    href="/seeker/bookings"
                    className={styles.cancelReviewBtn}
                  >
                    Go Back
                  </Link>
                )}
                <ContinueButton
                  type="submit"
                  label="Submit Feedback"
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
