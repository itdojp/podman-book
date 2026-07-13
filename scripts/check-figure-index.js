#!/usr/bin/env node
/* Validate the reader-facing figure index and its published figure inventory. */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(repoRoot, 'docs');
const figureIndexPath = 'docs/additional/figure-index.md';
const figureIndexRoute = '/additional/figure-index/';
const expectedFigures = [
  {
    id: 'figure-container-technology-concepts',
    title: '図1：コンテナ技術の構成概念',
    source: 'docs/chapters/chapter01/index.md',
    route: '/chapters/chapter01/',
    kind: 'Mermaid',
    marker: '```mermaid',
  },
  {
    id: 'figure-troubleshooting-flow',
    title: '図2：切り分けフロー',
    source: 'docs/additional/troubleshooting-guide.md',
    route: '/additional/troubleshooting-guide/',
    kind: 'Mermaid',
    marker: '```mermaid',
  },
  {
    id: 'figure-podman-verification-screen',
    title: '図3：Podman確認画面',
    source: 'docs/chapters/chapter02/index.md',
    route: '/chapters/chapter02/',
    kind: 'PNG',
    marker: '![Podman セットアップ確認の出力例](../../assets/images/screenshots/chapter02/01-podman-verify-setup.png)',
    asset: 'docs/assets/images/screenshots/chapter02/01-podman-verify-setup.png',
  },
  {
    id: 'figure-container-lifecycle',
    title: '図4：コンテナライフサイクル',
    source: 'docs/chapters/chapter04/index.md',
    route: '/chapters/chapter04/',
    kind: 'SVG',
    marker: '![Container Lifecycle States](../../assets/images/diagrams/chapter04-container-lifecycle-states.svg)',
    asset: 'docs/assets/images/diagrams/chapter04-container-lifecycle-states.svg',
  },
  {
    id: 'figure-podman-network',
    title: '図5：Podmanネットワーク',
    source: 'docs/chapters/chapter06/index.md',
    route: '/chapters/chapter06/',
    kind: 'SVG',
    marker: '![Podman Network Architecture](../../assets/images/diagrams/chapter06-podman-network-architecture.svg)',
    asset: 'docs/assets/images/diagrams/chapter06-podman-network-architecture.svg',
  },
  {
    id: 'figure-security-layers',
    title: '図6：セキュリティ層',
    source: 'docs/chapters/chapter08/index.md',
    route: '/chapters/chapter08/',
    kind: 'SVG',
    marker: '![Container Security Layer Architecture](../../assets/images/diagrams/chapter08-security-layer-architecture.svg)',
    asset: 'docs/assets/images/diagrams/chapter08-security-layer-architecture.svg',
  },
];

function countOccurrences(text, value) {
  return text.split(value).length - 1;
}

