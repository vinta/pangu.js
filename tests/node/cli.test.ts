import { execSync } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI', () => {
  const cliPath = resolve(__dirname, '../../dist/node/cli.js');
  const fixtureDir = resolve(__dirname, '../../fixtures');
  const tempFile = join(fixtureDir, 'temp_test.txt');

  afterEach(() => {
    // Clean up
    if (existsSync(tempFile)) {
      unlinkSync(tempFile);
    }
  });

  it('handle help message display', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
    expect(output).toContain('usage: pangu');
    expect(output).toContain('Paranoid text spacing');
  });

  it('handle text from command line', () => {
    const output = execSync(`node ${cliPath} -t "你從什麼時候開始產生了我沒使用Monkey Patch的錯覺？"`, { encoding: 'utf8' });
    expect(output.trim()).toBe('你從什麼時候開始產生了我沒使用 Monkey Patch 的錯覺？');
  });

  it('handle file content', () => {
    writeFileSync(tempFile, '老婆餅裡面沒有老婆，JavaScript裡面也沒有Java');

    const output = execSync(`node ${cliPath} -f ${tempFile}`, { encoding: 'utf8' });
    expect(output.trim()).toBe('老婆餅裡面沒有老婆，JavaScript 裡面也沒有 Java');
  });

  it('reject mutually exclusive mode flags', () => {
    try {
      execSync(`node ${cliPath} -t -f ${tempFile}`, { encoding: 'utf8', stdio: 'pipe' });
      expect.unreachable('CLI should reject -t together with -f');
    } catch (error) {
      const { status, stderr } = error as { status: number; stderr: string };
      expect(status).toBe(1);
      expect(stderr).toContain('pangu: error: argument --file: not allowed with argument --text');
    }
  });
});
