"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import TextButton from "@/components/ui/TextButton";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertCard from "@/components/ui/ExpertCard";
import ShinyText from "@/components/ui/ShinyText";
import { type Expert } from "@/lib/experts";
import { ApiError, suggestOnboardingIdentityCopy } from "@/lib/api";
import { type IdentityTone } from "@/lib/expertIdentitySuggest";
import {
  deriveExperienceLevel,
  type EducationDegree,
  type EmploymentPosition,
} from "@/lib/expertEmployment";
import shared from "./onboarding.shared.module.css";
import styles from "./IdentityStep.module.css";

function friendlyAiError(error: unknown): string {
  const code = error instanceof ApiError ? error.code : undefined;
  const status = error instanceof ApiError ? error.status : undefined;
  const message = error instanceof Error ? error.message : "";
  if (status === 401) {
    return "Please sign in again to use AI suggestions, or write your title, tag line and introduction yourself.";
  }
  if (code === "AI_NOT_CONFIGURED" || message.toLowerCase().includes("not configured")) {
    return "AI suggestions are unavailable. You can write your title, tag line and introduction yourself.";
  }
  return "Could not generate suggestions. You can write these yourself or try again.";
}

type IdentityStepProps = {
  userName: string;
  categoryLabel: string;
  selectedSkills: string[];
  professionalTitle: string;
  onProfessionalTitleChange: (value: string) => void;
  tagLine: string;
  onTagLineChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
  profilePhotoSrc: string;
  onProfilePhotoChange: (src: string) => void;
  experienceLevel?: string;
  employmentPositions?: EmploymentPosition[];
  educationDegrees?: EducationDegree[];
  languages?: string[];
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

const TONE_PILLS: Array<{ id: IdentityTone; label: string }> = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "concise", label: "Concise" },
];

const DEFAULT_GHOSTED_TAGLINE =
  "I help startups build scalable design systems and intuitive user experiences.";

// Shorter ghosted text for the brief introduction
const DEFAULT_GHOSTED_BIO =
  "I'm a product leader focused on clarity, user research, and shipping impactful work.";

