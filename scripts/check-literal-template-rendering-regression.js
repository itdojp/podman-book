#!/usr/bin/env node
/* Regression fixtures for literal template rendering boundaries. */

'use strict';

const { rawOpen, rawClose, validateMarkdown } = require('./check-literal-template-rendering');

const validGo = `${rawOpen}\n\`\`\`bash\npodman inspect --format '{{.Name}}'\n\`\`\`\n${rawClose}\n`;
const validActions = `${rawOpen}\n\`\`\`yaml\nIMAGE_NAME: \${{ github.repository }}\n\`\`\`\n${rawClose}\n`;
const fixtures = [
  ['escaped-go-template', validGo.replace('{{.Name}}', '\\{\\{.Name\\}\\}')],
  ['unprotected-go-template', validGo.replace(`${rawOpen}\n`, '').replace(`\n${rawClose}`, '')],
  ['unprotected-actions-expression', validActions.replace(`${rawOpen}\n`, '').replace(`\n${rawClose}`, '')],
  ['missing-closing-boundary', validGo.replace(`\n${rawClose}`, '')],
  [
    'inline-raw-tag',
    validGo.replace(
      "podman inspect --format '{{.Name}}'",
      "{% raw %}podman inspect --format '{{.Name}}'{% endraw %}"
    ),
  ],
  ['orphan-opening-boundary', `${rawOpen}\nnot a fence\n`],
];

for (const [label, text] of fixtures) {
  if (validateMarkdown(text, label).length === 0) throw new Error(`negative fixture was accepted: ${label}`);
}
for (const [label, text] of [['valid-go', validGo], ['valid-actions', validActions], ['plain-code', '```bash\necho ok\n```\n']]) {
  const errors = validateMarkdown(text, label);
  if (errors.length) throw new Error(`positive fixture was rejected: ${label}: ${errors.join('; ')}`);
}

console.log(`Literal template rendering regression fixtures: OK (${fixtures.length} negative, 3 positive)`);
