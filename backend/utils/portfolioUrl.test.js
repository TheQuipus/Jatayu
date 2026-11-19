import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidPortfolioUrl } from './portfolioUrl.js';

test('accepts absolute HTTP and HTTPS portfolio URLs', () => {
  assert.equal(isValidPortfolioUrl('https://example.com'), true);
  assert.equal(isValidPortfolioUrl('https://github.com/username'), true);
  assert.equal(isValidPortfolioUrl('http://example.com/path'), true);
});

test('rejects malformed or non-absolute portfolio URLs', () => {
  for (const value of ['hello', 'abc.com', 'https://', 'https://example..com', 'ftp://example.com']) {
    assert.equal(isValidPortfolioUrl(value), false);
  }
});

test('leaves optional empty portfolio values to caller policy', () => {
  assert.equal(isValidPortfolioUrl(''), false);
  assert.equal(isValidPortfolioUrl('   '), false);
});