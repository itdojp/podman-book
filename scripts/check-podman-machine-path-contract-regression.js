#!/usr/bin/env node
/* Regression fixtures for the Podman machine path contract. */

'use strict';

const fs = require('fs');
const path = require('path');
const { contracts, validateText } = require('./check-podman-machine-path-contract');

const repoRoot = path.resolve(__dirname, '..');
const baseline = Object.fromEntries(
  Object.entries(contracts).map(([name, contract]) => [
    name,
    fs.readFileSync(path.join(repoRoot, contract.path), 'utf8'),
  ])
);

const fixtures = [
  [
    'missing-standard-machine-label',
    'chapter02',
    baseline.chapter02.replace('Podman machine（標準経路）', 'Podman setup'),
  ],
  [
    'missing-direct-wsl-separation',
    'chapter02',
    baseline.chapter02.replace(
      'WSL2 distribution内でLinux版Podmanを直接実行する経路（任意）',
      'Windows追加手順'
    ),
  ],
  [
    'missing-connection-checks',
    'chapter02',
    baseline.chapter02.replaceAll('podman system connection list', 'removed connection check'),
  ],
  ['legacy-wsl-only', 'chapter02', baseline.chapter02 + '\n# WSL2が必要\n'],
  ['legacy-homebrew-default', 'chapter02', baseline.chapter02 + '\n# Homebrewを使用\n'],
  [
    'missing-remote-local-boundary',
    'chapter02',
    baseline.chapter02.replaceAll('serviceIsRemote', 'removedRemoteMarker'),
  ],
  [
    'legacy-windows-comparison',
    'chapter01',
    baseline.chapter01 + '\n| **Windows対応** | △ WSL2経由 | ◎ ネイティブ | Windows中心→Docker |\n',
  ],
  [
    'legacy-macos-comparison',
    'chapter01',
    baseline.chapter01 + '\n| **macOS対応** | △ VM経由 | ◎ Docker Desktop | macOS開発→Docker |\n',
  ],
];

for (const [label, contractName, text] of fixtures) {
  if (validateText(text, contractName, label).length === 0) {
    throw new Error(`negative fixture was accepted: ${label}`);
  }
}

for (const [name, text] of Object.entries(baseline)) {
  const errors = validateText(text, name, `baseline-${name}`);
  if (errors.length) throw new Error(`valid baseline was rejected: ${errors.join('; ')}`);
}

console.log(
  `Podman machine path regression fixtures: OK (${fixtures.length} negative, ${Object.keys(baseline).length} positive)`
);
