"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  GraduationCap,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  IndianRupee,
  Languages,
  Layers,
  Mail,
  MapPin,
  Phone,
  Tag,
  X,
  Zap,
  Clock,
  Rocket,
  Building,
  Store,
  Video,
  Users,
} from "lucide-react";
import { ADMIN_PROFILE } from "@/lib/adminDashboard";
import { mapToApplicationReview } from "@/lib/adminApplicationMappers";
import type { ApplicationStatus } from "@/lib/expertApplicationSubmission";
import ApplicationReviewHero from "./ApplicationReviewHero";
import {
  REVIEW_TABS,
  type ReviewTabId,
} from "@/lib/adminApplicationReview";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useExpertApplication } from "@/hooks/useExpertApplications";
import { WEEK_DAYS } from "@/lib/expertAvailability";
import {
  CONSULTATION_FORMATS,
  getSessionLengthLabel,
} from "@/components/expert/onboarding/preferencesData";
import {
  updateExpertApplicationReviewerNote,
  updateExpertApplicationStatus,
} from "@/lib/expertApplicationsStore";
import styles from "./ApplicationReview.module.css";

const REVIEW_STATUS_CLASS: Record<ApplicationStatus, string> = {
  pending: styles.statusPending,
  in_review: styles.statusInReview,
  on_hold: styles.statusOnHold,
  approved: styles.statusApproved,
  rejected: styles.statusRejected,
};

const REVIEW_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Pending Review",
  in_review: "In Review",
  on_hold: "On Hold",
  approved: "Approved",
  rejected: "Rejected",
};

type ApplicationReviewProps = {
  appId: string;
};

const DOC_ICON_CLASS = {
  red: styles.docIconRed,
  blue: styles.docIconBlue,
  purple: styles.docIconPurple,
  yellow: styles.docIconYellow,
} as const;

import ApproveConfirmModal from "./ApproveConfirmModal";
import HoldConfirmModal from "./HoldConfirmModal";
import RejectConfirmModal from "./RejectConfirmModal";
import DocumentPreviewModal, { type PreviewDocument } from "./DocumentPreviewModal";
import SectionDecisionControl, {
  type SectionDecision,
  type SectionReviewState,
} from "./SectionDecisionControl";
import SectionApproveConfirmModal from "./SectionApproveConfirmModal";

const AUDIENCE_TYPES = [
  {
    id: "startup",
    title: "Startup Founders",
    desc: "Early-stage entrepreneurs, seed to Series A seeking strategic growth advice.",
    icon: Rocket,
  },
  {
    id: "enterprise",
    title: "Enterprise Execs",
    desc: "Corporate leaders needing specific domain expertise or leadership coaching.",
    icon: Building,
  },
  {
    id: "career",
    title: "Career Transitioners",
    desc: "Professionals looking to pivot industries or level up their careers.",
    icon: Briefcase,
  },
  {
    id: "smb",
    title: "Small Business Owners",
    desc: "Local or niche business owners looking for scaling and operations guidance.",
    icon: Store,
  },
];

const FORMAT_ICONS = {
  video: Video,
  written: FileText,
  shoutout: Phone,
  group: Users,
} as const;

const ID_TYPE_LABELS = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  passport: "Passport",
  voter: "Voter ID",
  driving: "Driving Licence",
};

const REVIEW_SECTIONS = [
  { id: "category", label: "Category & Skills" },
  { id: "experience", label: "Experience & Portfolio" },
  { id: "profile", label: "Profile Details" },
  { id: "credentials", label: "Credentials & KYC" },
  { id: "preferences", label: "Preferences & Pricing" },
  { id: "audience", label: "Audience & Languages" },
  { id: "availability", label: "Availability" },
] as const;

