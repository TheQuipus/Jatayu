"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Layers,
  Tag,
  X,
} from "lucide-react";
import { ADMIN_PROFILE } from "@/lib/adminDashboard";
import { mapToApplicationReview } from "@/lib/adminApplicationMappers";
import type { ApplicationStatus } from "@/lib/expertApplicationSubmission";
import {
  REVIEW_TABS,
  type ReviewTabId,
} from "@/lib/adminApplicationReview";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useExpertApplication } from "@/hooks/useExpertApplications";
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

type PreviewDocument = {
  name: string;
  url: string;
  size?: string;
};

function isPdfDocument(name: string, url: string): boolean {
  return (
    url.startsWith("data:application/pdf") ||
    /\.pdf($|\?)/i.test(url)
  );
}

function isVideoDocument(name: string, url: string): boolean {
  return (
    url.startsWith("data:video") ||
    /\.(mp4|webm|mov)($|\?)/i.test(url) ||
    /kyc.*video/i.test(name)
  );
}

function ApproveConfirmModal({
  name,
  appId,
  onCancel,
  onConfirm,
}: {
  name: string;
  appId: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.confirmOverlay} onClick={onCancel} role="presentation">
      <div
        className={styles.confirmDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-confirm-title"
      >
        <header className={styles.confirmHeader}>
          <div className={`${styles.confirmIconWrap} ${styles.confirmIconApprove}`}>
            <CheckCircle2 size={22} />
          </div>
          <h2 id="approve-confirm-title" className={styles.confirmTitle}>
            Approve this application?
          </h2>
          <p className={styles.confirmText}>
            You are about to proceed with approving <strong>{name}</strong> ({appId}).
            This will open the approval confirmation flow where you can verify credentials
            and activate the expert account.
          </p>
        </header>
        <footer className={styles.confirmFooter}>
          <button type="button" className={styles.confirmCancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.confirmApproveBtn} onClick={onConfirm}>
            Yes, Continue to Approval
          </button>
        </footer>
      </div>
    </div>
  );
}

function DocumentPreviewModal({
  document,
  onClose,
}: {
  document: PreviewDocument;
  onClose: () => void;
}) {
  const pdf = isPdfDocument(document.name, document.url);
  const video = isVideoDocument(document.name, document.url);

  return (
    <div className={styles.previewOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.previewDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
      >
        <header className={styles.previewHeader}>
          <div>
            <h2 id="doc-preview-title" className={styles.previewTitle}>
              {document.name}
            </h2>
            {document.size ? (
              <p className={styles.previewMeta}>{document.size}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.previewCloseBtn}
            onClick={onClose}
            aria-label="Close document preview"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.previewBody}>
          {pdf ? (
            <iframe
              title={document.name}
              src={document.url}
              className={styles.previewFrame}
            />
          ) : video ? (
            <video
              src={document.url}
              controls
              className={styles.previewImage}
            />
          ) : (
            <Image
              src={document.url}
              alt={document.name}
              width={720}
              height={960}
              className={styles.previewImage}
              unoptimized={document.url.startsWith("data:") || document.url.startsWith("blob:")}
            />
          )}
        </div>

        <footer className={styles.previewFooter}>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.previewOpenBtn}
          >
            <ExternalLink size={14} />
            Open in New Tab
          </a>
          <a href={document.url} download={document.name} className={styles.previewDownloadBtn}>
            <Download size={14} />
            Download
          </a>
        </footer>
      </div>
    </div>
  );
}

function IndexGauge({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.indexGauge}>
      <svg viewBox="0 0 100 100" className={styles.indexGaugeSvg} aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--mercury)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--tango)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={styles.indexScore}>
        <span className={styles.indexValue}>{score}</span>
        <span className={styles.indexLabel}>INDEX</span>
      </div>
    </div>
  );
}

