/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

const external = [/^node:/];

export default defineConfig({
  test: {
    silent: 'passed-only',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    target: 'baseline-widely-available', // Support line for the npm and CDN builds. The extension has its own floor in browser-extensions/, matched to its manifest
  },
  environments: {
    // dist/shared, the Node.js ESM files and dist/browser/index.js share one copy of the engine (ADR 0030, ADR 0031)
    esm: {
      consumer: 'client',
      build: {
        emptyOutDir: true,
        lib: {
          entry: ['src/shared/index.ts', 'src/node/index.ts', 'src/node/cli.ts', 'src/browser/index.ts'],
          formats: ['es'],
        },
        rolldownOptions: {
          external,
          output: {
            preserveModules: true, // emits one file per source module, without hashed chunks
            preserveModulesRoot: 'src',
          },
        },
      },
    },
    // dist/node/index.cjs is a self-contained single file because require() cannot load the ESM shared/index.js on Node.js before 20.19 or in Jest (ADR 0012)
    nodeCjs: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: {
          entry: 'src/node/index.cts',
          formats: ['cjs'],
          fileName: () => 'node/index.cjs',
        },
        rolldownOptions: { external },
      },
    },
    // dist/browser/pangu.js is a self-contained single file so it works as a standalone module when downloaded or loaded from a CDN
    browserEsm: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: {
          // NOTE: cdnjs only mirrors the paths listed in its config, so a new sibling chunk would need a PR there
          // See https://github.com/cdnjs/packages/blob/master/packages/p/pangu.json
          entry: 'src/browser/pangu.ts',
          formats: ['es'],
          fileName: () => 'browser/pangu.js',
        },
      },
    },
    // dist/browser/pangu.umd.js is a self-contained single file because a plain <script> tag cannot import sibling files
    browserUmd: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: {
          // NOTE: cdnjs serves the generated browser/pangu.umd.min.js as pangu's default file, so renaming or moving pangu.umd.js breaks cdnjs
          // See https://github.com/cdnjs/packages/blob/master/packages/p/pangu.json
          entry: 'src/browser/pangu.umd.ts',
          name: 'pangu',
          formats: ['umd'],
          fileName: () => 'browser/pangu.umd.js',
        },
      },
    },
  },
  builder: {
    buildApp: async (builder) => {
      // Defining `builder` is what makes a plain `vite build` build every environment
      // They run in order, and esm has to go first because it is the only one that empties dist/
      for (const name of ['esm', 'nodeCjs', 'browserEsm', 'browserUmd']) {
        await builder.build(builder.environments[name]!);
      }
    },
  },
});
