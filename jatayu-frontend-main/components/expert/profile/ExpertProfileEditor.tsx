"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ShinyText from "@/components/ui/ShinyText";
import {
  DEFAULT_EXPERT_PROFILE,
  EXPERIENCE_LABELS,
  isExpertProfileValid,
  type ExpertProfileData,
  type ExperienceLevel,
} from "@/lib/expertProfile";
import { getExpertProfile, saveExpertProfile } from "@/lib/expertStore";
import { fetchExpertProfileData, saveExpertProfileData } from "@/lib/expertProfileApi";
import styles from "./ExpertProfileEditor.module.css";

const MAX_CHARS = 160;
const MAX_SKILLS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type ExpertProfileEditorProps = {
  initialProfile?: ExpertProfileData;
};

export default function ExpertProfileEditor({
  initialProfile = DEFAULT_EXPERT_PROFILE,
}: ExpertProfileEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ExpertProfileData>(initialProfile);
  const [photoError, setPhotoError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    void fetchExpertProfileData()
      .then(setProfile)
      .catch(() => setProfile(getExpertProfile()));
  }, []);

  const isUploadedPhoto =
    profile.avatar.startsWith("blob:") || profile.avatar.startsWith("data:");

  useEffect(() => {
    return () => {
      if (profile.avatar.startsWith("blob:")) {
        URL.revokeObjectURL(profile.avatar);
      }
    };
  }, [profile.avatar]);

  const updateProfile = <K extends keyof ExpertProfileData>(key: K, value: ExpertProfileData[K]) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be 5MB or smaller.");
      return;
    }

    setPhotoError("");
    if (profile.avatar.startsWith("blob:")) {
      URL.revokeObjectURL(profile.avatar);
    }
    setPhotoFile(file);
    updateProfile("avatar", URL.createObjectURL(file));
  };

  const handleAiBioAssist = async () => {
    setIsGeneratingBio(true);

    const role = profile.role.trim() || "professional";
    const category = profile.category.trim() || "my field";
    const draft = `I'm a ${role} with deep expertise in ${category}. I help clients cut through complexity with clear, actionable guidance rooted in real-world experience.`;

    await new Promise((resolve) => setTimeout(resolve, 600));
    updateProfile("bio", draft.slice(0, MAX_CHARS));
    setIsGeneratingBio(false);
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || profile.skills.length >= MAX_SKILLS) return;
    if (profile.skills.some((skill) => skill.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      return;
    }
    updateProfile("skills", [...profile.skills, trimmed]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    updateProfile(
      "skills",
      profile.skills.filter((item) => item !== skill),
    );
  };

  const canSave = isExpertProfileValid(profile);

  return (
    <div className={styles.editor}>
      <div className={styles.inputsColumn}>
          <div className={styles.photoUploadContainer}>
            <label
              htmlFor="profile-photo-upload"
              className={styles.photoAvatarWrap}
              aria-label="Upload profile photo"
            >
              <span className={styles.photoAvatarInner}>
                {isUploadedPhoto ? (
                  <img src={profile.avatar} alt="" className={styles.photoAvatar} />
                ) : (
                  <Image
                    src={profile.avatar}
                    alt=""
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
              id="profile-photo-upload"
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
            <label htmlFor="profile-name" className={styles.fieldLabel}>
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={profile.name}
              onChange={(event) => updateProfile("name", event.target.value)}
              className={styles.textField}
              autoComplete="name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-title" className={styles.fieldLabel}>
              Professional Title
            </label>
            <input
              id="profile-title"
              type="text"
              value={profile.role}
              onChange={(event) => updateProfile("role", event.target.value)}
              className={styles.textField}
              placeholder="e.g. UX Strategy Expert"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-category" className={styles.fieldLabel}>
              Category
            </label>
            <input
              id="profile-category"
              type="text"
              value={profile.category}
              onChange={(event) => updateProfile("category", event.target.value)}
              className={styles.textField}
              placeholder="e.g. Product Design"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-experience" className={styles.fieldLabel}>
              Experience Level
            </label>
            <select
              id="profile-experience"
              value={profile.experienceLevel}
              onChange={(event) =>
                updateProfile("experienceLevel", event.target.value as ExperienceLevel)
              }
              className={styles.selectField}
            >
              {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((level) => (
                <option key={level} value={level}>
                  {EXPERIENCE_LABELS[level]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-tagline" className={styles.fieldLabel}>
              Tag Line
            </label>
            <div className={styles.textareaWrapper}>
              <textarea
                id="profile-tagline"
                value={profile.tagLine}
                onChange={(event) =>
                  updateProfile("tagLine", event.target.value.slice(0, MAX_CHARS))
                }
                className={`${styles.textareaField} ${styles.textareaWithInlineCounter}`}
                rows={3}
                placeholder="A short hook that appears on your public profile."
              />
              <span className={styles.textareaCounterInline}>
                {profile.tagLine.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="profile-bio" className={styles.fieldLabel}>
                Brief Introduction
              </label>
              <span className={styles.charCounter}>
                {profile.bio.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              id="profile-bio"
              value={profile.bio}
              onChange={(event) => updateProfile("bio", event.target.value.slice(0, MAX_CHARS))}
              className={styles.textareaField}
              rows={4}
              placeholder="Tell clients about your background and how you help."
            />
            <button
              type="button"
              className={styles.aiBioBtn}
              onClick={handleAiBioAssist}
              disabled={isGeneratingBio || !profile.role.trim()}
            >
              {isGeneratingBio ? (
                <span className={styles.aiBioLoadingText}>Writing...</span>
              ) : (
                <ShinyText
                  text="AI Assisted bio writing"
                  icon="sparkles"
                  iconSize={14}
                  speed={2.5}
                  color="#E53B17"
                  shineColor="#ffffff"
                  disabled={!profile.role.trim()}
                  className={styles.aiBioShinyText}
                />
              )}
            </button>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-skills" className={styles.fieldLabel}>
              Skills ({profile.skills.length}/{MAX_SKILLS})
            </label>
            <div className={styles.skillInputRow}>
              <input
                id="profile-skills"
                type="text"
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSkill();
                  }
                }}
                className={styles.textField}
                placeholder="Add a skill and press Enter"
                disabled={profile.skills.length >= MAX_SKILLS}
              />
              <button
                type="button"
                className={styles.addSkillBtn}
                onClick={handleAddSkill}
                disabled={!skillInput.trim() || profile.skills.length >= MAX_SKILLS}
              >
                Add
              </button>
            </div>
            <ul className={styles.skillList}>
              {profile.skills.map((skill) => (
                <li key={skill} className={styles.skillPill}>
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-languages" className={styles.fieldLabel}>
                Languages
              </label>
              <input
                id="profile-languages"
                type="text"
                value={profile.languages.join(", ")}
                onChange={(event) =>
                  updateProfile(
                    "languages",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
                className={styles.textField}
                placeholder="English, Hindi"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="profile-location" className={styles.fieldLabel}>
                Location
              </label>
              <input
                id="profile-location"
                type="text"
                value={profile.location}
                onChange={(event) => updateProfile("location", event.target.value)}
                className={styles.textField}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <PrimaryButton
              type="button"
              label={
                saved ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Check size={16} /> Changes Saved
                  </span>
                ) : (
                  "Save Profile"
                )
              }
              variant={saved ? "light" : "orange"}
              disabled={!canSave || isSaving}
              staticLabel={true}
              onClick={async () => {
                setIsSaving(true);
                setSaveError(null);
                try {
                  await saveExpertProfileData(profile, photoFile);
                  setPhotoFile(null);
                  setSaved(true);
                } catch (error) {
                  setSaveError(error instanceof Error ? error.message : "Could not save profile.");
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            {saveError ? <p className={styles.savedNote}>{saveError}</p> : null}
            {saved ? <p className={styles.savedNote}>Your profile updates are ready to publish.</p> : null}
          </div>
      </div>
    </div>
  );
}
