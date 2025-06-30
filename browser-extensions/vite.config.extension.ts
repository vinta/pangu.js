import { resolve } from 'node:path';
import { defineConfig, build } from 'vite';

// Custom plugin to handle multiple builds
const multiBuildPlugin = () => {
  return {
    name: 'multi-build',
    closeBundle: async () => {
      // Build content script as IIFE
      console.log('\nBuilding content script as IIFE...');
      await build({
        configFile: false,
        build: {
          outDir: resolve(__dirname, 'chrome/dist'),
          emptyOutDir: false,
          sourcemap: false,
          minify: false,
          lib: {
            entry: resolve(__dirname, 'chrome/src/content-script.ts'),
            formats: ['iife'],
            name: 'PanguContentScript',
            fileName: () => 'content-script.js',
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
        resolve: {
          extensions: ['.ts', '.json'],
        },
        esbuild: {
          target: 'chrome95',
          charset: 'ascii',
        },
      });
    },
  };
};

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'chrome/dist'),
    emptyOutDir: true,
    rollupOptions: {
      // Only specify entry points that Chrome loads directly
      // Vite will automatically handle shared dependencies:
      // - Modules used by multiple entries → assets folder with hashed names
      // - Modules used by single entry → inlined into that entry
      input: {
        popup: resolve(__dirname, 'chrome/src/popup.ts'),
        options: resolve(__dirname, 'chrome/src/options.ts'),
        'service-worker': resolve(__dirname, 'chrome/src/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'utils/[name].js',
        format: 'es',
        inlineDynamicImports: false,
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
