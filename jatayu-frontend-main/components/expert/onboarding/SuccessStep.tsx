"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Lottie from "lottie-react";
import confettiAnimation from "@/public/Lottie/Confetti.json";

import ContinueButton from "@/components/ui/ContinueButton";
import ExpertCard from "@/components/ui/ExpertCard";
import { EXPERT_DASHBOARD_HREF } from "@/lib/expertDashboard";
import { getLowestFormatPrice } from "./preferencesData";
import type { Expert } from "@/lib/experts";
import shared from "./onboarding.shared.module.css";
import styles from "./SuccessStep.module.css";

type SuccessStepProps = {
  userName: string;
  professionalTitle: string;
  tagLine: string;
  bio: string;
  categoryLabel: string;
  languages: string[];
  formatPrices: Record<string, string>;
  profilePhotoSrc: string;
};

export default function SuccessStep({
  userName,
  professionalTitle,
  tagLine,
  bio,
  categoryLabel,
  languages,
  formatPrices,
  profilePhotoSrc,
}: SuccessStepProps) {
  const router = useRouter();

  const expert = useMemo<Expert>(
    () => ({
      name: userName.trim() || "Your Name",
      role: professionalTitle.trim() || "Professional Title",
      desc: tagLine.trim() || "Your tag line appears here.",
      image: profilePhotoSrc,
      category: categoryLabel.trim() || "Category",
      topics: [],
      languages,
      price: getLowestFormatPrice(formatPrices),
      rating: 0,
      replyTime: "0 min",
      bio: bio.trim(),
    }),
    [
      bio,
      categoryLabel,
      formatPrices,
      languages,
      professionalTitle,
      profilePhotoSrc,
      tagLine,
      userName,
    ],
  );

  return (
    <section className={shared.card}>
      <div className={`${shared.cardHeader} ${styles.successHeader}`}>
        <div className={`${shared.topHeader} ${styles.successTopHeader}`} />
      </div>

      <div className={`${shared.cardBody} ${styles.successBody}`}>
        <div className={styles.successMainBody}>
          <h1 className={`${shared.questionTitle} ${styles.successTitle}`}>
            Application <span className={shared.accentWord}>Submitted</span>
          </h1>

          <div className={styles.expertCardWrapper}>
            <div className={`${styles.confettiWrapper} ${styles.confettiLeft}`}>
              <Lottie
                animationData={confettiAnimation}
                loop={false}
                autoplay={true}
              />
            </div>
            <div className={`${styles.confettiWrapper} ${styles.confettiRight}`}>
              <Lottie
                animationData={confettiAnimation}
                loop={false}
                autoplay={true}
              />
            </div>
            <ExpertCard
              expert={expert}
              linkToDetail={false}
              disableHover
              showLanguages={languages.length > 0}
            />
          </div>

          <p className={`${shared.questionSubtitle} ${styles.successSubtitle}`}>
            Fantastic! Your expert profile is now under review. We typically process applications within 24–48 hours.
          </p>
        </div>
      </div>

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
          <ContinueButton
            label="Go to Expert Dashboard"
            onClick={() => {
              router.push(EXPERT_DASHBOARD_HREF);
            }}
          />
        </div>
      </div>
    </section>
  );
}
