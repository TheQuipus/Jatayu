import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(
  new URL('../lib/expertCertificateValidation.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { EXPERT_CERTIFICATE_MIME_TYPE, getExpertCertificateFileError } = loaded.exports;
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

test('accepts DOCX files at or below the 2 MB limit', () => {
  assert.equal(getExpertCertificateFileError({
    name: 'certificate.docx',
    type: EXPERT_CERTIFICATE_MIME_TYPE,
    size: 2 * 1024 * 1024,
  }), null);
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
      /Only DOCX certificate files are allowed/,
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
    /Only DOCX certificate files are allowed/,
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
});

test('certificate name uses a true placeholder and its informational note uses secondary text color', () => {
  assert.match(credentialsStep, /placeholder="Degree, diploma, licence"\s+value=\{entry\.name\}/);
  assert.match(credentialsStep, /styles\.idPrivacyNote\} \$\{styles\.certificateInfoNote/);
  assert.match(credentialsStyles, /\.certificateInfoNote\s*\{\s*color:\s*var\(--silver-chalice\);\s*\}/);
});
