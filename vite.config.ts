import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, build } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = __dirname;

const externalNodeSharedCjsPlugin = () => {
  return {
    name: 'external-node-shared-cjs',
    resolveId: (source: string) => {
      if (source === '../shared/index.cjs') {
        return {
          id: source,
          external: true,
        };
      }

      return null;
    },
  };
};

// Custom plugin to handle multiple builds
const multiBuildPlugin = () => {
  return {
    name: 'multi-build',
    apply: 'build' as const,
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
          target: 'es2022',
          lib: {
            entry: resolve(projectRoot, 'src/shared/index.ts'),
            formats: ['cjs'],
            fileName: () => 'shared/index.cjs',
          },
          rolldownOptions: {
            output: {
              exports: 'named',
            },
          },
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
          target: 'es2022',
          lib: {
            entry: resolve(projectRoot, 'src/node/index.cjs.ts'),
            formats: ['cjs'],
            fileName: () => 'node/index.cjs',
          },
          rolldownOptions: {
            plugins: [externalNodeSharedCjsPlugin()],
            external: (id) => {
              return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
            },
          },
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
          target: 'es2022',
          lib: {
            entry: resolve(projectRoot, 'dist/node/cli.js'),
            formats: ['cjs'],
            fileName: () => 'node/cli.cjs',
          },
          rolldownOptions: {
            output: {
              exports: 'named',
            },
            external: (id) => {
              return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
            },
          },
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
          target: 'es2022',
          lib: {
            entry: resolve(projectRoot, 'src/browser/pangu.umd.ts'),
            name: 'pangu',
            formats: ['umd'],
            fileName: () => 'browser/pangu.umd.js',
          },
          rolldownOptions: {
            output: {
              name: 'pangu',
            },
            external: (id) => {
              return id.startsWith('node:');
            },
          },
        },
      });
    },
  };
};

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    minify: false,
    target: 'es2022',
    lib: {
      entry: {
        'shared/index': resolve(projectRoot, 'src/shared/index.ts'),
        'node/index': resolve(projectRoot, 'src/node/index.ts'),
        'node/cli': resolve(projectRoot, 'src/node/cli.ts'),
        'browser/pangu': resolve(projectRoot, 'src/browser/pangu.ts'),
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: (id) => {
        return id.startsWith('node:') || ['fs', 'path', 'process'].includes(id);
      },
      output: {
        preserveModules: false,
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [
    multiBuildPlugin(),
  ],
});
