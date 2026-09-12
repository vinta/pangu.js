# AGENTS.md

## Role

- Treat this repository as `pangu.js`, a TypeScript text-spacing library that inserts readable spacing between CJK characters and half-width letters, numbers, and symbols.
- Act as a pragmatic Codex collaborator: keep changes small, correct, reviewable, and backed by current source material.

## Project Shape

- Runtime package: zero runtime dependencies, published as `pangu` for Node.js and browser use.
- Build outputs: ESM, CommonJS, and UMD library bundles under `dist/`.
- Browser extension: Chrome Manifest V3 extension under `browser-extensions/chrome/`.
- Generated files: `dist/` and `browser-extensions/chrome/dist/` are build or test output; avoid hand-editing them unless the task explicitly targets generated artifacts.

## Important Paths

- `browser-extensions/chrome/pages/`, `stylesheets/`, `icons/`, `images/`, and `sounds/`: extension UI and store assets.
- `browser-extensions/chrome/_locales/`: extension name, description, and UI strings; `zh_TW` is the default and only locale.
- `browser-extensions/chrome/src/`: extension service worker, content script, popup, options page, and utilities.
- `scripts/`: release and extension packaging helpers.
- `src/browser/`: browser DOM spacing, TreeWalker traversal, task scheduling, visibility detection, and UMD entry.
- `src/node/`: Node.js API, CommonJS wrapper, and CLI implementation.
- `src/shared/index.ts`: core platform-agnostic spacing logic and regex rules.
- `tests/browser/`: Playwright browser behavior tests.
- `tests/extension/`: Chrome extension settings and URL-matching tests.
- `tests/node/`: Node-specific tests and file-processing coverage.
- `tests/shared/`: shared spacing behavior tests.

## Commands

- Install dependencies with `npm install` when needed; this repo uses `package-lock.json`.
- Build everything with `npm run build`.
- Build only the library with `npm run build:lib`.
- Build only the Chrome extension with `npm run build:extension`.
- Run all tests with `npm run test`.
- Run shared logic tests with `npm run test:shared`.
- Run Node.js tests with `npm run test:node`.
- Run browser tests with `npm run test:browser`.
- Run extension tests with `npm run test:extension`.
- Run lint with `npm run lint`.
- Run type checking with `npm run typecheck`; it covers all three tsconfigs.
- Clean generated artifacts with `npm run clean`.
- Package the extension with `npm run pack-extension`.

## Workflow

- For model-assisted prompt experiments, use [prompt-experiments](.agents/skills/prompt-experiments/SKILL.md). Ordinary deterministic spacing fixes use the checks below.

- For multi-step tasks, first inspect the relevant files, current branch and worktree state, generated-versus-tracked ownership, command availability, and package scripts.
- Before editing, state a short 3-5 item plan that covers approach, files touched, verification, and any open questions that materially affect correctness.
- Give Codex enough task context: goal, relevant files or errors, constraints, and what counts as done.
- Use a plan-first approach for ambiguous, broad, or high-risk tasks; implement directly for narrow well-scoped fixes after gathering context.
- Search usages with `rg` before removing or renaming public APIs, imports, functions, commands, config keys, dependencies, docs references, or files.
- Keep behavior changes, refactors, generated-output updates, and documentation cleanups separate unless the request explicitly combines them.
- When coding against dependencies, tools, browser APIs, extension APIs, or release machinery, check current docs or local source before relying on memory.
- When improving a prompt, ask the model follow-up questions to understand how it interprets the instructions, then use its answers to guide experiments.

## Coding Conventions

- Preserve the zero-runtime-dependency package design unless the user explicitly accepts a new dependency and its maintenance cost.
- Keep exact dependency versions in `package.json`; do not introduce `^` or `~` ranges.
- Follow existing TypeScript style, ESLint 10, Prettier 3, and sorted import conventions.
- Use `node:` prefixes for Node.js built-in modules.
- Keep regex-heavy spacing logic readable and add comments only where they explain non-obvious matching intent or constraints.
- Avoid hard-wrapping Markdown prose; keep paragraphs and list items on single logical lines unless a format requires manual line breaks.
- Do not wrap code comments early. Fill each comment line up to Prettier's `printWidth` (200, in `.prettierrc.json`) and break only when the line would exceed it. Prettier never reflows comment text, so an early-wrapped comment stays narrow forever.

## Verification

- Run the smallest meaningful check for the files changed, then broaden only when risk or failures require it.
- For shared spacing changes, run `npm run test:shared`; add or update tests in `tests/shared/` when behavior changes.
- For Node API or CLI changes, run `npm run test:node`; use focused fixture coverage for file-processing behavior.
- For browser DOM behavior, run `npm run test:browser` or a focused Playwright test when possible.
- For extension source changes, run `npm run build:extension`; run broader tests if shared or browser library behavior is affected.
- For build, packaging, or export changes, run `npm run build` and the relevant package or smoke check.
- For docs/config-only changes, at minimum run `git diff --check`.
- Do not leave new warnings behind. If a meaningful check cannot run, state exactly what was skipped, why, and the next best check.

## Publishing And Releases

- Do not run `npm publish` locally. npm publishing is handled by GitHub Actions through the `v*` tag workflow and Trusted Publishing.
- Use `npm run bump-version <version>` only when the task explicitly asks for a release/version flow.
- Keep release, package, and extension packaging changes especially small and verify the generated output path before modifying scripts.

## External Tool Documentation

Invoke the `find-docs` skill BEFORE writing code that touches a dependency's API or config, not only when the user asks about a tool. Do not answer from training data, even for familiar APIs.

### Context7 Library IDs

Pre-resolved IDs for the `find-docs` skill. Pass directly to `ctx7 docs`, skipping the `ctx7 library` step:

| Tool              | `libraryId`                                    |
| ----------------- | ---------------------------------------------- |
| attw              | `/arethetypeswrong/arethetypeswrong.github.io` |
| Chrome Extensions | `/websites/developer_chrome_extensions`        |
| ESLint            | `/eslint/eslint`                               |
| MDN Web Docs      | `/mdn/content`                                 |
| Node.js           | `/nodejs/node`                                 |
| npm               | `/websites/npmjs`                              |
| Playwright        | `/microsoft/playwright`                        |
| Prettier          | `/prettier/prettier`                           |
| publint           | `/publint/publint`                             |
| Shields.io        | `/websites/shields_io_badges`                  |
| TypeScript        | `/websites/typescriptlang`                     |
| typescript-eslint | `/typescript-eslint/typescript-eslint`         |
| Vite              | `/vitejs/vite`                                 |
| Vitest            | `/vitest-dev/vitest`                           |
