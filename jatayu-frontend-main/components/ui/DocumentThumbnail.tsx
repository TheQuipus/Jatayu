"use client";

import { FileText } from "lucide-react";
import styles from "./DocumentThumbnail.module.css";

type DocumentThumbnailProps = {
  fileName: string;
  url?: string;
  fileType?: string;
  size?: "compact" | "large" | "id";
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

  const content = (
    <>
      {kind === "image" && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className={styles.previewImage} />
      ) : (
        <span className={styles.fileTypeIcon} aria-hidden="true">
          <FileText size={size === "compact" ? 20 : 30} />
          <span>{kind.toUpperCase()}</span>
        </span>
      )}
    </>
  );

  if (onPreview && url) {
    return (
      <button
        type="button"
        className={`${styles.thumbnail} ${size === "compact" ? styles.compact : ""} ${size === "id" ? styles.idPreview : ""} ${styles.thumbnailButton}`}
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
      aria-label={`${kind === "image" ? "Image preview" : `${kind.toUpperCase()} file`} for ${fileName}`}
    >
      {content}
    </span>
  );
}
