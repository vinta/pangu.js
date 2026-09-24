---
name: verify-before-npm-publish
description: (project) Before publishing pangu, check the release is ready, pack it, and run the examples app against that tarball to prove the about-to-ship build is consumable by a real install
disable-model-invocation: true
allowed-tools:
  - Bash(npm:*)
  - Bash(node:*)
  - Bash(mktemp:*)
  - Bash(cp:*)
  - Bash(ls:*)
  - Bash(rm:*)
  - Bash(tar:*)
  - Bash(git diff:*)
  - Bash(git show:*)
  - Bash(git describe:*)
  - Bash(sort:*)
  - Bash(comm:*)
---

# Verify before publish

The `examples/` app is a real consumer: its own `package.json` pins a published `pangu`, its own `tsconfig.json` resolves under `NodeNext`, and its checks reach pangu through `node_modules` and the `exports` map. That is exactly the path pangu's own build never takes, because the build resolves `src/` directly, sibling file to sibling file. So a `.d.ts` with a bare relative import, or a file the `files` list forgot to ship, reaches npm green.

This skill briefly repoints that consumer at the **freshly packed tarball** instead of its published pin, runs every example check against it, and restores the pin. The packed tarball is the only honest artifact. Repointing is also what lets the check run before publish at all: pangu's next version is not on the registry yet, so the pin cannot resolve until the tarball stands in for it.

## Run the verification

Everything below runs as one command so the `trap` restores `examples/package.json` whether the checks pass, fail, or error midway. Never split it.

