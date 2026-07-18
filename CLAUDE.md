# CLAUDE.md

## Project Overview

`pangu.js` is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and half-width characters (alphabetical letters, numerical digits, and symbols) for better readability. It ships two build targets: an npm package (ESM/CommonJS/UMD) for Node.js and browsers, and a Chrome extension (Manifest V3).

## Common Development Commands

```bash
npm run build              # Build all targets (library + extension)
npm run build:lib          # Build library (shared, browser, node)
npm run build:extension    # Build Chrome extension (needs dist/ from build:lib, copies pangu.umd.js into vendors/)

# Every test script runs a full build first
npm run test               # Run all tests (vitest + playwright)
npm run test:shared        # Test core/shared logic
npm run test:node          # Test Node.js-specific code
npm run test:browser       # Test browser code (uses Playwright)

npm run lint
npm run lint:fix

npm run publish-package 1.2.3   # Bump version, update docs, build, commit, and tag
```

**npm publishing**: Done via GitHub Actions (`.github/workflows/publish.yml`), triggered by pushing a `v*` tag. Uses npm Trusted Publishing (OIDC) — no tokens needed. Do NOT run `npm publish` locally.

## Where Things Live

- Core spacing logic (regex patterns): `src/shared/index.ts`, core test cases: `tests/shared/index.test.ts`
- Browser DOM layer: `src/browser/`
- Node.js API and CLI: `src/node/`
- Chrome extension: `browser-extensions/chrome/src/`

## Development Guidelines

- Maintain zero runtime dependencies
- Always pin exact dependency versions in `package.json` (no `^` or `~` prefixes)

## Future Improvements

See `TODO.md` for planned improvements and technical debt.

## Agent Skills

### Issue Tracker

Issues are tracked on GitHub (github.com/vinta/pangu.js) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage Labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain Docs

Single-context layout — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
