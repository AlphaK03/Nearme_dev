import test from 'node:test';
import assert from 'node:assert/strict';
import { previewOrigin } from '../src/preview-config.mjs';

test('HTTPS preview is optional and normalizes an exact origin', () => {
  assert.equal(previewOrigin(undefined), null);
  assert.equal(previewOrigin(''), null);
  assert.equal(previewOrigin(' https://nearme-8787.use.devtunnels.ms/ '), 'https://nearme-8787.use.devtunnels.ms');
});

test('rejects insecure, malformed and ambiguous preview addresses', () => {
  for (const value of ['http://nearme.example', 'not-a-url', 'https://user:password@nearme.example', 'https://nearme.example/path', 'https://nearme.example/?key=value', 'https://nearme.example/#map']) {
    assert.throws(() => previewOrigin(value));
  }
});
