import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFile } from 'node:fs/promises';
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
            entry: resolve(projectRoot, 'dist/shared/index.js'),
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
      
      // Build node/index.cjs first as a regular build
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          sourcemap: true,
          minify: false,
          lib: {
            entry: resolve(projectRoot, 'dist/node/index.js'),
            formats: ['cjs'],
            fileName: () => 'node/index.cjs.tmp',
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
      
      // Post-process the CommonJS build to make it export pangu as default
      const { readFile, writeFile } = await import('node:fs/promises');
      const cjsContent = await readFile(resolve(projectRoot, 'dist/node/index.cjs.tmp'), 'utf8');
      
      // Create a wrapper that exports pangu as the main export
      const wrapperContent = `${cjsContent}

// Make pangu the main export
const _pangu = exports.pangu || exports.default;
module.exports = _pangu;

// Add named exports as properties
module.exports.pangu = _pangu;
module.exports.NodePangu = exports.NodePangu;
module.exports.default = _pangu;
`;
      
      await writeFile(resolve(projectRoot, 'dist/node/index.cjs'), wrapperContent);
      
      // Clean up temp file
      await import('node:fs').then(fs => fs.promises.unlink(resolve(projectRoot, 'dist/node/index.cjs.tmp')));
      
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
