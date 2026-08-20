"use client";

import React, { useState } from "react";
import styles from "./MockGoogleLoginModal.module.css";
import { User, Mail, X } from "lucide-react";

interface MockProfile {
  name: string;
  email: string;
  googleId: string;
  avatar: string;
}

const MOCK_PROFILES: MockProfile[] = [
  {
    name: "Sarang Afle",
    email: "sarangafle@gmail.com",
    googleId: "google-mock-sarang",
    avatar: "/assets/img/manportrait.png",
  },
  {
    name: "Aryan Singh",
    email: "aryan.singh@gmail.com",
    googleId: "google-mock-aryan",
    avatar: "/assets/img/manportrait.png",
  },
  {
    name: "Google Expert",
    email: "google-expert@example.com",
    googleId: "google-mock-expert",
    avatar: "/assets/img/manportrait.png",
  },
];

interface MockGoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (profile: { email: string; fullName: string; googleId: string }) => void;
}

export default function MockGoogleLoginModal({
  isOpen,
  onClose,
  onSelect,
}: MockGoogleLoginModalProps) {
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    const googleId = "google-mock-" + customEmail.replace(/[^a-zA-Z0-9]/g, "");
    onSelect({
      fullName: customName.trim(),
      email: customEmail.trim(),
      googleId,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Google Login Simulation</h3>
            <p className={styles.subtitle}>Development / Demo Mode (No client ID configured)</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.profilesSection}>
            <p className={styles.sectionTitle}>Select a demo Google account:</p>
            <div className={styles.profilesGrid}>
              {MOCK_PROFILES.map((profile) => (
                <button
                  key={profile.email}
                  className={styles.profileCard}
                  onClick={() =>
                    onSelect({
                      fullName: profile.name,
                      email: profile.email,
                      googleId: profile.googleId,
                    })
                  }
                >
                  <div className={styles.profileAvatar}>
                    <img src={profile.avatar} alt={profile.name} />
                  </div>
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>{profile.name}</span>
                    <span className={styles.profileEmail}>{profile.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>OR SIGN IN WITH CUSTOM DETAIL</span>
            <span className={styles.dividerLine} />
          </div>

          <form className={styles.form} onSubmit={handleCustomSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.icon} />
                <input
                  type="text"
                  placeholder="John Doe"
                  className={styles.input}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.icon} />
                <input
                  type="email"
                  placeholder="john.doe@gmail.com"
                  className={styles.input}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!customName.trim() || !customEmail.trim()}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
