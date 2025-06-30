import prettierConfig from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Global ignores
    ignores: ['node_modules/', 'dist/', 'browser_extensions/chrome/dist/', 'browser_extensions/chrome/vendors/'],
  },
  {
    // TypeScript files
    files: ['src/**/*.ts', 'browser_extensions/chrome/src/**/*.ts', 'tests/**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-for-each': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
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
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-for-each': 'error',
    },
  },
  // Apply prettier config last to disable formatting rules
  prettierConfig,
  // Override the above configs
  {
    rules: {
      curly: ['error', 'all'],
    },
  },
);
