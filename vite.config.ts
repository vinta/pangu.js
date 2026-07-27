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
    // All four ESM entries in one pass, so shared/index.js stays a single chunk that node/index.js and browser/pangu.js both import
    esm: {
      consumer: 'client',
      build: {
        emptyOutDir: true,
        lib: {
          entry: {
            'shared/index': 'src/shared/index.ts',
            'node/index': 'src/node/index.ts',
            'node/cli': 'src/node/cli.ts',
            'browser/pangu': 'src/browser/pangu.ts',
          },
          formats: ['es'],
        },
        rolldownOptions: { external },
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
    // Loaded by a plain <script> tag, and copied into the Chrome extension's vendors/ by build:extension
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
      for (const name of ['esm', 'nodeCjs', 'browserUmd']) {
        await builder.build(builder.environments[name]!);
      }
    },
  },
});
