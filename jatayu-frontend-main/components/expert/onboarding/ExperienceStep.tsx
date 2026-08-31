"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Building2,
  Check,
  FolderOpen,
  Globe,
  GraduationCap,
  Plus,
} from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import ExperienceAccordionItem from "./ExperienceAccordionItem";
import ExperienceSelect from "./ExperienceSelect";
import PortfolioSamplesSection from "./PortfolioSamplesSection";
import {
  createEmptyEducationDegree,
  createEmptyEmploymentPosition,
  DEGREE_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  getCurrentMonthYear,
  getYearOptions,
  isEducationDegreeStarted,
  isEducationDegreeValid,
  isEmploymentPositionValid,
  isGraduationYearInvalid,
  isPositionDateOrderValid,
  MAX_EDUCATION_DEGREES,
  MAX_EMPLOYMENT_POSITIONS,
  MONTH_OPTIONS,
  type EducationDegree,
  type EmploymentPosition,
} from "@/lib/expertEmployment";
import type { PortfolioSampleFile } from "@/lib/expertApplicationSubmission";
import { useLinkedinProfileSync } from "@/hooks/useLinkedinProfileSync";
import type { LinkedinConnectResponse } from "@/lib/api";
import shared from "./onboarding.shared.module.css";
import styles from "./ExperienceStep.module.css";

