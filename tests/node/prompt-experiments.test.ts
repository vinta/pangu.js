import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';

test.skipIf(!process.features.typescript)('requires an explicit matching Chrome profile before creating experiment output', () => {
  const root = mkdtempSync(join(tmpdir(), 'pangu-profile-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  const profile = join(root, 'Test Profile');
  const output = join(root, 'results');
  writeFileSync(join(root, 'Local State'), JSON.stringify({ profile: { info_cache: { 'Test Profile': { name: 'Experiment' } } } }));
  const args = ['scripts/prompt-experiments/sweep.mjs', '--extension-id', 'a'.repeat(32), '--out', output];

  for (const [options, message] of [
    [[], 'invalid --profile-path (missing)'],
    [['--profile-path', 'relative'], 'invalid --profile-path relative'],
    [['--profile-path', profile], 'provide --profile-name'],
    [['--profile-path', profile, '--profile-name', 'Wrong'], 'Chrome profile name mismatch'],
  ] as const) {
    const run = spawnSync(process.execPath, [...args, ...options], { encoding: 'utf8' });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(message);
    expect(existsSync(output)).toBe(false);
  }

  // A valid profile reaches output creation; an existing directory stops the run before Chrome is contacted.
  mkdirSync(output);
  const run = spawnSync(process.execPath, [...args, '--profile-path', profile, '--profile-name', 'Experiment'], { encoding: 'utf8' });
  expect(run.status).toBe(1);
  expect(run.stderr).toContain('EEXIST');
});
