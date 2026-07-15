"use client";

import { useEffect, useRef } from "react";
import { Check, FileText, Lightbulb, Upload, X } from "lucide-react";
import type { PortfolioSampleFile } from "@/lib/expertApplicationSubmission";
import styles from "./PortfolioSamplesSection.module.css";

type PortfolioSamplesSectionProps = {
  samples: PortfolioSampleFile[];
  onSamplesChange: (samples: PortfolioSampleFile[]) => void;
};

const PORTFOLIO_TIPS = [
  "Case study decks",
  "Published articles",
  "Financial models",
  "Research papers",
  "Design portfolios",
  "Talk/Interview links",
];

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"];

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : "FILE";
}

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
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

export default function PortfolioSamplesSection({
  samples,
  onSamplesChange,
}: PortfolioSamplesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const uploading = samples.find((sample) => sample.status === "uploading");
    if (!uploading) return;

    if (uploading.progress >= 100) {
      onSamplesChange(
        samples.map((sample) =>
          sample.id === uploading.id && sample.status === "uploading"
            ? { ...sample, status: "complete", progress: 100 }
            : sample,
        ),
      );
      return;
    }

    const timer = window.setTimeout(() => {
      onSamplesChange(
        samples.map((sample) =>
          sample.id === uploading.id
            ? { ...sample, progress: Math.min(sample.progress + 4, 100) }
            : sample,
        ),
      );
    }, 120);

    return () => window.clearTimeout(timer);
  }, [onSamplesChange, samples]);

  const handleAddFile = async (file: File) => {
    if (!isAcceptedFile(file) || file.size > MAX_FILE_BYTES) return;

    const id = crypto.randomUUID();
    const url = await readFileAsDataUrl(file);
    const nextSample: PortfolioSampleFile = {
      id,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: getFileExtension(file.name),
      description: "",
      url,
      status: "uploading",
      progress: 0,
    };

    onSamplesChange([...samples, nextSample]);
  };

  const removeSample = (id: string) => {
    onSamplesChange(samples.filter((sample) => sample.id !== id));
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          Portfolio Samples <span className={styles.optionalTag}>(Optional)</span>
        </h2>
      </header>

      {samples.length === 0 ? (
        <button
          type="button"
          className={styles.addCard}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} strokeWidth={1.5} className={styles.addCardIcon} />
          <span className={styles.addCardTitle}>Add Portfolio Item</span>
          <span className={styles.addCardHint}>PDF, DOCX · Max 5MB</span>
        </button>
      ) : (
        <>
          <div className={styles.uploadList}>
            {samples.map((sample) => {
              const isUploading = sample.status === "uploading";

              return (
                <div key={sample.id} className={styles.uploadItem}>
                  <article
                    className={`${styles.uploadBar} ${
                      isUploading ? styles.uploadBarUploading : styles.uploadBarComplete
                    }`}
                  >
                    <div className={styles.uploadBarBody}>
                      <span className={styles.fileIconWrap} aria-hidden="true">
                        <FileText size={16} />
                      </span>

                      <div className={styles.uploadMeta}>
                        <span className={styles.fileName}>{sample.fileName}</span>
                        {isUploading ? (
                          <span className={styles.uploadStatus}>
                            Uploading... {Math.round(sample.progress)}%
                          </span>
                        ) : (
                          <span className={styles.uploadStatusDone}>
                            <Check size={12} aria-hidden="true" />
                            Uploaded
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => removeSample(sample.id)}
                        aria-label={`Remove ${sample.fileName}`}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <div className={styles.progressTrack} aria-hidden="true">
                      <div
                        className={styles.progressFill}
                        style={{ width: `${isUploading ? sample.progress : 100}%` }}
                      />
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.addAnotherBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            + Add another document
          </button>
        </>
      )}

      <div className={styles.tipsBox}>
        <p className={styles.tipsTitle}>
          <Lightbulb size={14} aria-hidden="true" />
          What to upload as portfolio?
        </p>
        <div className={styles.tipsGrid}>
          {PORTFOLIO_TIPS.map((tip) => (
            <span key={tip} className={styles.tipItem}>
              <Check size={12} className={styles.tipCheck} aria-hidden="true" />
              {tip}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.ppt,.pptx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/jpeg,image/png"
        className={styles.hiddenFileInput}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleAddFile(file);
          event.target.value = "";
        }}
      />
    </section>
  );
}
