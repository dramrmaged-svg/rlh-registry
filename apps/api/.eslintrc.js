'use strict';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='$transaction']",
        message:
          "Direct .$transaction() calls are banned. " +
          "Use this.prisma.withinTransaction() instead. " +
          "See apps/api/docs/transaction-policy.md.",
      },
    ],
  },
  overrides: [
    {
      files: ['src/prisma/prisma.service.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
    {
      files: ['**/*.spec.ts', '**/*.integration.spec.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};