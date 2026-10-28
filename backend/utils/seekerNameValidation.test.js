import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidSeekerFullName } from './seekerNameValidation.js';

test('rejects missing, numeric-only name parts, and unsupported names', () => {
  for (const name of [null, undefined, '', '   ', '123', '123 Sharma', 'Priya 123', "'- ,", 'Priya!']) {
    assert.equal(isValidSeekerFullName(name), false, String(name));
  }
});

test('accepts names containing letters, optional digits, and supported punctuation', () => {
  for (const name of ['Priya Sharma', 'R2D2', 'Mary-Jane O\'Connor', 'Smith, Jr', 'கவி']) {
    assert.equal(isValidSeekerFullName(name), true, name);
  }
});