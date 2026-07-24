---
name: verify-before-npm-publish
description: Before publishing pangu, pack it and run the examples app against that tarball to prove the about-to-ship build is consumable by a real install
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
  - Read
---

# Verify before publish

The `examples/` app is a real consumer: its own `package.json` pins a published `pangu`, its own `tsconfig.json` resolves under `NodeNext`, and its checks reach pangu through `node_modules` and the `exports` map. That is exactly the path pangu's own build never takes, because the build resolves `src/` directly, sibling file to sibling file. So a `.d.ts` with a bare relative import, or a file the `files` list forgot to ship, reaches npm green.

This skill briefly repoints that consumer at the **freshly packed tarball** instead of its published pin, runs every example check against it, and restores the pin. The packed tarball is the only honest artifact. Repointing is also what lets the check run before publish at all: pangu's next version is not on the registry yet, so the pin cannot resolve until the tarball stands in for it.

## Run the verification

Everything below runs as one command so the `trap` restores `examples/package.json` whether the checks pass, fail, or error midway. Never split it.

```bash
set -eu

# Build and pack the exact bytes that would go to npm
npm run build
TARBALL_DIR="$(mktemp -d)"
npm pack --pack-destination "$TARBALL_DIR"
TGZ="$(ls "$TARBALL_DIR"/pangu-*.tgz)"

# From here the examples pin is modified, so guarantee its restoration on any exit
cp examples/package.json "$TARBALL_DIR/package.json.orig"
trap 'cp "$TARBALL_DIR/package.json.orig" examples/package.json; rm -rf "$TARBALL_DIR" examples/node_modules examples/package-lock.json' EXIT

# Repoint the consumer at the tarball, install, and run every example check against it
node -e "const fs=require('fs'),f='examples/package.json',p=JSON.parse(fs.readFileSync(f));p.dependencies.pangu='file:'+process.argv[1];fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n')" "$TGZ"
npm install --prefix examples --no-audit --no-fund
npm test --prefix examples

echo "VERIFY OK"
```

## Reading the result

- Exit 0 with `VERIFY OK` on the last line → the tarball is clear to publish.
- Any other exit → do not publish. The `trap` has already restored the pin and dropped the throwaway install; diagnose with the table below, fix in `src/`, and rerun.

Either way, confirm the pin came back before moving on: `git diff --quiet examples/package.json` must exit 0. A dirty `examples/package.json` means the run was interrupted before the trap fired; restore it with `git checkout -- examples/package.json`.

## What each failure means

| Symptom                          | Cause                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `TS2834` in a `dist/**/*.d.ts`   | a relative import in `src/` is missing its `.js` extension                              |
| `TS2339` on an inherited method  | a base-class `.d.ts` import failed to resolve, collapsing the subclass to an error type |
| `Cannot find module` at run time | `package.json` `files` doesn't ship the referenced file, or an `exports` path is wrong  |

To read the shipped artifact directly, unpack the tarball: `tar -xzf "$TGZ" -C "$TARBALL_DIR"` exposes `package/dist/**/*.d.ts` and `package/package.json`.

## What the run exercises

`npm test` in `examples/` chains the runtime entrypoints (`test:commonjs`, `test:esm`, `test:cli`) and the type check (`typecheck`, whose `tsconfig.json` checks `test-types.ts` under the `require` condition and `test-types.mts` under the `import` condition, covering both branches of the dual-package `exports` map). Every one runs against the installed tarball, not the published pin.
