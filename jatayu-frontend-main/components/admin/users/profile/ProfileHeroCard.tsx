"use client";

import Image from "next/image";
import { Ban, Check, CheckCircle2, Edit3, MapPin } from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import styles from "./ProfileHeroCard.module.css";

type ProfileHeroCardProps = {
  user: ExpertUser | SeekerUser;
  isExpert: boolean;
  userLocation: string;
  joinedDate: string;
  lastActive: string;
  categoryName: string;
  status: string;
  handleToggleStatus: () => void;
};

export default function ProfileHeroCard({
  user,
  isExpert,
  userLocation,
  joinedDate,
  lastActive,
  categoryName,
  status,
  handleToggleStatus,
}: ProfileHeroCardProps) {
  const expertUser = isExpert ? (user as ExpertUser) : undefined;

  return (
    <div className={styles.heroCard}>
      <div className={styles.profileHeroBody}>
        <div className={styles.avatarWrapper}>
          <Image
            src={user.avatar || "/assets/img/manportrait.png"}
            alt={user.name}
            width={96}
            height={96}
            className={styles.heroAvatar}
          />
          <span className={styles.avatarBadge} title="Verified Profile">
            <Check size={14} />
          </span>
        </div>

        <div className={styles.heroDetails}>
          <div className={styles.heroNameRow}>
            <div>
              <div className={styles.nameGroup}>
                <h2 className={styles.heroName}>{user.name}</h2>
              </div>
              <p className={styles.metaText}>
                <MapPin size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {userLocation} · Member since {joinedDate} · Last active {lastActive}
              </p>
            </div>

            <div className={styles.heroActionGroup}>
              <button type="button" className={styles.btnPrimary}>
                <Edit3 size={14} /> Edit Profile
              </button>
              {status === "active" ? (
                <button type="button" className={`${styles.btnSecondary} ${styles.btnDanger}`} onClick={handleToggleStatus}>
                  <Ban size={14} /> Suspend Account
                </button>
              ) : (
                <button type="button" className={styles.btnSecondary} onClick={handleToggleStatus}>
                  <CheckCircle2 size={14} style={{ color: "#16a34a" }} /> Activate Account
                </button>
              )}
            </div>
          </div>

          <p className={styles.bioText}>
            {isExpert
              ? (expertUser?.bio || "Experienced domain consultant helping clients navigate complex challenges with actionable guidance.")
              : "Entrepreneur & business strategist passionate about connecting with top domain experts who can accelerate key decision-making."}
          </p>

          <div className={styles.chipGroup}>
            <span className={styles.chip}>{categoryName}</span>
            {isExpert && expertUser?.subCategory && <span className={styles.chip}>{expertUser.subCategory}</span>}
            <span className={styles.chip}>Hindi</span>
            <span className={styles.chip}>English</span>
            <span className={styles.chip}>Marathi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
