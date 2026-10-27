export const EXPERT_CERTIFICATE_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const MAX_EXPERT_CERTIFICATE_BYTES = 2 * 1024 * 1024;

export function getExpertCertificateFileError(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!/\.docx$/i.test(file.name)) {
    return "Only DOCX certificate files are allowed.";
  }
  if (file.type.toLowerCase() !== EXPERT_CERTIFICATE_MIME_TYPE) {
    return "The certificate must be a valid DOCX file.";
  }
  if (file.size > MAX_EXPERT_CERTIFICATE_BYTES) {
    return "DOCX certificate files must not exceed 2 MB.";
  }
  return null;
}
