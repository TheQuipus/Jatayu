"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertCard from "@/components/ui/ExpertCard";
import { type Expert } from "@/lib/experts";
import shared from "./onboarding.shared.module.css";
import styles from "./PersonalisationStep.module.css";
import register from "./register.shared.module.css";
export function isPersonalisationFormComplete(selectedLanguages: string[]): boolean {
  return selectedLanguages.length > 0;
}

type PersonalisationStepProps = {
  userName: string;
  categoryLabel: string;
  needsText: string;
  profilePhotoSrc: string;
  onProfilePhotoChange: (src: string) => void;
  selectedLanguages: string[];
  onSelectedLanguagesChange: (val: string[]) => void;
  location: string;
  onChangeLocation: (val: string) => void;
  additionalContext: string;
  onChangeAdditionalContext: (val: string) => void;
  onBack: () => void;
  onContinue: () => void;
  progressCompletion: ProgressCompletion;
  onProgressStepClick: (step: ProgressStepKey) => void;
};

const profileLanguageOptions = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "bengali", label: "Bengali" },
  { id: "marathi", label: "Marathi" },
  { id: "telugu", label: "Telugu" },
  { id: "tamil", label: "Tamil" },
  { id: "gujarati", label: "Gujarati" },
  { id: "kannada", label: "Kannada" },
  { id: "malayalam", label: "Malayalam" },
  { id: "odia", label: "Odia" },
  { id: "punjabi", label: "Punjabi" },
] as const;