type ExperienceStepProps = {
  userName: string;
  employmentPositions: EmploymentPosition[];
  educationDegrees: EducationDegree[];
  linkedin: string;
  linkedinConnected?: boolean;
  portfolio: string;
  portfolioSamples: PortfolioSampleFile[];
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onEmploymentPositionsChange: (positions: EmploymentPosition[]) => void;
  onEducationDegreesChange: (degrees: EducationDegree[]) => void;
  onLinkedinChange: (value: string) => void;
  onLinkedinProfileFetched?: (response: LinkedinConnectResponse) => void;
  onPortfolioChange: (value: string) => void;
  onPortfolioSamplesChange: (samples: PortfolioSampleFile[]) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

export default function ExperienceStep({
  userName,
  employmentPositions,
  educationDegrees,
  linkedin = "",
  linkedinConnected = false,
  portfolio = "",
  portfolioSamples,
  stepCompletion,
  onStepCompleteChange,
  onEmploymentPositionsChange,
  onEducationDegreesChange,
  onLinkedinChange,
  onLinkedinProfileFetched,
  onPortfolioChange,
  onPortfolioSamplesChange,
  onBack,
  onContinue,
  onJumpToStep,
}: ExperienceStepProps) {
  const isStepComplete = useMemo(() => {
    const isPositionStarted = (pos: EmploymentPosition) =>
      Boolean(
        pos.jobTitle.trim() ||
        pos.company.trim() ||
        pos.startMonth ||
        pos.startYear ||
        pos.endMonth ||
        pos.endYear ||
        pos.responsibilities.trim() ||
        pos.currentlyWorking
      );

    const allPositionsValid = employmentPositions.every(
      (pos) => !isPositionStarted(pos) || isEmploymentPositionValid(pos)
    );

    const allDegreesValid = educationDegrees.every(
      (deg) => !isEducationDegreeStarted(deg) || isEducationDegreeValid(deg)
    );

    const hasAtLeastOneFilled =
      employmentPositions.some(isEmploymentPositionValid) ||
      educationDegrees.some((deg) => isEducationDegreeStarted(deg) && isEducationDegreeValid(deg)) ||
      Boolean(linkedin.trim() || portfolio.trim() || portfolioSamples.length > 0);

    return allPositionsValid && allDegreesValid && hasAtLeastOneFilled;
  }, [employmentPositions, educationDegrees, linkedin, portfolio, portfolioSamples]);

  useEffect(() => {
    onStepCompleteChange?.(3, isStepComplete);
  }, [isStepComplete, onStepCompleteChange]);

  const [expandedSection, setExpandedSection] = useState<
    "employment" | "education" | "portfolio" | null
  >(null);
  const [syncedThisSession, setSyncedThisSession] = useState(false);
  const isSynced = linkedinConnected || syncedThisSession;
  const [linkedinError, setLinkedinError] = useState("");

  const handleLinkedinSuccess = useCallback((response: LinkedinConnectResponse) => {
    setLinkedinError("");
    setSyncedThisSession(true);
    onLinkedinProfileFetched?.(response);
  }, [onLinkedinProfileFetched]);
  const handleLinkedinError = useCallback((message: string) => {
    setLinkedinError(message);
  }, []);
  const {
    start: handleLinkedinSync,
    isLoading: isSyncing,
  } = useLinkedinProfileSync({
    onSuccess: handleLinkedinSuccess,
    onError: handleLinkedinError,
  });
  const yearOptions = useMemo(() => getYearOptions(), []);

  const monthOptions = useMemo(
    () => [{ value: "", label: "Month" }, ...MONTH_OPTIONS.map((month) => ({ value: month.value, label: month.label }))],
    [],
  );

  const yearSelectOptions = useMemo(
    () => [{ value: "", label: "Year" }, ...yearOptions.map((year) => ({ value: year, label: year }))],
    [yearOptions],
  );

  const degreeOptions = useMemo(
    () => [
      { value: "", label: "Select degree..." },
      ...DEGREE_OPTIONS.map((option) => ({ value: option, label: option })),
    ],
    [],
  );

  const fieldOfStudyOptions = useMemo(
    () => [
      { value: "", label: "Select field of study..." },
      ...FIELD_OF_STUDY_OPTIONS.map((option) => ({ value: option, label: option })),
    ],
    [],
  );

  const updatePosition = (index: number, patch: Partial<EmploymentPosition>) => {
    onEmploymentPositionsChange(
      employmentPositions.map((position, positionIndex) => {
        if (positionIndex !== index) {
          return patch.currentlyWorking ? { ...position, currentlyWorking: false } : position;
        }

        const updated = { ...position, ...patch };

        if (!updated.currentlyWorking && updated.startYear && updated.endYear) {
          const sYear = Number.parseInt(updated.startYear, 10);
          const eYear = Number.parseInt(updated.endYear, 10);

          if (eYear < sYear) {
            updated.endYear = "";
            updated.endMonth = "";
          } else if (eYear === sYear && updated.startMonth && updated.endMonth) {
            const sMonth = Number.parseInt(updated.startMonth, 10);
            const eMonth = Number.parseInt(updated.endMonth, 10);
            if (eMonth < sMonth) {
              updated.endMonth = "";
            }
          }
        }

        if (!updated.currentlyWorking && updated.endYear && updated.startYear) {
          const sYear = Number.parseInt(updated.startYear, 10);
          const eYear = Number.parseInt(updated.endYear, 10);

          if (sYear > eYear) {
            updated.startYear = "";
            updated.startMonth = "";
          } else if (sYear === eYear && updated.startMonth && updated.endMonth) {
            const sMonth = Number.parseInt(updated.startMonth, 10);
            const eMonth = Number.parseInt(updated.endMonth, 10);
            if (sMonth > eMonth) {
              updated.startMonth = "";
            }
          }
        }

        const { month: cMonthStr, year: cYearStr } = getCurrentMonthYear();
        const cMonth = Number.parseInt(cMonthStr, 10);

        if (updated.startYear === cYearStr && updated.startMonth) {
          if (Number.parseInt(updated.startMonth, 10) > cMonth) {
            updated.startMonth = "";
          }
        }

        if (!updated.currentlyWorking && updated.endYear === cYearStr && updated.endMonth) {
          if (Number.parseInt(updated.endMonth, 10) > cMonth) {
            updated.endMonth = "";
          }
        }

        return updated;
      }),
    );
  };

  const updateDegree = (index: number, patch: Partial<EducationDegree>) => {
    onEducationDegreesChange(
      educationDegrees.map((degree, degreeIndex) =>
        degreeIndex === index ? { ...degree, ...patch } : degree,
      ),
    );
  };

  const handleAddPosition = () => {
    if (employmentPositions.length >= MAX_EMPLOYMENT_POSITIONS) return;
    onEmploymentPositionsChange([...employmentPositions, createEmptyEmploymentPosition()]);
  };

  const handleRemovePosition = (index: number) => {
    if (index === 0 || employmentPositions.length === 1) return;
    onEmploymentPositionsChange(
      employmentPositions.filter((_, positionIndex) => positionIndex !== index),
    );
  };

  const handleAddDegree = () => {
    if (educationDegrees.length >= MAX_EDUCATION_DEGREES) return;
    onEducationDegreesChange([...educationDegrees, createEmptyEducationDegree()]);
  };

  const handleRemoveDegree = (index: number) => {
    if (index === 0 || educationDegrees.length === 1) return;
    onEducationDegreesChange(
      educationDegrees.filter((_, degreeIndex) => degreeIndex !== index),
    );
  };

  const toggleSection = (section: "employment" | "education" | "portfolio") => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <OnboardingProgressBar
          currentStep={3}
          stepCompletion={stepCompletion}
          onStepClick={onJumpToStep}
        />
      </div>

      <div className={`${shared.cardBody} ${styles.experienceCardBody}`}>
        <div className={styles.questionTitleHeaderRow}>
          <div>
            <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
              What is your <span className={shared.accentWord}>experience level</span>?
            </h1>
            <p className={`${shared.questionSubtitle} ${styles.questionSubtitle}`}>
              This helps us match you with the right consultation requests.
            </p>
          </div>

          <button
            type="button"
            className={`${styles.linkedinSyncBtn} ${isSynced ? styles.linkedinSyncBtnDone : ""}`}
            onClick={handleLinkedinSync}
            disabled={isSyncing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true" className={styles.linkedinIcon}>
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span className={styles.linkedinBtnText}>
              {isSyncing ? "Syncing..." : isSynced ? "LinkedIn Synced" : "Fetch With LinkedIn"}
            </span>
          </button>
          {linkedinError ? <p role="alert">{linkedinError}</p> : null}
        </div>

        <ul className={`${styles.accordionList} ${styles.experienceAccordionRoot}`}>
          <ExperienceAccordionItem
            summary="Employment History"
            index={0}
            icon={<Building2 size={20} aria-hidden="true" />}
            isExpanded={expandedSection === "employment"}
            onToggle={() => toggleSection("employment")}
            panelClassName={styles.accPanelEmployment}
          >
            <div className={styles.entryList}>
              {employmentPositions.map((position, index) => {
                const { month: curMonthStr, year: curYearStr } = getCurrentMonthYear();
                const curMonthNum = Number.parseInt(curMonthStr, 10);

                const isSameYear = Boolean(
                  !position.currentlyWorking &&
                  position.startYear &&
                  position.endYear &&
                  position.startYear === position.endYear
                );

                const isStartCurrentYear = position.startYear === curYearStr;
                const isEndCurrentYear = !position.currentlyWorking && position.endYear === curYearStr;

                const filteredStartYears = (!position.currentlyWorking && position.endYear)
                  ? yearOptions.filter((y) => Number.parseInt(y, 10) <= Number.parseInt(position.endYear, 10))
                  : yearOptions;

                const posStartYearOptions = [
                  { value: "", label: "Year" },
                  ...filteredStartYears.map((year) => ({ value: year, label: year })),
                ];

                const maxStartMonth = Math.min(
                  isStartCurrentYear ? curMonthNum : 12,
                  isSameYear && position.endMonth ? Number.parseInt(position.endMonth, 10) : 12
                );

                const filteredStartMonths = MONTH_OPTIONS.filter(
                  (m) => Number.parseInt(m.value, 10) <= maxStartMonth
                );

                const posStartMonthOptions = [
                  { value: "", label: "Month" },
                  ...filteredStartMonths.map((m) => ({ value: m.value, label: m.label })),
                ];

                const filteredEndYears = position.startYear
                  ? yearOptions.filter((y) => Number.parseInt(y, 10) >= Number.parseInt(position.startYear, 10))
                  : yearOptions;

                const posEndYearOptions = [
                  { value: "", label: "Year" },
                  ...filteredEndYears.map((year) => ({ value: year, label: year })),
                ];

                const minEndMonth = isSameYear && position.startMonth ? Number.parseInt(position.startMonth, 10) : 1;
                const maxEndMonth = isEndCurrentYear ? curMonthNum : 12;

                const filteredEndMonths = MONTH_OPTIONS.filter((m) => {
                  const val = Number.parseInt(m.value, 10);
                  return val >= minEndMonth && val <= maxEndMonth;
                });

                const posEndMonthOptions = [
                  { value: "", label: "Month" },
                  ...filteredEndMonths.map((m) => ({ value: m.value, label: m.label })),
                ];

                return (
                  <div key={position.id} className={styles.entryBlock}>
                    {index > 0 ? <div className={styles.entrySeparator} /> : null}
                    <div className={styles.entryHeader}>
                      <span className={styles.entryLabel}>Position {index + 1}</span>
                      {index > 0 ? (
                        <button
                          type="button"
                          className={styles.entryRemoveBtn}
                          onClick={() => handleRemovePosition(index)}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className={styles.entryCard}>
                      <div className={styles.positionForm}>
                        <div className={styles.fieldRow}>
                          <div className={styles.fieldGroup}>
                            <label htmlFor={`job-title-${position.id}`} className={styles.fieldLabel}>
                              Job Title *
                            </label>
                            <input
                              id={`job-title-${position.id}`}
                              type="text"
                              className={styles.textField}
                              placeholder="e.g. Co-Founder & CEO"
                              value={position.jobTitle ?? ""}
                              onChange={(event) =>
                                updatePosition(index, { jobTitle: event.target.value })
                              }
                            />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label htmlFor={`company-${position.id}`} className={styles.fieldLabel}>
                              Company / Organisation *
                            </label>
                            <input
                              id={`company-${position.id}`}
                              type="text"
                              className={styles.textField}
                              placeholder="e.g. Zomato, Infosys, Self"
                              value={position.company ?? ""}
                              onChange={(event) =>
                                updatePosition(index, { company: event.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className={styles.fieldRow}>
                          <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Start Date *</span>
                            <div className={styles.dateRow}>
                              <ExperienceSelect
                                value={position.startMonth ?? ""}
                                options={posStartMonthOptions}
                                onChange={(nextValue) =>
                                  updatePosition(index, { startMonth: nextValue })
                                }
                              />
                              <ExperienceSelect
                                value={position.startYear ?? ""}
                                options={posStartYearOptions}
                                onChange={(nextValue) =>
                                  updatePosition(index, { startYear: nextValue })
                                }
                              />
                            </div>
                          </div>

                          <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>End Date *</span>
                            <div className={styles.dateRow}>
                              <ExperienceSelect
                                value={position.endMonth ?? ""}
                                options={posEndMonthOptions}
                                disabled={Boolean(position.currentlyWorking)}
                                onChange={(nextValue) =>
                                  updatePosition(index, { endMonth: nextValue })
                                }
                              />
                              <ExperienceSelect
                                value={position.endYear ?? ""}
                                options={posEndYearOptions}
                                disabled={Boolean(position.currentlyWorking)}
                                onChange={(nextValue) =>
                                  updatePosition(index, { endYear: nextValue })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {!employmentPositions.some((p, pIdx) => pIdx !== index && p.currentlyWorking) && (
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              className={styles.checkboxInput}
                              checked={Boolean(position.currentlyWorking)}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                if (checked) {
                                  const { month, year } = getCurrentMonthYear();
                                  updatePosition(index, {
                                    currentlyWorking: true,
                                    endMonth: month,
                                    endYear: year,
                                  });
                                  return;
                                }
                                updatePosition(index, { currentlyWorking: false });
                              }}
                            />
                            <span className={styles.checkboxLabel}>Currently working here</span>
                          </label>
                        )}

                        <div className={styles.fieldGroup}>
                          <label htmlFor={`responsibilities-${position.id}`} className={styles.fieldLabel}>
                            Key Responsibilities / Impact{" "}
                            <span className={styles.optionalTag}>(Optional)</span>
                          </label>
                          <textarea
                            id={`responsibilities-${position.id}`}
                            className={styles.textareaField}
                            rows={3}
                            placeholder="Briefly describe what you did and the impact you had..."
                            value={position.responsibilities ?? ""}
                            onChange={(event) =>
                              updatePosition(index, { responsibilities: event.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.addPositionBtn}
              onClick={handleAddPosition}
              disabled={employmentPositions.length >= MAX_EMPLOYMENT_POSITIONS}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Add Another Position</span>
            </button>
          </ExperienceAccordionItem>

          <ExperienceAccordionItem
            summary="Education"
            index={1}
            icon={<GraduationCap size={20} aria-hidden="true" />}
            isExpanded={expandedSection === "education"}
            onToggle={() => toggleSection("education")}
            panelClassName={styles.accPanelEducation}
          >
            <div className={styles.entryList}>
              {educationDegrees.map((degree, index) => (
                <div key={degree.id} className={styles.entryBlock}>
                  {index > 0 ? <div className={styles.entrySeparator} /> : null}
                  <div className={styles.entryHeader}>
                    <span className={styles.entryLabel}>Degree {index + 1}</span>
                    {index > 0 ? (
                      <button
                        type="button"
                        className={styles.entryRemoveBtn}
                        onClick={() => handleRemoveDegree(index)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className={styles.entryCard}>
                    <div className={styles.positionForm}>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label htmlFor={`degree-${degree.id}`} className={styles.fieldLabel}>
                            Degree / Qualification
                          </label>
                          <ExperienceSelect
                            id={`degree-${degree.id}`}
                            value={degree.degree ?? ""}
                            options={degreeOptions}
                            onChange={(nextValue) => updateDegree(index, { degree: nextValue })}
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label htmlFor={`field-${degree.id}`} className={styles.fieldLabel}>
                            Field of Study
                          </label>
                          <ExperienceSelect
                            id={`field-${degree.id}`}
                            value={degree.fieldOfStudy ?? ""}
                            options={fieldOfStudyOptions}
                            onChange={(nextValue) => updateDegree(index, { fieldOfStudy: nextValue })}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label htmlFor={`institution-${degree.id}`} className={styles.fieldLabel}>
                            Institution Name *
                          </label>
                          <input
                            id={`institution-${degree.id}`}
                            type="text"
                            className={styles.textField}
                            placeholder="e.g. IIT Bombay, Delhi University"
                            value={degree.institution ?? ""}
                            onChange={(event) =>
                              updateDegree(index, { institution: event.target.value })
                            }
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label htmlFor={`grad-year-${degree.id}`} className={styles.fieldLabel}>
                            Graduation Year
                          </label>
                          <input
                            id={`grad-year-${degree.id}`}
                            type="text"
                            inputMode="numeric"
                            className={`${styles.textField} ${isGraduationYearInvalid(degree.graduationYear ?? "")
                              ? styles.textFieldError
                              : ""
                              }`}
                            placeholder="e.g. 2015"
                            value={degree.graduationYear ?? ""}
                            onChange={(event) =>
                              updateDegree(index, {
                                graduationYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                              })
                            }
                          />
                          {isGraduationYearInvalid(degree.graduationYear ?? "") && (
                            <span className={styles.fieldErrorText}>
                              Please enter a valid year
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label htmlFor={`honours-${degree.id}`} className={styles.fieldLabel}>
                          Achievements / Honours{" "}
                          <span className={styles.optionalTag}>(Optional)</span>
                        </label>
                        <input
                          id={`honours-${degree.id}`}
                          type="text"
                          className={styles.textField}
                          placeholder="e.g. Gold Medalist, Topper, Dean's List"
                          value={degree.honours ?? ""}
                          onChange={(event) =>
                            updateDegree(index, { honours: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.addPositionBtn}
              onClick={handleAddDegree}
              disabled={educationDegrees.length >= MAX_EDUCATION_DEGREES}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Add Another Degree / Qualification</span>
            </button>
          </ExperienceAccordionItem>

          <ExperienceAccordionItem
            summary="Portfolio"
            index={2}
            icon={<FolderOpen size={20} aria-hidden="true" />}
            isExpanded={expandedSection === "portfolio"}
            onToggle={() => toggleSection("portfolio")}
            panelClassName={styles.accPanelPortfolio}
          >
            <div className={styles.positionForm}>
              <div className={styles.linksRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="experience-linkedin-input" className={styles.fieldLabel}>
                    LinkedIn Profile
                  </label>
                  <div className={styles.inputWithIconWrap}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={styles.inputInnerIcon}
                      aria-hidden="true"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.063 2.063 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <input
                      id="experience-linkedin-input"
                      type="text"
                      className={styles.textFieldWithIcon}
                      placeholder="linkedin.com/in/username"
                      value={linkedin ?? ""}
                      onChange={(event) => onLinkedinChange(event.target.value)}
                      autoComplete="url"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="experience-portfolio-input" className={styles.fieldLabel}>
                    Portfolio / Website
                  </label>
                  <div className={styles.inputWithIconWrap}>
                    <Globe className={styles.inputInnerIcon} size={15} aria-hidden="true" />
                    <input
                      id="experience-portfolio-input"
                      type="text"
                      className={styles.textFieldWithIcon}
                      placeholder="yourwebsite.com"
                      value={portfolio ?? ""}
                      onChange={(event) => onPortfolioChange(event.target.value)}
                      autoComplete="url"
                    />
                  </div>
                </div>
              </div>

              <PortfolioSamplesSection
                samples={portfolioSamples}
                onSamplesChange={onPortfolioSamplesChange}
              />
            </div>
          </ExperienceAccordionItem>
        </ul>
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
            <strong>Solid choice!</strong>
            <small>Clients value transparency in experience.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={onContinue}>
            Skip
          </button>
          <ContinueButton onClick={onContinue} disabled={!isStepComplete} />
        </div>
      </div>
    </section>
  );
}
