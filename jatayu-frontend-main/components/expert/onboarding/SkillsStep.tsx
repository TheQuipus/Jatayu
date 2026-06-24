"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./SkillsStep.module.css";

type SkillsStepProps = {
  userName: string;
  activeCategoryLabel: string;
  currentSkillsList: string[];
  selectedSkills: string[];
  stepCompletion: boolean[];
  onToggleSkill: (skill: string) => void;
  onAddCustomSkill: (skill: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

const MAX_SKILLS = 5;

export default function SkillsStep({
  userName,
  activeCategoryLabel,
  currentSkillsList,
  selectedSkills,
  stepCompletion,
  onToggleSkill,
  onAddCustomSkill,
  onBack,
  onContinue,
  onJumpToStep,
}: SkillsStepProps) {
  const [newSkillInput, setNewSkillInput] = useState<string>("");
  const isCustomInputDisabled = selectedSkills.length >= MAX_SKILLS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCustomInputDisabled) return;
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    onAddCustomSkill(trimmed);
    setNewSkillInput("");
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
      <div className={shared.topHeader}>
        <OnboardingStepTitle userName={userName} />
        <div className={shared.stepPill}>
          <span>Step 2 of 9 - Skills</span>
        </div>
      </div>

      {/* Progress Tracker */}
      <OnboardingProgressBar currentStep={2} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />

      </div>

      <div className={`${shared.cardBody} ${styles.skillsCardBody}`}>
{/* Heading */}
      <h1 className={shared.questionTitle}>
        What are your <span className={shared.accentWord}>specific skills</span>?
      </h1>

      <p className={shared.questionSubtitle}>
        Select 5 sub-skills related to {activeCategoryLabel}. <br/>This refines your expert profile.
      </p>

      {/* Counter Badge */}
      <div className={styles.selectedBadge}>
        Selected: {selectedSkills.length} / {MAX_SKILLS}
      </div>

      <div className={styles.skillsBodyContent}>
        {/* Skills Cluster */}
        <div className={styles.skillsClusterScroll}>
          <div className={styles.skillsCluster}>
            {currentSkillsList.map((skill) => {
              const isSelected = selectedSkills.includes(skill);

              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onToggleSkill(skill)}
                  className={`${styles.skillPill} ${isSelected ? styles.skillPillSelected : ""}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Skill Input */}
        <form className={styles.customInputWrapper} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add custom skill..."
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            className={styles.customInput}
            disabled={isCustomInputDisabled}
          />
          <button
            type="submit"
            className={styles.customInputBtn}
            aria-label="Add custom skill"
            disabled={isCustomInputDisabled}
          >
            <Plus size={16} />
          </button>
        </form>
      </div>

      {/* Step 2 Footer */}
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div className={shared.avatarMiniWrap}>
            <Image
              src="/assets/img/avatar1.png"
              alt="Expert advisor"
              width={36}
              height={36}
              className={shared.avatarMini}
            />
          </div>
          <div className={shared.footerTip}>
            <strong>Looking specific!</strong>
            <small>Detailed skills attract the right clients.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button
            type="button"
            className={shared.textBtn}
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className={shared.textBtn}
            onClick={onContinue}
          >
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={onContinue}
            disabled={selectedSkills.length !== MAX_SKILLS}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
