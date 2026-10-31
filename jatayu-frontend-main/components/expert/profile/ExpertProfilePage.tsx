import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import ExpertProfileEditor from "@/components/expert/profile/ExpertProfileEditor";
import ExpertProfileView from "@/components/expert/profile/ExpertProfileView";
import { EXPERT_PROFILE_EDIT_HREF, EXPERT_PROFILE_HREF } from "@/lib/expertDashboard";
import styles from "./ExpertProfilePage.module.css";

export default function ExpertProfilePage({ isEditing = false }: { isEditing?: boolean }) {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <h1 className={styles.pageTitle}>
              Your <span className={styles.accentWord}>{isEditing ? "Edit Profile" : "Profile"}</span>
            </h1>
            <Link
              href={isEditing ? EXPERT_PROFILE_HREF : EXPERT_PROFILE_EDIT_HREF}
              className={styles.profileAction}
            >
              {isEditing ? <><ArrowLeft size={16} /> View Profile</> : <><Pencil size={16} /> Edit Profile</>}
            </Link>
          </div>
          <p className={styles.pageSubtitle}>
            {isEditing
              ? "Update your saved profile information and consultation settings."
              : "Review your saved expert profile, skills, experience, and consultation preferences."}
          </p>
        </header>

        {isEditing ? <ExpertProfileEditor /> : <ExpertProfileView />}
      </div>
    </section>
  );
}
