"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Sparkles } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertCard from "@/components/ui/ExpertCard";
import ShinyText from "@/components/ui/ShinyText";
import { type Expert } from "@/lib/experts";
import { ApiError, suggestOnboardingIdentityCopy } from "@/lib/api";
import {
  AI_FALLBACK_NOTICE,
  buildLocalIdentityCopy,
  buildIdentityCopyByTone,
  type IdentityTone,
  type IdentityToneOptions,
  type IdentitySuggestIntent,
} from "@/lib/expertIdentitySuggest";
import {
  deriveExperienceLevel,
  getFilledEducationDegrees,
  getFilledEmploymentPositions,
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
  const taglineInputRef = useRef<HTMLTextAreaElement>(null);
  const [photoError, setPhotoError] = useState("");
  const [aiLoadingField, setAiLoadingField] = useState<"tagLine" | "bio" | null>(null);
  const [aiError, setAiError] = useState("");
  const [tagLineTone, setTagLineTone] = useState<IdentityTone | null>(null);
  const [bioTone, setBioTone] = useState<IdentityTone | null>(null);
  const [tagLineToneOptions, setTagLineToneOptions] = useState<IdentityToneOptions | null>(null);
  const [bioToneOptions, setBioToneOptions] = useState<IdentityToneOptions | null>(null);
  const [showTagLinePills, setShowTagLinePills] = useState(false);
  const [showBioPills, setShowBioPills] = useState(false);
  const [isTagLineApplied, setIsTagLineApplied] = useState(false);
  const [isBioApplied, setIsBioApplied] = useState(false);
  const variantIndexRef = useRef({ tagLine: 0, bio: 0 });

  const [isTagLineUserEdited, setIsTagLineUserEdited] = useState(false);

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
    if (safeTitle.trim().length > 0 && safeTagLine.trim().length === 0) {
      handleSuggestField("tagLine");
    }
  }, []);

  useEffect(() => {
    onStepCompleteChange?.(4, canContinue);
  }, [canContinue, onStepCompleteChange]);

  useEffect(() => {
    return () => {
      if (profilePhotoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoSrc);
      }
    };
  }, [profilePhotoSrc]);

  const fetchToneOptionsFromAi = async (field: "tagLine" | "bio") => {
    setAiLoadingField(field);
    setAiError("");
    try {
      const response = await suggestOnboardingIdentityCopy({
        fullName: userName,
        category: categoryLabel,
        skills: selectedSkills,
        experienceLevel: experienceLevel || deriveExperienceLevel(employmentPositions),
        professionalTitle,
        currentTagLine: tagLine,
        currentBio: bio,
        field,
      });

      const toneOptions = response.tones || response.options || response.suggestions;
      if (toneOptions) {
        return toneOptions;
      }

      if (field === "tagLine" && response.tagLine) {
        const generated = response.tagLine;
        return {
          professional: { tagLine: generated, bio: bio },
          casual: { tagLine: generated, bio: bio },
          concise: { tagLine: generated, bio: bio },
        };
      }

      if (field === "bio" && response.briefIntroduction) {
        const generated = response.briefIntroduction;
        return {
          professional: { tagLine: tagLine, bio: generated },
          casual: { tagLine: tagLine, bio: generated },
          concise: { tagLine: tagLine, bio: generated },
        };
      }
    } catch (err) {
      console.warn("AI backend call error:", err);
      setAiError(friendlyAiError(err));
    } finally {
      setAiLoadingField(null);
    }
    return null;
  };

  const handleApplyTaglineTone = (tone: IdentityTone, overrideOpts?: IdentityToneOptions) => {
    const opts = overrideOpts || tagLineToneOptions;
    if (!opts || !opts[tone]) return;

    if (tagLineTone === tone && !overrideOpts) {
      setTagLineTone(null);
      setIsTagLineApplied(false);
      return;
    }
    setTagLineToneOptions(opts);
    setTagLineTone(tone);
    onTagLineChange(opts[tone].tagLine);
    setIsTagLineApplied(true);
    setIsTagLineUserEdited(false);

    setTimeout(() => {
      if (taglineInputRef.current) {
        taglineInputRef.current.focus();
        const len = taglineInputRef.current.value.length;
        taglineInputRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  const handleSelectTone = (field: "tagLine" | "bio", tone: IdentityTone) => {
    if (field === "tagLine") {
      handleApplyTaglineTone(tone);
    } else {
      if (bioTone === tone) {
        setBioTone(null);
        setIsBioApplied(false);
        return;
      }
      const opts = bioToneOptions;
      if (!opts) return;
      setBioToneOptions(opts);
      setBioTone(tone);
      setIsBioApplied(false);
    }
  };

  const handleApplyTone = (field: "tagLine" | "bio") => {
    if (field === "tagLine") {
      handleApplyTaglineTone(tagLineTone || "professional");
    } else {
      const opts = bioToneOptions;
      if (!opts) return;
      const activeTone = bioTone || "professional";
      onBioChange(opts[activeTone].bio);
      setIsBioApplied(true);
    }
  };

  const handleSuggestField = async (field: "tagLine" | "bio") => {
    const aiOpts = await fetchToneOptionsFromAi(field);
    if (!aiOpts) return;

    if (field === "tagLine") {
      setShowTagLinePills(true);
      setTagLineToneOptions(aiOpts);
      const activeTone = tagLineTone || "professional";
      setTagLineTone(activeTone);
      if (aiOpts[activeTone]?.tagLine) {
        onTagLineChange(aiOpts[activeTone].tagLine);
        setIsTagLineApplied(true);
        setIsTagLineUserEdited(false);
      }
    } else {
      setShowBioPills(true);
      setBioToneOptions(aiOpts);
      const activeTone = bioTone || "professional";
      setBioTone(activeTone);
      setIsBioApplied(false);
    }
  };

  const handleTitleChange = (val: string) => {
    onProfessionalTitleChange(val);
  };

  const handleTitleBlur = () => {
    if (safeTitle.trim().length > 0 && (!isTagLineUserEdited || safeTagLine.trim().length === 0)) {
      handleSuggestField("tagLine");
    }
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
  const tagLineBusy = aiLoadingField === "tagLine";
  const bioBusy = aiLoadingField === "bio";

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
                onBlur={handleTitleBlur}
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
                {safeTitle.trim().length > 0 ? (
                  <div className={styles.inputBoxHeader}>
                    <div className={styles.inlinePillsWrap}>
                      {TONE_PILLS.map((pill) => {
                        const isSelected = tagLineTone === pill.id;
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            className={`${styles.suggestedPill} ${styles.inlinePill} ${
                              isSelected ? styles.suggestedPillSelected : ""
                            }`}
                            onClick={() => handleApplyTaglineTone(pill.id)}
                          >
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <textarea
                  ref={taglineInputRef}
                  id="tagline-input"
                  value={tagLine ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.trim().length === 0) {
                      setIsTagLineUserEdited(false);
                    } else {
                      setIsTagLineUserEdited(true);
                    }
                    onTagLineChange(val.slice(0, maxChars));
                  }}
                  className={styles.innerBoxTextarea}
                  rows={3}
                  placeholder="e.g. I help startups build scalable design systems and intuitive user experiences."
                />
                <div className={styles.inputBoxFooter}>
                  <span className={styles.textareaFooterCounter}>
                    {tagLineCharCount}/{maxChars}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="intro-input" className={styles.fieldLabel}>
                  Brief Introduction
                </label>
              </div>
              <div className={styles.textareaWrapper}>
                <textarea
                  id="intro-input"
                  value={bio ?? ""}
                  onChange={(e) => onBioChange(e.target.value.slice(0, maxChars))}
                  className={`${styles.textareaField} ${styles.textareaWithBioFooter}`}
                  rows={5}
                  placeholder="e.g. I'm a product leader with 8+ years guiding teams through complex launches. I focus on clarity, user research, and shipping work that moves the needle."
                />
                <div className={styles.textareaFooterInline}>
                  <AnimatePresence>
                    {bioBusy ? (
                      <motion.span
                        key="bio-ai-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.aiBioLoadingText}
                      >
                        Suggesting…
                      </motion.span>
                    ) : !showBioPills ? (
                      <motion.button
                        key="bio-ai-suggest"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        type="button"
                        className={styles.aiBioInlineBtn}
                        disabled={bioBusy}
                        onClick={() => handleSuggestField("bio")}
                      >
                        <ShinyText
                          text="Suggest by Jatayu AI"
                          icon="sparkles"
                          iconSize={14}
                          speed={2.5}
                          color="#E53B17"
                          shineColor="#ffffff"
                          className={styles.aiBioShinyText}
                        />
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                  <span className={styles.textareaFooterCounter}>
                    {introCharCount}/{maxChars}
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {showBioPills ? (
                  <motion.div
                    key="bio-ai-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                    className={styles.aiImprovePanel}
                  >
                    <div className={styles.taglineChipsRow}>
                      {TONE_PILLS.map((pill) => {
                        const isSelected = bioTone === pill.id;
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            className={`${styles.suggestedPill} ${isSelected ? styles.suggestedPillSelected : ""}`}
                            onClick={() => handleSelectTone("bio", pill.id)}
                          >
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className={styles.aiImproveHint}>
                      {bioToneOptions
                        ? bioToneOptions[bioTone || "professional"].bio
                        : "Select a tone pill to preview."}
                    </p>
                    <button
                      type="button"
                      className={styles.aiApplyBtn}
                      onClick={() => handleApplyTone("bio")}
                      disabled={isBioApplied}
                    >
                      <ShinyText
                        text={isBioApplied ? "Applied" : "Apply"}
                        speed={2.5}
                        color="#E53B17"
                        shineColor="#ffffff"
                        disabled={isBioApplied}
                        className={styles.aiApplyShinyText}
                      />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {aiError ? <p className={styles.aiSuggestError}>{aiError}</p> : null}
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
