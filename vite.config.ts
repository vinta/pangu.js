import { defineConfig } from 'vite';

// src/node/index.cts requires `../shared/index.cjs`, which the sharedCjs environment emits, so that specifier has to survive bundling verbatim. `makeAbsoluteExternalsRelative: false` is what keeps it
// that way: the default resolves a relative external against the importer and then rewrites it against the output file, which turns it into `../../shared/index.cjs`
const external = [/^node:/, '../shared/index.cjs'];

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
    // The CJS half of the package. node/index.cjs is built from its own .cts source because `export =` cannot be expressed in the ESM entry, and it requires shared/index.cjs at runtime
    sharedCjs: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/shared/index.ts', formats: ['cjs'], fileName: () => 'shared/index.cjs' },
        rolldownOptions: { external },
      },
    },
    nodeCjs: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/node/index.cts', formats: ['cjs'], fileName: () => 'node/index.cjs' },
        rolldownOptions: { external, makeAbsoluteExternalsRelative: false },
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
      for (const name of ['esm', 'sharedCjs', 'nodeCjs', 'browserUmd']) {
        await builder.build(builder.environments[name]!);
      }
    },
  },
});
