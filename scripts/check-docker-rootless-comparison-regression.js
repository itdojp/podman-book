#!/usr/bin/env node
/* Regression fixtures for the Docker rootless comparison contract. */

'use strict';

const fs = require('fs');
const path = require('path');
const { contract, validateText } = require('./check-docker-rootless-comparison');

const baseline = fs.readFileSync(path.resolve(__dirname, '..', contract.path), 'utf8');
const fixtures = [
  ['experimental-row', baseline + '\n| **rootless実行** | ◎ ネイティブ対応 | △ 実験的機能 | Podmanを選択 |\n'],
  [
    'missing-ga-history',
    baseline.replaceAll('Docker Engine 20.10でexperimentalを卒業したsupported mode', 'Docker rootless mode'),
  ],
  [
    'missing-rootless-source',
    baseline.replaceAll('https://docs.docker.com/engine/security/rootless/', 'removed-rootless-source'),
  ],
  [
    'missing-setup-boundary',
    baseline.replaceAll('dockerd-rootless-setuptool.sh install', 'removed-rootless-setup'),
  ],
  ['stale-cross-engine-benchmark', baseline + '\nPodman: 0.38s vs Docker: 0.52s\n'],
  ['podman-only-selection', baseline + '\n- rootless実行が必須\n'],
  [
    'missing-comparison-date',
    baseline.replace('### DockerとPodmanの比較（確認日: 2026-07-21）', '### DockerとPodmanの比較'),
  ],
];

for (const [label, text] of fixtures) {
  if (validateText(text, label).length === 0) {
    throw new Error(`negative fixture was accepted: ${label}`);
  }
}

const positiveErrors = validateText(baseline, 'baseline');
if (positiveErrors.length) throw new Error(`valid baseline was rejected: ${positiveErrors.join('; ')}`);

console.log(`Docker rootless comparison regression fixtures: OK (${fixtures.length} negative, 1 positive)`);
