"use client";

import { Suspense, useEffect, useState } from "react";
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
import WelcomeStep from "@/components/seeker/onboarding/WelcomeStep";
import CategoryStep from "@/components/seeker/onboarding/CategoryStep";
import TopicsStep from "@/components/seeker/onboarding/TopicsStep";
import NeedsStep from "@/components/seeker/onboarding/NeedsStep";
import OutcomeStep from "@/components/seeker/onboarding/OutcomeStep";
import UrgencyStep from "@/components/seeker/onboarding/UrgencyStep";
import RegisterStep from "@/components/seeker/onboarding/RegisterStep";
import LoginStep from "@/components/seeker/onboarding/LoginStep";
import OtpStep from "@/components/seeker/onboarding/OtpStep";
import FormatStep from "@/components/seeker/onboarding/FormatStep";
import LanguageStep from "@/components/seeker/onboarding/LanguageStep";
import BudgetStep from "@/components/seeker/onboarding/BudgetStep";
import PersonalisationStep from "@/components/seeker/onboarding/PersonalisationStep";
import ReviewStep from "@/components/seeker/onboarding/ReviewStep";
import SuccessStep from "@/components/seeker/onboarding/SuccessStep";

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

const topicsByCategory: Record<string, string[]> = {
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
  | "welcome"
  | "category"
  | "topics"
  | "needs"
  | "outcome"
  | "urgency"
  | "format"
  | "language"
  | "budget"
  | "personalisation"
  | "review"
  | "register"
  | "login"
  | "otp"
  | "success";

function SeekerOnboardingPageContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<OnboardingStep>("register");
  const [selectedCategory, setSelectedCategory] = useState<string>("business");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [needsText, setNeedsText] = useState<string>("");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("clarity");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedUrgency, setSelectedUrgency] = useState<string>("thisweek");
  const [selectedFormat, setSelectedFormat] = useState<string>("chat");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedBudget, setSelectedBudget] = useState<string>("standard");
  const [budgetValue, setBudgetValue] = useState<number>(50);
  const [firstName, setFirstName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("collaborative");
  const [ageRange, setAgeRange] = useState("");
  const [location, setLocation] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [customTopics, setCustomTopics] = useState<Record<string, string[]>>({});
  const [customCategories, setCustomCategories] = useState<(typeof categories[number])[]>([]);
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login") {
      setStep("login");
    }
  }, [searchParams]);

  const handleStartJourney = () => {
    setStep("category");
  };

  const handleCategoryContinue = () => {
    setStep("topics");
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

  const handleBackToWelcome = () => {
    setStep("register");
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

  const handleNeedsContinue = () => {
    setStep("outcome");
  };

  const handleBackToNeeds = () => {
    setStep("needs");
  };

  const handleOutcomeContinue = () => {
    setStep("urgency");
  };

  const handleBackToOutcome = () => {
    setStep("outcome");
  };

  const handleUrgencyContinue = () => {
    setStep("format");
  };

  const handleFormatContinue = () => {
    setStep("language");
  };

  const handleLanguageContinue = () => {
    setStep("budget");
  };

  const handleBudgetContinue = () => {
    setStep("personalisation");
  };

  const handlePersonalisationContinue = () => {
    setStep("review");
  };

  const handleReviewContinue = () => {
    setStep("success");
  };

  const handleBackToPersonalisation = () => {
    setStep("personalisation");
  };

  const handleEditStep = (stepName: OnboardingStep) => {
    setStep(stepName);
  };

  const handleBackToBudget = () => {
    setStep("budget");
  };

  const handleBackToLanguage = () => {
    setStep("language");
  };

  const handleBackToFormat = () => {
    setStep("format");
  };

  const handleBackToUrgency = () => {
    setStep("urgency");
  };

  const handleRegisterComplete = ({
    phone,
    fullName,
    email,
  }: {
    phone: string;
    fullName: string;
    email: string;
  }) => {
    setRegisteredPhone(phone);
    setRegisteredEmail(email);
    setRegisteredName(fullName);
    setStep("otp");
  };

  const handleLoginComplete = ({ email }: { email: string }) => {
    const nameFromEmail = email.split("@")[0]?.replace(/[._-]+/g, " ") || "Seeker";
    setRegisteredName(nameFromEmail);
    setStep("category");
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

  const handleSwitchToLogin = () => {
    setStep("login");
  };

  const handleToggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      if (selectedTopics.length < 5) {
        setSelectedTopics([...selectedTopics, topic]);
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

    if (!selectedTopics.includes(trimmed) && selectedTopics.length < 5) {
      setSelectedTopics([...selectedTopics, trimmed]);
    }
  };

  const activeCategoryInfo = allCategories.find((c) => c.id === selectedCategory);
  const activeCategoryLabel = activeCategoryInfo ? activeCategoryInfo.label : "";
  const baseTopics = topicsByCategory[selectedCategory] || [];
  const activeCustomTopics = customTopics[selectedCategory] || [];
  const currentTopicsList = [...baseTopics, ...activeCustomTopics].slice(0, 9);

  const getOutcomeLabel = () => {
    if (selectedOutcome === "clarity") return "Clarity & Direction";
    if (selectedOutcome === "plan") return "Quick Actionable Plan";
    if (selectedOutcome === "knowledge") return "Deep Knowledge";
    if (selectedOutcome === "accountability") return "Accountability & Support";
    if (selectedOutcome === "resolved") return "Problem Solved";
    if (selectedOutcome === "transformation") return "Long-term Transformation";
    return selectedOutcome;
  };

  const getUrgencyLabel = () => {
    if (selectedUrgency === "rightnow") return "Right Now";
    if (selectedUrgency === "thisweek") return "This Week";
    if (selectedUrgency === "thismonth") return "This Month";
    if (selectedUrgency === "exploring") return "Just Exploring";
    return selectedUrgency;
  };

  const getFormatLabel = () => {
    if (selectedFormat === "chat") return "Live Chat";
    if (selectedFormat === "video") return "Video Call";
    if (selectedFormat === "phone") return "Phone Call";
    if (selectedFormat === "async") return "Async Messages";
    return selectedFormat;
  };

  const getLanguageLabel = () => {
    if (selectedLanguage === "english") return "English";
    if (selectedLanguage === "french") return "French";
    if (selectedLanguage === "german") return "German";
    if (selectedLanguage === "spanish") return "Spanish";
    if (selectedLanguage === "portuguese") return "Portuguese";
    if (selectedLanguage === "italian") return "Italian";
    if (selectedLanguage === "mandarin") return "Mandarin";
    if (selectedLanguage === "japanese") return "Japanese";
    if (selectedLanguage === "korean") return "Korean";
    if (selectedLanguage === "arabic") return "Arabic";
    if (selectedLanguage === "russian") return "Russian";
    if (selectedLanguage === "hindi") return "Hindi";
    return selectedLanguage;
  };

  const getBudgetLabel = () => {
    if (selectedBudget === "budget") return "Budget-Friendly";
    if (selectedBudget === "standard") return "Standard";
    if (selectedBudget === "premium") return "Premium";
    if (selectedBudget === "elite") return "Elite";
    return selectedBudget;
  };

  return (
    <main className={styles.pageContainer}>
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
          userName={registeredName || "Guest Seeker"}
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            setSelectedTopics([]);
          }}
          onAddCustomCategory={handleAddCustomCategory}
          onBack={handleBackToWelcome}
          onContinue={handleCategoryContinue}
        />
      )}

      {step === "topics" && (
        <TopicsStep
          userName={registeredName || "Guest Seeker"}
          activeCategoryLabel={activeCategoryLabel}
          currentTopicsList={currentTopicsList}
          selectedTopics={selectedTopics}
          onToggleTopic={handleToggleTopic}
          onAddCustomTopic={handleAddCustomTopic}
          onBack={handleBackToCategory}
          onContinue={handleTopicsContinue}
        />
      )}

      {step === "needs" && (
        <NeedsStep
          userName={registeredName || "Guest Seeker"}
          needsText={needsText}
          onChangeNeedsText={setNeedsText}
          onBack={handleBackToTopics}
          onContinue={handleNeedsContinue}
        />
      )}

      {step === "outcome" && (
        <OutcomeStep
          userName={registeredName || "Guest Seeker"}
          selectedOutcome={selectedOutcome}
          onSelectOutcome={setSelectedOutcome}
          selectedExtras={selectedExtras}
          onToggleExtra={(extra) => {
            if (selectedExtras.includes(extra)) {
              setSelectedExtras(selectedExtras.filter((e) => e !== extra));
            } else {
              setSelectedExtras([...selectedExtras, extra]);
            }
          }}
          onBack={handleBackToNeeds}
          onContinue={handleOutcomeContinue}
        />
      )}

      {step === "urgency" && (
        <UrgencyStep
          userName={registeredName || "Guest Seeker"}
          selectedUrgency={selectedUrgency}
          onSelectUrgency={setSelectedUrgency}
          onBack={handleBackToOutcome}
          onContinue={handleUrgencyContinue}
        />
      )}

      {step === "format" && (
        <FormatStep
          userName={registeredName || "Guest Seeker"}
          selectedUrgency={selectedUrgency}
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          onBack={handleBackToUrgency}
          onContinue={handleFormatContinue}
        />
      )}

      {step === "language" && (
        <LanguageStep
          userName={registeredName || "Guest Seeker"}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          onBack={handleBackToFormat}
          onContinue={handleLanguageContinue}
        />
      )}

      {step === "budget" && (
        <BudgetStep
          userName={registeredName || "Guest Seeker"}
          selectedBudget={selectedBudget}
          onSelectBudget={setSelectedBudget}
          budgetValue={budgetValue}
          onChangeBudgetValue={setBudgetValue}
          onBack={handleBackToLanguage}
          onContinue={handleBudgetContinue}
        />
      )}

      {step === "personalisation" && (
        <PersonalisationStep
          userName={registeredName || "Guest Seeker"}
          firstName={firstName}
          onChangeFirstName={setFirstName}
          experienceLevel={experienceLevel}
          onChangeExperienceLevel={setExperienceLevel}
          communicationStyle={communicationStyle}
          onChangeCommunicationStyle={setCommunicationStyle}
          ageRange={ageRange}
          onChangeAgeRange={setAgeRange}
          location={location}
          onChangeLocation={setLocation}
          additionalContext={additionalContext}
          onChangeAdditionalContext={setAdditionalContext}
          onBack={handleBackToBudget}
          onContinue={handlePersonalisationContinue}
        />
      )}

      {step === "review" && (
        <ReviewStep
          userName={registeredName || "Guest Seeker"}
          categoryLabel={activeCategoryLabel}
          selectedTopics={selectedTopics}
          needsText={needsText}
          selectedOutcomeLabel={getOutcomeLabel()}
          selectedUrgencyLabel={getUrgencyLabel()}
          selectedFormatLabel={getFormatLabel()}
          selectedLanguageLabel={getLanguageLabel()}
          selectedBudgetLabel={getBudgetLabel()}
          budgetValue={budgetValue}
          firstName={firstName}
          experienceLevel={experienceLevel}
          communicationStyleLabel={communicationStyle}
          onEditStep={handleEditStep}
          onBack={handleBackToPersonalisation}
          onContinue={handleReviewContinue}
        />
      )}

      {step === "register" && (
        <RegisterStep
          onContinue={handleRegisterComplete}
          onSwitchToLogin={handleSwitchToLogin}
        />
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
          onBack={handleBackToRegister}
          onContinue={handleOtpComplete}
        />
      )}

      {step === "success" && (
        <SuccessStep
          userName={registeredName || "Seeker"}
          selectedCategory={selectedCategory}
          categoryLabel={activeCategoryLabel}
        />
      )}
    </main>
  );
}

export default function SeekerOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <SeekerOnboardingPageContent />
    </Suspense>
  );
}
