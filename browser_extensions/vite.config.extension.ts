import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'chrome/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'chrome/src/popup.ts'),
        options: resolve(__dirname, 'chrome/src/options.ts'),
        'service-worker': resolve(__dirname, 'chrome/src/service-worker.ts'),
        'content-script': resolve(__dirname, 'chrome/src/content-script.ts'),
        i18n: resolve(__dirname, 'chrome/src/i18n.ts'),
        utils: resolve(__dirname, 'chrome/src/utils.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
        inlineDynamicImports: false,
        assetFileNames: '[name].[ext]',
      },
    },
    target: 'chrome91',
    minify: false,
    sourcemap: false,
  },
  resolve: {
    extensions: ['.ts'],
  },
});
