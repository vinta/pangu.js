import { defineConfig } from 'vite';

const external = [/^node:/];

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    target: 'es2022',
  },
  environments: {
    sharedEsm: {
      consumer: 'client',
      build: {
        emptyOutDir: true,
        lib: { entry: 'src/shared/index.ts', formats: ['es'], fileName: () => 'shared/index.js' },
      },
    },
    nodeEsm: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/node/index.ts', formats: ['es'], fileName: () => 'node/index.js' },
        rolldownOptions: { external },
      },
    },
    nodeCli: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: { entry: 'src/node/cli.ts', formats: ['es'], fileName: () => 'node/cli.js' },
        rolldownOptions: { external },
      },
    },
    // dist/browser/pangu.js must stay a self-contained single file so CDN users can load it as a standalone module without sibling chunks being hosted alongside (8.1.0-9.1.0 shipped an import-bearing pangu.js that would have 404ed on cdnjs)
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
    // Defining `builder` is what makes a plain `vite build` build every environment. They run in order, and sharedEsm has to go first because it is the only one that empties dist/
    buildApp: async (builder) => {
      for (const name of ['sharedEsm', 'nodeEsm', 'nodeCli', 'browserEsm', 'browserUmd', 'nodeCjs']) {
        await builder.build(builder.environments[name]!);
      }
    },
  },
});
