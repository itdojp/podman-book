#!/usr/bin/env node
/* Validate the current Podman storage and network backend guidance. */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const contracts = {
  introduction: {
    path: 'docs/introduction/index.md',
    required: [
      'Linux 5.12.9',
      'Podman / containers-storageでのdriver名',
      '`fuse-overlayfs`',
      'https://docs.podman.io/en/stable/markdown/podman.1.html#rootless-mode',
      '**Netavark**',
      '**aardvark-dns**',
    ],
  },
  chapter03: {
    path: 'docs/chapters/chapter03/index.md',
    required: [
      'podman info --format json',
      "podman info --format '\\{\\{.Host.NetworkBackend\\}\\}'",
      'podman network inspect',
      '/etc/containers/networks',
      '$graphroot/networks',
      '#### 3.3.1 Netavarkとaardvark-dns',
      'https://docs.podman.io/en/stable/markdown/podman-network.1.html',
      'https://github.com/podman-container-tools/podman/releases/tag/v5.0.0',
      'https://github.com/podman-container-tools/podman/releases/tag/v6.0.0',
      'https://github.com/podman-container-tools/container-libs/blob/main/storage/docs/containers-storage.conf.5.md',
    ],
  },
};

const forbidden = [
  {
    label: 'Docker-specific storage driver configured as Podman storage',
    pattern: /(?:^\s*-\s*`?overlay2`?\s*:|driver\s*=\s*["']overlay2["'])/im,
  },
  { label: 'universal Linux 4.18 minimum', pattern: /^\s*-\s*Linux\s*4\.18以上/im },
  { label: 'active CNI backend setting', pattern: /network_backend\s*=\s*["']cni["']/i },
  { label: 'legacy rootless CNI config path', pattern: /~\/\.config\/cni\/net\.d/i },
  { label: 'legacy rootful CNI config path', pattern: /\/etc\/cni\/net\.d/i },
  { label: 'active CNI plugin section', pattern: /^#{2,6}\s+.*CNIプラグイン/im },
  { label: 'active CNI exercise', pattern: /カスタムCNI設定/ },
  { label: 'active rootless CNI procedure', pattern: /Rootless\s*CNI/ },
];

function validateText(text, contractName, sourceLabel = contractName) {
  const contract = contracts[contractName];
  if (!contract) throw new Error(`unknown contract: ${contractName}`);
  const errors = [];
  for (const marker of contract.required) {
    if (!text.includes(marker)) errors.push(`${sourceLabel}: missing required marker: ${marker}`);
  }
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) errors.push(`${sourceLabel}: forbidden ${rule.label}`);
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
  console.log('Podman backend contract: OK (overlay + Netavark + aardvark-dns)');
}

if (require.main === module) main();

module.exports = { contracts, validateRepository, validateText };
