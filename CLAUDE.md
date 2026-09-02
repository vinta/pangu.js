# CLAUDE.md

## Project Overview

`pangu.js` is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability. It ships two build targets: an npm package (ESM/CommonJS/UMD) for Node.js and browsers, and a Chrome extension (Manifest V3).

Domain vocabulary (joiner token, slash/pipe/plus/affix reading, boundary spacing, tag mention) and per-skill overrides live in `CONTEXT.md`; decisions that changed spacing contracts live in `docs/adr/`. Read the glossary before touching spacing rules and use its terms, not the synonyms it lists under Avoid.

## Common Development Commands

Build, test, lint, and typecheck scripts are listed in `package.json`. The one whose behavior is not obvious from its name:

```bash
npm run bump-version 1.2.3      # Bumps package.json, extension manifest, src/shared/index.ts, examples/package.json, then builds and packs the extension zip. Does NOT commit or tag.
```

**npm publishing** runs in GitHub Actions (`.github/workflows/publish.yml`) when a `v*` tag is pushed, using npm Trusted Publishing (OIDC), so no tokens are needed. Never run `npm publish` locally. ADR 0014 records why the workflow is a single job.

## Gotcha

- When tweaking spacing rules, if the simpler rule is blocked only by rare test cases (typo-shaped input, degenerate shapes, nothing a real user reported), challenge me to drop those cases in favor of the simpler rule instead of complicating the rule to preserve them. Show the candidate rule and exactly which expectations it breaks, then recommend dropping. Comment dropped cases out in place with `// Rare cases (basically a typo), ignore`, and record reversals of documented contracts as an ADR (precedent: ADR 0007). This licenses dropping rare-case contracts, not pruning tests in general.
- When fixing a spacing issue, try absorbing it into an existing rule first (widen a character class, adjust a lookahead, rename the rule if its name stops matching). This is a default, not a hard rule: if the tweak would overcomplicate the existing rule, such as forcing one regex to serve two unrelated readings, a separate new rule is better. Optimize for total complexity of the rule set, not rule count. When a rare test case is what blocks the tweak, the previous guideline applies: challenge me to drop it.
- Write code comments in English with half-width characters only. Never paste CJK sample text from tests into a comment; describe the shape generically (`CJK | CJK`, `A+CJK`) and use `\uXXXX` escape notation when a specific character matters.

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
