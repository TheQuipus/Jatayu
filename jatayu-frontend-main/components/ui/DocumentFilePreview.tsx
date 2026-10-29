"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, X } from "lucide-react";
import styles from "./DocumentFilePreview.module.css";

type DocumentFilePreviewProps = {
  fileName: string;
  url: string;
  fileType?: string;
  onClose: () => void;
};

function getPreviewKind(fileName: string, url: string, fileType?: string) {
  const declaredType = fileType?.toLowerCase() || "";
  const dataUrlType = url.match(/^data:([^;,]+)/i)?.[1]?.toLowerCase() || "";
  const type = (declaredType.includes("/") ? declaredType : dataUrlType).toLowerCase();
  const extension = fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || "";
  if (type.startsWith("image/") || /^(jpe?g|png|gif|webp|bmp|heic)$/.test(extension)) return "image";
  if (type === "application/pdf" || extension === "pdf") return "pdf";
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) return "docx";
  return "other";
}

export default function DocumentFilePreview({
  fileName,
  url,
  fileType,
  onClose,
}: DocumentFilePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [docxError, setDocxError] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    sourceUrl: string;
    objectUrl: string;
  } | null>(null);
  const pdfPreviewUrl = pdfPreview?.sourceUrl === url ? pdfPreview.objectUrl : url;
  const kind = getPreviewKind(fileName, url, fileType);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    if (kind !== "pdf" || !url.startsWith("data:")) return;

    let active = true;
    let objectUrl: string | null = null;
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load PDF");
        return response.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfPreview({ sourceUrl: url, objectUrl });
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [kind, url]);

  useEffect(() => {
    if (kind !== "docx" || !contentRef.current) return;
    let active = true;
    const container = contentRef.current;
    container.replaceChildren();

    const renderDocument = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load document");
        const blob = await response.blob();
        const { renderAsync } = await import("docx-preview");
        if (!active) return;
        await renderAsync(blob, container, undefined, {
          className: "documentFilePreview",
          inWrapper: true,
          breakPages: true,
          useBase64URL: true,
        });
      } catch {
        if (active) setDocxError(true);
      }
    };

    void renderDocument();
    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [kind, url]);

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${fileName}`}
      >
        <header className={styles.header}>
          <h2 className={styles.title} title={fileName}>{fileName}</h2>
          <button ref={closeButtonRef} type="button" className={styles.closeButton} onClick={onClose} aria-label="Close preview">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={fileName} className={styles.image} />
          ) : kind === "pdf" ? (
            <iframe
              title={fileName}
              src={`${pdfPreviewUrl}#toolbar=1&navpanes=0&view=FitH`}
              className={styles.frame}
            />
          ) : kind === "docx" ? (
            <>
              {docxError ? (
                <p className={styles.fallback} role="status">
                  This DOCX could not be previewed here. Open or download the original file below.
                </p>
              ) : null}
              <div ref={contentRef} className={styles.docxContent} />
            </>
          ) : (
            <p className={styles.fallback}>
              A preview is not available for this file. Open or download the original below.
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>
            <ExternalLink size={14} aria-hidden="true" /> Open file
          </a>
          <a href={url} download={fileName} className={styles.actionLink}>
            <Download size={14} aria-hidden="true" /> Download
          </a>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
