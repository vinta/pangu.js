import pangu from '../../dist/node/index.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('NodePangu', () => {
  const fixtureDir = resolve(__dirname, '../_fixtures');

  describe('spacingFile()', () => {
    it('should process text file asynchronously', async () => {
      const data = await pangu.spacingFile(`${fixtureDir}/test_file.txt`);
      const expected = readFileSync(`${fixtureDir}/test_file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });

  describe('spacingFileSync()', () => {
    it('should process text file synchronously', () => {
      const data = pangu.spacingFileSync(`${fixtureDir}/test_file.txt`);
      const expected = readFileSync(`${fixtureDir}/test_file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });
});
