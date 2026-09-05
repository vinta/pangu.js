// Run with Node 22.18+ for the shipping TypeScript prompt import. Reuses the approved pangu-eval Playwright CLI session; verifies the configured profile before each run.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { hyphenPrompt } from '../../browser-extensions/chrome/src/ai-spacing/hyphen-prompt.ts';
import { PROMPTS, SHOT_SENTENCES } from './hyphen-sign/prompts.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'experiment': { type: 'string', default: 'hyphen-sign' },
    'split': { type: 'string' },
    'out': { type: 'string' },
    'extension-id': { type: 'string' },
    'profile-path': { type: 'string' },
    'profile-name': { type: 'string' },
    'repeats': { type: 'string', default: '1' },
    'check': { type: 'boolean' },
    'require-perfect': { type: 'boolean' },
  },
});
const repeats = Number(values.repeats);
assert(Number.isSafeInteger(repeats) && repeats > 0, `invalid --repeats ${values.repeats}; use a positive integer`);
assert(['hyphen-sign', 'plus-sign'].includes(values.experiment), `invalid --experiment ${values.experiment}; use hyphen-sign or plus-sign`);
const plus = values.experiment === 'plus-sign' ? await import('./plus-sign/experiment.mjs') : null;
assert(plus || !values.split, '--split is only supported for --experiment plus-sign');
const split = values.split ?? 'development';
const variants = positionals.length ? positionals : plus ? ['v1-zh', 'v2-zh'] : ['shipping'];
const prompts = plus
  ? (await import('./plus-sign/prompts.js')).PROMPTS
  : {
      ...PROMPTS,
      shipping: { system: hyphenPrompt.systemPrompt, build: (kase) => hyphenPrompt.buildQuestion(kase.input, kase.at) },
    };
const root = new URL('./hyphen-sign/', import.meta.url);
const corpus = plus ? plus.loadCorpus(split) : JSON.parse(readFileSync(new URL('cases.json', root), 'utf8'));
const fields = plus ? [] : JSON.parse(readFileSync(new URL('field-cases.json', root), 'utf8')).cases;
const cases = [...corpus.cases, ...fields];
assert.equal(new Set(cases.map((kase) => kase.id)).size, cases.length, 'duplicate case IDs');
for (const kase of cases) {
  assert.equal(kase.input[kase.at], plus ? '+' : '-', `invalid symbol offset: ${kase.id}`);
  assert(corpus.enums[kase.enum].includes(kase.expected_label), `unknown expected label: ${kase.id}`);
  assert(!SHOT_SENTENCES.includes(kase.input), `few-shot leakage: ${kase.id}`);
}
if (!plus) {
  assert.deepEqual(corpus.enums.hyphen, hyphenPrompt.candidateLabels, 'shipping labels differ from the corpus; update the cases before comparing prompts');
}
const runs = variants.map((variant) => {
  assert(Object.hasOwn(prompts, variant), `unknown variant ${variant}; add it to scripts/prompt-experiments/${values.experiment}/prompts.js`);
  const prompt = prompts[variant];
  const inputs = cases.map((kase) => {
    const labels = corpus.enums[kase.enum];
    const tokens = labels.flatMap((label) => [prompt.displayLabels?.[label] ?? label].flat().map((token) => [token, label]));
    return { ...kase, question: prompt.build(kase, labels), tokens, responseConstraint: { type: 'string', enum: tokens.map(([token]) => token) } };
  });
  return { variant, prompt, inputs };
});
if (values.check) {
  plus?.check(corpus);
  console.log(`Checked ${cases.length} cases; rendered variants: ${variants.join(', ')}${plus ? '' : `; shipping source version: ${hyphenPrompt.version}`}`);
  process.exit(0);
}
assert(/^[a-p]{32}$/.test(values['extension-id'] ?? ''), `invalid --extension-id ${values['extension-id'] ?? '(missing)'}; copy the shipping extension ID from chrome://extensions/`);
assert(values.out, 'provide --out <new-directory> to preserve previous results');
const profilePath = values['profile-path'];
assert(profilePath && isAbsolute(profilePath), `invalid --profile-path ${profilePath ?? '(missing)'}; copy the absolute Profile Path from chrome://version`);
assert(values['profile-name'], 'provide --profile-name <display-name> for the intended Chrome profile');
const statePath = join(dirname(profilePath), 'Local State');
const state = JSON.parse(readFileSync(statePath, 'utf8'));
assert.equal(state.profile?.info_cache?.[basename(profilePath)]?.name, values['profile-name'], `Chrome profile name mismatch for ${profilePath}; verify --profile-name against ${statePath}`);
const output = resolve(values.out);
mkdirSync(output, { recursive: false });
writeFileSync(join(output, 'cases.json'), `${JSON.stringify({ ...corpus, cases }, null, 2)}\n`, { flag: 'wx' });

