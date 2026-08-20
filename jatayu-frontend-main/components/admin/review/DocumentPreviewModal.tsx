"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ExternalLink, Download } from "lucide-react";
import styles from "./ApplicationReview.module.css";

export type PreviewDocument = {
  name: string;
  url: string;
  size?: string;
};

function isPdfDocument(name: string, url: string): boolean {
  return (
    url.startsWith("data:application/pdf") ||
    /\.pdf($|\?)/i.test(url)
  );
}

function isVideoDocument(name: string, url: string): boolean {
  return (
    url.startsWith("data:video") ||
    /\.(mp4|webm|mov)($|\?)/i.test(url) ||
    /kyc.*video/i.test(name)
  );
}

interface DocumentPreviewModalProps {
  document: PreviewDocument;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  document,
  onClose,
}: DocumentPreviewModalProps) {
  const pdf = isPdfDocument(document.name, document.url);
  const video = isVideoDocument(document.name, document.url);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.previewOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.previewDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
      >
        <header className={styles.previewHeader}>
          <div>
            <h2 id="doc-preview-title" className={styles.previewTitle}>
              {document.name}
            </h2>
            {document.size ? (
              <p className={styles.previewMeta}>{document.size}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.previewCloseBtn}
            onClick={onClose}
            aria-label="Close document preview"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.previewBody}>
          {pdf ? (
            <iframe
              title={document.name}
              src={document.url}
              className={styles.previewFrame}
            />
          ) : video ? (
            <video
              src={document.url}
              controls
              className={styles.previewImage}
            />
          ) : (
            <Image
              src={document.url}
              alt={document.name}
              width={720}
              height={960}
              className={styles.previewImage}
              unoptimized={document.url.startsWith("data:") || document.url.startsWith("blob:")}
            />
          )}
        </div>

        <footer className={styles.previewFooter}>
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.previewOpenBtn}
          >
            <ExternalLink size={14} />
            Open in New Tab
          </a>
          <a href={document.url} download={document.name} className={styles.previewDownloadBtn}>
            <Download size={14} />
            Download
          </a>
        </footer>
      </div>
    </div>,
    window.document.body
  );
}
