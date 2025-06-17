import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    // Global ignores
    ignores: ['node_modules/', 'browser_extensions/', 'dist/'],
  },
  {
    // TypeScript files
    files: ['src/**/*.ts'],
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
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
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
    },
  },
  // Apply prettier config last to disable formatting rules
  prettierConfig,
);