export default function PersonalisationStep({
  userName,
  categoryLabel,
  needsText,
  profilePhotoSrc,
  onProfilePhotoChange,
  selectedLanguages,
  onSelectedLanguagesChange,
  location,
  onChangeLocation,
  additionalContext,
  onChangeAdditionalContext,
  onBack,
  onContinue,
  progressCompletion,
  onProgressStepClick,
}: PersonalisationStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customLanguageInputRef = useRef<HTMLInputElement>(null);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [photoError, setPhotoError] = useState("");
  const presetLanguageIds: Set<string> = new Set(profileLanguageOptions.map((lang) => lang.id));

  const [customLanguages, setCustomLanguages] = useState<string[]>(() =>
    selectedLanguages.filter((lang) => !presetLanguageIds.has(lang))
  );
  const maxPhotoBytes = 5 * 1024 * 1024;
  const isUploadedPhoto =
    profilePhotoSrc.startsWith("blob:") || profilePhotoSrc.startsWith("data:");
  const previewLanguages = selectedLanguages.map((langId) => {
    const preset = profileLanguageOptions.find((lang) => lang.id === langId);
    return preset?.label ?? langId;
  });
  const previewExpert: Expert = {
    name: userName.trim() || "Your Name",
    role: location.trim() || "Seeker",
    desc:
      needsText.trim() ||
      "Describe your challenge so experts know how to help you best.",
    image: profilePhotoSrc,
    category: categoryLabel.trim() || "Domain not selected",
    topics: [],
    languages: previewLanguages.length > 0 ? previewLanguages : ["Add languages"],
    price: 0,
    rating: 0,
    replyTime: "—",
  };
  const previewStatsText = location.trim()
    ? `Based in ${location.trim()}`
    : "Add your location to complete your profile";
  const canContinue = selectedLanguages.length > 0;

  useEffect(() => {
    return () => {
      if (profilePhotoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(profilePhotoSrc);
      }
    };
  }, [profilePhotoSrc]);

  const handleToggleLanguage = (id: string) => {
    if (selectedLanguages.includes(id)) {
      onSelectedLanguagesChange(selectedLanguages.filter((langId) => langId !== id));
      return;
    }
    onSelectedLanguagesChange([...selectedLanguages, id]);
  };

  const handleAddCustomLanguage = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNewLanguage("");
      setShowAddLanguage(false);
      return;
    }

    const normalized = trimmed.toLowerCase();
    const matchedPreset = profileLanguageOptions.find(
      (lang) => lang.id === normalized || lang.label.toLowerCase() === normalized,
    );

    if (matchedPreset) {
      if (!selectedLanguages.includes(matchedPreset.id)) {
        onSelectedLanguagesChange([...selectedLanguages, matchedPreset.id]);
      }
    } else {
      const existingCustom = customLanguages.find(
        (l) => l.toLowerCase() === trimmed.toLowerCase()
      );
      const customVal = existingCustom ?? trimmed;

      if (!customLanguages.some((l) => l.toLowerCase() === customVal.toLowerCase())) {
        setCustomLanguages((prev) => [...prev, customVal]);
      }
      if (!selectedLanguages.some((l) => l.toLowerCase() === customVal.toLowerCase())) {
        onSelectedLanguagesChange([...selectedLanguages, customVal]);
      }
    }

    setNewLanguage("");
    setShowAddLanguage(false);
  };

  const handleCustomLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCustomLanguage(newLanguage);
  };

  const handleCustomLanguageBlur = () => {
    handleAddCustomLanguage(newLanguage);
  };

  const handleRemoveCustomLanguage = (lang: string) => {
    setCustomLanguages((prev) => prev.filter((l) => l !== lang));
    onSelectedLanguagesChange(selectedLanguages.filter((l) => l !== lang));
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

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <MatchingProgress
          currentStep="personalisation"
          completion={progressCompletion}
          onStepClick={onProgressStepClick}
        />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Tell us a <span className={shared.accentWord}>bit about yourself</span>
        </h1>

        <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
          A few quick details help us fine-tune your expert match for the best possible connection.
        </p>

        <div className={styles.formContainer}>
          <div className={styles.splitLayout}>
            <div className={styles.formInputsColumn}>
              <div className={styles.photoUploadContainer}>
                <label
                  htmlFor="seeker-profile-photo-upload"
                  className={styles.photoAvatarWrap}
                  aria-label="Upload profile photo"
                >
                  <span className={styles.photoAvatarInner}>
                    {isUploadedPhoto ? (
                      <img
                        src={profilePhotoSrc}
                        alt="Seeker profile"
                        className={styles.photoAvatar}
                      />
                    ) : (
                      <Image
                        src={profilePhotoSrc}
                        alt="Seeker profile"
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
                  id="seeker-profile-photo-upload"
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
                <label className={styles.fieldLabel}>Languages you speak</label>
                <div className={styles.profileLanguagesRow}>
                  {profileLanguageOptions.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.id);
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleToggleLanguage(lang.id)}
                        className={`${styles.profileLanguagePill} ${isSelected ? styles.profileLanguagePillSelected : ""}`}
                        aria-pressed={isSelected}
                      >
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                  {customLanguages.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <div
                        key={lang}
                        className={`${styles.profileLanguagePill} ${styles.profileLanguagePillRemovable} ${
                          isSelected ? styles.profileLanguagePillSelected : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleLanguage(lang)}
                          className={styles.profileLanguagePillMain}
                        >
                          <span>{lang}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.profileLanguageRemoveBtn}
                          aria-label={`Remove ${lang}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomLanguage(lang);
                          }}
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}

                  {showAddLanguage ? (
                    <div className={`${styles.profileLanguagePill} ${styles.profileLanguagePillInput}`}>
                      <form onSubmit={handleCustomLanguageSubmit} className={styles.profileLanguageInputForm}>
                        <input
                          ref={customLanguageInputRef}
                          type="text"
                          className={styles.profileLanguageInlineInput}
                          placeholder="Enter custom language..."
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          onBlur={handleCustomLanguageBlur}
                          autoFocus
                          aria-label="Custom language"
                        />
                        <button
                          type="submit"
                          className={styles.profileLanguageAddBtn}
                          onMouseDown={(e) => e.preventDefault()}
                          aria-label="Add custom language"
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddLanguage(true)}
                      className={styles.profileLanguagePill}
                    >
                      <Plus size={14} aria-hidden="true" />
                      <span>Add custom</span>
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="location">
                  Where are you based? <span className={styles.optionalText}>(optional)</span>
                </label>
                <div className={register.inputWithIconWrap}>
                  <input
                    id="location"
                    type="text"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => onChangeLocation(e.target.value)}
                    className={register.textFieldWithIcon}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="additionalContext">
                  Any additional context <span className={styles.optionalText}>(optional)</span>
                </label>
                <div className={register.textareaWrap}>
                  <textarea
                    id="additionalContext"
                    placeholder="Anything else you want your expert to know?"
                    value={additionalContext}
                    onChange={(e) => onChangeAdditionalContext(e.target.value)}
                    className={`${register.textareaField} ${styles.additionalContextTextarea}`}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className={styles.previewColumn}>
              <div className={styles.expertCardWrapper}>
                <ExpertCard
                  expert={previewExpert}
                  linkToDetail={false}
                  disableHover
                  showCategoryBadge={true}
                  statsText={previewStatsText}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Guide Advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Almost matched!</strong>
            <small>Personalizing matches ensures much more alignment.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button
            type="button"
            className={shared.textBtn}
            onClick={onBack}
          >
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
