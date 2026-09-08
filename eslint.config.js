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

// One project service serves every block, and typescript-eslint reads its options from the first block that runs, so the blocks must share them. eslint.config.js is outside tsconfig.json, so the service types it in a default project instead
const parserOptions = {
  projectService: { allowDefaultProject: ['eslint.config.js'] },
  tsconfigRootDir: import.meta.dirname,
};

export default defineConfig(
  {
    // Global ignores
    ignores: ['dist/', 'browser-extensions/chrome/dist/', '.worktrees/'],
  },
  {
    // TypeScript files and the root configs, so type-aware rules such as no-deprecated cover them too
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
    // JavaScript files
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
