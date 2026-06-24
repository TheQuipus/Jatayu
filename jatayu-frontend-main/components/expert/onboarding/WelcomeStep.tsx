"use client";

import Image from "next/image";
import { Shield, Zap, Globe, FolderKanban, ArrowRight, Compass } from "lucide-react";
import shared from "./onboarding.shared.module.css";
import welcome from "./WelcomeStep.module.css";
import panel from "./RegisterLeftPanel.module.css";

type WelcomeStepProps = {
  onStart: () => void;
};

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <section className={shared.card}>
      <div className={panel.headerTitle}>
        <Compass className={panel.headerIcon} />
        <span>Expertjourney</span>
      </div>

      <div className={panel.verifiedPill}>
        <Shield className={panel.verifiedIcon} size={14} />
        <span>Verified expert applications are reviewed within 24–48 hours</span>
      </div>

      <div className={welcome.avatarContainer}>
        <Image
          src="/assets/img/avatar1.png"
          alt="Expert Candidate Profile"
          width={96}
          height={96}
          className={welcome.avatar}
          priority
        />
      </div>

      <h1 className={welcome.title}>
        Welcome to the<br />
        <span className={shared.accentWord}>Expert Network</span>
      </h1>

      <p className={welcome.description}>
        Join a curated community of professionals. Build your profile, set your rates, and start offering consultations.
      </p>

      <div className={welcome.featuresGrid}>
        <div className={panel.featureTag}>
          <Zap className={panel.featureIcon} size={14} />
          <span>Quick setup</span>
        </div>
        <div className={panel.featureTag}>
          <Globe className={panel.featureIcon} size={14} />
          <span>Global audience</span>
        </div>
        <div className={panel.featureTag}>
          <FolderKanban className={panel.featureIcon} size={14} />
          <span>Keep 100% earnings</span>
        </div>
      </div>

      <button
        type="button"
        className={welcome.ctaButton}
        onClick={onStart}
      >
        <span>Start Application</span>
        <ArrowRight size={16} />
      </button>

      <p className={welcome.footerText}>
        Takes about 5-10 minutes. You can save and continue later.
      </p>
    </section>
  );
}
