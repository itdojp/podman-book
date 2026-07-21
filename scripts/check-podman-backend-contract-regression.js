#!/usr/bin/env node
/* Regression fixtures for the Podman backend contract. */

'use strict';

const fs = require('fs');
const path = require('path');
const { contracts, validateText } = require('./check-podman-backend-contract');

const repoRoot = path.resolve(__dirname, '..');
const baseline = Object.fromEntries(
  Object.entries(contracts).map(([name, contract]) => [
    name,
    fs.readFileSync(path.join(repoRoot, contract.path), 'utf8'),
  ])
);

const fixtures = [
  ['overlay2-driver', 'introduction', baseline.introduction + '\n- overlay2: 推奨\n'],
  ['stale-kernel-minimum', 'introduction', baseline.introduction + '\n- Linux 4.18以上\n'],
  ['active-cni-backend', 'chapter03', baseline.chapter03 + '\nnetwork_backend = "cni"\n'],
  ['legacy-rootless-cni-path', 'chapter03', baseline.chapter03 + '\n~/.config/cni/net.d/example.conflist\n'],
  ['legacy-rootful-cni-path', 'chapter03', baseline.chapter03 + '\n/etc/cni/net.d/example.conflist\n'],
  ['active-cni-heading', 'chapter03', baseline.chapter03 + '\n#### CNIプラグイン設定\n'],
  ['active-cni-exercise', 'chapter03', baseline.chapter03 + '\nカスタムCNI設定を作成する\n'],
  [
    'missing-netavark-inspect',
    'chapter03',
    baseline.chapter03.replaceAll('podman network inspect', 'removed network inspection command'),
  ],
  ['chapter06-legacy-cni-conflist', 'chapter06', baseline.chapter06 + '\n/etc/cni/net.d/87-podman.conflist\n'],
  ['chapter15-cni-plugin-directory', 'chapter15', baseline.chapter15 + '\n/usr/libexec/cni\n'],
  ['chapter15-cni-install-repair', 'chapter15', baseline.chapter15 + '\nInstalling CNI plugins...\n'],
  [
    'chapter06-missing-network-reload',
    'chapter06',
    baseline.chapter06.replaceAll('sudo podman network reload --all', 'removed network reload command'),
  ],
  [
    'chapter15-missing-backend-diagnostic',
    'chapter15',
    baseline.chapter15.replaceAll('DIAGNOSTICS["network_backend"]="OK: netavark"', 'removed backend result'),
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
  `Podman backend regression fixtures: OK (${fixtures.length} negative, ${Object.keys(baseline).length} positive)`
);
