// Run with Node 22.18+ for the shipping TypeScript prompt import. Reuses the approved pangu-eval Playwright CLI session; verifies the configured profile before each run.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { hyphenDigitPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts';
import { pick, publicCase, publicError } from './public-artifacts.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'experiment': { type: 'string', default: 'hyphen-digit' },
    'split': { type: 'string' },
    'cases': { type: 'string' },
    'prompts': { type: 'string' },
    'out': { type: 'string' },
    'extension-id': { type: 'string', default: process.env.PANGU_EXTENSION_ID },
    'profile-path': { type: 'string', default: process.env.PANGU_CHROME_PROFILE_PATH },
    'repeats': { type: 'string', default: '1' },
    'orders': { type: 'string', default: '2' },
    'check': { type: 'boolean' },
    'require-perfect': { type: 'boolean' },
    'diagnostics': { type: 'string' },
  },
});
const repeats = Number(values.repeats);
assert(Number.isSafeInteger(repeats) && repeats > 0, `invalid --repeats ${values.repeats}; use a positive integer`);
const orderCount = Number(values.orders);
assert(Number.isSafeInteger(orderCount) && orderCount > 0, `invalid --orders ${values.orders}; use a positive integer`);
assert(['hyphen-digit', 'digit-plus'].includes(values.experiment), `invalid --experiment ${values.experiment}; use hyphen-digit or digit-plus`);
assert(values.cases === undefined || values.experiment === 'hyphen-digit', '--cases is only supported for --experiment hyphen-digit');
const digitPlus = values.experiment === 'digit-plus' ? await import('./digit-plus/experiment.mjs') : null;
assert(digitPlus || !values.split, '--split is only supported for --experiment digit-plus');
assert(digitPlus || values.cases, 'provide --cases <verified-corpus.json> for --experiment hyphen-digit');
const split = values.split ?? 'development';
const variants = positionals.length ? positionals : digitPlus ? ['v18-en-real-examples'] : ['shipping'];
assert(!digitPlus || !values.prompts, '--prompts is only supported for --experiment hyphen-digit');
const registry = digitPlus ? (await import('./digit-plus/prompts.js')).PROMPTS : (await import(values.prompts ? pathToFileURL(resolve(values.prompts)).href : './hyphen-digit/prompts.js')).PROMPTS;
assert(registry && typeof registry === 'object' && !Array.isArray(registry), 'Prompt module must export a PROMPTS object');
assert(digitPlus || !Object.hasOwn(registry, 'shipping'), 'Prompt module cannot override shipping; shipping always imports the production prompt');
const prompts = digitPlus ? registry : { ...registry, shipping: { system: hyphenDigitPrompt.systemPrompt, build: (kase) => hyphenDigitPrompt.buildQuestion(kase.input, kase.at) } };
const corpus = digitPlus ? digitPlus.loadCorpus(split) : JSON.parse(readFileSync(values.cases, 'utf8'));
const cases = corpus.cases?.map(publicCase);
assert(Array.isArray(cases) && cases.length > 0, 'empty corpus; provide at least one scored case');
if (!digitPlus) {
  assert(['development', 'holdout'].includes(corpus.role), 'invalid corpus role; use development or holdout');
  assert(!values.diagnostics || corpus.role === 'development', 'holdout diagnostics are forbidden; use development cases');
}
assert(
  corpus.diagnosticQuestions === undefined ||
    (Array.isArray(corpus.diagnosticQuestions) && corpus.diagnosticQuestions.length > 0 && corpus.diagnosticQuestions.every((question) => typeof question === 'string' && question.trim())),
  `invalid diagnosticQuestions in ${values.cases ?? values.experiment}; use a nonempty array of nonempty strings`,
);
const diagnosticIds = values.diagnostics?.split(',');
assert(
  !diagnosticIds || (!values['require-perfect'] && repeats === 1 && orderCount === 1),
  '--diagnostics requires --repeats 1, --orders 1, and no --require-perfect; diagnostic history is not accuracy evidence',
);

