"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import ExpertProfileEditor from "@/components/expert/profile/ExpertProfileEditor";
import { getExpertProfile } from "@/lib/expertStore";
import { expertSlug } from "@/lib/experts";
import styles from "./ExpertProfilePage.module.css";

export default function ExpertProfilePage() {
  const [profileName, setProfileName] = useState("Aditya Dhar");

  useEffect(() => {
    const profile = getExpertProfile();
    if (profile?.name) {
      setProfileName(profile.name);
    }
    const onProfileUpdate = () => {
      const updated = getExpertProfile();
      if (updated?.name) setProfileName(updated.name);
    };
    window.addEventListener("expert-profile-updated", onProfileUpdate);
    return () => window.removeEventListener("expert-profile-updated", onProfileUpdate);
  }, []);

  const publicProfileSlug = expertSlug(profileName || "aditya-dhar");
  const publicProfileHref = `/expert/${publicProfileSlug}`;

  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <h1 className={styles.pageTitle}>
              Your <span className={styles.accentWord}>Profile</span>
            </h1>
            <div className={styles.headerActions}>
              <Link
                href={publicProfileHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.viewPublicProfileBtn}
                title="Open your live public profile"
              >
                <ExternalLink size={14} />
                View Public Profile
              </Link>
              <button
                type="button"
                onClick={() => window.location.assign("/login")}
                className={styles.logoutBtn}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
          <p className={styles.pageSubtitle}>
            Complete view of your expert onboarding application, consultation settings, credentials, and public presence.
          </p>
        </header>

        <ExpertProfileEditor />
      </div>
    </section>
  );
}
