import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    extends: [eslint.configs.recommended, tseslint.configs.strict],
    plugins: {
      unicorn: eslintPluginUnicorn,
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
      'unicorn/no-array-for-each': 'error',
      'unicorn/prefer-node-protocol': 'error',
    },
  },
  {
    name: 'JavaScript files',
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    extends: [eslint.configs.recommended],
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-for-each': 'error',
    },
  },
  // Disable ESLint rules that conflict with Prettier
  eslintConfigPrettier,
  {
    name: 'Global rules overrides',
    rules: {
      curly: ['error', 'all'],
    },
  },
);