export default function ApplicationReview({ appId }: ApplicationReviewProps) {
  const { ready, application } = useExpertApplication(appId);
  const review = useMemo(
    () => (application ? mapToApplicationReview(application) : null),
    [application],
  );
  const [activeTab, setActiveTab] = useState<string>("");
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showHoldConfirm, setShowHoldConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [isTabsStuck, setIsTabsStuck] = useState(false);
  const tabsStickyRef = useRef<HTMLDivElement>(null);
  const [pendingApproveSection, setPendingApproveSection] = useState<{
    id: string;
    state: SectionReviewState;
  } | null>(null);

  const isApproved = review?.status === "approved";

  const handleApproveConfirm = (notes: string) => {
    if (!review) return;
    updateExpertApplicationStatus(review.appId, "approved");
    if (notes.trim()) {
      updateExpertApplicationReviewerNote(review.appId, notes);
    }
    setShowApproveConfirm(false);
  };

  const handleHoldConfirm = (notes: string) => {
    if (!review) return;
    updateExpertApplicationStatus(review.appId, "on_hold");
    updateExpertApplicationReviewerNote(review.appId, notes);
    setShowHoldConfirm(false);
  };

  const handleRejectConfirm = (notes: string) => {
    if (!review) return;
    updateExpertApplicationStatus(review.appId, "rejected");
    updateExpertApplicationReviewerNote(review.appId, notes);
    setShowRejectConfirm(false);
  };

  const getSectionTitle = (id: string): string => {
    const titles: Record<string, string> = {
      category: "Category & Skills",
      experience: "Work Experience & Portfolio",
      profile: "Profile Details",
      credentials: "Credentials & KYC",
      preferences: "Consultation Preferences",
      audience: "Target Audience & Languages",
      availability: "Availability & Schedule",
    };
    return titles[id] ?? id;
  };

  const getSectionDecision = (id: string): SectionDecision => {
    return sectionDecisions[id]?.decision ?? null;
  };

  const getSectionNote = (id: string): string => {
    const sec = sectionDecisions[id];
    if (!sec) return "";
    if (sec.note?.trim()) return sec.note.trim();
    if (sec.notes && sec.notes.length > 0) {
      return sec.notes[sec.notes.length - 1].text.trim();
    }
    return "";
  };

  const getSectionStatusBadge = (decision: SectionDecision) => {
    if (decision === null) {
      return <span className={`${styles.sectionBadge} ${styles.sectionBadgePending}`}>Pending</span>;
    }
    if (decision === "approve") {
      return <span className={`${styles.sectionBadge} ${styles.sectionBadgeApproved}`}>Approved</span>;
    }
    if (decision === "clarification") {
      return <span className={`${styles.sectionBadge} ${styles.sectionBadgeClarification}`}>Clarification</span>;
    }
    return <span className={`${styles.sectionBadge} ${styles.sectionBadgeRejected}`}>Rejected</span>;
  };

  const [sectionDecisions, setSectionDecisions] = useState<
    Record<string, SectionReviewState>
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`jatayu_review_decisions_${appId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return {
      category: { decision: null, note: "" },
      kyc: { decision: null, note: "" },
      certifications: { decision: null, note: "" },
      experience: { decision: null, note: "" },
      portfolio: { decision: null, note: "" },
      availability: { decision: null, note: "" },
      audience: { decision: null, note: "" },
      preferences: { decision: null, note: "" },
      credentials: { decision: null, note: "" },
      profile: { decision: null, note: "" },
    };
  });

  const unapprovedSectionsList = useMemo(() => {
    return ["category", "experience", "profile", "credentials", "preferences", "audience", "availability"]
      .filter((id) => getSectionDecision(id) !== "approve")
      .map((id) => {
        const dec = getSectionDecision(id);
        const statusLabel = dec === null ? "Pending Review" : dec === "clarification" ? "Needs Clarification" : "Rejected";
        return `${getSectionTitle(id)} (${statusLabel})`;
      });
  }, [sectionDecisions]);

  const clarificationSectionsList = useMemo(() => {
    return ["category", "experience", "profile", "credentials", "preferences", "audience", "availability"]
      .filter((id) => {
        const dec = getSectionDecision(id);
        return dec === "clarification" || dec === "reject";
      })
      .map((id) => ({
        sectionTitle: getSectionTitle(id),
        note: getSectionNote(id),
        decision: getSectionDecision(id),
      }));
  }, [sectionDecisions]);

  const rejectedSectionsList = useMemo(() => {
    return ["category", "experience", "profile", "credentials", "preferences", "audience", "availability"]
      .filter((id) => {
        const dec = getSectionDecision(id);
        return dec === "clarification" || dec === "reject";
      })
      .map((id) => ({
        sectionTitle: getSectionTitle(id),
        note: getSectionNote(id),
        decision: getSectionDecision(id),
      }));
  }, [sectionDecisions]);

  const updateSectionDecision = (
    sectionId: string,
    nextState: SectionReviewState,
  ) => {
    if (nextState.decision === "approve") {
      setPendingApproveSection({ id: sectionId, state: nextState });
      return;
    }

    setSectionDecisions((prev) => {
      const updated = {
        ...prev,
        [sectionId]: nextState,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(`jatayu_review_decisions_${appId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };



  useEffect(() => {
    const shell = tabsStickyRef.current;
    if (!shell) return;

    const updateStuckState = () => {
      if (getComputedStyle(shell).position !== "sticky") {
        setIsTabsStuck(false);
        return;
      }

      const stickyTopPx = parseFloat(getComputedStyle(shell).top) || 56;
      setIsTabsStuck(shell.getBoundingClientRect().top <= stickyTopPx + 0.5);
    };

    updateStuckState();
    window.addEventListener("scroll", updateStuckState, { passive: true });
    window.addEventListener("resize", updateStuckState);

    return () => {
      window.removeEventListener("scroll", updateStuckState);
      window.removeEventListener("resize", updateStuckState);
    };
  }, [review]);

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const el = document.getElementById(`review-section-${sectionId}`);
    if (el) {
      const stickyOffset = 130; // height of admin sticky header + chips navigation bar
      const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };



  const openDocumentPreview = (doc: { name: string; url: string | null; size?: string }) => {
    if (!doc.url) return;
    setPreviewDoc({ name: doc.name, url: doc.url, size: doc.size });
  };

  if (!ready) {
    return null;
  }

  if (!review || !application) {
    return (
      <section className={styles.dashboard}>
        <div className={`container ${styles.dashboardInner}`}>
          <div className={styles.notFound}>
            <h1 className={styles.notFoundTitle}>Application not found</h1>
            <p className={styles.notFoundText}>
              No review data exists for {appId}.
            </p>
            <Link href="/admin/applications" className={styles.backLink}>
              Back to Applications
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        {previewDoc ? (
          <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
        ) : null}
        {showApproveConfirm ? (
          <ApproveConfirmModal
            name={review.name}
            appId={review.appId}
            unapprovedSections={unapprovedSectionsList}
            onCancel={() => setShowApproveConfirm(false)}
            onConfirm={handleApproveConfirm}
          />
        ) : null}
        {showHoldConfirm ? (
          <HoldConfirmModal
            name={review.name}
            appId={review.appId}
            clarificationSections={clarificationSectionsList}
            onCancel={() => setShowHoldConfirm(false)}
            onConfirm={handleHoldConfirm}
          />
        ) : null}
        {showRejectConfirm ? (
          <RejectConfirmModal
            name={review.name}
            appId={review.appId}
            rejectedSections={rejectedSectionsList}
            onCancel={() => setShowRejectConfirm(false)}
            onConfirm={handleRejectConfirm}
          />
        ) : null}
        {pendingApproveSection ? (
          <SectionApproveConfirmModal
            sectionTitle={getSectionTitle(pendingApproveSection.id)}
            onCancel={() => setPendingApproveSection(null)}
            onConfirm={() => {
              const pending = pendingApproveSection;
              setSectionDecisions((prev) => {
                const updated = {
                  ...prev,
                  [pending.id]: pending.state,
                };
                if (typeof window !== "undefined") {
                  localStorage.setItem(`jatayu_review_decisions_${appId}`, JSON.stringify(updated));
                }
                return updated;
              });
              setPendingApproveSection(null);
            }}
          />
        ) : null}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
            Admin Console
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/admin/applications" className={styles.breadcrumbLink}>
            Expert Applications
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{review.appId} Review</span>
        </nav>

        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              Application <span className={styles.accentWord}>Review</span>
            </h1>
            <p className={styles.pageSubtitle}>
              {review.appId} · Submitted {review.submittedDate}
            </p>
          </div>
          <div className={styles.metaTagsRow}>
            <span className={`${styles.statusTag} ${REVIEW_STATUS_CLASS[review.status]}`}>
              {REVIEW_STATUS_LABEL[review.status]}
            </span>
          </div>
        </header>

        <ApplicationReviewHero application={application} review={review} />

        <div 
          className={`${styles.stickyChipsContainer} ${isTabsStuck ? styles.stickyChipsContainerStuck : ""}`} 
          ref={tabsStickyRef}
        >
          <div className={`container ${styles.chipsScrollWrapper}`}>
            {REVIEW_SECTIONS.map((sec) => {
              const isActive = activeTab === sec.id;
              const decision = getSectionDecision(sec.id);
              return (
                <button
                  key={sec.id}
                  type="button"
                  className={`${styles.chipButton} ${isActive ? styles.chipActive : ""}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  <span>{sec.label}</span>
                  {decision !== null && (
                    <span className={`${styles.chipDot} ${
                      decision === "approve" ? styles.chipDotApproved :
                      decision === "clarification" ? styles.chipDotClarification :
                      styles.chipDotRejected
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.reviewSections}>
          {/* Category & Skills */}
          <article id="review-section-category" className={`${styles.card} ${styles.reviewSection}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Category & Skills
              </span>
              {getSectionStatusBadge(getSectionDecision("category"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.credentialsGrid}>
                {/* Left Column: Category */}
                <div className={styles.governmentIdBlock}>
                  <div className={styles.audienceSectionTitle}>Primary Category</div>
                  <div className={styles.govIdContent} style={{ marginTop: "12px" }}>
                    <span className={styles.profileReviewTextValue}>{application.categoryLabel || "—"}</span>
                  </div>
                </div>

                {/* Right Column: Skills */}
                <div className={styles.credentialsRightCol}>
                  <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                    Expertise Skills
                  </div>
                  {(!application.skills || application.skills.length === 0) ? (
                    <p className={styles.emptyTabMessage}>No skills selected.</p>
                  ) : (
                    <div className={styles.tagRow}>
                      {application.skills.map((skill) => (
                        <span key={skill} className={styles.categoryTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <SectionDecisionControl
                sectionId="category"
                sectionTitle="Category & Skills"
                state={sectionDecisions.category ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("category", st)}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Work Experience & Portfolio */}
          <article id="review-section-experience" className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "24px" }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Work Experience & Portfolio
              </span>
              {getSectionStatusBadge(getSectionDecision("experience"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.experienceReviewGrid}>
                {/* Left Column: Employment and Education */}
                <div className={styles.experienceLeftCol}>
                  {/* Employment Positions */}
                  <div className={styles.experienceSectionBlock}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      Employment History
                    </div>
                    {!application.employmentPositions || application.employmentPositions.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No employment history submitted.</p>
                    ) : (
                      <div className={styles.employmentList}>
                        {application.employmentPositions.map((pos) => (
                          <div key={pos.id} className={styles.employmentItem}>
                            <div className={styles.employmentHeader}>
                              <strong className={styles.employmentTitle}>{pos.jobTitle}</strong>
                              <span className={styles.employmentDuration}>
                                {pos.startMonth}/{pos.startYear} – {pos.currentlyWorking ? "Present" : `${pos.endMonth}/${pos.endYear}`}
                              </span>
                            </div>
                            <div className={styles.employmentCompany}>{pos.company}</div>
                            {pos.responsibilities && (
                              <p className={styles.employmentResponsibilities}>{pos.responsibilities}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Education Degrees */}
                  <div className={styles.experienceSectionBlock} style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid var(--mercury)" }}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      Education & Degrees
                    </div>
                    {!application.educationDegrees || application.educationDegrees.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No educational credentials submitted.</p>
                    ) : (
                      <div className={styles.educationList}>
                        {application.educationDegrees.map((deg) => (
                          <div key={deg.id} className={styles.educationItem}>
                            <div className={styles.educationHeader}>
                              <strong className={styles.educationDegreeName}>{deg.degree} in {deg.fieldOfStudy}</strong>
                              <span className={styles.educationGradYear}>Class of {deg.graduationYear}</span>
                            </div>
                            <div className={styles.educationInstitution}>
                              {deg.institution}
                              {deg.honours && <span className={styles.educationHonours}> • {deg.honours}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Links and Portfolio Samples */}
                <div className={styles.experienceRightCol}>
                  {/* Social & Web Links */}
                  <div className={styles.experienceSectionBlock}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      Social & Portfolio Links
                    </div>
                    <div className={styles.linksList}>
                      {application.linkedin && (
                        <div className={styles.linkItem}>
                          <span className={styles.govIdLabel}>LinkedIn Profile</span>
                          <a
                            href={application.linkedin.startsWith("http") ? application.linkedin : `https://${application.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.experienceLinkHref}
                          >
                            {application.linkedin} <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                      {application.portfolio && (
                        <div className={styles.linkItem} style={{ marginTop: "12px" }}>
                          <span className={styles.govIdLabel}>Portfolio Website</span>
                          <a
                            href={application.portfolio.startsWith("http") ? application.portfolio : `https://${application.portfolio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.experienceLinkHref}
                          >
                            {application.portfolio} <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                      {!application.linkedin && !application.portfolio && (
                        <p className={styles.emptyTabMessage}>No links submitted.</p>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Samples */}
                  <div className={styles.experienceSectionBlock} style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid var(--mercury)" }}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      Portfolio Samples
                    </div>
                    {!application.portfolioSamples || application.portfolioSamples.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No portfolio samples submitted.</p>
                    ) : (
                      <div className={styles.credentialsList}>
                        {application.portfolioSamples.map((sample) => (
                          <div key={sample.id} className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLeft}>
                              <FileText size={16} className={styles.credentialsIcon} />
                              <div className={styles.credentialsDetails}>
                                <span className={styles.credentialsName}>{sample.fileName}</span>
                                <span className={styles.credentialsMeta}>
                                  {sample.description ? `${sample.description} • ` : ""}
                                  {sample.fileSize ? `Size: ${sample.fileSize}` : ""}
                                </span>
                              </div>
                            </div>
                            {sample.url && (
                              <button
                                type="button"
                                className={styles.credentialsAction}
                                onClick={() =>
                                  setPreviewDoc({
                                    name: sample.fileName,
                                    url: sample.url || "",
                                    size: sample.fileSize,
                                  })
                                }
                              >
                                <Eye size={12} /> View Sample
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <SectionDecisionControl
                sectionId="experience"
                sectionTitle="Work Experience & Portfolio"
                state={sectionDecisions.experience ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("experience", st)}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Profile Details */}
          <article id="review-section-profile" className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "24px" }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Profile Details
              </span>
              {getSectionStatusBadge(getSectionDecision("profile"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.profileReviewLayout}>
                {/* Avatar / Profile Photo */}
                <div className={styles.profileReviewAvatarBlock}>
                  <div className={styles.audienceSectionTitle}>Profile Photo</div>
                  <div className={styles.profileReviewAvatarWrap}>
                    <Image
                      src={application.avatar || "/assets/img/avatar.png"}
                      alt={application.name}
                      width={100}
                      height={100}
                      className={styles.profileReviewAvatarImg}
                    />
                  </div>
                </div>

                {/* Profile Fields */}
                <div className={styles.profileReviewFieldsBlock}>
                  <div className={styles.profileReviewMeta}>
                    <div className={styles.profileReviewField}>
                      <span className={styles.govIdLabel}>Professional Title</span>
                      <span className={styles.profileReviewTextValue}>{application.professionalTitle || "—"}</span>
                    </div>

                    <div className={styles.profileReviewField} style={{ marginTop: "16px" }}>
                      <span className={styles.govIdLabel}>Tagline</span>
                      <span className={styles.profileReviewTextValue}>{application.tagLine || "—"}</span>
                    </div>

                    <div className={styles.profileReviewField} style={{ marginTop: "16px" }}>
                      <span className={styles.govIdLabel}>Bio / Introduction</span>
                      <span className={styles.profileReviewTextValue}>{application.bio || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <SectionDecisionControl
                sectionId="profile"
                sectionTitle="Profile Details"
                state={sectionDecisions.profile ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("profile", st)}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Credentials & KYC */}
          <article id="review-section-credentials" className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "24px" }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Credentials & KYC
              </span>
              {getSectionStatusBadge(getSectionDecision("credentials"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.credentialsGrid}>
                {/* Left Column: KYC Photos (Left, Centre, Right) */}
                <div className={styles.kycPhotosBlock}>
                  <div className={styles.audienceSectionTitle}>KYC Verification Photos</div>
                  <div className={styles.kycPhotosGrid}>
                    <div
                      className={styles.kycPhotoCard}
                      onClick={() =>
                        openDocumentPreview({
                          name: "KYC Photo - Left Angle",
                          url: application.kycPhotos?.left || application.avatar,
                        })
                      }
                    >
                      <div className={styles.kycPhotoWrap}>
                        <Image
                          src={application.kycPhotos?.left || application.avatar || "/images/placeholders/expert.jpg"}
                          alt="Left Profile"
                          fill
                          className={styles.kycPhotoImg}
                        />
                      </div>
                      <span className={styles.kycPhotoLabel}>Left Profile</span>
                    </div>

                    <div
                      className={styles.kycPhotoCard}
                      onClick={() =>
                        openDocumentPreview({
                          name: "KYC Photo - Centre (Front) Angle",
                          url: application.kycPhotos?.centre || application.avatar,
                        })
                      }
                    >
                      <div className={styles.kycPhotoWrap}>
                        <Image
                          src={application.kycPhotos?.centre || application.avatar || "/images/placeholders/expert.jpg"}
                          alt="Centre Profile"
                          fill
                          className={styles.kycPhotoImg}
                        />
                      </div>
                      <span className={styles.kycPhotoLabel}>Centre (Front)</span>
                    </div>

                    <div
                      className={styles.kycPhotoCard}
                      onClick={() =>
                        openDocumentPreview({
                          name: "KYC Photo - Right Angle",
                          url: application.kycPhotos?.right || application.avatar,
                        })
                      }
                    >
                      <div className={styles.kycPhotoWrap}>
                        <Image
                          src={application.kycPhotos?.right || application.avatar || "/images/placeholders/expert.jpg"}
                          alt="Right Profile"
                          fill
                          className={styles.kycPhotoImg}
                        />
                      </div>
                      <span className={styles.kycPhotoLabel}>Right Profile</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Government ID & Certificates */}
                <div className={styles.credentialsRightCol}>
                  {/* Government ID */}
                  <div className={styles.governmentIdBlock}>
                    <div className={styles.audienceSectionTitle}>Government ID</div>
                    {application.governmentId ? (() => {
                      const govId = application.governmentId;
                      return (
                        <div className={styles.govIdContent}>
                          <div className={styles.govIdMeta}>
                            <span className={styles.govIdLabel}>ID Type:</span>
                            <strong className={styles.govIdValue}>
                              {ID_TYPE_LABELS[govId.type as keyof typeof ID_TYPE_LABELS] ||
                                govId.type}
                            </strong>
                          </div>

                          <div className={styles.credentialsList} style={{ marginTop: "12px" }}>
                            {/* Front Side */}
                            <div className={styles.credentialsItem}>
                              <div className={styles.credentialsItemLeft}>
                                <FileText size={16} className={styles.credentialsIcon} />
                                <div className={styles.credentialsDetails}>
                                  <span className={styles.credentialsName}>Front: {govId.front.name}</span>
                                  <span className={styles.credentialsMeta}>Size: {govId.front.size}</span>
                                </div>
                              </div>
                              {govId.front.url && (
                                <button
                                  type="button"
                                  className={styles.credentialsAction}
                                  onClick={() =>
                                    setPreviewDoc({
                                      name: `Front ID - ${govId.front.name}`,
                                      url: govId.front.url || "",
                                      size: govId.front.size,
                                    })
                                  }
                                >
                                  <Eye size={12} /> View Document
                                </button>
                              )}
                            </div>

                            {/* Back Side */}
                            {govId.back && (
                              <div className={styles.credentialsItem}>
                                <div className={styles.credentialsItemLeft}>
                                  <FileText size={16} className={styles.credentialsIcon} />
                                  <div className={styles.credentialsDetails}>
                                    <span className={styles.credentialsName}>Back: {govId.back.name}</span>
                                    <span className={styles.credentialsMeta}>Size: {govId.back.size}</span>
                                  </div>
                                </div>
                                {govId.back.url && (
                                  <button
                                    type="button"
                                    className={styles.credentialsAction}
                                    onClick={() => {
                                      if (govId.back) {
                                        setPreviewDoc({
                                          name: `Back ID - ${govId.back.name}`,
                                          url: govId.back.url || "",
                                          size: govId.back.size,
                                        });
                                      }
                                    }}
                                  >
                                    <Eye size={12} /> View Document
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })() : (
                      <p className={styles.emptyTabMessage}>No Government ID uploaded.</p>
                    )}
                  </div>

                  {/* Professional Certificates */}
                  <div className={styles.certificatesSection} style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--mercury)" }}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      Professional Certificates
                    </div>
                    {!application.certificates || application.certificates.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No certificates submitted.</p>
                    ) : (
                      <div className={styles.credentialsList}>
                        {application.certificates.map((cert) => (
                          <div key={cert.id} className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLeft}>
                              <GraduationCap size={16} className={styles.credentialsIcon} />
                              <div className={styles.credentialsDetails}>
                                <span className={styles.credentialsName}>{cert.name}</span>
                                <span className={styles.credentialsMeta}>
                                  {cert.issuer ? `Issued by: ${cert.issuer}` : ""}
                                  {cert.issuer && cert.size ? " • " : ""}
                                  {cert.size ? `Size: ${cert.size}` : ""}
                                </span>
                              </div>
                            </div>
                            {cert.url && (
                              <button
                                type="button"
                                className={styles.credentialsAction}
                                onClick={() =>
                                  setPreviewDoc({
                                    name: cert.name,
                                    url: cert.url || "",
                                    size: cert.size,
                                  })
                                }
                              >
                                <Eye size={12} /> View Certificate
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <SectionDecisionControl
                sectionId="credentials"
                sectionTitle="Credentials & KYC"
                state={sectionDecisions.credentials ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("credentials", st)}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Consultation Preferences */}
          <article id="review-section-preferences" className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "24px" }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Consultation Preferences
              </span>
              {getSectionStatusBadge(getSectionDecision("preferences"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.preferenceSection}>
                <div className={styles.preferenceSectionTitle}>Consultation Formats & Pricing</div>
                <div className={styles.preferenceList}>
                  {CONSULTATION_FORMATS
                    .filter((fmt) => (application.formats || []).includes(fmt.id))
                    .map((fmt) => {
                      const Icon = FORMAT_ICONS[fmt.id as keyof typeof FORMAT_ICONS];
                      const price = application.formatPrices?.[fmt.id];
                      return (
                        <div key={fmt.id} className={styles.preferenceListItem}>
                          <div className={styles.preferenceIconWrap}>
                            <Icon size={18} />
                          </div>
                          <div className={styles.preferenceItemBody}>
                            <div className={styles.preferenceItemHeader}>
                              <span className={styles.preferenceTitle}>{fmt.title}</span>
                              <span className={styles.preferencePrice}>₹{price}/min</span>
                            </div>
                            <p className={styles.preferenceDesc}>{fmt.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className={styles.lengthsSection} style={{ marginTop: "24px" }}>
                <div className={styles.preferenceSectionTitle} style={{ marginBottom: "12px" }}>
                  Preferred Session Lengths
                </div>
                <div className={styles.tagRow}>
                  {(application.lengths || []).map((lenId) => {
                    const label = getSessionLengthLabel(lenId);
                    return (
                      <span key={lenId} className={styles.categoryTag}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <SectionDecisionControl
                sectionId="preferences"
                sectionTitle="Consultation Preferences"
                state={sectionDecisions.preferences ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("preferences", st)}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Target Audience & Languages */}
          <article id="review-section-audience" className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "24px" }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Target Audience & Languages
              </span>
              {getSectionStatusBadge(getSectionDecision("audience"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.languageSection} style={{ marginBottom: "24px" }}>
                <div className={styles.audienceSectionTitle} style={{ marginBottom: "12px" }}>
                  Languages Consulted In
                </div>
                <div className={styles.tagRow}>
                  {(application.languages || []).map((lang) => (
                    <span key={lang} className={styles.categoryTag}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.audienceSection}>
                <div className={styles.audienceSectionTitle}>Primary Audiences</div>
                <div className={styles.audienceList}>
                  {AUDIENCE_TYPES
                    .filter((aud) => (application.audiences || []).includes(aud.id))
                    .map((aud) => {
                      const Icon = aud.icon;
                      return (
                        <div key={aud.id} className={styles.audienceListItem}>
                          <Icon size={16} className={styles.audienceItemIcon} />
                          <div className={styles.audienceItemContent}>
                            <strong>{aud.title}</strong> &mdash; {aud.desc}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <SectionDecisionControl
                sectionId="audience"
                sectionTitle="Target Audience & Languages"
                state={sectionDecisions.audience ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("audience", st)}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Availability & Schedule */}
          <article id="review-section-availability" className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "24px" }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTitle}>
                Availability & Schedule{" "}
                <span className={styles.cardHeaderTitleMeta}>
                  ({review.availability.slots.length}{" "}
                  {review.availability.slots.length === 1 ? "slot" : "slots"})
                </span>
              </span>
              {getSectionStatusBadge(getSectionDecision("availability"))}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.timezoneDisplay}>
                Timezone - {review.availability.timezoneLabel}
              </div>
              {!application.availabilitySlots || application.availabilitySlots.length === 0 ? (
                <p className={styles.emptyTabMessage}>No availability slots submitted during onboarding.</p>
              ) : (
                <div className={styles.slotsList}>
                  {application.availabilitySlots.map((slot) => (
                    <div key={slot.id} className={styles.slotCard}>
                      <div className={styles.slotTimeInfo}>
                        <div className={styles.clockIconWrap}>
                          <Clock size={18} />
                        </div>
                        <div>
                          <div className={styles.slotTimeLabel}>Available Hours</div>
                          <div className={styles.slotTimeValue}>
                            {slot.from} – {slot.to}
                          </div>
                        </div>
                      </div>
                      <div className={styles.slotDaysCol}>
                        <div className={styles.slotDaysCluster}>
                          {WEEK_DAYS.map((day) => {
                            const isSelected = slot.days.includes(day);
                            return (
                              <span
                                key={day}
                                className={`${styles.dayCircle} ${isSelected ? styles.dayCircleSelected : styles.dayCircleInactive
                                  }`}
                              >
                                {day.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <SectionDecisionControl
                sectionId="availability"
                sectionTitle="Availability & Schedule"
                state={sectionDecisions.availability ?? { decision: null, note: "" }}
                onChange={(st) => updateSectionDecision("availability", st)}
                disabled={isApproved}
              />
            </div>
          </article>
        </div>



        <article className={`${styles.card} ${styles.reviewSection}`} style={{ marginTop: "32px" }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>
              Final Application Decision
            </span>
            <span className={styles.cardHeaderTitleMeta}>
              {unapprovedSectionsList.length > 0 ? (
                `${unapprovedSectionsList.length} section${unapprovedSectionsList.length > 1 ? "s" : ""} remaining to review`
              ) : (
                "All sections reviewed and ready for decision"
              )}
            </span>
          </div>
          <div className={styles.cardBody} style={{ padding: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
            <PrimaryButton
              type="button"
              label="Approve"
              variant="orange"
              disabled={unapprovedSectionsList.length > 0}
              onClick={() => setShowApproveConfirm(true)}
            />
            <button
              type="button"
              className={styles.holdBtn}
              onClick={() => setShowHoldConfirm(true)}
            >
              Place on Hold
            </button>
            <button
              type="button"
              className={styles.rejectBtn}
              onClick={() => setShowRejectConfirm(true)}
            >
              Reject
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
