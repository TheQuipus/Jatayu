"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  X,
  Check,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  ShieldCheck,
  Clock,
  Globe,
  Sparkles,
  Trash2,
  Video,
  FileText,
  User,
  CheckCircle2,
  Calendar,
  Layers,
  Users,
  Building,
  DollarSign,
  AlertCircle,
} from "lucide-react";
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
import {
  fetchExpertProfileRecord,
  mapBackendAvailability,
  mapBackendProfileToExpertData,
  saveExpertProfileData,
} from "@/lib/expertProfileApi";
import {
  getExpertApplicationDraft,
  saveExpertApplicationDraft,
  getExpertApplications,
} from "@/lib/expertApplicationsStore";
import { getDemoExpertApplications } from "@/lib/demoExpertApplications";
import {
  CONSULTATION_FORMATS,
  SESSION_LENGTHS,
  getLowestFormatPrice,
} from "@/components/expert/onboarding/preferencesData";
import {
  createEmptyEmploymentPosition,
  createEmptyEducationDegree,
  MONTH_OPTIONS,
  getYearOptions,
  type EducationDegree,
  type EmploymentPosition,
} from "@/lib/expertEmployment";
import { expertSlug } from "@/lib/experts";
import type {
  ExpertCertificate,
  GovernmentIdData,
  PortfolioSampleFile,
} from "@/lib/expertApplicationSubmission";
import type { TimeSlot } from "@/lib/expertAvailability";
import { buildCredentialsPayload, parseCredentialsFromProfile } from "@/lib/expertAuth";
import styles from "./ExpertProfileEditor.module.css";

const MAX_CHARS = 160;
const MAX_SKILLS = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const CATEGORIES_LIST = [
  "Software Engineering",
  "Product Design",
  "Business Strategy",
  "Marketing & Growth",
  "Finance & VC",
  "Health & Wellness",
  "Legal & Compliance",
  "Product Management",
  "Data Science",
];

const AUDIENCE_OPTIONS = [
  { id: "startup", label: "Startup Founders", desc: "Early-stage & venture-backed leaders" },
  { id: "enterprise", label: "Enterprise Execs", desc: "VPs, Directors & department heads" },
  { id: "career", label: "Career Transitioners", desc: "Professionals seeking pivots or growth" },
  { id: "smb", label: "Small Business Owners", desc: "Operators, founders & SME managers" },
];

