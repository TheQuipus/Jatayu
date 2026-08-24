"use client";

import { useMemo } from "react";
import { MapPin, Languages } from "lucide-react";
import type { ExpertApplicationSubmission } from "@/lib/expertApplicationSubmission";
import type { ApplicationReviewDetail } from "@/lib/adminApplicationReview";
import { formatFormatPriceDisplay } from "@/components/expert/onboarding/preferencesData";
import ExpertCard from "@/components/ui/ExpertCard";
import type { Expert } from "@/lib/experts";
import styles from "./ApplicationReviewHero.module.css";

type ApplicationReviewHeroProps = {
  application: ExpertApplicationSubmission;
  review: ApplicationReviewDetail;
};

export default function ApplicationReviewHero({
  application,
  review,
}: ApplicationReviewHeroProps) {
  const selectedFormats = application.formats || [];
  const formatPrices = application.formatPrices || {};

  // Split name for visual display (e.g. SNEHA / LAXMESHWAR)
  const nameParts = (application.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Map application details to a standard Expert structure for the ExpertCard component
  const expert = useMemo<Expert>(
    () => ({
      name: application.name || "Name",
      role: application.professionalTitle || review.title || "Professional Title",
      desc: application.tagLine || "Tag Line",
      image: application.avatar || "/assets/img/manportrait.png",
      category: application.categoryLabel || "Category",
      topics: [],
      languages: application.languages || [],
      price: 0,
      rating: 0,
      replyTime: "—",
      bio: application.bio || "",
    }),
    [application, review]
  );

  return (
    <div className={styles.heroContainer}>
      {/* Top Black Header Bar */}
      <div className={styles.headerBar}>
        APPLICANT SUMMARY ({application.appId})
      </div>

      {/* Main Card Body - Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* COLUMN 1: Expert Card */}
        <div className={styles.leftCol}>
          <ExpertCard
            expert={expert}
            linkToDetail={false}
            disableHover
            showLanguages={false}
            statsText=""
          />
        </div>

        {/* COLUMN 2: Info, Bio, Contact & Rates */}
        <div className={styles.centerCol}>
          <h1 className={styles.displayName}>
            <span>{firstName}</span> <span className={styles.lastNameMuted}>{lastName}</span>
          </h1>

          <p className={styles.roleSub}>{application.professionalTitle || review.title}</p>

          <div className={styles.starDivider}>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <div className={styles.metaIconBadge}>
                <MapPin size={13} />
              </div>
              <span className={styles.metaVal}>{review.city || "Not specified"}</span>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaIconBadge}>
                <Languages size={13} />
              </div>
              <span className={styles.metaVal}>{review.languages || "Not specified"}</span>
            </div>
          </div>

          <p className={styles.bioText}>
            {application.bio || application.tagLine || "No professional bio provided."}
          </p>

          {/* Contact Details & Rates Section */}
          {/* Contact Section */}
          <div className={styles.contactRatesSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionHeaderTitle}>Contact</span>
              <span className={styles.sectionHeaderLine} />
            </div>

            <div className={styles.contactRatesGrid}>
              <div className={styles.contactItemBox}>
                <span className={styles.contactLabel}>EMAIL</span>
                <span className={styles.contactValue}>{application.email}</span>
              </div>
              <div className={styles.contactItemBox}>
                <span className={styles.contactLabel}>PHONE</span>
                <span className={styles.contactValue}>{application.phone}</span>
              </div>
            </div>
          </div>

          {/* Rates Section */}
          <div className={styles.contactRatesSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionHeaderTitle}>Rates</span>
              <span className={styles.sectionHeaderLine} />
            </div>

            <div className={styles.contactRatesGrid}>
              {selectedFormats.length === 0 ? (
                <div className={styles.contactItemBox}>
                  <span className={styles.contactLabel}>CONSULTATION RATES</span>
                  <span className={styles.contactValue}>No formats selected</span>
                </div>
              ) : (
                selectedFormats.map((fmtId: string) => {
                  let title = "Consultation";
                  if (fmtId === "video") title = "VIDEO ANSWER";
                  else if (fmtId === "written") title = "TEXT ANSWER";
                  else if (fmtId === "shoutout") title = "PHONE CALL";
                  else if (fmtId === "group") title = "LIVE CHAT";

                  const price = formatFormatPriceDisplay(formatPrices[fmtId]);
                  return (
                    <div key={fmtId} className={styles.contactItemBox}>
                      <span className={styles.contactLabel}>{title}</span>
                      <span className={styles.contactValue}>{price}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
