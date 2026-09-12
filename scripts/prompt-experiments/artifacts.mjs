import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export const pick = (value, fields) => Object.fromEntries(fields.filter((field) => value?.[field] !== undefined).map((field) => [field, value[field]]));

export function publicCase(kase) {
  const result = pick(kase, [
    'id',
    'enum',
    'input',
    'at',
    'symbol',
    'expected_label',
    'type',
    'review',
    'meaning',
    'source',
    'retrieved_at',
    'original_excerpt',
    'original_at',
    'target',
    'annotation_rationale',
    'source_html',
    'html_capture',
    'routing_status',
    'source_verification',
    'source_css',
    'source_css_status',
    'settled',
    'settled_index',
    'expected_target_spacing',
    'expected_spacing',
    'canonical_source',
    'source_css_sources',
    'role_note',
    'supplied_at',
    'role',
    'verification_status',
    'supplied_excerpt',
    'source_surface',
    'source_note',
    'eligible_targets',
    'expected_output',
    'group',
    'split',
    'sourceTitle',
    'publisher',
    'publishedDate',
    'retrievedDate',
    'sourceExcerpt',
    'category',
    'rationale',
    'evidence',
    'eventDate',
    'sourceLocation',
    'sourceIndependence',
    'ordinal',
  ]);
  if (kase.prior_exposure) {
    result.prior_exposure = pick(kase.prior_exposure, ['source_inspected', 'label_reviewed', 'model_inference', 'prompt_example', 'topic_discussed', 'note', 'inference_note']);
  }
  if (kase.fresh_verification) {
    result.fresh_verification = pick(kase.fresh_verification, ['timestamp', 'evidence', 'evidence_record', 'method', 'pangu_disabled', 'verified', 'final_url', 'http_status', 'evidence_kind']);
  }
  if (kase.source_style_check) {
    result.source_style_check = kase.source_style_check.map((style) => pick(style, ['tag', 'display', 'whiteSpace', 'visibility']));
  }
  if (kase.targets) {
    result.targets = kase.targets.map((target) => pick(target, ['ordinal', 'expected_label']));
  }
  return result;
}

export function publicFixture(kase) {
  return { html: kase.source_html, css: kase.source_css };
}

export function publicError(error, privateValues = []) {
  if (error?.stdout !== undefined || error?.stderr !== undefined || error?.syscall?.startsWith('spawn')) {
    return `Browser command failed (exit ${Number.isInteger(error.status) ? error.status : 'unavailable'}${error.signal ? `, signal ${error.signal}` : ''}); verify the browser attachment and model readiness`;
  }
  let message = String(error?.message ?? error).split('\n')[0];
  for (const value of privateValues.filter(Boolean)) {
    message = message.replaceAll(value, '[local]');
  }
  return message.replace(/chrome-extension:\/\/[^/\s]+/g, 'chrome-extension://[local]').replace(/(?:[A-Za-z]:\\|\/Users\/|\/home\/)[^\s"']+/g, '[local-path]');
}

export function outputDirectory(root, path) {
  const directory = resolve(path);
  const base = resolve(root, 'tmp', 'prompt-experiments');
  if (!directory.startsWith(`${base}${sep}`)) {
    throw new Error(`Invalid experiment output: ${path}; use a new directory under tmp/prompt-experiments/`);
  }
  let parent = resolve(root);
  for (const part of relative(root, directory).split(sep)) {
    parent = join(parent, part);
    if (lstatSync(parent, { throwIfNoEntry: false })?.isSymbolicLink()) {
      throw new Error(`Experiment output contains a symlink: ${parent}; use a directory inside the repository`);
    }
  }
  try {
    execFileSync('git', ['-C', root, 'check-ignore', '--quiet', '--no-index', directory]);
  } catch {
    throw new Error(`Experiment output is not ignored: ${path}; add /tmp/ to the repository .gitignore`);
  }
  if (execFileSync('git', ['-C', root, 'ls-files', '--', relative(root, directory)], { encoding: 'utf8' }).trim()) {
    throw new Error(`Experiment output is tracked: ${path}; use an ignored, untracked directory`);
  }
  mkdirSync(dirname(directory), { recursive: true });
  mkdirSync(directory, { recursive: false });
  return directory;
}

export function scratchDirectory(root, prefix) {
  return outputDirectory(root, join(root, 'tmp', 'prompt-experiments', `${prefix}${randomUUID()}`));
}
