import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/seekerPhone.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { isValidSeekerPhone, normalizeSeekerPhone } = loaded.exports;

test('normalizes valid Indian phone formatting to the stored 10-digit format', () => {
  assert.equal(normalizeSeekerPhone('+91 98765 43210'), '9876543210');
  assert.equal(isValidSeekerPhone('9876543210'), true);
});

test('does not accept missing or malformed phone numbers', () => {
  assert.equal(normalizeSeekerPhone(''), '');
  assert.equal(isValidSeekerPhone(''), false);
  assert.equal(isValidSeekerPhone(normalizeSeekerPhone('98765abc')), false);
  assert.equal(isValidSeekerPhone(normalizeSeekerPhone('98765432101')), false);
});
