import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, build } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = __dirname;

// Custom plugin to handle multiple builds
const multiBuildPlugin = () => {
  return {
    name: 'multi-build',
    closeBundle: async () => {
      // Build CommonJS for shared module first
      console.log('\nBuilding CommonJS shared module...');
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          sourcemap: true,
          minify: false,
          lib: {
            entry: resolve(projectRoot, 'src/shared/index.ts'),
            formats: ['cjs'],
            fileName: () => 'shared/index.cjs',
          },
          rollupOptions: {
            output: {
              exports: 'named',
              interop: 'auto',
            },
          },
        },
        esbuild: {
          target: 'es2022',
          format: 'cjs',
          charset: 'ascii',
        },
      });

      // Build CommonJS for Node
      console.log('\nBuilding CommonJS modules...');

      // Build node/index.cjs from the CommonJS source
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          sourcemap: true,
          minify: false,
          lib: {
            entry: resolve(projectRoot, 'src/node/index.cjs.ts'),
            formats: ['cjs'],
            fileName: () => 'node/index.cjs',
          },
          rollupOptions: {
            output: {
              interop: 'auto',
            },
            external: (id) => {
              return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
            },
          },
        },
        esbuild: {
          target: 'es2022',
          format: 'cjs',
          charset: 'ascii',
        },
      });

      // Build node/cli.cjs
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          sourcemap: true,
          minify: false,
          lib: {
            entry: resolve(projectRoot, 'dist/node/cli.js'),
            formats: ['cjs'],
            fileName: () => 'node/cli.cjs',
          },
          rollupOptions: {
            output: {
              exports: 'named',
              interop: 'auto',
            },
            external: (id) => {
              return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
            },
          },
        },
        esbuild: {
          target: 'es2022',
          format: 'cjs',
          charset: 'ascii',
        },
      });

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
              return id.startsWith('node:');
            },
          },
        },
        esbuild: {
          target: 'es2022',
          charset: 'ascii',
        },
      });
    },
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
        'node/index': resolve(projectRoot, 'src/node/index.ts'),
        'node/cli': resolve(projectRoot, 'src/node/cli.ts'),
        'browser/pangu': resolve(projectRoot, 'src/browser/index.ts'),
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
    charset: 'ascii',
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
    multiBuildPlugin(),
  ],
});
