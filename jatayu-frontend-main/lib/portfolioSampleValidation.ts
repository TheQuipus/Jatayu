const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ACCEPTED_FILE_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function getPortfolioSampleFileError(
  file: Pick<File, "name" | "size" | "type">
): string | null {
  const fileName = file.name.toLowerCase();

  const extension = Object.keys(ACCEPTED_FILE_TYPES).find((ext) =>
    fileName.endsWith(ext)
  );

  if (!extension) {
    return "Only PDF and DOCX files are allowed.";
  }

  if (file.size <= 0) {
    return "The selected file is empty or invalid.";
  }

  if (file.size > MAX_FILE_BYTES) {
    return "Portfolio files must be 5 MB or smaller.";
  }

  const expectedMimeType = ACCEPTED_FILE_TYPES[extension];

  if (file.type && file.type.toLowerCase() !== expectedMimeType) {
    return `The selected ${extension.slice(1).toUpperCase()} file has an invalid file type.`;
  }

  return null;
}
