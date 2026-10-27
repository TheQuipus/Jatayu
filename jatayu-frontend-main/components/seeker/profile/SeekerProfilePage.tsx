"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Plus, Check, LogOut } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  fetchSeekerProfileData,
  getStoredSeekerProfile,
  saveStoredSeekerProfile,
  type SeekerProfileData,
} from "@/lib/seekerProfileApi";
import { updateSeekerOnboarding } from "@/lib/api";
import { isValidSeekerPhone, normalizeSeekerPhone } from "@/lib/seekerPhone";
import { getNameValidationError } from "@/lib/nameValidation";
import { mapBackendSeekerToProfile } from "@/lib/seekerProfileApi";
import { clearSeekerAuthSession } from "@/lib/seekerAuth";
import styles from "./SeekerProfilePage.module.css";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function SeekerProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<SeekerProfileData>({
    name: "",
    avatar: "/assets/img/avatar1.png",
    category: "",
    email: "",
    phone: "",
  });
  const [photoError, setPhotoError] = useState("");
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const stored = getStoredSeekerProfile();
    setProfile(stored);

    void fetchSeekerProfileData()
      .then(setProfile)
      .catch(() => {});
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

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Image must be 5MB or smaller.");
      return;
    }

    setPhotoError("");
    setProfilePhotoFile(file);
    if (profile.avatar.startsWith("blob:")) {
      URL.revokeObjectURL(profile.avatar);
    }
    const newAvatar = URL.createObjectURL(file);
    setSaved(false);
    setProfile((prev) => ({ ...prev, avatar: newAvatar }));
  };

  const handleSave = async () => {
    setProfileError("");
    const nameError = getNameValidationError(profile.name);
    if (nameError) {
      setProfileError(`Enter a valid name. ${nameError}.`);
      return;
    }
    const phone = normalizeSeekerPhone(profile.phone || "");
    if (phone && !isValidSeekerPhone(phone)) {
      setProfileError("Enter a valid 10-digit phone number.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateSeekerOnboarding({
        fullName: profile.name.trim(),
        category: profile.category?.trim() || "",
        phone,
      }, profilePhotoFile || undefined);
      const savedProfile = mapBackendSeekerToProfile(
        response.seeker as Parameters<typeof mapBackendSeekerToProfile>[0],
      );
      saveStoredSeekerProfile(savedProfile);
      setProfile(savedProfile);
      setProfilePhotoFile(null);
      setSaved(true);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to save your profile.");
      setSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearSeekerAuthSession();
    window.location.assign("/login");
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <h1 className={styles.pageTitle}>
              Your <span className={styles.accentWord}>Profile</span>
            </h1>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              type="button"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
          <p className={styles.pageSubtitle}>
            Manage your account settings, contact info, and preferences.
          </p>
        </header>

        <div className={styles.card}>
          <div className={styles.photoUploadContainer}>
            <label
              htmlFor="seeker-photo-upload"
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
              id="seeker-photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.hiddenFileInput}
              onChange={handlePhotoChange}
            />
            <div className={styles.photoUploadInfo}>
              <h3 className={styles.photoUploadTitle}>Profile Photo</h3>
              <p className={`${styles.photoUploadDesc} ${photoError ? styles.photoUploadDescError : ""}`}>
                {photoError || "Clear photo. Max 5MB."}
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="seeker-name" className={styles.fieldLabel}>
                Full Name
              </label>
              <input
                id="seeker-name"
                type="text"
                value={profile.name}
                onChange={(e) => {
                  setSaved(false);
                  setProfile((prev) => ({ ...prev, name: e.target.value }));
                }}
                className={styles.textField}
                placeholder="e.g. Priya Sharma"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="seeker-category" className={styles.fieldLabel}>
                Interested Field / Category
              </label>
              <input
                id="seeker-category"
                type="text"
                value={profile.category || ""}
                onChange={(e) => {
                  setSaved(false);
                  setProfile((prev) => ({ ...prev, category: e.target.value }));
                }}
                className={styles.textField}
                placeholder="e.g. Technology, Career"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="seeker-email" className={styles.fieldLabel}>
                Email Address
              </label>
              <input
                id="seeker-email"
                type="email"
                value={profile.email || ""}
                readOnly
                aria-describedby="seeker-email-help"
                className={styles.textField}
              />
              <span id="seeker-email-help" className={styles.photoUploadDesc}>
                Contact support to change your email address.
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="seeker-phone" className={styles.fieldLabel}>
                Phone Number
              </label>
              <input
                id="seeker-phone"
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => {
                  setSaved(false);
                  setProfileError("");
                  setProfile((prev) => ({ ...prev, phone: e.target.value }));
                }}
                className={styles.textField}
                placeholder="e.g. +91 9898675444"
              />
            </div>
          </div>

          <div className={styles.actions}>
            <PrimaryButton
              type="button"
              label={
                saved ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Check size={16} /> Profile Saved
                  </span>
                ) : isSaving ? (
                  "Saving..."
                ) : (
                  "Save Changes"
                )
              }
              variant={saved ? "light" : "orange"}
              staticLabel={true}
              onClick={() => void handleSave()}
              disabled={isSaving}
            />
            {profileError ? <p className={styles.photoUploadDescError} role="alert">{profileError}</p> : null}
            {saved ? <p className={styles.savedNote}>Your profile updates have been saved.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
