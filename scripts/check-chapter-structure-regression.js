#!/usr/bin/env node
/* Mutation regression for the fail-closed chapter structure contract. */
const fs = require('fs');
const path = require('path');
const { validateStructure } = require('./check-chapter-structure');

const repoRoot = path.resolve(__dirname, '..');
const cacheRoot = path.join(repoRoot, 'node_modules', '.cache');
fs.mkdirSync(cacheRoot, { recursive: true });
const fixtureRoot = fs.mkdtempSync(path.join(cacheRoot, 'podman-chapter-structure-'));

function copy(relativePath) {
  const source = path.join(repoRoot, relativePath);
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, {
    recursive: true,
    filter: (candidate) => !candidate.split(path.sep).some((segment) => ['_site', '.jekyll-cache'].includes(segment)),
  });
}

function replaceOnce(relativePath, from, to) {
  const file = path.join(fixtureRoot, relativePath);
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(from)) throw new Error(`Regression fixture text not found in ${relativePath}: ${from}`);
  fs.writeFileSync(file, original.replace(from, to));
  return () => fs.writeFileSync(file, original);
}

const cases = [
  {
    name: 'canonical config title drift',
    file: 'book-config.json',
    from: '第5章：Containerfileとイメージビルド・配布',
    to: '第5章：誤った章名',
    evidence: 'book-config chapter05.title',
  },
  {
    name: 'chapter H1 drift',
    file: 'docs/chapters/chapter08/index.md',
    from: '# 第8章：コンテナセキュリティとRootless運用',
    to: '# 第8章：誤った見出し',
    evidence: 'chapter08 H1',
  },
  {
    name: 'navigation title drift',
    file: 'docs/_data/navigation.yml',
    from: '- title: 第9章：systemd・Quadletと本番運用',
    to: '- title: 第9章：誤った導線',
    evidence: 'navigation /chapters/chapter09/',
  },
  {
    name: 'learning path drift',
    file: 'docs/additional/learning-path.md',
    from: '**第4章**: コンテナの基本操作とイメージ管理',
    to: '**第4章**: 誤った学習主題',
    evidence: 'learning path chapter 4',
  },
  {
    name: 'screenshot chapter drift',
    file: 'docs/assets/images/screenshots/CHECKLIST.md',
    from: '## chapter15（トラブルシューティング完全ガイド）',
    to: '## chapter15（誤った撮影対象）',
    evidence: 'screenshot checklist must contain exactly one heading',
  },
  {
    name: 'dominant subject marker removal',
    file: 'docs/chapters/chapter05/index.md',
    from: '### 5.3 Buildahによる高度なイメージ作成',
    to: '### 5.3 別の主題',
    evidence: 'chapter05 is missing dominant topic heading',
  },
  {
    name: 'internal chapter link label drift',
    file: 'docs/appendices/appendix-b/index.md',
    from: '[第5章：Containerfileとイメージビルド・配布](../../chapters/chapter05/)',
    to: '[第5章：誤ったリンクラベル](../../chapters/chapter05/)',
    evidence: 'stale chapter link label',
  },
];

let passed = 0;
try {
  copy('book-config.json');
  copy('book-formatter-config.json');
  copy('docs');
  copy('project-management/chapter-structure-map.md');

  const baselineErrors = validateStructure(fixtureRoot);
  if (baselineErrors.length) throw new Error(`Baseline fixture failed:\n${baselineErrors.join('\n')}`);

  for (const testCase of cases) {
    const restore = replaceOnce(testCase.file, testCase.from, testCase.to);
    try {
      const errors = validateStructure(fixtureRoot);
      if (!errors.some((error) => error.includes(testCase.evidence))) {
        throw new Error(`${testCase.name}: expected evidence ${JSON.stringify(testCase.evidence)}, got:\n${errors.join('\n')}`);
      }
      passed += 1;
    } finally {
      restore();
    }
  }

  const configFile = path.join(fixtureRoot, 'book-config.json');
  const originalConfig = fs.readFileSync(configFile, 'utf8');
  try {
    const reordered = JSON.parse(originalConfig);
    [reordered.structure.chapters[3], reordered.structure.chapters[4]] = [
      reordered.structure.chapters[4],
      reordered.structure.chapters[3],
    ];
    fs.writeFileSync(configFile, `${JSON.stringify(reordered, null, 2)}\n`);
    const errors = validateStructure(fixtureRoot);
    if (!errors.some((error) => error.includes('chapter order mismatch at position 3'))) {
      throw new Error(`chapter order drift: expected order evidence, got:\n${errors.join('\n')}`);
    }
    passed += 1;
  } finally {
    fs.writeFileSync(configFile, originalConfig);
  }

  const finalErrors = validateStructure(fixtureRoot);
  if (finalErrors.length) throw new Error(`Restored fixture failed:\n${finalErrors.join('\n')}`);
  console.log(`Chapter structure regression passed: ${passed}/${cases.length + 1} negative mutations, 1/1 restored baseline.`);
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
