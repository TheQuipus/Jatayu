"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Bookmark as BookmarkIcon } from "lucide-react";
import { expertSlug, type Expert } from "@/lib/experts";
import buttonStyles from "./PrimaryButton.module.css";
import styles from "./ExpertCard.module.css";

type ExpertCardProps = {
  expert: Expert;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  className?: string;
  linkToDetail?: boolean;
  disableHover?: boolean;
  showLanguages?: boolean;
  priority?: boolean;
};

export default function ExpertCard({
  expert,
  isBookmarked = false,
  onBookmarkToggle,
  className = "",
  linkToDetail = true,
  disableHover = false,
  showLanguages = true,
  priority = false,
}: ExpertCardProps) {
  const detailHref = `/expert/${expertSlug(expert.name)}`;

  const cardBody = (
    <>
      {onBookmarkToggle && (
        <button
          type="button"
          className={styles.bookmarkBtn}
          aria-label={isBookmarked ? `Remove ${expert.name} from bookmarks` : `Bookmark ${expert.name}`}
          aria-pressed={isBookmarked}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onBookmarkToggle();
          }}
        >
          <BookmarkIcon size={22} strokeWidth={1.75} />
        </button>
      )}

      <article className={styles.expertCard}>
        <div className={styles.categoryBadgeWrap}>
          <span className={styles.categoryBadge}>
            <span className={styles.badgeDot} />
            {(expert.category || expert.topics[0] || "General").toUpperCase()}
          </span>
        </div>

        <div className={styles.expertImageWrap}>
          {expert.image.startsWith("blob:") || expert.image.startsWith("data:") ? (
            <img
              src={expert.image}
              alt={expert.name}
              className={styles.expertImage}
            />
          ) : (
            <Image
              src={expert.image}
              alt={expert.name}
              fill
              className={styles.expertImage}
              sizes="(max-width: 1024px) 50vw, 25vw"
              priority={priority}
            />
          )}
        </div>

        {/* Languages & image area */}
        {showLanguages && (
          <div className={styles.expertCardBody}>
            <div className={styles.languagesSection}>
              <span className={styles.languagesLabel}>LANGUAGES</span>
              <ul className={styles.languagesList}>
                {expert.languages.map((lang) => (
                  <li key={lang}>{lang}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Bottom info section */}
        <div className={styles.expertMeta}>
          <div className={styles.expertNameRow}>
            <span className={styles.expertName}>
              {expert.name.toUpperCase()}
              <BadgeCheck
                size={18}
                className={styles.verificationBadge}
                aria-hidden="true"
              />
            </span>
          </div>

          <p className={styles.expertStats}>
            From ₹{expert.price} / Rating {expert.rating} / Reply {expert.replyTime}
          </p>

          <div className={styles.divider} />

          <div className={styles.bottomInteractiveArea}>
            <p className={styles.expertDesc}>{expert.desc}</p>
            {!disableHover && (
              <div
                className={`${styles.hoverBtn} btn btn--light ${buttonStyles.primaryButton}`}
                aria-hidden="true"
              >
                <span className={`${buttonStyles.buttonText} btn__text`}>
                  <span className={buttonStyles.labelTrack}>
                    <span className={buttonStyles.labelUp}>LET&apos;S TALK</span>
                    <span className={buttonStyles.labelUp} aria-hidden="true">
                      LET&apos;S TALK
                    </span>
                  </span>
                </span>
                <span className={`btn__icon ${buttonStyles.buttonIcon}`} aria-hidden="true">
                  <img src="/assets/buttonsvg.svg" alt="" width={26} height={26} />
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  );

  return (
    <div className={`${styles.expertCardShell} ${disableHover ? styles.disableHover : ""} ${className}`}>
      {linkToDetail ? (
        <Link href={detailHref} className={styles.expertCardLink}>
          {cardBody}
        </Link>
      ) : (
        cardBody
      )}
    </div>
  );
}