The checks capture their exit code explicitly instead of leaning on `set -e` to abort. Some runners (Claude Code's Bash tool among them) invoke this in a shell where `set -e` does not stop the script, and a bare `echo "VERIFY OK"` after an unguarded `npm run verify` then prints a pass over a real failure. Report the `VERIFY OK` / `VERIFY FAILED` line, never the tool's own exit status.

```bash
set -eu
fail() { echo "VERIFY FAILED ($1)"; exit 1; }

# Pushing the tag publishes the tagged commit without running test.yml, so it must pass the suite here and carry an unused version
VERSION="$(node -p "require('./package.json').version")"
[ -z "$(git status --porcelain)" ] || fail "dirty working tree"
[ "$(git branch --show-current)" = master ] || fail "not on master"
if git rev-parse -q --verify "refs/tags/v$VERSION" >/dev/null; then fail "tag v$VERSION exists locally"; fi
[ -z "$(npm view "pangu@$VERSION" version)" ] || fail "pangu@$VERSION already on npm"
{ npm test && npm run lint && npm run typecheck; } || fail "tests, lint, or typecheck"

# Build and pack the exact bytes that would go to npm
npm run build
TARBALL_DIR="$(mktemp -d)"
npm pack --pack-destination "$TARBALL_DIR"
TGZ="$(ls "$TARBALL_DIR"/pangu-*.tgz)"

# Every file under dist/ lives in an entry folder. A file directly in dist/ is a code-split chunk that a build config change let back in
if tar -tzf "$TGZ" | grep -E '^package/dist/[^/]+$'; then echo "VERIFY FAILED (stray file in dist/)"; exit 1; fi

# bump-version writes every version copy, so a mismatch means a hand edit missed one
tar -xzf "$TGZ" -C "$TARBALL_DIR"
[ "$(node -p "require('$TARBALL_DIR/package/package.json').version")" = "$VERSION" ] || fail "tarball package.json version"
[ "$(node --input-type=module -e "import { pangu } from '$TARBALL_DIR/package/dist/shared/index.js'; console.log(pangu.version)")" = "$VERSION" ] || fail "pangu.version"
# The last store release is the manifest version at the latest tag, so any change in extension build inputs since then needs a manifest bump, and no change needs a restored manifest
MANIFEST="$(node -p "require('./browser-extensions/chrome/manifest.json').version")"
STORE="$(git show "$(git describe --tags --abbrev=0):browser-extensions/chrome/manifest.json" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version")"
if git diff --quiet -I "readonly version: string" "v$STORE" HEAD -- src/browser src/shared browser-extensions/chrome browser-extensions/vite.config.extension.ts ':!browser-extensions/chrome/manifest.json' ':!browser-extensions/chrome/tests'; then
  [ "$MANIFEST" != "$VERSION" ] || fail "extension unchanged since v$STORE, restore the manifest version"
else
  [ "$MANIFEST" = "$VERSION" ] || fail "extension changed since v$STORE, manifest version"
fi
[ "$(node -p "require('./examples/package.json').dependencies.pangu")" = "$VERSION" ] || fail "examples pin"
grep -m1 '^## v' CHANGELOG.md | grep -q "^## v$VERSION " || fail "CHANGELOG top heading"

# CDN links reach any shipped path, so a file dropped since the published version breaks them
PUBLISHED="$(npm view pangu version)"
npm pack "pangu@$PUBLISHED" --pack-destination "$TARBALL_DIR"
tar -tzf "$TARBALL_DIR/pangu-$PUBLISHED.tgz" | sort > "$TARBALL_DIR/published.txt"
tar -tzf "$TGZ" | sort > "$TARBALL_DIR/packed.txt"
REMOVED="$(comm -23 "$TARBALL_DIR/published.txt" "$TARBALL_DIR/packed.txt")"
[ -z "$REMOVED" ] || { echo "$REMOVED"; fail "files removed since $PUBLISHED"; }

# From here the examples pin is modified, so guarantee its restoration on any exit
cp examples/package.json "$TARBALL_DIR/package.json.orig"
trap 'cp "$TARBALL_DIR/package.json.orig" examples/package.json; rm -rf "$TARBALL_DIR" examples/node_modules examples/package-lock.json' EXIT

# Repoint the consumer at the tarball, install, and run every example check against it
node -e "const fs=require('fs'),f='examples/package.json',p=JSON.parse(fs.readFileSync(f));p.dependencies.pangu='file:'+process.argv[1];fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n')" "$TGZ"
npm install --prefix examples --no-audit --no-fund

rc=0
npm run verify --prefix examples || rc=$?
if [ "$rc" -eq 0 ]; then echo "VERIFY OK"; else echo "VERIFY FAILED (exit $rc)"; fi
exit "$rc"
```

## Reading the result

- `VERIFY OK` on the last line → the tarball is clear to publish.
- `VERIFY FAILED` → do not publish. The `trap` has already restored the pin and dropped the throwaway install; diagnose from the message or the table below, fix, and rerun.

Either way, confirm the pin came back before moving on: `git diff --quiet examples/package.json` must exit 0. A dirty `examples/package.json` means the run was interrupted before the trap fired; restore it with `git checkout -- examples/package.json`.

## What each failure means

| Symptom                          | Cause                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `TS2834` in a `dist/**/*.d.ts`   | a relative import in `src/` is missing its `.js` extension                               |
| `TS2339` on an inherited method  | a base-class `.d.ts` import failed to resolve, collapsing the subclass to an error type  |
| `Cannot find module` at run time | `package.json` `files` doesn't ship the referenced file, or an `exports` path is wrong   |
| `stray file in dist/`            | the `esm` environment emitted a hashed shared chunk; keep `output.preserveModules` on it |
| `files removed since X.Y.Z`      | a rename or build change dropped a shipped path; restore it or release as a major        |

To read the shipped artifact directly, unpack the tarball: `tar -xzf "$TGZ" -C "$TARBALL_DIR"` exposes `package/dist/**/*.d.ts` and `package/package.json`.

## What the run exercises

`npm run verify` in `examples/` chains the runtime entrypoints (`verify:commonjs`, `verify:esm`, `verify:cli`), the browser page (`verify:browser`, which serves `verify-browser.html` and drives the UMD `<script>` tag and the ESM `import` in headless Chromium), and the type check (`typecheck`, whose `tsconfig.json` checks `verify-types.ts` under the `require` condition and `verify-types.mts` under the `import` condition, covering both branches of the dual-package `exports` map). Every one runs against the installed tarball, not the published pin.
