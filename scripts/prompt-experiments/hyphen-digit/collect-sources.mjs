import assert from 'node:assert/strict';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { rolldown } from 'rolldown';
import { outputDirectory, pick, publicError, publicFixture, scratchDirectory } from '../public-artifacts.mjs';

const { values } = parseArgs({ options: { cases: { type: 'string', multiple: true }, out: { type: 'string' }, help: { type: 'boolean' } } });
const usage = 'Usage: node collect-sources.mjs --cases <reviewed-corpus.json> [--cases <other-corpus.json>] --out tmp/prompt-experiments/<round>/<run>';
if (values.help) {
  console.log(usage);
  process.exit(0);
}
assert(values.cases?.length && values.out, usage);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const endpoint = process.env.PANGU_CDP_URL;
const profile = process.env.PANGU_CHROME_PROFILE_PATH;
const extensionId = process.env.PANGU_EXTENSION_ID;
assert(endpoint && profile && /^[a-p]{32}$/.test(extensionId ?? ''), 'Set PANGU_CDP_URL, PANGU_CHROME_PROFILE_PATH, and PANGU_EXTENSION_ID; see the setup reference');
const cases = values.cases.flatMap((path) => JSON.parse(readFileSync(path, 'utf8')).cases);
assert(cases.length, 'Empty corpus; select a reviewed real-source case');
for (const kase of cases) {
  const source = new URL(kase.source);
  assert(['https:', 'http:'].includes(source.protocol) && !source.username && !source.password, `${kase.id}: use a public HTTP source URL without credentials`);
  assert(typeof kase.source_html === 'string' && typeof kase.source_css === 'string', `${kase.id}: provide the reviewed minimal HTML/CSS fixture`);
  assert(kase.original_excerpt?.[kase.original_at] === '-' && kase.input?.[kase.at] === '-', `${kase.id}: record exact original and production target offsets`);
}
const out = outputDirectory(root, values.out);
const temporary = scratchDirectory(root, 'pangu-source-check-');
let browser;
let page;
try {
  const entry = join(temporary, 'entry.ts');
  writeFileSync(
    entry,
    [
      ['Pangu', 'src/shared/index.ts'],
      ['hyphenDigit', 'browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit.ts'],
      ['readSentence', 'browser-extensions/chrome/src/ai-spacing/sentence-context.ts'],
    ]
      .map(([name, path]) => `export { ${name} } from ${JSON.stringify(join(root, path))};`)
      .join('\n'),
  );
  const build = await rolldown({ input: entry });
  let bundle;
  try {
    bundle = (await build.generate({ format: 'iife', name: 'hyphenEval' })).output[0].code;
  } finally {
    await build.close();
  }
  browser = await chromium.connectOverCDP(endpoint);
  const context = browser.contexts().find((context) => context.pages().some((page) => page.url() === 'chrome://extensions/'));
  assert(context, 'Open chrome://extensions/ in the intended profile and disable Pangu before collection');
  const extension = context.pages().find((page) => page.url() === 'chrome://extensions/');
  const item = extension.locator(`extensions-item[id="${extensionId}"]`);
  assert.equal(await item.locator('cr-toggle').evaluate((element) => element.checked), false, 'Disable Pangu before source collection');
  page = await context.newPage();
  await page.goto('chrome://version/');
  assert.equal(await page.locator('#profile_path').innerText(), profile, 'Wrong browser profile; attach the configured profile');
  writeFileSync(
    join(out, 'environment.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), browser: browser.version(), node: process.version, panguDisabled: true, profileVerified: true }, null, 2) + '\n',
    { flag: 'wx' },
  );
  for (const [index, source] of [...new Set(cases.map((kase) => kase.source))].entries()) {
    const selected = cases.filter((kase) => kase.source === source);
    let result;
    try {
      const response = await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
      await page.evaluate(bundle);
      const records = await page.evaluate(
        (selected) => {
          const { Pangu, hyphenDigit, readSentence } = globalThis.hyphenEval;
          return selected.map((kase) => {
            const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
            const matches = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              const start = node.data.indexOf(kase.original_excerpt);
              if (start < 0 || /^(SCRIPT|STYLE)$/.test(node.parentElement?.tagName)) {
                continue;
              }
              const at = start + kase.original_at;
              const input = readSentence(node, node.data, at, new Map());
              const settled = new Pangu().spaceText(node.data);
              const routed = hyphenDigit.find(node.data, settled, (at) => readSentence(node, node.data, at, new Map()));
              const styles = [];
              for (let parent = node.parentElement; parent && styles.length < 5; parent = parent.parentElement) {
                const style = getComputedStyle(parent);
                styles.push({ tag: parent.tagName, display: style.display, whiteSpace: style.whiteSpace, visibility: style.visibility });
              }
              const inputMatches = input.sentence === kase.input && input.at === kase.at;
              matches.push({
                exactExcerpt: true,
                ...(inputMatches ? { input: kase.input } : {}),
                at: input.at,
                inputMatches,
                routed: routed.some((match) => match.sentence === input.sentence && match.at === input.at),
                styles,
              });
            }
            return { id: kase.id, verified: matches.some((match) => match.inputMatches && match.routed), matches };
          });
        },
        selected.map(({ id, original_excerpt, original_at, input, at }) => ({ id, original_excerpt, original_at, input, at })),
      );
      const canonical = await page
        .locator('link[rel=canonical]')
        .first()
        .getAttribute('href')
        .catch(() => null);
      const publicURLs = new Set(selected.flatMap((kase) => [kase.source, kase.canonical_source]).filter(Boolean));
      result = {
        source,
        ...(publicURLs.has(page.url()) ? { finalURL: page.url() } : { redirected: true }),
        ...(canonical && publicURLs.has(new URL(canonical, page.url()).href) ? { canonical: new URL(canonical, page.url()).href } : {}),
        status: response?.status(),
        timestamp: new Date().toISOString(),
        panguDisabled: true,
        records: records.map((record, index) => ({
          ...pick(record, ['id', 'verified']),
          matches: record.matches.map((match) => ({
            ...pick(match, ['exactExcerpt', 'input', 'at', 'inputMatches', 'routed']),
            styles: match.styles.map((style) => pick(style, ['tag', 'display', 'whiteSpace', 'visibility'])),
          })),
          fixture: publicFixture(selected[index]),
        })),
      };
    } catch (error) {
      result = {
        source,
        timestamp: new Date().toISOString(),
        error: publicError(error, [endpoint, profile, extensionId, root, process.env.HOME]),
        records: selected.map((kase) => ({ id: kase.id, verified: false, fixture: publicFixture(kase) })),
      };
    }
    writeFileSync(join(out, `${String(index + 1).padStart(2, '0')}.json`), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    if (result.records.some((record) => !record.verified)) {
      process.exitCode = 1;
    }
    console.log(JSON.stringify({ source, status: result.status, error: result.error, records: result.records.map(({ id, verified, matches }) => ({ id, verified, matches: matches?.length })) }));
  }
} catch (error) {
  const failure = { timestamp: new Date().toISOString(), complete: false, error: publicError(error, [endpoint, profile, extensionId, root, process.env.HOME]) };
  writeFileSync(join(out, 'collection-error.json'), JSON.stringify(failure, null, 2) + '\n', { flag: 'wx' });
  console.error(failure.error);
  process.exitCode = 1;
} finally {
  if (page) {
    await page.close();
  }
  if (browser) {
    await browser.close();
  }
  rmSync(temporary, { recursive: true, force: true });
}
