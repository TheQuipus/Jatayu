const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

export function getPortfolioSampleFileError(file: Pick<File, "name" | "size">): string | null {
  const lowerName = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
    return "Only PDF and DOCX files are allowed.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Portfolio files must be 5 MB or smaller.";
  }
  return null;
}
