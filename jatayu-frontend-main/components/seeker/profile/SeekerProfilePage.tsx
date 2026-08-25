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
    const newAvatar = URL.createObjectURL(file);
    setSaved(false);
    setProfile((prev) => ({ ...prev, avatar: newAvatar }));
  };

  const handleSave = () => {
    saveStoredSeekerProfile(profile);
    setSaved(true);
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
              accept="image/jpeg,image/png,image/webp,image/gif"
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
                onChange={(e) => {
                  setSaved(false);
                  setProfile((prev) => ({ ...prev, email: e.target.value }));
                }}
                className={styles.textField}
                placeholder="e.g. name@example.com"
              />
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
                ) : (
                  "Save Changes"
                )
              }
              variant={saved ? "light" : "orange"}
              staticLabel={true}
              onClick={handleSave}
            />
            {saved ? <p className={styles.savedNote}>Your profile updates have been saved.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
