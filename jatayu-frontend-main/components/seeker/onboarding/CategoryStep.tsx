"use client";

import { useRef, useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { Info, Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import MatchingProgress from "./MatchingProgress";
import type { ProgressCompletion, ProgressStepKey } from "./MatchingProgress";
import RegisterLeftPanel from "./RegisterLeftPanel";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import register from "./register.shared.module.css";
import styles from "./CategoryStep.module.css";
type CategoryOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type { CategoryOption };

export const OTHER_CATEGORY_ID = "other-not-sure";

function isCustomCategory(id: string) {
  return id.startsWith("custom-");
}

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

function isOtherCategoryReady(selectedCategory: string, otherInput: string) {
  return selectedCategory !== OTHER_CATEGORY_ID || Boolean(otherInput.trim());
}

function showCategorySelectedTip(selectedCategory: string) {
  return Boolean(selectedCategory) && selectedCategory !== OTHER_CATEGORY_ID;
}

type CategoryStepProps = {
  userName: string;
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onAddCustomCategory: (label: string) => void;
  onRemoveCustomCategory?: (id: string) => void;
  allowCustomCategory?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  variant?: "full" | "signup";
  onSwitchToLogin?: () => void;
  progressCompletion?: ProgressCompletion;
  onProgressStepClick?: (step: ProgressStepKey) => void;
};

export function CategoryFields({
  categories,
  selectedCategory,
  onSelectCategory,
  newCategoryInput,
  setNewCategoryInput,
  onAddCustomCategory,
  onRemoveCustomCategory,
  showCustomInput,
}: {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  newCategoryInput: string;
  setNewCategoryInput: (value: string) => void;
  onAddCustomCategory: (label: string) => void;
  onRemoveCustomCategory?: (id: string) => void;
  showCustomInput: boolean;
}) {
  const otherInputRef = useRef<HTMLInputElement>(null);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (selectedCategory === OTHER_CATEGORY_ID && showInput) {
      otherInputRef.current?.focus();
    }
  }, [selectedCategory, showInput]);

  const handleSelectCategory = (catId: string, isSelected: boolean) => {
    if (isSelected) {
      if (catId === OTHER_CATEGORY_ID) {
        setNewCategoryInput("");
      }
      onSelectCategory("");
      return;
    }

    if (catId !== OTHER_CATEGORY_ID) {
      setNewCategoryInput("");
    }
    onSelectCategory(catId);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxCustomReached) return;
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      onAddCustomCategory(trimmed);
      setNewCategoryInput("");
      setShowInput(false);
    }
  };

  const handleCustomBlur = () => {
    if (isMaxCustomReached) {
      setShowInput(false);
      return;
    }
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      onAddCustomCategory(trimmed);
      setNewCategoryInput("");
    }
    setShowInput(false);
  };

  // Filter out the custom/other category from the alphabetical list
  const predefinedCategories = categories.filter((cat) => cat.id !== OTHER_CATEGORY_ID && !isCustomCategory(cat.id));
  const customCategories = categories.filter((cat) => isCustomCategory(cat.id));
  const isMaxCustomReached = customCategories.length >= 1;

  const grouped = predefinedCategories.reduce((acc, cat) => {
    const label = cat.label.trim();
    if (!label) return acc;
    const firstChar = label[0].toUpperCase();
    const isLetter = /^[A-Z]$/.test(firstChar);
    const key = isLetter ? firstChar : "#";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.label.localeCompare(b.label));
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const activeLetters = new Set(Object.keys(grouped));

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedCategoryLabel = selectedCategoryObj ? selectedCategoryObj.label : "";
  const lookupKey = selectedCategory === OTHER_CATEGORY_ID ? "other" : selectedCategory;
  const topicsText = (topicsByCategory[lookupKey] || []).join(", ");

  return (
    <div className={styles.directoryWrapper}>
      <div className={styles.alphabetBar}>
        {alphabet.map((letter) => {
          const isActive = activeLetters.has(letter);
          const scrollToGroup = () => {
            if (isActive) {
              const element = document.getElementById(`group-${letter}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }
          };

          return (
            <button
              key={letter}
              type="button"
              onClick={scrollToGroup}
              disabled={!isActive}
              className={`${styles.alphabetLetter} ${isActive ? styles.alphabetLetterActive : ""
                }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className={styles.groupsContainer}>
        {alphabet.map((letter) => {
          const items = grouped[letter];
          if (!items || items.length === 0) return null;

          return (
            <div key={letter} id={`group-${letter}`} className={styles.groupRow}>
              <div className={styles.letterBadgeWrap}>
                <div className={styles.letterBadge}>{letter}</div>
              </div>

              <div className={styles.groupItems}>
                {items.map((cat) => {
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div className={styles.categoryItemWrapper} key={cat.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(cat.id, isSelected)}
                        className={`${styles.categoryItem} ${isSelected ? styles.categoryItemSelected : ""
                          }`}
                      >
                        <span className={styles.categoryLabelText}>
                          {cat.label}
                        </span>
                      </button>
                      {isSelected && topicsText && (
                        <div className={styles.topicsTooltipBox}>
                          <p className={styles.topicsTooltipText}>{topicsText}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom Category Input Form */}
        {showCustomInput && (
          <div className={styles.customInputContainer}>
            <h3 className={styles.customHeading}>
              Didn&apos;t find what you&apos;re looking for?
            </h3>
            {customCategories.length > 0 && (
              <div className={styles.customChipsList}>
                {customCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <div className={styles.categoryItemWrapper} key={cat.id}>
                      <div
                        className={`${styles.categoryItem} ${styles.categoryItemRemovable} ${
                          isSelected ? styles.categoryItemSelected : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(cat.id, isSelected)}
                          className={styles.categoryItemMain}
                        >
                          <span className={styles.categoryLabelText}>{cat.label}</span>
                        </button>
                        {onRemoveCustomCategory && (
                          <button
                            type="button"
                            className={styles.categoryRemoveBtn}
                            aria-label={`Remove ${cat.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCustomCategory(cat.id);
                            }}
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!isMaxCustomReached && showInput ? (
              <div
                className={`${styles.categoryItem} ${
                  selectedCategory === OTHER_CATEGORY_ID ? styles.categoryItemSelected : ""
                } ${styles.categoryItemInput}`}
              >
                <form onSubmit={handleCustomSubmit} className={styles.categoryInputForm}>
                  <input
                    ref={otherInputRef}
                    type="text"
                    className={styles.categoryInlineInput}
                    placeholder="Enter your custom domain..."
                    value={newCategoryInput}
                    onChange={(e) => {
                      setNewCategoryInput(e.target.value);
                    }}
                    onBlur={handleCustomBlur}
                    autoFocus
                    aria-label="Custom category"
                  />
                  <button
                    type="submit"
                    className={styles.categoryAddBtn}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="Add custom category"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </form>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!isMaxCustomReached) {
                    setShowInput(true);
                  }
                }}
                disabled={isMaxCustomReached}
                className={`${styles.categoryItem} ${
                  isMaxCustomReached ? styles.categoryItemDisabled : ""
                }`}
              >
                <Plus size={14} />
                <span>Add custom</span>
              </button>
            )}
            {isMaxCustomReached && (
              <p className={styles.customLimitMessage}>
                <Info size={14} className={styles.infoIcon} aria-hidden="true" />
                <span>Only one entry is allowed. Delete to make another</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryStep({
  userName,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCustomCategory,
  onRemoveCustomCategory,
  allowCustomCategory = true,
  onBack,
  onContinue,
  variant = "full",
  onSwitchToLogin,
  progressCompletion,
  onProgressStepClick,
}: CategoryStepProps) {
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const handleContinue = () => {
    if (selectedCategory === OTHER_CATEGORY_ID && newCategoryInput.trim()) {
      onAddCustomCategory(newCategoryInput.trim());
    }
    onContinue();
  };

  const canContinue =
    Boolean(selectedCategory) && isOtherCategoryReady(selectedCategory, newCategoryInput);

  if (variant === "signup") {
    return (
      <section className={register.registerCard}>
        <RegisterLeftPanel />

        <div className={`${register.registerRight} ${styles.signupRight}`}>
          <h1 className={shared.questionTitle}>
            What do you <span className={shared.accentWord}>NEED</span> help with?
          </h1>

          <p className={shared.questionSubtitle}>
            Select the area where you&apos;re looking for expert guidance.
          </p>

          <CategoryFields
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            newCategoryInput={newCategoryInput}
            setNewCategoryInput={setNewCategoryInput}
            onAddCustomCategory={onAddCustomCategory}
            onRemoveCustomCategory={onRemoveCustomCategory}
            showCustomInput={allowCustomCategory}
          />

          <div className={styles.signupActions}>
            <ContinueButton
              className={styles.signupContinueBtn}
              onClick={handleContinue}
              disabled={!canContinue}
            />
          </div>

        </div>
      </section>
    );
  }

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        {progressCompletion && onProgressStepClick && (
          <MatchingProgress
            currentStep="category"
            completion={progressCompletion}
            onStepClick={onProgressStepClick}
          />
        )}
      </div>

      <div className={`${shared.cardBody} ${styles.categoryCardBody}`}>
        <h1 className={shared.questionTitle}>
          What <span className={shared.accentWord}>CATEGORY</span> do you need help with?
        </h1>

        <p className={shared.questionSubtitle}>
          Select the area where you&apos;re looking for expert guidance.
        </p>

        <CategoryFields
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          newCategoryInput={newCategoryInput}
          setNewCategoryInput={setNewCategoryInput}
          onAddCustomCategory={onAddCustomCategory}
          onRemoveCustomCategory={onRemoveCustomCategory}
          showCustomInput={allowCustomCategory}
        />
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Guide Advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            {showCategorySelectedTip(selectedCategory) ? (
              <>
                <strong>Domain selected!</strong>
                <small>
                  Great choice! We have many experts in this category.
                </small>
              </>
            ) : (
              <>
                <strong>Select a domain</strong>
                <small>This narrows down the ideal pool of matches.</small>
              </>
            )}
          </div>
        </div>

        <div className={shared.footerActions}>
          {onBack && (
            <button type="button" className={shared.textBtn} onClick={onBack}>
              Back
            </button>
          )}
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton onClick={handleContinue} disabled={!canContinue} />
        </div>
      </div>
    </section>
  );
}
