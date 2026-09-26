# CLAUDE.md

## Spacing Rules

- `CONTEXT.md` is the glossary of terms the spacing rules, docs, and code share. Read it before touching spacing rules, and use its terms, never the synonyms it lists under _Avoid_.
- Decisions that changed a spacing contract are ADRs in `docs/adr/`. Check them before proposing a rule change that reverses one.
- When tweaking spacing rules, if the simpler rule is blocked only by rare test cases (typo-shaped input, degenerate shapes, nothing a real user reported), challenge the user to drop those cases in favor of the simpler rule instead of complicating the rule to preserve them. Show the candidate rule and exactly which expectations it breaks, then recommend dropping. Comment dropped cases out in place with `// Rare cases, ignore`, and record reversals of documented contracts as an ADR (precedent: ADR 0007). This licenses dropping rare-case contracts, not pruning tests in general.
- When fixing a spacing issue, first try absorbing it into an existing rule (widen a character class, adjust a lookahead, rename the rule if its name stops matching). Add a separate rule when the tweak would overcomplicate the existing one, such as forcing one regex to serve two unrelated readings: optimize for total complexity of the rule set, not rule count.
- Before changing a spacing rule, prototype every candidate on a patched copy of the built engine (`dist/shared/index.js`) and generate a per-case table with one block per case: input, rules output, extension output. Cover the symbol's test file plus real-world shapes, and decide on the diff between candidates, never on argument.
- Example inputs use real-world text only. Never invent a name, term, or sentence to show an unlisted or boundary case; made-up input proves nothing about real text. A synthetic token is allowed only for a regex-boundary unit test, and says so.
- A per-line reading (pipe, plus, hyphen) must test its contact before an earlier rule spaces that contact away. Plus reading missed every `CJK+A` line until it moved ahead of the operator rules, while the glossary promised the flip all along. When a glossary promise fails on a shape, check rule order before the regex.

## Releasing

```bash
npm run bump-version 1.2.3      # Bumps package.json, extension manifest, src/shared/index.ts, examples/package.json, then builds and packs the extension zip. Does NOT commit or tag.
```

When the release won't ship a new extension to the Chrome Web Store, restore the manifest version with `git restore browser-extensions/chrome/manifest.json` before committing, so the manifest doesn't claim an extension release that never happens. `/verify-before-npm-publish` decides: it fails when extension build inputs changed since the last store release but the manifest wasn't bumped, or didn't change but the manifest was.

1. **Verify**: `/verify-before-npm-publish` must print `VERIFY OK` on the exact HEAD being tagged, so rerun it whenever HEAD moves after a pass.
2. **Tag**: tag (`git tag -a vX.Y.Z -m ""`) and push master plus the tag only after the user says "publish".
3. **npm publishing** runs in GitHub Actions (`publish.yml`) on a pushed `v*` tag, using npm Trusted Publishing (OIDC). Never run `npm publish` locally. ADR 0014 records why publishing is one job, not a pack/publish split.
4. **Confirm**: `npm install pangu@X.Y.Z --min-release-age=0` in a scratch directory.

## Gotcha

- When adding or editing a glossary entry, a definition uses only bold glossary terms, platform names as the platform spells them (`Text` node, string, line, element), and ordinary English in its ordinary sense. One word carries one sense: a word needed in a technical sense gets its own entry or gets replaced. A term matches the code identifier for the same concept; when they diverge, define the code's word or rename the code.
- Never blanket find-replace a domain term: pangu vocabulary doubles as ordinary verbs (space, settle). After a rename, grep the changed files for the old word's remaining forms, identifiers included, and read each hit for noun versus verb.
- Write code comments in English with ANS characters only. Never paste CJK sample text from tests into a comment; describe the shape generically (`CJK | CJK`, `A+CJK`) and use `\uXXXX` escape notation when a specific character matters.
- In `tests/shared/`, write each `spaceText` case as its own literal `expect(...).toBe(...)` line, never a loop or `it.each`, so a failure names its input.
- Keep every `// FIXME` line and `FIXME:` prefix in tests, even beside `it.fails` or `test.fail`: the user greps FIXME to find pending work.
- Prefix a console call with `[pangu]` only in code that runs in an ordinary web page's console (content scripts, `src/shared/`), where the prefix is the only filter separating our logs from the site's. Options page, popup, and service worker logs stay unprefixed.
- `fixtures/` has no `.prettierignore` on purpose. A byte-sensitive fixture carries a leading `<!-- prettier-ignore -->` pragma that `loadFixture()` strips before browser tests byte-compare `innerHTML` against the `.expected.html` files. The pragma guards only the next node, so many fixtures fail `prettier --check`. Never format fixtures in bulk (a repo-wide `prettier --write` breaks browser tests), and leave unreferenced fixtures alone.

## External Tool Documentation

Pre-resolved Context7 IDs for the `find-docs` skill. Pass them to `ctx7 docs` and skip `ctx7 library`:

| Tool               | `libraryId`                                    |
| ------------------ | ---------------------------------------------- |
| attw               | `/arethetypeswrong/arethetypeswrong.github.io` |
| Chrome built-in AI | `/websites/developer_chrome_ai`                |
| Chrome Extensions  | `/websites/developer_chrome_extensions`        |
| ESLint             | `/eslint/eslint`                               |
| GitHub Actions     | `/websites/github_en_actions`                  |
| MDN Web Docs       | `/mdn/content`                                 |
| Node.js            | `/nodejs/node`                                 |
| npm                | `/websites/npmjs`                              |
| Playwright         | `/microsoft/playwright`                        |
| Prettier           | `/prettier/prettier`                           |
| publint            | `/publint/publint`                             |
| Shields.io         | `/websites/shields_io_badges`                  |
| TypeScript         | `/websites/typescriptlang`                     |
| typescript-eslint  | `/typescript-eslint/typescript-eslint`         |
| Vite               | `/vitejs/vite`                                 |
| Vitest             | `/vitest-dev/vitest`                           |
