import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import stylistic from '@stylistic/eslint-plugin'; // Correct package name for @stylistic


export default [
  {
    name: 'base',
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin, // 👈 this must match the rule prefix
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      import: importPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      // JS/Stylistic rules
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      'jsx-quotes': ['error', 'prefer-double'],
      'object-curly-newline': 'off',
      'no-confusing-arrow': 'off',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'operator-linebreak': ['error', 'after', {
        overrides: { '?': 'before', ':': 'before', '-': 'before' },
      }],
      'keyword-spacing': ['error', { before: true }],
      indent: ['error', 2, { SwitchCase: 1 }],

      // TypeScript rules
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: { attributes: false },
      }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // React rules
      'react/display-name': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-closing-bracket-location': [2, 'tag-aligned'],
      'react/jsx-max-props-per-line': [2, { when: 'multiline' }],
      'react/jsx-first-prop-new-line': [2, 'multiline'],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/button-has-type': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import rules
      'import/no-cycle': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/prefer-default-export': 'off',
      'import/order': ['error', {
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@/**',
            group: 'external',
            position: 'after',
          },
        ],
        groups: [['builtin', 'external'], ['internal', 'index', 'parent', 'sibling']],
      }],
    },
  },
];
