"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Globe2,
  Globe,
  MapPin,
  MoreHorizontal,
  Repeat,
  Share2,
  Star,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { REQUEST_DETAIL_DATA } from "@/lib/expertRequestDetailStore";
import styles from "./ExpertRequestDetail.module.css";

export default function ExpertRequestDetail() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "scope" | "attachments" | "history">("overview");
  const [requestStatus, setRequestStatus] = useState<"new" | "pending" | "accepted" | "declined">(
    REQUEST_DETAIL_DATA.status
  );

  const data = REQUEST_DETAIL_DATA;

  const handleAccept = () => {
    setRequestStatus("accepted");
  };

  const handleDecline = () => {
    setRequestStatus("declined");
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        {/* --------------------------------------------------
            1. BREADCRUMB & HEADER
        -------------------------------------------------- */}
        <div className={styles.topNavRow}>
          <div className={styles.titleArea}>
            <div className={styles.breadcrumbRow}>
              <button
                type="button"
                onClick={() => router.push("/expert/requests/")}
                className={styles.backBtn}
                title="Back to requests"
                aria-label="Back to requests"
              >
                <ArrowLeft size={16} />
              </button>
              <span>Requests</span>
              <span>/</span>
              <span className={styles.breadcrumbCurrent}>Request Details</span>
            </div>
            <h1 className={styles.pageTitle}>{data.title}</h1>
          </div>

          <div className={styles.headerActions}>
            <button type="button" className={styles.actionBtn}>
              <MoreHorizontal size={16} /> More
            </button>
            <button type="button" className={styles.actionBtn}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        {/* --------------------------------------------------
            2. STATUS NOTIFICATION BANNER
        -------------------------------------------------- */}
        <div className={styles.statusBanner}>
          <div className={styles.statusLeft}>
            <span className={styles.statusDot} />
            <span>
              {requestStatus === "accepted"
                ? "Request Accepted — Session Scheduled"
                : requestStatus === "declined"
                ? "Request Declined"
                : data.statusText}
            </span>
            <span className={styles.statusSubtext}>· {data.timeReceivedAgo}</span>
          </div>

          {requestStatus === "new" && (
            <div className={styles.timerBadge}>
              <Clock size={13} />
              <span>{data.respondTimeLeft}</span>
            </div>
          )}
        </div>

        {/* --------------------------------------------------
            3. CLIENT PROFILE CARD
        -------------------------------------------------- */}
        <div className={styles.clientCard}>
          <div className={styles.clientTopRow}>
            <div className={styles.clientLeft}>
              <img
                src={data.client.avatar}
                alt={data.client.name}
                className={styles.clientAvatar}
              />
              <div className={styles.clientMeta}>
                <div className={styles.clientNameRow}>
                  <span className={styles.clientName}>{data.client.name}</span>
                  {data.client.isPro && <span className={styles.badgePro}>PRO</span>}
                  {data.client.isOrg && <span className={styles.badgeOrg}>ORGANIZATION</span>}
                </div>
                <span className={styles.clientRole}>
                  {data.client.role} · {data.client.company}
                </span>
                <div className={styles.clientLocRow}>
                  <span>
                    <MapPin size={12} style={{ display: "inline", marginRight: 2 }} />
                    {data.client.location}
                  </span>
                  <span>
                    <Clock size={12} style={{ display: "inline", marginRight: 2 }} />
                    {data.client.timezone}
                  </span>
                  {data.client.isOnline && (
                    <span className={styles.onlineDot}>
                      <span className={styles.onlineCircle} /> Online now
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.clientRight}>
              <div className={styles.ratingRow}>
                <Star size={16} fill="#FFB800" color="#FFB800" />
                <span>
                  {data.client.rating.toFixed(1)} ({data.client.totalSessions} sessions)
                </span>
              </div>
              {data.client.isVerified && (
                <span className={styles.verifiedBadge}>
                  <CheckCircle2 size={12} /> Verified Client
                </span>
              )}
            </div>
          </div>

          {/* Client Historical Stats */}
          <div className={styles.clientStatsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{data.client.stats.sessionsBooked}</span>
              <span className={styles.statLabel}>Sessions booked</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{data.client.stats.totalSpent}</span>
              <span className={styles.statLabel}>Total spent</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{data.client.stats.completionRate}</span>
              <span className={styles.statLabel}>Completion rate</span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------
            4. TAB NAVIGATION BAR
        -------------------------------------------------- */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`${styles.tabBtn} ${
              activeTab === "overview" ? styles.tabBtnActive : ""
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scope")}
            className={`${styles.tabBtn} ${
              activeTab === "scope" ? styles.tabBtnActive : ""
            }`}
          >
            Scope & Deliverables
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attachments")}
            className={`${styles.tabBtn} ${
              activeTab === "attachments" ? styles.tabBtnActive : ""
            }`}
          >
            Attachments <span className={styles.tabBadge}>{data.attachments.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`${styles.tabBtn} ${
              activeTab === "history" ? styles.tabBtnActive : ""
            }`}
          >
            History
          </button>
        </div>

        {/* --------------------------------------------------
            5. TAB CONTENT PANELS
        -------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className={styles.overviewSection}>
            {/* Sub-card 1: Description & Proposal */}
            <div className={styles.cardBlock}>
              <div className={styles.blockHeader}>
                <h2 className={styles.proposalTitle}>{data.subtitle}</h2>
                <span className={styles.proposalDate}>Submitted {data.submittedDate}</span>
              </div>

              {data.proposal.paragraphs.map((p, idx) => (
                <p key={idx} className={styles.proposalText}>
                  {p}
                </p>
              ))}

              <div className={styles.tagsRow}>
                {data.proposal.tags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sub-card 2: Session Details 6-Cell Grid */}
            <div className={styles.cardBlock}>
              <span className={styles.sectionTitleLabel}>SESSION DETAILS</span>
              <div className={styles.sessionGrid}>
                <div className={styles.sessionCell}>
                  <div className={styles.cellIconBox}>
                    <Calendar size={18} />
                  </div>
                  <div className={styles.cellTextGroup}>
                    <span className={styles.cellLabel}>REQUESTED DATE</span>
                    <span className={styles.cellValue}>{data.sessionDetails.requestedDate}</span>
                  </div>
                </div>

                <div className={styles.sessionCell}>
                  <div className={styles.cellIconBox}>
                    <Clock size={18} />
                  </div>
                  <div className={styles.cellTextGroup}>
                    <span className={styles.cellLabel}>DURATION</span>
                    <span className={styles.cellValue}>{data.sessionDetails.duration}</span>
                  </div>
                </div>

                <div className={styles.sessionCell}>
                  <div className={styles.cellIconBox}>
                    <Video size={18} />
                  </div>
                  <div className={styles.cellTextGroup}>
                    <span className={styles.cellLabel}>SESSION FORMAT</span>
                    <span className={styles.cellValue}>{data.sessionDetails.format}</span>
                  </div>
                </div>

                <div className={styles.sessionCell}>
                  <div className={styles.cellIconBox}>
                    <Users size={18} />
                  </div>
                  <div className={styles.cellTextGroup}>
                    <span className={styles.cellLabel}>PARTICIPANTS</span>
                    <span className={styles.cellValue}>{data.sessionDetails.participantsCount}</span>
                  </div>
                </div>

                <div className={styles.sessionCell}>
                  <div className={styles.cellIconBox}>
                    <Globe size={18} />
                  </div>
                  <div className={styles.cellTextGroup}>
                    <span className={styles.cellLabel}>LANGUAGE</span>
                    <span className={styles.cellValue}>{data.sessionDetails.language}</span>
                  </div>
                </div>

                <div className={styles.sessionCell}>
                  <div className={styles.cellIconBox}>
                    <Repeat size={18} />
                  </div>
                  <div className={styles.cellTextGroup}>
                    <span className={styles.cellLabel}>RECURRENCE</span>
                    <span className={styles.cellValue}>{data.sessionDetails.recurrence}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-card 3: Attachments */}
            <div className={styles.cardBlock}>
              <div className={styles.attachmentsHeaderRow}>
                <span className={styles.sectionTitleLabel}>ATTACHMENTS</span>
                <span className={styles.viewAllLink}>View all ({data.attachments.length})</span>
              </div>

              <div className={styles.attachmentsList}>
                {data.attachments.map((att) => (
                  <div key={att.id} className={styles.fileCard}>
                    <div className={styles.fileLeft}>
                      {att.type === "pdf" ? (
                        <div className={styles.fileIconPdf}>PDF</div>
                      ) : (
                        <div className={styles.fileIconExcel}>XLS</div>
                      )}
                      <div className={styles.fileMeta}>
                        <span className={styles.fileName}>{att.name}</span>
                        <span className={styles.fileSubtext}>
                          {att.size} · {att.uploadedTime}
                        </span>
                      </div>
                    </div>

                    <div className={styles.fileActions}>
                      <button type="button" className={styles.previewBtn}>
                        <Eye size={13} /> Preview
                      </button>
                      <button type="button" className={styles.downloadBtn}>
                        <Download size={13} /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "scope" && (
          <div className={styles.cardBlock}>
            <span className={styles.sectionTitleLabel}>EXPECTED DELIVERABLES</span>
            <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              {data.proposal.scopeDeliverables.map((item, index) => (
                <li key={index} style={{ fontSize: 14, color: "var(--ink)" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "attachments" && (
          <div className={styles.cardBlock}>
            <span className={styles.sectionTitleLabel}>ATTACHED FILES ({data.attachments.length})</span>
            <div className={styles.attachmentsList}>
              {data.attachments.map((att) => (
                <div key={att.id} className={styles.fileCard}>
                  <div className={styles.fileLeft}>
                    {att.type === "pdf" ? (
                      <div className={styles.fileIconPdf}>PDF</div>
                    ) : (
                      <div className={styles.fileIconExcel}>XLS</div>
                    )}
                    <div className={styles.fileMeta}>
                      <span className={styles.fileName}>{att.name}</span>
                      <span className={styles.fileSubtext}>
                        {att.size} · {att.uploadedTime}
                      </span>
                    </div>
                  </div>

                  <div className={styles.fileActions}>
                    <button type="button" className={styles.previewBtn}>
                      <Eye size={13} /> Preview
                    </button>
                    <button type="button" className={styles.downloadBtn}>
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className={styles.cardBlock}>
            <span className={styles.sectionTitleLabel}>AUDIT TIMELINE</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {data.history.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "var(--seashell)",
                    border: "1px solid var(--mercury)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span>{evt.title}</span>
                    <span style={{ fontSize: 11, color: "var(--silver-chalice)" }}>
                      {evt.timestamp}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--dove-gray)" }}>
                    {evt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------
            6. BOTTOM DECISION ACTION BAR
        -------------------------------------------------- */}
        <div className={styles.decisionBar}>
          <div className={styles.decisionBarInner}>
            <div className={styles.priceLabelGroup}>
              <span className={styles.proposedPriceText}>
                {data.sessionDetails.proposedPrice}
              </span>
              <span className={styles.escrowText}>
                <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
                Escrow payment authorized
              </span>
            </div>

            <div className={styles.decisionButtons}>
              {requestStatus === "new" ? (
                <>
                  <button
                    type="button"
                    onClick={handleDecline}
                    className={styles.declineBtn}
                  >
                    Decline Request
                  </button>
                  <button type="button" className={styles.rescheduleBtn}>
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={handleAccept}
                    className={styles.acceptBtn}
                  >
                    <Check size={16} /> Accept Request ({data.sessionDetails.proposedPrice})
                  </button>
                </>
              ) : (
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: requestStatus === "accepted" ? "#2e7d32" : "#c62828",
                  }}
                >
                  Status: {requestStatus.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
