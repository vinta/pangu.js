// Run with Node 22.18+ for the shipping TypeScript prompt import. Reuses the approved pangu-eval Playwright CLI session; verifies the configured profile before each run.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { hyphenPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-prompt.ts';
import { PROMPTS, SHOT_SENTENCES } from './hyphen-sign/prompts.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'experiment': { type: 'string', default: 'hyphen-sign' },
    'split': { type: 'string' },
    'cases': { type: 'string' },
    'out': { type: 'string' },
    'extension-id': { type: 'string' },
    'profile-path': { type: 'string' },
    'profile-name': { type: 'string' },
    'repeats': { type: 'string', default: '1' },
    'orders': { type: 'string', default: '2' },
    'check': { type: 'boolean' },
    'require-perfect': { type: 'boolean' },
    'diagnostics': { type: 'string' },
    'page-sessions': { type: 'string' },
    'page-context': { type: 'boolean' },
  },
});
const repeats = Number(values.repeats);
assert(Number.isSafeInteger(repeats) && repeats > 0, `invalid --repeats ${values.repeats}; use a positive integer`);
const orderCount = Number(values.orders);
assert(Number.isSafeInteger(orderCount) && orderCount > 0, `invalid --orders ${values.orders}; use a positive integer`);
assert(
  ['hyphen-sign', 'plus-sign', 'digit-plus', 'spacing-rewrite', 'slash-unit'].includes(values.experiment),
  `invalid --experiment ${values.experiment}; use hyphen-sign, plus-sign, digit-plus, spacing-rewrite, or slash-unit`,
);
assert(values.cases === undefined || values.experiment === 'hyphen-sign', '--cases is only supported for --experiment hyphen-sign');
const plus = values.experiment === 'plus-sign' ? await import('./plus-sign/experiment.mjs') : null;
const rewrite = values.experiment === 'spacing-rewrite' ? await import('./spacing-rewrite/experiment.mjs') : null;
const slash = values.experiment === 'slash-unit' ? await import('./slash-unit/experiment.mjs') : null;
const digitPlus = values.experiment === 'digit-plus' ? await import('./digit-plus/experiment.mjs') : null;
assert(plus || digitPlus || !values.split, '--split is only supported for --experiment plus-sign or digit-plus');
assert(!plus || !values.diagnostics, '--diagnostics is only supported for --experiment hyphen-sign, digit-plus, spacing-rewrite, or slash-unit');
const split = values.split ?? 'development';
const variants = positionals.length
  ? positionals
  : slash
    ? ['v1-zh', 'v2-zh', 'v3-zh', 'v4-zh-local']
    : digitPlus
      ? ['v18-en-real-examples']
      : rewrite
        ? ['v1-zh']
        : plus
          ? ['v1-zh', 'v2-zh']
          : ['shipping'];
const prompts =
  plus || digitPlus || rewrite || slash
    ? (await import(`./${values.experiment}/prompts.js`)).PROMPTS
    : {
        ...PROMPTS,
        shipping: { system: hyphenPrompt.systemPrompt, build: (kase) => hyphenPrompt.buildQuestion(kase.input, kase.at) },
      };
const root = new URL('./hyphen-sign/', import.meta.url);
const corpus = digitPlus
  ? digitPlus.loadCorpus(split)
  : slash
    ? slash.loadCorpus()
    : rewrite
      ? rewrite.loadCorpus()
      : plus
        ? plus.loadCorpus(split)
        : JSON.parse(readFileSync(values.cases ?? new URL('cases.json', root), 'utf8'));
const fields = plus || digitPlus || rewrite || slash || values.cases !== undefined ? [] : JSON.parse(readFileSync(new URL('field-cases.json', root), 'utf8')).cases;
const cases = [...corpus.cases, ...fields];
assert(
  corpus.diagnosticQuestions === undefined ||
    (Array.isArray(corpus.diagnosticQuestions) && corpus.diagnosticQuestions.length > 0 && corpus.diagnosticQuestions.every((question) => typeof question === 'string' && question.trim())),
  `invalid diagnosticQuestions in ${values.cases ?? values.experiment}; use a nonempty array of nonempty strings`,
);
const diagnosticIds = values.diagnostics?.split(',');
const pageSessions = values['page-sessions'];
assert(pageSessions === undefined || ['clone', 'reuse'].includes(pageSessions), '--page-sessions must be clone or reuse');
assert(!values['page-context'] || pageSessions, '--page-context requires --page-sessions');
assert(
  !pageSessions || (values.cases && repeats === 1 && orderCount === 2 && !diagnosticIds),
  '--page-sessions requires --cases, --repeats 1, --orders 2, and no diagnostics; repeat whole runs for independent trials',
);
if (pageSessions) {
  const pages = new Map();
  for (const kase of cases) {
    assert(typeof kase.page === 'string' && kase.page && typeof kase.pageContext === 'string' && kase.pageContext.includes(kase.input), `invalid page context: ${kase.id}`);
    assert(!pages.has(kase.page) || pages.get(kase.page) === kase.pageContext, `inconsistent page context: ${kase.page}`);
    pages.set(kase.page, kase.pageContext);
  }
}
assert(
  !diagnosticIds || (!values['require-perfect'] && repeats === 1 && orderCount === 1),
  '--diagnostics requires --repeats 1, --orders 1, and no --require-perfect; diagnostic history is not accuracy evidence',
);