const extensionURL = `chrome-extension://${values['extension-id']}`;
async function runInBrowser(page, { profilePath, extensionURL, prompt, inputs, repeats }) {
  const context = page.context();
  const worker = context.serviceWorkers().find((candidate) => candidate.url() === `${extensionURL}/dist/service-worker.js`);
  if (!worker) {
    throw new Error(
      `service worker missing: ${extensionURL}/dist/service-worker.js; open chrome://extensions/?id=${extensionURL.split('://')[1]}, inspect its service worker in the configured profile, and retry`,
    );
  }
  // CDP can expose several profiles. A generic newPage() can land in Default; the extension creates this tab in its own profile.
  const infoURL = `chrome://version/?pangu-eval=${Date.now()}`;
  const infoReady = context.waitForEvent('page');
  const infoId = await worker.evaluate(async (url) => (await chrome.tabs.create({ url, active: false })).id, infoURL);
  try {
    const info = await infoReady;
    await info.waitForURL(infoURL);
    const actual = await info.locator('#profile_path').innerText();
    if (actual !== profilePath) {
      throw new Error(`wrong Chrome profile: ${actual}; reconnect to ${profilePath}`);
    }
  } finally {
    await worker.evaluate((id) => chrome.tabs.remove(id), infoId);
  }
  return await worker.evaluate(
    async ({ system, initialTurns, inputs, repeats }) => {
      if (typeof LanguageModel === 'undefined' || typeof LanguageModel.params !== 'function') {
        throw new Error('extension Prompt API sampling controls unavailable; check Chrome and the extension context');
      }
      const availability = await LanguageModel.availability();
      if (availability !== 'available') {
        throw new Error(`model availability is ${availability}; provision the model in the configured profile before running`);
      }
      const started = performance.now();
      const base = await LanguageModel.create({ initialPrompts: [{ role: 'system', content: system }, ...initialTurns], temperature: 0, topK: 1 });
      const createMs = Math.round(performance.now() - started);
      const results = [];
      try {
        for (const input of inputs) {
          const answers = [];
          for (let repeat = 0; repeat < repeats; repeat++) {
            const start = performance.now();
            let raw = null;
            let answer = null;
            let error = null;
            let turn;
            try {
              turn = await base.clone();
              raw = await turn.prompt(input.question, { responseConstraint: input.responseConstraint, signal: AbortSignal.timeout(30000) });
              answer = input.tokens.find(([token]) => token === JSON.parse(raw))?.[1] ?? null;
              if (answer === null) {
                throw new Error(`response outside constraint enum: ${raw}`);
              }
            } catch (caught) {
              error = String(caught);
            } finally {
              turn?.destroy();
            }
            answers.push({ answer, raw, error, ms: Math.round(performance.now() - start) });
          }
          results.push({
            ...input,
            answers,
            answer: answers[0].answer,
            correct: answers.every((answer) => answer.answer === input.expected_label),
            stable: answers.every((answer) => answer.raw === answers[0].raw),
          });
        }
      } finally {
        base.destroy();
      }
      return { availability, createMs, results };
    },
    { system: prompt.system, initialTurns: prompt.initialTurns ?? [], inputs, repeats },
  );
}

for (const [runIndex, { variant, prompt, inputs }] of runs.entries()) {
  const code = `async page => (${runInBrowser.toString()})(page, ${JSON.stringify({ profilePath, extensionURL, prompt, inputs, repeats })})`;
  const run = JSON.parse(
    execFileSync('playwright-cli', ['-s=pangu-eval', '--raw', 'run-code', code], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'inherit'] }),
  );

  const result = {
    set: plus ? `plus-sign:${split}` : 'hyphen-sign+field',
    backend: 'prompt-api',
    model: 'gemini-nano',
    context: 'extension-sw',
    variant,
    promptVersion: variant === 'shipping' ? hyphenPrompt.version : variant,
    repeats,
    sampling: 'temperature 0, topK 1',
    shuffle: false,
    timestamp: new Date().toISOString(),
    system: prompt.system,
    initialTurns: prompt.initialTurns ?? [],
    ...run,
    ...(plus ? { evaluation: plus.score(run, corpus, repeats) } : {}),
  };
  const file = join(output, `${runIndex + 1}-${variant}.json`);
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  const scored = run.results.filter((kase) => !kase.review);
  const original = scored.filter((kase) => !kase.id.startsWith('field-'));
  const ambiguous = original.filter((kase) => kase.type === 'ambiguous');
  const controls = original.filter((kase) => kase.type === 'control');
  const field = scored.filter((kase) => kase.id.startsWith('field-'));
  const errors = run.results.flatMap((kase) => kase.answers).filter((answer) => answer.error);
  if (plus) {
    const { sentences, ...summary } = result.evaluation;
    console.log(`${variant}: ${JSON.stringify(summary)}; errors ${errors.length}; ${file}`);
    console.log(
      'Misses:',
      scored
        .filter((kase) => !kase.correct)
        .map((kase) => `${kase.id}=${kase.answer}`)
        .join(', ') || 'none',
    );
    if (errors.length || (values['require-perfect'] && (scored.some((kase) => !kase.correct) || sentences.some((sentence) => !sentence.review && !sentence.correct)))) {
      process.exitCode = 1;
    }
    continue;
  }
  console.log(
    `${variant}: original ${ambiguous.filter((kase) => kase.correct).length}/${ambiguous.length}; control flips ${controls.filter((kase) => !kase.correct).length}/${controls.length}; field ${field.filter((kase) => kase.correct).length}/${field.length}; errors ${errors.length}; ${file}`,
  );
  console.log(
    'Misses:',
    scored
      .filter((kase) => !kase.correct)
      .map((kase) => `${kase.id}=${kase.answer}`)
      .join(', ') || 'none',
  );
  if (errors.length || (values['require-perfect'] && scored.some((kase) => !kase.correct))) {
    process.exitCode = 1;
  }
}
