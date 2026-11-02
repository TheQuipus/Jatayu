"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Upload,
  CreditCard,
  BookOpen,
  IdCard,
  Car,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OnboardingStepTitle from "./OnboardingStepTitle";
import OnboardingProgressBar from "./OnboardingProgressBar";
import ContinueButton from "@/components/ui/ContinueButton";
import KycVerificationPanel from "./KycVerificationPanel";
import shared from "./onboarding.shared.module.css";
import styles from "./CredentialsStep.module.css";
import CertificateDocxViewer from "./CertificateDocxViewer";
import DocumentThumbnail from "@/components/ui/DocumentThumbnail";
import DocumentFilePreview from "@/components/ui/DocumentFilePreview";
import type {
  ExpertKycPhotos,
  ExpertCertificate,
  GovernmentIdData,
  GovernmentIdType,
} from "@/lib/expertApplicationSubmission";
import { areKycPhotosComplete } from "@/lib/expertKycPhotos";
import {
  EXPERT_CERTIFICATE_MIME_TYPE,
  EXPERT_LEGACY_CERTIFICATE_MIME_TYPE,
  getExpertCertificateContentError,
  getExpertCertificateFileError,
} from "@/lib/expertCertificateValidation";
import { getDigilockerKycStatus, startDigilockerKyc } from "@/lib/api";