// A label near a tie depends on which questions earlier clones of the same base session answered (plus-sign report, 2026-09-06). Each order gets its own
// base session; order 0 is corpus order, later orders are seeded shuffles so a rerun replays the same orders
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
  if (rewrite) {
    continue;
  }
  assert.equal(kase.input[kase.at], slash ? '/' : plus || digitPlus ? '+' : '-', `invalid symbol offset: ${kase.id}`);
  assert(corpus.enums[kase.enum].includes(kase.expected_label), `unknown expected label: ${kase.id}`);
  assert(!SHOT_SENTENCES.includes(kase.input), `few-shot leakage: ${kase.id}`);
}
if (!plus && !digitPlus && !rewrite && !slash) {
  assert.deepEqual(corpus.enums.hyphen, hyphenPrompt.candidateLabels, 'shipping labels differ from the corpus; update the cases before comparing prompts');
}
const runs = variants.map((variant) => {
  assert(Object.hasOwn(prompts, variant), `unknown variant ${variant}; add it to scripts/prompt-experiments/${values.experiment}/prompts.js`);
  const prompt = prompts[variant];
  const inputs = cases
    .filter((kase) => !diagnosticIds || diagnosticIds.includes(kase.id))
    .map((kase) => {
      if (rewrite) {
        return { ...kase, question: prompt.build(kase), responseConstraint: { type: 'string' }, expected_label: kase.expected_output };
      }
      const labels = corpus.enums[kase.enum];
      // A variant may reorder the menu/enum (labelOrder), name tokens per case (displayLabels as a function), or wrap the answer in an object schema (constraint + answerKey)
      const ordered = prompt.labelOrder ?? labels;
      const displayLabels = typeof prompt.displayLabels === 'function' ? prompt.displayLabels(kase) : prompt.displayLabels;
      const tokens = ordered.flatMap((label) => [displayLabels?.[label] ?? label].flat().map((token) => [token, label]));
      const question = prompt.build(kase, labels);
      assert(question === null || typeof question === 'string', `invalid prompt for ${variant}/${kase.id}; return a string or null for abstention`);
      const enumTokens = tokens.map(([token]) => token);
      assert.equal(new Set(enumTokens).size, enumTokens.length, `duplicate response tokens: ${variant}/${kase.id}`);
      return { ...kase, question, tokens, answerKey: prompt.answerKey ?? null, responseConstraint: prompt.constraint ? prompt.constraint(enumTokens) : { type: 'string', enum: enumTokens } };
    });
  return { variant, prompt, inputs };
});
if (values.check) {
  plus?.check(corpus);
  rewrite?.check();
  console.log(`Checked ${cases.length} cases; rendered variants: ${variants.join(', ')}${plus || digitPlus || rewrite || slash ? '' : `; shipping source version: ${hyphenPrompt.version}`}`);
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
async function runInBrowser(page, { profilePath, extensionURL, prompt, inputs, orders, repeats, diagnostics, diagnosticQuestions, rewrite, pageSessions, pageContext }) {
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
    async ({ system, initialTurns, inputs, orders, repeats, diagnostics, diagnosticQuestions, rewrite, omitResponseConstraintInput, pageSessions, pageContext }) => {
      if (typeof LanguageModel === 'undefined' || typeof LanguageModel.params !== 'function') {
        throw new Error('extension Prompt API sampling controls unavailable; check Chrome and the extension context');
      }
      const availability = await LanguageModel.availability();
      if (availability !== 'available') {
        throw new Error(`model availability is ${availability}; provision the model in the configured profile before running`);
      }
      let createMs = null;
      const sessions = [];
      const answersById = new Map(inputs.map((input) => [input.id, []]));
      for (const order of orders) {
        const groups = pageSessions ? [...new Set(order.map((index) => inputs[index].page))].map((page) => order.filter((index) => inputs[index].page === page)) : [order];
        for (const group of groups) {
          const started = performance.now();
          const pageSystem = pageContext ? `${system}\n\n以下是網頁原文，僅供判讀句子時參考：\n${inputs[group[0]].pageContext}` : system;
          const base = await LanguageModel.create({ initialPrompts: [{ role: 'system', content: pageSystem }, ...initialTurns], temperature: 0, topK: 1 });
          createMs ??= Math.round(performance.now() - started);
          if (pageSessions) {
            sessions.push({
              page: inputs[group[0]].page,
              order: orders.indexOf(order),
              createMs: Math.round(performance.now() - started),
              system: pageSystem,
              contextUsage: base.contextUsage,
              contextWindow: base.contextWindow,
            });
          }
          try {
            for (const index of group) {
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
                let cloneMs = 0;
                let promptMs = null;
                let contextBefore = null;
                let contextAfter = null;
                let contextOverflows = 0;
                const onOverflow = () => contextOverflows++;
                try {
                  turn = pageSessions === 'reuse' ? base : await base.clone();
                  cloneMs = Math.round(performance.now() - start);
                  if (pageSessions) {
                    contextBefore = turn.contextUsage;
                    turn.addEventListener('contextoverflow', onOverflow);
                  }
                  const promptStarted = performance.now();
                  raw = await turn.prompt(input.question, { responseConstraint: input.responseConstraint, omitResponseConstraintInput, signal: AbortSignal.timeout(30000) });
                  promptMs = Math.round(performance.now() - promptStarted);
                  if (pageSessions) {
                    contextAfter = turn.contextUsage;
                  }
                  const parsed = JSON.parse(raw);
                  answer = rewrite ? (typeof parsed === 'string' ? parsed : null) : (input.tokens.find(([token]) => token === (input.answerKey ? parsed?.[input.answerKey] : parsed))?.[1] ?? null);
                  if (answer === null) {
                    throw new Error(`response outside constraint: ${raw}`);
                  }
                  if (diagnostics) {
                    const questions =
                      diagnosticQuestions ??
                      (rewrite
                        ? ['請列出你剛才插入或刪除空格的位置，以及各自使用哪一條規則。', '原文中哪些空格是作者輸入的？你是否保留了它們？請引用原文說明。']
                        : ['你剛才判斷的是原句中從左到右第幾個「-」？請把原句中所有「-」都計入，只回答位置。', '請逐字引用你剛才判斷的那個「-」前後的原文，讓我能辨認是哪一處。']);
                    for (const question of questions) {
                      const start = performance.now();
                      const response = await turn.prompt(question, { signal: AbortSignal.timeout(30000) });
                      followups.push({ question, raw: response, ms: Math.round(performance.now() - start) });
                    }
                  }
                } catch (caught) {
                  error = String(caught);
                } finally {
                  if (pageSessions) {
                    turn?.removeEventListener('contextoverflow', onOverflow);
                  }
                  if (turn !== base) {
                    turn?.destroy();
                  }
                }
                answers.push({
                  answer,
                  raw,
                  error,
                  ms: Math.round(performance.now() - start),
                  order: orders.indexOf(order),
                  ...(pageSessions ? { position: group.indexOf(index), cloneMs, promptMs, contextBefore, contextAfter, contextOverflows } : {}),
                  ...(diagnostics ? { followups } : {}),
                });
              }
            }
          } finally {
            base.destroy();
          }
        }
      }
      const normalized = (raw) => {
        try {
          return raw === null ? null : JSON.stringify(JSON.parse(raw));
        } catch {
          return raw;
        }
      };
      const results = inputs.map((input) => {
        if (input.question === null) {
          return { ...input, skipped: 'no-unique-target-reference', answers: [], answer: null, correct: false, stable: null };
        }
        const answers = answersById.get(input.id);
        return {
          ...input,
          answers,
          answer: answers[0].answer,
          correct: answers.every((answer) => answer.answer === input.expected_label),
          // Compare parsed values: an object-schema answer can differ only in JSON whitespace between calls
          stable: answers.every((answer) => normalized(answer.raw) === normalized(answers[0].raw)),
        };
      });
      return { availability, createMs, results, ...(pageSessions ? { sessions } : {}) };
    },
    {
      system: prompt.system,
      initialTurns: prompt.initialTurns ?? [],
      inputs,
      orders,
      repeats,
      diagnostics,
      diagnosticQuestions,
      rewrite,
      omitResponseConstraintInput: prompt.omitResponseConstraintInput ?? false,
      pageSessions,
      pageContext,
    },
  );
  return { ...run, browserVersion: context.browser().version(), profileVerified: true, extensionWorkerVerified: true };
}

