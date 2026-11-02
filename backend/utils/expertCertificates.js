import { inflateRawSync } from 'node:zlib';

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const DOC_MIME_TYPE = 'application/msword';
export const MAX_CERTIFICATE_BYTES = 2 * 1024 * 1024;
const MAX_DOCX_XML_BYTES = 10 * 1024 * 1024;
const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function decodeDataUrl(dataUrl, expectedMimeType, extension) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || match[1].toLowerCase() !== expectedMimeType) {
    throw new TypeError(`Certificate must be a valid ${extension.toUpperCase()} data URL with a matching MIME type`);
  }

  const encoded = match[2];
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length === 0 || bytes.toString('base64') !== encoded) {
    throw new TypeError('Certificate contains malformed base64 data');
  }
  if (bytes.length > MAX_CERTIFICATE_BYTES) {
    throw new RangeError('Certificate files must not exceed 2 MB');
  }
  return bytes;
}

function findEndOfCentralDirectory(bytes) {
  const minOffset = Math.max(0, bytes.length - 22 - 0xffff);
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function readZipEntries(bytes) {
  const endOffset = findEndOfCentralDirectory(bytes);
  if (endOffset < 0 || endOffset + 22 > bytes.length) return null;

  const diskNumber = bytes.readUInt16LE(endOffset + 4);
  const centralDirectoryDisk = bytes.readUInt16LE(endOffset + 6);
  const entriesOnDisk = bytes.readUInt16LE(endOffset + 8);
  const entryCount = bytes.readUInt16LE(endOffset + 10);
  const centralDirectorySize = bytes.readUInt32LE(endOffset + 12);
  const centralDirectoryOffset = bytes.readUInt32LE(endOffset + 16);
  const commentLength = bytes.readUInt16LE(endOffset + 20);
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
    return null;
  }

  const entries = new Map();
  let offset = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > endOffset || bytes.readUInt32LE(offset) !== 0x02014b50) return null;
    const flags = bytes.readUInt16LE(offset + 8);
    const compressionMethod = bytes.readUInt16LE(offset + 10);
    const checksum = bytes.readUInt32LE(offset + 16);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const fileNameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const entryCommentLength = bytes.readUInt16LE(offset + 32);
    const localHeaderOffset = bytes.readUInt32LE(offset + 42);
    const entryEnd = offset + 46 + fileNameLength + extraLength + entryCommentLength;
    if (
      entryEnd > endOffset
      || (flags & 1) !== 0
      || compressedSize === 0xffffffff
      || uncompressedSize === 0xffffffff
      || localHeaderOffset === 0xffffffff
    ) {
      return null;
    }

    const fileName = bytes.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8');
    if (entries.has(fileName)) return null;
    entries.set(fileName, {
      fileName,
      compressionMethod,
      checksum,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    offset = entryEnd;
  }

  return offset === centralDirectoryOffset + centralDirectorySize ? entries : null;
}

function readZipEntry(bytes, entry) {
  const { localHeaderOffset, compressedSize, uncompressedSize, compressionMethod } = entry;
  if (
    localHeaderOffset + 30 > bytes.length
    || bytes.readUInt32LE(localHeaderOffset) !== 0x04034b50
  ) {
    return null;
  }
  const fileNameLength = bytes.readUInt16LE(localHeaderOffset + 26);
  const extraLength = bytes.readUInt16LE(localHeaderOffset + 28);
  const localFileName = bytes
    .subarray(localHeaderOffset + 30, localHeaderOffset + 30 + fileNameLength)
    .toString('utf8');
  if (localFileName !== entry.fileName) return null;
  const dataOffset = localHeaderOffset + 30 + fileNameLength + extraLength;
  const dataEnd = dataOffset + compressedSize;
  if (dataEnd > bytes.length || uncompressedSize > MAX_DOCX_XML_BYTES) return null;

  const compressed = bytes.subarray(dataOffset, dataEnd);
  let content;
  try {
    if (compressionMethod === 0) content = compressed;
    else if (compressionMethod === 8) {
      content = inflateRawSync(compressed, { maxOutputLength: MAX_DOCX_XML_BYTES });
    } else return null;
  } catch {
    return null;
  }

  return content.length === uncompressedSize && crc32(content) === entry.checksum
    ? content
    : null;
}

function hasValidDocxContent(bytes) {
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) return false;
  const entries = readZipEntries(bytes);
  const contentTypesEntry = entries?.get('[Content_Types].xml');
  const documentEntry = entries?.get('word/document.xml');
  if (!contentTypesEntry || !documentEntry) return false;

  const contentTypes = readZipEntry(bytes, contentTypesEntry)?.toString('utf8');
  const document = readZipEntry(bytes, documentEntry)?.toString('utf8');
  return Boolean(
    contentTypes
    && /<Types(?:\s|>)/.test(contentTypes)
    && /<Override\b[^>]*PartName=["']\/word\/document\.xml["'][^>]*ContentType=["']application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document\.main\+xml["']/.test(contentTypes)
    && document
    && /<(?:[A-Za-z_][\w.-]*:)?document(?:\s|>)/.test(document),
  );
}

function hasValidLegacyWordContent(bytes) {
  return bytes.length >= 8
    && bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

export function validateExpertCertificates(certificates) {
  if (!Array.isArray(certificates)) {
    throw new TypeError('Certificates must be an array');
  }

  for (const certificate of certificates) {
    if (
      !certificate
      || typeof certificate !== 'object'
      || Array.isArray(certificate)
      || typeof certificate.fileName !== 'string'
      || typeof certificate.url !== 'string'
    ) {
      throw new TypeError('Each certificate must include a file name and Word document data URL');
    }

    const extension = certificate.fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    if (extension !== 'doc' && extension !== 'docx') {
      throw new TypeError('Only DOC and DOCX certificate files are allowed');
    }

    const expectedMimeType = extension === 'doc' ? DOC_MIME_TYPE : DOCX_MIME_TYPE;
    const bytes = decodeDataUrl(certificate.url, expectedMimeType, extension);
    const hasValidContent = extension === 'doc'
      ? hasValidLegacyWordContent(bytes)
      : hasValidDocxContent(bytes);
    if (!hasValidContent) {
      throw new TypeError(`Certificate content is not a valid ${extension.toUpperCase()} file`);
    }
  }

  return certificates;
}
