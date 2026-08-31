"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Lightbulb,
  LineChart,
  Scale,
  Coins,
  Heart,
} from "lucide-react";
import styles from "./page.module.css";
import WelcomeStep from "@/components/seeker/onboarding/WelcomeStep";
import CategoryStep from "@/components/seeker/onboarding/CategoryStep";
import NeedsStep from "@/components/seeker/onboarding/NeedsStep";
import RegisterStep from "@/components/seeker/onboarding/RegisterStep";
import LoginStep from "@/components/seeker/onboarding/LoginStep";
import OtpStep from "@/components/seeker/onboarding/OtpStep";
import FormatStep from "@/components/seeker/onboarding/FormatStep";
import { getLanguageName } from "@/components/seeker/onboarding/LanguageStep";
import BudgetStep from "@/components/seeker/onboarding/BudgetStep";
import PersonalisationStep from "@/components/seeker/onboarding/PersonalisationStep";
import ReviewStep from "@/components/seeker/onboarding/ReviewStep";
import SuccessStep from "@/components/seeker/onboarding/SuccessStep";
import type {
  ProgressCompletion,
  ProgressStepKey,
} from "@/components/seeker/onboarding/MatchingProgress";
import { getFormatTitle } from "@/components/seeker/onboarding/preferencesData";
import {
  buildSeekerProgressCompletion,
  isSeekerOnboardingStep,
  type SeekerOnboardingStepKey,
} from "@/components/seeker/onboarding/seekerOnboardingSteps";
import {
  getSeekerProfile,
  submitSeekerOnboarding,
  updateSeekerOnboarding,
  type AuthResponse,
  type AuthUser,
  type UpdateSeekerOnboardingPayload,
} from "@/lib/api";
import {
  clearPendingSeekerOtpSession,
  clearSeekerAuthOnly,
  clearSeekerAuthSession,
  getSeekerPostAuthDestination,
  getStoredSeekerUser,
  isSeekerAuthenticated,
  persistSeekerAuthSession,
  readPendingSeekerOtpSession,
  savePendingSeekerOtpSession,
} from "@/lib/seekerAuth";

const categories = [
  { id: "career-work", label: "Career & Work", icon: Briefcase },
  { id: "legal-compliance", label: "Legal & Compliance", icon: Scale },
  { id: "business-entrepreneurship", label: "Business & Entrepreneurship", icon: LineChart },
  { id: "personal-growth", label: "Personal Growth", icon: Heart },
  { id: "finance-investment", label: "Finance & Investment", icon: Coins },
  { id: "software", label: "Software & Development", icon: Briefcase },
  { id: "design", label: "Design & Creative", icon: Briefcase },
  { id: "business", label: "Business & Consulting", icon: Briefcase },
  { id: "marketing", label: "Marketing & Growth", icon: Briefcase },
  { id: "finance", label: "Finance & Tax", icon: Briefcase },
  { id: "health", label: "Health & Wellness", icon: Briefcase },
  { id: "legal", label: "Legal & Founder Contracts", icon: Briefcase },
  { id: "product", label: "Product Management", icon: Briefcase },
  { id: "data", label: "Data & Analytics", icon: Briefcase },
  { id: "other-not-sure", label: "Other", icon: Lightbulb },
];

