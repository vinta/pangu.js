import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import pangu from '../../dist/node/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('NodePangu', () => {
  const fixtureDir = path.resolve(__dirname, '../_fixtures');

  describe('spacingFile()', () => {
    it('performs on a text file', async () => {
      const data = await pangu.spacingFile(`${fixtureDir}/test_file.txt`);
      const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });

  describe('spacingFileSync()', () => {
    it('performs on a text file', () => {
      const data = pangu.spacingFileSync(`${fixtureDir}/test_file.txt`);
      const expected = fs.readFileSync(`${fixtureDir}/test_file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });
});
