"use client";

import Image from "next/image";
import { Check, MapPin } from "lucide-react";
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
  const seekerUser = !isExpert ? (user as SeekerUser) : undefined;

  const userLanguages = isExpert
    ? ["Hindi", "English", "Marathi"]
    : (seekerUser?.languages ?? []);
  const isVerified = isExpert || Boolean(seekerUser?.isEmailVerified || seekerUser?.isPhoneVerified);

  return (
    <div className={styles.heroCard}>
      <div className={styles.profileHeroBody}>
        <div className={styles.heroTopRow}>
          <div className={styles.avatarWrapper}>
            <Image
              src={user.avatar || "/assets/img/manportrait.png"}
              alt={user.name}
              width={96}
              height={96}
              className={styles.heroAvatar}
            />
            {isVerified && <span className={styles.avatarBadge} title="Verified Profile">
              <Check size={14} />
            </span>}
          </div>

          <div className={styles.heroHeaderInfo}>
            <div className={styles.heroNameRow}>
              <div>
                <div className={styles.nameGroup}>
                  <h2 className={styles.heroName}>{user.name}</h2>
                </div>
                <p className={styles.metaText}>
                  <MapPin size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {userLocation} · Member since {joinedDate} · {isExpert ? "Last active" : "Last updated"} {lastActive}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroDetails}>
          <p className={styles.bioText}>
            {isExpert
              ? (expertUser?.bio || "Experienced domain consultant helping clients navigate complex challenges with actionable guidance.")
              : (seekerUser?.profileBio || seekerUser?.needsText || "No profile details provided.")}
          </p>

          <div className={styles.chipGroup}>
            {categoryName && <span className={styles.chip}>{categoryName}</span>}
            {isExpert && expertUser?.subCategory && <span className={styles.chip}>{expertUser.subCategory}</span>}
            {!isExpert && seekerUser?.budgetTier && (
              <span className={styles.chip} style={{ background: "rgba(230, 81, 0, 0.08)", color: "var(--tango)", borderColor: "rgba(230, 81, 0, 0.2)" }}>
                {seekerUser.budgetTier} Tier
              </span>
            )}
            {userLanguages.map((lang) => (
              <span key={lang} className={styles.chip}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
