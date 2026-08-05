"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Code,
  Palette,
  LineChart,
  Megaphone,
  Coins,
  Heart,
  Scale,
  Briefcase,
  Database,
} from "lucide-react";
import styles from "./page.module.css";
import RegisterStep from "@/components/expert/onboarding/RegisterStep";
import LoginStep from "@/components/expert/onboarding/LoginStep";
import OtpStep from "@/components/expert/onboarding/OtpStep";
import CategoryStep from "@/components/expert/onboarding/CategoryStep";
import SkillsStep from "@/components/expert/onboarding/SkillsStep";
import ExperienceStep from "@/components/expert/onboarding/ExperienceStep";
import IdentityStep from "@/components/expert/onboarding/IdentityStep";
import CredentialsStep from "@/components/expert/onboarding/CredentialsStep";
import PreferencesStep from "@/components/expert/onboarding/PreferencesStep";
import AudienceStep from "@/components/expert/onboarding/AudienceStep";
import AvailabilityStep from "@/components/expert/onboarding/AvailabilityStep";
import ReviewStep from "@/components/expert/onboarding/ReviewStep";
import SuccessStep from "@/components/expert/onboarding/SuccessStep";
import { EXPERT_ONBOARDING_STEPS } from "@/components/expert/onboarding/OnboardingProgressBar";
import {
  createEmptyEducationDegree,
  createEmptyEmploymentPosition,
  deriveExperienceLevel,
  type EducationDegree,
  type EmploymentPosition,
  type ExperienceLevel,
} from "@/lib/expertEmployment";
import {
  getProfile,
  submitOnboarding,
  updateProfile,
  type AuthResponse,
} from "@/lib/api";
import {
  buildCredentialsPayload,
  clearExpertAuthOnly,
  clearPendingOtpSession,
  getPostAuthDestination,
  isAuthenticated,
  isNavigationHref,
  persistAuthSession,
  readPendingOtpSession,
  savePendingOtpSession,
  type ExpertOnboardingStep,
} from "@/lib/expertAuth";
import {
  deriveLocationFromTimezone,
  persistMediaUrl,
  persistPortfolioSamples,
} from "@/lib/expertApplicationMedia";
import type {
  ExpertCertificate,
  GovernmentIdData,
  PortfolioLink,
  PortfolioSampleFile,
} from "@/lib/expertApplicationSubmission";
import type { TimeSlot } from "@/lib/expertAvailability";

const categories = [
  { id: "software", label: "Software Engineering", icon: Code },
  { id: "design", label: "Product Design", icon: Palette },
  { id: "business", label: "Business Strategy", icon: LineChart },
  { id: "marketing", label: "Marketing & Growth", icon: Megaphone },
  { id: "finance", label: "Finance & VC", icon: Coins },
  { id: "health", label: "Health & Wellness", icon: Heart },
  { id: "legal", label: "Legal & Compliance", icon: Scale },
  { id: "product", label: "Product Management", icon: Briefcase },
  { id: "data", label: "Data Science", icon: Database },
];

