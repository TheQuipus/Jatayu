import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { TextDecoder } from 'node:util';

const source = fs.readFileSync(
  new URL('../lib/expertCertificateValidation.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports, TextDecoder });
const {
  EXPERT_CERTIFICATE_MIME_TYPE,
  EXPERT_LEGACY_CERTIFICATE_MIME_TYPE,
  getExpertCertificateContentError,
  getExpertCertificateFileError,
} = loaded.exports;
const credentialsStep = fs.readFileSync(
  new URL('../components/expert/onboarding/CredentialsStep.tsx', import.meta.url),
  'utf8',
);
const docxViewer = fs.readFileSync(
  new URL('../components/expert/onboarding/CertificateDocxViewer.tsx', import.meta.url),
  'utf8',
);
const credentialsStyles = fs.readFileSync(
  new URL('../components/expert/onboarding/CredentialsStep.module.css', import.meta.url),
  'utf8',
);

function createDocxPackage(entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const [fileName, content] of Object.entries(entries)) {
    const name = Buffer.from(fileName);
    const bytes = Buffer.from(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt32LE(bytes.length, 18);
    localHeader.writeUInt32LE(bytes.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localParts.push(localHeader, name, bytes);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt32LE(bytes.length, 20);
    centralHeader.writeUInt32LE(bytes.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, name);
    localOffset += localHeader.length + name.length + bytes.length;
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

function namedFile(bytes, name, type) {
  const file = new Blob([bytes], { type });
  Object.defineProperty(file, 'name', { value: name });
  return file;
}

test('accepts DOCX files at or below the 2 MB limit', () => {
  assert.equal(getExpertCertificateFileError({
    name: 'certificate.docx',
    type: EXPERT_CERTIFICATE_MIME_TYPE,
    size: 2 * 1024 * 1024,
  }), null);
});

test('accepts DOCX extension and MIME metadata together', () => {
  assert.equal(getExpertCertificateFileError({
    name: 'certificate.docx',
    type: EXPERT_CERTIFICATE_MIME_TYPE,
    size: 1024,
  }), null);
});

test('accepts DOC files with a matching MIME type and OLE signature', async () => {
  const signature = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const file = namedFile(signature, 'certificate.doc', EXPERT_LEGACY_CERTIFICATE_MIME_TYPE);
  assert.equal(getExpertCertificateFileError(file), null);
  assert.equal(await getExpertCertificateContentError(file), null);
});

test('accepts a DOCX ZIP package containing required Office document parts', async () => {
  const bytes = createDocxPackage({
    '[Content_Types].xml': '<Types/>',
    'word/document.xml': '<w:document/>',
  });
  const file = namedFile(bytes, 'certificate.docx', EXPERT_CERTIFICATE_MIME_TYPE);
  assert.equal(getExpertCertificateFileError(file), null);
  assert.equal(await getExpertCertificateContentError(file), null);
});

test('rejects renamed or invalid DOC content and mismatched extension/MIME metadata', async () => {
  const file = namedFile('not a Word document', 'renamed.doc', EXPERT_LEGACY_CERTIFICATE_MIME_TYPE);
  assert.match(await getExpertCertificateContentError(file), /not a valid Microsoft Word document/);
  assert.match(
    getExpertCertificateFileError({
      name: 'certificate.pdf',
      type: EXPERT_LEGACY_CERTIFICATE_MIME_TYPE,
      size: 1024,
    }),
    /Only DOC and DOCX/,
  );
});

test('rejects DOCX files without the required Office package parts', async () => {
  const file = namedFile(
    createDocxPackage({ 'ppt/presentation.xml': '<presentation/>' }),
    'renamed.docx',
    EXPERT_CERTIFICATE_MIME_TYPE,
  );
  assert.match(await getExpertCertificateContentError(file), /not a valid Microsoft Word document/);
});

test('rejects PDF, PNG, JPEG, and other unsupported file formats', () => {
  for (const [name, type] of [
    ['certificate.pdf', 'application/pdf'],
    ['certificate.png', 'image/png'],
    ['certificate.jpg', 'image/jpeg'],
    ['certificate.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ]) {
    assert.match(
      getExpertCertificateFileError({ name, type, size: 1024 }),
      /Only DOC and DOCX certificate files are allowed/,
    );
  }
});

test('rejects DOCX extension and MIME mismatches', () => {
  assert.match(
    getExpertCertificateFileError({ name: 'certificate.docx', type: 'application/pdf', size: 1024 }),
    /must be a valid DOCX file/,
  );
  assert.match(
    getExpertCertificateFileError({
      name: 'certificate.pdf',
      type: EXPERT_CERTIFICATE_MIME_TYPE,
      size: 1024,
    }),
    /Only DOC and DOCX certificate files are allowed/,
  );
});

test('rejects certificate files larger than 2 MB', () => {
  assert.match(
    getExpertCertificateFileError({
      name: 'certificate.docx',
      type: EXPERT_CERTIFICATE_MIME_TYPE,
      size: 2 * 1024 * 1024 + 1,
    }),
    /must not exceed 2 MB/,
  );
});

test('certificate click opens an in-app viewer that renders the stored DOCX data URL', () => {
  assert.match(credentialsStep, /onClick=\{onPreview\}/);
  assert.match(credentialsStep, /setCertificateToPreview\(\{[\s\S]*?url: entry\.fileUrl/);
  assert.match(credentialsStep, /<CertificateDocxViewer/);
  assert.match(credentialsStep, /fileUrl: cert\.url/);
  assert.match(credentialsStep, /renderCertificatePreview\(\s*entry\.fileUrl/);
  assert.match(docxViewer, /fetch\(url\)/);
  assert.match(docxViewer, /import\("docx-preview"\)/);
  assert.match(docxViewer, /renderAsync\(documentBlob, container/);
  assert.match(docxViewer, /aria-label="Close certificate preview"/);
  assert.match(credentialsStep, /getExpertCertificateContentError\(file\)/);
  assert.match(credentialsStep, /disabled=\{!canContinue \|\| pendingCertificateUploads > 0\}/);
  assert.match(credentialsStep, /\.doc,\.docx/);
});

test('legacy DOC certificates are offered as downloads instead of being sent to the DOCX renderer', () => {
  assert.match(docxViewer, /isLegacyDoc =/);
  assert.match(docxViewer, /Preview is not available for legacy DOC files/);
  assert.match(docxViewer, /download=\{fileName\}/);
});

test('certificate uploads do not bypass the existing KYC continuation requirements', () => {
  assert.match(credentialsStep, /const canContinue = hasGovernmentId \|\| hasKycVideo \|\| hasManualKycPhotos \|\| digilockerVerified/);
  assert.match(credentialsStep, /Please upload your Government ID front photo or complete video verification/);
});

test('certificate name uses a true placeholder and its informational note uses secondary text color', () => {
  assert.match(credentialsStep, /placeholder="Degree, diploma, licence"\s+value=\{entry\.name\}/);
  assert.match(credentialsStep, /styles\.idPrivacyNote\} \$\{styles\.certificateInfoNote/);
  assert.match(credentialsStyles, /\.certificateInfoNote\s*\{\s*color:\s*var\(--silver-chalice\);\s*\}/);
});
