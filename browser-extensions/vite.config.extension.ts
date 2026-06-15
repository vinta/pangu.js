import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, build } from 'vite';

const extensionRoot = fileURLToPath(new URL('.', import.meta.url));

// Custom plugin to handle multiple builds
const multiBuildPlugin = () => {
  return {
    name: 'multi-build',
    apply: 'build' as const,
    closeBundle: async () => {
      // Build content script as IIFE
      console.log('\nBuilding content script as IIFE...');
      await build({
        configFile: false,
        build: {
          outDir: resolve(extensionRoot, 'chrome/dist'),
          emptyOutDir: false,
          sourcemap: false,
          minify: false,
          target: 'chrome95',
          lib: {
            entry: resolve(extensionRoot, 'chrome/src/content-script.ts'),
            formats: ['iife'],
            name: 'PanguContentScript',
            fileName: () => 'content-script.js',
          },
          rolldownOptions: {
            output: {
              codeSplitting: false,
            },
          },
        },
        resolve: {
          extensions: ['.ts', '.json'],
        },
      });
    },
  };
};

export default defineConfig({
  build: {
    outDir: resolve(extensionRoot, 'chrome/dist'),
    emptyOutDir: true,
    rolldownOptions: {
      // Only specify entry points that Chrome loads directly
      // Vite will automatically handle shared dependencies:
      // - Modules used by multiple entries → assets folder with hashed names
      // - Modules used by single entry → inlined into that entry
      input: {
        popup: resolve(extensionRoot, 'chrome/src/popup.ts'),
        options: resolve(extensionRoot, 'chrome/src/options.ts'),
        'service-worker': resolve(extensionRoot, 'chrome/src/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'utils/[name].js',
        format: 'es',
        assetFileNames: '[name].[ext]',
      },
    },
    target: 'chrome95',
    minify: false,
    sourcemap: false,
  },
  resolve: {
    extensions: ['.ts'],
  },
  plugins: [multiBuildPlugin()],
});
