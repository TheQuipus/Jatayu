"use client";

import { useState } from "react";
import { Medal, Tag, X, Plus } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import shared from "./onboarding.shared.module.css";
import styles from "./SkillsStep.module.css";

const MAX_SKILLS = 5;
const BADGE_SEGMENT_COUNT = 5;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function SkillBadgeRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const filled = Math.min(Math.max(progress, 0), BADGE_SEGMENT_COUNT);
  const strokeWidth = 2.5;
  const gapDeg = 12;
  const segmentDeg = (360 - BADGE_SEGMENT_COUNT * gapDeg) / BADGE_SEGMENT_COUNT;
  const radius = (size - strokeWidth) / 2 - 0.5;
  const cx = size / 2;
  const cy = size / 2;

  const filledOpacity = filled > 0 ? 0.5 + Math.min(filled, BADGE_SEGMENT_COUNT) * 0.1 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={styles.footerTagRing}
      aria-hidden="true"
    >
      {Array.from({ length: BADGE_SEGMENT_COUNT }, (_, index) => {
        const startAngle = index * (segmentDeg + gapDeg);
        const endAngle = startAngle + segmentDeg;
        const isFilled = index < filled;

        return (
          <path
            key={index}
            d={describeArc(cx, cy, radius, startAngle, endAngle)}
            fill="none"
            className={
              isFilled ? styles.footerTagRingSegmentFilled : styles.footerTagRingSegment
            }
            style={isFilled ? { opacity: filledOpacity } : undefined}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

type SkillsStepProps = {
  userName: string;
  activeCategoryLabel: string;
  currentSkillsList: string[];
  customSkillsList: string[];
  selectedSkills: string[];
  stepCompletion: boolean[];
  onToggleSkill: (skill: string) => void;
  onAddCustomSkill: (skill: string) => void;
  onRemoveCustomSkill: (skill: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

export default function SkillsStep({
  userName,
  activeCategoryLabel,
  currentSkillsList,
  customSkillsList,
  selectedSkills,
  stepCompletion,
  onToggleSkill,
  onAddCustomSkill,
  onRemoveCustomSkill,
  onBack,
  onContinue,
  onJumpToStep,
}: SkillsStepProps) {
  const [newSkillInput, setNewSkillInput] = useState<string>("");
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    onAddCustomSkill(trimmed);
    setNewSkillInput("");
    setShowInput(false);
  };

  const handleBlur = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed) {
      onAddCustomSkill(trimmed);
      setNewSkillInput("");
    }
    setShowInput(false);
  };

  const isBadgeUnlocked = selectedSkills.length >= BADGE_SEGMENT_COUNT;
  // Directory layout grouping - predefined skills only
  const grouped = currentSkillsList.reduce((acc, skill) => {
    const label = skill.trim();
    if (!label) return acc;
    const firstChar = label[0].toUpperCase();
    const isLetter = /^[A-Z]$/.test(firstChar);
    const key = isLetter ? firstChar : "#";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(skill);
    return acc;
  }, {} as Record<string, string[]>);

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.localeCompare(b));
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const activeLetters = new Set(Object.keys(grouped));

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <OnboardingProgressBar
          currentStep={2}
          stepCompletion={stepCompletion}
          onStepClick={onJumpToStep}
        />
      </div>

      <div className={`${shared.cardBody} ${styles.skillsCardBody}`}>
        <h1 className={shared.questionTitle}>
          What are your <span className={shared.accentWord}>specific skills</span>?
        </h1>

        <p className={shared.questionSubtitle}>
          Select up to 5 sub-skills related to {activeCategoryLabel}. This refines your expert profile.
        </p>

        {/* Directory Wrapper */}
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
                    {items.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);

                      return (
                        <div className={styles.skillPillWrapper} key={skill}>
                          <button
                            type="button"
                            onClick={() => onToggleSkill(skill)}
                            className={`${styles.skillPill} ${isSelected ? styles.skillPillSelected : ""
                              }`}
                          >
                            {skill}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Custom Skill Input Form */}
            <div className={styles.customInputContainer}>
              {customSkillsList.length > 0 && (
                <div className={styles.customChipsList}>
                  {customSkillsList.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <div className={styles.skillPillWrapper} key={skill}>
                        <div
                          className={`${styles.skillPill} ${styles.skillPillRemovable} ${isSelected ? styles.skillPillSelected : ""
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleSkill(skill)}
                            className={styles.skillPillMain}
                          >
                            {skill}
                          </button>
                          <button
                            type="button"
                            className={styles.skillRemoveBtn}
                            aria-label={`Remove ${skill}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCustomSkill(skill);
                            }}
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <h3 className={styles.customHeading}>
                Didn&apos;t find what you&apos;re looking for?
              </h3>
              {showInput ? (
                <div className={`${styles.skillPill} ${styles.skillPillInput}`}>
                  <form onSubmit={handleSubmit} className={styles.skillInputForm}>
                    <input
                      type="text"
                      placeholder="Add custom skill..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className={styles.skillInlineInput}
                      onBlur={handleBlur}
                      autoFocus
                      aria-label="Add custom skill"
                    />
                    <button
                      type="submit"
                      className={styles.skillAddBtn}
                      onMouseDown={(e) => e.preventDefault()}
                      aria-label="Add custom skill"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInput(true)}
                  className={styles.skillPill}
                >
                  <Plus size={14} />
                  <span>Add custom</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={shared.onboardingFooter}>
        <div className={shared.footerLeft}>
          <div
            className={`${styles.footerTagIconWrap} ${isBadgeUnlocked ? styles.footerTagIconWrapUnlocked : ""
              }`}
            aria-label={
              isBadgeUnlocked
                ? "Skill Specialist badge unlocked"
                : `${Math.min(selectedSkills.length, BADGE_SEGMENT_COUNT)} of ${BADGE_SEGMENT_COUNT
                } skills selected`
            }
          >
            <SkillBadgeRing progress={selectedSkills.length} />
            <div className={styles.footerTagIcon}>
              {isBadgeUnlocked ? (
                <Medal className={styles.footerMedalIconSvg} size={18} />
              ) : (
                <Tag className={styles.footerTagIconSvg} size={18} />
              )}
            </div>
          </div>
          <div className={shared.footerTip}>
            {isBadgeUnlocked ? (
              <strong>Skill Specialist Unlocked!</strong>
            ) : (
              <>
                <strong>Skill Specialist</strong>
                <small>
                  {selectedSkills.length === 0
                    ? `Select ${BADGE_SEGMENT_COUNT} skills to unlock 5 credits`
                    : `Select ${BADGE_SEGMENT_COUNT - Math.min(selectedSkills.length, BADGE_SEGMENT_COUNT)} more skill${BADGE_SEGMENT_COUNT - Math.min(selectedSkills.length, BADGE_SEGMENT_COUNT) === 1 ? "" : "s"
                    } to unlock 5 credits`}
                </small>
              </>
            )}
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton
            onClick={onContinue}
            disabled={selectedSkills.length === 0}
          />
        </div>
      </div>
    </section>
  );
}