// Each order gets a fresh base session. Seeded shuffles let reruns reproduce the same case orders.
function caseOrders(count, size) {
  return Array.from({ length: count }, (_, seed) => {
    const order = Array.from({ length: size }, (_, index) => index);
    let state = seed;
    for (let index = size - 1; index > 0 && seed > 0; index--) {
      state = (Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0;
      const swap = state % (index + 1);
      [order[index], order[swap]] = [order[swap], order[index]];
    }
    return order;
  });
}
for (const id of diagnosticIds ?? []) {
  assert(
    cases.some((kase) => kase.id === id),
    `unknown diagnostic case: ${id}; use a corpus case ID`,
  );
}
assert.equal(new Set(cases.map((kase) => kase.id)).size, cases.length, 'duplicate case IDs');
for (const kase of cases) {
  assert(typeof kase.input === 'string' && Number.isSafeInteger(kase.at) && kase.at >= 0, `invalid input or target offset: ${kase.id}`);
  assert.equal(kase.input[kase.at], digitPlus ? '+' : '-', `invalid symbol offset: ${kase.id}`);
  assert(corpus.enums?.[kase.enum]?.includes(kase.expected_label), `unknown expected label: ${kase.id}`);
  if (!digitPlus) {
    assert(!kase.review, `unresolved review case: ${kase.id}; exclude it from scored corpora`);
    for (const field of ['source', 'retrieved_at', 'original_excerpt', 'source_html', 'annotation_rationale', 'source_verification', 'routing_status', 'settled']) {
      assert(typeof kase[field] === 'string' && kase[field].trim(), `missing ${field}: ${kase.id}; record verified source and production input evidence`);
    }
    assert(/^https?:\/\/[^/\s]+(?:\/[^\s]*)?$/.test(kase.source), `invalid source URL: ${kase.id}`);
    assert(Number.isSafeInteger(kase.original_at) && kase.original_at >= 0 && kase.original_excerpt[kase.original_at] === '-', `invalid original target offset: ${kase.id}`);
    assert(Number.isSafeInteger(kase.settled_index) && kase.settled_index >= 0 && kase.settled[kase.settled_index] === '-', `invalid settled target offset: ${kase.id}`);
  }
}
if (!digitPlus) {
  assert.deepEqual(corpus.enums.hyphen, hyphenDigitPrompt.candidateLabels, 'shipping labels differ from the corpus; update the cases before comparing prompts');
}
const runs = variants.map((variant) => {
  assert(Object.hasOwn(prompts, variant), `unknown variant ${variant}; add it to ${values.prompts ?? `scripts/prompt-experiments/${values.experiment}/prompts.js`}`);
  const prompt = prompts[variant];
  const inputs = cases
    .filter((kase) => !diagnosticIds || diagnosticIds.includes(kase.id))
    .map((kase) => {
      const labels = corpus.enums[kase.enum];
      const question = prompt.build(kase, labels);
      assert(question === null || typeof question === 'string', `invalid prompt for ${variant}/${kase.id}; return a string or null for abstention`);
      return { ...kase, question, responseConstraint: { type: 'string', enum: labels } };
    });
  return { variant, prompt, inputs };
});
if (values.check) {
  console.log(`Checked ${cases.length} cases (offline structure only); rendered variants: ${variants.join(', ')}${digitPlus ? '' : `; shipping source version: ${hyphenDigitPrompt.version}`}`);
  process.exit(0);
}
assert(/^[a-p]{32}$/.test(values['extension-id'] ?? ''), `invalid --extension-id ${values['extension-id'] ?? '(missing)'}; copy the shipping extension ID from chrome://extensions/`);
assert(values.out, 'provide --out <new-directory> to preserve previous results');
const profilePath = values['profile-path'];
assert(profilePath && isAbsolute(profilePath), `invalid --profile-path ${profilePath ?? '(missing)'}; copy the absolute Profile Path from chrome://version`);
const output = resolve(values.out);
mkdirSync(dirname(output), { recursive: true });
mkdirSync(output, { recursive: false });
writeFileSync(join(output, 'cases.json'), `${JSON.stringify({ ...pick(corpus, ['set', 'role', 'enums', 'notes', 'diagnosticQuestions', 'prepared_at', 'frozen_at']), cases }, null, 2)}\n`, {
  flag: 'wx',
});

const extensionURL = `chrome-extension://${values['extension-id']}`;
async function runInBrowser(page, { profilePath, extensionURL, prompt, inputs, orders, repeats, diagnostics, diagnosticQuestions }) {
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
  const run = await worker.evaluate(
    async ({ system, inputs, orders, repeats, diagnostics, diagnosticQuestions, omitResponseConstraintInput }) => {
      if (typeof LanguageModel === 'undefined' || typeof LanguageModel.params !== 'function') {
        throw new Error('extension Prompt API sampling controls unavailable; check Chrome and the extension context');
      }
      const availability = await LanguageModel.availability();
      if (availability !== 'available') {
        throw new Error(`model availability is ${availability}; provision the model in the configured profile before running`);
      }
      let createMs = null;
      const answersById = new Map(inputs.map((input) => [input.id, []]));
      for (const order of orders) {
        const started = performance.now();
        const base = await LanguageModel.create({ initialPrompts: [{ role: 'system', content: system }], temperature: 0, topK: 1 });
        createMs ??= Math.round(performance.now() - started);
        try {
          for (const index of order) {
            const input = inputs[index];
            if (input.question === null) {
              continue;
            }
            const answers = answersById.get(input.id);
            for (let repeat = 0; repeat < repeats; repeat++) {
              const start = performance.now();
              let raw = null;
              let answer = null;
              let error = null;
              const followups = [];
              let turn;
              try {
                turn = await base.clone();
                raw = await turn.prompt(input.question, { responseConstraint: input.responseConstraint, omitResponseConstraintInput, signal: AbortSignal.timeout(30000) });
                const parsed = JSON.parse(raw);
                answer = input.responseConstraint.enum.includes(parsed) ? parsed : null;
                if (answer === null) {
                  throw new Error(`response outside constraint: ${raw}`);
                }
                if (diagnostics) {
                  const questions = diagnosticQuestions ?? [
                    '你剛才判斷的是原句中從左到右第幾個「-」？請把原句中所有「-」都計入，只回答位置。',
                    '請逐字引用你剛才判斷的那個「-」前後的原文，讓我能辨認是哪一處。',
                  ];
                  for (const question of questions) {
                    const start = performance.now();
                    try {
                      const response = await turn.prompt(question, { signal: AbortSignal.timeout(30000) });
                      followups.push({ question, raw: response, ms: Math.round(performance.now() - start) });
                    } catch (error) {
                      followups.push({ question, raw: null, error: String(error), ms: Math.round(performance.now() - start) });
                      throw error;
                    }
                  }
                }
              } catch (caught) {
                error = String(caught);
              } finally {
                turn?.destroy();
              }
              answers.push({
                answer,
                raw,
                error,
                ms: Math.round(performance.now() - start),
                order: orders.indexOf(order),
                ...(diagnostics ? { followups } : {}),
              });
            }
          }
        } finally {
          base.destroy();
        }
      }
      const results = inputs.map((input) => ({
        ...input,
        ...(input.question === null ? { skipped: 'prompt-abstention' } : {}),
        answers: answersById.get(input.id),
      }));
      return { availability, createMs, results };
    },
    {
      system: prompt.system,
      inputs,
      orders,
      repeats,
      diagnostics,
      diagnosticQuestions,
      omitResponseConstraintInput: prompt.omitResponseConstraintInput ?? false,
    },
  );
  return { ...run, browserVersion: context.browser().version(), profileVerified: true, extensionWorkerVerified: true };
}

for (const [runIndex, { variant, prompt, inputs }] of runs.entries()) {
  const orders = caseOrders(orderCount, inputs.length);
  const code = `async page => { try { return await (${runInBrowser.toString()})(page, ${JSON.stringify({ profilePath, extensionURL, prompt, inputs, orders, repeats, diagnostics: Boolean(diagnosticIds), diagnosticQuestions: diagnosticIds ? corpus.diagnosticQuestions : undefined })}); } catch (error) { return { runnerError: String(error.message ?? error) }; } }`;
  const result = {
    set: corpus.set ?? `${values.experiment}:${corpus.role ?? split}`,
    backend: 'prompt-api',
    model: 'gemini-nano',
    modelVersion: null,
    modelVersionStatus: 'Prompt API does not expose the model version; record the observed component version in the round runtime record',
    context: 'extension-sw',
    variant,
    promptVersion: variant === 'shipping' ? hyphenDigitPrompt.version : variant,
    repeats,
    orders: orders.map((order) => order.map((index) => inputs[index].id)),
    sampling: 'temperature 0, topK 1',
    shuffle: false,
    timestamp: new Date().toISOString(),
    purpose: diagnosticIds ? 'interpretation-diagnostics-not-accuracy' : 'accuracy',
    system: prompt.system,
    omitResponseConstraintInput: prompt.omitResponseConstraintInput ?? false,
    expectedAttemptsPerCase: orderCount * repeats,
    nodeVersion: process.version,
  };
  const file = join(output, `${runIndex + 1}-${variant}.json`);
  let stdout;
  try {
    stdout = execFileSync('playwright-cli', ['-s=pangu-eval', '--raw', 'run-code', code], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const run = JSON.parse(stdout);
    if (run.runnerError !== undefined) {
      assert(typeof run.runnerError === 'string' && run.runnerError.trim(), 'Invalid browser runner error; expected a nonempty message');
      throw new Error(run.runnerError);
    }
    assert(Array.isArray(run.results), 'browser result missing results array');
    assert.equal(new Set(run.results.map((kase) => kase.id)).size, run.results.length, 'duplicate browser result IDs');
    assert(
      run.results.every((kase) => inputs.some((input) => input.id === kase.id)),
      'unexpected browser result ID',
    );
    run.results = inputs.map((input) => {
      const returned = run.results.find((kase) => kase.id === input.id);
      const answers = (returned?.answers ?? []).map((answer) => ({
        ...pick(answer, ['answer', 'raw', 'ms', 'order']),
        error: answer.error ? publicError(answer.error, [profilePath, extensionURL, process.env.HOME]) : null,
        ...(answer.followups
          ? {
              followups: answer.followups.map((followup) => ({
                ...pick(followup, ['question', 'raw', 'ms']),
                ...(followup.error ? { error: publicError(followup.error, [profilePath, extensionURL, process.env.HOME]) } : {}),
              })),
            }
          : {}),
      }));
      const complete = answers.length === orderCount * repeats && orders.every((_, order) => answers.filter((answer) => answer.order === order).length === repeats);
      const valid = complete && !returned?.skipped && answers.every((answer) => !answer.error && typeof answer.raw === 'string' && input.responseConstraint.enum.includes(answer.answer));
      return {
        ...input,
        ...pick(returned, ['skipped']),
        ...(!returned ? { unavailable: 'browser returned no result for this case' } : {}),
        answers,
        answer: answers[0]?.answer ?? null,
        complete,
        correct: Boolean(valid && answers.every((answer) => answer.answer === input.expected_label)),
        stable: Boolean(valid && answers.every((answer) => answer.answer === answers[0].answer)),
      };
    });
    Object.assign(result, pick(run, ['availability', 'createMs', 'browserVersion', 'profileVerified', 'extensionWorkerVerified', 'results']), {
      status: run.results.every((kase) => kase.complete) ? 'complete' : 'incomplete',
      ...(digitPlus ? { evaluation: digitPlus.score(run) } : {}),
    });
  } catch (error) {
    Object.assign(result, {
      status: 'incomplete',
      error: publicError(error, [profilePath, extensionURL, process.env.HOME]),
      inputs,
    });
    writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
    console.error(`${variant}: incomplete run; ${result.error}; ${file}`);
    process.exitCode = 1;
    break;
  }
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  const scored = result.results.filter((kase) => !kase.review);
  const skipped = scored.filter((kase) => kase.skipped);
  const errors = result.results.flatMap((kase) => kase.answers).filter((answer) => answer.error);
  const incomplete = scored.filter((kase) => !kase.complete);
  if (diagnosticIds) {
    console.log(`${variant}: diagnostics for ${result.results.length} cases; errors ${errors.length}; ${file}`);
    if (errors.length || incomplete.length || skipped.length) {
      process.exitCode = 1;
    }
    continue;
  }
  if (digitPlus) {
    console.log(`${variant}: ${JSON.stringify(result.evaluation)}; errors ${errors.length}; ${file}`);
    if (errors.length || incomplete.length || skipped.length || (values['require-perfect'] && scored.some((kase) => !kase.correct))) {
      process.exitCode = 1;
    }
    continue;
  }
  const classes = Object.fromEntries(
    corpus.enums.hyphen.map((label) => {
      const matching = scored.filter((kase) => kase.expected_label === label);
      return [label, { passed: matching.filter((kase) => kase.correct).length, total: matching.length }];
    }),
  );
  console.log(
    `${variant}: labels ${scored.filter((kase) => kase.correct).length}/${scored.length}; classes ${JSON.stringify(classes)}; skipped ${skipped.length}; incomplete ${incomplete.length}; errors ${errors.length}; ${file}`,
  );
  console.log(
    'Misses:',
    scored
      .filter((kase) => !kase.correct)
      .map((kase) => `${kase.id}=${kase.answer}`)
      .join(', ') || 'none',
  );
  console.log(
    'Unstable across orders/repeats:',
    scored
      .filter((kase) => kase.stable === false)
      .map((kase) => kase.id)
      .join(', ') || 'none',
  );
  if (errors.length || incomplete.length || skipped.length || (values['require-perfect'] && scored.some((kase) => !kase.correct))) {
    process.exitCode = 1;
  }
}
