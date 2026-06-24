"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Compass, ArrowRight, CheckCircle2 } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import shared from "./onboarding.shared.module.css";
import styles from "./SuccessStep.module.css";
import ExpertCard from "@/components/ui/ExpertCard";
import { featuredExperts, type Expert } from "@/lib/experts";

type SuccessStepProps = {
  userName: string;
  selectedCategory: string;
  categoryLabel: string;
};

export default function SuccessStep({
  userName,
  selectedCategory,
  categoryLabel,
}: SuccessStepProps) {
  const [isMatching, setIsMatching] = useState(true);
  const [matches, setMatches] = useState<Expert[]>([]);

  useEffect(() => {
    // Simulate AI match calculations
    const timer = setTimeout(() => {
      // Find experts that match topic categories, or fallback to first 3 featured
      let filtered = featuredExperts.filter((exp) => {
        // Map category keys (software, design, business, marketing, finance, legal) to expert topics
        const topicsString = exp.topics.map(t => t.toLowerCase()).join(" ");
        const searchKey = selectedCategory.toLowerCase();
        
        if (searchKey === "software" && topicsString.includes("jobs")) return true;
        if (searchKey === "design" && topicsString.includes("creator")) return true;
        if (searchKey === "business" && topicsString.includes("startup")) return true;
        if (searchKey === "marketing" && topicsString.includes("growth")) return true;
        if (searchKey === "finance" && topicsString.includes("finance")) return true;
        if (searchKey === "legal" && topicsString.includes("legal")) return true;
        if (searchKey === "product" && topicsString.includes("jobs")) return true;
        if (searchKey === "data" && topicsString.includes("finance")) return true;
        
        return false;
      });

      if (filtered.length === 0) {
        filtered = featuredExperts.slice(0, 3);
      } else {
        filtered = filtered.slice(0, 3);
      }
      
      setMatches(filtered);
      setIsMatching(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [selectedCategory]);

  if (isMatching) {
    return (
      <section className={shared.card} style={{ justifyContent: "center" }}>
        <div className={styles.loadingWrapper}>
          <div className={styles.radarContainer}>
            <div className={styles.radarPulse} />
            <div className={styles.radarPulse2} />
            <Compass className={styles.loadingIcon} size={48} />
          </div>
          <h1 className={styles.loadingTitle}>
            Finding Your <span className={shared.accentWord}>Guides</span>...
          </h1>
          <p className={styles.loadingSubtitle}>
            Our AI matcher is analyzing your needs and selecting the top 3 experts in {categoryLabel} for you.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={shared.card} style={{ maxWidth: "1140px" }}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={styles.statusBadge}>
            <CheckCircle2 size={14} className={styles.checkIcon} />
            <span>Matched Completed</span>
          </div>
        </div>
      </div>

      <div className={shared.cardBody} style={{ minHeight: "auto", maxHeight: "none", overflowY: "visible" }}>
        <h1 className={shared.questionTitle} style={{ marginTop: "16px", marginBottom: "12px" }}>
          Your Matches are <span className={shared.accentWord}>Ready</span>!
        </h1>
        
        <p className={shared.questionSubtitle} style={{ maxWidth: "580px", margin: "0 auto 36px" }}>
          We've found the top experts in India who match your needs. We've also sent direct WhatsApp link recommendations to your phone!
        </p>

        {/* Matches Grid */}
        <div className={styles.matchesGrid}>
          {matches.map((expert) => (
            <ExpertCard
              key={expert.name}
              expert={expert}
              linkToDetail={true}
              showLanguages={false}
              className={styles.matchCardShell}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={shared.onboardingFooter}>
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
          <div className={shared.footerTip}>
            <strong>Matches secured!</strong>
            <small>Click on any expert card to book your call.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={() => {
              window.location.href = "/expert";
            }}
          >
            <span>Browse All Experts</span>
            <ArrowRight size={14} style={{ marginLeft: "4px" }} />
          </button>
        </div>
      </div>
    </section>
  );
}
