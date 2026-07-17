# Vitest suites import built artifacts from dist/, not src/

Unit tests exist to verify what users actually install, so every vitest file for a shipped surface (shared, node) imports from `dist/`, and the browser bundle is exercised through Playwright loading `dist/browser/pangu.umd.js`. This also makes every test run an implicit build verification, which has caught real packaging regressions (see `3d67d8a`, `8dee05b`). The cost is accepted: test runs are gated behind a full build, and watch-mode on source is not possible.

## Consequences

- Do not "fix" test imports to point at `src/` for speed. The slow loop is a deliberate trade.
- Bundle-internal modules that users cannot import from `dist/` (internal seams, e.g. the boundary spacing module) are the exception: their vitest files import from `src/` directly rather than exporting internals just to make them reachable from the bundle.