export default function ApplicationReview({ appId }: ApplicationReviewProps) {
  const { ready, application } = useExpertApplication(appId);
  const review = useMemo(
    () => (application ? mapToApplicationReview(application) : null),
    [application],
  );
  const [activeTab, setActiveTab] = useState<ReviewTabId>("documents");
  const [noteDraft, setNoteDraft] = useState("");
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isTabsStuck, setIsTabsStuck] = useState(false);
  const tabsStickyRef = useRef<HTMLDivElement>(null);

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

  const scrollToSection = (tabId: ReviewTabId) => {
    setActiveTab(tabId);
    document.getElementById(`review-section-${tabId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openDocumentPreview = (doc: { name: string; url: string | null; size?: string }) => {
    if (!doc.url) return;
    setPreviewDoc({ name: doc.name, url: doc.url, size: doc.size });
  };

  if (!ready) {
    return null;
  }

  if (!review) {
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
          onCancel={() => setShowApproveConfirm(false)}
          onConfirm={() => setShowApproveConfirm(false)}
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
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>
              Application <span className={styles.accentWord}>Review</span>
            </h1>
            <span className={`${styles.statusTag} ${REVIEW_STATUS_CLASS[review.status]}`}>
              {REVIEW_STATUS_LABEL[review.status]}
            </span>
            <span className={styles.slaTag}>
              {review.slaLabel} — {review.slaLimit}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            {review.name} · {review.category} · {review.appId} · Submitted{" "}
            {review.submittedDate}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            href={`/admin/expert-profile/${review.appId}`}
            className={styles.outlineBtn}
          >
            Expert Profile
          </Link>
          <Link
            href={`/admin/rejection-hold/${review.appId}`}
            className={styles.outlineBtn}
          >
            Reject / Hold
          </Link>
          <PrimaryButton
            type="button"
            label="Approve"
            variant="orange"
            onClick={() => setShowApproveConfirm(true)}
          />
        </div>
      </header>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>
            Applicant Summary{" "}
            <span className={styles.cardHeaderTitleMeta}>({review.appId})</span>
          </span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.summaryTop}>
            <div className={styles.summaryProfile}>
              <Image
                src={review.avatar}
                alt={review.name}
                width={88}
                height={88}
                className={styles.summaryAvatar}
              />
              <div>
                <h2 className={styles.summaryName}>{review.name}</h2>
                <p className={styles.summaryTitle}>{review.title}</p>
                <div className={styles.summaryTags}>
                  {review.idVerified && (
                    <span className={styles.verifyTag}>
                      <CheckCircle2 size={12} />
                      ID Verified
                    </span>
                  )}
                  {review.linkedIn && (
                    <span className={styles.linkedInTag}>LinkedIn</span>
                  )}
                </div>
              </div>
            </div>
            <IndexGauge score={review.indexScore} />
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{review.email || "—"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>
              <span className={styles.detailValue}>{review.phone || "—"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>City</span>
              <span className={styles.detailValue}>{review.city}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Languages</span>
              <span className={styles.detailValue}>{review.languages}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Asked Rate</span>
              <span className={styles.detailValue}>{review.askedRate}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Completeness</span>
              <span className={styles.detailValue}>{review.completeness}%</span>
            </div>
          </div>

          <div className={styles.bioSection}>
            <div className={styles.bioLabel}>Professional Bio</div>
            <p className={styles.bioText}>{review.bio}</p>
          </div>

          <div className={styles.statsRow}>
            {review.stats.map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      <div
        ref={tabsStickyRef}
        className={`${styles.tabsSticky} ${isTabsStuck ? styles.tabsStickyStuck : ""}`}
      >
        <div className={styles.tabsBackdrop} aria-hidden="true" />
        <nav className={styles.tabs} aria-label="Review sections">
          {REVIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "true" : undefined}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
              onClick={() => scrollToSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.reviewSections}>
      <article id="review-section-documents" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>
              Submitted Documents{" "}
              <span className={styles.cardHeaderTitleMeta}>
                ({review.documents.length} document{review.documents.length === 1 ? "" : "s"})
              </span>
            </span>
          </div>
          <div className={styles.cardBody}>
            {review.documents.length === 0 ? (
              <p className={styles.emptyTabMessage}>
                No documents uploaded during onboarding.
              </p>
            ) : (
              <div className={styles.docGrid}>
                {review.documents.map((doc) => (
                  <div key={doc.id} className={styles.docCard}>
                    <div className={`${styles.docIcon} ${DOC_ICON_CLASS[doc.iconVariant]}`}>
                      <FileText size={18} />
                    </div>
                    <div className={styles.docName}>{doc.name}</div>
                    {doc.size ? <div className={styles.docSize}>{doc.size}</div> : null}
                    {doc.verified ? <span className={styles.docVerified}>Verified</span> : null}
                    <div className={styles.docActions}>
                      <button
                        type="button"
                        className={styles.viewDocBtn}
                        disabled={!doc.url}
                        onClick={() => openDocumentPreview(doc)}
                      >
                        <Eye size={12} aria-hidden="true" />
                        View Doc
                      </button>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          download={doc.name}
                          className={styles.downloadBtn}
                        >
                          <Download size={12} aria-hidden="true" />
                          Download
                        </a>
                      ) : (
                        <button type="button" className={styles.downloadBtn} disabled>
                          <Download size={12} aria-hidden="true" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

      <article id="review-section-certifications" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>
              Certifications{" "}
              <span className={styles.cardHeaderTitleMeta}>
                ({review.certifications.length} Certifications)
              </span>
            </span>
          </div>
          <div className={styles.cardBody}>
            {review.certifications.length === 0 ? (
              <p className={styles.emptyTabMessage}>
                No professional certifications submitted during onboarding.
              </p>
            ) : (
              <div className={styles.certList}>
                {review.certifications.map((cert) => (
                  <div key={cert.id} className={styles.certItem}>
                    <div className={styles.certInfo}>
                      <div className={styles.certName}>{cert.name}</div>
                      <div className={styles.certIssuer}>{cert.issuer}</div>
                    </div>
                    <div className={styles.certActions}>
                      {cert.verified && <span className={styles.docVerified}>Verified</span>}
                      <button
                        type="button"
                        className={styles.viewCertBtn}
                        aria-label={`View ${cert.name}`}
                        disabled={!cert.url}
                        onClick={() => openDocumentPreview(cert)}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

      <article id="review-section-portfolio" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>
              Portfolio & Links{" "}
              <span className={styles.cardHeaderTitleMeta}>
                ({review.portfolio.length} item{review.portfolio.length === 1 ? "" : "s"})
              </span>
            </span>
          </div>
          <div className={styles.cardBody}>
            {review.portfolio.length === 0 ? (
              <p className={styles.emptyTabMessage}>
                No portfolio links or documents submitted during onboarding.
              </p>
            ) : (
              <div className={styles.portfolioList}>
                {review.portfolio.map((item) => (
                  <div key={item.id} className={styles.portfolioItem}>
                    <div className={styles.portfolioIcon}>
                      {item.type === "link" ? <ExternalLink size={18} /> : <FileText size={18} />}
                    </div>
                    <div className={styles.portfolioBody}>
                      <div className={styles.portfolioTitle}>{item.title}</div>
                      <div className={styles.portfolioSubtitle}>{item.subtitle}</div>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.portfolioLink}
                        >
                          {item.url}
                        </a>
                      ) : null}
                    </div>
                    {item.verified && <span className={styles.docVerified}>Verified</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

      <article id="review-section-experience" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>
              Professional Experience{" "}
              <span className={styles.cardHeaderTitleMeta}>
                ({review.experienceItems.length} role{review.experienceItems.length === 1 ? "" : "s"})
              </span>
            </span>
          </div>
          <div className={styles.cardBody}>
            {review.experienceItems.length === 0 ? (
              <p className={styles.emptyTabMessage}>No employment history submitted during onboarding.</p>
            ) : (
              <div className={styles.experienceList}>
                {review.experienceItems.map((item) => (
                  <div key={item.id} className={styles.experienceItem}>
                    <div className={styles.experienceIcon}>
                      <Briefcase size={18} />
                    </div>
                    <div className={styles.experienceBody}>
                      <div className={styles.experienceTitleRow}>
                        <div className={styles.experienceTitle}>{item.title}</div>
                        <span className={styles.experienceLevel}>{item.level}</span>
                      </div>
                      <div className={styles.experienceCompany}>{item.company}</div>
                      <div className={styles.experienceDates}>{item.dates}</div>
                      <p className={styles.experienceDesc}>{item.description}</p>
                      <div className={styles.experienceSkills}>
                        {item.skills.map((skill) => (
                          <span key={skill} className={styles.experienceSkill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.educationSection}>
              <div className={styles.educationSectionLabel}>
                Education{" "}
                <span className={styles.sectionMeta}>
                  ({review.educationItems.length}{" "}
                  {review.educationItems.length === 1 ? "entry" : "entries"})
                </span>
              </div>
              {review.educationItems.length === 0 ? (
                <p className={styles.emptyInline}>No education history submitted during onboarding.</p>
              ) : (
                <div className={styles.experienceList}>
                  {review.educationItems.map((item) => (
                    <div key={item.id} className={styles.experienceItem}>
                      <div className={styles.experienceIcon}>
                        <GraduationCap size={18} />
                      </div>
                      <div className={styles.experienceBody}>
                        <div className={styles.experienceTitleRow}>
                          <div className={styles.experienceTitle}>{item.degree}</div>
                          <span className={styles.experienceLevel}>{item.year}</span>
                        </div>
                        <div className={styles.experienceCompany}>{item.institution}</div>
                        {item.field !== "—" ? (
                          <div className={styles.experienceDates}>{item.field}</div>
                        ) : null}
                        {item.honours ? (
                          <p className={styles.experienceDesc}>{item.honours}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

      <article id="review-section-availability" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>
              Availability{" "}
              <span className={styles.cardHeaderTitleMeta}>
                ({review.availability.slots.length}{" "}
                {review.availability.slots.length === 1 ? "slot" : "slots"})
              </span>
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.videoMeta}>
              <div className={styles.videoMetaBlock}>
                <div className={styles.videoMetaLabel}>Timezone</div>
                <p className={styles.videoMetaText}>{review.availability.timezoneLabel}</p>
              </div>
              <div className={styles.videoMetaBlock}>
                <div className={styles.videoMetaLabel}>Custom Requests</div>
                <p className={styles.videoMetaText}>
                  {review.availability.acceptCustomRequests ? "Accepted" : "Not accepted"}
                </p>
              </div>
            </div>
            {review.availability.slots.length === 0 ? (
              <p className={styles.emptyTabMessage}>No availability slots submitted during onboarding.</p>
            ) : (
              <div className={styles.availabilityList}>
                {review.availability.slots.map((slot) => (
                  <div key={slot.id} className={styles.availabilityItem}>
                    <div className={styles.availabilityDays}>{slot.days}</div>
                    <div className={styles.availabilityHours}>{slot.hours}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

      <article id="review-section-kyc" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>KYC</span>
            <span
              className={`${styles.kycStatusBadge} ${
                review.kyc.overallStatus === "complete"
                  ? styles.kycStatusComplete
                  : review.kyc.overallStatus === "partial"
                    ? styles.kycStatusPartial
                    : styles.kycStatusPending
              }`}
            >
              {review.kyc.overallStatus === "complete"
                ? "Complete"
                : review.kyc.overallStatus === "partial"
                  ? "Partial"
                  : "Pending"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.kycPanel}>
              <div className={styles.kycPanelHeader}>
                <div>
                  <div className={styles.kycPanelTitle}>Identity Verification</div>
                  <div className={styles.kycPanelMeta}>
                    {review.kyc.provider}
                    {review.kyc.verifiedAt ? ` · Verified ${review.kyc.verifiedAt}` : ""}
                  </div>
                </div>
                <span className={styles.kycMatchScore}>{review.kyc.matchScore}% complete</span>
              </div>
              <div className={styles.kycDetailsList}>
                {review.kyc.checks.map((check) => (
                  <div key={check.id} className={styles.kycDetailRow}>
                    <span
                      className={`${styles.kycDetailDot} ${
                        check.status === "verified"
                          ? styles.kycDotVerified
                          : check.status === "pending"
                            ? styles.kycDotPending
                            : styles.kycDotMissing
                      }`}
                      aria-hidden="true"
                    />
                    <div className={styles.kycDetailBody}>
                      <span className={styles.kycDetailLabel}>{check.label}</span>
                      <span className={styles.kycDetailValue}>{check.value}</span>
                    </div>
                    <span className={styles.kycDetailStatus}>{check.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.kycVideoSection}>
              <div className={styles.videoMetaLabel}>Verification Video</div>
              {review.kyc.videoUrl ? (
                <video
                  src={review.kyc.videoUrl}
                  controls
                  className={styles.kycVideoPlayer}
                />
              ) : (
                <p className={styles.emptyTabMessage}>
                  No KYC verification video uploaded during onboarding.
                </p>
              )}
            </div>

            {review.kyc.idDocumentUrl && review.kyc.idDocumentName ? (
              <div className={styles.kycIdDocument}>
                <div>
                  <div className={styles.videoMetaLabel}>Government ID Document</div>
                  <p className={styles.videoMetaText}>{review.kyc.idDocumentName}</p>
                </div>
                <button
                  type="button"
                  className={styles.viewDocBtn}
                  onClick={() =>
                    openDocumentPreview({
                      name: review.kyc.idDocumentName ?? "Government ID",
                      url: review.kyc.idDocumentUrl,
                    })
                  }
                >
                  <Eye size={12} aria-hidden="true" />
                  View Doc
                </button>
              </div>
            ) : null}
          </div>
        </article>

      <article id="review-section-category" className={`${styles.card} ${styles.reviewSection}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Category Fit Analysis</span>
            <span
              className={`${styles.kycStatusBadge} ${
                review.categoryFit.recommendation === "strong"
                  ? styles.kycStatusComplete
                  : review.categoryFit.recommendation === "moderate"
                    ? styles.kycStatusPartial
                    : styles.kycStatusPending
              }`}
            >
              {review.categoryFit.recommendation === "strong"
                ? "Strong Match"
                : review.categoryFit.recommendation === "moderate"
                  ? "Moderate Match"
                  : "Needs Review"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.categorySummary}>
              <div className={styles.categoryScoreBlock}>
                <span className={styles.categoryScoreLabel}>Match Score</span>
                <span className={styles.categoryScoreValue}>{review.categoryFit.matchScore}%</span>
              </div>
              <div className={styles.categoryPrimary}>
                <Layers size={16} aria-hidden="true" />
                <div>
                  <div className={styles.categoryPrimaryLabel}>Primary Category</div>
                  <div className={styles.categoryPrimaryValue}>{review.categoryFit.primaryCategory}</div>
                </div>
              </div>
            </div>

            <div className={styles.categoryGrid}>
              <div className={styles.categorySection}>
                <div className={styles.categorySectionLabel}>
                  Skills ({review.categoryFit.skillCount})
                </div>
                <div className={styles.tagRow}>
                  {review.categoryFit.skills.map((skill) => (
                    <span key={skill} className={styles.categoryTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.categorySection}>
                <div className={styles.categorySectionLabel}>Target Audiences</div>
                <div className={styles.tagRow}>
                  {review.categoryFit.audiences.length > 0 ? (
                    review.categoryFit.audiences.map((audience) => (
                      <span key={audience} className={styles.categoryTag}>
                        {audience}
                      </span>
                    ))
                  ) : (
                    <span className={styles.emptyInline}>None selected</span>
                  )}
                </div>
              </div>
              <div className={styles.categorySection}>
                <div className={styles.categorySectionLabel}>Languages</div>
                <div className={styles.tagRow}>
                  {review.categoryFit.languages.map((language) => (
                    <span key={language} className={styles.categoryTag}>
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.categoryFlags}>
              {review.categoryFit.flags.map((flag) => (
                <div key={flag.id} className={styles.categoryFlagItem}>
                  <span
                    className={`${styles.categoryFlagIcon} ${
                      flag.clear ? styles.categoryFlagClear : styles.categoryFlagWarn
                    }`}
                  >
                    {flag.clear ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  </span>
                  <span>{flag.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>
            Reviewer Notes{" "}
            <span className={styles.cardHeaderTitleMeta}>(Visible to admin team only)</span>
          </span>
        </div>
        <div className={styles.cardBody}>
          {review.notes.map((note) => (
            <div key={note.id} className={styles.noteItem}>
              <Image
                src={note.avatar}
                alt=""
                width={32}
                height={32}
                className={styles.noteAvatar}
              />
              <div className={styles.noteBody}>
                <span className={styles.noteAuthor}>
                  {note.author}
                  <span className={styles.noteTime}>{note.timestamp}</span>
                </span>
                <p className={styles.noteText}>{note.text}</p>
              </div>
            </div>
          ))}

          <div className={styles.noteInputRow}>
            <Image
              src={ADMIN_PROFILE.avatar}
              alt=""
              width={32}
              height={32}
              className={styles.noteInputAvatar}
            />
            <textarea
              className={styles.noteTextarea}
              placeholder="Add a reviewer note for the team..."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
          </div>

          <div className={styles.noteFooter}>
            <div className={styles.noteFooterLeft}>
              <button type="button" className={styles.flagBtn}>
                <Flag size={12} aria-hidden="true" />
                Flag Issue
              </button>
              <button type="button" className={styles.flagBtn}>
                <Tag size={12} aria-hidden="true" />
                Add Tag
              </button>
            </div>
            <button type="button" className={styles.postNoteBtn}>
              Post Note
            </button>
          </div>
        </div>
      </article>
      </div>
    </section>
  );
}
