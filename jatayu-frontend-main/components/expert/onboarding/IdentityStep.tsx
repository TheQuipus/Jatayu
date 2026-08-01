"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertCard from "@/components/ui/ExpertCard";
import ShinyText from "@/components/ui/ShinyText";
import { type Expert } from "@/lib/experts";
import shared from "./onboarding.shared.module.css";
import styles from "./IdentityStep.module.css";

const IMPROVEMENT_STYLES = [
  { id: "professional", label: "More Professional" },
  { id: "casual", label: "Casual" },
  { id: "concise", label: "More Concise" },
] as const;

type ImprovementStyleId = (typeof IMPROVEMENT_STYLES)[number]["id"];

function getImprovedBioText(
  styleId: ImprovementStyleId,
  current: string,
  role: string,
  category: string,
  maxChars: number = 160,
): string {
  const effectiveRole = role.trim() || "expert";
  const effectiveCategory = category.trim() || "this field";

  let base = current.trim();
  const prefixes = [
    `Senior ${effectiveRole} in ${effectiveCategory}.`,
    `I'm a ${effectiveRole} passionate about ${effectiveCategory}.`,
    `I am a ${effectiveRole} specializing in ${effectiveCategory}.`,
  ];

  for (const p of prefixes) {
    if (base.toLowerCase().startsWith(p.toLowerCase())) {
      base = base.slice(p.length).trim();
    }
  }

  base = base
    .replace(/^Senior\s+[^.]+\.\s*/i, "")
    .replace(/^I'm a\s+[^.]+\.\s*/i, "")
    .replace(/^I am a\s+[^.]+\.\s*/i, "")
    .trim();

  if (!base) {
    base = `focusing on user research, strategy, and shipping work that moves the needle.`;
  }

  let result = "";
  if (styleId === "professional") {
    result = `Senior ${effectiveRole} in ${effectiveCategory}. ${base}`;
  } else if (styleId === "casual") {
    result = `I'm a ${effectiveRole} passionate about ${effectiveCategory}. ${base}`;
  } else if (styleId === "concise") {
    const sentences = base
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    result = sentences.slice(0, 2).join(" ");
  }

  return result.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

function getImprovedTaglineText(
  styleId: ImprovementStyleId,
  current: string,
  role: string,
  category: string,
  maxChars: number = 160,
): string {
  const effectiveRole = role.trim() || "expert";
  const effectiveCategory = category.trim() || "growth";

  let base = current.trim();
  const prefixes = [
    `I help clients excel in ${effectiveCategory} as a ${effectiveRole}.`,
    `Passionate ${effectiveRole} helping teams win in ${effectiveCategory}.`,
    `${effectiveRole} in ${effectiveCategory} —`,
  ];

  for (const p of prefixes) {
    if (base.toLowerCase().startsWith(p.toLowerCase())) {
      base = base.slice(p.length).trim();
    }
  }

  base = base
    .replace(/^I help\s+[^.]+\.\s*/i, "")
    .replace(/^Passionate\s+[^.]+\.\s*/i, "")
    .replace(/^[^—]+—\s*/i, "")
    .trim();

  if (!base) {
    base = `building high-impact systems and scalable solutions.`;
  }

  let result = "";
  if (styleId === "professional") {
    result = `I help clients excel in ${effectiveCategory} as a ${effectiveRole}. ${base}`;
  } else if (styleId === "casual") {
    result = `Passionate ${effectiveRole} helping teams win in ${effectiveCategory}. ${base}`;
  } else if (styleId === "concise") {
    result = `${effectiveRole} in ${effectiveCategory} — ${base}`;
  }

  return result.replace(/\s+/g, " ").trim().slice(0, maxChars);
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
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

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
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: IdentityStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const taglinePanelRef = useRef<HTMLDivElement | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [showImprovementPanel, setShowImprovementPanel] = useState(false);
  const [selectedImproveStyle, setSelectedImproveStyle] = useState<ImprovementStyleId | null>(null);
  const [appliedBioStyle, setAppliedBioStyle] = useState<ImprovementStyleId | null>(null);
  const [showTaglinePanel, setShowTaglinePanel] = useState(false);
  const [selectedTaglineStyle, setSelectedTaglineStyle] = useState<ImprovementStyleId | null>(null);
  const [appliedTaglineStyle, setAppliedTaglineStyle] = useState<ImprovementStyleId | null>(null);

  const maxChars = 160;
  const maxPhotoBytes = 5 * 1024 * 1024;
  const tagLineCharCount = tagLine.length;
  const introCharCount = bio.length;
  const isUploadedPhoto =
    profilePhotoSrc.startsWith("blob:") || profilePhotoSrc.startsWith("data:");
  const canContinue =
    professionalTitle.trim().length > 0 &&
    tagLine.trim().length > 0 &&
    bio.trim().length > 0;

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

  useEffect(() => {
    if (showImprovementPanel && panelRef.current) {
      const timer = setTimeout(() => {
        panelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showImprovementPanel, selectedImproveStyle]);

  useEffect(() => {
    if (showTaglinePanel && taglinePanelRef.current) {
      const timer = setTimeout(() => {
        taglinePanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showTaglinePanel, selectedTaglineStyle]);

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

  const handleAiBioAssist = () => {
    setShowImprovementPanel(true);
    setSelectedImproveStyle("professional");
  };

  const handleApplyImprovement = () => {
    if (!selectedImproveStyle) return;
    const improved = getImprovedBioText(
      selectedImproveStyle,
      bio,
      professionalTitle,
      categoryLabel,
      maxChars,
    );
    onBioChange(improved);
    setAppliedBioStyle(selectedImproveStyle);
  };

  const handleAiTaglineAssist = () => {
    setShowTaglinePanel(true);
    setSelectedTaglineStyle("professional");
  };

  const handleApplyTagline = () => {
    if (!selectedTaglineStyle) return;
    const improved = getImprovedTaglineText(
      selectedTaglineStyle,
      tagLine,
      professionalTitle,
      categoryLabel,
      maxChars,
    );
    onTagLineChange(improved);
    setAppliedTaglineStyle(selectedTaglineStyle);
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
  const canUseAiBioAssist = bio.trim().length > 0;
  const canUseAiTaglineAssist = professionalTitle.trim().length > 0;

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        {/* Progress Tracker */}
        <OnboardingProgressBar currentStep={4} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />

      </div>

      <div className={shared.cardBody}>
        {/* Heading */}
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Craft your <span className={shared.accentWord}>professional identity</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          This is the first impression clients will have. Make it count.
        </p>

        {/* Split Layout */}
        <div className={styles.splitLayout}>
          {/* Left Side: Inputs */}
          <div className={styles.inputsColumn}>
            {/* Avatar Upload Container */}
            <div className={styles.photoUploadContainer}>
              <label
                htmlFor="identity-photo-upload"
                className={styles.photoAvatarWrap}
                aria-label="Upload profile photo"
              >
                <span className={styles.photoAvatarInner}>
                  {isUploadedPhoto ? (
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

            {/* Professional Title Input */}
            <div className={styles.fieldGroup}>
              <label htmlFor="title-input" className={styles.fieldLabel}>
                Professional Title
              </label>
              <input
                id="title-input"
                type="text"
                value={professionalTitle ?? ""}
                onChange={(e) => onProfessionalTitleChange(e.target.value)}
                className={styles.textField}
                placeholder="e.g. Senior Software Engineer"
                autoComplete="off"
              />
            </div>

            {/* Tag Line */}
            <div className={styles.fieldGroup}>
              <label htmlFor="tagline-input" className={styles.fieldLabel}>
                Tag Line
              </label>
              <div className={styles.textareaWrapper}>
                <textarea
                  id="tagline-input"
                  value={tagLine ?? ""}
                  onChange={(e) => onTagLineChange(e.target.value.slice(0, maxChars))}
                  className={`${styles.textareaField} ${styles.textareaWithBioFooter}`}
                  rows={3}
                  placeholder="e.g. I help startups build scalable design systems and intuitive user experiences."
                />
                <div className={styles.textareaFooterInline}>
                  <AnimatePresence>
                    {canUseAiTaglineAssist && !showTaglinePanel && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        type="button"
                        className={styles.aiBioInlineBtn}
                        onClick={handleAiTaglineAssist}
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
                    )}
                  </AnimatePresence>
                  <span className={styles.textareaFooterCounter}>
                    {tagLineCharCount}/{maxChars}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {canUseAiTaglineAssist && showTaglinePanel && (
                  <motion.div
                    ref={taglinePanelRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                    className={styles.aiImprovePanel}
                  >
                    <div className={styles.improvementChipsWrap}>
                      {IMPROVEMENT_STYLES.map((style) => {
                        const isSelected = selectedTaglineStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            className={`${styles.suggestedPill} ${
                              isSelected ? styles.suggestedPillSelected : ""
                            }`}
                            onClick={() =>
                              setSelectedTaglineStyle(isSelected ? null : style.id)
                            }
                            aria-pressed={isSelected}
                          >
                            {style.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className={styles.aiImproveHint}>
                      {selectedTaglineStyle
                        ? getImprovedTaglineText(
                            selectedTaglineStyle,
                            tagLine,
                            professionalTitle,
                            categoryLabel,
                            maxChars,
                          )
                        : "Select a tone to suggest a tagline"}
                    </p>
                    <button
                      type="button"
                      className={styles.aiApplyBtn}
                      onClick={handleApplyTagline}
                      disabled={!selectedTaglineStyle || appliedTaglineStyle === selectedTaglineStyle}
                    >
                      <ShinyText
                        text={appliedTaglineStyle === selectedTaglineStyle ? "Applied" : "Apply"}
                        speed={2.5}
                        color="#E53B17"
                        shineColor="#ffffff"
                        disabled={!selectedTaglineStyle || appliedTaglineStyle === selectedTaglineStyle}
                        className={styles.aiApplyShinyText}
                      />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Brief Introduction */}
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
                    {canUseAiBioAssist && !showImprovementPanel && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        type="button"
                        className={styles.aiBioInlineBtn}
                        onClick={handleAiBioAssist}
                      >
                        <ShinyText
                          text="Improve with Jatayu AI"
                          icon="sparkles"
                          iconSize={14}
                          speed={2.5}
                          color="#E53B17"
                          shineColor="#ffffff"
                          className={styles.aiBioShinyText}
                        />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <span className={styles.textareaFooterCounter}>
                    {introCharCount}/{maxChars}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {canUseAiBioAssist && showImprovementPanel && (
                  <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                    className={styles.aiImprovePanel}
                  >
                    <div className={styles.improvementChipsWrap}>
                      {IMPROVEMENT_STYLES.map((style) => {
                        const isSelected = selectedImproveStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            className={`${styles.suggestedPill} ${
                              isSelected ? styles.suggestedPillSelected : ""
                            }`}
                            onClick={() =>
                              setSelectedImproveStyle(isSelected ? null : style.id)
                            }
                            aria-pressed={isSelected}
                          >
                            {style.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className={styles.aiImproveHint}>
                      {selectedImproveStyle
                        ? getImprovedBioText(
                            selectedImproveStyle,
                            bio,
                            professionalTitle,
                            categoryLabel,
                            maxChars,
                          )
                        : "Select a tone to improve your introduction"}
                    </p>
                    <button
                      type="button"
                      className={styles.aiApplyBtn}
                      onClick={handleApplyImprovement}
                      disabled={!selectedImproveStyle || appliedBioStyle === selectedImproveStyle}
                    >
                      <ShinyText
                        text={appliedBioStyle === selectedImproveStyle ? "Applied" : "Apply"}
                        speed={2.5}
                        color="#E53B17"
                        shineColor="#ffffff"
                        disabled={!selectedImproveStyle || appliedBioStyle === selectedImproveStyle}
                        className={styles.aiApplyShinyText}
                      />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Right Side: Live Preview */}
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

        {/* Step 4 Footer */}
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