export default function ExpertProfileEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Identity & Basic state
  const [profile, setProfile] = useState<ExpertProfileData>(DEFAULT_EXPERT_PROFILE);
  const [photoError, setPhotoError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Full Onboarding state
  const [linkedin, setLinkedin] = useState("linkedin.com/in/aditya-dhar");
  const [portfolio, setPortfolio] = useState("adityadhar.design");
  const [employmentPositions, setEmploymentPositions] = useState<EmploymentPosition[]>([
    {
      id: "pos-1",
      jobTitle: "Principal Product Designer",
      company: "Design Systems Lab",
      startMonth: "01",
      startYear: "2020",
      endMonth: "",
      endYear: "",
      currentlyWorking: true,
      responsibilities: "Leading UX strategy, mentorship, and enterprise design transformation.",
    },
  ]);
  const [educationDegrees, setEducationDegrees] = useState<EducationDegree[]>([
    {
      id: "edu-1",
      degree: "B.Tech in Computer Science",
      fieldOfStudy: "Human Computer Interaction",
      institution: "Indian Institute of Technology",
      graduationYear: "2018",
      honours: "First Class with Distinction",
    },
  ]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "video",
    "written",
    "group",
    "shoutout",
  ]);
  const [formatPrices, setFormatPrices] = useState<Record<string, string>>({
    video: "2500",
    written: "1200",
    shoutout: "800",
    group: "1500",
  });
  const [selectedLengths, setSelectedLengths] = useState<string[]>(["15", "30", "45", "60"]);
  const [acceptCustomRequests, setAcceptCustomRequests] = useState(true);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([
    "startup",
    "enterprise",
    "career",
    "smb",
  ]);
  const [governmentId, setGovernmentId] = useState<GovernmentIdData>({
    type: "aadhaar",
    front: { name: "aadhaar_front_doc.pdf", size: "1.4 MB" },
    back: { name: "aadhaar_back_doc.pdf", size: "1.2 MB" },
  });
  const [kycVideoUrl, setKycVideoUrl] = useState("https://jatayu.com/verify/video-intro-9214.mp4");
  const [certificates, setCertificates] = useState<ExpertCertificate[]>([
    { id: "c1", name: "Certified Executive Design Strategist", issuer: "Interaction Design Org" },
    { id: "c2", name: "Advanced Product Architecture", issuer: "Design Guild" },
  ]);
  const [portfolioSamples, setPortfolioSamples] = useState<PortfolioSampleFile[]>([
    {
      id: "ps-1",
      fileName: "Enterprise_Fintech_CaseStudy.pdf",
      fileSize: "4.2 MB",
      fileType: "application/pdf",
      description: "0 to 1 scaling case study for B2B financial services.",
      status: "complete",
      progress: 100,
    },
  ]);
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST +5:30)");
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([
    { id: "slot-1", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], from: "10:00 AM", to: "06:00 PM" },
    { id: "slot-2", days: ["Sat"], from: "11:00 AM", to: "03:00 PM" },
  ]);
  const [appId, setAppId] = useState("APP-1079");
  const [activeSectionTab, setActiveSectionTab] = useState<string>("all");

  // Load from backend, stores, drafts on mount
  useEffect(() => {
    // 1. Check draft & applications
    const draft = getExpertApplicationDraft();
    const apps = getExpertApplications();
    const demoApps = getDemoExpertApplications();
    const matchedApp = apps[0] ?? demoApps[0];

    if (matchedApp) {
      setAppId(matchedApp.appId || "APP-1079");
      if (matchedApp.linkedin) setLinkedin(matchedApp.linkedin);
      if (matchedApp.portfolio) setPortfolio(matchedApp.portfolio);
      if (matchedApp.employmentPositions?.length) setEmploymentPositions(matchedApp.employmentPositions);
      if (matchedApp.educationDegrees?.length) setEducationDegrees(matchedApp.educationDegrees);
      if (matchedApp.formats?.length) setSelectedFormats(matchedApp.formats);
      if (matchedApp.formatPrices) setFormatPrices(matchedApp.formatPrices);
      if (matchedApp.lengths?.length) setSelectedLengths(matchedApp.lengths);
      if (matchedApp.audiences?.length) setSelectedAudiences(matchedApp.audiences);
      if (matchedApp.governmentId) setGovernmentId(matchedApp.governmentId);
      if (matchedApp.kycVideoUrl) setKycVideoUrl(matchedApp.kycVideoUrl);
      if (matchedApp.certificates?.length) setCertificates(matchedApp.certificates);
      if (matchedApp.portfolioSamples?.length) setPortfolioSamples(matchedApp.portfolioSamples);
      if (matchedApp.timezone) setTimezone(matchedApp.timezone);
      if (matchedApp.availabilitySlots?.length) setAvailabilitySlots(matchedApp.availabilitySlots);
    }

    if (draft.linkedin) setLinkedin(draft.linkedin);
    if (draft.portfolio) setPortfolio(draft.portfolio);

    void fetchExpertProfileRecord()
      .then((record) => {
        setProfile(mapBackendProfileToExpertData(record));
        if (record.applicationNumber) setAppId(record.applicationNumber);
        if (record.selectedFormats?.length) setSelectedFormats(record.selectedFormats);
        if (record.selectedLengths?.length) setSelectedLengths(record.selectedLengths);
        if (record.formatPrices) setFormatPrices(record.formatPrices);

        const audiences = Array.isArray(record.targetAudience)
          ? record.targetAudience
          : (() => {
              try {
                const parsed = JSON.parse(record.targetAudience || "[]");
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })();
        if (audiences.length) setSelectedAudiences(audiences);

        const parsedCredentials = parseCredentialsFromProfile(record.credentials);
        if (parsedCredentials.employmentPositions.length) {
          setEmploymentPositions(parsedCredentials.employmentPositions);
        }
        if (parsedCredentials.educationDegrees.length) {
          setEducationDegrees(parsedCredentials.educationDegrees);
        }

        const availability = mapBackendAvailability(record);
        if (availability.timezone) setTimezone(availability.timezone);
        if (availability.slots.length) setAvailabilitySlots(availability.slots);

        const metadata = record.onboardingMetadata || {};
        if (typeof metadata.linkedin === "string") setLinkedin(metadata.linkedin);
        if (typeof metadata.portfolio === "string") setPortfolio(metadata.portfolio);
        if (typeof metadata.acceptCustomRequests === "boolean") {
          setAcceptCustomRequests(metadata.acceptCustomRequests);
        }
        if (metadata.governmentId && typeof metadata.governmentId === "object") {
          setGovernmentId(metadata.governmentId as GovernmentIdData);
        }
        if (typeof metadata.kycVideoUrl === "string") setKycVideoUrl(metadata.kycVideoUrl);
        if (Array.isArray(metadata.certificates)) {
          setCertificates(metadata.certificates as ExpertCertificate[]);
        }
        if (Array.isArray(metadata.portfolioSamples)) {
          setPortfolioSamples(metadata.portfolioSamples as PortfolioSampleFile[]);
        }
      })
      .catch(() => {
        const stored = getExpertProfile();
        setProfile(stored);
      });
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
    const role = profile.role.trim() || "Industry Leader";
    const category = profile.category.trim() || "Product Design";
    const draft = `I'm a ${role} specializing in ${category}. I help founders and teams cut through complexity with high-impact, actionable guidance.`;

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

  // Employment position helpers
  const handleAddPosition = () => {
    setEmploymentPositions((prev) => [...prev, createEmptyEmploymentPosition()]);
    setSaved(false);
  };

  const handleUpdatePosition = (id: string, updates: Partial<EmploymentPosition>) => {
    setEmploymentPositions((prev) =>
      prev.map((pos) => (pos.id === id ? { ...pos, ...updates } : pos)),
    );
    setSaved(false);
  };

  const handleRemovePosition = (id: string) => {
    setEmploymentPositions((prev) => prev.filter((pos) => pos.id !== id));
    setSaved(false);
  };

  // Education helpers
  const handleAddDegree = () => {
    setEducationDegrees((prev) => [...prev, createEmptyEducationDegree()]);
    setSaved(false);
  };

  const handleUpdateDegree = (id: string, updates: Partial<EducationDegree>) => {
    setEducationDegrees((prev) =>
      prev.map((deg) => (deg.id === id ? { ...deg, ...updates } : deg)),
    );
    setSaved(false);
  };

  const handleRemoveDegree = (id: string) => {
    setEducationDegrees((prev) => prev.filter((deg) => deg.id !== id));
    setSaved(false);
  };

  // Format toggle & price
  const handleToggleFormat = (id: string) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setSaved(false);
  };

  const handlePriceChange = (id: string, val: string) => {
    setFormatPrices((prev) => ({ ...prev, [id]: val }));
    setSaved(false);
  };

  const handleToggleAudience = (id: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setSaved(false);
  };

  const handleToggleLength = (id: string) => {
    setSelectedLengths((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setSaved(false);
  };

  // Save full profile + onboarding data
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveExpertProfileData(profile, photoFile, {
        credentials: buildCredentialsPayload(employmentPositions, educationDegrees),
        selectedFormats,
        selectedLengths,
        formatPrices,
        targetAudience: selectedAudiences,
        focusAreas: profile.languages,
        timezone,
        availabilitySlots: availabilitySlots.map((slot) => ({
          days: slot.days,
          from: slot.from,
          to: slot.to,
        })),
        onboardingMetadata: {
          linkedin,
          portfolio,
          acceptCustomRequests,
          audiences: selectedAudiences,
          governmentId,
          kycVideoUrl,
          certificates,
          portfolioSamples,
        },
      });
      setPhotoFile(null);

      // Save draft / onboarding details
      saveExpertApplicationDraft({
        name: profile.name,
        professionalTitle: profile.role,
        categoryLabel: profile.category,
        skills: profile.skills,
        experienceLevel: profile.experienceLevel,
        tagLine: profile.tagLine,
        bio: profile.bio,
        location: profile.location,
        languages: profile.languages,
        linkedin,
        portfolio,
        employmentPositions,
        educationDegrees,
        formats: selectedFormats,
        formatPrices,
        lengths: selectedLengths,
        acceptCustomRequests,
        audiences: selectedAudiences,
        timezone,
        availabilitySlots,
        governmentId,
        kycVideoUrl,
        certificates,
        portfolioSamples,
      });

      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const publicProfileSlug = expertSlug(profile.name || "aditya-dhar");
  const publicProfileUrl = `/expert/${publicProfileSlug}`;

  const yearOptions = useMemo(() => getYearOptions(35), []);

  return (
    <div className={styles.editor}>
      {/* ----------------------------------------------------
          TOP ACTION BAR & PUBLIC PROFILE SHORTCUT
      ---------------------------------------------------- */}
      <div className={styles.topActionBar}>
        <div className={styles.topActionMeta}>
          <span className={styles.statusBadge}>
            <ShieldCheck size={14} /> Verified Expert
          </span>
          <span className={styles.appIdBadge}>
            <Award size={13} /> {appId}
          </span>
        </div>

        <div className={styles.topButtonsGroup}>
          <Link
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewPublicBtn}
            title="Preview your public profile"
          >
            <ExternalLink size={15} />
            View Public Profile
          </Link>

          <div className={styles.saveBtnWrapper}>
            <PrimaryButton
              type="button"
              label={
                saved ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <Check size={16} /> Changes Saved
                  </span>
                ) : (
                  "Save Changes"
                )
              }
              variant={saved ? "light" : "orange"}
              disabled={!isExpertProfileValid(profile) || isSaving}
              staticLabel={true}
              onClick={handleSaveAll}
            />
          </div>
        </div>
      </div>

      {saveError && (
        <div className={styles.errorNote}>
          <AlertCircle size={15} /> {saveError}
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 1 & 4: PROFESSIONAL IDENTITY & BASIC INFO
      ---------------------------------------------------- */}
      <section className={styles.sectionCard} id="identity-section">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionIconBox}>
              <User size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Profile Identity & Public Presence</h2>
              <p className={styles.sectionSubtitle}>
                Your core name, avatar, bio, and social presence visible to seekers.
              </p>
            </div>
          </div>
          <span className={styles.sectionStepBadge}>Step 4 · Identity</span>
        </div>

        {/* Profile Photo */}
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
            <h3 className={styles.photoUploadTitle}>Headshot & Profile Picture</h3>
            <p className={`${styles.photoUploadDesc} ${photoError ? styles.photoUploadDescError : ""}`}>
              {photoError || "Professional headshot recommended. JPG, PNG or WEBP up to 5MB."}
            </p>
          </div>
        </div>

        {/* Name & Title */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="profile-name" className={styles.fieldLabel}>
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile("name", e.target.value)}
              className={styles.textField}
              placeholder="e.g. Aditya Dhar"
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
              onChange={(e) => updateProfile("role", e.target.value)}
              className={styles.textField}
              placeholder="e.g. Principal UX Strategy Lead"
            />
          </div>
        </div>

        {/* Category & Experience Level */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="profile-category" className={styles.fieldLabel}>
              Primary Domain / Category
            </label>
            <select
              id="profile-category"
              value={profile.category}
              onChange={(e) => updateProfile("category", e.target.value)}
              className={styles.selectField}
            >
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-experience" className={styles.fieldLabel}>
              Experience Level
            </label>
            <select
              id="profile-experience"
              value={profile.experienceLevel}
              onChange={(e) =>
                updateProfile("experienceLevel", e.target.value as ExperienceLevel)
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
        </div>

        {/* Tagline */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="profile-tagline" className={styles.fieldLabel}>
              Public Tagline / Hook
            </label>
            <span className={styles.charCounter}>
              {profile.tagLine.length}/{MAX_CHARS}
            </span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              id="profile-tagline"
              value={profile.tagLine}
              onChange={(e) =>
                updateProfile("tagLine", e.target.value.slice(0, MAX_CHARS))
              }
              className={`${styles.textareaField} ${styles.textareaWithInlineCounter}`}
              rows={2}
              placeholder="A short, catchy hook that appears on expert cards and search results."
            />
            <span className={styles.textareaCounterInline}>
              {profile.tagLine.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Brief Introduction / Bio */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="profile-bio" className={styles.fieldLabel}>
              Brief Introduction & Bio
            </label>
            <span className={styles.charCounter}>
              {profile.bio.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            id="profile-bio"
            value={profile.bio}
            onChange={(e) => updateProfile("bio", e.target.value.slice(0, MAX_CHARS))}
            className={styles.textareaField}
            rows={4}
            placeholder="Tell clients about your background, notable achievements, and how you help them win."
          />
          <button
            type="button"
            className={styles.aiBioBtn}
            onClick={handleAiBioAssist}
            disabled={isGeneratingBio || !profile.role.trim()}
          >
            {isGeneratingBio ? (
              <span className={styles.aiBioLoadingText}>Writing with AI...</span>
            ) : (
              <ShinyText
                text="AI Assisted Bio Writing"
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

        {/* Location & Languages */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="profile-location" className={styles.fieldLabel}>
              Location / City
            </label>
            <input
              id="profile-location"
              type="text"
              value={profile.location}
              onChange={(e) => updateProfile("location", e.target.value)}
              className={styles.textField}
              placeholder="e.g. Mumbai, India"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-languages" className={styles.fieldLabel}>
              Languages Spoken
            </label>
            <input
              id="profile-languages"
              type="text"
              value={profile.languages.join(", ")}
              onChange={(e) =>
                updateProfile(
                  "languages",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
              className={styles.textField}
              placeholder="English, Hindi, Marathi"
            />
          </div>
        </div>

        {/* Social & Portfolio Links */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="profile-linkedin" className={styles.fieldLabel}>
              LinkedIn Profile
            </label>
            <input
              id="profile-linkedin"
              type="text"
              value={linkedin}
              onChange={(e) => {
                setLinkedin(e.target.value);
                setSaved(false);
              }}
              className={styles.textField}
              placeholder="linkedin.com/in/username"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="profile-portfolio" className={styles.fieldLabel}>
              Portfolio / Website URL
            </label>
            <input
              id="profile-portfolio"
              type="text"
              value={portfolio}
              onChange={(e) => {
                setPortfolio(e.target.value);
                setSaved(false);
              }}
              className={styles.textField}
              placeholder="https://yourportfolio.com"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          STEP 2: SKILLS & EXPERTISE
      ---------------------------------------------------- */}
      <section className={styles.sectionCard} id="skills-section">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionIconBox}>
              <Layers size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Skills & Specializations</h2>
              <p className={styles.sectionSubtitle}>
                Add your core competencies and tags so seekers find you for specific problems.
              </p>
            </div>
          </div>
          <span className={styles.sectionStepBadge}>Step 2 · Skills</span>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="profile-skills" className={styles.fieldLabel}>
            Core Skills ({profile.skills.length}/{MAX_SKILLS})
          </label>
          <div className={styles.skillInputRow}>
            <input
              id="profile-skills"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className={styles.textField}
              placeholder="Type a skill and press Enter"
              disabled={profile.skills.length >= MAX_SKILLS}
            />
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAddSkill}
              disabled={!skillInput.trim() || profile.skills.length >= MAX_SKILLS}
            >
              <Plus size={14} /> Add
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
      </section>

      {/* ----------------------------------------------------
          STEP 3: WORK EXPERIENCE & EDUCATION
      ---------------------------------------------------- */}
      <section className={styles.sectionCard} id="experience-section">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionIconBox}>
              <Briefcase size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Work Experience & Background</h2>
              <p className={styles.sectionSubtitle}>
                Detailed track record of past leadership, consulting roles, and degrees.
              </p>
            </div>
          </div>
          <span className={styles.sectionStepBadge}>Step 3 · Experience</span>
        </div>

        {/* Employment Positions */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>
              Employment Positions ({employmentPositions.length})
            </label>
            <button
              type="button"
              className={styles.addBtn}
              style={{ minHeight: 34, padding: "0 12px" }}
              onClick={handleAddPosition}
            >
              <Plus size={13} /> Add Position
            </button>
          </div>

          <div className={styles.itemCardList}>
            {employmentPositions.map((pos) => (
              <div key={pos.id} className={styles.itemCard}>
                <div className={styles.itemCardHeader}>
                  <h4 className={styles.itemCardTitle}>
                    {pos.jobTitle || "Job Title"} at {pos.company || "Company"}
                  </h4>
                  {employmentPositions.length > 1 && (
                    <button
                      type="button"
                      className={styles.deleteItemBtn}
                      onClick={() => handleRemovePosition(pos.id)}
                      title="Remove Position"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Job Title</label>
                    <input
                      type="text"
                      value={pos.jobTitle}
                      onChange={(e) => handleUpdatePosition(pos.id, { jobTitle: e.target.value })}
                      className={styles.textField}
                      placeholder="e.g. VP of Product"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Company / Organization</label>
                    <input
                      type="text"
                      value={pos.company}
                      onChange={(e) => handleUpdatePosition(pos.id, { company: e.target.value })}
                      className={styles.textField}
                      placeholder="e.g. Microsoft"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Start Year</label>
                    <select
                      value={pos.startYear}
                      onChange={(e) => handleUpdatePosition(pos.id, { startYear: e.target.value })}
                      className={styles.selectField}
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>End Year</label>
                    <select
                      value={pos.endYear}
                      disabled={pos.currentlyWorking}
                      onChange={(e) => handleUpdatePosition(pos.id, { endYear: e.target.value })}
                      className={styles.selectField}
                    >
                      <option value="">{pos.currentlyWorking ? "Present" : "Select Year"}</option>
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Responsibilities & Impact</label>
                  <textarea
                    value={pos.responsibilities}
                    onChange={(e) =>
                      handleUpdatePosition(pos.id, { responsibilities: e.target.value })
                    }
                    className={styles.textareaField}
                    rows={2}
                    placeholder="Key highlights and scope of work."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education Degrees */}
        <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
          <div className={styles.fieldLabelRow}>
            <label className={styles.fieldLabel}>
              Education & Degrees ({educationDegrees.length})
            </label>
            <button
              type="button"
              className={styles.addBtn}
              style={{ minHeight: 34, padding: "0 12px" }}
              onClick={handleAddDegree}
            >
              <Plus size={13} /> Add Degree
            </button>
          </div>

          <div className={styles.itemCardList}>
            {educationDegrees.map((deg) => (
              <div key={deg.id} className={styles.itemCard}>
                <div className={styles.itemCardHeader}>
                  <h4 className={styles.itemCardTitle}>
                    {deg.degree || "Degree"} — {deg.institution || "Institution"}
                  </h4>
                  {educationDegrees.length > 1 && (
                    <button
                      type="button"
                      className={styles.deleteItemBtn}
                      onClick={() => handleRemoveDegree(deg.id)}
                      title="Remove Degree"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Degree / Certification</label>
                    <input
                      type="text"
                      value={deg.degree}
                      onChange={(e) => handleUpdateDegree(deg.id, { degree: e.target.value })}
                      className={styles.textField}
                      placeholder="e.g. Master of Science"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Institution</label>
                    <input
                      type="text"
                      value={deg.institution}
                      onChange={(e) => handleUpdateDegree(deg.id, { institution: e.target.value })}
                      className={styles.textField}
                      placeholder="e.g. IIT Delhi"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Field of Study</label>
                    <input
                      type="text"
                      value={deg.fieldOfStudy}
                      onChange={(e) => handleUpdateDegree(deg.id, { fieldOfStudy: e.target.value })}
                      className={styles.textField}
                      placeholder="e.g. Computer Science"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Graduation Year</label>
                    <select
                      value={deg.graduationYear}
                      onChange={(e) =>
                        handleUpdateDegree(deg.id, { graduationYear: e.target.value })
                      }
                      className={styles.selectField}
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          STEP 6: CONSULTATION PREFERENCES & PRICING
      ---------------------------------------------------- */}
      <section className={styles.sectionCard} id="pricing-section">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionIconBox}>
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Consultation Formats & Pricing</h2>
              <p className={styles.sectionSubtitle}>
                Set your offered session formats, duration options, and session fee in ₹ (INR).
              </p>
            </div>
          </div>
          <span className={styles.sectionStepBadge}>Step 6 · Preferences</span>
        </div>

        {/* Formats Grid */}
        <div className={styles.formatsGrid}>
          {CONSULTATION_FORMATS.map((fmt) => {
            const isEnabled = selectedFormats.includes(fmt.id);
            return (
              <div
                key={fmt.id}
                className={`${styles.formatCard} ${isEnabled ? styles.formatCardActive : ""}`}
              >
                <div className={styles.formatCardTop}>
                  <h4 className={styles.formatTitle}>{fmt.title}</h4>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggleFormat(fmt.id)}
                    aria-label={`Enable ${fmt.title}`}
                  />
                </div>
                <p className={styles.formatDesc}>{fmt.desc.replace(/\n/g, " ")}</p>

                {isEnabled && (
                  <div className={styles.formatPriceRow}>
                    <div className={styles.formatPriceInputWrap}>
                      <span className={styles.currencyPrefix}>₹</span>
                      <input
                        type="number"
                        value={formatPrices[fmt.id] ?? "25"}
                        onChange={(e) => handlePriceChange(fmt.id, e.target.value)}
                        className={styles.priceInput}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <span className={styles.priceUnit}>/min</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Session Lengths */}
        <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
          <label className={styles.fieldLabel}>Supported Session Lengths</label>
          <div className={styles.chipsGrid}>
            {SESSION_LENGTHS.map((len) => {
              const active = selectedLengths.includes(len.id);
              return (
                <button
                  key={len.id}
                  type="button"
                  onClick={() => handleToggleLength(len.id)}
                  className={`${styles.selectableChip} ${active ? styles.selectableChipActive : ""}`}
                >
                  <Clock size={13} /> {len.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <input
            type="checkbox"
            id="custom-requests-toggle"
            checked={acceptCustomRequests}
            onChange={(e) => {
              setAcceptCustomRequests(e.target.checked);
              setSaved(false);
            }}
          />
          <label htmlFor="custom-requests-toggle" className={styles.fieldLabel} style={{ margin: 0, cursor: "pointer" }}>
            Accept custom consulting and retainer proposals from enterprise clients
          </label>
        </div>
      </section>

      {/* ----------------------------------------------------
          STEP 7: TARGET AUDIENCE
      ---------------------------------------------------- */}
      <section className={styles.sectionCard} id="audience-section">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionIconBox}>
              <Users size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Target Client Audience</h2>
              <p className={styles.sectionSubtitle}>
                Select the types of clients and organizational tiers you specialize in advising.
              </p>
            </div>
          </div>
          <span className={styles.sectionStepBadge}>Step 7 · Audience</span>
        </div>

        <div className={styles.chipsGrid}>
          {AUDIENCE_OPTIONS.map((aud) => {
            const active = selectedAudiences.includes(aud.id);
            return (
              <button
                key={aud.id}
                type="button"
                onClick={() => handleToggleAudience(aud.id)}
                className={`${styles.selectableChip} ${active ? styles.selectableChipActive : ""}`}
              >
                <CheckCircle2 size={14} />
                <span>
                  <strong>{aud.label}</strong> — {aud.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------
          STEP 5: CREDENTIALS & KYC VERIFICATION
      ---------------------------------------------------- */}
      <section className={styles.sectionCard} id="kyc-section">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionIconBox}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Credentials & KYC Verification</h2>
              <p className={styles.sectionSubtitle}>
                Identity verification documents, KYC video verification, and professional certifications.
              </p>
            </div>
          </div>
          <span className={styles.sectionStepBadge}>Step 5 · Credentials</span>
        </div>

        <div className={styles.kycGrid}>
          {/* Government ID */}
          <div className={styles.kycCard}>
            <div className={styles.kycCardHeader}>
              <span className={styles.kycTitle}>Government ID</span>
              <span className={styles.kycBadgeVerified}>
                <CheckCircle2 size={12} /> Verified
              </span>
            </div>
            <p className={styles.kycDetailText}>
              <strong>Document:</strong> {governmentId?.type ? governmentId.type.toUpperCase() : "Aadhaar Card"}
            </p>
            <p className={styles.kycDetailText}>
              <strong>Files:</strong> {governmentId?.front?.name || "Front uploaded"} {governmentId?.back ? `& ${governmentId.back.name}` : ""}
            </p>
          </div>

          {/* KYC Video Intro */}
          <div className={styles.kycCard}>
            <div className={styles.kycCardHeader}>
              <span className={styles.kycTitle}>Video Introduction</span>
              <span className={styles.kycBadgeVerified}>
                <CheckCircle2 size={12} /> Approved
              </span>
            </div>
            <p className={styles.kycDetailText}>
              <strong>Video Status:</strong> 60-second self-recorded introductory session on file.
            </p>
            <a
              href={kycVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--pomegranate)", textDecoration: "underline" }}
            >
              Review Intro Video
            </a>
          </div>

          {/* Certificates */}
          <div className={styles.kycCard}>
            <div className={styles.kycCardHeader}>
              <span className={styles.kycTitle}>Certifications & Licenses</span>
              <span className={styles.kycBadgeVerified}>
                <Award size={12} /> {certificates.length} Active
              </span>
            </div>
            {certificates.map((cert) => (
              <p key={cert.id} className={styles.kycDetailText}>
                • <strong>{cert.name}</strong> ({cert.issuer})
              </p>
            ))}
          </div>

          {/* Portfolio Samples */}
          <div className={styles.kycCard}>
            <div className={styles.kycCardHeader}>
              <span className={styles.kycTitle}>Work Samples & Artifacts</span>
              <span className={styles.kycBadgeVerified}>
                <FileText size={12} /> {portfolioSamples.length} Files
              </span>
            </div>
            {portfolioSamples.map((ps) => (
              <p key={ps.id} className={styles.kycDetailText}>
                • {ps.fileName} ({ps.fileSize})
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          BOTTOM ACTIONS
      ---------------------------------------------------- */}
      <div className={styles.actions}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PrimaryButton
            type="button"
            label={
              saved ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Check size={16} /> Changes Saved
                </span>
              ) : (
                "Save Profile Updates"
              )
            }
            variant={saved ? "light" : "orange"}
            disabled={!isExpertProfileValid(profile) || isSaving}
            staticLabel={true}
            onClick={handleSaveAll}
          />
          {saved && (
            <span className={styles.savedNote}>
              <CheckCircle2 size={16} /> All profile and onboarding changes are published.
            </span>
          )}
        </div>

        <Link
          href={publicProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewPublicBtn}
        >
          <ExternalLink size={15} /> View Public Profile
        </Link>
      </div>
    </div>
  );
}
