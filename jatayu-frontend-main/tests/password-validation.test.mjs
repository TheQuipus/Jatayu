import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/passwordValidation.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { getPasswordHint, getPasswordValidationError } = loaded.exports;

test('instruction mode explains each missing required password class', () => {
  const cases = [
    ['PASSWORD1!', 'Password must contain at least one lowercase letter.'],
    ['password1!', 'Password must contain at least one uppercase letter.'],
    ['Password!', 'Password must contain at least one number.'],
    ['Password1', 'Password must contain at least one symbol.'],
  ];

  for (const [password, expected] of cases) {
    assert.equal(getPasswordHint(password, undefined, 'instruction'), expected);
    assert.equal(getPasswordValidationError(password, undefined, 'instruction'), expected);
  }
});

test('instruction mode explains the minimum length requirement', () => {
  assert.equal(getPasswordHint('', undefined, 'instruction'), 'Password must be at least 8 characters long.');
  assert.equal(getPasswordValidationError('Pass1!', undefined, 'instruction'), 'Password must be at least 8 characters long.');
});

test('default mode retains existing status-style copy', () => {
  assert.equal(getPasswordHint('password1!'), 'Contains uppercase letter');
  assert.equal(getPasswordValidationError('password1!'), 'Contains uppercase letter');
  assert.equal(getPasswordHint('Password!'), 'Contains a number');
});