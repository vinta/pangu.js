import globals from "globals";

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
// import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    name: 'Global ignores',
    ignores: [
      '.claude/',
      'browser-extensions/chrome/dist/',
      'browser-extensions/chrome/vendors/',
      'dist/',
      'node_modules/',
    ],
  },
  {
    name: 'TypeScript files',
    files: [
      '**/*.ts',
    ],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strict,
    ],
    languageOptions: {
      globals: {
          ...globals.node,
          ...globals.commonjs,
          ...globals.amd,
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'JavaScript files',
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
    extends: [
      eslint.configs.recommended,
    ],
    languageOptions: {
      globals: {
          ...globals.node,
      },
    },
    // rules: {
    //   'unicorn/prefer-module': 'off',
    // }
  },
  {
    name: 'Global rules overrides',
    rules: {
      curly: ['error', 'all'],
      // 'unicorn/no-array-for-each': 'error',
      // 'unicorn/prefer-global-this': 'off',
      // 'unicorn/prefer-node-protocol': 'error',
      // 'unicorn/prevent-abbreviations': 'off',
    },
  },
);