export default function IdentityStep({
  userName,
  categoryLabel,
  selectedSkills,
  professionalTitle,
  onProfessionalTitleChange,
  tagLine,
  onTagLineChange,
  bio,
  onBioChange,
  profilePhotoSrc,
  onProfilePhotoChange,
  experienceLevel,
  employmentPositions = [],
  educationDegrees = [],
  languages = [],
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: IdentityStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tag line refs
  const tagLineTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tagLineGhostOverlayRef = useRef<HTMLDivElement>(null);

  // Brief Introduction refs
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bioGhostOverlayRef = useRef<HTMLDivElement>(null);

  const [photoError, setPhotoError] = useState("");
  const [aiLoading, setAiLoading] = useState({ tagLine: false, bio: false, professionalTitle: false });
  const [aiErrors, setAiErrors] = useState({ tagLine: "", bio: "", professionalTitle: "" });
  const [selectedTones, setSelectedTones] = useState<{
    tagLine: IdentityTone | null;
    bio: IdentityTone | null;
    professionalTitle: IdentityTone | null;
  }>({ tagLine: null, bio: null, professionalTitle: null });
  
  const [showTagLineTones, setShowTagLineTones] = useState(false);
  const [showBioTones, setShowBioTones] = useState(false);

  const requestIdRef = useRef({ tagLine: 0, bio: 0, professionalTitle: 0 });
  const editVersionRef = useRef({ tagLine: 0, bio: 0, professionalTitle: 0 });
  const variantIndexRef = useRef({ tagLine: 0, bio: 0, professionalTitle: 0 });

  const safeTagLine = tagLine ?? "";
  const safeBio = bio ?? "";
  const safeTitle = professionalTitle ?? "";
  const maxChars = 160;
  const maxPhotoBytes = 5 * 1024 * 1024;
  const introCharCount = safeBio.length;
  const isObjectUrl =
    profilePhotoSrc.startsWith("blob:") || profilePhotoSrc.startsWith("data:");
  const isRemotePhoto =
    isObjectUrl ||
    profilePhotoSrc.startsWith("https://") ||
    profilePhotoSrc.startsWith("http://");
  const canContinue =
    safeTitle.trim().length > 0 &&
    safeTagLine.trim().length > 0 &&
    safeBio.trim().length > 0;

  // Sync scroll position between textarea and ghost text overlay for Tag Line
  const handleTagLineScroll = () => {
    if (tagLineTextareaRef.current && tagLineGhostOverlayRef.current) {
      tagLineGhostOverlayRef.current.scrollTop = tagLineTextareaRef.current.scrollTop;
    }
  };

  // Sync scroll position between textarea and ghost text overlay for Brief Introduction
  const handleBioScroll = () => {
    if (bioTextareaRef.current && bioGhostOverlayRef.current) {
      bioGhostOverlayRef.current.scrollTop = bioTextareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    onStepCompleteChange?.(4, canContinue);
  }, [canContinue, onStepCompleteChange]);

  useEffect(() => {
    const requestIds = requestIdRef.current;
    return () => {
      requestIds.tagLine += 1;
      requestIds.bio += 1;
      requestIds.professionalTitle += 1;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (profilePhotoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoSrc);
      }
    };
  }, [profilePhotoSrc]);

  const handleSelectTone = (field: "tagLine" | "bio" | "professionalTitle", tone: IdentityTone) => {
    setSelectedTones((previous) => ({ ...previous, [field]: tone }));
  };

  const handleSuggestField = async (
    field: "tagLine" | "bio" | "professionalTitle",
    overrideTone?: IdentityTone
  ): Promise<boolean> => {
    const requestId = ++requestIdRef.current[field];
    const editVersion = editVersionRef.current[field];
    const currentText = field === "tagLine" ? safeTagLine : field === "bio" ? safeBio : safeTitle;
    const variantIndex = variantIndexRef.current[field]++;
    const tone = overrideTone || selectedTones[field] || "professional";

    setAiLoading((previous) => ({ ...previous, [field]: true }));
    setAiErrors((previous) => ({ ...previous, [field]: "" }));

    try {
      const response = await suggestOnboardingIdentityCopy({
        fullName: userName,
        category: categoryLabel,
        skills: selectedSkills,
        experienceLevel: experienceLevel || deriveExperienceLevel(employmentPositions),
        professionalTitle,
        languages,
        employment: employmentPositions,
        education: educationDegrees,
        currentTagLine: safeTagLine,
        currentBio: safeBio,
        currentProfessionalTitle: safeTitle,
        tone,
        intent: currentText.trim() ? "regenerate" : "suggest",
        variantIndex,
        field,
      });

      if (requestId !== requestIdRef.current[field] || editVersion !== editVersionRef.current[field]) {
        return false;
      }

      const generated = field === "professionalTitle"
        ? response.professionalTitle
        : field === "tagLine"
          ? response.tagLine
          : response.bio || response.briefIntroduction;
      if (!generated?.trim()) {
        throw new Error("No suggestion was returned. Please try again.");
      }

      if (field === "professionalTitle") onProfessionalTitleChange(generated.slice(0, maxChars));
      else if (field === "tagLine") onTagLineChange(generated.slice(0, maxChars));
      else onBioChange(generated.slice(0, maxChars));
      
      return true;
    } catch (error) {
      if (requestId === requestIdRef.current[field] && editVersion === editVersionRef.current[field]) {
        console.warn("AI backend call error:", error);
        setAiErrors((previous) => ({ ...previous, [field]: friendlyAiError(error) }));
      }
      return false;
    } finally {
      if (requestId === requestIdRef.current[field]) {
        setAiLoading((previous) => ({ ...previous, [field]: false }));
      }
    }
  };

  const handleImproveTagLine = async () => {
    const success = await handleSuggestField("tagLine");
    if (success) {
      setShowTagLineTones(true);
    }
  };

  const handleImproveBio = async () => {
    const success = await handleSuggestField("bio");
    if (success) {
      setShowBioTones(true);
    }
  };

  const handleTitleChange = (val: string) => {
    editVersionRef.current.professionalTitle += 1;
    onProfessionalTitleChange(val);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file.");
      return;
    }

    if (file.size > maxPhotoBytes) {
      setPhotoError("Image must be 5MB or smaller.");
      return;
    }

    setPhotoError("");
    if (profilePhotoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(profilePhotoSrc);
    }
    onProfilePhotoChange(URL.createObjectURL(file));
  };

  const previewExpert: Expert = {
    name: userName.trim() || "Your Name",
    role: professionalTitle.trim() || "Professional Title",
    desc: tagLine.trim() || "Your tag line appears here.",
    image: profilePhotoSrc,
    category: categoryLabel.trim() || "Category",
    topics: [],
    languages: [],
    price: 0,
    rating: 0,
    replyTime: "—",
    bio: bio.trim(),
  };
  const previewStatsText = professionalTitle.trim()
    ? professionalTitle.trim()
    : "Add your professional title";

  // Ghosted mechanics logic for Tag Line
  const tagLineTypedLength = safeTagLine.length;
  const showTagLineGhostOverlay = tagLineTypedLength > 0 && tagLineTypedLength < DEFAULT_GHOSTED_TAGLINE.length;
  const tagLineGhostRemainingText = showTagLineGhostOverlay ? DEFAULT_GHOSTED_TAGLINE.slice(tagLineTypedLength) : "";

  // Ghosted mechanics logic for Brief Introduction (shortened)
  const bioTypedLength = safeBio.length;
  const showBioGhostOverlay = bioTypedLength > 0 && bioTypedLength < DEFAULT_GHOSTED_BIO.length;
  const bioGhostRemainingText = showBioGhostOverlay ? DEFAULT_GHOSTED_BIO.slice(bioTypedLength) : "";

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <OnboardingProgressBar currentStep={4} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Craft your <span className={shared.accentWord}>professional identity</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          This is the first impression clients will have. Make it count.
        </p>

        <div className={styles.splitLayout}>
          <div className={styles.inputsColumn}>
            {/* Photo Upload Header */}
            <div className={styles.photoUploadContainer}>
              <label
                htmlFor="identity-photo-upload"
                className={styles.photoAvatarWrap}
                aria-label="Upload profile photo"
              >
                <span className={styles.photoAvatarInner}>
                  {isRemotePhoto ? (
                    <img
                      src={profilePhotoSrc}
                      alt="Expert profile headshot"
                      className={styles.photoAvatar}
                    />
                  ) : (
                    <Image
                      src={profilePhotoSrc}
                      alt="Expert profile headshot"
                      width={80}
                      height={80}
                      className={styles.photoAvatar}
                    />
                  )}
                </span>
                <span className={styles.photoPlusBtn} aria-hidden="true">
                  <Plus size={14} />
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="identity-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={styles.hiddenFileInput}
                onChange={handlePhotoChange}
              />
              <div className={styles.photoUploadInfo}>
                <h3 className={styles.photoUploadTitle}>Profile Photo</h3>
                <p className={`${styles.photoUploadDesc} ${photoError ? styles.photoUploadDescError : ""}`}>
                  {photoError || "Clear, professional headshot. Max 5MB."}
                </p>
              </div>
            </div>

            {/* PROFESSIONAL TITLE */}
            <div className={styles.fieldGroup}>
              <label htmlFor="title-input" className={styles.fieldLabel}>
                Professional Title
              </label>
              <div className={styles.singleLineWrapper}>
                <input
                  id="title-input"
                  type="text"
                  value={safeTitle}
                  onChange={(e) => handleTitleChange(e.target.value.slice(0, maxChars))}
                  className={styles.textField}
                  placeholder="e.g. Software Engineering Specialist"
                />
              </div>
            </div>

            {/* TAG LINE */}
            <div className={styles.fieldGroup}>
              <label htmlFor="tagline-input" className={styles.fieldLabel}>
                Tag Line
              </label>

              <div className={styles.tagLineBox}>
                <div className={styles.ghostTextareaContainer}>
                  <div
                    ref={tagLineGhostOverlayRef}
                    className={styles.ghostTextOverlay}
                    aria-hidden="true"
                  >
                    <span className={styles.ghostTypedSpacer}>{safeTagLine}</span>
                    <span className={styles.ghostTextRemaining}>{tagLineGhostRemainingText}</span>
                  </div>

                  <textarea
                    ref={tagLineTextareaRef}
                    id="tagline-input"
                    value={safeTagLine}
                    onChange={(e) => {
                      editVersionRef.current.tagLine += 1;
                      onTagLineChange(e.target.value.slice(0, maxChars));
                      if (showTagLineTones) {
                        setShowTagLineTones(false);
                      }
                    }}
                    onScroll={handleTagLineScroll}
                    className={`${styles.boxTextarea} ${styles.ghostInputTextarea}`}
                    rows={3}
                    style={{ resize: "none" }}
                    placeholder={DEFAULT_GHOSTED_TAGLINE}
                  />
                </div>

                <div className={styles.boxFooter}>
                  {showTagLineTones ? (
                    <div className={styles.pillsHeaderRow}>
                      {TONE_PILLS.map((pill) => {
                        const isSelected = selectedTones.tagLine === pill.id;
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            className={`${styles.suggestedPill} ${
                              isSelected ? styles.suggestedPillSelected : ""
                            }`}
                            aria-pressed={isSelected}
                            onClick={() => {
                              handleSelectTone("tagLine", pill.id);
                              handleSuggestField("tagLine", pill.id);
                            }}
                          >
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : safeTagLine.trim().length > 0 ? (
                    <button
                      type="button"
                      className={styles.aiTagLineBtn}
                      onClick={handleImproveTagLine}
                      disabled={aiLoading.tagLine}
                    >
                      <ShinyText
                        text={aiLoading.tagLine ? "Improving..." : "Improve with JATAYU AI"}
                        icon="sparkles"
                        iconSize={14}
                        speed={2.5}
                        color="#E53B17"
                        shineColor="#ffffff"
                        disabled={aiLoading.tagLine}
                      />
                    </button>
                  ) : (
                    <div />
                  )}

                  <span className={styles.textareaFooterCounter}>
                    {safeTagLine.length}/{maxChars}
                  </span>
                </div>
              </div>

              {aiErrors.tagLine ? (
                <p className={styles.aiSuggestError}>{aiErrors.tagLine}</p>
              ) : null}
            </div>

            {/* BRIEF INTRODUCTION */}
            <div className={styles.fieldGroup}>
              <label htmlFor="intro-input" className={styles.fieldLabel}>
                Brief Introduction
              </label>

              <div className={styles.introBox}>
                <div className={styles.ghostTextareaContainer}>
                  <div
                    ref={bioGhostOverlayRef}
                    className={styles.ghostTextOverlay}
                    aria-hidden="true"
                  >
                    <span className={styles.ghostTypedSpacer}>{safeBio}</span>
                    <span className={styles.ghostTextRemaining}>{bioGhostRemainingText}</span>
                  </div>

                  <textarea
                    ref={bioTextareaRef}
                    id="intro-input"
                    value={safeBio}
                    onChange={(e) => {
                      editVersionRef.current.bio += 1;
                      onBioChange(e.target.value.slice(0, maxChars));
                      if (showBioTones) {
                        setShowBioTones(false);
                      }
                    }}
                    onScroll={handleBioScroll}
                    className={`${styles.boxTextarea} ${styles.ghostInputTextarea}`}
                    rows={4}
                    style={{ resize: "none" }}
                    placeholder={DEFAULT_GHOSTED_BIO}
                  />
                </div>

                <div className={styles.boxFooter}>
                  {showBioTones ? (
                    <div className={styles.pillsHeaderRow}>
                      {TONE_PILLS.map((pill) => {
                        const isSelected = selectedTones.bio === pill.id;
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            className={`${styles.suggestedPill} ${
                              isSelected ? styles.suggestedPillSelected : ""
                            }`}
                            aria-pressed={isSelected}
                            onClick={() => {
                              handleSelectTone("bio", pill.id);
                              handleSuggestField("bio", pill.id);
                            }}
                          >
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : safeBio.trim().length > 0 ? (
                    <button
                      type="button"
                      className={styles.aiBioInlineBtn}
                      onClick={handleImproveBio}
                      disabled={aiLoading.bio}
                    >
                      <ShinyText
                        text={aiLoading.bio ? "Improving..." : "Improve with JATAYU AI"}
                        icon="sparkles"
                        iconSize={14}
                        speed={2.5}
                        color="#E53B17"
                        shineColor="#ffffff"
                        disabled={aiLoading.bio}
                      />
                    </button>
                  ) : (
                    <div />
                  )}

                  <span className={styles.textareaFooterCounter}>
                    {introCharCount}/{maxChars}
                  </span>
                </div>
              </div>

              {aiErrors.bio ? <p className={styles.aiSuggestError}>{aiErrors.bio}</p> : null}
            </div>
          </div>

          <div className={styles.previewColumn}>
            <div className={styles.expertCardWrapper}>
              <ExpertCard
                expert={previewExpert}
                linkToDetail={false}
                disableHover
                showLanguages={false}
                statsText={previewStatsText}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Expert advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Looking sharp!</strong>
            <small>A clear title helps users find you faster.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <TextButton label="Back" onClick={onBack} />
          <TextButton label="Skip" onClick={onContinue} />
          <ContinueButton onClick={onContinue} disabled={!canContinue} />
        </div>
      </div>
    </section>
  );
}