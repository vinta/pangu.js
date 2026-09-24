import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import * as browserEntry from '../../dist/browser/index.js';

// dist/browser/pangu.js is the one-file build for CDNs and downloads (ADR 0031). Imported from an empty folder, a sibling import cannot resolve.
// The examples page serves it from inside node_modules, where the siblings are there to resolve, so it never notices one
const alone = mkdtempSync(join(tmpdir(), 'pangu-standalone-'));
for (const name of ['pangu.js', 'pangu.js.map']) {
  copyFileSync(new URL(`../../dist/browser/${name}`, import.meta.url), join(alone, name));
}
// dist/browser/pangu.d.ts re-exports dist/browser/index.d.ts, so the bundler entry is also the type of the standalone file
const standalone = (await import(/* @vite-ignore */ pathToFileURL(join(alone, 'pangu.js')).href)) as typeof browserEntry;

describe('Browser standalone imports', () => {
  afterAll(() => {
    rmSync(alone, { recursive: true });
  });

  it('works when copied out alone', () => {
    expect(standalone.default.spaceText('Hello世界')).toBe('Hello 世界');
    expect(new standalone.BrowserPangu().spaceText('Hello世界')).toBe('Hello 世界');
  });

  it('has the surface of pangu/browser', () => {
    expect(Object.keys(standalone).sort()).toEqual(Object.keys(browserEntry).sort());
  });
});