const skillsByCategory: Record<string, string[]> = {
  software: [
    "Frontend Development",
    "Backend Architecture",
    "Mobile Apps",
    "Cloud & DevOps",
    "System Design",
    "Security & Cryptography",
    "Database Tuning",
    "AI / ML Models",
    "API Integrations",
  ],
  design: [
    "UI / UX Design",
    "Interaction Design",
    "Design Systems",
    "Wireframing",
    "Visual Branding",
    "User Research",
    "Prototyping",
    "Motion Design",
    "Webflow / Framer",
  ],
  business: [
    "Market Research",
    "Financial Modeling",
    "Growth Strategy",
    "Operations Management",
    "Mergers & Acquisitions",
    "Startup Scaling",
    "Go-to-Market",
    "Change Management",
    "Competitive Analysis",
    "Pricing Strategy",
  ],
  marketing: [
    "Meta & Google Ads",
    "SEO Strategy",
    "Content Marketing",
    "Brand Strategy",
    "Email Automation",
    "Product Marketing",
    "Conversion Optimization",
    "Influencer Marketing",
    "Growth Hacking",
  ],
  finance: [
    "VC Fundraising",
    "Tax Advisory & GST",
    "Bookkeeping",
    "Equity & Cap Tables",
    "CFO Services",
    "Treasury Management",
    "Valuation Audits",
    "Audit Preparation",
  ],
  health: [
    "Diet & Nutrition",
    "Mental Wellness",
    "Fitness Coaching",
    "Yoga & Mindfulness",
    "Sleep Hygiene",
    "Corporate Wellness",
    "Holistic Therapy",
  ],
  legal: [
    "Founder Agreements",
    "ESOP Structuring",
    "SaaS Contracts",
    "IP & Patents",
    "Regulatory Compliance",
    "Company Incorporation",
    "Data Privacy (GDPR)",
  ],
  product: [
    "Product Strategy",
    "Roadmapping",
    "Agile / Scrum",
    "User Story Mapping",
    "Product Analytics",
    "A/B Testing",
    "Feature Prioritization",
  ],
  data: [
    "Data Warehousing",
    "SQL / Postgres",
    "Python Analytics",
    "Predictive Modeling",
    "BI Dashboards",
    "Big Data Pipelines",
    "A/B Test Analytics",
  ],
};

type OnboardingStep = ExpertOnboardingStep;

function ExpertOnboardingPageContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStep>("register");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [employmentPositions, setEmploymentPositions] = useState<EmploymentPosition[]>([
    createEmptyEmploymentPosition(),
  ]);
  const [educationDegrees, setEducationDegrees] = useState<EducationDegree[]>([
    createEmptyEducationDegree(),
  ]);
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [formatPrices, setFormatPrices] = useState<Record<string, string>>({});
  const [tagLine, setTagLine] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhotoSrc, setProfilePhotoSrc] = useState(
    "/assets/img/manportrait.png",
  );
  const [customSkills, setCustomSkills] = useState<Record<string, string[]>>({});
  const [customCategories, setCustomCategories] = useState<(typeof categories[number])[]>([]);
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [expertId, setExpertId] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [internalStepComplete, setInternalStepComplete] = useState<Record<number, boolean>>({});
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [portfolioSamples, setPortfolioSamples] = useState<PortfolioSampleFile[]>([]);
  const [certificates, setCertificates] = useState<ExpertCertificate[]>([]);
  const [governmentId, setGovernmentId] = useState<GovernmentIdData | null>(null);
  const [kycVideoUrl, setKycVideoUrl] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [timezone, setTimezone] = useState("");
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([]);
  const [acceptCustomRequests, setAcceptCustomRequests] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const otpFlowLockRef = useRef(false);

  function buildPortfolioLinks(linkedinUrl: string, portfolioUrl: string): PortfolioLink[] {
    const links: PortfolioLink[] = [];

    if (linkedinUrl.trim()) {
      links.push({
        id: "portfolio-linkedin",
        url: linkedinUrl.trim(),
        platform: "LinkedIn",
      });
    }

    if (portfolioUrl.trim()) {
      links.push({
        id: "portfolio-site",
        url: portfolioUrl.trim(),
        platform: "Portfolio",
      });
    }

    return links;
  }

  const handleStepCompleteChange = useCallback((step: number, complete: boolean) => {
    setInternalStepComplete((prev) => {
      if (prev[step] === complete) return prev;
      return { ...prev, [step]: complete };
    });
  }, []);

  const stepCompletion = useMemo(
    () => [
      Boolean(selectedCategory),
      selectedSkills.length > 0,
      Boolean(internalStepComplete[3]),
      Boolean(internalStepComplete[4]),
      Boolean(internalStepComplete[5]),
      Boolean(internalStepComplete[6]),
      Boolean(internalStepComplete[7]),
      Boolean(internalStepComplete[8]),
      Boolean(internalStepComplete[9]),
    ],
    [selectedCategory, selectedSkills, internalStepComplete],
  );

  useEffect(() => {
    const resume = searchParams.get("resume");
    const auth = searchParams.get("auth");
    const nameParam = searchParams.get("name");

    if (nameParam) {
      setRegisteredName(decodeURIComponent(nameParam));
    }

    if (resume === "category") {
      setStep("category");
      setRegisteredName((prev) => prev || "Expert");
    } else if (resume === "otp") {
      const pending = readPendingOtpSession();
      if (pending) {
        otpFlowLockRef.current = true;
        setExpertId(pending.expertId);
        setRegisteredEmail(pending.email);
        setRegisteredPhone(pending.phone);
        if (pending.fullName) setRegisteredName(pending.fullName);
      }
      setStep("otp");
    } else if (auth === "login") {
      setStep("login");
    } else {
      const pending = readPendingOtpSession();
      if (pending) {
        otpFlowLockRef.current = true;
        setExpertId(pending.expertId);
        setRegisteredEmail(pending.email);
        setRegisteredPhone(pending.phone);
        if (pending.fullName) setRegisteredName(pending.fullName);
        setStep("otp");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (readPendingOtpSession()) return;
    if (otpFlowLockRef.current) return;
    if (!isAuthenticated()) return;

    let active = true;

    getProfile()
      .then((profile) => {
        if (!active) return;
        if (otpFlowLockRef.current) return;
        if (readPendingOtpSession()) return;

        const user = profile as {
          id?: string;
          fullName?: string;
          email?: string;
          phone?: string;
          onboardingStep?: string;
          status?: string;
          category?: string;
          skills?: string[];
          experienceLevel?: string;
          professionalTitle?: string;
          tagLine?: string;
          bio?: string;
          profilePhotoSrc?: string;
          selectedFormats?: string[];
          selectedLengths?: string[];
          formatPrices?: Record<string, string>;
          targetAudience?: string[] | string;
          focusAreas?: string[];
          timezone?: string;
          onboardingMetadata?: Record<string, unknown>;
        };

        if (user.fullName) setRegisteredName(user.fullName);
        if (user.email) setRegisteredEmail(user.email);
        if (user.phone) setRegisteredPhone(user.phone);
        if (user.id) setExpertId(user.id);
        if (user.category) setSelectedCategory(user.category);
        if (user.skills?.length) setSelectedSkills(user.skills);
        if (user.professionalTitle) setProfessionalTitle(user.professionalTitle);
        if (user.tagLine) setTagLine(user.tagLine);
        if (user.bio) setBio(user.bio);
        if (user.profilePhotoSrc) setProfilePhotoSrc(user.profilePhotoSrc);
        if (user.selectedFormats?.length) setSelectedFormats(user.selectedFormats);
        if (user.selectedLengths?.length) setSelectedLengths(user.selectedLengths);
        if (user.formatPrices) setFormatPrices(user.formatPrices);
        if (user.timezone) setTimezone(user.timezone);

        const metadata = user.onboardingMetadata ?? {};
        if (typeof metadata.linkedin === "string") setLinkedin(metadata.linkedin);
        if (typeof metadata.portfolio === "string") setPortfolio(metadata.portfolio);
        if (Array.isArray(metadata.languages)) setLanguages(metadata.languages as string[]);
        if (Array.isArray(metadata.audiences)) setSelectedAudiences(metadata.audiences as string[]);
        if (typeof metadata.acceptCustomRequests === "boolean") {
          setAcceptCustomRequests(metadata.acceptCustomRequests);
        }

        const destination = getPostAuthDestination({
          id: user.id || "",
          email: user.email || "",
          fullName: user.fullName || "",
          phone: user.phone,
          onboardingStep: user.onboardingStep || "category",
          status: user.status || "draft",
        });

        if (isNavigationHref(destination)) {
          window.location.assign(destination);
          return;
        }

        setStep(destination);
      })
      .catch(() => {
        // Ignore resume errors and keep the default register flow.
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    const user = persistAuthSession(response);
    setExpertId(user.id);
    setRegisteredName(user.fullName);
    setRegisteredEmail(user.email);
    if (user.phone) setRegisteredPhone(user.phone);

    const destination = getPostAuthDestination(user);
    if (isNavigationHref(destination)) {
      window.location.assign(destination);
      return;
    }

    setStep(destination);
  };

  const handleRegisterComplete = ({
    expertId: nextExpertId,
    phone,
    fullName,
    email,
  }: {
    expertId: string;
    phone: string;
    fullName: string;
    email: string;
  }) => {
    otpFlowLockRef.current = true;
    savePendingOtpSession({
      expertId: nextExpertId,
      phone,
      email,
      fullName,
    });
    setExpertId(nextExpertId);
    setRegisteredPhone(phone);
    setRegisteredEmail(email);
    setRegisteredName(fullName);
    setStep("otp");
    clearExpertAuthOnly();
  };

  const handleLoginRequiresOtp = ({
    expertId: nextExpertId,
    email,
    phone,
    fullName,
  }: {
    expertId: string;
    email: string;
    phone: string;
    fullName?: string;
  }) => {
    otpFlowLockRef.current = true;
    savePendingOtpSession({
      expertId: nextExpertId,
      email,
      phone,
      fullName,
    });
    setExpertId(nextExpertId);
    setRegisteredEmail(email);
    setRegisteredPhone(phone);
    if (fullName) setRegisteredName(fullName);
    setStep("otp");
    clearExpertAuthOnly();
  };

  const handleLoginComplete = (response: AuthResponse) => {
    clearPendingOtpSession();
    handleAuthSuccess(response);
  };

  const handleOtpComplete = (response: AuthResponse) => {
    otpFlowLockRef.current = false;
    clearPendingOtpSession();
    handleAuthSuccess(response);
  };

  const handleBackToRegister = () => {
    setStep("register");
  };

  const handleSwitchToRegister = () => {
    setStep("register");
  };

  const saveProfileStep = async (
    payload: Parameters<typeof updateProfile>[0],
    photoFile?: File | null,
  ) => {
    setProfileError(null);
    await updateProfile(payload, photoFile);
  };

  const handleCategoryContinue = async () => {
    try {
      await saveProfileStep({
        step: "skills",
        category: activeCategoryLabel || selectedCategory,
      });
      setStep("skills");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save category.");
    }
  };

  const handleAddCustomCategory = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const baseId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = `custom-${baseId || "category"}`;

    const exists = [...categories, ...customCategories].some(
      (cat) => cat.id === id || cat.label.toLowerCase() === trimmed.toLowerCase(),
    );

    if (exists) {
      const existing = [...categories, ...customCategories].find(
        (cat) => cat.id === id || cat.label.toLowerCase() === trimmed.toLowerCase(),
      );
      if (existing) {
        setSelectedCategory(existing.id);
        setSelectedSkills([]);
      }
      return;
    }

    setCustomCategories((prev) => [...prev, { id, label: trimmed, icon: Briefcase }]);
    setSelectedCategory(id);
    setSelectedSkills([]);
  };

  const handleRemoveCustomCategory = (id: string) => {
    setCustomCategories((prev) => prev.filter((cat) => cat.id !== id));
    if (selectedCategory === id) {
      setSelectedCategory("");
      setSelectedSkills([]);
    }
    setCustomSkills((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const allCategories = [...categories, ...customCategories];

  const handleBackToCategory = () => {
    setStep("category");
  };

  const handleSkillsContinue = async () => {
    try {
      await saveProfileStep({
        step: "experience",
        skills: selectedSkills,
      });
      setStep("experience");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save skills.");
    }
  };

  const handleBackToSkills = () => {
    setStep("skills");
  };

  const handleExperienceContinue = async () => {
    try {
      const resolvedExperienceLevel = deriveExperienceLevel(employmentPositions);
      await saveProfileStep({
        step: "identity",
        experienceLevel: resolvedExperienceLevel,
        credentials: buildCredentialsPayload(employmentPositions, educationDegrees),
        onboardingMetadata: {
          linkedin,
          portfolio,
          portfolioSamples,
        },
      });
      setStep("identity");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save experience.");
    }
  };

  const handleBackToExperience = () => {
    setStep("experience");
  };

  const handleIdentityContinue = async () => {
    try {
      await saveProfileStep({
        step: "credentials",
        professionalTitle,
        tagLine,
        bio,
        profilePhotoSrc,
      });
      setStep("credentials");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save identity.");
    }
  };

  const handleBackToIdentity = () => {
    setStep("identity");
  };

  const handleCredentialsContinue = async () => {
    try {
      await saveProfileStep({
        step: "preferences",
        onboardingMetadata: {
          governmentId,
          kycVideoUrl,
          certificates,
        },
      });
      setStep("preferences");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save credentials.");
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
  };

  const handlePreferencesContinue = async () => {
    try {
      await saveProfileStep({
        step: "audience",
        selectedFormats,
        selectedLengths,
        formatPrices,
        onboardingMetadata: {
          acceptCustomRequests,
        },
      });
      setStep("audience");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save preferences.");
    }
  };

  const handleBackToPreferences = () => {
    setStep("preferences");
  };

  const handleAudienceContinue = async () => {
    try {
      await saveProfileStep({
        step: "availability",
        targetAudience: selectedAudiences,
        focusAreas: languages,
        onboardingMetadata: {
          languages,
          audiences: selectedAudiences,
        },
      });
      setStep("availability");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save audience.");
    }
  };

  const handleBackToAudience = () => {
    setStep("audience");
  };

  const handleAvailabilityContinue = async () => {
    try {
      await saveProfileStep({
        step: "review",
        timezone,
        availabilitySlots: availabilitySlots.map((slot) => ({
          days: slot.days,
          from: slot.from,
          to: slot.to,
        })),
      });
      setStep("review");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save availability.");
    }
  };

  const handleBackToAvailability = () => {
    setStep("availability");
  };

  const handleReviewContinue = async ({
    name,
    professionalTitle: submittedProfessionalTitle,
    termsAccepted,
  }: {
    name: string;
    professionalTitle: string;
    termsAccepted: boolean;
  }) => {
    if (!termsAccepted || isSubmittingApplication) return;

    setIsSubmittingApplication(true);

    try {
      const resolvedProfessionalTitle =
        submittedProfessionalTitle || professionalTitle || activeCategoryLabel || "Expert";

      await saveProfileStep({
        step: "review",
        professionalTitle: resolvedProfessionalTitle,
        onboardingMetadata: {
          displayName: name || registeredName || undefined,
          termsAccepted,
        },
      });

      await submitOnboarding();

      setStep("success");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not submit application.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleJumpToStepNumber = (stepNumber: number) => {
    const target = EXPERT_ONBOARDING_STEPS[stepNumber - 1];
    if (target) {
      setStep(target);
    }
  };

  // Toggle skill selection
  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      if (selectedSkills.length < 5) {
        setSelectedSkills([...selectedSkills, skill]);
      }
    }
  };

  // Add custom skill
  const handleAddCustomSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;

    const categoryCustomList = customSkills[selectedCategory] || [];
    const baseSkillsList = skillsByCategory[selectedCategory] || [];
    const existingSkill = [...baseSkillsList, ...categoryCustomList].find(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existingSkill) {
      if (
        !selectedSkills.some((s) => s.toLowerCase() === existingSkill.toLowerCase()) &&
        selectedSkills.length < 5
      ) {
        setSelectedSkills([...selectedSkills, existingSkill]);
      }
      return;
    }

    setCustomSkills({
      ...customSkills,
      [selectedCategory]: [...categoryCustomList, trimmed],
    });

    if (!selectedSkills.includes(trimmed) && selectedSkills.length < 5) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
  };

  const handleRemoveCustomSkill = (skill: string) => {
    const categoryCustomList = customSkills[selectedCategory] || [];
    setCustomSkills({
      ...customSkills,
      [selectedCategory]: categoryCustomList.filter(
        (s) => s.toLowerCase() !== skill.toLowerCase(),
      ),
    });
    setSelectedSkills(
      selectedSkills.filter((s) => s.toLowerCase() !== skill.toLowerCase()),
    );
  };

  // Retrieve current category options
  const activeCategoryInfo = allCategories.find((c) => c.id === selectedCategory);
  const activeCategoryLabel = activeCategoryInfo ? activeCategoryInfo.label : "";
  const baseSkills = skillsByCategory[selectedCategory] || [];
  const activeCustomSkills = customSkills[selectedCategory] || [];
  const pendingOtp = readPendingOtpSession();
  const otpExpertId = expertId || pendingOtp?.expertId || "";
  const otpEmail = registeredEmail || pendingOtp?.email || "";
  const otpPhone = registeredPhone || pendingOtp?.phone || "";

  return (
    <main className={styles.pageContainer}>
      {/* Blurred background image layer */}
      <div className={styles.bgWrapper}>
        <img
          src="/assets/img/hero-bg.png"
          alt=""
          className={styles.bgImage}
          role="presentation"
        />
        <div className={styles.bgOverlay} />
      </div>

      {step === "register" && (
        <RegisterStep
          onContinue={handleRegisterComplete}
          onOAuthSuccess={handleAuthSuccess}
        />
      )}

      {step === "login" && (
        <LoginStep
          onContinue={handleLoginComplete}
          onRequiresOtp={handleLoginRequiresOtp}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}

      {step === "otp" && otpExpertId ? (
        <OtpStep
          expertId={otpExpertId}
          phone={otpPhone}
          email={otpEmail}
          onBack={handleBackToRegister}
          onContinue={handleOtpComplete}
        />
      ) : null}

      {step === "otp" && !otpExpertId ? (
        <section className={styles.otpFallback}>
          <p>Verification session expired. Please register again to receive a new code.</p>
          <button type="button" onClick={handleBackToRegister}>
            Back to Register
          </button>
        </section>
      ) : null}

      {profileError ? (
        <p role="alert" style={{ color: "#ffb4b4", textAlign: "center", marginTop: "1rem" }}>
          {profileError}
        </p>
      ) : null}

      {step === "category" && (
        <CategoryStep
          userName={registeredName}
          categories={allCategories}
          selectedCategory={selectedCategory}
          stepCompletion={stepCompletion}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            setSelectedSkills([]);
          }}
          onAddCustomCategory={handleAddCustomCategory}
          onRemoveCustomCategory={handleRemoveCustomCategory}
          onBack={handleBackToRegister}
          onContinue={handleCategoryContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "skills" && (
        <SkillsStep
          userName={registeredName}
          activeCategoryLabel={activeCategoryLabel}
          currentSkillsList={baseSkills}
          customSkillsList={activeCustomSkills}
          selectedSkills={selectedSkills}
          stepCompletion={stepCompletion}
          onToggleSkill={handleToggleSkill}
          onAddCustomSkill={handleAddCustomSkill}
          onRemoveCustomSkill={handleRemoveCustomSkill}
          onBack={handleBackToCategory}
          onContinue={handleSkillsContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "experience" && (
        <ExperienceStep
          userName={registeredName}
          employmentPositions={employmentPositions}
          educationDegrees={educationDegrees}
          linkedin={linkedin}
          portfolio={portfolio}
          portfolioSamples={portfolioSamples}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onEmploymentPositionsChange={setEmploymentPositions}
          onEducationDegreesChange={setEducationDegrees}
          onLinkedinChange={setLinkedin}
          onPortfolioChange={setPortfolio}
          onPortfolioSamplesChange={setPortfolioSamples}
          onBack={handleBackToSkills}
          onContinue={handleExperienceContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "identity" && (
        <IdentityStep
          userName={registeredName}
          categoryLabel={activeCategoryLabel}
          selectedSkills={selectedSkills}
          professionalTitle={professionalTitle}
          onProfessionalTitleChange={setProfessionalTitle}
          tagLine={tagLine}
          onTagLineChange={setTagLine}
          bio={bio}
          onBioChange={setBio}
          profilePhotoSrc={profilePhotoSrc}
          onProfilePhotoChange={setProfilePhotoSrc}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToExperience}
          onContinue={handleIdentityContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "credentials" && (
        <CredentialsStep
          userName={registeredName}
          kycVideoSrc={kycVideoUrl}
          onKycVideoChange={setKycVideoUrl}
          governmentId={governmentId}
          onGovernmentIdChange={setGovernmentId}
          certificates={certificates}
          onCertificatesChange={setCertificates}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToIdentity}
          onContinue={handleCredentialsContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "preferences" && (
        <PreferencesStep
          userName={registeredName}
          selectedFormats={selectedFormats}
          onSelectedFormatsChange={setSelectedFormats}
          selectedLengths={selectedLengths}
          onSelectedLengthsChange={setSelectedLengths}
          formatPrices={formatPrices}
          onFormatPricesChange={setFormatPrices}
          acceptCustomRequests={acceptCustomRequests}
          onAcceptCustomRequestsChange={setAcceptCustomRequests}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToCredentials}
          onContinue={handlePreferencesContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "audience" && (
        <AudienceStep
          userName={registeredName}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToPreferences}
          onContinue={handleAudienceContinue}
          onContinueWithAudience={({ languages: nextLanguages, audiences }) => {
            setLanguages(nextLanguages);
            setSelectedAudiences(audiences);
          }}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "availability" && (
        <AvailabilityStep
          userName={registeredName}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToAudience}
          onContinue={handleAvailabilityContinue}
          onScheduleChange={({ timezone: nextTimezone, slots }) => {
            setTimezone(nextTimezone);
            setAvailabilitySlots(slots);
          }}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "review" && (
        <ReviewStep
          userName={registeredName}
          selectedSkills={selectedSkills}
          employmentPositions={employmentPositions}
          educationDegrees={educationDegrees}
          professionalTitle={professionalTitle}
          tagLine={tagLine}
          bio={bio}
          onBioChange={setBio}
          categoryLabel={
            allCategories.find((c) => c.id === selectedCategory)?.label ?? "Not selected"
          }
          linkedin={linkedin}
          portfolio={portfolio}
          portfolioSamples={portfolioSamples}
          governmentId={governmentId}
          kycVideoUrl={kycVideoUrl}
          certificates={certificates}
          languages={languages}
          selectedAudiences={selectedAudiences}
          timezone={timezone}
          availabilitySlots={availabilitySlots}
          selectedFormats={selectedFormats}
          selectedLengths={selectedLengths}
          formatPrices={formatPrices}
          profilePhotoSrc={profilePhotoSrc}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToAvailability}
          onSubmit={handleReviewContinue}
          onJumpToStep={(targetStep) => {
            setStep(targetStep as OnboardingStep);
          }}
          onProgressStepClick={handleJumpToStepNumber}
        />
      )}

      {step === "success" && (
        <SuccessStep
          userName={registeredName}
          professionalTitle={professionalTitle}
          tagLine={tagLine}
          bio={bio}
          categoryLabel={
            allCategories.find((c) => c.id === selectedCategory)?.label ?? "Not selected"
          }
          languages={languages}
          formatPrices={formatPrices}
          profilePhotoSrc={profilePhotoSrc}
        />
      )}
    </main>
  );
}

export default function ExpertOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ExpertOnboardingPageContent />
    </Suspense>
  );
}
