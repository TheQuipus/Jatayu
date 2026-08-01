"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Target,
  MessageSquare,
  Calendar,
  Shield,
  Zap,
  ArrowRight,
  Lock,
  ShieldCheck,
  Mail,
} from "lucide-react";
import RegisterLeftPanel from "@/components/seeker/onboarding/RegisterLeftPanel";
import register from "./register.shared.module.css";
import styles from "./WelcomeStep.module.css";

type WelcomeStepProps = {
  onStart: () => void;
};

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <section className={register.registerCard}>
      <RegisterLeftPanel />

      <div className={`${register.registerRight} ${register.registerRightScroll}`}>
        {/* Main Header */}
        <h1 className={styles.mainTitle} style={{ textAlign: "left", marginTop: 0, fontSize: "32px", lineHeight: "1.2" }}>
          Find Your Perfect <br className={styles.mobileBreak} />
          <span className={styles.gradientText}>Expert Guide</span>
        </h1>
        <p className={styles.subtitle} style={{ textAlign: "left", margin: "12px 0 24px", fontSize: "15px" }}>
          Answer a few questions and we'll match you with verified experts tailored exactly to your needs.
        </p>

        {/* Top Badges Row */}
        <div className={styles.badgesRow} style={{ justifyContent: "flex-start", gap: "8px", marginBottom: "28px" }}>
          <div className={styles.topBadge} style={{ padding: "6px 12px", fontSize: "12px" }}>
            <Shield size={12} className={styles.badgeIcon} />
            <span>10k+ Experts</span>
          </div>
          <div className={styles.topBadge} style={{ padding: "6px 12px", fontSize: "12px" }}>
            <Target size={12} className={styles.badgeIcon} />
            <span>98% Match</span>
          </div>
          <div className={styles.topBadge} style={{ padding: "6px 12px", fontSize: "12px" }}>
            <Zap size={12} className={styles.badgeIcon} />
            <span>2h Response</span>
          </div>
        </div>

        {/* What Happens Next Grid */}
        <div className={styles.whatNextSection} style={{ padding: "20px 16px", marginBottom: "28px" }}>
          <h2 className={styles.whatNextHeader} style={{ textAlign: "left", marginBottom: "16px", fontSize: "11px" }}>
            What Happens Next
          </h2>
          
          <div className={styles.nextGrid} style={{ gap: "16px" }}>
            <div className={styles.gridCard}>
              <div className={styles.gridIconWrap} style={{ width: "32px", height: "32px" }}>
                <Sparkles size={14} className={styles.gridIcon} />
              </div>
              <div className={styles.gridText}>
                <h4 style={{ fontSize: "14px" }}>Tell us your needs</h4>
                <p style={{ fontSize: "12px" }}>Answer brief questions about your goals.</p>
              </div>
            </div>

            <div className={styles.gridCard}>
              <div className={styles.gridIconWrap} style={{ width: "32px", height: "32px" }}>
                <Target size={14} className={styles.gridIcon} />
              </div>
              <div className={styles.gridText}>
                <h4 style={{ fontSize: "14px" }}>Match with experts</h4>
                <p style={{ fontSize: "12px" }}>Our AI finds the top 3 matches.</p>
              </div>
            </div>

            <div className={styles.gridCard}>
              <div className={styles.gridIconWrap} style={{ width: "32px", height: "32px" }}>
                <MessageSquare size={14} className={styles.gridIcon} />
              </div>
              <div className={styles.gridText}>
                <h4 style={{ fontSize: "14px" }}>Choose your format</h4>
                <p style={{ fontSize: "12px" }}>Call, video, or chat.</p>
              </div>
            </div>

            <div className={styles.gridCard}>
              <div className={styles.gridIconWrap} style={{ width: "32px", height: "32px" }}>
                <Calendar size={14} className={styles.gridIcon} />
              </div>
              <div className={styles.gridText}>
                <h4 style={{ fontSize: "14px" }}>Book your session</h4>
                <p style={{ fontSize: "12px" }}>Instant scheduling.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Pills Row */}
        <div className={styles.testimonialsRow} style={{ justifyContent: "flex-start", gap: "8px", marginBottom: "20px" }}>
          <div className={styles.testimonialPill} style={{ fontSize: "12px", padding: "4px 10px 4px 4px" }}>
            <div className={styles.avatarWrap} style={{ width: "24px", height: "24px" }}>
              <Image
                src="/assets/img/avatar1.png"
                alt="User"
                width={24}
                height={24}
                className={styles.avatarImg}
              />
            </div>
            <span>Ideal Business Coach matched</span>
          </div>

          <div className={styles.testimonialPill} style={{ fontSize: "12px", padding: "4px 10px 4px 4px" }}>
            <div className={styles.avatarWrap} style={{ width: "24px", height: "24px" }}>
              <Image
                src="/assets/img/avatar2.png"
                alt="User"
                width={24}
                height={24}
                className={styles.avatarImg}
              />
            </div>
            <span>Saved my project</span>
          </div>
        </div>

        {/* Divider Line */}
        <hr className={styles.divider} style={{ margin: "16px 0 20px" }} />

        {/* Security & Checkpoint Row */}
        <div className={styles.trustItemsRow} style={{ justifyContent: "flex-start", gap: "16px", marginBottom: "24px" }}>
          <div className={styles.trustItem} style={{ fontSize: "12px" }}>
            <Lock size={12} className={styles.trustIcon} />
            <span>SSL Encrypted</span>
          </div>
          <div className={styles.trustItem} style={{ fontSize: "12px" }}>
            <ShieldCheck size={12} className={styles.trustIcon} />
            <span>100% Compliant</span>
          </div>
          <div className={styles.trustItem} style={{ fontSize: "12px" }}>
            <Mail size={12} className={styles.trustIcon} />
            <span>No spam</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className={styles.actionsRow} style={{ justifyContent: "flex-start", margin: 0, gap: "12px" }}>
          <button
            type="button"
            className={styles.startBtn}
            onClick={onStart}
            style={{ minHeight: "48px", fontSize: "13px" }}
          >
            <span>Start My Journey</span>
            <ArrowRight size={14} />
          </button>
          
          <Link href="/expert/" className={styles.browseBtn} style={{ minHeight: "48px", fontSize: "13px" }}>
            Browse Experts
          </Link>
        </div>

        <p className={styles.joinNote} style={{ textAlign: "left", margin: "12px 0 28px" }}>
          Join over 50,000+ users who found their perfect guides.
        </p>

        {/* Bottom Tag Chips */}
        <div className={styles.tagsFooter} style={{ justifyContent: "flex-start", gap: "6px" }}>
          <span className={styles.tagChip} style={{ padding: "4px 10px", fontSize: "10px" }}>GROWTH</span>
          <span className={styles.tagChip} style={{ padding: "4px 10px", fontSize: "10px" }}>BUSINESS</span>
          <span className={styles.tagChip} style={{ padding: "4px 10px", fontSize: "10px" }}>LEGAL</span>
          <span className={styles.tagChip} style={{ padding: "4px 10px", fontSize: "10px" }}>FINANCE</span>
          <span className={styles.tagChip} style={{ padding: "4px 10px", fontSize: "10px" }}>DESIGN</span>
          <span className={styles.tagChip} style={{ padding: "4px 10px", fontSize: "10px" }}>TECH</span>
        </div>
      </div>
    </section>
  );
}
