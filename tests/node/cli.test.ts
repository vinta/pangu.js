import { execFileSync } from 'node:child_process';
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
    const output = execFileSync('node', [cliPath, '--help'], { encoding: 'utf8' });
    expect(output).toContain('usage: pangu');
    expect(output).toContain('Paranoid text spacing');
  });

  it('handle text from command line', () => {
    const output = execFileSync('node', [cliPath, '-t', '你從什麼時候開始產生了我沒使用Monkey Patch的錯覺？'], { encoding: 'utf8' });
    expect(output.trim()).toBe('你從什麼時候開始產生了我沒使用 Monkey Patch 的錯覺？');
  });

  it('handle file content', () => {
    writeFileSync(tempFile, '老婆餅裡面沒有老婆，JavaScript裡面也沒有Java');

    const output = execFileSync('node', [cliPath, '-f', tempFile], { encoding: 'utf8' });
    expect(output.trim()).toBe('老婆餅裡面沒有老婆，JavaScript 裡面也沒有 Java');
  });

  it('handle file content from stdin with a - argument', () => {
    const output = execFileSync('node', [cliPath, '-f', '-'], { encoding: 'utf8', input: '老婆餅裡面沒有老婆，JavaScript裡面也沒有Java\n' });
    expect(output).toBe('老婆餅裡面沒有老婆，JavaScript 裡面也沒有 Java\n');
  });

  it('handle text by default', () => {
    const output = execFileSync('node', [cliPath, '與PM戰鬥的人'], { encoding: 'utf8' });
    expect(output.trim()).toBe('與 PM 戰鬥的人');
  });

  it('handle text from stdin', () => {
    const output = execFileSync('node', [cliPath], { encoding: 'utf8', input: '當你凝視著bug，bug也凝視著你\n' });
    expect(output).toBe('當你凝視著 bug，bug 也凝視著你\n');
  });

  it('handle text from stdin with -t', () => {
    const output = execFileSync('node', [cliPath, '-t'], { encoding: 'utf8', input: '測試CLI參數\n' });
    expect(output).toBe('測試 CLI 參數\n');
  });

  it('handle text from stdin with a - argument', () => {
    const output = execFileSync('node', [cliPath, '-'], { encoding: 'utf8', input: '老婆餅裡面沒有老婆\n' });
    expect(output).toBe('老婆餅裡面沒有老婆\n');
  });

  it('preserve line structure of multi-line stdin', () => {
    const output = execFileSync('node', [cliPath], { encoding: 'utf8', input: '第一行有bug\n第二行有Java\n' });
    expect(output).toBe('第一行有 bug\n第二行有 Java\n');
  });

  it('prefer an explicit argument over stdin', () => {
    const output = execFileSync('node', [cliPath, '-t', '命令列的文字有PM'], { encoding: 'utf8', input: '標準輸入的文字有bug\n' });
    expect(output.trim()).toBe('命令列的文字有 PM');
  });

  it('check stdin that already has proper spacing', () => {
    const output = execFileSync('node', [cliPath, '-c'], { encoding: 'utf8', input: '當你凝視著 bug，bug 也凝視著你\n' });
    expect(output).toBe('');
  });

  it('check stdin that lacks proper spacing', () => {
    try {
      execFileSync('node', [cliPath, '-c'], { encoding: 'utf8', input: '當你凝視著bug\n', stdio: 'pipe' });
      expect.unreachable('CLI should exit 1 for text without proper spacing');
    } catch (error) {
      const { status } = error as { status: number };
      expect(status).toBe(1);
    }
  });

  it('reject -f without a file path even when input is piped', () => {
    try {
      execFileSync('node', [cliPath, '-f'], { encoding: 'utf8', input: '當你凝視著bug\n', stdio: 'pipe' });
      expect.unreachable('CLI should reject -f without a file path');
    } catch (error) {
      const { status, stderr } = error as { status: number; stderr: string };
      expect(status).toBe(1);
      expect(stderr).toContain('pangu: error: argument --file: expected a file path');
    }
  });

  it('reject -f with an empty file path without crashing', () => {
    try {
      execFileSync('node', [cliPath, '-f', ''], { encoding: 'utf8', input: '當你凝視著bug\n', stdio: 'pipe' });
      expect.unreachable('CLI should reject -f with an empty file path');
    } catch (error) {
      const { status, stderr } = error as { status: number; stderr: string };
      expect(status).toBe(1);
      expect(stderr).toContain('pangu: error: argument --file: expected a file path');
      expect(stderr).not.toContain('node:fs');
    }
  });

  it('reject mutually exclusive mode flags', () => {
    try {
      execFileSync('node', [cliPath, '-t', '-f', tempFile], { encoding: 'utf8', stdio: 'pipe' });
      expect.unreachable('CLI should reject -t together with -f');
    } catch (error) {
      const { status, stderr } = error as { status: number; stderr: string };
      expect(status).toBe(1);
      expect(stderr).toContain('pangu: error: argument --file: not allowed with argument --text');
    }
  });
});
