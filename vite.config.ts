/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

const external = [/^node:/];

export default defineConfig({
  test: {
    // Console output from extension code stays in the web-page console; in a test run it is only worth reading when the test fails
    silent: 'passed-only',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    // Support line for the npm and CDN builds. The extension has its own floor in browser-extensions/, matched to its manifest
    target: 'baseline-widely-available',
  },
  environments: {
    // One copy of the engine for shared/index.js and the Node.js ESM outputs (ADR 0030). Without preserveModules Rolldown hoists the engine into a hashed chunk and the public shared/index.js becomes a facade
    sharedNodeEsm: {
      consumer: 'client',
      build: {
        emptyOutDir: true,
        lib: {
          entry: { 'shared/index': 'src/shared/index.ts', 'node/index': 'src/node/index.ts', 'node/cli': 'src/node/cli.ts' },
          formats: ['es'],
        },
        rolldownOptions: { external, output: { preserveModules: true, preserveModulesRoot: 'src' } },
      },
    },
    // dist/browser/pangu.js stays a self-contained single file so it works as a standalone module when downloaded or loaded from a CDN. cdnjs only mirrors the paths listed in its config (cdnjs/packages packages/p/pangu.json), so a new sibling chunk would need a PR there
    browserEsm: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/browser/pangu.ts', formats: ['es'], fileName: () => 'browser/pangu.js' },
      },
    },
    // Loaded by a plain <script> tag. cdnjs pins this exact path: its config (cdnjs/packages packages/p/pangu.json) mirrors it from the npm tarball and serves the generated browser/pangu.umd.min.js as pangu's default file, so renaming/moving pangu.umd.js breaks cdnjs
    browserUmd: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/browser/pangu.umd.ts', name: 'pangu', formats: ['umd'], fileName: () => 'browser/pangu.umd.js' },
      },
    },
    // The CJS half of the package, built from its own .cts source because `export =` cannot be expressed in the ESM entry. Self-contained: it inlines the shared engine rather than reaching for another
    // environment's output, so nothing here depends on build order
    nodeCjs: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/node/index.cts', formats: ['cjs'], fileName: () => 'node/index.cjs' },
        rolldownOptions: { external },
      },
    },
  },
  builder: {
    // Defining `builder` is what makes a plain `vite build` build every environment. They run in order, and sharedNodeEsm has to go first because it is the only one that empties dist/
    buildApp: async (builder) => {
      for (const name of ['sharedNodeEsm', 'browserEsm', 'browserUmd', 'nodeCjs']) {
        await builder.build(builder.environments[name]!);
      }
    },
  },
});
