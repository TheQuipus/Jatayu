"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./IdentityStep.module.css";

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
  const [photoError, setPhotoError] = useState("");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

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

  const handleAiBioAssist = async () => {
    setIsGeneratingBio(true);

    const role = professionalTitle.trim() || "professional";
    const category = categoryLabel.trim() || "my field";
    const draft = `I'm a ${role} with deep expertise in ${category}. I help clients cut through complexity with clear, actionable guidance rooted in real-world experience.`;

    await new Promise((resolve) => setTimeout(resolve, 600));
    onBioChange(draft.slice(0, maxChars));
    setIsGeneratingBio(false);
  };

  const previewName = userName.trim() || "Your Name";
  const previewTitle = professionalTitle.trim() || "Professional Title";
  const previewTagline = tagLine.trim() || "Your tag line appears here.";
  const previewIntro =
    bio.trim() ||
    "Your professional bio will appear here. A compelling bio dramatically increases your chances of matching with the right clients.";
  const previewTags = selectedSkills.slice(0, 2);

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={shared.stepPill}>
          <span>Step 4 of 9 - Identity</span>
        </div>
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
                value={professionalTitle}
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
                value={tagLine}
                onChange={(e) => onTagLineChange(e.target.value.slice(0, maxChars))}
                className={`${styles.textareaField} ${styles.textareaWithInlineCounter}`}
                rows={3}
                placeholder="e.g. I help startups build scalable design systems and intuitive user experiences."
              />
              <span className={styles.textareaCounterInline}>
                {tagLineCharCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Brief Introduction */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="intro-input" className={styles.fieldLabel}>
                Brief Introduction
              </label>
              <span className={styles.charCounter}>
                {introCharCount}/{maxChars} characters
              </span>
            </div>
            <textarea
              id="intro-input"
              value={bio}
              onChange={(e) => onBioChange(e.target.value.slice(0, maxChars))}
              className={styles.textareaField}
              rows={4}
              placeholder="e.g. I'm a product leader with 8+ years guiding teams through complex launches. I focus on clarity, user research, and shipping work that moves the needle."
            />
            <button
              type="button"
              className={styles.aiBioBtn}
              onClick={handleAiBioAssist}
              disabled={isGeneratingBio}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>{isGeneratingBio ? "Writing..." : "AI Assisted bio writing"}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className={styles.previewColumn}>
          <span className={styles.livePreviewLabel}>Live Preview</span>
          <div className={styles.previewCard}>
            <div className={styles.previewCardInner}>
              <div className={styles.previewAvatarWrap}>
                {isUploadedPhoto ? (
                  <img
                    src={profilePhotoSrc}
                    alt=""
                    className={styles.previewAvatar}
                  />
                ) : (
                  <Image
                    src={profilePhotoSrc}
                    alt=""
                    width={72}
                    height={72}
                    className={styles.previewAvatar}
                  />
                )}
              </div>

              <h3 className={styles.previewName}>{previewName}</h3>
              <p className={styles.previewTitle}>{previewTitle}</p>
              <p className={`${styles.previewTagline} ${!tagLine.trim() ? styles.previewPlaceholder : ""}`}>
                {previewTagline}
              </p>

              <div className={styles.previewDivider} />

              <p className={`${styles.previewIntro} ${!bio.trim() ? styles.previewPlaceholder : ""}`}>
                {previewIntro}
              </p>

              {previewTags.length > 0 && (
                <div className={styles.previewTags}>
                  {previewTags.map((skill) => (
                    <span key={skill} className={styles.previewTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
            disabled={!canContinue}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
