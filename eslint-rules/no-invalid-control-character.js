/**
 * ESLint rule that checks for invalid control characters in YAML string values.
 * Uses @textlint-rule/textlint-rule-no-invalid-control-character's character list.
 * @type {import('eslint').Rule.RuleModule}
 */

import { INVALID_CONTROL_CHARACTERS } from '@textlint-rule/textlint-rule-no-invalid-control-character/lib/CONTROL_CHARACTERS.js';

export const noInvalidControlCharacter = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow invalid control characters in string values',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    // Build a regex that matches any invalid control character
    const pattern = new RegExp(
      `[${INVALID_CONTROL_CHARACTERS.map((c) => c.code).join('')}]`,
      'g'
    );

    // Map code points to names for error messages
    const codeToName = new Map(
      INVALID_CONTROL_CHARACTERS.map((c) => [c.code, c.name])
    );

    return {
      YAMLScalar(node) {
        const value = node.value;
        if (typeof value !== 'string') return;

        let match;
        while ((match = pattern.exec(value))) {
          const char = match[0];
          const name = codeToName.get(char) || 'UNKNOWN';
          const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

          const canAutoFix =
            node.style === 'plain' ||
            node.style === 'double-quoted' ||
            node.style === 'single-quoted';

          context.report({
            node,
            message: `Invalid control character: U+${codePoint} (${name})`,
            fix: canAutoFix
              ? (fixer) => {
                  // Remove the control character
                  const fixedValue = value.replace(pattern, '');
                  let newText;
                  if (node.style === 'double-quoted') {
                    newText = `"${fixedValue}"`;
                  } else if (node.style === 'single-quoted') {
                    newText = `'${fixedValue}'`;
                  } else {
                    newText = fixedValue;
                  }
                  return fixer.replaceText(node, newText);
                }
              : undefined,
          });
        }

        // Reset regex lastIndex for next node
        pattern.lastIndex = 0;
      },
    };
  },
};
