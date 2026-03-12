/** @type {import('eslint').Rule.RuleModule} */
export const noDoubledSpaces = {
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
            node.style === 'plain' ||
            node.style === 'double-quoted' ||
            node.style === 'single-quoted';

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