type CredentialsStepProps = {
  userName: string;
  kycVideoSrc: string;
  onKycVideoChange: (src: string) => void;
  kycPhotos: ExpertKycPhotos;
  onKycPhotosChange: (photos: ExpertKycPhotos) => void;
  governmentId: GovernmentIdData | null;
  onGovernmentIdChange: (data: GovernmentIdData | null) => void;
  certificates: ExpertCertificate[];
  onCertificatesChange: (certificates: ExpertCertificate[]) => void;
  stepCompletion: boolean[];
  onStepCompleteChange?: (step: number, complete: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  onJumpToStep?: (step: number) => void;
};

type IdSide = "front" | "back";

type CertificateEntry = {
  id: string;
  name: string;
  issuer: string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
};

type UploadedSide = {
  name: string;
  size: string;
  url?: string;
};

const ID_TYPES: { id: GovernmentIdType; label: string; icon: LucideIcon }[] = [
  { id: "aadhaar", label: "Aadhaar Card", icon: CreditCard },
  { id: "pan", label: "PAN Card", icon: CreditCard },
  { id: "passport", label: "Passport", icon: BookOpen },
  { id: "voter", label: "Voter ID", icon: IdCard },
  { id: "driving", label: "Driving Licence", icon: Car },
];

const MAX_DOC_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

import { generateUUID } from "@/lib/uuid";

function certificatesToEntries(certs: ExpertCertificate[]): CertificateEntry[] {
  if (certs.length === 0) {
    return [{ id: generateUUID(), name: "", issuer: "" }];
  }
  return certs.map((cert) => ({
    id: cert.id,
    name: cert.name,
    issuer: cert.issuer ?? "",
    fileName: cert.fileName,
    fileSize: cert.size,
    fileUrl: cert.url,
  }));
}

function entriesToCertificates(entries: CertificateEntry[]): ExpertCertificate[] {
  return entries
    .filter((entry) => entry.name.trim() && entry.fileUrl)
    .map((entry) => ({
      id: entry.id,
      name: entry.name.trim(),
      issuer: entry.issuer.trim() || undefined,
      size: entry.fileSize,
      url: entry.fileUrl,
      fileName: entry.fileName,
    }));
}

export default function CredentialsStep({
  userName,
  kycVideoSrc,
  onKycVideoChange,
  kycPhotos,
  onKycPhotosChange,
  governmentId,
  onGovernmentIdChange,
  certificates,
  onCertificatesChange,
  stepCompletion,
  onStepCompleteChange,
  onBack,
  onContinue,
  onJumpToStep,
}: CredentialsStepProps) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [selectedIdType, setSelectedIdType] = useState<GovernmentIdType | "">(
    governmentId?.type ?? "",
  );
  const [idFront, setIdFront] = useState<UploadedSide | null>(
    governmentId?.front ?? null,
  );
  const [idBack, setIdBack] = useState<UploadedSide | null>(
    governmentId?.back ?? null,
  );
  const [certificateEntries, setCertificateEntries] = useState<CertificateEntry[]>(() =>
    certificatesToEntries(certificates),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [certificateUploadError, setCertificateUploadError] = useState<string | null>(null);
  const [pendingCertificateUploads, setPendingCertificateUploads] = useState(0);
  const [certificateToPreview, setCertificateToPreview] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [governmentIdToPreview, setGovernmentIdToPreview] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [digilockerConfigured, setDigilockerConfigured] = useState(false);
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [digilockerLoading, setDigilockerLoading] = useState(true);
  const [digilockerError, setDigilockerError] = useState<string | null>(null);
  const hasKycVideo = Boolean(kycVideoSrc);
  const hasManualKycPhotos = areKycPhotosComplete(kycPhotos);
  const hasGovernmentId = Boolean(selectedIdType) && Boolean(idFront);
  const canContinue = hasGovernmentId || hasKycVideo || hasManualKycPhotos || digilockerVerified;

  useEffect(() => {
    let active = true;
    getDigilockerKycStatus()
      .then((response) => {
        if (!active) return;
        setDigilockerConfigured(response.configured);
        setDigilockerVerified(response.kyc?.status === "verified");
      })
      .catch(() => {
        if (active) setDigilockerConfigured(false);
      })
      .finally(() => {
        if (active) setDigilockerLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleDigilockerVerification = async () => {
    setDigilockerLoading(true);
    setDigilockerError(null);
    try {
      const response = await startDigilockerKyc();
      window.location.assign(response.authorizationUrl);
    } catch (error) {
      setDigilockerError(error instanceof Error ? error.message : "Could not start DigiLocker verification.");
      setDigilockerLoading(false);
    }
  };

  useEffect(() => {
    if (canContinue) {
      setValidationError(null);
    }
  }, [canContinue]);

  useEffect(() => {
    onStepCompleteChange?.(5, canContinue);
  }, [canContinue, onStepCompleteChange]);

  useEffect(() => {
    onCertificatesChange(entriesToCertificates(certificateEntries));
  }, [certificateEntries, onCertificatesChange]);

  const syncGovernmentId = (
    type: GovernmentIdType | "",
    front: UploadedSide | null,
    back: UploadedSide | null,
  ) => {
    if (!type || !front) {
      onGovernmentIdChange(null);
      return;
    }
    onGovernmentIdChange({ type, front, back: back ?? undefined });
  };

  const handleIdUpload = async (side: IdSide, file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) return;
    if (file.size > MAX_DOC_BYTES) return;

    const url = await readFileAsDataUrl(file);
    const uploaded: UploadedSide = {
      name: file.name,
      size: formatFileSize(file.size),
      url,
    };

    if (side === "front") {
      setIdFront(uploaded);
      syncGovernmentId(selectedIdType, uploaded, idBack);
    } else {
      setIdBack(uploaded);
      syncGovernmentId(selectedIdType, idFront, uploaded);
    }
  };

  const handleIdTypeSelect = (type: GovernmentIdType) => {
    if (selectedIdType === type) {
      setSelectedIdType("");
      setIdFront(null);
      setIdBack(null);
      syncGovernmentId("", null, null);
    } else {
      setSelectedIdType(type);
      syncGovernmentId(type, idFront, idBack);
    }
  };


  const handleRemoveIdSide = (side: IdSide) => {
    if (side === "front") {
      setIdFront(null);
      syncGovernmentId(selectedIdType, null, idBack);
    } else {
      setIdBack(null);
      syncGovernmentId(selectedIdType, idFront, null);
    }
  };

  const renderDocPreview = (
    url: string,
    fileName: string,
    onRemove: () => void,
    onPreview: () => void,
  ) => (
    <div className={styles.docPreview}>
      {url ? (
        <button
          type="button"
          className={styles.idDocumentPreviewButton}
          onClick={onPreview}
          aria-label={`Preview ${fileName}`}
        >
          <DocumentThumbnail fileName={fileName} url={url} size="id" />
          <span className={styles.idDocumentFileName} title={fileName}>{fileName}</span>
        </button>
      ) : (
        <div className={styles.idDocumentUnavailable} aria-label={`${fileName} preview unavailable`}>
          <DocumentThumbnail fileName={fileName} size="id" />
          <span className={styles.idDocumentFileName} title={fileName}>{fileName}</span>
        </div>
      )}
      <button
        type="button"
        className={styles.docPreviewRemoveBtn}
        aria-label={`Remove ${fileName || "file"}`}
        onClick={onRemove}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );

  const renderCertificatePreview = (
    url: string,
    fileName: string,
    fileSize: string | undefined,
    onPreview: () => void,
    onRemove: () => void,
  ) => (
    <div className={styles.certificateFilePreview}>
      <button
        type="button"
        onClick={onPreview}
        className={styles.certificatePreviewButton}
        aria-label={`Preview ${fileName || "certificate.docx"}`}
      >
        <DocumentThumbnail
          fileName={fileName || "certificate.docx"}
          url={url}
          fileType="DOCX"
        />
        <span className={styles.certificateFileName}>
          {fileName || "Certificate DOCX"}
        </span>
        {fileSize ? <span className={styles.certificatePreviewLabel}>{fileSize}</span> : null}
        <span className={styles.certificatePreviewLabel}>Click to preview</span>
      </button>
      <button
        type="button"
        className={styles.docPreviewRemoveBtn}
        aria-label={`Remove ${fileName || "certificate.docx"}`}
        onClick={onRemove}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );

  const updateCertificateEntry = (id: string, patch: Partial<CertificateEntry>) => {
    setCertificateEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const handleCertificateFile = async (entryId: string, file: File) => {
    setCertificateUploadError(null);
    const fileError = getExpertCertificateFileError(file);
    if (fileError) {
      setCertificateUploadError(fileError);
      return;
    }

    setPendingCertificateUploads((pending) => pending + 1);
    try {
      const contentError = await getExpertCertificateContentError(file);
      if (contentError) {
        setCertificateUploadError(contentError);
        return;
      }
      const url = await readFileAsDataUrl(file);
      updateCertificateEntry(entryId, {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileUrl: url,
      });
      setCertificateUploadError(null);
    } catch (error) {
      setCertificateUploadError(
        error instanceof Error
          ? `Could not validate or read the certificate file: ${error.message}`
          : "Could not validate or read the certificate file. Please try again.",
      );
    } finally {
      setPendingCertificateUploads((pending) => Math.max(0, pending - 1));
    }
  };

  const handleRemoveCertificateFile = (id: string) => {
    updateCertificateEntry(id, {
      fileName: undefined,
      fileSize: undefined,
      fileUrl: undefined,
    });
  };

  const handleAddCertificate = () => {
    setCertificateEntries((prev) => [
      ...prev,
      { id: generateUUID(), name: "", issuer: "" },
    ]);
  };

  const handleRemoveCertificate = (id: string) => {
    setCertificateEntries((prev) =>
      prev.length === 1
        ? [{ id: generateUUID(), name: "", issuer: "" }]
        : prev.filter((entry) => entry.id !== id),
    );
  };

  const handleContinue = () => {
    if (pendingCertificateUploads > 0) {
      setCertificateUploadError("Please wait for certificate uploads to finish before continuing.");
      return;
    }
    if (!canContinue) {
      if (!selectedIdType) {
        setValidationError("Please select a Government ID type (Aadhaar, PAN, Passport, etc.).");
      } else if (!idFront) {
        setValidationError("Please upload the front photo of your Government ID document.");
      } else {
        setValidationError("Please upload your Government ID front photo or complete video verification.");
      }
      return;
    }
    setValidationError(null);
    onContinue();
  };

  const handleSkip = () => {
    handleContinue();
  };

  return (
    <section className={shared.card}>
      <div className={shared.cardHeader}>
        <div className={shared.topHeader}>
          <OnboardingStepTitle userName={userName} />
        </div>

        <OnboardingProgressBar
          currentStep={5}
          stepCompletion={stepCompletion}
          onStepClick={onJumpToStep}
        />
      </div>

      <div className={shared.cardBody}>
        <h1 className={`${shared.questionTitle} ${styles.questionTitle}`}>
          Back up your <span className={shared.accentWord}>credentials</span> & <span className={shared.accentWord}>KYC</span>
        </h1>

        <p className={shared.questionSubtitle}>
          Verified profiles receive 3x more consultation requests.
        </p>

        <div className={styles.sectionsStack}>
          {/* 1. Identity Verification */}
          <article>
            <KycVerificationPanel
              videoSrc={kycVideoSrc}
              onVideoChange={onKycVideoChange}
              manualPhotos={kycPhotos}
              onManualPhotosChange={onKycPhotosChange}
              digilockerLoading={digilockerLoading}
              digilockerVerified={digilockerVerified}
              digilockerError={digilockerError}
              onDigilockerVerification={() => void handleDigilockerVerification()}
            />
          </article>

          {/* 2. Government ID */}
          <article>
            <header className={styles.sectionCardHeader}>
              <div className={styles.sectionCardTitleWrap}>
                <h2 className={styles.sectionCardTitle}>
                  Government ID <span className={styles.requiredMark}></span>
                </h2>
              </div>
            </header>

            <div className={styles.idTypeGrid}>
              {ID_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.idTypeBtn} ${selectedIdType === id ? styles.idTypeBtnSelected : ""
                    }`}
                  onClick={() => handleIdTypeSelect(id)}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {selectedIdType && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className={styles.idUploadRow} style={{ paddingTop: "4px", paddingBottom: "4px" }}>
                    <div className={styles.idUploadCol}>
                      <span className={styles.idUploadLabel}>
                        Front Side <span className={styles.requiredMark}>*</span>
                      </span>
                      <div
                        className={`${styles.idUploadZone} ${idFront ? styles.idUploadZoneDone : ""
                          }`}
                      >
                        {idFront ? (
                          renderDocPreview(
                            idFront.url || "",
                            idFront.name,
                            () => handleRemoveIdSide("front"),
                            () => setGovernmentIdToPreview({
                              url: idFront.url || "",
                              fileName: idFront.name,
                            }),
                          )
                        ) : (
                          <button
                            type="button"
                            className={styles.idUploadTrigger}
                            onClick={() => frontInputRef.current?.click()}
                          >
                            <Upload size={18} />
                            <span className={styles.idUploadTitle}>Upload Front</span>
                            <span className={styles.idUploadHint}>PDF, PNG, JPG max 2 mb</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.idUploadCol}>
                      <span className={styles.idUploadLabel}>Back Side</span>
                      <div
                        className={`${styles.idUploadZone} ${idBack ? styles.idUploadZoneDone : ""
                          }`}
                      >
                        {idBack ? (
                          renderDocPreview(
                            idBack.url || "",
                            idBack.name,
                            () => handleRemoveIdSide("back"),
                            () => setGovernmentIdToPreview({
                              url: idBack.url || "",
                              fileName: idBack.name,
                            }),
                          )
                        ) : (
                          <button
                            type="button"
                            className={styles.idUploadTrigger}
                            onClick={() => backInputRef.current?.click()}
                          >
                            <Upload size={18} />
                            <span className={styles.idUploadTitle}>Upload Back</span>
                            <span className={styles.idUploadHint}>PDF, PNG, JPG max 2 mb</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className={styles.hiddenFileInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleIdUpload("front", file);
                      e.target.value = "";
                    }}
                  />

                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className={styles.hiddenFileInput}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleIdUpload("back", file);
                      e.target.value = "";
                    }}
                  />

                  <p className={styles.idPrivacyNote}>
                    Your government ID is used only for identity verification. It will never be
                    displayed on your public profile or shared with seekers.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </article>

          {/* 3. Professional Certificates */}
          <article>
            <header className={styles.sectionCardHeader}>
              <div className={styles.sectionCardTitleWrap}>
                <h2 className={styles.sectionCardTitle}>Professional Certificates</h2>
                <p className={styles.sectionCardHint}>
                  Degrees, diplomas, licences, and professional certifications
                </p>
              </div>
            </header>

            <div className={styles.certificateGrid}>
              {certificateEntries.map((entry, index) => (
                <div key={entry.id} className={styles.certificateCardWrap}>
                  <div className={styles.certificateCardHeader}>
                    <span className={styles.certificateCardIndex}>
                      Certificate {index + 1}
                    </span>
                    {certificateEntries.length > 1 ? (
                      <button
                        type="button"
                        className={styles.certificateRemoveBtn}
                        onClick={() => handleRemoveCertificate(entry.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className={styles.certificateCard}>
                    <input
                      id={`cert-name-${entry.id}`}
                      type="text"
                      className={styles.certificateField}
                      placeholder="Degree, diploma, licence"
                      value={entry.name}
                      onChange={(e) =>
                        updateCertificateEntry(entry.id, { name: e.target.value })
                      }
                      aria-label={`Certificate ${index + 1} name`}
                    />
                    <input
                      id={`cert-issuer-${entry.id}`}
                      type="text"
                      className={styles.certificateField}
                      placeholder="Issuing authority"
                      value={entry.issuer}
                      onChange={(e) =>
                        updateCertificateEntry(entry.id, { issuer: e.target.value })
                      }
                      aria-label={`Certificate ${index + 1} issuing authority`}
                    />

                    <div
                      className={`${styles.certUploadZone} ${entry.fileUrl ? styles.certUploadZoneDone : ""
                        }`}
                    >
                      {entry.fileUrl ? (
                        renderCertificatePreview(
                          entry.fileUrl,
                          entry.fileName || "",
                          entry.fileSize,
                          () => setCertificateToPreview({
                            url: entry.fileUrl ?? "",
                            fileName: entry.fileName || "certificate.docx",
                          }),
                          () => handleRemoveCertificateFile(entry.id),
                        )
                      ) : (
                        <button
                          type="button"
                          className={styles.certUploadTrigger}
                          onClick={() => certFileInputRefs.current[entry.id]?.click()}
                        >
                          <span className={styles.certUploadTitle}>Upload</span>
                          <span className={styles.certUploadHint}>DOC or DOCX, max 2 MB</span>
                        </button>
                      )}
                    </div>

                    <input
                      ref={(el) => {
                        certFileInputRefs.current[entry.id] = el;
                      }}
                      type="file"
                      accept={`.doc,.docx,${EXPERT_LEGACY_CERTIFICATE_MIME_TYPE},${EXPERT_CERTIFICATE_MIME_TYPE}`}
                      className={styles.hiddenFileInput}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleCertificateFile(entry.id, file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className={styles.addCertificateCard}
                onClick={handleAddCertificate}
              >
                Add another
              </button>
            </div>

            <p className={`${styles.idPrivacyNote} ${styles.certificateInfoNote}`}>
              Verified certificates unlock the &apos;Credentials Verified&apos; badge on your profile
              — seekers filter for this.
            </p>
          </article>
        </div>
      </div>

      {(certificateUploadError || validationError) && (
        <p role="alert" style={{ color: "var(--pomegranate)", textAlign: "center", margin: "12px 24px 0 24px", fontSize: "14px", fontWeight: 500 }}>
          {certificateUploadError || validationError}
        </p>
      )}

      {certificateToPreview && (
        <CertificateDocxViewer
          url={certificateToPreview.url}
          fileName={certificateToPreview.fileName}
          onClose={() => setCertificateToPreview(null)}
        />
      )}
      {governmentIdToPreview && (
        <DocumentFilePreview
          fileName={governmentIdToPreview.fileName}
          url={governmentIdToPreview.url}
          onClose={() => setGovernmentIdToPreview(null)}
        />
      )}

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
          <button type="button" className={shared.textBtn} onClick={handleSkip}>
            Skip
          </button>
          <ContinueButton
            onClick={handleContinue}
            disabled={!canContinue || pendingCertificateUploads > 0}
          />
        </div>
      </div>
    </section>
  );
}
