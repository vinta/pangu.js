import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { cwd, tool_input } = JSON.parse(readFileSync(0, 'utf8'));
const root = resolve(import.meta.dirname, '../..');
const files = [...tool_input.command.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)];

if (files.some(([, file]) => ['src', 'browser-extensions'].some((dir) => resolve(cwd, file).startsWith(`${root}/${dir}/`)))) {
  const result = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  if (result.error) {
    console.error(result.error.message);
  }
  process.exit(result.status === 0 ? 0 : 2);
}
