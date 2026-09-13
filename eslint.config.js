import baselineJs from 'eslint-plugin-baseline-js';
import { defineConfig } from 'eslint/config';
import { builtinModules } from 'node:module';
import tseslint from 'typescript-eslint';

const bareBuiltinModules = builtinModules.filter((name) => !name.startsWith('node:'));

const styleRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          regex: `^(?!node:)(${bareBuiltinModules.join('|')})(/.*)?$`,
          message: 'Use the `node:` protocol prefix for Node.js builtins.',
        },
      ],
    },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='forEach']",
      message: 'Use `for…of` instead of `.forEach(…)`.',
    },
  ],
};

const parserOptions = {
  projectService: { allowDefaultProject: ['eslint.config.js'] },
  tsconfigRootDir: import.meta.dirname,
};

export default defineConfig(
  {
    ignores: ['dist/', 'browser-extensions/chrome/dist/', 'scripts/prompt-experiments/', 'tmp/'],
  },
  {
    files: ['src/**/*.ts', 'browser-extensions/chrome/src/**/*.ts', 'tests/**/*.ts', 'vite.config.ts', 'playwright.config.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions,
    },
    rules: {
      ...styleRules,
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // Everything the Chrome extension ships, so a web API or JS builtin must exist in the extension's minimum Chrome version. The year mirrors minimum_chrome_version
    // in browser-extensions/chrome/manifest.json (Chrome 102 is 2022-05); bump them together
    files: ['src/shared/**/*.ts', 'src/browser/**/*.ts', 'browser-extensions/chrome/src/**/*.ts'],
    plugins: { 'baseline-js': baselineJs },
    rules: {
      'baseline-js/use-baseline': [
        'error',
        {
          available: 2022,
          includeWebApis: { preset: 'type-aware' },
          includeJsBuiltins: { preset: 'type-aware' },
          ignoreFeatures: [
            // Safari lacks requestIdleCallback; BrowserPangu.schedule() falls back to synchronous spacing after a typeof check
            'requestidlecallback',
            // Chrome-only APIs the extension uses on purpose: Prompt API (runtime-gated), Navigation API (Chrome 102), URLPattern (Chrome 95)
            'languagemodel',
            'navigation',
            'urlpattern',
          ],
        },
      ],
    },
  },
  {
    // This config: typed just enough for no-deprecated to see a deprecated API
    files: ['eslint.config.js'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions,
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      ...styleRules,
    },
  },
  // Override the above configs
  {
    rules: {
      curly: ['error', 'all'],
    },
  },
);