function listPublishedMarkdown(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'assets' ? [] : listPublishedMarkdown(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function parseNavigation(text) {
  const entries = [];
  let section = null;
  let current = null;
  const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2');
  const flush = () => {
    if (current?.title && current?.path) entries.push({ section, ...current });
    current = null;
  };

  for (const line of text.split(/\r?\n/)) {
    const sectionMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (sectionMatch) {
      flush();
      section = sectionMatch[1];
      continue;
    }
    const titleMatch = line.match(/^\s*-\s*title:\s*(.+?)\s*$/);
    if (titleMatch) {
      flush();
      current = { title: unquote(titleMatch[1]) };
      continue;
    }
    const pathMatch = line.match(/^\s+path:\s*(\S+)\s*$/);
    if (pathMatch && current) current.path = unquote(pathMatch[1]);
  }
  flush();
  return entries;
}

function validateFigureIndex({ overrides = new Map() } = {}) {
  const errors = [];
  const read = (relativePath) => {
    if (overrides.has(relativePath)) return overrides.get(relativePath);
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  };
  const fileExists = (relativePath) => {
    if (overrides.has(relativePath)) return overrides.get(relativePath).length > 0;
    try {
      const stat = fs.statSync(path.join(repoRoot, relativePath));
      return stat.isFile() && stat.size > 0;
    } catch {
      return false;
    }
  };

  let book;
  try {
    book = JSON.parse(read('book-config.json'));
  } catch (error) {
    errors.push(`book-config.json is not readable JSON: ${error.message}`);
    book = {};
  }
  if (book.ux?.modules?.figureIndex !== true) {
    errors.push('book-config.json ux.modules.figureIndex must be true');
  }

  let packageJson;
  try {
    packageJson = JSON.parse(read('package.json'));
  } catch (error) {
    errors.push(`package.json is not readable JSON: ${error.message}`);
    packageJson = {};
  }
  if (packageJson.scripts?.['check:figure-index'] !== 'node scripts/check-figure-index.js') {
    errors.push('package.json must define check:figure-index');
  }
  if (!packageJson.scripts?.test?.includes('npm run check:figure-index')) {
    errors.push('package.json test must run check:figure-index');
  }

  if (!fileExists(figureIndexPath)) {
    errors.push(`${figureIndexPath} is missing or empty`);
    return errors;
  }
  const indexText = read(figureIndexPath);
  for (const required of ['layout: book', 'title: "図表索引"', '# 図表索引']) {
    if (!indexText.includes(required)) errors.push(`${figureIndexPath} is missing ${JSON.stringify(required)}`);
  }

  const navigationText = read('docs/_data/navigation.yml');
  const navigation = parseNavigation(navigationText);
  const figureIndexEntries = navigation.filter(({ section, title, path: route }) => (
    section === 'additional' && title === '図表索引' && route === figureIndexRoute
  ));
  if (figureIndexEntries.length !== 1) {
    errors.push('docs/_data/navigation.yml must register the figure index in additional');
  }
  const chapter15Position = navigation.findIndex(({ path: route }) => route === '/chapters/chapter15/');
  const figureIndexPosition = navigation.findIndex(({ path: route }) => route === figureIndexRoute);
  const appendixAPosition = navigation.findIndex(({ path: route }) => route === '/appendices/appendix-a/');
  if (!(chapter15Position >= 0 && figureIndexPosition > chapter15Position && appendixAPosition > figureIndexPosition)) {
    errors.push('figure index must be between chapter15 and appendix-a in navigation for prev/next');
  }
  if (!read('docs/_includes/sidebar-nav.html').includes('navigation.additional')) {
    errors.push('sidebar navigation does not render the additional section');
  }
  if (!read('docs/_includes/page-navigation.html').includes('navigation.additional')) {
    errors.push('page navigation does not sequence the additional section');
  }
  if (!read('docs/index.md').includes(figureIndexRoute)) {
    errors.push('docs/index.md must link to the figure index');
  }

  const indexedLinks = [...indexText.matchAll(/\]\(\{\{\s*'([^']+#figure-[^']+)'\s*\\?\|\s*relative_url\s*\}\}\)/g)]
    .map((match) => match[1]);
  const expectedLinks = expectedFigures.map((figure) => `${figure.route}#${figure.id}`);
  if (JSON.stringify(indexedLinks) !== JSON.stringify(expectedLinks)) {
    errors.push(`figure index links must be the exact six-item inventory: expected ${expectedLinks.join(', ')}, got ${indexedLinks.join(', ')}`);
  }
  if (indexText.match(/\]\(\{\{\s*'[^']+#figure-/g)?.length !== expectedFigures.length) {
    errors.push('figure index must contain exactly six stable-anchor links');
  }
  if (/assets\/images\/.+\.(?:png|svg)/i.test(indexText)) {
    errors.push('figure index must link to reader-facing pages, not assets directly');
  }

  const figureAnchorIds = [];
  for (const figure of expectedFigures) {
    if (!indexText.includes(figure.title)) errors.push(`figure index is missing ${figure.title}`);
    if (!fileExists(figure.source)) {
      errors.push(`${figure.source} is missing or empty`);
      continue;
    }
    const sourceText = read(figure.source);
    const anchor = `<a id="${figure.id}"></a>`;
    if (countOccurrences(sourceText, anchor) !== 1) {
      errors.push(`${figure.source} must contain exactly one stable anchor ${figure.id}`);
    }
    if (!sourceText.includes(`${anchor}\n\n${figure.marker}`)) {
      errors.push(`${figure.source} must place ${figure.id} immediately before its ${figure.kind} figure`);
    }
    figureAnchorIds.push(figure.id);
    if (figure.asset && !fileExists(figure.asset)) {
      errors.push(`${figure.asset} is missing or empty`);
    }
  }

  const publishedTexts = listPublishedMarkdown(docsRoot)
    .map((file) => ({ file: path.relative(repoRoot, file), text: read(path.relative(repoRoot, file)) }));
  const actualAnchors = publishedTexts
    .flatMap(({ text }) => [...text.matchAll(/<a id="(figure-[^"]+)"><\/a>/g)].map((match) => match[1]))
    .sort();
  const expectedAnchors = [...figureAnchorIds].sort();
  if (JSON.stringify(actualAnchors) !== JSON.stringify(expectedAnchors)) {
    errors.push(`published figure anchors must be exact: expected ${expectedAnchors.join(', ')}, got ${actualAnchors.join(', ')}`);
  }

  const mermaidCount = publishedTexts
    .reduce((count, { text }) => count + (text.match(/^```mermaid$/gm)?.length || 0), 0);
  if (mermaidCount !== 2) errors.push(`published Mermaid inventory must contain exactly 2 figures, got ${mermaidCount}`);

  const expectedAssets = expectedFigures.filter((figure) => figure.asset).map((figure) => figure.asset).sort();
  const actualAssets = publishedTexts
    .flatMap(({ file, text }) => [...text.matchAll(/!\[[^\]]*\]\(([^)]+\.(?:png|svg))\)/gi)].map((match) => {
      const resolved = path.normalize(path.join(path.dirname(path.join(repoRoot, file)), match[1]));
      return path.relative(repoRoot, resolved).split(path.sep).join('/');
    }))
    .sort();
  if (JSON.stringify(actualAssets) !== JSON.stringify(expectedAssets)) {
    errors.push(`published PNG/SVG inventory must be exact: expected ${expectedAssets.join(', ')}, got ${actualAssets.join(', ')}`);
  }

  return errors;
}

function fail(errors) {
  console.error('Figure index check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (require.main === module) {
  const errors = validateFigureIndex();
  if (errors.length) fail(errors);

  if (process.argv.includes('--self-test')) {
    const readFixture = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    const fixtures = [
      {
        name: 'flag',
        overrides: new Map([['book-config.json', readFixture('book-config.json').replace('"figureIndex": true', '"figureIndex": false')]]),
        expectedError: 'figureIndex must be true',
      },
      {
        name: 'route',
        overrides: new Map([['docs/_data/navigation.yml', readFixture('docs/_data/navigation.yml').replace('path: /additional/figure-index/', 'path: /additional/removed-figure-index/')]]),
        expectedError: 'must register the figure index',
      },
      {
        name: 'page',
        overrides: new Map([[figureIndexPath, '']]),
        expectedError: 'figure-index.md is missing or empty',
      },
      {
        name: 'inventory',
        overrides: new Map([[figureIndexPath, readFixture(figureIndexPath).replace('#figure-security-layers', '#figure-unplanned')]]),
        expectedError: 'exact six-item inventory',
      },
      {
        name: 'anchor',
        overrides: new Map([['docs/additional/troubleshooting-guide.md', readFixture('docs/additional/troubleshooting-guide.md').replace('<a id="figure-troubleshooting-flow"></a>\n\n', '')]]),
        expectedError: 'figure-troubleshooting-flow',
      },
      {
        name: 'asset',
        overrides: new Map([['docs/assets/images/diagrams/chapter04-container-lifecycle-states.svg', '']]),
        expectedError: 'chapter04-container-lifecycle-states.svg is missing or empty',
      },
    ];
    for (const fixture of fixtures) {
      const fixtureErrors = validateFigureIndex({ overrides: fixture.overrides });
      if (!fixtureErrors.some((error) => error.includes(fixture.expectedError))) {
        fail([`negative fixture did not reject ${fixture.name}`]);
      }
    }
    console.log('✅ Figure index negative fixtures passed (flag, route, page, inventory, anchor, and asset drift were rejected).');
  }

  console.log(`✅ Figure index check passed (${expectedFigures.length} figures: Mermaid 2, PNG 1, SVG 3).`);
}

module.exports = { expectedFigures, validateFigureIndex };
