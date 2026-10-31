"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
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
    return "Please sign in again to use AI suggestions, or write your tag line and introduction yourself.";
  }
  if (code === "AI_NOT_CONFIGURED" || message.toLowerCase().includes("not configured")) {
    return "AI suggestions are unavailable. You can write your tag line and introduction yourself.";
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
  const [photoError, setPhotoError] = useState("");
  const [aiLoading, setAiLoading] = useState({ tagLine: false, bio: false });
  const [aiErrors, setAiErrors] = useState({ tagLine: "", bio: "" });
  const [aiNotices, setAiNotices] = useState({ tagLine: "", bio: "" });
  const [hasGenerated, setHasGenerated] = useState({ tagLine: false, bio: false });
  const [selectedTones, setSelectedTones] = useState<{
    tagLine: IdentityTone | null;
    bio: IdentityTone | null;
  }>({ tagLine: null, bio: null });
  const requestIdRef = useRef({ tagLine: 0, bio: 0 });
  const editVersionRef = useRef({ tagLine: 0, bio: 0 });
  const variantIndexRef = useRef({ tagLine: 0, bio: 0 });

  const safeTagLine = tagLine ?? "";
  const safeBio = bio ?? "";
  const safeTitle = professionalTitle ?? "";
  const maxChars = 160;
  const maxPhotoBytes = 5 * 1024 * 1024;
  const tagLineCharCount = safeTagLine.length;
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



  useEffect(() => {
    onStepCompleteChange?.(4, canContinue);
  }, [canContinue, onStepCompleteChange]);

  useEffect(() => {
    const requestIds = requestIdRef.current;
    return () => {
      requestIds.tagLine += 1;
      requestIds.bio += 1;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (profilePhotoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoSrc);
      }
    };
  }, [profilePhotoSrc]);

  const handleSelectTone = (field: "tagLine" | "bio", tone: IdentityTone) => {
    setSelectedTones((previous) => ({ ...previous, [field]: tone }));
  };

  const handleSuggestField = async (field: "tagLine" | "bio") => {
    const requestId = ++requestIdRef.current[field];
    const editVersion = editVersionRef.current[field];
    const currentText = field === "tagLine" ? safeTagLine : safeBio;
    const variantIndex = variantIndexRef.current[field]++;
    const tone = selectedTones[field] || "professional";

    setAiLoading((previous) => ({ ...previous, [field]: true }));
    setAiErrors((previous) => ({ ...previous, [field]: "" }));
    setAiNotices((previous) => ({ ...previous, [field]: "" }));

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
        tone,
        intent: currentText.trim() ? "regenerate" : "suggest",
        variantIndex,
        field,
      });

      if (requestId !== requestIdRef.current[field] || editVersion !== editVersionRef.current[field]) {
        return;
      }

      const generated = field === "tagLine"
        ? response.tagLine
        : response.bio || response.briefIntroduction;
      if (!generated?.trim()) {
        throw new Error("No suggestion was returned. Please try again.");
      }

      if (field === "tagLine") onTagLineChange(generated.slice(0, maxChars));
      else onBioChange(generated.slice(0, maxChars));
      setHasGenerated((previous) => ({ ...previous, [field]: true }));

      if (response.source === "fallback") {
        setAiNotices((previous) => ({
          ...previous,
          [field]: response.notice || "AI is unavailable; this is a profile-based fallback suggestion.",
        }));
      }
    } catch (error) {
      if (requestId === requestIdRef.current[field] && editVersion === editVersionRef.current[field]) {
        console.warn("AI backend call error:", error);
        setAiErrors((previous) => ({ ...previous, [field]: friendlyAiError(error) }));
      }
    } finally {
      if (requestId === requestIdRef.current[field]) {
        setAiLoading((previous) => ({ ...previous, [field]: false }));
      }
    }
  };

  const handleTitleChange = (val: string) => {
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

            <div className={styles.fieldGroup}>
              <label htmlFor="title-input" className={styles.fieldLabel}>
                Professional Title
              </label>
              <input
                id="title-input"
                type="text"
                value={professionalTitle ?? ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={styles.textField}
                placeholder="e.g. Senior Software Engineer"
                autoComplete="off"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="tagline-input" className={styles.fieldLabel}>
                Tag Line
              </label>
              <div className={styles.textareaWrapperBox}>
                <div className={styles.inputBoxHeader}>
                  <div className={styles.inlinePillsWrap}>
                    {TONE_PILLS.map((pill) => {
                      const isSelected = selectedTones.tagLine === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          className={`${styles.suggestedPill} ${styles.inlinePill} ${
                            isSelected ? styles.suggestedPillSelected : ""
                          }`}
                          aria-pressed={isSelected}
                          onClick={() => handleSelectTone("tagLine", pill.id)}
                        >
                          <span>{pill.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <textarea
                  id="tagline-input"
                  value={tagLine ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    editVersionRef.current.tagLine += 1;
                    onTagLineChange(val.slice(0, maxChars));
                  }}
                  className={styles.innerBoxTextarea}
                  rows={3}
                  placeholder="e.g. I help startups build scalable design systems and intuitive user experiences."
                />
                <div className={styles.inputBoxFooter}>
                  <button
                    type="button"
                    className={styles.aiBioInlineBtn}
                    onClick={() => handleSuggestField("tagLine")}
                    disabled={aiLoading.tagLine}
                  >
                    <ShinyText
                      text={aiLoading.tagLine
                        ? "Generating…"
                        : hasGenerated.tagLine
                          ? "Regenerate"
                          : "Suggest by JATAYU AI"}
                      icon="sparkles"
                      iconSize={14}
                      speed={2.5}
                      color="#E53B17"
                      shineColor="#ffffff"
                      disabled={aiLoading.tagLine}
                    />
                  </button>
                  <span className={styles.textareaFooterCounter}>
                    {tagLineCharCount}/{maxChars}
                  </span>
                </div>
              </div>
              {aiErrors.tagLine ? <p className={styles.aiSuggestError}>{aiErrors.tagLine}</p> : null}
              {aiNotices.tagLine ? <p className={styles.aiImproveHint}>{aiNotices.tagLine}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="intro-input" className={styles.fieldLabel}>
                  Brief Introduction
                </label>
                <div className={styles.inlinePillsWrap}>
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
                        onClick={() => handleSelectTone("bio", pill.id)}
                      >
                        <span>{pill.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.textareaWrapper}>
                <textarea
                  id="intro-input"
                  value={bio ?? ""}
                  onChange={(e) => {
                    editVersionRef.current.bio += 1;
                    onBioChange(e.target.value.slice(0, maxChars));
                  }}
                  className={`${styles.textareaField} ${styles.textareaWithBioFooter}`}
                  rows={5}
                  placeholder="e.g. I'm a product leader with 8+ years guiding teams through complex launches. I focus on clarity, user research, and shipping work that moves the needle."
                />
                <div className={styles.textareaFooterInline}>
                  <button
                    type="button"
                    className={styles.aiBioInlineBtn}
                    onClick={() => handleSuggestField("bio")}
                    disabled={aiLoading.bio}
                  >
                    <ShinyText
                      text={aiLoading.bio
                        ? "Generating…"
                        : hasGenerated.bio
                          ? "Regenerate"
                          : "Suggest by JATAYU AI"}
                      icon="sparkles"
                      iconSize={14}
                      speed={2.5}
                      color="#E53B17"
                      shineColor="#ffffff"
                      disabled={aiLoading.bio}
                    />
                  </button>
                  <span className={styles.textareaFooterCounter}>
                    {introCharCount}/{maxChars}
                  </span>
                </div>
              </div>
              {aiErrors.bio ? <p className={styles.aiSuggestError}>{aiErrors.bio}</p> : null}
              {aiNotices.bio ? <p className={styles.aiImproveHint}>{aiNotices.bio}</p> : null}
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
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton onClick={onContinue} disabled={!canContinue} />
        </div>
      </div>
    </section>
  );
}
