#!/usr/bin/env node
/* Validate the macOS/Windows Podman machine and direct-WSL path contract. */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const contracts = {
  chapter01: {
    path: 'docs/chapters/chapter01/index.md',
    required: [
      'native CLI + Podman machine（WSL / Hyper-V guest）',
      'native CLI + Podman machine（Linux VM）',
      'どちらもLinux VMを使用',
    ],
  },
  chapter02: {
    path: 'docs/chapters/chapter02/index.md',
    required: [
      'Podman stable文書とv6.0.1',
      'Windows 11以降',
      'Podman machine（標準経路）',
      'podman machine init --now',
      'podman machine inspect',
      'podman system connection list',
      'serviceIsRemote',
      'WSL2 distribution内でLinux版Podmanを直接実行する経路（任意）',
      'machine側のcontainerが見えないことを障害と誤認しない',
      'https://podman.io/docs/installation',
      'https://docs.podman.io/en/stable/markdown/podman-machine.1.html',
      'https://github.com/podman-container-tools/podman/blob/main/docs/tutorials/podman-for-windows.md',
    ],
  },
};

const forbidden = {
  chapter01: [
    { label: 'legacy Windows WSL-only comparison', pattern: /Windows対応\*\*\s*\|\s*△\s*WSL2経由/ },
    { label: 'legacy macOS generic-VM comparison', pattern: /macOS対応\*\*\s*\|\s*△\s*VM経由/ },
  ],
  chapter02: [
    { label: 'WSL2 direct path presented as the only Windows prerequisite', pattern: /#\s*WSL2が必要/ },
    { label: 'community Homebrew path presented as the default', pattern: /#\s*Homebrewを使用/ },
    { label: 'old Windows direct-install continuation', pattern: /WSL2内でLinuxディストリビューションをインストール後/ },
  ],
};

const minimumCounts = {
  chapter02: [
    { label: 'macOS and Windows machine initialization examples', marker: 'podman machine init --now', count: 2 },
    { label: 'machine/direct connection checks', marker: 'podman system connection list', count: 3 },
    { label: 'remote/local connection boundary explanations', marker: 'serviceIsRemote', count: 2 },
  ],
};

function validateText(text, contractName, sourceLabel = contractName) {
  const contract = contracts[contractName];
  if (!contract) throw new Error(`unknown contract: ${contractName}`);
  const errors = [];
  for (const marker of contract.required) {
    if (!text.includes(marker)) errors.push(`${sourceLabel}: missing required marker: ${marker}`);
  }
  for (const rule of forbidden[contractName] || []) {
    if (rule.pattern.test(text)) errors.push(`${sourceLabel}: forbidden ${rule.label}`);
  }
  for (const rule of minimumCounts[contractName] || []) {
    const actual = text.split(rule.marker).length - 1;
    if (actual < rule.count) {
      errors.push(`${sourceLabel}: ${rule.label} count ${actual} is below ${rule.count}`);
    }
  }
  return errors;
}

function validateRepository() {
  const errors = [];
  for (const [name, contract] of Object.entries(contracts)) {
    const file = path.join(repoRoot, contract.path);
    if (!fs.existsSync(file)) {
      errors.push(`${contract.path}: file is missing`);
      continue;
    }
    errors.push(...validateText(fs.readFileSync(file, 'utf8'), name, contract.path));
  }
  return errors;
}

function main() {
  const errors = validateRepository();
  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('Podman machine path contract: OK (macOS/Windows machine + direct WSL2)');
}

if (require.main === module) main();

module.exports = { contracts, validateRepository, validateText };
