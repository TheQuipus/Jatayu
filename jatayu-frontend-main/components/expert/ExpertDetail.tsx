"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Bookmark,
  BadgeCheck,
  Star,
  Briefcase,
  Languages,
  MapPin,
  Zap,
  MessageSquare,
  Video,
  Phone,
  RefreshCw,
} from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useSeekerBreadcrumbs } from "@/components/seeker/SeekerShellContext";
import cardStyles from "@/components/ui/ExpertCard.module.css";
import ContactActionButton from "@/components/ui/ContactActionButton";
import { getExpertCheckoutHref, getRelatedExperts, type Expert } from "@/lib/experts";
import { useBookmarks } from "@/lib/useBookmarks";
import styles from "./ExpertDetail.module.css";
import HeroLines from "@/components/ui/HeroLines";

type ExpertDetailProps = {
  expert: Expert;
  seeker?: boolean;
};

export default function ExpertDetail({ expert, seeker = false }: ExpertDetailProps) {
  const [selectedOption, setSelectedOption] = useState<string>("text");
  const { bookmarkedExperts, toggleBookmark } = useBookmarks();
  const isBookmarked = bookmarkedExperts.has(expert.name);
  const relatedExperts = getRelatedExperts(expert);
  const primaryTopic = expert.topics[0] || "General";

  const breadcrumbItems = useMemo(
    () => [
      { label: "Discover", href: seeker ? "/seeker/discover" : "/expert" },
      { label: primaryTopic },
      { label: expert.name },
    ],
    [expert.name, primaryTopic, seeker]
  );

  const breadcrumbNode = useMemo(
    () => (
      <div className={`${styles.breadcrumbWrap} ${seeker ? styles.breadcrumbWrapSeeker : ""}`}>
        <Breadcrumbs items={breadcrumbItems} />
      </div>
    ),
    [breadcrumbItems, seeker]
  );

  useSeekerBreadcrumbs(seeker ? breadcrumbNode : null);

  // Split name for the two-line display (e.g. SNEHA / LAXMESHWAR)
  const nameParts = expert.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const bookingOptions = [
    {
      id: "text",
      title: "Text Answer",
      icon: MessageSquare,
      desc: "Ask a detailed question. Get a comprehensive text/voice response.",
      sla: "24 Hours",
      followUp: "1 Follow-up",
    },
    {
      id: "video",
      title: "Video Answer",
      icon: Video,
      desc: "Ask a detailed question. Get a comprehensive text/voice response.",
      sla: "24 Hours",
      followUp: "1 Follow-up",
    },
    {
      id: "live",
      title: "Live Video Call",
      icon: Phone,
      desc: "Ask a detailed question. Get a comprehensive text/voice response.",
      sla: "24 Hours",
      followUp: "1 Follow-up",
    },
  ];

  return (
    <>
      <section
        className={`${styles.detail} ${seeker ? styles.detailSeeker : ""}`}
      >
        <div className={`container ${styles.detailInner}`}>
          {!seeker ? breadcrumbNode : null}

          <div className={styles.mainGrid}>
            {/* COLUMN 1: Portrait Card, and Topic Pills */}
            <div className={styles.leftCol}>
              <article className={styles.portraitCard}>
                <button
                  type="button"
                  className={cardStyles.bookmarkBtn}
                  aria-label={
                    isBookmarked
                      ? `Remove ${expert.name} from bookmarks`
                      : `Bookmark ${expert.name}`
                  }
                  aria-pressed={isBookmarked}
                  onClick={() => toggleBookmark(expert.name)}
                >
                  <Bookmark size={22} strokeWidth={1.75} />
                </button>

                <div className={cardStyles.categoryBadgeWrap}>
                  <span className={cardStyles.categoryBadge}>
                    <span className={cardStyles.badgeDot} />
                    {(expert.category || primaryTopic).toUpperCase()}
                  </span>
                </div>

                <div className={styles.portraitImageWrap}>
                  <Image
                    src={expert.image}
                    alt={expert.name}
                    fill
                    className={styles.portraitImage}
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    priority
                  />
                </div>

                <div className={styles.cardOverlay}>
                  <div className={cardStyles.expertMeta}>
                    <div className={cardStyles.expertNameRow}>
                      <span className={cardStyles.expertName}>
                        {expert.name.toUpperCase()}
                        <BadgeCheck
                          size={18}
                          className={cardStyles.verificationBadge}
                          aria-hidden="true"
                        />
                      </span>
                    </div>

                    <div className={cardStyles.bottomInteractiveArea}>
                      <p className={cardStyles.expertDesc}>{expert.desc}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* COLUMN 2 & 3: Info, Bio, and Sample Answers */}
            <div className={styles.centerCol}>
              <h1 className={`display ${styles.displayName}`}>
                <span>{firstName}</span>
                <span className="t-muted">{lastName}</span>
              </h1>

              <p className={styles.roleSub}>{expert.role}</p>

              <div className={styles.starDivider}>
                <span className={styles.dividerStar}>✦</span>
                <span className={styles.dividerLine} />
              </div>

              <div className={styles.ratingsRow}>
                <div className={styles.ratingItem}>
                  <Star size={16} fill="#EAB308" stroke="#EAB308" />
                  <span className={styles.ratingText}>
                    <strong>{expert.rating}</strong> ({expert.reviewsCount || 120} reviews)
                  </span>
                </div>
                <div className={styles.ratingItem}>
                  <Briefcase size={16} className={styles.statsIcon} />
                  <span className={styles.ratingText}>
                    <strong>{expert.sessionsCompleted || "350+ Sessions Completed"}</strong>
                  </span>
                </div>
              </div>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <div className={styles.metaIconBadge}>
                    <Languages size={13} />
                  </div>
                  <span className={styles.metaVal}>{expert.languages.join(", ")}</span>
                </div>
                <div className={styles.metaItem}>
                  <div className={styles.metaIconBadge}>
                    <MapPin size={13} />
                  </div>
                  <span className={styles.metaVal}>{expert.location || "Mumbai, India"}</span>
                </div>
                <div className={`${styles.metaItem} ${styles.metaItemGreen}`}>
                  <Zap size={14} fill="currentColor" />
                  <span className={styles.metaVal}>Replies in {expert.replyTime}</span>
                </div>
              </div>

              <p className={styles.bioText}>{expert.bio || expert.desc}</p>
            </div>

            {/* COLUMN 4: Booking Panel and Book Now CTA */}
            <div className={styles.rightCol}>
              <div className={styles.rightColInner}>
                <div className={styles.bookingBox}>
                  <div className={styles.bookingHeader}>
                    <span className={styles.bookingHeaderTitle}>Book a session</span>
                    <span className={styles.bookingHeaderDots} />
                    <div className={styles.soundwaveIcon}>
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className={styles.bookingOptions} role="radiogroup" aria-label="Session type">
                    {bookingOptions.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      const IconComponent = opt.icon;

                      return (
                        <div
                          key={opt.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          className={`${styles.optionGroup} ${isSelected ? styles.optionGroupActive : ""
                            }`}
                          onClick={() => setSelectedOption(opt.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedOption(opt.id);
                            }
                          }}
                        >
                          <div className={styles.optionHeaderRow}>
                            <div className={styles.optionHeaderLeft}>
                              <IconComponent
                                size={16}
                                strokeWidth={2}
                                className={styles.optionIcon}
                              />
                              <span className={styles.optionTitle}>{opt.title}</span>
                            </div>
                            <span className={styles.optionPrice}>
                              ₹{expert.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className={styles.optionBody}>
                            <p className={styles.optionDesc}>{opt.desc}</p>

                            <div className={styles.optionMeta}>
                              <span className={styles.optionSla}>
                                <Zap size={12} className={styles.slaIcon} />
                                SLA: {opt.sla}
                              </span>
                              <span className={styles.optionFollow}>
                                <RefreshCw size={12} className={styles.followIcon} />
                                {opt.followUp}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.bookingFooter} />
                </div>

                <ContactActionButton
                  label="BOOK NOW"
                  avatarSrc={expert.image}
                  avatarAlt={expert.name}
                  href={getExpertCheckoutHref(expert, selectedOption, { seeker })}
                  variant="dark"
                  wrapperClassName={styles.ctaButtonRow}
                  className={styles.bookNowButton}
                  fullWidth
                />
              </div>
            </div>

            {/* TAGS LIST: Spans 2 columns below card and bio */}
            <div className={styles.tagListBelow}>
              {expert.topics.map((topic) => (
                <span key={topic} className={styles.topicTag}>
                  {topic.toUpperCase()}
                </span>
              ))}
            </div>

            {/* SAMPLE ANSWERS: Spans multiple columns on desktop */}
            {expert.sampleAnswers && expert.sampleAnswers.length > 0 && (
              <div className={styles.sampleAnswersSection}>
                <h2 className={styles.sampleAnswersTitle}>Sample Answers</h2>
                <div className={styles.sampleAnswersList}>
                  {expert.sampleAnswers.slice(0, 2).map((sample, idx) => (
                    <div key={idx} className={styles.sampleAnswerCardOuter}>
                      <div className={styles.sampleAnswerCardInner}>
                        <h3 className={styles.sampleQuestion}>
                          &ldquo;{sample.question}&rdquo;
                        </h3>
                        <p className={styles.sampleAnswer}>
                          &ldquo;{sample.answer}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS: Spans 2 columns on desktop below sample answers */}
            {expert.reviews && expert.reviews.length > 0 && (
              <div className={styles.reviewsSection}>
                <div className={styles.reviewsHeader}>
                  <h2 className={styles.reviewsTitle}>Reviews ({expert.reviewsCount || 120})</h2>
                  <div className={styles.reviewsRatingSummary}>
                    <Star size={20} fill="#EAB308" stroke="#EAB308" />
                    <span className={styles.reviewsRatingSummaryText}>{expert.rating}</span>
                  </div>
                </div>
                <div className={styles.reviewsList}>
                  {expert.reviews.map((review, idx) => {
                    const firstLetter = review.userName.charAt(0);
                    return (
                      <div key={idx} className={styles.reviewItem}>
                        <div className={styles.reviewItemHeader}>
                          <div className={styles.reviewUserInfo}>
                            {review.userAvatar ? (
                              <div className={styles.reviewAvatar}>
                                <Image
                                  src={review.userAvatar}
                                  alt={review.userName}
                                  fill
                                  className={styles.reviewAvatarImg}
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div className={styles.reviewAvatarFallback}>
                                <span>{firstLetter}</span>
                              </div>
                            )}
                            <div className={styles.reviewUserMeta}>
                              <span className={styles.reviewUserName}>{review.userName}</span>
                              <span className={styles.reviewUserSub}>
                                {review.consultationType} &bull; {review.dateString}
                              </span>
                            </div>
                          </div>

                          <div className={styles.reviewStars}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < review.rating ? "#EAB308" : "none"}
                                stroke={i < review.rating ? "#EAB308" : "var(--silver)"}
                              />
                            ))}
                          </div>
                        </div>

                        <p className={styles.reviewText}>{review.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </section>
      <HeroLines rotate180={true} />
    </>

  );
}
