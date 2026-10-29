"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lightbulb, Upload, X } from "lucide-react";
import type { PortfolioSampleFile } from "@/lib/expertApplicationSubmission";
import { getPortfolioSampleFileError } from "@/lib/portfolioSampleValidation";
import { generateUUID } from "@/lib/uuid";
import DocumentThumbnail from "@/components/ui/DocumentThumbnail";
import DocumentFilePreview from "@/components/ui/DocumentFilePreview";
import styles from "./PortfolioSamplesSection.module.css";

type PortfolioSamplesSectionProps = {
  samples: PortfolioSampleFile[];
  onSamplesChange: (samples: PortfolioSampleFile[]) => void;
};

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
  const [fileError, setFileError] = useState("");
  const [previewSample, setPreviewSample] = useState<PortfolioSampleFile | null>(null);

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
    const validationError = getPortfolioSampleFileError(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    setFileError("");

    try {
      const id = generateUUID();
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
    } catch {
      setFileError("Could not read the selected file. Please try again.");
    }
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
          <span className={styles.addCardHint}>PDF, DOCX · Max 5 MB</span>
        </button>
      ) : (
        <>
          <div className={styles.uploadGrid}>
            {samples.map((sample) => {
              const isUploading = sample.status === "uploading";

              return (
                <article
                  key={sample.id}
                  className={`${styles.uploadCard} ${
                    isUploading ? "" : styles.uploadCardComplete
                  }`}
                >
                  <div className={styles.thumbnailWrap}>
                    <DocumentThumbnail
                      fileName={sample.fileName}
                      url={sample.url}
                      fileType={sample.fileType}
                      onPreview={() => setPreviewSample(sample)}
                    />
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => removeSample(sample.id)}
                      aria-label={`Remove ${sample.fileName}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.uploadMeta}>
                    <span className={styles.fileName} title={sample.fileName}>
                      {sample.fileName}
                    </span>
                    <span className={styles.fileDetails}>
                      {sample.fileType} · {sample.fileSize}
                    </span>
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
                  <div className={styles.progressTrack} aria-hidden="true">
                    <div
                      className={styles.progressFill}
                      style={{ width: `${isUploading ? sample.progress : 100}%` }}
                    />
                  </div>
                </article>
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

      {fileError ? (
        <p className={styles.fileError} role="alert">{fileError}</p>
      ) : null}

      <div className={styles.tipsBox}>
        <p className={styles.tipsTitle}>
          <Lightbulb size={14} aria-hidden="true" />
          What to upload as portfolio?
        </p>
        <p className={styles.tipsDescription}>
          Upload relevant work samples such as case studies, research papers, financial models, published articles, or design portfolios.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className={styles.hiddenFileInput}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleAddFile(file);
          event.target.value = "";
        }}
      />
      {previewSample?.url ? (
        <DocumentFilePreview
          fileName={previewSample.fileName}
          url={previewSample.url}
          fileType={previewSample.fileType}
          onClose={() => setPreviewSample(null)}
        />
      ) : null}
    </section>
  );
}
