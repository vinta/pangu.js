import { defineConfig } from 'eslint/config';
import { builtinModules } from 'node:module';
import tseslint from 'typescript-eslint';

// Derived from the running Node rather than hand-listed so a newly added builtin cannot slip through unprefixed. Names that are already namespaced (`node:test`, `node:sea`) are unreachable without the prefix, so they need no rule.
const bareBuiltinModules = builtinModules.filter((name) => !name.startsWith('node:'));

// Core-rule equivalents of eslint-plugin-unicorn's `prefer-node-protocol` and `no-for-each`. The plugin cost 36 transitive packages to supply just these two checks, so it was dropped in favour of the built-ins.
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

export default defineConfig(
  {
    // Global ignores
    ignores: ['dist/', 'browser-extensions/chrome/dist/', '.worktrees/'],
  },
  {
    // TypeScript files and the root configs, so type-aware rules such as no-deprecated cover them too
    files: ['src/**/*.ts', 'browser-extensions/chrome/src/**/*.ts', 'tests/**/*.ts', 'eslint.config.js', 'vite.config.ts', 'playwright.config.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // eslint.config.js is outside tsconfig.json, so the project service types it in a default project instead
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...styleRules,
      '@typescript-eslint/no-deprecated': 'error',
      // Async listeners are fine for chrome and DOM events (the return value is ignored); the check only forces wrapper boilerplate
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
      // Mostly flags test stubs (async () => ({...})) that need the async signature but nothing to await
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // From strictTypeChecked: a check the types already decide is either dead or hides a lying cast
      '@typescript-eslint/no-unnecessary-condition': 'error',
      // Hand-picked from stylisticTypeChecked: each one shortens code, the rest of that preset is churn
      '@typescript-eslint/consistent-generic-constructors': 'error',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
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