const topicsByCategory: Record<string, string[]> = {
  "career-work": [
    "Job Interview Prep",
    "Resume Review",
    "Salary Negotiation",
    "Leadership Skills",
    "Career Pivot",
    "Work-Life Balance",
    "Executive Coaching",
    "Remote Work",
    "Networking",
    "Personal Branding",
    "Promotion Strategy",
    "Burnout Recovery",
    "Skill Gap Analysis",
    "Portfolio Building",
    "LinkedIn Optimization",
    "Public Speaking",
    "Time Management",
    "Team Building",
    "Conflict Resolution",
    "Freelancing",
  ],
  "business-entrepreneurship": [
    "Startup strategy",
    "Go-to-market planning",
    "Fundraising",
    "Operations management",
    "Pricing strategy",
    "Growth planning",
  ],
  "personal-growth": [
    "Mindset coaching",
    "Habit building",
    "Confidence",
    "Life direction",
    "Stress management",
    "Work-life balance",
  ],
  "legal-compliance": [
    "Contract review",
    "Founder agreements",
    "Compliance requirements",
    "IP basics",
    "Risk management",
    "Regulatory guidance",
  ],
  "finance-investment": [
    "Budgeting",
    "Financial planning",
    "Investing basics",
    "Cashflow management",
    "Taxes",
    "Fundraising readiness",
  ],
  "other": [
    "Help me figure out what I need",
    "General mentorship",
    "Exploration session",
    "Clarity conversation",
    "Choosing the right category",
  ],
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

const featuredTopicsByCategory: Partial<Record<string, string[]>> = {
  "career-work": [
    "Job Interview Prep",
    "Leadership Skills",
    "Career Pivot",
    "Networking",
  ],
};



function getFeaturedTopics(categoryId: string, topics: string[]): string[] {
  const curated = featuredTopicsByCategory[categoryId];
  if (curated) {
    return curated.filter((topic) => topics.includes(topic)).slice(0, 4);
  }

  return topics.slice(0, 4);
}

type OnboardingStep =
  | "welcome"
  | "category"
  | "topics"
  | "needs"
  | "format"
  | "budget"
  | "personalisation"
  | "review"
  | "register"
  | "login"
  | "otp"
  | "success";

function SeekerOnboardingPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("register");
  const [editReturnStep, setEditReturnStep] = useState<OnboardingStep | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [needsSubject, setNeedsSubject] = useState<string>("");
  const [needsText, setNeedsText] = useState<string>("");
  const [selectedNeedChips, setSelectedNeedChips] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [profilePhotoSrc, setProfilePhotoSrc] = useState("/assets/img/manportrait.png");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [location, setLocation] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [customTopics, setCustomTopics] = useState<Record<string, string[]>>({});
  const [customCategories, setCustomCategories] = useState<(typeof categories[number])[]>([]);
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [seekerId, setSeekerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [stepSaveError, setStepSaveError] = useState<string | null>(null);

  const [prefilledLoginEmail, setPrefilledLoginEmail] = useState("");

  function hydrateSeekerFromProfile(data: Record<string, unknown>) {
    if (data.id && typeof data.id === "string") setSeekerId(data.id);
    if (data.fullName && typeof data.fullName === "string") setRegisteredName(data.fullName);
    if (data.email && typeof data.email === "string") setRegisteredEmail(data.email);
    if (data.phone && typeof data.phone === "string") setRegisteredPhone(data.phone);

    if (data.selectedCategory && typeof data.selectedCategory === "string") {
      const savedCat = data.selectedCategory;
      const knownCat = categories.find(
        (c) => c.id === savedCat || c.label.toLowerCase() === savedCat.toLowerCase(),
      );
      if (knownCat) {
        setSelectedCategory(knownCat.id);
      } else {
        const customId = `custom-${savedCat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "category"}`;
        setCustomCategories((prev) => {
          if (prev.some((c) => c.id === customId || c.label === savedCat)) return prev;
          return [...prev, { id: customId, label: savedCat, icon: Briefcase }];
        });
        setSelectedCategory(customId);
      }
    }

    if (Array.isArray(data.selectedTopics)) {
      setSelectedTopics(data.selectedTopics.map(String));
    }
    if (typeof data.needsText === "string") setNeedsText(data.needsText);
    if (Array.isArray(data.selectedNeedChips)) {
      setSelectedNeedChips(data.selectedNeedChips.map(String));
    }
    if (Array.isArray(data.selectedFormats)) {
      setSelectedFormats(data.selectedFormats.map(String));
    }
    if (typeof data.selectedBudget === "string") setSelectedBudget(data.selectedBudget);
    if (Array.isArray(data.selectedLanguages)) {
      setSelectedLanguages(data.selectedLanguages.map(String));
    }
    if (typeof data.location === "string") setLocation(data.location);
    if (typeof data.additionalContext === "string") setAdditionalContext(data.additionalContext);
    if (typeof data.profilePhotoSrc === "string" && data.profilePhotoSrc) {
      setProfilePhotoSrc(data.profilePhotoSrc);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    const flow = params.get("flow");
    const resume = params.get("resume");

    if (auth === "login") {
      clearPendingSeekerOtpSession();
      clearSeekerAuthSession();
      queueMicrotask(() => setStep("login"));
      return;
    }

    if (flow === "signup" || auth === "register" || auth === "signup") {
      clearPendingSeekerOtpSession();
      clearSeekerAuthSession();
      queueMicrotask(() => handleSwitchToRegister());
      return;
    }

    if (resume === "otp") {
      const pendingOtp = readPendingSeekerOtpSession();
      if (pendingOtp) {
        queueMicrotask(() => {
          setSeekerId(pendingOtp.seekerId);
          setRegisteredEmail(pendingOtp.email);
          setRegisteredPhone(pendingOtp.phone);
          if (pendingOtp.fullName) setRegisteredName(pendingOtp.fullName);
          setStep("otp");
        });
        return;
      }
    }

    if (resume === "category" && isSeekerAuthenticated()) {
      clearPendingSeekerOtpSession();
      const storedUser = getStoredSeekerUser();
      if (storedUser) {
        hydrateSeekerFromProfile(storedUser as unknown as Record<string, unknown>);
        const dest = getSeekerPostAuthDestination(storedUser);
        if (typeof dest === "string" && dest.startsWith("/")) {
          window.location.assign(dest);
          return;
        }
        setStep(dest as OnboardingStep);
      }
      return;
    }

    const stepParam = params.get("step");
    if (stepParam && isSeekerAuthenticated()) {
      clearPendingSeekerOtpSession();
      const storedUser = getStoredSeekerUser();
      if (storedUser) {
        hydrateSeekerFromProfile(storedUser as unknown as Record<string, unknown>);
      }
      setStep(stepParam as OnboardingStep);
      return;
    }

    // Default for unauthenticated signup / initial visit: clear any old session and show register step
    clearSeekerAuthSession();
    clearPendingSeekerOtpSession();
    queueMicrotask(() => handleSwitchToRegister());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let targetQuery = "";
    if (step === "register") {
      targetQuery = "?flow=signup";
    } else if (step === "login") {
      return; // login redirects to /login?role=user
    } else if (step === "otp") {
      targetQuery = "?resume=otp";
    } else {
      targetQuery = `?step=${encodeURIComponent(step)}`;
    }
    const targetUrl = `/seeker/seeker-onboarding/${targetQuery}`;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [step]);

  const handleStartJourney = () => {
    setStep("register");
  };

  const saveStepAndContinue = async (
    payload: UpdateSeekerOnboardingPayload,
    nextStep: OnboardingStep,
  ) => {
    if (isSavingStep) return;

    setIsSavingStep(true);
    setStepSaveError(null);
    try {
      await updateSeekerOnboarding(payload);
      setStep(nextStep);
    } catch (error) {
      setStepSaveError(
        error instanceof Error ? error.message : "Unable to save this step. Please try again.",
      );
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleCategoryContinue = async () => {
    await saveStepAndContinue(
      {
        step: "needs",
        selectedCategory,
        selectedTopics,
      },
      "needs",
    );
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
        setSelectedTopics([]);
      }
      return;
    }

    setCustomCategories((prev) => [...prev, { id, label: trimmed, icon: Briefcase }]);
    setSelectedCategory(id);
    setSelectedTopics([]);
  };

  const allCategories = [...categories, ...customCategories];

  const handleRemoveCustomCategory = (id: string) => {
    setCustomCategories((prev) => prev.filter((cat) => cat.id !== id));
    if (selectedCategory === id) {
      setSelectedCategory("");
      setSelectedTopics([]);
    }
  };

  const handleBackToCategoryFromEdit = () => {
    if (!editReturnStep) return;
    setStep(editReturnStep);
    setEditReturnStep(null);
  };

  const handleBackToCategory = () => {
    setStep("category");
  };

  const handleTopicsContinue = () => {
    setStep("needs");
  };

  const handleBackToTopics = () => {
    setStep("topics");
  };

  const handleNeedsContinue = async () => {
    await saveStepAndContinue(
      {
        step: "format",
        needsText,
        selectedNeedChips,
      },
      "format",
    );
  };

  const handleBackToNeeds = () => {
    setStep("needs");
  };

  const handleFormatContinue = async () => {
    await saveStepAndContinue(
      {
        step: "budget",
        selectedFormats,
      },
      "budget",
    );
  };

  const handleBudgetContinue = async () => {
    await saveStepAndContinue(
      {
        step: "personalisation",
        selectedBudget,
      },
      "personalisation",
    );
  };

  const handlePersonalisationContinue = async () => {
    await saveStepAndContinue(
      {
        step: "review",
        selectedLanguages,
        location,
        additionalContext,
        profilePhotoSrc,
      },
      "review",
    );
  };

  const handleReviewContinue = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await submitSeekerOnboarding({
        selectedCategory,
        selectedTopics,
        needsText,
        selectedNeedChips,
        selectedFormats,
        selectedBudget,
        selectedLanguages,
        location,
        additionalContext,
        profilePhotoSrc,
        onboardingMetadata: {
          source: "seeker-onboarding",
        },
      });
      setStep("success");
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Unable to complete onboarding. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToPersonalisation = () => {
    setStep("personalisation");
  };

  const handleEditStep = (stepName: OnboardingStep) => {
    setEditReturnStep("review");
    setStep(stepName);
  };

  const handleBackToBudget = () => {
    setStep("budget");
  };

  const handleBackToFormat = () => {
    setStep("format");
  };

  const handleRegisterComplete = ({
    seekerId: nextSeekerId,
    phone,
    fullName,
    email,
  }: {
    seekerId: string;
    phone: string;
    fullName: string;
    email: string;
  }) => {
    savePendingSeekerOtpSession({
      seekerId: nextSeekerId,
      phone,
      email,
      fullName,
    });
    setSeekerId(nextSeekerId);
    setRegisteredPhone(phone);
    setRegisteredEmail(email);
    setRegisteredName(fullName);
    setStep("otp");
    clearSeekerAuthOnly();
  };

  const handleLoginRequiresOtp = ({
    seekerId: nextSeekerId,
    email,
    phone,
    fullName,
  }: {
    seekerId: string;
    email: string;
    phone: string;
    fullName?: string;
  }) => {
    savePendingSeekerOtpSession({
      seekerId: nextSeekerId,
      email,
      phone,
      fullName,
    });
    setSeekerId(nextSeekerId);
    setRegisteredEmail(email);
    setRegisteredPhone(phone);
    if (fullName) setRegisteredName(fullName);
    setStep("otp");
    clearSeekerAuthOnly();
  };

  const handleAuthSuccess = (response: AuthResponse) => {
    persistSeekerAuthSession(response);
    if (response.user.fullName) setRegisteredName(response.user.fullName);
    if (response.user.email) setRegisteredEmail(response.user.email);
    if (response.user.phone) setRegisteredPhone(response.user.phone);
    hydrateSeekerFromProfile(response.user as unknown as Record<string, unknown>);

    const destination = getSeekerPostAuthDestination(response.user);
    if (typeof destination === "string" && destination.startsWith("/")) {
      window.location.assign(destination);
      return;
    }

    setStep(destination as OnboardingStep);
  };

  const handleLoginComplete = (response: AuthResponse) => {
    clearPendingSeekerOtpSession();
    handleAuthSuccess(response);
  };

  const handleOtpComplete = (response: AuthResponse) => {
    clearPendingSeekerOtpSession();
    handleAuthSuccess(response);
  };

  const handleBackToRegister = () => {
    setStep("register");
    router.replace("/seeker/seeker-onboarding/?flow=signup");
  };

  const handleBackFromCategory = () => {
    if (editReturnStep) {
      handleBackToCategoryFromEdit();
      return;
    }

    setStep("register");
    router.replace("/seeker/seeker-onboarding/?flow=signup");
  };

  const handleSwitchToRegister = () => {
    clearPendingSeekerOtpSession();
    clearSeekerAuthSession();
    setSelectedCategory("");
    setSelectedTopics([]);
    setNeedsText("");
    setSelectedNeedChips([]);
    setSelectedFormats([]);
    setSelectedLanguages([]);
    setProfilePhotoSrc("/assets/img/manportrait.png");
    setSelectedBudget("");
    setLocation("");
    setAdditionalContext("");
    setCustomTopics({});
    setCustomCategories([]);
    setRegisteredPhone("");
    setRegisteredEmail("");
    setRegisteredName("");
    setSeekerId("");
    setIsSubmitting(false);
    setSubmissionError(null);
    setStepSaveError(null);
    setStep("register");
    router.replace("/seeker/seeker-onboarding/?flow=signup");
  };

  const handleSwitchToLogin = (email?: string) => {
    clearPendingSeekerOtpSession();
    const loginUrl = email
      ? `/login?role=user&email=${encodeURIComponent(email)}`
      : "/login?role=user";
    router.push(loginUrl);
  };

  const handleToggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      if (selectedTopics.length < 5) {
        setSelectedTopics([...selectedTopics, topic]);
      } else {
        setSelectedTopics([...selectedTopics.slice(0, -1), topic]);
      }
    }
  };

  const handleAddCustomTopic = (topic: string) => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    const categoryCustomList = customTopics[selectedCategory] || [];
    if (!categoryCustomList.includes(trimmed)) {
      setCustomTopics({
        ...customTopics,
        [selectedCategory]: [...categoryCustomList, trimmed],
      });
    }

    if (!selectedTopics.includes(trimmed)) {
      if (selectedTopics.length < 5) {
        setSelectedTopics([...selectedTopics, trimmed]);
      } else {
        setSelectedTopics([...selectedTopics.slice(0, -1), trimmed]);
      }
    }
  };

  const activeCategoryInfo = allCategories.find((c) => c.id === selectedCategory);
  const activeCategoryLabel = activeCategoryInfo ? activeCategoryInfo.label : "";
  const baseTopics = topicsByCategory[selectedCategory] || [];
  const activeCustomTopics = customTopics[selectedCategory] || [];
  const featuredTopics = getFeaturedTopics(selectedCategory, baseTopics);



  const getFormatLabel = () => {
    if (selectedFormats.length === 0) return "Not selected";
    return selectedFormats.map((id) => getFormatTitle(id)).join(", ");
  };

  const getLanguageLabel = () => {
    if (selectedLanguages.length === 0) return "Not selected";
    return selectedLanguages.map((id) => getLanguageName(id)).join(", ");
  };

  const getBudgetLabel = () => {
    if (selectedBudget === "budget") return "Budget-Friendly";
    if (selectedBudget === "standard") return "Standard";
    if (selectedBudget === "premium") return "Premium";
    if (selectedBudget === "elite") return "Elite";
    return selectedBudget;
  };

  const getBudgetPriceText = () => {
    if (selectedBudget === "budget") return "₹500–₹2,500";
    if (selectedBudget === "standard") return "₹2,500–₹8,000";
    if (selectedBudget === "premium") return "₹8,000–₹20,000";
    if (selectedBudget === "elite") return "₹20,000+";
    return "";
  };



  const progressDataCompletion = {
    category: Boolean(selectedCategory),
    needs: needsText.trim().length > 0,
    format: selectedFormats.length > 0,
    budget: Boolean(selectedBudget),
    personalisation: selectedLanguages.length > 0,
  };

  const progressAnchorStep: SeekerOnboardingStepKey | "success" =
    step === "success"
      ? "success"
      : isSeekerOnboardingStep(step)
        ? step
        : "category";

  const progressCompletion: ProgressCompletion = buildSeekerProgressCompletion(
    progressAnchorStep,
    progressDataCompletion,
  );



  const seekerDisplayName = registeredName || "";

  const handleProgressStepClick = (targetStep: ProgressStepKey) => {
    if (step === "review") {
      setEditReturnStep("review");
    } else {
      setEditReturnStep(null);
    }
    setStep(targetStep);
  };

  return (
    <main className={styles.pageContainer}>
      {stepSaveError ? (
        <p className={styles.stepSaveError} role="alert">
          {stepSaveError}
        </p>
      ) : null}
      <div className={styles.bgWrapper}>
        <img
          src="/assets/img/hero-bg.png"
          alt=""
          className={styles.bgImage}
          role="presentation"
        />
        <div className={styles.bgOverlay} />
      </div>

      {step === "welcome" && (
        <WelcomeStep onStart={handleStartJourney} />
      )}

      {step === "category" && (
        <CategoryStep
          userName={seekerDisplayName}
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            setSelectedTopics([]);
          }}
          onAddCustomCategory={handleAddCustomCategory}
          onRemoveCustomCategory={handleRemoveCustomCategory}
          allowCustomCategory={true}
          variant="full"
          onBack={handleBackFromCategory}
          onContinue={handleCategoryContinue}
          progressCompletion={progressCompletion}
          onProgressStepClick={handleProgressStepClick}
        />
      )}

      {step === "needs" && (
        <NeedsStep
          userName={seekerDisplayName}
          subject={needsSubject}
          onChangeSubject={setNeedsSubject}
          step1CategoryOrTopic={selectedTopics.length > 0 ? selectedTopics.join(", ") : (activeCategoryLabel || selectedCategory)}
          needsText={needsText}
          onChangeNeedsText={setNeedsText}
          selectedNeedChips={selectedNeedChips}
          onSelectedNeedChipsChange={setSelectedNeedChips}
          onBack={handleBackToCategory}
          onContinue={handleNeedsContinue}
          progressCompletion={progressCompletion}
          onProgressStepClick={handleProgressStepClick}
        />
      )}

      {step === "format" && (
        <FormatStep
          userName={seekerDisplayName}
          selectedFormats={selectedFormats}
          onSelectedFormatsChange={setSelectedFormats}
          onBack={handleBackToNeeds}
          onContinue={handleFormatContinue}
          progressCompletion={progressCompletion}
          onProgressStepClick={handleProgressStepClick}
        />
      )}

      {step === "budget" && (
        <BudgetStep
          userName={seekerDisplayName}
          selectedBudget={selectedBudget}
          onSelectBudget={setSelectedBudget}
          onBack={handleBackToFormat}
          onContinue={handleBudgetContinue}
          progressCompletion={progressCompletion}
          onProgressStepClick={handleProgressStepClick}
        />
      )}

      {step === "personalisation" && (
        <PersonalisationStep
          userName={seekerDisplayName}
          categoryLabel={activeCategoryLabel}
          needsText={needsText}
          profilePhotoSrc={profilePhotoSrc}
          onProfilePhotoChange={setProfilePhotoSrc}
          selectedLanguages={selectedLanguages}
          onSelectedLanguagesChange={setSelectedLanguages}
          location={location}
          onChangeLocation={setLocation}
          additionalContext={additionalContext}
          onChangeAdditionalContext={setAdditionalContext}
          onBack={handleBackToBudget}
          onContinue={handlePersonalisationContinue}
          progressCompletion={progressCompletion}
          onProgressStepClick={handleProgressStepClick}
        />
      )}

      {step === "review" && (
        <ReviewStep
          userName={seekerDisplayName}
          categoryLabel={activeCategoryLabel}
          needsText={needsText}
          selectedFormatLabel={getFormatLabel()}
          selectedLanguageLabel={getLanguageLabel()}
          selectedBudgetLabel={getBudgetLabel()}
          selectedBudgetPriceText={getBudgetPriceText()}
          profilePhotoSrc={profilePhotoSrc}
          location={location}
          onChangeLocation={setLocation}
          additionalContext={additionalContext}
          onChangeAdditionalContext={setAdditionalContext}
          onEditStep={handleEditStep}
          onBack={handleBackToPersonalisation}
          onContinue={handleReviewContinue}
          isSubmitting={isSubmitting}
          submissionError={submissionError}
          progressCompletion={progressCompletion}
          onProgressStepClick={handleProgressStepClick}
        />
      )}

      {step === "register" && (
        <RegisterStep
          onContinue={handleRegisterComplete}
          onSocialContinue={handleLoginComplete}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}

      {step === "login" && (
        <LoginStep
          onContinue={handleLoginComplete}
          onRequiresOtp={handleLoginRequiresOtp}
          onSwitchToRegister={handleSwitchToRegister}
          initialEmail={prefilledLoginEmail}
        />
      )}

      {step === "otp" && seekerId ? (
        <OtpStep
          seekerId={seekerId}
          phone={registeredPhone}
          email={registeredEmail}
          onBack={handleBackToRegister}
          onContinue={handleOtpComplete}
        />
      ) : null}

      {step === "otp" && !seekerId ? (
        <section className={styles.pageContainer}>
          <p>Verification session expired. Please register again to receive a new code.</p>
          <button type="button" onClick={handleBackToRegister}>
            Back to Register
          </button>
        </section>
      ) : null}

      {step === "success" && (
        <SuccessStep
          userName={seekerDisplayName}
          selectedCategory={selectedCategory}
          selectedTopics={selectedTopics}
        />
      )}
    </main>
  );
}

export default function SeekerOnboardingPage() {
  return <SeekerOnboardingPageContent />;
}
