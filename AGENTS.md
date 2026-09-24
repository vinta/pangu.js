# AGENTS.md

## Constraints

- Generated files: `dist/` and `browser-extensions/chrome/dist/` are build or test output; avoid hand-editing them unless the task explicitly targets generated artifacts.
- Preserve the zero-runtime-dependency package design unless the user explicitly accepts a new dependency and its maintenance cost.
- Keep exact dependency versions in `package.json`; do not introduce `^` or `~` ranges.
- Use `node:` prefixes for Node.js built-in modules.
- Avoid hard-wrapping Markdown prose; keep paragraphs and list items on single logical lines unless a format requires manual line breaks.
- Do not wrap code comments early. Fill each comment line up to Prettier's `printWidth` (200, in `.prettierrc.json`) and break only when the line would exceed it. Prettier never reflows comment text, so an early-wrapped comment stays narrow forever.

## Workflow

- For multi-step, ambiguous, broad, or high-risk work, state a short 3–5 item plan before editing, covering approach, files, verification, and consequential open questions. Implement narrow, well-scoped fixes directly after gathering context.
- For model-assisted prompt experiments, use [prompt-experiments](.agents/skills/prompt-experiments/SKILL.md). Ordinary deterministic spacing fixes use the checks below.
- Before writing code that uses dependencies, tools, browser or extension APIs, or release machinery, invoke `find-docs` and check current documentation. Use local source as needed; do not rely on training data for API or configuration details. For Context7 lookups, use the pre-resolved IDs below.

## Verification

- Run `npm run build` before `npm run lint` or `npm run typecheck`; these checks depend on generated package outputs. The `test` and `test:*` scripts already run the full build.
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
- Before changing release or packaging scripts, verify their generated output paths.

## Context7 Library IDs

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
