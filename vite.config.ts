import { defineConfig } from 'vite';

const external = [/^node:/];

// One environment per bundler pass. `consumer: 'client'` is load-bearing rather than cosmetic: an environment defaults to the server consumer, which ignores `build.lib.fileName` and names outputs after
// the entry instead
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    target: 'es2022',
  },
  environments: {
    // The shared and node ESM entries in one pass, so the shared code stays a single chunk that the node entries import. Rolldown emits it as a hashed root chunk (dist/shared-<hash>.js), and
    // dist/shared/index.js is a re-export facade over it
    esm: {
      consumer: 'client',
      build: {
        emptyOutDir: true,
        lib: {
          entry: {
            'shared/index': 'src/shared/index.ts',
            'node/index': 'src/node/index.ts',
            'node/cli': 'src/node/cli.ts',
          },
          formats: ['es'],
        },
        rolldownOptions: { external },
      },
    },
    // The ESM browser build gets its own pass so it inlines the shared engine instead of importing ../shared-<hash>.js: dist/browser/pangu.js must stay a self-contained single file so CDN users can load it as a standalone module without sibling chunks being hosted alongside (cdnjs hosted exactly that broken shape for 8.1.0-9.1.0)
    browserEsm: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/browser/pangu.ts', formats: ['es'], fileName: () => 'browser/pangu.js' },
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
    // Loaded by a plain <script> tag, and copied into the Chrome extension's vendors/ by build:extension. cdnjs pins this exact path too: its config (cdnjs/packages packages/p/pangu.json) mirrors it from the npm tarball and serves the generated browser/pangu.umd.min.js as pangu's default file, so renaming/moving pangu.umd.js breaks cdnjs
    browserUmd: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/browser/pangu.umd.ts', name: 'pangu', formats: ['umd'], fileName: () => 'browser/pangu.umd.js' },
      },
    },
  },
  builder: {
    // Defining `builder` is what makes a plain `vite build` build every environment. They run in order, and esm has to go first because it is the only one that empties dist/
    buildApp: async (builder) => {
      for (const name of ['esm', 'browserEsm', 'nodeCjs', 'browserUmd']) {
        await builder.build(builder.environments[name]!);
      }
    },
  },
});
