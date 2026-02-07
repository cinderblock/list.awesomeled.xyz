import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import yml from 'eslint-plugin-yml';
import tseslint from 'typescript-eslint';

import { noDoubledSpaces } from './eslint-rules/no-doubled-spaces.js';
import { noInvalidControlCharacter } from './eslint-rules/no-invalid-control-character.js';
import { terminology } from './eslint-rules/terminology.js';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...yml.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['node_modules/', 'build/', '.react-router/', 'playwright-report/', 'test-results/'],
  },
  // YAML style rules
  {
    files: ['**/*.yaml', '**/*.yml'],
    plugins: {
      custom: {
        rules: {
          'no-doubled-spaces': noDoubledSpaces,
          'no-invalid-control-character': noInvalidControlCharacter,
          'terminology': terminology,
        },
      },
    },
    rules: {
      // Easier for diffs and reading
      'yml/block-sequence': ['error', 'always'],
      'custom/no-doubled-spaces': 'error',
      'custom/no-invalid-control-character': 'error',
      'custom/terminology': ['error', {
        skipValueKeys: ['run', 'script', 'command', 'cmd', 'shell', 'exec', 'working-directory', 'dictionaries'],
      }],
    },
  },
  // Database YAML files: name must be first
  {
    files: ['database/**/*.yaml'],
    rules: {
      'yml/sort-keys': [
        'error',
        {
          pathPattern: '^$', // Root level only
          order: [
            'name',
            'status',
            'creator',
            'developer',
            'manufacturers',
            'notes',
            { keyPattern: '.*' }, // All other keys alphabetically
          ],
        },
      ],
    },
  },
  {
    files: ['.github/**/*.yml'],
    rules: {
      // Github uses empty mapping values extensively
      'yml/no-empty-mapping-value': 'off',
    },
  }
);
