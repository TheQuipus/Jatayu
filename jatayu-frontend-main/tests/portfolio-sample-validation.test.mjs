import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(
  new URL('../lib/portfolioSampleValidation.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { getPortfolioSampleFileError } = loaded.exports;

test('accepts PDF and DOCX extensions case-insensitively', () => {
  for (const name of ['portfolio.pdf', 'portfolio.docx', 'PORTFOLIO.PDF', 'PORTFOLIO.DOCX']) {
    assert.equal(getPortfolioSampleFileError({ name, size: 1024 }), null);
  }
});

test('rejects unsupported portfolio extensions with a clear error', () => {
  for (const name of ['portfolio.ppt', 'portfolio.pptx', 'portfolio.jpg', 'portfolio.png', 'portfolio.exe']) {
    assert.equal(
      getPortfolioSampleFileError({ name, size: 1024 }),
      'Only PDF and DOCX files are allowed.',
    );
  }
});

test('accepts portfolio files up to 5 MB and rejects larger files', () => {
  assert.equal(
    getPortfolioSampleFileError({ name: 'portfolio.pdf', size: 5 * 1024 * 1024 }),
    null,
  );
  assert.equal(
    getPortfolioSampleFileError({ name: 'portfolio.pdf', size: 5 * 1024 * 1024 + 1 }),
    'Portfolio files must be 5 MB or smaller.',
  );
});
