import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI', () => {
  const cliPath = path.resolve(__dirname, '../../dist/node/cli.js');
  const fixtureDir = path.resolve(__dirname, '../_fixtures');
  const tempFile = path.join(fixtureDir, 'temp_test.txt');

  beforeEach(() => {
    // Create a temporary test file
    fs.writeFileSync(tempFile, '新八的構造成分有95%是眼鏡、3%是水、2%是垃圾');
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  it('should display help message', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
    expect(output).toContain('usage: pangu');
    expect(output).toContain('Paranoid text spacing');
  });

  it('should process text', () => {
    const output = execSync(`node ${cliPath} -t "新八的構造成分有95%是眼鏡"`, { encoding: 'utf8' });
    expect(output.trim()).toBe('新八的構造成分有 95% 是眼鏡');
  });

  it('should process a file', () => {
    const output = execSync(`node ${cliPath} -f ${tempFile}`, { encoding: 'utf8' });
    expect(output.trim()).toBe('新八的構造成分有 95% 是眼鏡、3% 是水、2% 是垃圾');
  });

  it('should process text by default', () => {
    const output = execSync(`node ${cliPath} "新八的構造成分有95%是眼鏡"`, { encoding: 'utf8' });
    expect(output.trim()).toBe('新八的構造成分有 95% 是眼鏡');
  });
});
