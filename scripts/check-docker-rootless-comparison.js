#!/usr/bin/env node
/* Validate the supported Docker rootless and Podman comparison contract. */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const contract = {
  path: 'docs/chapters/chapter01/index.md',
  required: [
    '### DockerとPodmanの比較（確認日: 2026-07-21）',
    'Docker Engine 20.10でexperimentalを卒業したsupported mode',
    '`dockerd-rootless-setuptool.sh install`',
    '`rootless` context',
    'cgroup v2とsystemd',
    'daemonとcontainerの双方をuser namespace内で実行',
    'https://docs.docker.com/engine/security/rootless/',
    'https://docs.docker.com/engine/release-notes/20.10/',
    'https://docs.docker.com/engine/security/rootless/tips/',
    'https://docs.podman.io/en/stable/markdown/podman.1.html#rootless-mode',
    '本書では出典と再現条件のない単一値を製品の一般的な優劣へ拡張せず',
    '**Podman**: v6.0.1',
    '**Docker rootless**: 現行公式文書',
  ],
};

const forbidden = [
  { label: 'Docker rootless marked experimental', pattern: /\|\s*\*\*rootless実行\*\*.*△\s*実験的機能/i },
  { label: 'fixed Docker v25 comparison header', pattern: /Docker\s*\(v25\.x\)/i },
  { label: 'stale 2024 latest heading', pattern: /包括的比較（2024年最新版）/ },
  { label: 'unsupported rootless-only selection', pattern: /一般ユーザー権限実行→Podman|rootless実行が必須/ },
  { label: 'unreproducible cross-engine start result', pattern: /Podman:\s*0\.38s\s*vs\s*Docker:\s*0\.52s/i },
  { label: 'unreproducible daemon memory score', pattern: /デーモンなし\s*vs\s*約30MB常駐/i },
];

function comparisonSection(text) {
  const start = text.indexOf('### DockerとPodmanの比較');
  const end = text.indexOf('### アーキテクチャの詳細比較', start);
  return start >= 0 && end > start ? text.slice(start, end) : '';
}

function validateText(text, sourceLabel = contract.path) {
  const errors = [];
  for (const marker of contract.required) {
    if (!text.includes(marker)) errors.push(`${sourceLabel}: missing required marker: ${marker}`);
  }
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) errors.push(`${sourceLabel}: forbidden ${rule.label}`);
  }
  const section = comparisonSection(text);
  if (!section) {
    errors.push(`${sourceLabel}: comparison section boundary is missing`);
  } else if (/[◎○◯〇△▲×✕]/u.test(section)) {
    errors.push(`${sourceLabel}: comparison section contains score symbols instead of concrete axes`);
  }
  return errors;
}

function validateRepository() {
  const file = path.join(repoRoot, contract.path);
  if (!fs.existsSync(file)) return [`${contract.path}: file is missing`];
  return validateText(fs.readFileSync(file, 'utf8'));
}

function main() {
  const errors = validateRepository();
  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('Docker rootless comparison contract: OK (supported mode + concrete axes)');
}

if (require.main === module) main();

module.exports = { contract, validateRepository, validateText };
