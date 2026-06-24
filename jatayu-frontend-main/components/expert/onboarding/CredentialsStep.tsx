"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Globe,
  FileText,
  X,
  Check,
  Plus,
  Upload,
} from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import shared from "./onboarding.shared.module.css";
import styles from "./CredentialsStep.module.css";

type CredentialsStepProps = {
  userName: string;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: (data: {
    credentials: Array<{
      type: string;
      title: string;
      institution: string;
      startYear: number;
      endYear?: number | null;
      description?: string | null;
    }>;
  }) => void;
  onJumpToStep?: (step: number) => void;
};

type CertificateFile = {
  id: string;
  name: string;
  progress: number;
  size?: string;
  status: "uploading" | "complete";
};

export default function CredentialsStep({
  userName,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: CredentialsStepProps) {
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [certificates, setCertificates] = useState<CertificateFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStepCompleteChange?.(5, linkedin.trim().length > 0);
  }, [linkedin, onStepCompleteChange]);

  useEffect(() => {
    const uploading = certificates.find((c) => c.status === "uploading");
    if (!uploading) return;

    if (uploading.progress >= 100) {
      setCertificates((prev) =>
        prev.map((cert) =>
          cert.id === uploading.id && cert.status === "uploading"
            ? { ...cert, status: "complete", size: "2.4 MB" }
            : cert,
        ),
      );
      return;
    }

    const timer = setTimeout(() => {
      setCertificates((prev) =>
        prev.map((cert) =>
          cert.id === uploading.id
            ? { ...cert, progress: Math.min(cert.progress + 1, 100) }
            : cert,
        ),
      );
    }, 120);

    return () => clearTimeout(timer);
  }, [certificates]);

  const handleRemoveCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((cert) => cert.id !== id));
  };

  const handleAddDocument = (file: File) => {
    const id = crypto.randomUUID();
    setCertificates((prev) => [
      ...prev,
      { id, name: file.name, progress: 0, status: "uploading" },
    ]);
  };

  return (
    <section className={shared.card}>
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <clipPath id="custom-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.086 L0.018,0 H0.676 L0.696,0.086 H0.978 L1,0.311 V0.743 L0.984,0.839 L0.955,0.845 L0.9,1 H0 V0.086 Z" fillOpacity="0.05" strokeOpacity="0.1"/>
          </clipPath>
        </defs>
      </svg>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
          <div className={shared.stepPill}>
            <span>Step 5 of 9 · Proof of Expertise</span>
          </div>
        </div>

        <OnboardingProgressBar currentStep={5} stepCompletion={stepCompletion} onStepClick={onJumpToStep} />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Back up your <span className={shared.accentWord}>credentials</span>
        </h1>

        <p className={styles.credentialsSubtitle}>
          Verified profiles receive 3x more consultation requests.
        </p>

        <div className={styles.credentialsRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="linkedin-input" className={styles.fieldLabel}>
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
                id="linkedin-input"
                type="text"
                placeholder="linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className={styles.textFieldWithIcon}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="portfolio-input" className={styles.fieldLabel}>
              Portfolio / Website{" "}
              <span className={styles.optionalLabel}>(Optional)</span>
            </label>
            <div className={styles.inputWithIconWrap}>
              <Globe className={styles.inputInnerIcon} size={15} />
              <input
                id="portfolio-input"
                type="text"
                placeholder="yourwebsite.com"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className={styles.textFieldWithIcon}
              />
            </div>
          </div>
        </div>

        <div className={styles.certificatesSection}>
          <span className={styles.fieldLabel}>
            Certificates & Licenses{" "}
            <span className={styles.optionalLabel}>(Optional)</span>
          </span>

          {certificates.length === 0 ? (
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={28} strokeWidth={1.5} />
              <span className={styles.uploadBtnTitle}>Upload certificate or license</span>
              <span className={styles.uploadBtnHint}>PDF or DOCX (max. 5 MB)</span>
            </button>
          ) : (
            <>
              <div className={styles.fileCardList}>
                {certificates.map((cert) => (
                  <div key={cert.id} className={styles.fileCard}>
                    <div className={styles.fileCardInner}>
                      <div
                        className={
                          cert.status === "complete"
                            ? styles.fileIconBoxComplete
                            : styles.fileIconBox
                        }
                      >
                        <FileText size={18} />
                      </div>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{cert.name}</span>
                        <span
                          className={
                            cert.status === "complete"
                              ? styles.fileStatusComplete
                              : styles.fileStatusUploading
                          }
                        >
                          {cert.status === "complete"
                            ? `${cert.size ?? "2.4 MB"} · Complete`
                            : `Uploading... ${cert.progress}%`}
                        </span>
                      </div>
                      {cert.status === "complete" && (
                        <div className={styles.fileCheckWrap}>
                          <Check size={12} />
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.fileCloseBtn}
                        onClick={() => handleRemoveCertificate(cert.id)}
                        aria-label={`Remove ${cert.name}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                    {cert.status === "uploading" && (
                      <div className={styles.fileProgressBarBg}>
                        <div
                          className={styles.fileProgressBarFill}
                          style={{ width: `${cert.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={styles.addDocumentBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={14} />
                <span>Add another document</span>
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className={styles.hiddenFileInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAddDocument(file);
              e.target.value = "";
            }}
          />
        </div>
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
            <strong>Trust Builder +20%</strong>
            <small>Profiles with proof of expertise usually get reviewed faster.</small>
          </div>
        </div>

        <div className={shared.footerActions}>
          <button type="button" className={shared.textBtn} onClick={onBack}>
            Back
          </button>
          <button type="button" className={shared.textBtn} onClick={() => onContinue({ credentials: [] })}>
            Skip
          </button>
          <button
            type="button"
            className={shared.continueBtn}
            onClick={() => {
              const creds = [];
              if (linkedin.trim()) {
                creds.push({
                  type: "linkedin",
                  title: "LinkedIn Profile",
                  institution: linkedin.trim(),
                  startYear: new Date().getFullYear(),
                  endYear: null,
                  description: portfolio.trim() || null,
                });
              }
              onContinue({ credentials: creds });
            }}
            disabled={!linkedin.trim()}
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
