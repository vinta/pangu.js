import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { applyTextEdits, indexOfNthSymbol, sliceSentence } from '../../browser-extensions/chrome/src/ai-spacing/shapes/base.ts';
import { digitPlusPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/digit-plus-prompt.ts';
import { hyphenDigitPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts';
import { plusDigitPrompt } from '../../browser-extensions/chrome/src/ai-spacing/shapes/plus-digit-prompt.ts';
import { outputDirectory, publicCase } from './artifacts.mjs';
import { excerptKey, scoreArtifact } from './hyphen-digit/paired-gates.mjs';
import { loadCorpus } from './plus-digit/experiment.mjs';
import { productionModule } from './production.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { default: pangu } = await productionModule('src/shared/index.ts');
const { hyphenDigit } = await productionModule('browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit.ts');
const { digitPlus } = await productionModule('browser-extensions/chrome/src/ai-spacing/shapes/digit-plus.ts');
const { plusDigit } = await productionModule('browser-extensions/chrome/src/ai-spacing/shapes/plus-digit.ts');
const { AMBIGUOUS_SHAPES } = await productionModule('browser-extensions/chrome/src/ai-spacing/shapes/ambiguous-shapes.ts');
const shapes = {
  'hyphen-digit': { shape: hyphenDigit, prompt: hyphenDigitPrompt, enum: 'hyphen', symbol: '-' },
  'digit-plus': { shape: digitPlus, prompt: digitPlusPrompt, enum: 'plus', symbol: '+' },
  'plus-digit': { shape: plusDigit, prompt: plusDigitPrompt, enum: 'plus', symbol: '+' },
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
const targetKey = (target) => `${target.kind}:${target.excerptAt}`;
const edits = (kind, kase, label) => shapes[kind].shape.edits({ index: kase.settled_index }, label);

export function prepareComposition(corpus, registry) {
  assert.equal(corpus.role, 'development', 'composition reuses exposed cases; mark the corpus development');
  for (const map of ['BASELINE_SHAPE_PROMPTS', 'SHAPE_PROMPTS']) {
    assert.deepEqual(Object.keys(registry[map] ?? {}).sort(), Object.keys(shapes).sort(), `${map}: freeze one prompt key for every shipping shape`);
  }
  for (const [kind, shape] of Object.entries(shapes)) {
    for (const key of [registry.BASELINE_SHAPE_PROMPTS[kind], registry.SHAPE_PROMPTS[kind]]) {
      const prompt = registry.PROMPTS[key];
      assert(prompt && typeof prompt.build === 'function', `${kind}: missing frozen prompt ${key}`);
      assert.deepEqual(prompt.labels, shape.prompt.candidateLabels, `${kind}: frozen labels differ from the shape`);
      assert.equal(prompt.omitResponseConstraintInput ?? false, false, `${kind}: freeze response-constraint input`);
      assert.equal(prompt.offlineLabel, undefined, `${kind}: baseline and candidate prompts must use inference`);
    }
    assert.equal(registry.PROMPTS[registry.BASELINE_SHAPE_PROMPTS[kind]].system, shape.prompt.systemPrompt, `${kind}: frozen baseline system differs from shipping`);
    if (kind !== 'plus-digit') assert.equal(registry.SHAPE_PROMPTS[kind], registry.BASELINE_SHAPE_PROMPTS[kind], `${kind}: companion prompts must match on both sides`);
  }
  const componentCases = Object.fromEntries(Object.keys(shapes).map((kind) => [kind, []]));
  const groups = [...Map.groupBy(corpus.cases, excerptKey).values()].map((group) => {
    const first = group[0];
    const original = first.sourceExcerpt;
    const settled = pangu.spaceText(original);
    assert(Array.isArray(first.companion_targets), `${first.id}: annotate companion_targets, including an empty array when none route`);
    for (const kase of group) {
      assert.deepEqual(kase.companion_targets, first.companion_targets, `${kase.id}: inconsistent companion annotations`);
      assert.equal(kase.expected_composed_excerpt_output, first.expected_composed_excerpt_output, `${kase.id}: inconsistent composed excerpt gold`);
    }
    const annotations = [...group.map((kase) => ({ kind: 'plus-digit', excerptAt: kase.excerptAt, expected_label: kase.expected_label, id: kase.id })), ...first.companion_targets];
    assert.equal(new Set(annotations.map(targetKey)).size, annotations.length, `${first.id}: duplicate target annotation`);
    // Preserve the target order of the phase 1 prepared manifests: plus-digit first, then its companion shapes.
    const detected = ['plus-digit', 'hyphen-digit', 'digit-plus'].flatMap((kind) =>
      shapes[kind].shape
        .find(original, settled, (excerptAt) => {
          const context = sliceSentence(original, excerptAt);
          return { ...context, excerptAt };
        })
        .map((target) => ({ ...target, kind })),
    );
    assert.deepEqual(
      detected.map(targetKey).sort(),
      annotations.map(targetKey).sort(),
      `${first.id}: missing or ineligible target annotation; include every routed shape and preserve full-context exclusions`,
    );
    const targets = detected.map((target) => {
      const annotation = annotations.find((item) => targetKey(item) === targetKey(target));
      const { kind } = target;
      const baseline = registry.PROMPTS[registry.BASELINE_SHAPE_PROMPTS[kind]];
      const candidateLabels = shapes[kind].prompt.candidateLabels;
      assert(candidateLabels.includes(annotation.expected_label), `${first.id}: invalid ${kind} gold label`);
      const sourceCase = group.find((kase) => kase.id === annotation.id) ?? first;
      const kase = {
        ...publicCase(sourceCase),
        id: annotation.id ?? `${first.id}:${kind}:${target.excerptAt}`,
        enum: shapes[kind].enum,
        input: target.sentence,
        at: target.at,
        ordinal: target.sentence.slice(0, target.at).split(shapes[kind].symbol).length,
        expected_label: annotation.expected_label,
        original_excerpt: original,
        original_at: target.excerptAt,
        excerptAt: target.excerptAt,
        settled,
        settled_index: target.index,
        retrieved_at: first.retrievedDate,
        annotation_rationale: annotation.rationale ?? `Companion ${kind} independently annotated in the composition corpus. ${first.rationale}`,
        source_verification: first.evidence,
        routing_status: 'Shipping detector matched the saved excerpt; DOM routing remains unverified.',
      };
      kase.symbol = shapes[kind].symbol;
      kase.targets = [{ ordinal: kase.ordinal, expected_label: kase.expected_label }];
      kase.expected_target_spacing = applyTextEdits(settled, edits(kind, kase, kase.expected_label));
      if (kind !== 'plus-digit') {
        const inputIndex = indexOfNthSymbol(pangu.spaceText(kase.input), shapes[kind].symbol, kase.ordinal - 1);
        kase.expected_output = applyTextEdits(pangu.spaceText(kase.input), edits(kind, { settled_index: inputIndex }, kase.expected_label));
      }
      assert.equal(baseline.build(kase, candidateLabels), shapes[kind].prompt.buildQuestion(kase.input, kase.at), `${kind}: frozen baseline question differs from shipping`);
      componentCases[kind].push(kase);
      return { kind, id: kase.id, excerptAt: target.excerptAt, expected_label: kase.expected_label, settled_index: target.index };
    });
    const goldenEdits = targets.flatMap((target) => edits(target.kind, target, target.expected_label));
    assert.equal(applyTextEdits(settled, goldenEdits), first.expected_composed_excerpt_output, `${first.id}: composed excerpt gold disagrees with all annotated edits`);
    for (const kase of group) {
      const start = kase.excerptAt - kase.at;
      const inputSettled = pangu.spaceText(kase.input);
      const localEdits = targets
        .filter((target) => target.excerptAt >= start && target.excerptAt < start + kase.input.length)
        .flatMap((target) => {
          const { symbol } = shapes[target.kind];
          const localAt = target.excerptAt - start;
          const index = indexOfNthSymbol(inputSettled, symbol, kase.input.slice(0, localAt).split(symbol).length - 1);
          return edits(target.kind, { settled_index: index }, target.expected_label);
        });
      assert.equal(applyTextEdits(inputSettled, localEdits), kase.expected_composed_output, `${kase.id}: composed input gold disagrees with all annotated edits`);
    }
    for (const kind of Object.keys(shapes)) {
      const members = componentCases[kind].filter((kase) => excerptKey(kase) === excerptKey(first));
      const spacing = applyTextEdits(
        settled,
        members.flatMap((kase) => edits(kind, kase, kase.expected_label)),
      );
      for (const kase of members) kase.expected_spacing = spacing;
    }
    return { id: first.excerptId ?? first.id, key: excerptKey(first), original, settled, expected: first.expected_composed_excerpt_output, targets };
  });
  const corpora = Object.fromEntries(
    Object.entries(componentCases)
      .filter(([, cases]) => cases.length)
      .map(([kind, cases]) => [
        kind,
        {
          set: `${corpus.set ?? 'plus-digit'}:composition:${kind}`,
          role: 'development',
          enums: { [shapes[kind].enum]: shapes[kind].prompt.candidateLabels },
          cases,
        },
      ]),
  );
  const frozenPrompts = Object.fromEntries(
    [...Object.entries(registry.BASELINE_SHAPE_PROMPTS), ...Object.entries(registry.SHAPE_PROMPTS)].map(([kind, key]) => {
      const prompt = registry.PROMPTS[key];
      return [
        key,
        {
          system: prompt.system,
          labels: prompt.labels,
          omitResponseConstraintInput: prompt.omitResponseConstraintInput ?? false,
          questions: Object.fromEntries(componentCases[kind].map((kase) => [kase.id, prompt.build(kase, prompt.labels)])),
        },
      ];
    }),
  );
  return { groups, corpora, baselineShapePrompts: registry.BASELINE_SHAPE_PROMPTS, shapePrompts: registry.SHAPE_PROMPTS, frozenPrompts };
}

export function evaluateComposition(prepared, comparisons, registry) {
  assert.equal(comparisons.length, 2, 'composition requires two fresh baseline/candidate comparisons');
  const protocolIssues = [];
  const check = (actual, expected, message) => {
    if (!isDeepStrictEqual(actual, expected)) protocolIssues.push(message);
  };
  const kinds = Object.keys(prepared.corpora);
  const scoreSide = (artifacts, side) => {
    check(Object.keys(artifacts).sort(), [...kinds].sort(), `${side}: supply exactly the detected shape artifacts`);
    const components = {};
    for (const kind of kinds) {
      const artifact = artifacts[kind];
      assert(artifact, `${side}: missing ${kind} artifact`);
      const variant = (side === 'baseline' ? prepared.baselineShapePrompts : prepared.shapePrompts)[kind];
      const prompt = registry.PROMPTS[variant];
      const cases = prepared.corpora[kind].cases;
      const candidateLabels = prepared.corpora[kind].enums[shapes[kind].enum];
      for (const [field, expected] of Object.entries({
        variant,
        system: prompt.system,
        omitResponseConstraintInput: false,
        sampling: 'temperature 0, topK 1',
        backend: 'prompt-api',
        context: 'extension-sw',
        profileVerified: true,
        extensionWorkerVerified: true,
      })) {
        check(artifact[field], expected, `${side}/${kind}: ${field} differs from frozen protocol`);
      }
      for (const kase of cases) {
        const result = artifact.results?.find((row) => row.id === kase.id);
        check(result?.question, prompt.build(kase, candidateLabels), `${side}/${kind}/${kase.id}: question differs from frozen prompt`);
        check(result?.responseConstraint, { type: 'string', enum: candidateLabels }, `${side}/${kind}/${kase.id}: response schema differs`);
      }
      components[kind] = scoreArtifact({
        artifact,
        cases,
        repeats: 3,
        orderCount: 2,
        editsForLabel: (kase, label) => edits(kind, kase, label),
        applyTextEdits,
        labels: candidateLabels,
        spacingOnly: true,
      });
    }
    const excerpts = prepared.groups.map((group) => {
      const attempts = Array.from({ length: 6 }, (_, index) => {
        const parts = group.targets.map((target) => ({ kind: target.kind, id: target.id, attempt: components[target.kind].cases.find((row) => row.id === target.id).attempts[index] }));
        const valid = parts.every(({ attempt }) => attempt.valid);
        const output = valid
          ? applyTextEdits(
              group.settled,
              parts.flatMap(({ attempt }) => attempt.edits),
            )
          : null;
        return {
          order: Math.floor(index / 3),
          repeat: index % 3,
          valid,
          output,
          correct: valid && output === group.expected,
          failures: parts.filter(({ attempt }) => !attempt.targetSpacingCorrect).map(({ kind, id }) => ({ kind, id })),
        };
      });
      return { id: group.id, key: group.key, expected: group.expected, attempts, correct: attempts.filter((attempt) => attempt.correct).length, passed: attempts.every((attempt) => attempt.correct) };
    });
    return { components, excerpts, passing: excerpts.filter((row) => row.passed).length, complete: Object.values(components).every((component) => component.complete) };
  };
  const runs = comparisons.map(({ baseline, candidate }, comparison) => {
    for (const kind of kinds) {
      check(baseline[kind]?.orders, candidate[kind]?.orders, `${comparison}/${kind}: baseline/candidate case orders differ`);
      for (const side of ['baseline', 'candidate'])
        check(comparisons[comparison][side][kind]?.orders, comparisons[0][side][kind]?.orders, `${comparison}/${side}/${kind}: case orders changed between comparisons`);
    }
    const control = scoreSide(baseline, 'baseline');
    const treatment = scoreSide(candidate, 'candidate');
    const regressions = control.excerpts.filter((row, index) => row.passed && !treatment.excerpts[index].passed).map((row) => row.id);
    const attemptDeclines = control.excerpts.filter((row, index) => treatment.excerpts[index].correct < row.correct).map((row) => row.id);
    const targetDeclines = kinds.flatMap((kind) =>
      control.components[kind].cases.filter((row, index) => treatment.components[kind].cases[index].targetSpacingCorrect < row.targetSpacingCorrect).map((row) => `${kind}/${row.id}`),
    );
    const unsafeControls = treatment.components['plus-digit'].cases
      .filter((row) => prepared.corpora['plus-digit'].cases.find((kase) => kase.id === row.id).expected_label === 'signed-number' && row.targetSpacingCorrect !== 6)
      .map((row) => row.id);
    const improvements = control.excerpts.filter((row, index) => !row.passed && treatment.excerpts[index].passed).map((row) => row.id);
    return {
      baseline: control,
      candidate: treatment,
      regressions,
      attemptDeclines,
      targetDeclines,
      unsafeControls,
      improvements,
      passed: control.complete && treatment.complete && !regressions.length && !attemptDeclines.length && !targetDeclines.length && !unsafeControls.length,
    };
  });
  const stableImprovements = runs[0].improvements.filter((id) => runs.every((run) => run.improvements.includes(id)));
  return { passed: !protocolIssues.length && runs.every((run) => run.passed) && stableImprovements.length > 0, protocolIssues, stableImprovements, runs };
}

function sourceSnapshot() {
  assert.deepEqual(AMBIGUOUS_SHAPES.map((shape) => shape.kind).sort(), Object.keys(shapes).sort(), 'shipping registry changed; update composition coverage before scoring');
  return Object.fromEntries(
    [
      'src/shared/index.ts',
      'browser-extensions/chrome/src/ai-spacing/content-script.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/ambiguous-shapes.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/base.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/digit-plus.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/plus-digit.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/hyphen-digit-prompt.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/digit-plus-prompt.ts',
      'browser-extensions/chrome/src/ai-spacing/shapes/plus-digit-prompt.ts',
      'scripts/prompt-experiments/plus-digit/experiment.mjs',
      'scripts/prompt-experiments/composition.mjs',
      'scripts/prompt-experiments/sweep.mjs',
      'scripts/prompt-experiments/hyphen-digit/paired-gates.mjs',
    ].map((path) => [path, sha256(readFileSync(join(root, path)))]),
  );
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: Object.fromEntries(['cases', 'prompts', 'out', 'prepared', 'runs'].map((key) => [key, { type: 'string' }])) });
  assert(
    positionals.length === 1 && ['prepare', 'check'].includes(positionals[0]),
    'use composition.mjs prepare --cases <corpus> --prompts <module> --out <new-private-dir>, or check --prepared <prepared.json> --runs <comparisons.json> --out <new-private-dir>',
  );
  assert(values.out, 'missing --out; use a new ignored local/prompt-experiments directory');
  if (positionals[0] === 'prepare') {
    assert(values.cases && values.prompts, 'prepare requires --cases and --prompts');
    const registry = await import(pathToFileURL(resolve(values.prompts)));
    const prepared = prepareComposition(loadCorpus(values.cases), registry);
    Object.assign(prepared, {
      source: { cases: resolve(values.cases), prompts: resolve(values.prompts) },
      frozen: { cases: sha256(readFileSync(values.cases)), prompts: sha256(readFileSync(values.prompts)), sources: sourceSnapshot() },
    });
    const directory = outputDirectory(root, values.out);
    writeFileSync(join(directory, 'prepared.json'), `${JSON.stringify(prepared, null, 2)}\n`, { flag: 'wx' });
    for (const [kind, corpus] of Object.entries(prepared.corpora)) writeFileSync(join(directory, `${kind}.json`), `${JSON.stringify(corpus, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ excerpts: prepared.groups.length, targets: Object.fromEntries(Object.entries(prepared.corpora).map(([kind, corpus]) => [kind, corpus.cases.length])), directory }));
  } else {
    assert(values.prepared && values.runs, 'check requires --prepared and --runs');
    const prepared = readJSON(values.prepared);
    assert.deepEqual(
      prepared.frozen,
      { cases: sha256(readFileSync(prepared.source.cases)), prompts: sha256(readFileSync(prepared.source.prompts)), sources: sourceSnapshot() },
      'corpus, prompts, or source changed after prepare; restore the frozen inputs',
    );
    const registry = await import(pathToFileURL(prepared.source.prompts));
    const recomputed = prepareComposition(loadCorpus(prepared.source.cases), registry);
    assert.deepEqual(
      { groups: prepared.groups, corpora: prepared.corpora, baselineShapePrompts: prepared.baselineShapePrompts, shapePrompts: prepared.shapePrompts, frozenPrompts: prepared.frozenPrompts },
      recomputed,
      'prepared data or imported prompts changed; use the frozen inputs',
    );
    const paths = readJSON(values.runs);
    const seen = new Set();
    const comparisons = paths.map((comparison) =>
      Object.fromEntries(
        ['baseline', 'candidate'].map((side) => [
          side,
          Object.fromEntries(
            Object.entries(comparison[side]).map(([kind, path]) => {
              const real = realpathSync(path);
              assert(!seen.has(real), `reused artifact: ${path}; every side needs fresh inference`);
              seen.add(real);
              return [kind, readJSON(path)];
            }),
          ),
        ]),
      ),
    );
    const modelRuns = comparisons.flatMap((comparison) => Object.values(comparison).flatMap((side) => Object.values(side)));
    assert(
      modelRuns.every((artifact) => typeof artifact.browserVersion === 'string' && artifact.browserVersion === modelRuns[0].browserVersion),
      'browser runtime changed or missing between composed sides',
    );
    assert.equal(comparisons.length, 2, 'composition requires two fresh comparisons');
    const sides = [comparisons[0].baseline, comparisons[0].candidate, comparisons[1].candidate, comparisons[1].baseline];
    const times = sides.map((side) => Object.values(side).map((artifact) => Date.parse(artifact.timestamp)));
    assert(
      times.flat().every(Number.isFinite) && times.slice(1).every((side, index) => Math.min(...side) > Math.max(...times[index])),
      'run baseline then candidate, followed by fresh candidate then baseline; timestamps must show the reversed execution order',
    );
    const gate = evaluateComposition(prepared, comparisons, registry);
    const directory = outputDirectory(root, values.out);
    writeFileSync(join(directory, 'gate.json'), `${JSON.stringify(gate, null, 2)}\n`, { flag: 'wx' });
    console.log(
      JSON.stringify({
        passed: gate.passed,
        protocolIssues: gate.protocolIssues,
        stableImprovements: gate.stableImprovements,
        runs: gate.runs.map((run) => ({
          baseline: run.baseline.passing,
          candidate: run.candidate.passing,
          regressions: run.regressions,
          attemptDeclines: run.attemptDeclines,
          targetDeclines: run.targetDeclines,
          unsafeControls: run.unsafeControls,
        })),
        directory,
      }),
    );
    if (!gate.passed) process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await main();
  } catch (error) {
    console.error(`composition: ${error.message}`);
    process.exitCode = 1;
  }
}
