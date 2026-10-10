"use client";

import { Bookmark, Eye, Bell, Tag, Clock, Star, ChevronRight, Gift } from "lucide-react";
import type { AdminSeekerDetail } from "@/lib/adminSeekerApi";
import styles from "./ProfileEngagement.module.css";

type ProfileEngagementProps = { engagement?: AdminSeekerDetail["engagement"] };

export default function ProfileEngagement({ engagement }: ProfileEngagementProps) {
  const savedExperts = engagement?.savedExperts ?? [];
  const recentlyViewed = engagement?.recentlyViewed ?? [];
  const automatedOffers = engagement?.automatedOffers ?? [];
  const expertCard = (expert: (typeof savedExperts)[number], action: "Saved" | "Viewed", Icon: typeof Bookmark) => (
    <div key={expert.id} className={styles.expertCard}>
      <div className={styles.expertCardTop}>
        <div className={styles.expertAvatar}><img src={expert.avatar || "/assets/img/manportrait.png"} alt={expert.name} /></div>
        <div className={styles.expertInfo}><h4 className={styles.expertName}>{expert.name}</h4><span className={styles.expertCategory}>{expert.category}</span></div>
      </div>
      <div className={styles.expertMeta}>
        <span className={styles.expertRating}><Star size={12} /> {expert.rating ?? "—"} <span className={styles.expertReviews}>({expert.reviews})</span></span>
        <span className={styles.expertRate}>{expert.hourlyRate === null ? "—" : "₹" + expert.hourlyRate + "/hr"}</span>
      </div>
      <div className={styles.expertFooter}><span className={styles.savedTime}><Icon size={11} /> {action} {expert.timeLabel}</span></div>
    </div>
  );

  return (
    <div className={styles.engagementWrapper}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}><div className={styles.sectionHeaderLeft}><Bookmark size={18} className={styles.sectionIcon} /><h3 className={styles.sectionTitle}>Saved Experts</h3><span className={styles.countBadge}>{savedExperts.length}</span></div></div>
        <div className={styles.cardGrid}>{savedExperts.map((expert) => expertCard(expert, "Saved", Bookmark))}</div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeader}><div className={styles.sectionHeaderLeft}><Eye size={18} className={styles.sectionIcon} /><h3 className={styles.sectionTitle}>Recently Viewed</h3><span className={styles.countBadge}>{recentlyViewed.length}</span></div></div>
        <div className={styles.cardGrid}>{recentlyViewed.map((expert) => expertCard(expert, "Viewed", Eye))}</div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeader}><div className={styles.sectionHeaderLeft}><Gift size={18} className={styles.sectionIcon} /><h3 className={styles.sectionTitle}>Automated Engagement &amp; Offers</h3></div></div>
        <div className={styles.triggerList}>
          {automatedOffers.map((trigger) => (
            <div key={trigger.id} className={styles.triggerCard}>
              <div className={styles.triggerIconCol}><div className={styles.triggerIconBox + " " + (trigger.type === "reminder" ? styles.triggerIconReminder : styles.triggerIconDiscount)}>{trigger.type === "reminder" ? <Bell size={18} /> : <Tag size={18} />}</div></div>
              <div className={styles.triggerContent}>
                <div className={styles.triggerTop}><h4 className={styles.triggerTitle}>{trigger.title}</h4><span className={styles.triggerStatus + " " + (trigger.status === "active" ? styles.triggerStatusActive : styles.triggerStatusScheduled)}>{trigger.status === "active" ? "Active" : "Scheduled"}</span></div>
                <p className={styles.triggerDesc}>{trigger.description}</p>
                <div className={styles.triggerMeta}><span className={styles.triggerTiming}><Clock size={12} /> {trigger.timing}</span>{trigger.discount && <span className={styles.triggerDiscount}><Tag size={12} /> {trigger.discount} off</span>}<span className={styles.triggerTarget}><ChevronRight size={12} /> {trigger.target}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
