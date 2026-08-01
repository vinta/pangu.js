import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const extensionRoot = import.meta.dirname;

// One environment per bundler pass. `consumer: 'client'` is load-bearing rather than cosmetic: an environment defaults to the server consumer, which ignores `build.lib.fileName` and names outputs after
// the entry instead
export default defineConfig({
  build: {
    outDir: resolve(extensionRoot, 'chrome/dist'),
    target: 'chrome99',
    minify: false,
    sourcemap: false,
  },
  environments: {
    // Only the entry points Chrome loads directly. Vite handles shared dependencies on its own: modules used by more than one entry become a chunk under utils/, modules used by a single entry are
    // inlined into it
    modules: {
      consumer: 'client',
      build: {
        emptyOutDir: true,
        rolldownOptions: {
          input: {
            'popup': resolve(extensionRoot, 'chrome/src/popup.ts'),
            'options': resolve(extensionRoot, 'chrome/src/options.ts'),
            'service-worker': resolve(extensionRoot, 'chrome/src/service-worker.ts'),
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: 'utils/[name].js',
            format: 'es',
          },
        },
      },
    },
    // Content scripts are classic scripts rather than modules, so this one is bundled as a self-contained IIFE
    contentScript: {
      consumer: 'client',
      build: {
        emptyOutDir: false,
        lib: {
          entry: resolve(extensionRoot, 'chrome/src/content-script.ts'),
          name: 'PanguContentScript',
          formats: ['iife'],
          fileName: () => 'content-script.js',
        },
      },
    },
  },
  builder: {
    // Defining `builder` is what makes a plain `vite build` build every environment. modules has to go first because it is the one that empties chrome/dist/
    buildApp: async (builder) => {
      await builder.build(builder.environments.modules!);
      await builder.build(builder.environments.contentScript!);
    },
  },
});
