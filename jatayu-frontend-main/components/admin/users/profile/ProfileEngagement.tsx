"use client";

import { Bookmark, Eye, Bell, Tag, Clock, Star, ChevronRight, Gift } from "lucide-react";
import styles from "./ProfileEngagement.module.css";

const SAVED_EXPERTS = [
  {
    id: "exp-1",
    name: "Dr. Ananya Sharma",
    category: "Vedic Astrology",
    rating: 4.9,
    reviews: 142,
    hourlyRate: 1200,
    avatar: "/assets/img/manportrait.png",
    savedAt: "2 hours ago",
  },
  {
    id: "exp-2",
    name: "Rajesh Kumar Vastu",
    category: "Vastu Shastra",
    rating: 4.8,
    reviews: 98,
    hourlyRate: 1500,
    avatar: "/assets/img/manportrait.png",
    savedAt: "1 day ago",
  },
  {
    id: "exp-3",
    name: "Kavita Iyer",
    category: "Numerology & Tarot",
    rating: 4.7,
    reviews: 64,
    hourlyRate: 800,
    avatar: "/assets/img/manportrait.png",
    savedAt: "3 days ago",
  },
];

const RECENTLY_VIEWED = [
  {
    id: "exp-4",
    name: "Suresh Pandit Ji",
    category: "Puja & Rituals",
    rating: 4.6,
    reviews: 53,
    hourlyRate: 950,
    avatar: "/assets/img/manportrait.png",
    viewedAt: "30 mins ago",
  },
  {
    id: "exp-5",
    name: "Meera Joshi",
    category: "Palmistry",
    rating: 4.5,
    reviews: 41,
    hourlyRate: 700,
    avatar: "/assets/img/manportrait.png",
    viewedAt: "2 hours ago",
  },
  {
    id: "exp-1",
    name: "Dr. Ananya Sharma",
    category: "Vedic Astrology",
    rating: 4.9,
    reviews: 142,
    hourlyRate: 1200,
    avatar: "/assets/img/manportrait.png",
    viewedAt: "5 hours ago",
  },
];

const ENGAGEMENT_TRIGGERS = [
  {
    id: "trigger-1",
    type: "reminder" as const,
    title: "Saved Expert Reminder",
    description: "Send a nudge reminder about saved experts that haven't been booked yet.",
    timing: "After 24 hours",
    status: "active" as const,
    target: "Rajesh Kumar Vastu, Kavita Iyer",
  },
  {
    id: "trigger-2",
    type: "discount" as const,
    title: "5% Discount — Recently Viewed",
    description: "Offer a 5% discount on recently viewed experts to encourage first booking.",
    timing: "After 38–48 hours",
    discount: "5%",
    status: "scheduled" as const,
    target: "Suresh Pandit Ji, Meera Joshi",
  },
  {
    id: "trigger-3",
    type: "discount" as const,
    title: "15% Discount — Win-Back Offer",
    description: "Send a 15% discount on recently viewed experts for users who haven't booked in 5–6 days.",
    timing: "After 5–6 days",
    discount: "15%",
    status: "scheduled" as const,
    target: "All recently viewed experts",
  },
];

export default function ProfileEngagement() {
  return (
    <div className={styles.engagementWrapper}>
      {/* Saved Experts */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Bookmark size={18} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Saved Experts</h3>
            <span className={styles.countBadge}>{SAVED_EXPERTS.length}</span>
          </div>
        </div>
        <div className={styles.cardGrid}>
          {SAVED_EXPERTS.map((expert) => (
            <div key={expert.id} className={styles.expertCard}>
              <div className={styles.expertCardTop}>
                <div className={styles.expertAvatar}>
                  <img src={expert.avatar} alt={expert.name} />
                </div>
                <div className={styles.expertInfo}>
                  <h4 className={styles.expertName}>{expert.name}</h4>
                  <span className={styles.expertCategory}>{expert.category}</span>
                </div>
              </div>
              <div className={styles.expertMeta}>
                <span className={styles.expertRating}>
                  <Star size={12} /> {expert.rating} <span className={styles.expertReviews}>({expert.reviews})</span>
                </span>
                <span className={styles.expertRate}>₹{expert.hourlyRate}/hr</span>
              </div>
              <div className={styles.expertFooter}>
                <span className={styles.savedTime}>
                  <Clock size={11} /> Saved {expert.savedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed Experts */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Eye size={18} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Recently Viewed</h3>
            <span className={styles.countBadge}>{RECENTLY_VIEWED.length}</span>
          </div>
        </div>
        <div className={styles.cardGrid}>
          {RECENTLY_VIEWED.map((expert, idx) => (
            <div key={`${expert.id}-${idx}`} className={styles.expertCard}>
              <div className={styles.expertCardTop}>
                <div className={styles.expertAvatar}>
                  <img src={expert.avatar} alt={expert.name} />
                </div>
                <div className={styles.expertInfo}>
                  <h4 className={styles.expertName}>{expert.name}</h4>
                  <span className={styles.expertCategory}>{expert.category}</span>
                </div>
              </div>
              <div className={styles.expertMeta}>
                <span className={styles.expertRating}>
                  <Star size={12} /> {expert.rating} <span className={styles.expertReviews}>({expert.reviews})</span>
                </span>
                <span className={styles.expertRate}>₹{expert.hourlyRate}/hr</span>
              </div>
              <div className={styles.expertFooter}>
                <span className={styles.savedTime}>
                  <Eye size={11} /> Viewed {expert.viewedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Engagement Triggers & Automated Offers */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <Gift size={18} className={styles.sectionIcon} />
            <h3 className={styles.sectionTitle}>Automated Engagement &amp; Offers</h3>
          </div>
        </div>
        <div className={styles.triggerList}>
          {ENGAGEMENT_TRIGGERS.map((trigger) => (
            <div key={trigger.id} className={styles.triggerCard}>
              <div className={styles.triggerIconCol}>
                {trigger.type === "reminder" ? (
                  <div className={`${styles.triggerIconBox} ${styles.triggerIconReminder}`}>
                    <Bell size={18} />
                  </div>
                ) : (
                  <div className={`${styles.triggerIconBox} ${styles.triggerIconDiscount}`}>
                    <Tag size={18} />
                  </div>
                )}
              </div>
              <div className={styles.triggerContent}>
                <div className={styles.triggerTop}>
                  <h4 className={styles.triggerTitle}>{trigger.title}</h4>
                  <span
                    className={`${styles.triggerStatus} ${trigger.status === "active" ? styles.triggerStatusActive : styles.triggerStatusScheduled}`}
                  >
                    {trigger.status === "active" ? "Active" : "Scheduled"}
                  </span>
                </div>
                <p className={styles.triggerDesc}>{trigger.description}</p>
                <div className={styles.triggerMeta}>
                  <span className={styles.triggerTiming}>
                    <Clock size={12} /> {trigger.timing}
                  </span>
                  {trigger.discount && (
                    <span className={styles.triggerDiscount}>
                      <Tag size={12} /> {trigger.discount} off
                    </span>
                  )}
                  <span className={styles.triggerTarget}>
                    <ChevronRight size={12} /> {trigger.target}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
