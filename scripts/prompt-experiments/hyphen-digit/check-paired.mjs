import assert from 'node:assert/strict';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { rolldown } from 'rolldown';
import { outputDirectory, publicCase } from '../artifacts.mjs';
import { evaluatePaired } from './paired-gates.mjs';

const usage = `Usage: node scripts/prompt-experiments/hyphen-digit/check-paired.mjs
  --phase screening|confirmation|holdout --cases <frozen-corpus.json>
  --prompts <frozen-prompts.mjs> --baseline <frozen-baseline-key>
  --out tmp/prompt-experiments/<round>/<gate> [--example-source <canonical-url> ...]
  <baseline-1.json> <candidate-1.json> [<baseline-2.json> <candidate-2.json>]
Checks saved artifacts offline with production edits. Screening takes one pair; confirmation and holdout take two.
The candidate key comes from its artifact. --baseline selects the frozen entry for shipping artifacts.
Writes gate.json in a new ignored directory; exits 1 for a failed gate or invalid input.`;

function readJSON(path) {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    assert(value && typeof value === 'object' && !Array.isArray(value), 'expected a JSON object');
    return value;
  } catch (error) {
    throw new Error(`${path}: ${error.message}; provide a readable JSON object file`);
  }
}

async function productionModule(path) {
  const bundle = await rolldown({ input: fileURLToPath(new URL(`../../../browser-extensions/chrome/src/ai-spacing/shapes/${path}.ts`, import.meta.url)) });
  try {
    const { output } = await bundle.generate({ format: 'esm' });
    assert(output.length === 1 && output[0].type === 'chunk', `${path}: expected one production bundle; check the production imports`);
    return await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);
  } finally {
    await bundle.close();
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'phase': { type: 'string' },
      'cases': { type: 'string' },
      'prompts': { type: 'string' },
      'baseline': { type: 'string' },
      'out': { type: 'string' },
      'example-source': { type: 'string', multiple: true },
      'help': { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  for (const key of ['phase', 'cases', 'prompts', 'baseline', 'out']) {
    assert(values[key], `missing --${key}; see --help`);
  }
  assert(['screening', 'confirmation', 'holdout'].includes(values.phase), `invalid --phase ${values.phase}; use screening, confirmation, or holdout`);
  const count = values.phase === 'screening' ? 2 : 4;
  assert.equal(positionals.length, count, `${values.phase}: provide ${count} artifact paths in baseline/candidate pairs; see --help`);

  const corpus = readJSON(values.cases);
  const role = values.phase === 'holdout' ? 'holdout' : 'development';
  assert.equal(corpus.role, role, `${values.cases}: ${values.phase} requires a frozen ${role} corpus`);
  assert(Array.isArray(corpus.cases) && corpus.cases.length > 0 && corpus.cases.every((kase) => kase && typeof kase.id === 'string'), `${values.cases}: provide a nonempty cases array with case IDs`);
  const cases = corpus.cases.map(publicCase);
  const labels = ['signed-number', 'range-or-separator', 'unsure'];
  assert.deepEqual(corpus.enums?.hyphen, labels, `${values.cases}: expected the ordered hyphen-digit label schema`);
  const { PROMPTS } = await import(pathToFileURL(resolve(values.prompts)));
  assert(PROMPTS && typeof PROMPTS === 'object', `${values.prompts}: export a PROMPTS registry with the frozen baseline and candidate`);
  const artifacts = positionals.map(readJSON);
  assert.equal(new Set(positionals.map((path) => realpathSync(path))).size, count, 'reused artifact path; supply distinct saved runs for each baseline/candidate pair');
  const protocolIssues = [];
  for (const [index, artifact] of artifacts.entries()) {
    const path = positionals[index];
    const key = index % 2 === 0 ? values.baseline : artifact.variant;
    const prompt = PROMPTS[key];
    assert(prompt && typeof prompt.system === 'string' && typeof prompt.build === 'function', `${path}: missing frozen prompt ${key} in ${values.prompts}; select its original prompt module`);
    assert(
      artifact.results === undefined ||
        (Array.isArray(artifact.results) &&
          artifact.results.every((row) => row && (row.answers === undefined || (Array.isArray(row.answers) && row.answers.every((answer) => answer && typeof answer === 'object'))))),
      `${path}: results and answers must be arrays of objects; use the saved sweep artifact`,
    );
    assert(artifact.orders === undefined || (Array.isArray(artifact.orders) && artifact.orders.every(Array.isArray)), `${path}: orders must be arrays of case IDs`);
    const check = (actual, expected, field) => {
      if (!isDeepStrictEqual(actual, expected)) {
        protocolIssues.push(`${path}: ${field} differs from the frozen protocol`);
      }
    };
    if (index % 2 === 0 && !['shipping', values.baseline].includes(artifact.variant)) {
      protocolIssues.push(`${path}: expected shipping or frozen baseline ${values.baseline}; supply baseline/candidate pairs`);
    }
    check(artifact.system, prompt.system, 'system');
    check(artifact.omitResponseConstraintInput, prompt.omitResponseConstraintInput ?? false, 'omitResponseConstraintInput');
    check(artifact.sampling, 'temperature 0, topK 1', 'sampling');
    check(artifact.profileVerified, true, 'profileVerified');
    check(artifact.extensionWorkerVerified, true, 'extensionWorkerVerified');
    for (const kase of cases) {
      const result = artifact.results?.find((row) => row.id === kase.id);
      if (result) {
        check(result.question, prompt.build(kase, labels), `${kase.id} question`);
        check(result.responseConstraint, { type: 'string', enum: labels }, `${kase.id} responseConstraint`);
      }
    }
  }
  const comparisons = [];
  for (let index = 0; index < artifacts.length; index += 2) {
    comparisons.push({ baseline: artifacts[index], candidate: artifacts[index + 1] });
  }
  const { hyphenDigit } = await productionModule('hyphen-digit');
  const { applyTextEdits } = await productionModule('base');
  const gate = evaluatePaired({
    phase: values.phase,
    cases,
    comparisons,
    exampleSources: values['example-source'] ?? [],
    editsForLabel: (kase, label) => hyphenDigit.edits({ index: kase.settled_index }, label),
    applyTextEdits,
  });
  Object.assign(gate, { protocolIssues, frozen: gate.frozen && protocolIssues.length === 0, passed: gate.passed && protocolIssues.length === 0 });
  const directory = outputDirectory(fileURLToPath(new URL('../../../', import.meta.url)), values.out);
  const file = join(directory, 'gate.json');
  writeFileSync(file, `${JSON.stringify(gate, null, 2)}\n`, { flag: 'wx' });
  const runs = gate.runs.map((run) => ({
    passed: run.passed,
    matched: run.matched,
    regressions: run.regressions,
    attemptDeclines: run.attemptDeclines,
    ...Object.fromEntries(
      ['baseline', 'candidate'].map((key) => [
        key,
        {
          complete: run[key].complete,
          issues: run[key].issues,
          total: run[key].cases.length,
          passing: run[key].passing,
          labels: run[key].cases.filter((kase) => kase.labelCorrect === kase.scheduled).length,
          targetSpacing: run[key].cases.filter((kase) => kase.targetSpacingCorrect === kase.scheduled).length,
          combinedSpacing: run[key].cases.filter((kase) => kase.fullSpacingCorrect === kase.scheduled).length,
          misses: run[key].cases.filter((kase) => !kase.passed).map((kase) => kase.id),
        },
      ]),
    ),
  }));
  console.log(JSON.stringify({ phase: gate.phase, passed: gate.passed, frozen: gate.frozen, protocolIssues, stableImprovements: gate.stableImprovements, runs, file }));
  if (!gate.passed) {
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error(`check-paired: ${error.message}`);
  process.exitCode = 1;
}
