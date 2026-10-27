import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateRawSync } from 'node:zlib';
import {
  DOCX_MIME_TYPE,
  MAX_CERTIFICATE_BYTES,
  validateExpertCertificates,
} from './expertCertificates.js';

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

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const [fileName, rawContent] of Object.entries(entries)) {
    const name = Buffer.from(fileName);
    const content = Buffer.from(rawContent);
    const compressed = deflateRawSync(content);
    const checksum = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localParts.push(localHeader, name, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, name);
    localOffset += localHeader.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function certificate(fileName, mimeType, content) {
  return {
    fileName,
    url: `data:${mimeType};base64,${Buffer.from(content).toString('base64')}`,
  };
}

const validDocx = () => certificate(
  'certificate.docx',
  DOCX_MIME_TYPE,
  createZip({
    '[Content_Types].xml': '<Types><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    'word/document.xml': '<w:document><w:body/></w:document>',
  }),
);

test('accepts DOCX files with matching extension, MIME type, and valid archive content', () => {
  assert.equal(validateExpertCertificates([validDocx()]).length, 1);
});

test('rejects PDF, PNG, and unsupported certificate extensions', () => {
  for (const [fileName, mimeType] of [
    ['certificate.pdf', 'application/pdf'],
    ['certificate.png', 'image/png'],
    ['certificate.pptx', DOCX_MIME_TYPE],
  ]) {
    assert.throws(
      () => validateExpertCertificates([certificate(fileName, mimeType, 'not a DOCX')]),
      /Only DOCX certificate files are allowed/,
    );
  }
});

test('rejects filename and data URL MIME mismatches', () => {
  assert.throws(
    () => validateExpertCertificates([certificate('certificate.docx', 'application/pdf', 'not a DOCX')]),
    /matching MIME type/,
  );
});

test('rejects malformed data URLs and invalid base64', () => {
  for (const url of ['not-a-data-url', `data:${DOCX_MIME_TYPE};base64,%%%`]) {
    assert.throws(
      () => validateExpertCertificates([{ fileName: 'certificate.docx', url }]),
      /valid DOCX data URL|malformed base64/,
    );
  }
});

test('rejects content that is not a valid DOCX archive', () => {
  assert.throws(
    () => validateExpertCertificates([
      certificate('certificate.docx', DOCX_MIME_TYPE, 'not a DOCX archive'),
    ]),
    /not a valid DOCX file/,
  );
});

test('rejects DOCX archives with corrupted entry checksums', () => {
  const bytes = Buffer.from(validDocx().url.split(',')[1], 'base64');
  const endOffset = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const centralDirectoryOffset = bytes.readUInt32LE(endOffset + 16);
  bytes.writeUInt32LE(0, centralDirectoryOffset + 16);
  assert.throws(
    () => validateExpertCertificates([
      certificate('certificate.docx', DOCX_MIME_TYPE, bytes),
    ]),
    /not a valid DOCX file/,
  );
});

test('rejects certificates exceeding 2 MB', () => {
  const oversized = Buffer.alloc(MAX_CERTIFICATE_BYTES + 1, 0x61);
  assert.throws(
    () => validateExpertCertificates([
      certificate('certificate.docx', DOCX_MIME_TYPE, oversized),
    ]),
    /must not exceed 2 MB/,
  );
});
