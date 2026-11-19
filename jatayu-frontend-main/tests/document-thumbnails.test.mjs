import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";

const readSource = (path) =>
  fs.readFileSync(new URL(path, import.meta.url), "utf8");

const thumbnail = readSource("../components/ui/DocumentThumbnail.tsx");
const preview = readSource("../components/ui/DocumentFilePreview.tsx");
const portfolio = readSource("../components/expert/onboarding/PortfolioSamplesSection.tsx");
const credentials = readSource("../components/expert/onboarding/CredentialsStep.tsx");
const applicationReview = readSource("../components/admin/review/ApplicationReview.tsx");

test("document thumbnails render actual images and a non-blank PDF/file-type indicator", () => {
  assert.match(thumbnail, /kind === "image" && url/);
  assert.match(thumbnail, /<img src={url}/);
  assert.match(thumbnail, /<FileText/);
  assert.match(thumbnail, /aria-label=/);
  assert.doesNotMatch(thumbnail, /<iframe/);
});

test("document preview opens the actual PDF, image, or DOCX URL and supports Escape/fallback links", () => {
  assert.match(preview, /declaredType\.includes\("\/"\) \? declaredType : dataUrlType/);
  assert.match(preview, /<iframe[\s\S]*?title={fileName}[\s\S]*?src={\`\$\{pdfPreviewUrl\}#toolbar=1/);
  assert.match(preview, /URL\.createObjectURL\(blob\)/);
  assert.match(preview, /URL\.revokeObjectURL\(objectUrl\)/);
  assert.match(preview, /pdfPreview\?\.sourceUrl === url \? pdfPreview\.objectUrl : url/);
  assert.match(preview, /<img src={url} alt={fileName}/);
  assert.match(preview, /renderAsync\(blob, container/);
  assert.match(preview, /event\.key === "Escape"/);
  assert.match(preview, /href={url} target="_blank"/);
  assert.match(preview, /download={fileName}/);
});

test("portfolio file error and add-another action share the existing orange token", () => {
  const portfolioStyles = readSource("../components/expert/onboarding/PortfolioSamplesSection.module.css");
  assert.match(portfolioStyles, /\.fileError\s*\{[^}]*color:\s*var\(--pomegranate\)/s);
  assert.match(portfolioStyles, /\.addAnotherBtn\s*\{[^}]*color:\s*var\(--pomegranate\)/s);
});

test("portfolio uploads display each saved sample in its own removable thumbnail card", () => {
  assert.match(portfolio, /samples\.map\(\(sample\)/);
  assert.match(portfolio, /<DocumentThumbnail/);
  assert.match(portfolio, /url={sample\.url}/);
  assert.match(portfolio, /onPreview={\(\) => setPreviewSample\(sample\)}/);
  assert.match(portfolio, /<DocumentFilePreview/);
  assert.match(portfolio, /aria-label={`Remove \$\{sample\.fileName\}`}/);
  assert.match(portfolio, /getPortfolioSampleFileError\(file\)/);
});

test("saved certificates keep their DOCX preview and removal actions", () => {
  assert.match(credentials, /<DocumentThumbnail/);
  assert.match(credentials, /fileType="DOCX"/);
  assert.match(credentials, /onPreview/);
  assert.match(credentials, /onRemove/);
  assert.match(credentials, /CertificateDocxViewer/);
  assert.match(credentials, /<DocumentFilePreview/);
  assert.match(credentials, /setGovernmentIdToPreview/);
  assert.match(credentials, /idFront\.url \|\| ""/);
  assert.match(credentials, /idBack\.url \|\| ""/);
  assert.match(credentials, /{url \? \(/);
  assert.match(credentials, /idDocumentUnavailable/);
});

test("admin review uses thumbnails for stored portfolio, ID, DigiLocker, and certificate documents", () => {
  assert.ok((applicationReview.match(/<DocumentThumbnail/g) || []).length >= 5);
  assert.match(applicationReview, /url={sample\.url}/);
  assert.match(applicationReview, /url={govId\.front\.url}/);
  assert.match(applicationReview, /url={govId\.back\.url}/);
  assert.match(applicationReview, /fileType={document\.documentType \|\| undefined}/);
  assert.match(applicationReview, /fileType="DOCX"/);
});
