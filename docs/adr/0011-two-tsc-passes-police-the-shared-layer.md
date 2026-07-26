# 0011. The two declaration passes overlap on purpose

Date: 2026-07-27

## Status

Accepted. Documents existing behavior rather than changing it.

## Context

`build:types` runs `tsc --emitDeclarationOnly` twice, once per platform tsconfig:

```
tsc -p src/browser/tsconfig.json --emitDeclarationOnly --declarationDir dist
tsc -p src/node/tsconfig.json    --emitDeclarationOnly --declarationDir dist
```

Both tsconfigs include `../shared/**/*.ts`, so both emit `dist/shared/index.d.ts` into the same location. The node pass runs second and wins.

Read quickly this looks like waste: duplicated work, a last-writer-wins collision, and an ordering dependency nobody wrote down. The obvious tidy-up is to give `shared/` a single owner, either by excluding it from one pass or by promoting it to a composite project with references.

That tidy-up would silently delete a guard.

The overlap is not redundant, because the two passes do not compile `shared/` under the same assumptions:

- `src/browser/tsconfig.json` sets `"types": []` and `lib: ["ES2022", "DOM", "DOM.Iterable"]`. Under it, `shared/` sees no Node typings at all.
- `src/node/tsconfig.json` sets `"types": ["node"]` and `lib: ["ES2022"]`. Under it, `shared/` sees no DOM.

So the passes mutually police the invariant that the shared layer is platform-free. If anything in `src/shared/` reached for a Node global, the browser pass would fail to compile. If it reached for `document`, the node pass would fail. Neither failure needs a test to exist, and neither can be reached by only running one pass.

That also explains why the collision is harmless in practice. The two passes can only emit a differing `dist/shared/index.d.ts` if `shared/` uses something that exists in both configurations but types differently, which is close to unreachable. Verified by emitting each pass to a separate directory and diffing: the two `shared/index.d.ts` outputs are byte-identical.

Note that `exclude` would not achieve the tidy-up anyway. TypeScript pulls imported files into the program regardless of `exclude`, so the only real way to give `shared/` a single owner is project references, which is materially more machinery than the problem deserves.

## Decision

Keep both passes, keep the overlap, and treat the redundant emit as the cost of the cross-check rather than as a defect.

Neither pass may be narrowed to stop covering `src/shared/`, and `"types": []` on the browser side is load-bearing rather than tidiness.

## Consequences

**`dist/shared/index.d.ts` is written twice per build.** The node pass wins. This is accepted and is the reason the two passes must not be reordered into something that changes which one lands last without re-verifying they still agree.

**The guard is invisible in the code.** Nothing named `guard` or `check` exists. If someone deletes a pass or adds `"types": ["node"]` to the browser config, everything keeps building and the invariant quietly stops being enforced. This ADR is the only thing standing between that and a future cleanup.

**No dedicated test covers this.** The enforcement is the compile itself, which is why `typecheck` runs all three tsconfigs rather than just the root one.
