"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Briefcase,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import styles from "./EditProfileView.module.css";

const Instagram = ({ size = 15, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Linkedin = ({ size = 15, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ size = 15, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

type EditProfileViewProps = {
  user: ExpertUser | SeekerUser;
  isExpert: boolean;
};

export default function EditProfileView({ user, isExpert }: EditProfileViewProps) {
  // Form State with Safe Optional Chaining
  const [fullName, setFullName] = useState(user?.name || "Priya Sharma");
  const [displayName, setDisplayName] = useState(
    user?.name ? user.name.toLowerCase().replace(/\s+/g, ".") : "priya.sharma"
  );
  const [email, setEmail] = useState(user?.email || "priya@example.com");
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");
  const [dob, setDob] = useState("1992-03-15");
  const [gender, setGender] = useState("Female");

  const [headline, setHeadline] = useState(
    isExpert
      ? "Senior Domain Consultant & Business Strategist"
      : "Entrepreneur & Fintech Business Strategist"
  );
  const [bio, setBio] = useState(
    isExpert
      ? ((user as ExpertUser)?.bio || "Experienced domain consultant helping clients navigate complex challenges with actionable guidance.")
      : "Entrepreneur & business strategist with 8+ years in fintech and startup ecosystems. Passionate about connecting with domain experts who can accelerate decision-making. Fluent in Hindi, Marathi, and English."
  );

  const [country, setCountry] = useState("India");
  const [stateProv, setStateProv] = useState("Maharashtra");
  const [city, setCity] = useState(
    isExpert
      ? (user as ExpertUser)?.location?.split(",")[0]?.trim() || "Mumbai"
      : (user as SeekerUser)?.city || "Mumbai"
  );
  const [showLocationOnProfile, setShowLocationOnProfile] = useState(true);

  // Selected Languages State
  const [languages, setLanguages] = useState([
    { code: "IN", name: "Hindi", level: "Native" },
    { code: "IN", name: "Marathi", level: "Fluent" },
    { code: "GB", name: "English", level: "Fluent" },
  ]);

  // Selected Interests State
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Finance & Investment",
    "Startups",
    "Technology",
  ]);

  // Social Links State
  const [linkedin, setLinkedin] = useState("linkedin.com/in/your-profile");
  const [twitter, setTwitter] = useState("x.com/yourhandle");
  const [website, setWebsite] = useState("https://yourwebsite.com");
  const [instagram, setInstagram] = useState("instagram.com/yourhandle");

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleRemoveLanguage = (langName: string) => {
    setLanguages((prev) => prev.filter((l) => l.name !== langName));
  };

  return (
    <div className={styles.editProfileView}>
      {/* 1. Header Row */}
      <div className={styles.editHeaderRow}>
        <div>
          <h2 className={styles.editPageTitle}>Edit Profile</h2>
          <p className={styles.editPageSubtitle}>Update your personal information and preferences</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" className={styles.btnCancelEdit}>
            Cancel
          </button>
          <button type="button" className={styles.btnSaveEditTop}>
            <Check size={16} /> Save Changes
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Layout */}
      <div className={styles.editGrid}>
        {/* Left Column: Edit Forms */}
        <div className={styles.editLeftCol}>
          {/* Card 1: Avatar Header */}
          <div className={styles.editHeroCard}>
            <div className={styles.editAvatarSection}>
              <div className={styles.editAvatarWrapper}>
                <Image
                  src={user?.avatar || "/assets/img/manportrait.png"}
                  alt={user?.name || "User Avatar"}
                  width={90}
                  height={90}
                  className={styles.editAvatarImg}
                />
                <button type="button" className={styles.avatarCameraBtn} title="Upload Photo">
                  <Camera size={14} />
                </button>
              </div>

              <div className={styles.avatarActionGroup}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" className={styles.btnUploadPhoto}>
                    <Upload size={13} /> Upload Photo
                  </button>
                  <button type="button" className={styles.btnRemovePhoto}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
                <div className={styles.avatarHelperText}>
                  Upload a clear, professional photo. Recommended: 400x400px, JPG or PNG, max 5MB.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Information */}
          <div className={styles.editFormCard}>
            <div className={styles.editCardHeader}>
              <User size={18} style={{ color: "#2563eb" }} />
              <div>
                <h3 className={styles.subTitle}>Personal Information</h3>
                <p className={styles.subSubtitle}>Your basic profile details</p>
              </div>
            </div>

            <div className={styles.formGrid2Col}>
              {/* Full Name */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Full Name *</label>
                <div className={styles.inputIconWrap}>
                  <User size={15} className={styles.fieldIconLeft} />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Display Name</label>
                <div className={styles.inputIconWrap}>
                  <span className={styles.atSymbolLeft}>@</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <span className={styles.fieldHelper}>jatayu.com/@{displayName}</span>
              </div>

              {/* Phone Number */}
              <div className={styles.formField}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label className={styles.fieldLabel}>Phone Number</label>
                  <span className={styles.tagVerified} style={{ fontSize: "10px", padding: "1px 6px" }}>
                    ✓ Verified
                  </span>
                </div>
                <div className={styles.inputIconWrap}>
                  <Phone size={15} className={styles.fieldIconLeft} />
                  <input type="text" className={styles.formInput} value={phone} readOnly />
                  <Lock size={14} className={styles.fieldIconRight} />
                </div>
                <span className={styles.fieldHelper}>Contact support to change your phone number</span>
              </div>

              {/* Email Address */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Email Address</label>
                <div className={styles.inputIconWrap}>
                  <Mail size={15} className={styles.fieldIconLeft} />
                  <input
                    type="email"
                    className={styles.formInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Date of Birth</label>
                <div className={styles.inputIconWrap}>
                  <Calendar size={15} className={styles.fieldIconLeft} />
                  <input
                    type="date"
                    className={styles.formInput}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Gender</label>
                <div className={styles.inputIconWrap}>
                  <User size={15} className={styles.fieldIconLeft} />
                  <select
                    className={styles.formSelect}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Headline & Bio */}
          <div className={styles.editFormCard}>
            <div className={styles.editCardHeader}>
              <Briefcase size={18} style={{ color: "#7c3aed" }} />
              <div>
                <h3 className={styles.subTitle}>Headline &amp; Bio</h3>
                <p className={styles.subSubtitle}>Help experts understand who you are</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              {/* Professional Headline */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Professional Headline</label>
                <div className={styles.inputIconWrap}>
                  <Briefcase size={15} className={styles.fieldIconLeft} />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                </div>
                <span className={styles.fieldHelper}>Shown prominently on your profile. Max 120 characters.</span>
              </div>

              {/* About / Bio */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>About / Bio</label>
                <textarea
                  rows={4}
                  className={styles.formTextarea}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--dove-gray)" }}>
                  <span>Describe your background, goals, and interests. Max 500 characters.</span>
                  <span>{bio.length} / 500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Location */}
          <div className={styles.editFormCard}>
            <div className={styles.editCardHeader}>
              <MapPin size={18} style={{ color: "#16a34a" }} />
              <div>
                <h3 className={styles.subTitle}>Location</h3>
                <p className={styles.subSubtitle}>Used to match you with local &amp; regional experts</p>
              </div>
            </div>

            <div className={styles.formGrid3Col}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Country</label>
                <select
                  className={styles.formSelect}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="India">🇮🇳 India</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>State / Province</label>
                <select
                  className={styles.formSelect}
                  value={stateProv}
                  onChange={(e) => setStateProv(e.target.value)}
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>City</label>
                <select
                  className={styles.formSelect}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Bengaluru">Bengaluru</option>
                </select>
              </div>
            </div>

            <div className={styles.settingRow} style={{ borderBottom: "none", marginTop: "10px", padding: 0 }}>
              <div>
                <div className={styles.settingLabel}>Show location on profile</div>
                <div className={styles.settingDesc}>Visible to experts and other users</div>
              </div>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${showLocationOnProfile ? styles.toggleOn : ""}`}
                onClick={() => setShowLocationOnProfile(!showLocationOnProfile)}
              >
                <div className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          {/* Card 5: Languages */}
          <div className={styles.editFormCard}>
            <div className={styles.editCardHeader}>
              <Globe size={18} style={{ color: "#d97706" }} />
              <div>
                <h3 className={styles.subTitle}>Languages</h3>
                <p className={styles.subSubtitle}>Languages you speak — used to match you with relevant experts</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.fieldLabel}>Your languages</div>

              <div className={styles.langPillsRow}>
                {languages.map((l) => (
                  <div key={l.name} className={styles.langPillItem}>
                    <span className={styles.langFlag}>{l.code}</span>
                    <span className={styles.langName}>{l.name}</span>
                    <span className={styles.langLevel}>{l.level}</span>
                    <button
                      type="button"
                      className={styles.langRemoveBtn}
                      onClick={() => handleRemoveLanguage(l.name)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.addLangBox}>
                <div className={styles.fieldLabel} style={{ fontSize: "11px" }}>
                  Add a language
                </div>
                <div className={styles.addLangChipsRow}>
                  {["Bengali", "Tamil", "Telugu", "Kannada", "Gujarati", "Punjabi"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className={styles.addLangChipBtn}
                      onClick={() => {
                        if (!languages.some((l) => l.name === lang)) {
                          setLanguages([...languages, { code: "IN", name: lang, level: "Fluent" }]);
                        }
                      }}
                    >
                      🌐 {lang}
                    </button>
                  ))}
                  <button type="button" className={styles.addLangChipBtn}>
                    + More
                  </button>
                </div>

                <div className={styles.inputIconWrap} style={{ marginTop: "10px" }}>
                  <Search size={14} className={styles.fieldIconLeft} />
                  <input type="text" className={styles.formInput} placeholder="Search for a language..." />
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Expertise Interests */}
          <div className={styles.editFormCard}>
            <div className={styles.editCardHeaderRow}>
              <div>
                <h3 className={styles.subTitle}>Expertise Interests</h3>
                <p className={styles.subSubtitle}>Topics you want expert advice on</p>
              </div>
              <span style={{ fontSize: "11px", color: "var(--dove-gray)" }}>Select up to 8</span>
            </div>

            <div className={styles.interestsGrid}>
              {[
                "Finance & Investment",
                "Startups",
                "Technology",
                "Legal & Compliance",
                "Healthcare",
                "Education & Career",
                "Wellness",
                "Real Estate",
              ].map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`${styles.interestTile} ${isSelected ? styles.interestTileSelected : ""}`}
                    onClick={() => handleToggleInterest(interest)}
                  >
                    <span>{interest}</span>
                    {isSelected && <Check size={14} style={{ color: "#2563eb" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 7: Social & Online Presence */}
          <div className={styles.editFormCard}>
            <div className={styles.editCardHeader}>
              <Globe size={18} style={{ color: "#2563eb" }} />
              <div>
                <h3 className={styles.subTitle}>Social &amp; Online Presence</h3>
                <p className={styles.subSubtitle}>Optional — helps experts learn more about you</p>
              </div>
            </div>

            <div className={styles.formGrid2Col}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>LinkedIn</label>
                <div className={styles.inputIconWrap}>
                  <Linkedin size={15} className={styles.fieldIconLeft} style={{ color: "#0a66c2" }} />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Twitter / X</label>
                <div className={styles.inputIconWrap}>
                  <Twitter size={15} className={styles.fieldIconLeft} />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Personal Website</label>
                <div className={styles.inputIconWrap}>
                  <Globe size={15} className={styles.fieldIconLeft} style={{ color: "var(--dove-gray)" }} />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Instagram</label>
                <div className={styles.inputIconWrap}>
                  <Instagram size={15} className={styles.fieldIconLeft} style={{ color: "#e4405f" }} />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className={styles.editRightCol}>
          {/* Profile Strength Widget */}
          <div className={styles.editWidgetCard}>
            <div className={styles.strengthHeader}>
              <span className={styles.strengthTitle}>Profile Strength</span>
              <span className={styles.strengthPercent}>78%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: "78%" }} />
            </div>
            <p className={styles.strengthSub}>Complete the fields below to improve your match score:</p>

            <div className={styles.strengthChecklist}>
              <div className={styles.strengthCheckItem}>
                <CheckCircle2 size={15} className={styles.trustCheck} />
                <span>Basic info added</span>
              </div>
              <div className={styles.strengthCheckItem}>
                <CheckCircle2 size={15} className={styles.trustCheck} />
                <span>Phone verified</span>
              </div>
              <div className={styles.strengthCheckItem} style={{ color: "var(--dove-gray)" }}>
                <span className={styles.emptyCheckDot}>○</span>
                <span>Add bio description</span>
              </div>
              <div className={styles.strengthCheckItem} style={{ color: "var(--dove-gray)" }}>
                <span className={styles.emptyCheckDot}>○</span>
                <span>Link social profiles</span>
              </div>
              <div className={styles.strengthCheckItem} style={{ color: "var(--dove-gray)" }}>
                <span className={styles.emptyCheckDot}>○</span>
                <span>Enable WhatsApp alerts</span>
              </div>
            </div>
          </div>

          {/* Profile Tips Widget */}
          <div className={styles.editWidgetCard} style={{ background: "#f0f7ff", borderColor: "rgba(59, 130, 246, 0.2)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8", display: "flex", alignItems: "center", gap: "6px" }}>
              💡 Profile Tips
            </div>
            <ul className={styles.tipsList}>
              <li>A clear photo increases your match rate by up to 40%</li>
              <li>Adding regional languages helps match with local experts</li>
              <li>A detailed headline makes you stand out in sessions</li>
            </ul>
          </div>

          {/* Account Security Widget */}
          <div className={styles.editWidgetCard}>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", color: "var(--dove-gray)", textTransform: "uppercase" }}>
              ACCOUNT SECURITY
            </div>
            <div className={styles.securityMiniList}>
              <div className={styles.securityMiniItem}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Phone size={14} style={{ color: "#16a34a" }} />
                  <div>
                    <div className={styles.secTitle}>Phone Verified</div>
                    <div className={styles.secSub}>+91 98765 XXXXX</div>
                  </div>
                </div>
                <CheckCircle2 size={16} className={styles.trustCheck} />
              </div>

              <div className={styles.securityMiniItem}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail size={14} style={{ color: "#16a34a" }} />
                  <div>
                    <div className={styles.secTitle}>Email Linked</div>
                    <div className={styles.secSub}>priya@example.com</div>
                  </div>
                </div>
                <CheckCircle2 size={16} className={styles.trustCheck} />
              </div>

              <div className={styles.securityMiniItem}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={14} style={{ color: "var(--dove-gray)" }} />
                  <div>
                    <div className={styles.secTitle}>WhatsApp</div>
                    <div className={styles.secSub}>Not enabled</div>
                  </div>
                </div>
                <button type="button" style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone Widget */}
          <div className={styles.editWidgetCard} style={{ background: "rgba(239, 68, 68, 0.05)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", color: "#dc2626", textTransform: "uppercase" }}>
              DANGER ZONE
            </div>
            <p style={{ fontSize: "11px", color: "#b91c1c", margin: "4px 0 10px", lineHeight: "1.4" }}>
              Deleting your account is permanent and cannot be undone. All data will be erased.
            </p>
            <button type="button" className={styles.btnDangerAccount}>
              <Trash2 size={14} /> Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
