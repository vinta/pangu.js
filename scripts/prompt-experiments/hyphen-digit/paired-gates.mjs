import assert from 'node:assert/strict';

export function evaluatePaired({ phase, cases, comparisons, exampleSources = [], editsForLabel, applyTextEdits }) {
  assert(['screening', 'confirmation', 'holdout'].includes(phase), `Unknown gate phase: ${phase}`);
  assert.equal(comparisons.length, phase === 'screening' ? 1 : 2, `${phase}: wrong number of fresh comparisons`);
  assert(cases.length > 0, 'No scored cases');
  assert.equal(new Set(cases.map((kase) => kase.id)).size, cases.length, 'Duplicate scored case IDs');
  const repeats = phase === 'screening' ? 1 : 3;
  const scheduled = repeats * 2;
  const groups = Map.groupBy(cases, (kase) => JSON.stringify([kase.canonical_source ?? kase.source, kase.original_excerpt]));
  for (const kase of cases) {
    assert(!kase.review && !exampleSources.includes(kase.canonical_source ?? kase.source), `${kase.id}: review/example page cannot be scored`);
    for (const field of ['expected_label', 'settled', 'expected_target_spacing', 'expected_spacing']) {
      assert(typeof kase[field] === 'string', `${kase.id}: missing frozen ${field}`);
    }
    assert.equal(kase.settled[kase.settled_index], '-', `${kase.id}: invalid frozen settled index`);
    assert.equal(applyTextEdits(kase.settled, editsForLabel(kase, kase.expected_label)), kase.expected_target_spacing, `${kase.id}: target gold disagrees with production edits`);
  }
  for (const group of groups.values()) {
    assert.equal(new Set(group.map((kase) => kase.settled_index)).size, group.length, 'Duplicate target in source excerpt');
    assert(
      group.every((kase) => kase.settled === group[0].settled && kase.expected_spacing === group[0].expected_spacing),
      'Inconsistent frozen excerpt spacing',
    );
    assert.equal(
      applyTextEdits(
        group[0].settled,
        group.flatMap((kase) => editsForLabel(kase, kase.expected_label)),
      ),
      group[0].expected_spacing,
      `${group[0].id}: excerpt gold disagrees with combined production edits`,
    );
  }

  function score(artifact) {
    const issues = [];
    const issue = (message) => issues.push(message);
    if (artifact.status !== 'complete' || artifact.error) {
      issue(`incomplete run: ${artifact.error ?? artifact.status}`);
    }
    if (artifact.purpose !== 'accuracy') {
      issue('diagnostics are not accuracy evidence');
    }
    if (artifact.repeats !== repeats || artifact.expectedAttemptsPerCase !== scheduled || artifact.orders?.length !== 2) {
      issue('wrong declared attempt schedule');
    }
    for (const order of artifact.orders ?? []) {
      if (JSON.stringify([...order].sort()) !== JSON.stringify(cases.map((kase) => kase.id).sort())) {
        issue('case order does not contain exactly the frozen cases');
      }
    }
    const returned = artifact.results ?? [];
    if (returned.length !== cases.length || new Set(returned.map((kase) => kase.id)).size !== cases.length || returned.some((result) => !cases.some((kase) => kase.id === result.id))) {
      issue('missing, duplicate, or unexpected case results');
    }
    const rows = cases.map((kase) => {
      const result = returned.find((result) => result.id === kase.id);
      const answers = result?.answers ?? [];
      for (const field of ['input', 'at', 'expected_label', 'settled', 'settled_index', 'expected_target_spacing', 'expected_spacing']) {
        if (result?.[field] !== kase[field]) {
          issue(`${kase.id}: result differs from frozen ${field}`);
        }
      }
      const complete = !result?.skipped && !result?.unavailable && answers.length === scheduled && [0, 1].every((order) => answers.filter((answer) => answer.order === order).length === repeats);
      if (!complete) {
        issue(`${kase.id}: missing, skipped, or extra attempts`);
      }
      const attempts = [0, 1].flatMap((order) =>
        Array.from({ length: repeats }, (_, repeat) => {
          const answer = answers.filter((answer) => answer.order === order)[repeat];
          let valid = false;
          try {
            valid = Boolean(
              answer && !answer.error && typeof answer.raw === 'string' && JSON.parse(answer.raw) === answer.answer && ['signed-number', 'range-or-separator', 'unsure'].includes(answer.answer),
            );
          } catch {
            valid = false;
          }
          if (!valid) {
            issue(`${kase.id}: invalid or errored answer at order ${order}, attempt ${repeat}`);
          }
          const edits = valid ? editsForLabel(kase, answer.answer) : [];
          const targetSpacing = valid ? applyTextEdits(kase.settled, edits) : null;
          return {
            order,
            repeat,
            valid,
            labelCorrect: valid && answer.answer === kase.expected_label,
            targetSpacing,
            targetSpacingCorrect: valid && targetSpacing === kase.expected_target_spacing,
            edits,
          };
        }),
      );
      return { id: kase.id, complete: Boolean(complete), attempts };
    });
    for (const group of groups.values()) {
      const members = group.map((kase) => rows.find((row) => row.id === kase.id));
      for (let index = 0; index < scheduled; index++) {
        const valid = members.every((row) => row.attempts[index].valid);
        const fullSpacing = valid
          ? applyTextEdits(
              group[0].settled,
              members.flatMap((row) => row.attempts[index].edits),
            )
          : null;
        for (const row of members) {
          Object.assign(row.attempts[index], { fullSpacing, fullSpacingCorrect: valid && fullSpacing === group[0].expected_spacing });
        }
      }
    }
    for (const row of rows) {
      Object.assign(row, {
        labelCorrect: row.attempts.filter((attempt) => attempt.labelCorrect).length,
        targetSpacingCorrect: row.attempts.filter((attempt) => attempt.targetSpacingCorrect).length,
        fullSpacingCorrect: row.attempts.filter((attempt) => attempt.fullSpacingCorrect).length,
        correct: row.attempts.filter((attempt) => attempt.labelCorrect && attempt.targetSpacingCorrect && attempt.fullSpacingCorrect).length,
        scheduled,
      });
      row.passed = row.complete && row.correct === scheduled;
    }
    return { complete: issues.length === 0, issues, cases: rows, passing: rows.filter((row) => row.passed).length };
  }

  const runs = comparisons.map(({ baseline, candidate }) => {
    const control = score(baseline);
    const treatment = score(candidate);
    const matched = JSON.stringify(baseline.orders) === JSON.stringify(candidate.orders) && baseline.sampling === candidate.sampling;
    const regressions = [];
    const attemptDeclines = [];
    const improvements = [];
    for (const original of control.cases) {
      const proposed = treatment.cases.find((kase) => kase.id === original.id);
      if (original.passed && !proposed.passed) {
        regressions.push(original.id);
      }
      if (!original.passed && proposed.correct < original.correct) {
        attemptDeclines.push(original.id);
      }
      if (!original.passed && proposed.passed) {
        improvements.push(original.id);
      }
    }
    const passed =
      matched &&
      control.complete &&
      treatment.complete &&
      regressions.length === 0 &&
      attemptDeclines.length === 0 &&
      (phase === 'holdout' ? treatment.passing >= control.passing : improvements.length > 0);
    return { passed, matched, baseline: control, candidate: treatment, regressions, attemptDeclines, improvements };
  });
  const stableImprovements = runs[0].improvements.filter((id) => runs.every((run) => run.improvements.includes(id)));
  const frozen = comparisons.every(({ baseline, candidate }) =>
    [baseline, candidate].every((artifact, index) => {
      const first = index === 0 ? comparisons[0].baseline : comparisons[0].candidate;
      return (
        ['variant', 'system', 'sampling', 'omitResponseConstraintInput'].every((key) => artifact[key] === first[key]) &&
        JSON.stringify(artifact.orders) === JSON.stringify(first.orders) &&
        (artifact.results ?? []).every((kase) => {
          const original = first.results?.find((original) => original.id === kase.id);
          return kase.question === original?.question && JSON.stringify(kase.responseConstraint) === JSON.stringify(original?.responseConstraint);
        })
      );
    }),
  );
  return { phase, passed: frozen && runs.every((run) => run.passed) && (phase !== 'confirmation' || stableImprovements.length > 0), frozen, stableImprovements, runs };
}
