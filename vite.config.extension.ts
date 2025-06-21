import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'browser_extensions/chrome/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'browser_extensions/chrome/src/popup.ts'),
        options: resolve(__dirname, 'browser_extensions/chrome/src/options.ts'),
        background: resolve(__dirname, 'browser_extensions/chrome/src/background.js'),
        content_script: resolve(__dirname, 'browser_extensions/chrome/src/content_script.js'),
        i18n: resolve(__dirname, 'browser_extensions/chrome/src/i18n.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
        inlineDynamicImports: false,
        assetFileNames: '[name].[ext]'
      }
    },
    target: 'chrome91',
    minify: false,
    sourcemap: false
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
});