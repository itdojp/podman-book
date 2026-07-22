#!/usr/bin/env node
/* Fail-closed contract for chapter title, subject, navigation, and learning-path alignment. */
const fs = require('fs');
const path = require('path');

const EXPECTED_CHAPTERS = [
  {
    id: 'chapter01',
    title: '第1章：コンテナ技術の基礎',
    description: 'Linux名前空間とcgroupsによるプロセス分離の実装',
    headings: ['## Linux名前空間とcgroupsによるプロセス分離の実装', '## Podmanアーキテクチャ概要'],
  },
  {
    id: 'chapter02',
    title: '第2章：Podmanのインストールと初期設定',
    description: '各OS対応のインストール方法と基本設定',
    headings: ['## 2.2 各OSへのインストール方法（手動）', '## 2.3 初期設定'],
  },
  {
    id: 'chapter03',
    title: '第3章：ホスト設定とRootless環境の最適化',
    description: 'カーネル、UID/GID、ストレージ、ネットワークのRootless実行基盤',
    headings: ['## カーネルパラメータとシステム設定の最適化', '## 3.2 Rootlessコンテナの詳細設定'],
  },
  {
    id: 'chapter04',
    title: '第4章：コンテナの基本操作とイメージ管理',
    description: 'コンテナのライフサイクル、実行、ログ、イメージ管理',
    headings: ['### 4.1 コンテナライフサイクル', '### 4.2 イメージ管理'],
  },
  {
    id: 'chapter05',
    title: '第5章：Containerfileとイメージビルド・配布',
    description: 'Containerfile、Buildah、レジストリによるイメージ作成と配布',
    headings: ['### 5.1 Containerfile/Dockerfile詳解', '### 5.3 Buildahによる高度なイメージ作成', '### 5.4 イメージレジストリ'],
  },
  {
    id: 'chapter06',
    title: '第6章：ネットワークとストレージ管理',
    description: 'コンテナネットワーク、ポート、ボリューム、永続化',
    headings: ['### 6.1 コンテナネットワーク詳解', '### 6.2 ストレージ管理'],
  },
  {
    id: 'chapter07',
    title: '第7章：Pod機能と複数コンテナ管理',
    description: 'Kubernetes互換のPod機能活用',
    headings: ['### 7.1 Pod概念の理解', '### 7.4 マルチコンテナアプリケーション'],
  },
  {
    id: 'chapter08',
    title: '第8章：コンテナセキュリティとRootless運用',
    description: 'Rootless、capabilities、seccomp、SELinux、イメージ保護',
    headings: ['### 8.1 コンテナセキュリティの基礎', '### 8.2 Rootlessコンテナ詳解', '### 8.3 セキュリティ機能の活用'],
  },
  {
    id: 'chapter09',
    title: '第9章：systemd・Quadletと本番運用',
    description: 'systemdとQuadlet、監視、自動更新、バックアップ',
    headings: ['### 9.1 systemdとPodmanの統合', '### 9.2 本番運用のベストプラクティス', '### 9.3 自動アップデート'],
  },
  {
    id: 'chapter10',
    title: '第10章：CI/CDパイプラインの実践',
    description: 'Podmanを使ったコンテナCI/CDの設計と実装',
    headings: ['### 10.1 CI/CD概要とPodman統合', '### 10.3 GitHub Actionsとの統合'],
  },
  {
    id: 'chapter11',
    title: '第11章：Kubernetesとの統合',
    description: 'K8s環境でのPodman活用',
    headings: ['### 11.1 PodmanとKubernetesの関係', '### 11.2 Kubernetes YAMLの実行'],
  },
  {
    id: 'chapter12',
    title: '第12章：パフォーマンスチューニング',
    description: 'Podmanコンテナの性能計測と最適化手法',
    headings: ['### 12.1 パフォーマンス分析の基礎', '### 12.7 総合的な最適化戦略'],
  },
  {
    id: 'chapter13',
    title: '第13章：マイクロサービスアーキテクチャ',
    description: 'マイクロサービス構成とサービス間連携の実践',
    headings: ['### 13.1 マイクロサービスの基本概念', '### 13.4 サービスメッシュパターン'],
  },
  {
    id: 'chapter14',
    title: '第14章：エンタープライズ環境での活用',
    description: 'エンタープライズ要件を満たす運用設計とセキュリティ',
    headings: ['### 14.1 エンタープライズセキュリティ', '### 14.2 高可用性とディザスタリカバリ'],
  },
  {
    id: 'chapter15',
    title: '第15章：トラブルシューティング完全ガイド',
    description: '障害解析を体系化する診断フレームワーク',
    headings: ['### 15.1 トラブルシューティングの基本原則', '### 15.2 一般的な問題と解決策'],
  },
];

const LEGACY_TITLES = [
  '第3章：基本的なコンテナ操作',
  '第4章：イメージの管理と作成',
  '第5章：ストレージとボリューム管理',
  '第6章：ネットワーキングとポート管理',
  '第8章：Dockerfileの作成と最適化',
  '第9章：レジストリとイメージ配布',
];

