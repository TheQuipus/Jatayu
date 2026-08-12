"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Bookmark as BookmarkIcon } from "lucide-react";
import { getExpertDetailHref, type Expert } from "@/lib/experts";
import buttonStyles from "./PrimaryButton.module.css";
import styles from "./ExpertCard.module.css";

type ExpertCardProps = {
  expert: Expert;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  className?: string;
  linkToDetail?: boolean;
  seeker?: boolean;
  disableHover?: boolean;
  showLanguages?: boolean;
  showCategoryBadge?: boolean;
  priority?: boolean;
  statsText?: string;
};

export default function ExpertCard({
  expert,
  isBookmarked = false,
  onBookmarkToggle,
  className = "",
  linkToDetail = true,
  seeker = false,
  disableHover = false,
  showLanguages = true,
  showCategoryBadge = true,
  priority = false,
  statsText,
}: ExpertCardProps) {
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const detailHref = getExpertDetailHref(expert, { seeker });
  const formattedReplyTime = expert.replyTime
    .replace(/\bhours?\b/gi, "hr")
    .replace(/\bminutes?\b/gi, "min");
  const visibleLanguages = expert.languages.slice(0, 5);
  const hiddenLanguages = expert.languages.slice(visibleLanguages.length);
  const hiddenLanguageCount = hiddenLanguages.length;

  const toggleLanguages = (event: React.SyntheticEvent) => {
    if (hiddenLanguageCount === 0) return;
    event.preventDefault();
    event.stopPropagation();
    setShowAllLanguages((current) => !current);
  };

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
        {showCategoryBadge && (
          <div className={styles.categoryBadgeWrap}>
            <span className={styles.categoryBadge}>
              <span className={styles.badgeDot} />
              {(expert.category || expert.topics[0] || "General").toUpperCase()}
            </span>
          </div>
        )}

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
              loading={(expert.image === "/assets/img/team1.png" || expert.image === "/assets/img/team2.png") && !priority ? "eager" : undefined}
            />
          )}
        </div>

        {/* Languages & image area */}
        {showLanguages && (
          <div className={styles.expertCardBody}>
            <div className={styles.languagesSection}>
              <ul className={styles.languagesList}>
                {visibleLanguages.map((lang) => (
                  <li key={lang}>{lang}</li>
                ))}
                {hiddenLanguageCount > 0 && (
                  <li className={styles.moreLanguages}>
                    <div
                      className={`${styles.languagesDisclosure} ${
                        showAllLanguages ? styles.languagesDisclosureExpanded : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={showAllLanguages}
                      aria-label={`Show all ${expert.languages.length} languages`}
                      onClick={toggleLanguages}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          toggleLanguages(event);
                        }
                      }}
                    >
                      +{hiddenLanguageCount} more
                      <div className={styles.languagesPopover} aria-hidden={!showAllLanguages}>
                        <ul className={styles.languagesPopoverList}>
                          {hiddenLanguages.map((lang) => (
                            <li key={lang}>{lang}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                )}
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

          {statsText !== "" && (
            <p className={styles.expertStats}>
              {statsText ??
                `From ₹${expert.price} / Rating ${expert.rating} / Reply ${formattedReplyTime}`}
            </p>
          )}

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
