import { defineConfig, build } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

const projectRoot = process.cwd();

// Plugin to handle multiple builds
const multiBuildPlugin = () => {
  let buildCount = 0;

  return {
    name: 'multi-build',
    async closeBundle() {
      buildCount++;

      // After the first build (ES modules), run additional builds
      if (buildCount === 1) {
        // Build CommonJS for Node and shared modules
        console.log('\nBuilding CommonJS modules...');
        await build({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            sourcemap: true,
            minify: false,
            lib: {
              entry: {
                'shared/index': resolve(projectRoot, 'src/shared/index.ts'),
                'node/index': resolve(projectRoot, 'src/node/index.ts'),
                'node/cli': resolve(projectRoot, 'src/node/cli.ts'),
              },
              formats: ['cjs'],
            },
            rollupOptions: {
              output: {
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name]-[hash].cjs',
                exports: 'named',
              },
              external: (id) => {
                return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
              },
            },
          },
          esbuild: {
            target: 'es2022', // Node.js 18+ target
            format: 'cjs',
          },
          plugins: [],
          logLevel: 'error',
        });
        console.log('✓ CommonJS modules built');

        // Build UMD for browser
        console.log('\nBuilding browser UMD bundle...');
        await build({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            sourcemap: true,
            minify: false,
            lib: {
              entry: resolve(projectRoot, 'src/browser/pangu.umd.ts'),
              name: 'pangu',
              formats: ['umd'],
              fileName: () => 'browser/pangu.umd.js',
            },
            rollupOptions: {
              output: {
                // Ensure the UMD global name is 'pangu'
                name: 'pangu',
              },
              external: (id) => {
                return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
              },
            },
          },
          esbuild: {
            target: 'es2022', // Modern browsers (2022+)
          },
          plugins: [],
          logLevel: 'error',
        });
        console.log('✓ Browser UMD bundle built');
      }
    },
  };
};

export default defineConfig({
  plugins: [
    // Generate types using project references
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
      rollupTypes: false,
      copyDtsFiles: true,
      // Use the root tsconfig which has project references
      tsconfigPath: resolve(projectRoot, 'tsconfig.json'),
    }),
    multiBuildPlugin(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: {
        'shared/index': resolve(projectRoot, 'src/shared/index.ts'),
        'node/index': resolve(projectRoot, 'src/node/index.ts'),
        'node/cli': resolve(projectRoot, 'src/node/cli.ts'),
        'browser/pangu': resolve(projectRoot, 'src/browser/pangu.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      },
      external: (id) => {
        return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
      },
    },
  },
  esbuild: {
    target: 'es2022', // Default target matching our TypeScript config
  },
});
