"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import styles from "./DocumentThumbnail.module.css";

type DocumentThumbnailProps = {
  fileName: string;
  url?: string;
  fileType?: string;
  size?: "compact" | "large" | "id" | "certificate";
  onPreview?: () => void;
};

function getDocumentKind(fileName: string, url?: string, fileType?: string) {
  const declaredType = fileType?.toLowerCase() || "";
  const dataUrlType = url?.match(/^data:([^;,]+)/i)?.[1]?.toLowerCase() || "";
  const extension = fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || "";
  const mimeType = declaredType.includes("/") ? declaredType : dataUrlType;

  if (mimeType.startsWith("image/") || /^(jpe?g|png|gif|webp|bmp|heic)$/.test(extension)) {
    return "image";
  }
  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx" ||
    declaredType === "docx"
  ) {
    return "docx";
  }
  return extension || declaredType.split("/").pop() || "file";
}

export default function DocumentThumbnail({
  fileName,
  url,
  fileType,
  size = "large",
  onPreview,
}: DocumentThumbnailProps) {
  const kind = getDocumentKind(fileName, url, fileType);
  const isLegacyDoc = /\.doc$/i.test(fileName);
  const isDocx = kind === "docx" && !isLegacyDoc && Boolean(url);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const [docxLoading, setDocxLoading] = useState(isDocx);
  const [docxError, setDocxError] = useState(false);
  const [scale, setScale] = useState(0.28);

  useEffect(() => {
    if (!isDocx || !wrapperRef.current) return;
    const wrapper = wrapperRef.current;
    const updateScale = () => {
      const width = wrapper.clientWidth;
      if (width > 0) {
        setScale(width / 816);
      }
    };
    updateScale();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateScale);
      observer.observe(wrapper);
      return () => observer.disconnect();
    }
  }, [isDocx]);

  useEffect(() => {
    if (!isDocx || !url || !docxContainerRef.current) return;
    let active = true;
    const container = docxContainerRef.current;
    container.replaceChildren();
    setDocxLoading(true);
    setDocxError(false);

    const renderDocx = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load document");
        const blob = await response.blob();
        const { renderAsync } = await import("docx-preview");
        if (!active) return;
        await renderAsync(blob, container, undefined, {
          className: "docxThumbnailPage",
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
        });
        if (active) setDocxLoading(false);
      } catch {
        if (active) {
          setDocxError(true);
          setDocxLoading(false);
        }
      }
    };

    void renderDocx();
    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [isDocx, url]);

  const content = (
    <>
      {kind === "image" && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className={styles.previewImage} />
      ) : isDocx && !docxError ? (
        <div ref={wrapperRef} className={styles.docxWrapper}>
          {docxLoading && (
            <div className={styles.docxLoading} aria-label="Loading document preview">
              <span className={styles.docxLoadingText}>Loading…</span>
            </div>
          )}
          <div
            ref={docxContainerRef}
            className={styles.docxContainer}
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      ) : (
        <span className={styles.fileTypeIcon} aria-hidden="true">
          <FileText size={size === "compact" ? 20 : 30} />
          <span>{isLegacyDoc ? "DOC" : kind.toUpperCase()}</span>
        </span>
      )}
    </>
  );

  if (onPreview && url) {
    return (
      <button
        type="button"
        className={`${styles.thumbnail} ${
          size === "compact" ? styles.compact : ""
        } ${
          size === "id" ? styles.idPreview : ""
        } ${
          size === "certificate" ? styles.certificateThumbnail : ""
        }`}
        onClick={onPreview}
        aria-label={`Preview ${fileName}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`${styles.thumbnail} ${size === "compact" ? styles.compact : ""} ${size === "id" ? styles.idPreview : ""}`}
      role="img"
      aria-label={`${kind === "image" ? "Image preview" : isDocx ? "Document preview" : `${kind.toUpperCase()} file`} for ${fileName}`}
    >
      {content}
    </span>
  );
}
