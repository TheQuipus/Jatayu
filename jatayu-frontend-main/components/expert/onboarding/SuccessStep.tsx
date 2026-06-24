"use client";

import { Award, ArrowRight } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import Image from "next/image";
import shared from "./onboarding.shared.module.css";
import styles from "./SuccessStep.module.css";

type SuccessStepProps = {
  userName: string;
  profilePhotoSrc: string;
};

export default function SuccessStep({
  userName,
  profilePhotoSrc,
}: SuccessStepProps) {
  const isUploadedPhoto =
    profilePhotoSrc.startsWith("blob:") ||
    profilePhotoSrc.startsWith("data:");

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={styles.statusBadgeUnderReview}>
          <span className={styles.statusDotUnderReview} />
          <span>Under Review</span>
        </div>
      </div>
      </div>

      <div className={shared.cardBody}>
      {/* Main Content Area */}
      <div className={styles.successMainBody}>
        {/* Animated circular success ring */}
        <div className={styles.successRingWrapper}>
          <div className={styles.successRingPhoto}>
            {isUploadedPhoto ? (
              <img
                src={profilePhotoSrc}
                alt={`${userName || "Expert"} profile photo`}
                className={styles.successRingPhotoImage}
              />
            ) : (
              <Image
                src={profilePhotoSrc}
                alt={`${userName || "Expert"} profile photo`}
                width={62}
                height={62}
                className={styles.successRingPhotoImage}
              />
            )}
          </div>
          <svg className={styles.successRingSvg} viewBox="0 0 100 100" aria-hidden="true">
            <circle
              className={styles.successRingCircle}
              cx="50"
              cy="50"
              r="44"
              strokeDasharray="276"
              strokeDashoffset="276"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className={shared.questionTitle} style={{ marginTop: "24px", marginBottom: "16px" }}>
          Application <span className={shared.accentWord}>Submitted</span>
        </h1>

        {/* Subtitle */}
        <p className={shared.questionSubtitle} style={{ maxWidth: "440px", margin: "0 auto 32px" }}>
          Fantastic! Your expert profile is now under review. We typically process applications within 24–48 hours.
        </p>

        {/* Badge Unlocked Callout Card */}
        <div className={styles.badgeUnlockedCard} style={{ marginBottom: "40px" }}>
          <div className={styles.badgeAwardIconWrap}>
            <Award size={18} />
          </div>
          <div className={styles.badgeTextWrap}>
            <h5 className={styles.badgeLabel}>Badge Unlocked</h5>
            <p className={styles.badgeValue}>Verification Ready</p>
          </div>
        </div>

        {/* Steps Timeline Tracker */}
        <div className={styles.timelineWrapper}>
          <div className={styles.timelineTrack} />
          
          <div className={styles.timelineNodes}>
            {/* Step 1: Submitted */}
            <div className={`${styles.timelineNode} ${styles.timelineNodeDone}`}>
              <div className={styles.timelineCircle}>1</div>
              <span className={styles.timelineLabelText}>Submitted</span>
            </div>

            {/* Step 2: Review (Active) */}
            <div className={`${styles.timelineNode} ${styles.timelineNodeActive}`}>
              <div className={styles.timelineCircle}>2</div>
              <span className={styles.timelineLabelText}>Review</span>
            </div>

            {/* Step 3: Approved */}
            <div className={styles.timelineNode}>
              <div className={styles.timelineCircle}>3</div>
              <span className={styles.timelineLabelText}>Approved</span>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Footer */}
      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Expert advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Stellar work!</strong>
            <small>Keep an eye on your inbox.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={() => {
              window.location.href = "/expert/dashboard";
            }}
          >
            <span>Go to Expert Dashboard</span>
            <ArrowRight size={14} style={{ marginLeft: "4px" }} />
          </button>
        </div>
      </div>
    </section>
  );
}
