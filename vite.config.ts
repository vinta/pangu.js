import { defineConfig, build } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = __dirname;

// Custom plugin to handle multiple builds
const multiBuildPlugin = () => {
  return {
    name: 'multi-build',
    closeBundle: async () => {
      // Build CommonJS for Node
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
              'node/index': resolve(projectRoot, 'dist/node/index.js'),
              'node/cli': resolve(projectRoot, 'dist/node/cli.js'),
            },
            formats: ['cjs'],
          },
          rollupOptions: {
            output: {
              entryFileNames: '[name].cjs',
              chunkFileNames: 'shared/[name].cjs',
              exports: 'named',
            },
            external: (id) => {
              return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
            },
          },
        },
        esbuild: {
          target: 'es2022',
          format: 'cjs',
        },
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
              name: 'pangu',
            },
            external: (id) => {
              return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
            },
          },
        },
        esbuild: {
          target: 'es2022',
        },
      });
      console.log('✓ Browser UMD bundle built');
    }
  };
};

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: {
        'shared/index': resolve(projectRoot, 'src/shared/index.ts'),
        'browser/pangu': resolve(projectRoot, 'src/browser/pangu.ts'),
        'node/index': resolve(projectRoot, 'src/node/index.ts'),
        'node/cli': resolve(projectRoot, 'src/node/cli.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
      },
      output: {
        preserveModules: false,
        entryFileNames: '[name].js',
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: false,
      insertTypesEntry: false,
      compilerOptions: {
        declaration: true,
        declarationMap: false,
      },
    }),
    multiBuildPlugin()
  ],
});