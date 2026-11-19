import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/nameValidation.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { getNameValidationError } = loaded.exports;

test('rejects numeric-only values and preserves required and minimum-length checks', () => {
  assert.match(getNameValidationError('123'), /at least one letter/);
  assert.equal(getNameValidationError('   '), 'Required');
  assert.equal(getNameValidationError('A'), 'Too short');
});

test('accepts names with letters, digits, allowed punctuation, spaces, and Unicode', () => {
  for (const name of ['R2D2', 'Mary-Jane', "O'Connor", 'Smith, Jr', 'கவி']) {
    assert.equal(getNameValidationError(name), null, name);
  }
});

test('rejects unsupported punctuation and values without letters', () => {
  assert.match(getNameValidationError('Jane!'), /Use letters/);
  assert.match(getNameValidationError("'- ,"), /at least one letter/);
});