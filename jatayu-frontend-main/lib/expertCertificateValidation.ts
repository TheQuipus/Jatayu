export const EXPERT_CERTIFICATE_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const EXPERT_LEGACY_CERTIFICATE_MIME_TYPE = "application/msword";
export const MAX_EXPERT_CERTIFICATE_BYTES = 2 * 1024 * 1024;
const OLE_COMPOUND_FILE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const MAX_DOCX_XML_BYTES = 10 * 1024 * 1024;

export function getExpertCertificateFileError(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  const extension = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  if (extension !== "doc" && extension !== "docx") {
    return "Only DOC and DOCX certificate files are allowed.";
  }
  const expectedMimeType = extension === "doc"
    ? EXPERT_LEGACY_CERTIFICATE_MIME_TYPE
    : EXPERT_CERTIFICATE_MIME_TYPE;
  if (file.type.toLowerCase() !== expectedMimeType) {
    return `The certificate must be a valid ${extension.toUpperCase()} file.`;
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "The certificate file is empty or invalid.";
  }
  if (file.size > MAX_EXPERT_CERTIFICATE_BYTES) {
    return "Certificate files must not exceed 2 MB.";
  }
  return null;
}

function hasValidDocxPackage(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumEndOffset = Math.max(0, bytes.length - 22 - 0xffff);
  let endOffset = -1;

  for (let offset = bytes.length - 22; offset >= minimumEndOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0 || endOffset + 22 > bytes.length) return false;

  const diskNumber = view.getUint16(endOffset + 4, true);
  const centralDirectoryDisk = view.getUint16(endOffset + 6, true);
  const entriesOnDisk = view.getUint16(endOffset + 8, true);
  const entryCount = view.getUint16(endOffset + 10, true);
  const centralDirectorySize = view.getUint32(endOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(endOffset + 16, true);
  const commentLength = view.getUint16(endOffset + 20, true);
  if (
    diskNumber !== 0
    || centralDirectoryDisk !== 0
    || entriesOnDisk !== entryCount
    || entryCount === 0xffff
    || centralDirectorySize === 0xffffffff
    || centralDirectoryOffset === 0xffffffff
    || endOffset + 22 + commentLength !== bytes.length
    || centralDirectoryOffset + centralDirectorySize > endOffset
  ) {
    return false;
  }

  const entries = new Map<string, number>();
  const decoder = new TextDecoder();
  let offset = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > endOffset || view.getUint32(offset, true) !== 0x02014b50) return false;
    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const entryEnd = offset + 46 + fileNameLength + extraLength + entryCommentLength;
    if (
      entryEnd > endOffset
      || (flags & 1) !== 0
      || compressedSize === 0xffffffff
      || uncompressedSize === 0xffffffff
      || localHeaderOffset === 0xffffffff
      || (compressionMethod !== 0 && compressionMethod !== 8)
      || localHeaderOffset + 30 > centralDirectoryOffset
      || view.getUint32(localHeaderOffset, true) !== 0x04034b50
    ) {
      return false;
    }

    const nameStart = offset + 46;
    const fileName = decoder.decode(bytes.subarray(nameStart, nameStart + fileNameLength));
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const localNameStart = localHeaderOffset + 30;
    const dataStart = localNameStart + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (
      entries.has(fileName)
      || dataEnd > centralDirectoryOffset
      || decoder.decode(bytes.subarray(localNameStart, localNameStart + localNameLength)) !== fileName
      || view.getUint16(localHeaderOffset + 6, true) !== flags
      || view.getUint16(localHeaderOffset + 8, true) !== compressionMethod
    ) {
      return false;
    }
    entries.set(fileName, uncompressedSize);
    offset = entryEnd;
  }

  return offset === centralDirectoryOffset + centralDirectorySize
    && (entries.get("[Content_Types].xml") ?? MAX_DOCX_XML_BYTES + 1) <= MAX_DOCX_XML_BYTES
    && (entries.get("word/document.xml") ?? MAX_DOCX_XML_BYTES + 1) <= MAX_DOCX_XML_BYTES;
}

export async function getExpertCertificateContentError(file: File): Promise<string | null> {
  const extension = file.name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (extension === "doc") {
    const isLegacyWordDocument = OLE_COMPOUND_FILE_SIGNATURE.every(
      (byte, index) => bytes[index] === byte,
    );
    return isLegacyWordDocument
      ? null
      : "The DOC certificate content is not a valid Microsoft Word document.";
  }
  if (extension !== "docx") {
    return "Only DOC and DOCX certificate files are allowed.";
  }
  return hasValidDocxPackage(bytes)
    ? null
    : "The DOCX certificate content is not a valid Microsoft Word document.";
}
