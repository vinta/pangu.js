import pangu from '../../dist/node/index.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('NodePangu', () => {
  const fixtureDir = resolve(__dirname, '../../fixtures');

  describe('spacingFile()', () => {
    it('handle text file asynchronously', async () => {
      const data = await pangu.spacingFile(`${fixtureDir}/test-file.txt`);
      const expected = readFileSync(`${fixtureDir}/test-file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });

  describe('spacingFileSync()', () => {
    it('handle text file synchronously', () => {
      const data = pangu.spacingFileSync(`${fixtureDir}/test-file.txt`);
      const expected = readFileSync(`${fixtureDir}/test-file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });
});
