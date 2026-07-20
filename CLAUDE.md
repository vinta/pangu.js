# CLAUDE.md

## Project Overview

`pangu.js` is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability. It ships two build targets: an npm package (ESM/CommonJS/UMD) for Node.js and browsers, and a Chrome extension (Manifest V3).

## Common Development Commands

```bash
npm run build                   # Build all targets (library + extension)
npm run build:lib               # Build library (shared, browser, node)
npm run build:extension         # Build Chrome extension (needs dist/ from build:lib, copies pangu.umd.js into vendors/)

npm run test                    # Run all tests (vitest + playwright)
npm run test:shared             # Test core/shared logic
npm run test:node               # Test Node.js-specific code
npm run test:browser            # Test browser code (uses Playwright)

npm run lint
npm run lint:fix

npm run publish-package 1.2.3   # Bump version across files (incl. README), build, and pack extension (does NOT commit or tag)
```

**npm publishing**: Done via GitHub Actions (`.github/workflows/publish.yml`), triggered by pushing a `v*` tag. Uses npm Trusted Publishing (OIDC) — no tokens needed. Do NOT run `npm publish` locally.

## Where Things Live

- Core spacing logic (regex patterns): `src/shared/index.ts`
- Browser DOM layer: `src/browser/`
- Node.js API and CLI: `src/node/`
- Chrome extension: `browser-extensions/chrome/`
- Test cases: `tests/`

## Development Guidelines

- Maintain zero runtime dependencies
- When tweaking spacing rules, if the simpler rule is blocked only by rare test cases (typo-shaped input, degenerate shapes, nothing a real user reported), challenge me to drop those cases in favor of the simpler rule instead of complicating the rule to preserve them. Show the candidate rule and exactly which expectations it breaks, then recommend dropping. Comment dropped cases out in place with `// Rare cases (basically a typo), ignore`, and record reversals of documented contracts as an ADR (precedent: ADR 0007, which dropped `前面 ,後面` preservation to unlock one unanchored punctuation rule). This licenses dropping rare-case contracts, not pruning tests in general.
- When fixing a spacing issue, try absorbing it into an existing rule first (widen a character class, adjust a lookahead, rename the rule if its name stops matching). This is a default, not a hard rule: if the tweak would overcomplicate the existing rule, such as forcing one regex to serve two unrelated readings, a separate new rule is better. Optimize for total complexity of the rule set, not rule count. When a rare test case is what blocks the tweak, the previous guideline applies: challenge me to drop it.

## External Tool Documentation

When you need information about tools used in this project, use the `find-docs` skill or `WebFetch`.

### Context7 Library IDs

Pre-resolved IDs for the `find-docs` skill. Pass directly to `ctx7 docs`, skipping the `ctx7 library` step:

| Tool                                    | `libraryId`                             |
| --------------------------------------- | --------------------------------------- |
| Chrome Extensions                       | `/websites/developer_chrome_extensions` |
| ESLint                                  | `/eslint/eslint`                        |
| eslint-plugin-unicorn                   | `/sindresorhus/eslint-plugin-unicorn`   |
| typescript-eslint                       | `/typescript-eslint/typescript-eslint`  |
| MDN Web Docs                            | `/mdn/content`                          |
| nodemon                                 | `/remy/nodemon`                         |
| Playwright                              | `/microsoft/playwright`                 |
| Prettier                                | `/prettier/prettier`                    |
| `@trivago/prettier-plugin-sort-imports` | `/trivago/prettier-plugin-sort-imports` |
| Vite                                    | `/vitejs/vite`                          |
| Vitest                                  | `/vitest-dev/vitest`                    |

## Agent Skills

### Issue Tracker

Issues are tracked on GitHub (github.com/vinta/pangu.js) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage Labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain Docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
