"use client";

import Image from "next/image";
import {
  Briefcase,
  Globe,
  MapPin,
  MessageSquare,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import styles from "./EditProfileView.module.css";

type EditProfileViewProps = {
  user: ExpertUser | SeekerUser;
  isExpert: boolean;
};

export default function EditProfileView({ user, isExpert }: EditProfileViewProps) {
  const expertUser = isExpert ? (user as ExpertUser) : undefined;
  const seekerUser = !isExpert ? (user as SeekerUser) : undefined;

  const fullName = user?.name || "User";
  const avatar = user?.avatar || "/assets/img/manportrait.png";
  const email = user?.email || "user@example.com";
  const phone = user?.phone || "+91 98765 43210";
  const joinedDate = user?.joinedDate || "Jan 2025";

  if (!isExpert && seekerUser) {
    const category = seekerUser.category || seekerUser.preferredCategory || "Career & Work";
    const needsSubject = seekerUser.needsSubject || "Strategic Mentorship & Guidance";
    const needsText = seekerUser.needsText || "Looking for actionable domain guidance, structured advice, and strategic mentorship.";
    const formats = seekerUser.formats && seekerUser.formats.length > 0
      ? seekerUser.formats
      : ["1:1 Video Call", "Text Messaging"];
    const budgetTier = seekerUser.budgetTier || "Standard";
    const budgetRange = seekerUser.budgetRange || "₹2,500–₹8,000/min";
    const languages = seekerUser.languages && seekerUser.languages.length > 0
      ? seekerUser.languages
      : ["English", "Hindi"];
    const city = seekerUser.city || "Mumbai";
    const location = seekerUser.location || `${city}, India`;
    const profileBio = seekerUser.profileBio || seekerUser.needsText || "Active seeker looking for verified domain expert consultations.";
    const onboardingComplete = seekerUser.onboardingComplete !== false;

    return (
      <div className={styles.profileMgmtView}>
        {/* Header Row */}
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.pageTitle}>Seeker Profile Information</h2>
            <p className={styles.pageSubtitle}>
              Verified sign-up credentials and onboarding matching requirements
            </p>
          </div>
        </div>

        <div className={styles.sectionsContainer}>
          {/* Sign-Up & Account Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                  <User size={20} />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>Sign-Up &amp; Account Information</h4>
                  <p className={styles.cardSubtitle}>Verified credentials and account registration profile</p>
                </div>
              </div>
            </div>

            {/* Profile Identity Bar */}
            <div className={styles.profileIdentityRow}>
              <Image
                src={avatar}
                alt={fullName}
                width={56}
                height={56}
                className={styles.profileAvatar}
              />
              <div className={styles.profileIdentityDetails}>
                <h3 className={styles.profileFullName}>{fullName}</h3>
                <div className={styles.profileIdMeta}>
                  <span>Seeker ID: <strong>{seekerUser.id}</strong></span>
                  <span>•</span>
                  <span>Member since <strong>{joinedDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Account Credentials */}
            <div className={styles.formGrid2Col}>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Email Address</span>
                <div className={styles.readOnlyFieldWrap}>
                  <span className={styles.fieldValue}>{email}</span>
                  <span className={styles.verifiedTag}>Verified</span>
                </div>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Phone Number</span>
                <div className={styles.readOnlyFieldWrap}>
                  <span className={styles.fieldValue}>{phone}</span>
                  <span className={styles.verifiedTag}>Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Domain / Category Selection */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap} style={{ background: "rgba(233, 104, 30, 0.1)", color: "var(--tango)" }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>Domain &amp; Category Selection</h4>
                  <p className={styles.cardSubtitle}>Primary consultation domain selected by the seeker</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Selected Category / Domain</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue} style={{ fontWeight: 700, fontSize: "15px" }}>
                  {category}
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Consultation Needs & Goals */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap} style={{ background: "rgba(233, 104, 30, 0.1)", color: "var(--tango)" }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>Consultation Needs &amp; Goals</h4>
                  <p className={styles.cardSubtitle}>Problem statement, primary focus, and desired outcomes</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Primary Focus / Consultation Subject</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue} style={{ fontWeight: 600 }}>
                  {needsSubject}
                </span>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Detailed Situation &amp; Needs Description</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{needsText}</span>
              </div>
            </div>
          </div>

          {/* Step 3: Consultation Format */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap} style={{ background: "rgba(233, 104, 30, 0.1)", color: "var(--tango)" }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>Preferred Consultation Formats</h4>
                  <p className={styles.cardSubtitle}>Session delivery channels and interaction preferences</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Selected Formats</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>
                  {formats.join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Step 4: Budget Range */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap} style={{ background: "rgba(233, 104, 30, 0.1)", color: "var(--tango)" }}>
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>Budget &amp; Rate Preference</h4>
                  <p className={styles.cardSubtitle}>Comfort tier and rate range specified during onboarding</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Budget Comfort Tier &amp; Rate Range</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue} style={{ fontWeight: 600 }}>
                  {budgetTier} ({budgetRange})
                </span>
              </div>
            </div>
          </div>

          {/* Step 5: Personalisation & Matching Preferences */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap} style={{ background: "rgba(233, 104, 30, 0.1)", color: "var(--tango)" }}>
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className={styles.cardTitle}>Personalisation &amp; Preferences</h4>
                  <p className={styles.cardSubtitle}>Location, languages, and profile bio summary</p>
                </div>
              </div>
            </div>

            <div className={styles.formGrid2Col}>
              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Location &amp; City</span>
                <div className={styles.readOnlyFieldWrap}>
                  <span className={styles.fieldValue}>{location}</span>
                </div>
              </div>

              <div className={styles.fieldItem}>
                <span className={styles.fieldLabel}>Preferred Consultation Languages</span>
                <div className={styles.readOnlyFieldWrap}>
                  <span className={styles.fieldValue}>
                    {languages.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Profile Bio / Background Summary</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{profileBio}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for Expert
  return (
    <div className={styles.profileMgmtView}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.pageTitle}>Expert Profile Information</h2>
          <p className={styles.pageSubtitle}>
            Verified sign-up and professional credentials
          </p>
        </div>
      </div>

      <div className={styles.sectionsContainer}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconWrap} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
                <User size={20} />
              </div>
              <div>
                <h4 className={styles.cardTitle}>Sign-Up &amp; Account Information</h4>
                <p className={styles.cardSubtitle}>Verified credentials and expert registration profile</p>
              </div>
            </div>
          </div>

          {/* Profile Identity Bar */}
          <div className={styles.profileIdentityRow}>
            <Image
              src={avatar}
              alt={fullName}
              width={56}
              height={56}
              className={styles.profileAvatar}
            />
            <div className={styles.profileIdentityDetails}>
              <h3 className={styles.profileFullName}>{fullName}</h3>
              <div className={styles.profileIdMeta}>
                <span>Expert ID: <strong>{expertUser?.id || "N/A"}</strong></span>
                <span>•</span>
                <span>Member since <strong>{joinedDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div className={styles.formGrid2Col}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Email Address</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{email}</span>
                <span className={styles.verifiedTag}>Verified</span>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Phone Number</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{phone}</span>
                <span className={styles.verifiedTag}>Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap} style={{ background: "rgba(233, 104, 30, 0.1)", color: "var(--tango)" }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h4 className={styles.cardTitle}>Professional Specialization &amp; Bio</h4>
              <p className={styles.cardSubtitle}>Expertise and background details</p>
            </div>
          </div>

          <div className={styles.formGrid2Col}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Category</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{expertUser?.category || "N/A"}</span>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Sub-Category</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{expertUser?.subCategory || "N/A"}</span>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Location</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>{expertUser?.location || expertUser?.city || "N/A"}</span>
              </div>
            </div>

            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>Hourly Rate</span>
              <div className={styles.readOnlyFieldWrap}>
                <span className={styles.fieldValue}>₹{expertUser?.hourlyRate ? expertUser.hourlyRate.toLocaleString("en-IN") : 0}/hr</span>
              </div>
            </div>
          </div>

          <div className={styles.fieldItem}>
            <span className={styles.fieldLabel}>Biography &amp; Background</span>
            <div className={styles.readOnlyFieldWrap}>
              <span className={styles.fieldValue}>{expertUser?.bio || "No bio provided."}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