const REQUIRED_LEARNING_OUTCOME_MARKERS = [
  '- Containerfileからカスタムイメージを作成できる',
  '#### 演習5: カスタムイメージの作成',
  '- Rootlessとコンテナセキュリティの実行境界を確認できる',
  '#### 演習7: Rootlessセキュリティ境界の確認',
  '- systemd・Quadletとの統合ができる',
  '#### 演習8: Quadletによるユーザーサービス化',
];

function readText(file, errors) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    errors.push(`${file}: ${error?.message || error}`);
    return '';
  }
}

function readJson(file, errors) {
  const text = readText(file, errors);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${file}: invalid JSON: ${error.message}`);
    return {};
  }
}

function parseFrontMatterTitle(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return null;
  const end = normalized.indexOf('\n---\n', 4);
  if (end < 0) return null;
  const match = normalized.slice(4, end).match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1] : null;
}

function firstDocumentH1(text) {
  let inFence = false;
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^# [^#]/.test(line)) return line.slice(2).trim();
  }
  return null;
}

function parseNavigation(text) {
  const entries = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const titleMatch = lines[index].match(/^\s*-\s+title:\s*["']?(.+?)["']?\s*$/);
    if (!titleMatch) continue;
    const pathMatch = lines[index + 1]?.match(/^\s+path:\s*["']?(.+?)["']?\s*$/);
    if (pathMatch) entries.push({ title: titleMatch[1], path: pathMatch[1] });
  }
  return entries;
}

function subtitle(title) {
  const separator = title.indexOf('：');
  return separator >= 0 ? title.slice(separator + 1) : title;
}

function countLiteral(text, value) {
  return text.split(value).length - 1;
}

function listMarkdownFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && ['_site', '.jekyll-cache'].includes(entry.name)) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(full));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function validateStructure(repoRoot) {
  const errors = [];
  const docsRoot = path.join(repoRoot, 'docs');
  const book = readJson(path.join(repoRoot, 'book-config.json'), errors);
  const formatter = readJson(path.join(repoRoot, 'book-formatter-config.json'), errors);
  const chapters = (book.structure?.chapters || []).filter((item) => /^chapter\d{2}$/.test(item.id || ''));
  const formatterChapters = new Map(
    (formatter.structure?.chapters || [])
      .filter((item) => /^chapter\d{2}$/.test(item.id || ''))
      .map((item) => [item.id, item])
  );
  const navText = readText(path.join(docsRoot, '_data', 'navigation.yml'), errors);
  const navEntries = parseNavigation(navText);
  const navByPath = new Map(navEntries.map((entry) => [entry.path, entry]));
  const indexText = readText(path.join(docsRoot, 'index.md'), errors);
  const learningText = readText(path.join(docsRoot, 'additional', 'learning-path.md'), errors);
  const screenshotText = readText(path.join(docsRoot, 'assets', 'images', 'screenshots', 'CHECKLIST.md'), errors);
  const mapText = readText(path.join(repoRoot, 'project-management', 'chapter-structure-map.md'), errors);

  if (chapters.length !== EXPECTED_CHAPTERS.length) {
    errors.push(`book-config chapter count: expected ${EXPECTED_CHAPTERS.length}, got ${chapters.length}`);
  }

  const chaptersById = new Map(chapters.map((item) => [item.id, item]));
  for (const [index, expected] of EXPECTED_CHAPTERS.entries()) {
    const number = String(index + 1).padStart(2, '0');
    const expectedPath = `/chapters/${expected.id}/`;
    const item = chaptersById.get(expected.id);
    if (!item) {
      errors.push(`book-config is missing ${expected.id}`);
      continue;
    }
    for (const [field, value] of Object.entries({ title: expected.title, description: expected.description, path: expectedPath })) {
      if (item[field] !== value) errors.push(`book-config ${expected.id}.${field}: expected ${JSON.stringify(value)}, got ${JSON.stringify(item[field])}`);
    }

    const formatted = formatterChapters.get(expected.id);
    if (!formatted) {
      errors.push(`book-formatter-config is missing ${expected.id}`);
    } else {
      for (const field of ['title', 'description']) {
        if (formatted[field] !== expected[field]) {
          errors.push(`book-formatter-config ${expected.id}.${field}: expected ${JSON.stringify(expected[field])}, got ${JSON.stringify(formatted[field])}`);
        }
      }
    }

    const chapterFile = path.join(docsRoot, 'chapters', expected.id, 'index.md');
    const chapterText = readText(chapterFile, errors);
    const frontMatterTitle = parseFrontMatterTitle(chapterText);
    const h1 = firstDocumentH1(chapterText);
    if (frontMatterTitle !== expected.title) {
      errors.push(`${expected.id} front matter title: expected ${JSON.stringify(expected.title)}, got ${JSON.stringify(frontMatterTitle)}`);
    }
    if (h1 !== expected.title) {
      errors.push(`${expected.id} H1: expected ${JSON.stringify(expected.title)}, got ${JSON.stringify(h1)}`);
    }
    for (const heading of expected.headings) {
      if (!chapterText.includes(heading)) errors.push(`${expected.id} is missing dominant topic heading: ${heading}`);
    }

    const navEntry = navByPath.get(expectedPath);
    if (!navEntry) {
      errors.push(`navigation is missing ${expectedPath}`);
    } else if (navEntry.title !== expected.title) {
      errors.push(`navigation ${expectedPath}: expected ${JSON.stringify(expected.title)}, got ${JSON.stringify(navEntry.title)}`);
    }

    const topLink = `[${expected.title}](chapters/${expected.id}/)`;
    if (countLiteral(indexText, topLink) !== 1) {
      errors.push(`docs/index.md must contain exactly one canonical TOC link: ${topLink}`);
    }

    const screenshotHeading = `## ${expected.id}（${subtitle(expected.title)}）`;
    if (countLiteral(screenshotText, screenshotHeading) !== 1) {
      errors.push(`screenshot checklist must contain exactly one heading: ${screenshotHeading}`);
    }

    const mapPrefix = `| ${expected.id} | ${expected.title} |`;
    if (countLiteral(mapText, mapPrefix) !== 1) {
      errors.push(`chapter structure map must contain exactly one row starting with: ${mapPrefix}`);
    }

    const orderedItem = chapters[index];
    if (orderedItem?.id !== `chapter${number}`) {
      errors.push(`chapter order mismatch at position ${index + 1}: expected chapter${number}, got ${orderedItem?.id || 'missing'}`);
    }
  }

  const expectedByNumber = new Map(EXPECTED_CHAPTERS.map((item, index) => [index + 1, item]));
  const learningReferences = new Set();
  const learningPattern = /\*\*第(\d+)章\*\*:\s*([^\n]+)/g;
  let learningMatch;
  while ((learningMatch = learningPattern.exec(learningText)) !== null) {
    const number = Number(learningMatch[1]);
    const expected = expectedByNumber.get(number);
    if (!expected) {
      errors.push(`learning path references unknown chapter ${number}`);
      continue;
    }
    learningReferences.add(number);
    const actualSubtitle = learningMatch[2].split('（')[0].trim();
    if (actualSubtitle !== subtitle(expected.title)) {
      errors.push(`learning path chapter ${number}: expected ${JSON.stringify(subtitle(expected.title))}, got ${JSON.stringify(actualSubtitle)}`);
    }
  }
  for (const required of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15]) {
    if (!learningReferences.has(required)) errors.push(`learning path is missing required chapter reference: ${required}`);
  }
  for (const marker of REQUIRED_LEARNING_OUTCOME_MARKERS) {
    if (!learningText.includes(marker)) errors.push(`learning path is missing required outcome marker: ${marker}`);
  }
  const exerciseNumbers = [...learningText.matchAll(/^#### 演習(\d+):/gm)].map((match) => Number(match[1]));
  const expectedExerciseNumbers = Array.from({ length: 9 }, (_, index) => index + 1);
  if (JSON.stringify(exerciseNumbers) !== JSON.stringify(expectedExerciseNumbers)) {
    errors.push(`learning path exercise sequence: expected ${expectedExerciseNumbers.join(', ')}, got ${exerciseNumbers.join(', ')}`);
  }

  const expectedById = new Map(EXPECTED_CHAPTERS.map((item) => [item.id, item]));
  const linkPattern = /\[([^\]\n]+)\]\(([^)\n]*(chapter\d{2})\/[^)\n]*)\)/g;
  for (const file of listMarkdownFiles(docsRoot)) {
    const text = readText(file, errors);
    let match;
    while ((match = linkPattern.exec(text)) !== null) {
      const expected = expectedById.get(match[3]);
      if (expected && /^第\d+章/.test(match[1]) && match[1] !== expected.title) {
        errors.push(`${path.relative(repoRoot, file)} has stale chapter link label ${JSON.stringify(match[1])} for ${match[3]}; expected ${JSON.stringify(expected.title)}`);
      }
    }
  }

  for (const [label, text] of [
    ['book-config.json', JSON.stringify(book)],
    ['book-formatter-config.json', JSON.stringify(formatter)],
    ['docs', listMarkdownFiles(docsRoot).map((file) => readText(file, errors)).join('\n')],
  ]) {
    for (const legacyTitle of LEGACY_TITLES) {
      if (text.includes(legacyTitle)) errors.push(`${label} still contains legacy title: ${legacyTitle}`);
    }
  }

  return errors;
}

function main() {
  const repoRoot = process.env.PODMAN_BOOK_ROOT
    ? path.resolve(process.env.PODMAN_BOOK_ROOT)
    : path.resolve(__dirname, '..');
  const errors = validateStructure(repoRoot);
  if (errors.length) {
    console.error('Chapter structure check failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Chapter structure check passed: ${EXPECTED_CHAPTERS.length} chapters and all reader-facing sync surfaces.`);
}

if (require.main === module) main();

module.exports = { EXPECTED_CHAPTERS, validateStructure };
