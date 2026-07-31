import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import pangu from '../../dist/node/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('NodePangu', () => {
  const fixtureDir = resolve(__dirname, '../../fixtures');

  describe('spacingFile()', () => {
    it('handle text file asynchronously', async () => {
      const data = await pangu.spacingFile(`${fixtureDir}/text-file.txt`);
      const expected = readFileSync(`${fixtureDir}/text-file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });

    it('handle text file without EOF newline asynchronously', async () => {
      const data = await pangu.spacingFile(`${fixtureDir}/text-file-no-eof-newline.txt`);
      const expected = readFileSync(`${fixtureDir}/text-file-no-eof-newline.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });
  });

  describe('spacingFileSync()', () => {
    it('handle text file synchronously', () => {
      const data = pangu.spacingFileSync(`${fixtureDir}/text-file.txt`);
      const expected = readFileSync(`${fixtureDir}/text-file.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });

    it('handle text file without EOF newline synchronously', () => {
      const data = pangu.spacingFileSync(`${fixtureDir}/text-file-no-eof-newline.txt`);
      const expected = readFileSync(`${fixtureDir}/text-file-no-eof-newline.expected.txt`, 'utf8');
      expect(data).toBe(expected);
    });

    // readFileSync never translates line endings, so CR and CRLF pass through the spacing rules untouched
    describe('line endings', () => {
      const tempFile = join(fixtureDir, 'temp_line_endings.txt');

      afterEach(() => {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
      });

      it('preserve CRLF line endings', () => {
        writeFileSync(tempFile, '中文abc\r\n第二行ABC\r\n');
        expect(pangu.spacingFileSync(tempFile)).toBe('中文 abc\r\n第二行 ABC\r\n');
      });

      it('preserve lone CR line endings', () => {
        writeFileSync(tempFile, '中文abc\r尾行ABC\r');
        expect(pangu.spacingFileSync(tempFile)).toBe('中文 abc\r尾行 ABC\r');
      });

      it('preserve CRLF without EOF newline', () => {
        writeFileSync(tempFile, '中文abc\r\n尾行XYZ');
        expect(pangu.spacingFileSync(tempFile)).toBe('中文 abc\r\n尾行 XYZ');
      });

      it('preserve trailing space before CRLF', () => {
        writeFileSync(tempFile, '字A\r\n空格 在行尾 \r\n');
        expect(pangu.spacingFileSync(tempFile)).toBe('字 A\r\n空格 在行尾 \r\n');
      });
    });
  });
});
