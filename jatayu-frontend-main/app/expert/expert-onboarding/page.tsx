"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
  updateProfile,
  submitOnboarding,
  getExpertId,
} from "@/lib/api";

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

type OnboardingStep =
  | "register"
  | "login"
  | "otp"
  | "category"
  | "skills"
  | "experience"
  | "identity"
  | "credentials"
  | "preferences"
  | "audience"
  | "availability"
  | "review"
  | "success";

type ExperienceLevel = "emerging" | "established" | "leader";
type SelectedExperienceLevel = ExperienceLevel | "";

/** Silently calls PUT /api/expert/profile; logs error but doesn't block step transition */
async function persistStep(payload: Parameters<typeof updateProfile>[0]) {
  try {
    await updateProfile(payload);
  } catch (err) {
    console.error("[Jatayu] Failed to persist step:", err);
  }
}

function ExpertOnboardingPageContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStep>("register");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<SelectedExperienceLevel>("");
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
  const [registeredExpertId, setRegisteredExpertId] = useState("");
  const [internalStepComplete, setInternalStepComplete] = useState<Record<number, boolean>>({});

  const handleStepCompleteChange = useCallback((step: number, complete: boolean) => {
    setInternalStepComplete((prev) => {
      if (prev[step] === complete) return prev;
      return { ...prev, [step]: complete };
    });
  }, []);

  const stepCompletion = useMemo(
    () => [
      Boolean(selectedCategory),
      selectedSkills.length === 5,
      Boolean(experienceLevel),
      Boolean(internalStepComplete[4]),
      Boolean(internalStepComplete[5]),
      Boolean(internalStepComplete[6]),
      Boolean(internalStepComplete[7]),
      Boolean(internalStepComplete[8]),
      Boolean(internalStepComplete[9]),
    ],
    [selectedCategory, selectedSkills, experienceLevel, internalStepComplete],
  );

  useEffect(() => {
    const resume = searchParams.get("resume");
    const auth = searchParams.get("auth");
    const nameParam = searchParams.get("name");

    if (nameParam) {
      setRegisteredName(decodeURIComponent(nameParam));
    }

    // Restore expertId from localStorage if available (e.g. after Google login)
    const storedId = getExpertId();
    if (storedId) setRegisteredExpertId(storedId);

    if (resume === "category") {
      setStep("category");
      setRegisteredName((prev) => prev || "Expert");
    } else if (auth === "login") {
      setStep("login");
    }
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Auth step handlers
  // -------------------------------------------------------------------------

  const handleRegisterComplete = ({
    phone,
    fullName,
    email,
    expertId,
  }: {
    phone: string;
    fullName: string;
    email: string;
    expertId: string;
  }) => {
    setRegisteredPhone(phone);
    setRegisteredEmail(email);
    setRegisteredName(fullName);
    setRegisteredExpertId(expertId);
    setStep("otp");
  };

  const handleLoginComplete = ({
    email,
    fullName,
    onboardingStep,
  }: {
    email: string;
    fullName: string;
    onboardingStep: string;
  }) => {
    setRegisteredEmail(email);
    setRegisteredName(fullName || email.split("@")[0]?.replace(/[._-]+/g, " ") || "Expert");

    // Auto-resume from the step stored on the server
    const resumableSteps: OnboardingStep[] = [
      "category", "skills", "experience", "identity",
      "credentials", "preferences", "audience", "availability", "review",
    ];
    const resumeTarget = resumableSteps.includes(onboardingStep as OnboardingStep)
      ? (onboardingStep as OnboardingStep)
      : "category";

    setStep(resumeTarget);
  };

  const handleOtpComplete = () => {
    setStep("category");
  };

  const handleBackToRegister = () => {
    setStep("register");
  };

  const handleSwitchToRegister = () => {
    setStep("register");
  };

  // -------------------------------------------------------------------------
  // Onboarding step handlers — each persists data to backend before advancing
  // -------------------------------------------------------------------------

  const handleCategoryContinue = () => {
    const activeCat = allCategories.find((c) => c.id === selectedCategory);
    persistStep({ step: "category", category: activeCat?.label ?? selectedCategory });
    setStep("skills");
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

  const allCategories = [...categories, ...customCategories];

  const handleBackToWelcome = () => {
    setStep("otp");
  };

  const handleBackToCategory = () => {
    setStep("category");
  };

  const handleSkillsContinue = () => {
    persistStep({ step: "skills", skills: selectedSkills });
    setStep("experience");
  };

  const handleBackToSkills = () => {
    setStep("skills");
  };

  const handleExperienceContinue = () => {
    persistStep({ step: "experience", experienceLevel });
    setStep("identity");
  };

  const handleBackToExperience = () => {
    setStep("experience");
  };

  const handleIdentityContinue = () => {
    persistStep({
      step: "identity",
      professionalTitle,
      tagLine,
      bio,
      profilePhotoSrc,
    });
    setStep("credentials");
  };

  const handleBackToIdentity = () => {
    setStep("identity");
  };

  const handleCredentialsContinue = (data: {
    credentials: Array<{
      type: string;
      title: string;
      institution: string;
      startYear: number;
      endYear?: number | null;
      description?: string | null;
    }>;
  }) => {
    persistStep({ step: "credentials", credentials: data.credentials });
    setStep("preferences");
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
  };

  const handlePreferencesContinue = () => {
    persistStep({
      step: "preferences",
      selectedFormats,
      selectedLengths,
      formatPrices,
    });
    setStep("audience");
  };

  const handleBackToPreferences = () => {
    setStep("preferences");
  };

  const handleAudienceContinue = (data: {
    targetAudience: string[];
    focusAreas: string[];
  }) => {
    persistStep({
      step: "audience",
      targetAudience: data.targetAudience,
      focusAreas: data.focusAreas,
    });
    setStep("availability");
  };

  const handleBackToAudience = () => {
    setStep("audience");
  };

  const handleAvailabilityContinue = (data: {
    slots: Array<{ id: string; days: string[]; from: string; to: string }>;
    timezone: string;
  }) => {
    const availabilitySlots = data.slots
      .filter((s) => s.days.length > 0 && s.from && s.to)
      .map((s) => ({ days: s.days, from: s.from, to: s.to }));

    persistStep({
      step: "availability",
      timezone: data.timezone,
      availabilitySlots,
    });
    setStep("review");
  };

  const handleBackToAvailability = () => {
    setStep("availability");
  };

  const handleReviewContinue = async () => {
    try {
      await submitOnboarding();
    } catch (err) {
      console.error("[Jatayu] Submit onboarding failed:", err);
    }
    setStep("success");
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

  // Retrieve current category options
  const activeCategoryInfo = allCategories.find((c) => c.id === selectedCategory);
  const activeCategoryLabel = activeCategoryInfo ? activeCategoryInfo.label : "";
  const baseSkills = skillsByCategory[selectedCategory] || [];
  const activeCustomSkills = customSkills[selectedCategory] || [];
  const currentSkillsList = [...baseSkills, ...activeCustomSkills];

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
        <RegisterStep onContinue={handleRegisterComplete} />
      )}

      {step === "login" && (
        <LoginStep
          onContinue={handleLoginComplete}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}

      {step === "otp" && (
        <OtpStep
          phone={registeredPhone}
          email={registeredEmail}
          expertId={registeredExpertId}
          onBack={handleBackToRegister}
          onContinue={handleOtpComplete}
        />
      )}

      {step === "category" && (
        <CategoryStep
          userName={registeredName}
          categories={allCategories}
          presetCategoryIds={categories.map((c) => c.id)}
          selectedCategory={selectedCategory}
          stepCompletion={stepCompletion}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            setSelectedSkills([]);
          }}
          onAddCustomCategory={handleAddCustomCategory}
          onBack={handleBackToWelcome}
          onContinue={handleCategoryContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "skills" && (
        <SkillsStep
          userName={registeredName}
          activeCategoryLabel={activeCategoryLabel}
          currentSkillsList={currentSkillsList}
          selectedSkills={selectedSkills}
          stepCompletion={stepCompletion}
          onToggleSkill={handleToggleSkill}
          onAddCustomSkill={handleAddCustomSkill}
          onBack={handleBackToCategory}
          onContinue={handleSkillsContinue}
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "experience" && (
        <ExperienceStep
          userName={registeredName}
          experienceLevel={experienceLevel}
          stepCompletion={stepCompletion}
          onSelectLevel={setExperienceLevel}
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
          onJumpToStep={handleJumpToStepNumber}
        />
      )}

      {step === "review" && (
        <ReviewStep
          userName={registeredName}
          selectedSkills={selectedSkills}
          experienceLevel={experienceLevel}
          professionalTitle={professionalTitle}
          tagLine={tagLine}
          bio={bio}
          onBioChange={setBio}
          categoryLabel={
            allCategories.find((c) => c.id === selectedCategory)?.label ?? "Not selected"
          }
          selectedFormats={selectedFormats}
          selectedLengths={selectedLengths}
          formatPrices={formatPrices}
          stepCompletion={stepCompletion}
          onStepCompleteChange={handleStepCompleteChange}
          onBack={handleBackToAvailability}
          onSubmit={handleReviewContinue}
          onJumpToStep={(targetStep) => {
            setStep(targetStep);
          }}
          onProgressStepClick={handleJumpToStepNumber}
        />
      )}

      {step === "success" && (
        <SuccessStep userName={registeredName} profilePhotoSrc={profilePhotoSrc} />
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
