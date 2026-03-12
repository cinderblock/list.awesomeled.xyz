/**
 * ESLint rule that checks terminology in YAML string values.
 * Uses textlint-rule-terminology's terms and helper functions for consistency.
 * @type {import('eslint').Rule.RuleModule}
 */

import {
  getTerms,
  getAdvancedRegExp,
  getMultipleWordRegExp,
  getReplacement,
} from 'textlint-rule-terminology';

// Load default terms from textlint-rule-terminology
const defaultTerms = getTerms(true, [], []);

const sentenceStartRegExp = /\w+[!.?]\)? $/;

// Default keys whose values contain code, not prose
const defaultSkipValueKeys = [
  'run',
  'script',
  'command',
  'cmd',
  'shell',
  'exec',
  'working-directory',
];

function upperFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const terminology = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent terminology in string values',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          terms: { type: 'array' },
          exclude: { type: 'array' },
          skipKeys: { type: 'boolean' },
          skipValueKeys: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const extraTerms = options.terms || [];
    const exclude = options.exclude || [];
    const skipKeys = options.skipKeys !== false; // Default true
    const skipValueKeys = options.skipValueKeys || defaultSkipValueKeys;

    // Build terms list (extras first, then defaults)
    let terms = [...extraTerms, ...defaultTerms];

    // Filter excluded terms
    if (exclude.length > 0) {
      terms = terms.filter((term) => {
        if (Array.isArray(term)) {
          return !exclude.includes(term[0]);
        }
        return !exclude.includes(term);
      });
    }

    // Separate simple words from advanced patterns
    const words = terms.filter((rule) => typeof rule === 'string');
    const advancedRules = terms.filter((rule) => typeof rule !== 'string');

    // Build rules array
    const rules = [];
    if (words.length > 0) {
      rules.push([getMultipleWordRegExp(words), words]);
    }
    rules.push(...advancedRules);

    return {
      YAMLScalar(node) {
        // Skip YAML keys (only check values)
        if (skipKeys && node.parent?.type === 'YAMLPair' && node.parent.key === node) {
          return;
        }

        // Skip values under certain keys (code, not prose)
        // Check direct parent (for simple key: value)
        if (node.parent?.type === 'YAMLPair' && node.parent.key?.value) {
          const keyName = node.parent.key.value;
          if (skipValueKeys.includes(keyName)) {
            return;
          }
        }
        // Check grandparent (for sequence items: key: [item1, item2])
        if (
          node.parent?.type === 'YAMLSequence' &&
          node.parent.parent?.type === 'YAMLPair' &&
          node.parent.parent.key?.value
        ) {
          const keyName = node.parent.parent.key.value;
          if (skipValueKeys.includes(keyName)) {
            return;
          }
        }

        const value = node.value;
        if (typeof value !== 'string') return;

        const text = value;

        for (const [pattern, replacements] of rules) {
          const regExp = new RegExp(
            typeof pattern === 'string' ? getAdvancedRegExp(pattern) : pattern,
            'igm'
          );

          let match;
          while ((match = regExp.exec(text))) {
            const index = match.index;
            const matched = match[0];
            let replacement = getReplacement(pattern, replacements, matched);

            if (replacement === undefined) continue;

            // Capitalize at sentence start if original was capitalized
            const textBeforeMatch = text.slice(0, Math.max(0, index));
            const isSentenceStart = index === 0 || sentenceStartRegExp.test(textBeforeMatch);
            if (isSentenceStart && upperFirst(matched) === matched) {
              replacement = upperFirst(replacement);
            }

            // Skip if already correct
            if (matched === replacement) continue;

            const canAutoFix =
              node.style === 'plain' ||
              node.style === 'double-quoted' ||
              node.style === 'single-quoted';

            context.report({
              node,
              message: `Incorrect term: "${matched.trim()}", use "${replacement.trim()}" instead`,
              fix: canAutoFix
                ? (fixer) => {
                    const fixedValue =
                      text.slice(0, index) + replacement + text.slice(index + matched.length);
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
            // Report one error at a time, but don't return - continue checking
          }
        }
      },
    };
  },
};
