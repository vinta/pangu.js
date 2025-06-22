import { resolve } from 'node:path';
import { defineConfig } from 'vite';

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
        'content-script': resolve(__dirname, 'chrome/src/content-script.ts'),
      },
      output: {
        entryFileNames: '[name].js',
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
});
