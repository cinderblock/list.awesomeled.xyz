import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import yml from 'eslint-plugin-yml';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Rule.RuleModule} */
const noDoubledSpaces = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow multiple consecutive spaces in string values',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      YAMLScalar(node) {
        const value = node.value;
        if (typeof value !== 'string') return;

        // Only match double spaces after a non-space char (ignore leading spaces)
        const match = value.match(/(?<=\S)  +/);
        if (match) {
          const canAutoFix =
            node.style === 'plain' || node.style === 'double-quoted' || node.style === 'single-quoted';

          context.report({
            node,
            message: `Found ${match[0].length} consecutive spaces`,
            fix: canAutoFix
              ? (fixer) => {
                  const fixed = value.replace(/(?<=\S)  +/g, ' ');
                  let replacement;
                  if (node.style === 'double-quoted') {
                    replacement = `"${fixed}"`;
                  } else if (node.style === 'single-quoted') {
                    replacement = `'${fixed}'`;
                  } else {
                    replacement = fixed;
                  }
                  return fixer.replaceText(node, replacement);
                }
              : undefined,
          });
        }
      },
    };
  },
};

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
        },
      },
    },
    rules: {
      // Easier for diffs and reading
      'yml/block-sequence': ['error', 'always'],
      'custom/no-doubled-spaces': 'error',
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
