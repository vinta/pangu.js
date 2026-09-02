# CLAUDE.md

`pangu.js` is a text spacing library that automatically inserts whitespace between CJK (Chinese, Japanese, Korean) characters and ANS characters (alphabetical letters, numerical digits, and symbols) for better readability. It ships two build targets: an npm package (ESM/CommonJS/UMD) for Node.js and browsers, and a Chrome extension (Manifest V3).

## Domain Vocabulary

- `CONTEXT.md` is the glossary: the terms the spacing rules, docs, and code share (text run, joiner token, slash/pipe/plus/affix reading, boundary spacing, tag mention, late fix, ambiguous shape). Read it before touching spacing rules, and use its terms, never the synonyms it lists under _Avoid_.
- Decisions that changed a spacing contract are ADRs in `docs/adr/`. Check them before proposing a rule change that reverses one.
- When adding or editing a glossary entry, a definition uses only bold glossary terms, platform names as the platform spells them (`Text` node, string, line, element), and ordinary English in its ordinary sense. One word carries one sense: a word needed in a technical sense gets its own entry or gets replaced. A term matches the code identifier for the same concept; when they diverge, define the code's word or rename the code.

## Workflow

### Common Development Commands

Build, test, lint, and typecheck scripts are listed in `package.json`. The one whose behavior is not obvious from its name:

```bash
npm run bump-version 1.2.3      # Bumps package.json, extension manifest, src/shared/index.ts, examples/package.json, then builds and packs the extension zip. Does NOT commit or tag.
```

**npm publishing** runs in GitHub Actions (`.github/workflows/publish.yml`) when a `v*` tag is pushed, using npm Trusted Publishing (OIDC), so no tokens are needed. Never run `npm publish` locally. ADR 0014 records why the workflow is a single job.

## Gotcha

- When tweaking spacing rules, if the simpler rule is blocked only by rare test cases (typo-shaped input, degenerate shapes, nothing a real user reported), challenge me to drop those cases in favor of the simpler rule instead of complicating the rule to preserve them. Show the candidate rule and exactly which expectations it breaks, then recommend dropping. Comment dropped cases out in place with `// Rare cases (basically a typo), ignore`, and record reversals of documented contracts as an ADR (precedent: ADR 0007). This licenses dropping rare-case contracts, not pruning tests in general.
- When fixing a spacing issue, try absorbing it into an existing rule first (widen a character class, adjust a lookahead, rename the rule if its name stops matching). This is a default, not a hard rule: if the tweak would overcomplicate the existing rule, such as forcing one regex to serve two unrelated readings, a separate new rule is better. Optimize for total complexity of the rule set, not rule count. When a rare test case is what blocks the tweak, the previous guideline applies: challenge me to drop it.
- Write code comments in English with ANS characters only. Never paste CJK sample text from tests into a comment; describe the shape generically (`CJK | CJK`, `A+CJK`) and use `\uXXXX` escape notation when a specific character matters.
- `fixtures/` has no `.prettierignore` on purpose. A byte-sensitive fixture carries a leading `<!-- prettier-ignore -->` pragma that `loadFixture()` in `tests/browser/pangu.playwright.ts` strips, and browser tests byte-compare `innerHTML` against the `.expected.html` files. The pragma guards only the next node, so many fixtures still fail `prettier --check` and a repo-wide `prettier --write` breaks browser tests. Never format fixtures in bulk, and leave unreferenced fixtures alone.
- Do not prune a Playwright test because a vitest table proves the same transformation. Browser-level integration redundancy is wanted. Propose each deletion individually; only a trivial exact duplicate goes without asking.
- `CHANGELOG.md` entries are plain factual zh-TW lines saying what literally changed, verified against the commit diffs (test expectation flips are the ground truth), not the issue's framing. No jokes: the humor there is Vinta's own voice. One compact token beats an enumeration of examples. Retroactive entries only correct a statement that is now false; never backfill a change the changelog was deliberately silent about.
- Merge pull requests with `gh pr merge <n> --merge`. Never squash: the individual commits must land on `master` verbatim so per-commit revert, bisect, and the reasoning in commit messages survive. Tidy the branch before merging instead.

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
