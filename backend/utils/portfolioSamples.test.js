import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePortfolioSamples } from './portfolioSamples.js';

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function sample(fileName, mimeType, bytes) {
  return {
    fileName,
    url: `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`,
  };
}

const validPdf = () => sample('portfolio.pdf', 'application/pdf', '%PDF-1.7 sample');
const validDocx = () => sample(
  'portfolio.docx',
  DOCX_MIME_TYPE,
  Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('[Content_Types].xml word/document.xml'),
  ]),
);

test('accepts PDF and DOCX samples with case-insensitive extensions and matching signatures', () => {
  assert.equal(validatePortfolioSamples([validPdf(), validDocx()]).length, 2);
  assert.equal(validatePortfolioSamples([
    { ...validPdf(), fileName: 'PORTFOLIO.PDF' },
    { ...validDocx(), fileName: 'PORTFOLIO.DOCX' },
  ]).length, 2);
});

test('rejects unsupported portfolio sample extensions', () => {
  assert.throws(
    () => validatePortfolioSamples([sample('portfolio.pptx', 'application/pdf', '%PDF-1.7 sample')]),
    /Only PDF and DOCX/,
  );
});

test('rejects malformed data URLs and filename/MIME mismatches', () => {
  for (const url of ['not-a-data-url', 'data:application/pdf;base64,%%%']) {
    assert.throws(
      () => validatePortfolioSamples([{ fileName: 'portfolio.pdf', url }]),
      /valid base64 data URL|malformed base64/,
    );
  }
  assert.throws(
    () => validatePortfolioSamples([sample('portfolio.pdf', DOCX_MIME_TYPE, '%PDF-1.7 sample')]),
    /matching MIME type/,
  );
});

test('rejects files whose content signature does not match their extension', () => {
  assert.throws(
    () => validatePortfolioSamples([sample('renamed.pdf', 'application/pdf', 'not a PDF')]),
    /content does not match/,
  );
  assert.throws(
    () => validatePortfolioSamples([sample('renamed.docx', DOCX_MIME_TYPE, 'not a DOCX archive')]),
    /content does not match/,
  );
});

test('accepts portfolio files up to 5 MB and rejects larger files', () => {
  const validAtLimit = sample('portfolio.pdf', 'application/pdf', Buffer.concat([
    Buffer.from('%PDF-1.7'),
    Buffer.alloc(MAX_FILE_BYTES - Buffer.byteLength('%PDF-1.7')),
  ]));
  assert.equal(validatePortfolioSamples([validAtLimit]).length, 1);

  const oversized = sample('portfolio.pdf', 'application/pdf', Buffer.concat([
    Buffer.from('%PDF-1.7'),
    Buffer.alloc(MAX_FILE_BYTES + 1 - Buffer.byteLength('%PDF-1.7')),
  ]));
  assert.throws(
    () => validatePortfolioSamples([oversized]),
    /Portfolio files must be 5 MB or smaller/,
  );
});