for (const [runIndex, { variant, prompt, inputs }] of runs.entries()) {
  const orders = caseOrders(orderCount, inputs.length);
  if (pageSessions) {
    orders[1] = [...orders[0]].reverse();
  }
  const code = `async page => (${runInBrowser.toString()})(page, ${JSON.stringify({ profilePath, extensionURL, prompt, inputs, orders, repeats, diagnostics: Boolean(diagnosticIds), diagnosticQuestions: diagnosticIds ? corpus.diagnosticQuestions : undefined, rewrite: Boolean(rewrite), pageSessions, pageContext: Boolean(values['page-context']) })})`;
  const run = JSON.parse(
    execFileSync('playwright-cli', ['-s=pangu-eval', '--raw', 'run-code', code], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: rewrite ? 600000 : 120000,
      stdio: ['ignore', 'pipe', 'inherit'],
    }),
  );

  const result = {
    set: corpus.set ?? (rewrite ? 'spacing-rewrite:development' : plus ? `plus-sign:${split}` : values.cases !== undefined ? 'hyphen-sign:custom' : 'hyphen-sign+field'),
    backend: 'prompt-api',
    model: 'gemini-nano',
    context: 'extension-sw',
    variant,
    promptVersion: variant === 'shipping' ? hyphenPrompt.version : variant,
    repeats,
    orders: orders.map((order) => order.map((index) => inputs[index].id)),
    sampling: 'temperature 0, topK 1',
    shuffle: false,
    timestamp: new Date().toISOString(),
    purpose: diagnosticIds ? 'interpretation-diagnostics-not-accuracy' : 'accuracy',
    ...(pageSessions ? { pageSessions, pageContext: Boolean(values['page-context']), orderStrategy: 'forward-and-reverse-per-page' } : {}),
    system: prompt.system,
    omitResponseConstraintInput: prompt.omitResponseConstraintInput ?? false,
    initialTurns: prompt.initialTurns ?? [],
    ...run,
    ...(plus ? { evaluation: plus.score(run, corpus, repeats * orders.length) } : {}),
    ...(rewrite ? { evaluation: rewrite.score(run) } : {}),
    ...(slash ? { evaluation: slash.score(run) } : {}),
    ...(digitPlus ? { evaluation: digitPlus.score(run) } : {}),
  };
  const file = join(output, `${runIndex + 1}-${variant}.json`);
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  const scored = run.results.filter((kase) => !kase.review);
  const original = scored.filter((kase) => !kase.id.startsWith('field-'));
  const ambiguous = original.filter((kase) => kase.type === 'ambiguous');
  const controls = original.filter((kase) => kase.type === 'control');
  const field = scored.filter((kase) => kase.id.startsWith('field-') && !kase.id.startsWith('field-collision-'));
  const synthetic = scored.filter((kase) => kase.id.startsWith('field-collision-'));
  const skipped = scored.filter((kase) => kase.skipped);
  const errors = run.results.flatMap((kase) => kase.answers).filter((answer) => answer.error);
  if (diagnosticIds) {
    console.log(`${variant}: diagnostics for ${run.results.length} cases; errors ${errors.length}; ${file}`);
    if (errors.length) {
      process.exitCode = 1;
    }
    continue;
  }
  if (rewrite || slash || digitPlus) {
    console.log(`${variant}: ${JSON.stringify(result.evaluation)}; errors ${errors.length}; ${file}`);
    if (errors.length || (values['require-perfect'] && scored.some((kase) => !kase.correct))) {
      process.exitCode = 1;
    }
    continue;
  }
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
    console.log(
      'Unstable across orders/repeats:',
      scored
        .filter((kase) => kase.stable === false)
        .map((kase) => kase.id)
        .join(', ') || 'none',
    );
    if (errors.length || (values['require-perfect'] && (scored.some((kase) => !kase.correct) || sentences.some((sentence) => !sentence.review && !sentence.correct)))) {
      process.exitCode = 1;
    }
    continue;
  }
  console.log(
    `${variant}: original ${ambiguous.filter((kase) => kase.correct).length}/${ambiguous.length}; control flips ${controls.filter((kase) => !kase.correct).length}/${controls.length}; field ${field.filter((kase) => kase.correct).length}/${field.length}; synthetic ${synthetic.filter((kase) => kase.correct).length}/${synthetic.length}; skipped ${skipped.length} (${skipped.filter((kase) => kase.expected_label === 'signed-number').length} missed corrections); errors ${errors.length}; ${file}`,
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
  if (errors.length || (values['require-perfect'] && scored.some((kase) => !kase.correct))) {
    process.exitCode = 1;
  }
}
