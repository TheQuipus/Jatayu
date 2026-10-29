"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom"; 
import { AnimatePresence, motion } from "motion/react";
import {
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
  XCircle,
  Info,
  AlertTriangle,
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
import DocumentThumbnail from "@/components/ui/DocumentThumbnail";
import { useExpertApplication } from "@/hooks/useExpertApplications";
import { WEEK_DAYS } from "@/lib/expertAvailability";
import {
  CONSULTATION_FORMATS,
  formatFormatPriceDisplay,
  getSessionLengthLabel,
} from "@/components/expert/onboarding/preferencesData";
import {
  updateExpertApplicationStatus,
} from "@/lib/expertApplicationsApi";
import {
  getAdminDigilockerDocumentBlobUrl,
  getAdminDigilockerDocuments,
  type AdminDigilockerDocument,
} from "@/lib/api";
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
  const router = useRouter();
  const { ready, application, refresh } = useExpertApplication(appId);
  const review = useMemo(
    () => (application ? mapToApplicationReview(application) : null),
    [application],
  );
  const [activeTab, setActiveTab] = useState<string>(REVIEW_SECTIONS[0].id);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showHoldConfirm, setShowHoldConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [isTabsStuck, setIsTabsStuck] = useState(false);
  const tabsStickyRef = useRef<HTMLDivElement>(null);
  const isClickScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const activeTabRef = useRef<string>(REVIEW_SECTIONS[0].id);
  const scrollDirectionRef = useRef<"up" | "down">("down");
  const lastScrollYRef = useRef<number>(0);

  const updateActiveTab = (id: string) => {
    if (activeTabRef.current !== id) {
      activeTabRef.current = id;
      setActiveTab(id);
      if (typeof window !== "undefined" && appId) {
        try {
          localStorage.setItem(`jatayu_review_active_tab_${appId}`, id);
        } catch {
          // ignore
        }
      }
    }
  };
  const [pendingApproveSection, setPendingApproveSection] = useState<{
    id: string;
    state: SectionReviewState;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [unfilledSectionIds, setUnfilledSectionIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error" | "info";
  } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);
  const [digilockerDocuments, setDigilockerDocuments] = useState<AdminDigilockerDocument[]>([]);
  const [digilockerDocumentsLoading, setDigilockerDocumentsLoading] = useState(true);
  const [digilockerDocumentError, setDigilockerDocumentError] = useState<string | null>(null);

  const isApproved = review?.status === "approved";

  useEffect(() => {
    let active = true;
    getAdminDigilockerDocuments(appId)
      .then((documents) => {
        if (active) setDigilockerDocuments(documents);
      })
      .catch((error) => {
        if (active) setDigilockerDocumentError(error instanceof Error ? error.message : "Could not load DigiLocker documents.");
      })
      .finally(() => {
        if (active) setDigilockerDocumentsLoading(false);
      });
    return () => { active = false; };
  }, [appId]);

  const openDigilockerDocument = async (document: AdminDigilockerDocument) => {
    setDigilockerDocumentError(null);
    try {
      const url = await getAdminDigilockerDocumentBlobUrl(appId, document.id);
      setPreviewDoc({
        name: document.documentName || document.documentType || "DigiLocker document",
        url,
        size: document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : undefined,
        mimeType: document.mimeType || undefined,
      });
    } catch (error) {
      setDigilockerDocumentError(error instanceof Error ? error.message : "Could not open DigiLocker document.");
    }
  };

  const handleApproveConfirm = async (notes: string) => {
    if (!review || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setActionError(null);

    try {
      await updateExpertApplicationStatus(review.appId, "approved", notes.trim() || undefined);
      
      const allApproved: Record<string, SectionReviewState> = {};
      for (const sec of REVIEW_SECTIONS) {
        allApproved[sec.id] = {
          decision: "approve",
          note: submittedDecisions[sec.id]?.note || "",
          notes: submittedDecisions[sec.id]?.notes || [],
        };
      }
      setSubmittedDecisions((prev) => ({ ...prev, ...allApproved }));
      setSectionDecisions((prev) => ({ ...prev, ...allApproved }));
      if (typeof window !== "undefined" && appId) {
        try {
          localStorage.setItem(`jatayu_review_submitted_${appId}`, JSON.stringify(allApproved));
          localStorage.setItem(`jatayu_review_decisions_${appId}`, JSON.stringify(allApproved));
        } catch {
          // ignore
        }
      }

      refresh();
      setShowApproveConfirm(false);
      router.push("/admin/users/experts");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not approve application.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleHoldConfirm = async (notes: string) => {
    if (!review || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setActionError(null);

    try {
      await updateExpertApplicationStatus(review.appId, "on_hold", notes);
      refresh();
      setShowHoldConfirm(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not place application on hold.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectConfirm = async (notes: string) => {
    if (!review || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setActionError(null);

    try {
      await updateExpertApplicationStatus(review.appId, "rejected", notes);
      refresh();
      setShowRejectConfirm(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not reject application.");
    } finally {
      setIsUpdatingStatus(false);
    }
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

  const INITIAL_SECTION_DECISIONS: Record<string, SectionReviewState> = {
    category: { decision: null, note: "" },
    experience: { decision: null, note: "" },
    profile: { decision: null, note: "" },
    credentials: { decision: null, note: "" },
    preferences: { decision: null, note: "" },
    audience: { decision: null, note: "" },
    availability: { decision: null, note: "" },
    kyc: { decision: null, note: "" },
    certifications: { decision: null, note: "" },
    portfolio: { decision: null, note: "" },
  };

  const [sectionDecisions, setSectionDecisions] = useState<
    Record<string, SectionReviewState>
  >(INITIAL_SECTION_DECISIONS);

  const [submittedDecisions, setSubmittedDecisions] = useState<
    Record<string, SectionReviewState>
  >(INITIAL_SECTION_DECISIONS);

  // Restore persisted review progress from localStorage on mount or when appId changes
  useEffect(() => {
    if (typeof window === "undefined" || !appId) return;

    try {
      // 1. Restore submitted decisions (badges, notes history, decision status)
      const savedSubmitted = localStorage.getItem(`jatayu_review_submitted_${appId}`);
      let parsedSubmitted: Record<string, SectionReviewState> | null = null;
      if (savedSubmitted) {
        parsedSubmitted = JSON.parse(savedSubmitted);
        if (parsedSubmitted && typeof parsedSubmitted === "object") {
          setSubmittedDecisions((prev) => ({ ...prev, ...parsedSubmitted }));
        }
      }

      // 2. Restore draft decisions (unsubmitted radio choices and typed notes)
      const savedDrafts = localStorage.getItem(`jatayu_review_decisions_${appId}`);
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts);
        if (parsedDrafts && typeof parsedDrafts === "object") {
          setSectionDecisions((prev) => ({ ...prev, ...parsedDrafts }));
        }
      } else if (parsedSubmitted) {
        // Fallback: sync drafts from submitted decisions if drafts weren't saved separately
        setSectionDecisions((prev) => ({ ...prev, ...parsedSubmitted }));
      }

      // 3. Restore last active navigation tab
      const savedTab = localStorage.getItem(`jatayu_review_active_tab_${appId}`);
      if (savedTab && REVIEW_SECTIONS.some((sec) => sec.id === savedTab)) {
        updateActiveTab(savedTab);
      }
    } catch (e) {
      console.warn("Could not load review progress from localStorage:", e);
    }
  }, [appId]);

  // Sync approval state if application is approved in backend
  useEffect(() => {
    if (review?.status === "approved") {
      setSubmittedDecisions((prev) => {
        const updated = { ...prev };
        for (const sec of REVIEW_SECTIONS) {
          if (!updated[sec.id]?.decision) {
            updated[sec.id] = { decision: "approve", note: "" };
          }
        }
        return updated;
      });
      setSectionDecisions((prev) => {
        const updated = { ...prev };
        for (const sec of REVIEW_SECTIONS) {
          if (!updated[sec.id]?.decision) {
            updated[sec.id] = { decision: "approve", note: "" };
          }
        }
        return updated;
      });
    }
  }, [review?.status]);

  const getSectionDecision = (id: string): SectionDecision => {
    return submittedDecisions[id]?.decision ?? null;
  };

  const getSectionNote = (id: string): string => {
    const sec = submittedDecisions[id];
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

  const unapprovedSectionsList = useMemo(() => {
    return ["category", "experience", "profile", "credentials", "preferences", "audience", "availability"]
      .filter((id) => getSectionDecision(id) !== "approve")
      .map((id) => {
        const dec = getSectionDecision(id);
        const statusLabel = dec === null ? "Pending Review" : dec === "clarification" ? "Needs Clarification" : "Rejected";
        return `${getSectionTitle(id)} (${statusLabel})`;
      });
  }, [submittedDecisions]);

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
  }, [submittedDecisions]);

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
  }, [submittedDecisions]);

  const isSectionFilled = (sectionId: string): boolean => {
    // 1. Check if decision is already submitted
    const submitted = submittedDecisions[sectionId];
    if (submitted?.decision) return true;

    // 2. Check draft decisions
    const draft = sectionDecisions[sectionId];
    if (!draft || !draft.decision) return false;

    if (draft.decision === "approve") return true;

    // For clarification or reject, reason/note is required
    if (draft.decision === "clarification" || draft.decision === "reject") {
      const hasNote = Boolean(draft.note && draft.note.trim().length > 0);
      const hasSavedNotes = Boolean(draft.notes && draft.notes.length > 0);
      return hasNote || hasSavedNotes;
    }

    return false;
  };

  const isSectionUnfilledHighlighted = (secId: string): boolean => {
    return unfilledSectionIds.has(secId) && !isSectionFilled(secId);
  };

  const isUpdatingReviewStatusRef = useRef(false);

  const markInReviewIfNeeded = useCallback(
    async (
      customDrafts?: Record<string, SectionReviewState>,
      customSubmitted?: Record<string, SectionReviewState>,
    ) => {
      if (isUpdatingReviewStatusRef.current || !review?.appId) return;

      // Only transition between pending and in_review
      if (review.status !== "pending" && review.status !== "in_review") return;

      const draftsToCheck = customDrafts || sectionDecisions;
      const submittedToCheck = customSubmitted || submittedDecisions;

      const hasProgress = REVIEW_SECTIONS.some((sec) => {
        const draft = draftsToCheck[sec.id];
        const sub = submittedToCheck[sec.id];
        const hasDraftDecision = Boolean(draft?.decision);
        const hasDraftNote = Boolean(draft?.note && draft.note.trim().length > 0);
        const hasDraftNotes = Boolean(draft?.notes && draft.notes.length > 0);
        const hasSubDecision = Boolean(sub?.decision);
        const hasSubNote = Boolean(sub?.note && sub.note.trim().length > 0);
        const hasSubNotes = Boolean(sub?.notes && sub.notes.length > 0);
        return (
          hasDraftDecision ||
          hasDraftNote ||
          hasDraftNotes ||
          hasSubDecision ||
          hasSubNote ||
          hasSubNotes
        );
      });

      if (hasProgress && review.status === "pending") {
        isUpdatingReviewStatusRef.current = true;
        try {
          await updateExpertApplicationStatus(review.appId, "in_review");
          refresh();
        } catch (err) {
          console.warn("Could not transition application to in_review:", err);
        } finally {
          isUpdatingReviewStatusRef.current = false;
        }
      } else if (!hasProgress && review.status === "in_review") {
        isUpdatingReviewStatusRef.current = true;
        try {
          await updateExpertApplicationStatus(review.appId, "pending");
          refresh();
        } catch (err) {
          console.warn("Could not revert application to pending:", err);
        } finally {
          isUpdatingReviewStatusRef.current = false;
        }
      }
    },
    [review, sectionDecisions, submittedDecisions, refresh],
  );

  // Sync application status if partially filled on load
  useEffect(() => {
    if (!review || (review.status !== "pending" && review.status !== "in_review")) return;
    void markInReviewIfNeeded();
  }, [review?.status, markInReviewIfNeeded]);

  const updateSectionDecision = (
    sectionId: string,
    nextState: SectionReviewState,
  ) => {
    const updated = {
      ...sectionDecisions,
      [sectionId]: nextState,
    };
    setSectionDecisions(updated);
    if (typeof window !== "undefined" && appId) {
      try {
        localStorage.setItem(`jatayu_review_decisions_${appId}`, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
    }

    void markInReviewIfNeeded(updated);

    // If this section is now filled, clear it from unfilledSectionIds
    const isNowFilled =
      nextState.decision === "approve" ||
      ((nextState.decision === "clarification" || nextState.decision === "reject") &&
        Boolean(
          (nextState.note && nextState.note.trim().length > 0) ||
          (nextState.notes && nextState.notes.length > 0)
        ));

    if (isNowFilled) {
      setUnfilledSectionIds((prev) => {
        if (!prev.has(sectionId)) return prev;
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const submitSectionDecision = (
    sectionId: string,
    decision: SectionDecision,
    updatedState?: SectionReviewState,
  ) => {
    const nextState = updatedState || sectionDecisions[sectionId];
    const updatedSubmitted = {
      ...submittedDecisions,
      [sectionId]: nextState,
    };
    const updatedDrafts = {
      ...sectionDecisions,
      [sectionId]: nextState,
    };

    // Persist to submittedDecisions
    setSubmittedDecisions(updatedSubmitted);
    if (typeof window !== "undefined" && appId) {
      try {
        localStorage.setItem(`jatayu_review_submitted_${appId}`, JSON.stringify(updatedSubmitted));
      } catch {
        // ignore storage error
      }
    }

    // Also update sectionDecisions so draft state matches submitted decision
    setSectionDecisions(updatedDrafts);
    if (typeof window !== "undefined" && appId) {
      try {
        localStorage.setItem(`jatayu_review_decisions_${appId}`, JSON.stringify(updatedDrafts));
      } catch {
        // ignore storage error
      }
    }

    void markInReviewIfNeeded(updatedDrafts, updatedSubmitted);

    // Clear from unfilledSectionIds
    setUnfilledSectionIds((prev) => {
      if (!prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });

    const title = getSectionTitle(sectionId);
    let msg = "";
    let type: "success" | "warning" | "error" | "info" = "info";
    if (decision === "approve") {
      msg = `"${title}" approved successfully.`;
      type = "success";
    } else if (decision === "clarification") {
      msg = `"${title}" marked as Needs Clarification.`;
      type = "warning";
    } else if (decision === "reject") {
      msg = `"${title}" section rejected.`;
      type = "error";
    } else {
      msg = `"${title}" decision reset.`;
      type = "info";
    }
    showToast(msg, type);
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

  useEffect(() => {
    if (!review) return;

    const computeActiveSection = () => {
      // Don't override activeTab while smooth scrolling from a user click
      if (isClickScrollingRef.current) return;

      // 1. If at the very top of the page, first section is active
      if (window.scrollY < 60) {
        updateActiveTab(REVIEW_SECTIONS[0].id);
        return;
      }

      // 2. If at or near the very bottom of the page, last section is active
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 60;
      if (isAtBottom) {
        updateActiveTab(REVIEW_SECTIONS[REVIEW_SECTIONS.length - 1].id);
        return;
      }

      // Collect all valid section elements and their bounding rects
      type SectionWithRect = {
        id: (typeof REVIEW_SECTIONS)[number]["id"];
        rect: DOMRect;
      };

      const sections: SectionWithRect[] = [];
      for (const sec of REVIEW_SECTIONS) {
        const el = document.getElementById(`review-section-${sec.id}`);
        if (el) {
          sections.push({
            id: sec.id,
            rect: el.getBoundingClientRect(),
          });
        }
      }

      if (sections.length === 0) return;

      const direction = scrollDirectionRef.current;
      const focalOffset = 150; // standard reading offset below sticky header (56px)

      // When scrolling from bottom to top:
      // The section above should ONLY be highlighted when we get to the top of that section
      // (its top header reaches >= 70px, emerging from beneath the sticky header),
      // and NOT when we just enter that section from the bottom.
      if (direction === "up") {
        const currentIdx = sections.findIndex((s) => s.id === activeTabRef.current);

        if (currentIdx > 0) {
          let newActiveId: string | null = null;

          // Check sections above from top down: the first section whose top has reached the reading area
          for (let i = 0; i < currentIdx; i++) {
            const sec = sections[i];
            if (sec.rect.top >= 70 && sec.rect.top <= window.innerHeight * 0.75) {
              newActiveId = sec.id;
              break;
            }
          }

          // If the current section has scrolled completely out of view at the bottom,
          // find the section currently visible at the reading line
          if (!newActiveId && sections[currentIdx].rect.top > window.innerHeight) {
            for (const sec of sections) {
              if (sec.rect.top <= focalOffset) {
                newActiveId = sec.id;
              }
            }
          }

          if (newActiveId) {
            updateActiveTab(newActiveId);
            return;
          }

          // Otherwise keep the current section active until the user reaches the top of the section above
          return;
        }
      }

      // Scrolling DOWN (default):
      // The active section is the last section whose top has reached or passed above the focal line
      let currentSecId: string = sections[0].id;
      for (const sec of sections) {
        if (sec.rect.top <= focalOffset) {
          currentSecId = sec.id;
        }
      }

      updateActiveTab(currentSecId);
    };

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollYRef.current;
      if (Math.abs(diff) >= 2) {
        scrollDirectionRef.current = diff > 0 ? "down" : "up";
        lastScrollYRef.current = currentScrollY;
      }

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(computeActiveSection);
    };

    const handleManualScroll = () => {
      if (isClickScrollingRef.current) {
        isClickScrollingRef.current = false;
        if (scrollEndTimerRef.current) {
          clearTimeout(scrollEndTimerRef.current);
          scrollEndTimerRef.current = null;
        }
      }
    };

    lastScrollYRef.current = window.scrollY;
    computeActiveSection();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("wheel", handleManualScroll, { passive: true });
    window.addEventListener("touchmove", handleManualScroll, { passive: true });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", handleManualScroll);
      window.removeEventListener("touchmove", handleManualScroll);
    };
  }, [review]);

  const scrollToSection = (sectionId: string) => {
    // Immediately set activeTab so clicked chip turns black without intermediate glitching
    updateActiveTab(sectionId);

    // Lock scroll spy updates during programmatic smooth scroll
    isClickScrollingRef.current = true;
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    const unlockScroll = () => {
      isClickScrollingRef.current = false;
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = null;
      }
      window.removeEventListener("scrollend", handleScrollEnd);
    };

    const handleScrollEnd = () => {
      unlockScroll();
    };

    window.addEventListener("scrollend", handleScrollEnd, { once: true });
    // Safety fallback timer if 'scrollend' is not fired or element is already in place
    scrollEndTimerRef.current = setTimeout(unlockScroll, 800);

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

  const scrollToNextSection = (currentSecId: string) => {
    const currentIndex = REVIEW_SECTIONS.findIndex((s) => s.id === currentSecId);
    if (currentIndex >= 0 && currentIndex < REVIEW_SECTIONS.length - 1) {
      const nextSec = REVIEW_SECTIONS[currentIndex + 1];
      scrollToSection(nextSec.id);
    } else {
      const el = document.getElementById("review-final-decision");
      if (el) {
        const stickyOffset = 130;
        const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const handleApproveButtonClick = () => {
    if (isApproved || isUpdatingStatus) return;

    // Find all unfilled sections in order from top to bottom
    const unfilled = REVIEW_SECTIONS.filter((sec) => !isSectionFilled(sec.id));

    if (unfilled.length > 0) {
      // Highlight unfilled sections with red margin
      const unfilledIds = new Set(unfilled.map((s) => s.id));
      setUnfilledSectionIds(unfilledIds);

      // Scroll smoothly to the first unfilled section from top
      const firstUnfilled = unfilled[0];
      scrollToSection(firstUnfilled.id);

      showToast(
        `Please complete the "${firstUnfilled.label}" section before approving.`,
        "warning"
      );
      return;
    }

    // All sections are filled: clear any highlights
    setUnfilledSectionIds(new Set());

    // Auto-commit any drafted decisions to submittedDecisions
    setSubmittedDecisions((prev) => {
      const updated = { ...prev };
      let changed = false;
      for (const sec of REVIEW_SECTIONS) {
        const draft = sectionDecisions[sec.id];
        if (draft?.decision && !updated[sec.id]?.decision) {
          updated[sec.id] = { ...draft };
          changed = true;
        }
      }
      if (changed && typeof window !== "undefined" && appId) {
        try {
          localStorage.setItem(`jatayu_review_submitted_${appId}`, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });

    setShowApproveConfirm(true);
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
        {toast && mounted ? createPortal(
          <div className={`${styles.toastNotification} ${
            toast.type === "success"
              ? styles.toastSuccess
              : toast.type === "warning"
              ? styles.toastWarning
              : toast.type === "error"
              ? styles.toastError
              : styles.toastInfo
          }`}>
            <div className={styles.toastIcon}>
              {toast.type === "success" && <CheckCircle2 size={18} />}
              {toast.type === "warning" && <AlertTriangle size={18} />}
              {toast.type === "error" && <XCircle size={18} />}
              {toast.type === "info" && <Info size={18} />}
            </div>
            <div className={styles.toastText}>{toast.message}</div>
            <button
              type="button"
              className={styles.toastCloseBtn}
              onClick={() => setToast(null)}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>,
          document.body
        ) : null}
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
        <div className={styles.stickyTopSection}>
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
        </div>

        <div className={styles.threeColumnContainer}>
          {/* COLUMN 1: Navigation Sidebar containing .chipsScrollWrapper */}
          <aside className={styles.leftColNav}>
            <div className={styles.chipsScrollWrapper}>
              <div className={styles.chipsNavHeader}>
                <span className={styles.chipsNavTitle}>Sections Nav</span>
              </div>
              <div className={styles.chipsNavList}>
                {REVIEW_SECTIONS.map((sec, idx) => {
                  const isActive = activeTab === sec.id;
                  const decision = getSectionDecision(sec.id);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      className={`${styles.chipButton} ${isActive ? styles.chipActive : ""}`}
                      onClick={() => scrollToSection(sec.id)}
                    >
                      <span className={styles.chipNum}>{idx + 1}</span>
                      <span className={styles.chipText}>{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* COLUMN 2: Center Main Content */}
          <main className={styles.centerContentCol}>
            {actionError ? (
              <p className={styles.actionError} role="alert">
                {actionError}
              </p>
            ) : null}

        <div className={styles.reviewSections}>
          {/* Category & Skills */}
          <article
            id="review-section-category"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("category") ? styles.unfilledSectionHighlight : ""
            }`}
          >
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
                  <div className={styles.govIdContent}>
                    <span className={styles.profileReviewTextValue}>{application.categoryLabel || "—"}</span>
                  </div>
                </div>

                {/* Right Column: Skills */}
                <div className={styles.credentialsRightCol}>
                  <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                    Expertise Skills
                  </div>
                  {!Array.isArray(application.skills) || application.skills.length === 0 ? (
                    <p className={styles.emptyTabMessage}>No skills selected.</p>
                  ) : (
                    <ul className={styles.bulletList}>
                      {(Array.isArray(application.skills) ? application.skills : []).map((skill) => (
                        <li key={skill} className={styles.bulletListItem}>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <SectionDecisionControl
                sectionId="category"
                sectionTitle="Category & Skills"
                state={sectionDecisions.category ?? { decision: null, note: "" }}
                submittedDecision={submittedDecisions.category?.decision ?? null}
                onChange={(st) => updateSectionDecision("category", st)}
                onNextSection={() => scrollToNextSection("category")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Work Experience & Portfolio */}
          <article
            id="review-section-experience"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("experience") ? styles.unfilledSectionHighlight : ""
            }`}
            style={{ marginTop: "24px" }}
          >
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
                    {!Array.isArray(application.employmentPositions) || application.employmentPositions.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No employment history submitted.</p>
                    ) : (
                      <div className={styles.employmentList}>
                        {(Array.isArray(application.employmentPositions) ? application.employmentPositions : []).map((pos) => (
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
                    {!Array.isArray(application.educationDegrees) || application.educationDegrees.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No educational credentials submitted.</p>
                    ) : (
                      <div className={styles.educationList}>
                        {(Array.isArray(application.educationDegrees) ? application.educationDegrees : []).map((deg) => (
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
                    {!Array.isArray(application.portfolioSamples) || application.portfolioSamples.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No portfolio samples submitted.</p>
                    ) : (
                      <div className={styles.credentialsList}>
                        {(Array.isArray(application.portfolioSamples) ? application.portfolioSamples : []).map((sample) => (
                          <div key={sample.id} className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLeft}>
                              <DocumentThumbnail
                                fileName={sample.fileName}
                                url={sample.url}
                                fileType={sample.fileType}
                                size="compact"
                              />
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
                                    mimeType: sample.fileType.includes("/")
                                      ? sample.fileType
                                      : undefined,
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
                submittedDecision={submittedDecisions.experience?.decision ?? null}
                onChange={(st) => updateSectionDecision("experience", st)}
                onNextSection={() => scrollToNextSection("experience")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Profile Details */}
          <article
            id="review-section-profile"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("profile") ? styles.unfilledSectionHighlight : ""
            }`}
            style={{ marginTop: "24px" }}
          >
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
                submittedDecision={submittedDecisions.profile?.decision ?? null}
                onChange={(st) => updateSectionDecision("profile", st)}
                onNextSection={() => scrollToNextSection("profile")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Credentials & KYC */}
          <article
            id="review-section-credentials"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("credentials") ? styles.unfilledSectionHighlight : ""
            }`}
            style={{ marginTop: "24px" }}
          >
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
                                <DocumentThumbnail
                                  fileName={govId.front.name}
                                  url={govId.front.url}
                                  size="compact"
                                />
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
                                  <DocumentThumbnail
                                    fileName={govId.back.name}
                                    url={govId.back.url}
                                    size="compact"
                                  />
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

                  {/* DigiLocker Documents */}
                  <div className={styles.certificatesSection} style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--mercury)" }}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      DigiLocker Documents
                    </div>
                    {digilockerDocumentError ? <p className={styles.emptyTabMessage}>{digilockerDocumentError}</p> : null}
                    {digilockerDocumentsLoading ? (
                      <p className={styles.emptyTabMessage}>Loading DigiLocker documents…</p>
                    ) : digilockerDocuments.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No DigiLocker documents fetched.</p>
                    ) : (
                      <div className={styles.credentialsList}>
                        {digilockerDocuments.map((document) => (
                          <div key={document.id} className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLeft}>
                              <DocumentThumbnail
                                fileName={document.documentName || document.documentType || "DigiLocker document"}
                                fileType={document.documentType || undefined}
                                size="compact"
                              />
                              <div className={styles.credentialsDetails}>
                                <span className={styles.credentialsName}>
                                  {document.documentName || document.documentType || "DigiLocker document"}
                                </span>
                                <span className={styles.credentialsMeta}>
                                  {document.issuerName || "DigiLocker"}
                                  {document.fileSize ? ` • ${(document.fileSize / 1024).toFixed(1)} KB` : ""}
                                  {document.downloadStatus !== "downloaded" ? ` • ${document.downloadStatus}` : ""}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={styles.credentialsAction}
                              disabled={!document.available}
                              onClick={() => void openDigilockerDocument(document)}
                            >
                              <Eye size={12} /> View Document
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Professional Certificates */}
                  <div className={styles.certificatesSection} style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--mercury)" }}>
                    <div className={styles.audienceSectionTitle} style={{ marginBottom: "16px" }}>
                      Professional Certificates
                    </div>
                    {!Array.isArray(application.certificates) || application.certificates.length === 0 ? (
                      <p className={styles.emptyTabMessage}>No certificates submitted.</p>
                    ) : (
                      <div className={styles.credentialsList}>
                        {(Array.isArray(application.certificates) ? application.certificates : []).map((cert) => (
                          <div key={cert.id} className={styles.credentialsItem}>
                            <div className={styles.credentialsItemLeft}>
                              <DocumentThumbnail
                                fileName={cert.fileName || `${cert.name}.docx`}
                                url={cert.url}
                                fileType="DOCX"
                                size="compact"
                              />
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
                                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
                submittedDecision={submittedDecisions.credentials?.decision ?? null}
                onChange={(st) => updateSectionDecision("credentials", st)}
                onNextSection={() => scrollToNextSection("credentials")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Consultation Preferences */}
          <article
            id="review-section-preferences"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("preferences") ? styles.unfilledSectionHighlight : ""
            }`}
            style={{ marginTop: "24px" }}
          >
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
                    .filter((fmt) => (Array.isArray(application.formats) ? application.formats : []).includes(fmt.id))
                    .map((fmt) => {
                      const Icon = FORMAT_ICONS[fmt.id as keyof typeof FORMAT_ICONS];
                      const price = formatFormatPriceDisplay(application.formatPrices?.[fmt.id]);
                      return (
                        <div key={fmt.id} className={styles.preferenceListItem}>
                          <div className={styles.preferenceIconWrap}>
                            <Icon size={18} />
                          </div>
                          <div className={styles.preferenceItemBody}>
                            <div className={styles.preferenceItemHeader}>
                              <span className={styles.preferenceTitle}>{fmt.title}</span>
                              <span className={styles.preferencePrice}>{price}/min</span>
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
                  {(Array.isArray(application.lengths) ? application.lengths : []).map((lenId) => {
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
                submittedDecision={submittedDecisions.preferences?.decision ?? null}
                onChange={(st) => updateSectionDecision("preferences", st)}
                onNextSection={() => scrollToNextSection("preferences")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Target Audience & Languages */}
          <article
            id="review-section-audience"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("audience") ? styles.unfilledSectionHighlight : ""
            }`}
            style={{ marginTop: "24px" }}
          >
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
                  {(Array.isArray(application.languages) ? application.languages : []).map((lang) => (
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
                    .filter((aud) => (Array.isArray(application.audiences) ? application.audiences : []).includes(aud.id))
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
                submittedDecision={submittedDecisions.audience?.decision ?? null}
                onChange={(st) => updateSectionDecision("audience", st)}
                onNextSection={() => scrollToNextSection("audience")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>

          {/* Availability & Schedule */}
          <article
            id="review-section-availability"
            className={`${styles.card} ${styles.reviewSection} ${
              isSectionUnfilledHighlighted("availability") ? styles.unfilledSectionHighlight : ""
            }`}
            style={{ marginTop: "24px" }}
          >
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
              {!Array.isArray(application.availabilitySlots) || application.availabilitySlots.length === 0 ? (
                <p className={styles.emptyTabMessage}>No availability slots submitted during onboarding.</p>
              ) : (
                <div className={styles.slotsList}>
                  {(Array.isArray(application.availabilitySlots) ? application.availabilitySlots : []).map((slot) => (
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
                            const daysArr = Array.isArray(slot.days)
                              ? slot.days
                              : typeof slot.days === "string"
                                ? (slot.days as string).split(",").map((d) => d.trim())
                                : [];
                            const isSelected = daysArr.includes(day);
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
                submittedDecision={submittedDecisions.availability?.decision ?? null}
                onChange={(st) => updateSectionDecision("availability", st)}
                onNextSection={() => scrollToNextSection("availability")}
                onSubmitDecision={submitSectionDecision}
                disabled={isApproved}
              />
            </div>
          </article>
        </div>



        <div id="review-final-decision" className={styles.finalDecisionRow}>
          <PrimaryButton
            type="button"
            label="Approve"
            variant="orange"
            disabled={isApproved || isUpdatingStatus}
            onClick={handleApproveButtonClick}
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
      </main>

      {/* COLUMN 3: Right Sidebar - Complete Summary Form matching Wireframe */}
      <aside className={styles.rightSummaryCol}>
        <div className={styles.formaSummaryCard}>
          {/* Header */}
          <div className={styles.formaSummaryTitleBar}>
            <span className={styles.formaSummaryTitle}>Application Summary</span>
          </div>

          {/* Profile Header Box (Image left, details right) */}
          <div className={styles.formaSummaryProfileBox}>
            <div className={styles.formaSummaryAvatarWrap}>
              <Image
                src={application.avatar || "/assets/img/avatar.png"}
                alt={application.name}
                fill
                className={styles.formaSummaryAvatarImg}
              />
            </div>
            <div className={styles.formaSummaryProfileDetails}>
              <h3 className={styles.formaSummaryName}>{application.name}</h3>
              <span className={styles.formaSummaryRole}>{application.professionalTitle || review.title}</span>
              <span className={styles.formaSummaryLine}>{application.categoryLabel || "Category"}</span>
              <span className={styles.formaSummaryLine}>{application.email}</span>
              <span className={styles.formaSummaryLine}>{application.phone || "—"}</span>
            </div>
          </div>

          {/* Section Summary Blocks */}
          {REVIEW_SECTIONS.map((sec) => {
            const dec = getSectionDecision(sec.id);
            const noteText = getSectionNote(sec.id);
            const badgeClass =
              dec === "approve"
                ? styles.formaBadgeApproved
                : dec === "clarification"
                ? styles.formaBadgeClarification
                : dec === "reject"
                ? styles.formaBadgeRejected
                : styles.formaBadgePending;
            const badgeLabel =
              dec === "approve"
                ? "APPROVED"
                : dec === "clarification"
                ? "ON HOLD"
                : dec === "reject"
                ? "REJECTED"
                : "PENDING";

            return (
              <div key={sec.id} className={styles.formaSectionBlock}>
                <div className={styles.formaSectionHeaderLine}>
                  <span className={styles.formaSectionTitleText}>{sec.label}</span>
                  <span className={styles.formaSectionRule} />
                  <span className={`${styles.formaStatusBadgePill} ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                </div>

                {/* Section Key-Value Fields summary */}
                <div className={styles.formaFieldsRowGrid}>
                  {sec.id === "category" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Category</span>
                        <span className={styles.formaFieldBoxVal}>{application.categoryLabel || "—"}</span>
                      </div>
                      <div className={`${styles.formaFieldBox} ${styles.formaFieldBoxFull}`}>
                        <span className={styles.formaFieldBoxLabel}>Expertise Skills</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.skills) && application.skills.length > 0
                            ? application.skills.join(", ")
                            : "—"}
                        </span>
                      </div>
                    </>
                  )}

                  {sec.id === "experience" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Jobs</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.employmentPositions) ? application.employmentPositions.length : 0}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Education</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.educationDegrees) ? application.educationDegrees.length : 0}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Portfolio</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.portfolioSamples) ? application.portfolioSamples.length : 0}
                        </span>
                      </div>
                    </>
                  )}

                  {sec.id === "profile" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Title</span>
                        <span className={styles.formaFieldBoxVal}>{application.professionalTitle || "—"}</span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Tagline</span>
                        <span className={styles.formaFieldBoxVal}>{application.tagLine || "—"}</span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Bio</span>
                        <span className={styles.formaFieldBoxVal}>{application.bio ? "Submitted" : "—"}</span>
                      </div>
                    </>
                  )}

                  {sec.id === "credentials" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>KYC</span>
                        <span className={styles.formaFieldBoxVal}>
                          {application.kycPhotos ? "3 Photos" : "—"}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Govt ID</span>
                        <span className={styles.formaFieldBoxVal}>
                          {application.governmentId?.type || "—"}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Certs</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.certificates) ? application.certificates.length : 0}
                        </span>
                      </div>
                    </>
                  )}

                  {sec.id === "preferences" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Formats</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.formats) ? application.formats.join(", ") : "—"}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Sessions</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.lengths) ? application.lengths.length : 0}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Pricing</span>
                        <span className={styles.formaFieldBoxVal}>Set</span>
                      </div>
                    </>
                  )}

                  {sec.id === "audience" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Languages</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.languages) ? application.languages.slice(0, 2).join(", ") : "—"}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Audiences</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.audiences) ? application.audiences.length : 0}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Target</span>
                        <span className={styles.formaFieldBoxVal}>Defined</span>
                      </div>
                    </>
                  )}

                  {sec.id === "availability" && (
                    <>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Slots</span>
                        <span className={styles.formaFieldBoxVal}>
                          {Array.isArray(application.availabilitySlots) ? application.availabilitySlots.length : 0}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Timezone</span>
                        <span className={styles.formaFieldBoxVal}>
                          {review.availability?.timezoneLabel || "IST"}
                        </span>
                      </div>
                      <div className={styles.formaFieldBox}>
                        <span className={styles.formaFieldBoxLabel}>Status</span>
                        <span className={styles.formaFieldBoxVal}>Configured</span>
                      </div>
                    </>
                  )}
                </div>

                {noteText && (
                  <div className={styles.formaNoteBox}>
                    <strong>Note:</strong> {noteText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  </div>
</section>
);
}
