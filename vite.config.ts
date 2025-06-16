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
                // Export the default directly as the global variable
                exports: 'default',
                // Ensure the UMD global name is 'pangu'
                name: 'pangu',
              },
              external: (id) => {
                return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
              },
            },
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
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist/types',
      insertTypesEntry: true,
      rollupTypes: false,
      copyDtsFiles: true,
      compilerOptions: {
        declaration: true,
        declarationMap: false,
        emitDeclarationOnly: true,
      },
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
});
