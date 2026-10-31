"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./CredentialsStep.module.css";

type CertificateDocxViewerProps = {
  url: string;
  fileName: string;
  onClose: () => void;
};

export default function CertificateDocxViewer({
  url,
  fileName,
  onClose,
}: CertificateDocxViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isLegacyDoc = /\.doc$/i.test(fileName);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const originalOverflow = document.body.style.overflow;
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    if (isLegacyDoc) return;

    let active = true;
    container.replaceChildren();

    const renderDocument = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not read the certificate file.");
        const documentBlob = await response.blob();
        const { renderAsync } = await import("docx-preview");
        if (!active) return;
        await renderAsync(documentBlob, container, undefined, {
          className: "certificateDocx",
          inWrapper: true,
          breakPages: true,
          useBase64URL: true,
        });
        if (active) setLoading(false);
      } catch {
        if (active) {
          setError("This DOCX certificate could not be displayed.");
          setLoading(false);
        }
      }
    };

    void renderDocument();
    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [fileName, isLegacyDoc, url]);

  return createPortal(
    <div
      className={styles.certificateViewerBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Certificate preview: ${fileName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.certificateViewer}>
        <header className={styles.certificateViewerHeader}>
          <h2 className={styles.certificateViewerTitle}>{fileName}</h2>
          <button
            type="button"
            className={styles.certificateViewerClose}
            onClick={onClose}
            aria-label="Close certificate preview"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.certificateViewerContent}>
          {loading && !error && !isLegacyDoc && (
            <p className={styles.certificateViewerLoading}>Loading certificate preview…</p>
          )}
          {error && <p role="alert" className={styles.certificateViewerError}>{error}</p>}
          {isLegacyDoc && (
            <div>
              <p className={styles.certificateViewerLoading}>
                Preview is not available for legacy DOC files.
              </p>
              <a href={url} download={fileName}>Download certificate</a>
            </div>
          )}
          {!error && <div ref={contentRef} className={styles.certificateDocxContent} />}
        </div>
      </section>
    </div>,
    document.body,
  );
}
