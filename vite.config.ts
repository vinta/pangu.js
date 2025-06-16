/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  // Browser builds (ES + UMD)
  if (mode === 'browser') {
    return {
      build: {
        target: 'es2015',
        sourcemap: true,
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/browser/pangu.ts'),
          formats: ['es', 'umd'],
          name: 'pangu',
          fileName: (format) => {
            if (format === 'es') return 'browser/pangu.js';
            if (format === 'umd') return 'browser/pangu.umd.js';
          },
        },
        rollupOptions: {
          external: [], // No externals for browser
          output: {
            exports: 'named',
          },
        },
      },
      plugins: [
        dts({
          include: ['src/browser/**/*.ts'],
          outDir: 'dist/types',
          rollupTypes: true,
        }),
      ],
    };
  }

  // Default build: ES modules and CommonJS for Node and shared
  return {
    build: {
      target: 'es2015',
      sourcemap: true,
      lib: {
        entry: {
          'node/index': resolve(__dirname, 'src/node/index.ts'),
          'shared/index': resolve(__dirname, 'src/shared/index.ts'),
          'node/cli': resolve(__dirname, 'src/node/cli.ts'),
        },
        formats: ['es', 'cjs'],
        fileName: (format, entryName) => format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
      },
      rollupOptions: {
        external: ['fs', 'path'],
        output: {
          exports: 'named',
        },
      },
    },
    plugins: [
      dts({
        include: ['src/**/*.ts'],
        outDir: 'dist/types',
        rollupTypes: true,
        copyDtsFiles: true,
      }),
    ],
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.{js,ts}'],
      exclude: ['tests/browser/**/*.playwright.ts'],
    },
  };
});