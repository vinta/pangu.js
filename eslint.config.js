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

export default tseslint.config(
  {
    // Global ignores
    ignores: ['node_modules/', 'dist/', 'browser-extensions/chrome/dist/', 'browser-extensions/chrome/vendors/'],
  },
  {
    // TypeScript files
    files: ['src/**/*.ts', 'browser-extensions/chrome/src/**/*.ts', 'tests/**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      ...styleRules,
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
