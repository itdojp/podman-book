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
    marker: '![Podmanのversion・rootless・cgroup・network backendと実行成功を判断する出力](../../assets/images/screenshots/chapter02/01-podman-verify-setup.png)',
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
  {
    id: 'figure-daemonless-process-audit',
    title: '図7：daemonless実行境界',
    source: 'docs/chapters/chapter01/index.md',
    route: '/chapters/chapter01/',
    kind: 'PNG',
    marker: '![Podmanのdaemon常駐有無とrootless実行境界を判断する出力](../../assets/images/screenshots/chapter01/01-daemonless-process-audit.png)',
    asset: 'docs/assets/images/screenshots/chapter01/01-daemonless-process-audit.png',
  },
  {
    id: 'figure-rootless-uid-mapping',
    title: '図8：rootless UID mapping',
    source: 'docs/chapters/chapter03/index.md',
    route: '/chapters/chapter03/',
    kind: 'PNG',
    marker: '![rootless Podmanでhost UIDとcontainer UIDの対応を判断する出力](../../assets/images/screenshots/chapter03/01-rootless-uid-mapping.png)',
    asset: 'docs/assets/images/screenshots/chapter03/01-rootless-uid-mapping.png',
  },
  {
    id: 'figure-image-pull-inventory',
    title: '図9：image pull inventory',
    source: 'docs/chapters/chapter04/index.md',
    route: '/chapters/chapter04/',
    kind: 'PNG',
    marker: '![pullしたimageのtag・ID・sizeがinventoryへ反映されたか判断する出力](../../assets/images/screenshots/chapter04/01-image-pull-inventory.png)',
    asset: 'docs/assets/images/screenshots/chapter04/01-image-pull-inventory.png',
  },
  {
    id: 'figure-containerfile-build',
    title: '図10：Containerfile build',
    source: 'docs/chapters/chapter05/index.md',
    route: '/chapters/chapter05/',
    kind: 'PNG',
    marker: '![Containerfileのstageとbuild成功・生成tagの対応を判断する出力](../../assets/images/screenshots/chapter05/01-containerfile-build.png)',
    asset: 'docs/assets/images/screenshots/chapter05/01-containerfile-build.png',
  },
  {
    id: 'figure-port-volume-verification',
    title: '図11：port・volume verification',
    source: 'docs/chapters/chapter06/index.md',
    route: '/chapters/chapter06/',
    kind: 'PNG',
    marker: '![公開portのHTTP疎通とvolume再作成後の永続性を判断する出力](../../assets/images/screenshots/chapter06/01-port-volume-verification.png)',
    asset: 'docs/assets/images/screenshots/chapter06/01-port-volume-verification.png',
  },
  {
    id: 'figure-pod-membership',
    title: '図12：Pod membership',
    source: 'docs/chapters/chapter07/index.md',
    route: '/chapters/chapter07/',
    kind: 'PNG',
    marker: '![Podの名前・状態と配下containerの所属を判断する出力](../../assets/images/screenshots/chapter07/01-pod-membership.png)',
    asset: 'docs/assets/images/screenshots/chapter07/01-pod-membership.png',
  },
  {
    id: 'figure-rootless-capability-boundary',
    title: '図13：rootless capability boundary',
    source: 'docs/chapters/chapter08/index.md',
    route: '/chapters/chapter08/',
    kind: 'PNG',
    marker: '![rootless・seccomp・capability削除の実行境界を判断する出力](../../assets/images/screenshots/chapter08/01-rootless-capability-boundary.png)',
    asset: 'docs/assets/images/screenshots/chapter08/01-rootless-capability-boundary.png',
  },
  {
    id: 'figure-quadlet-generated-unit',
    title: '図14：Quadlet generated unit',
    source: 'docs/chapters/chapter09/index.md',
    route: '/chapters/chapter09/',
    kind: 'PNG',
    marker: '![Quadlet定義が期待するsystemd unitへ変換されるか判断するdry-run出力](../../assets/images/screenshots/chapter09/01-quadlet-generated-unit.png)',
    asset: 'docs/assets/images/screenshots/chapter09/01-quadlet-generated-unit.png',
  },
  {
    id: 'figure-actions-workflow-summary',
    title: '図15：GitHub Actions summary',
    source: 'docs/chapters/chapter10/index.md',
    route: '/chapters/chapter10/',
    kind: 'PNG',
    marker: '![GitHub Actionsでcommit・job・artifactが同じ成功runへ対応するか判断する画面](../../assets/images/screenshots/chapter10/01-actions-workflow-summary.png)',
    asset: 'docs/assets/images/screenshots/chapter10/01-actions-workflow-summary.png',
  },
  {
    id: 'figure-kube-round-trip',
    title: '図16：Kubernetes YAML round trip',
    source: 'docs/chapters/chapter11/index.md',
    route: '/chapters/chapter11/',
    kind: 'PNG',
    marker: '![Podから生成したKubernetes YAMLとdown・play後のPod状態を判断する出力](../../assets/images/screenshots/chapter11/01-kube-round-trip.png)',
    asset: 'docs/assets/images/screenshots/chapter11/01-kube-round-trip.png',
  },
  {
    id: 'figure-performance-baseline',
    title: '図17：performance baseline',
    source: 'docs/chapters/chapter12/index.md',
    route: '/chapters/chapter12/',
    kind: 'PNG',
    marker: '![起動時間・image size・storage使用量を変更前baselineとして判断する出力](../../assets/images/screenshots/chapter12/01-performance-baseline.png)',
    asset: 'docs/assets/images/screenshots/chapter12/01-performance-baseline.png',
  },
  {
    id: 'figure-service-network-health',
    title: '図18：service network health',
    source: 'docs/chapters/chapter13/index.md',
    route: '/chapters/chapter13/',
    kind: 'PNG',
    marker: '![複数serviceのcontainer・network・health対応を判断する出力](../../assets/images/screenshots/chapter13/01-service-network-health.png)',
    asset: 'docs/assets/images/screenshots/chapter13/01-service-network-health.png',
  },
  {
    id: 'figure-compliance-availability',
    title: '図19：compliance・availability',
    source: 'docs/chapters/chapter14/index.md',
    route: '/chapters/chapter14/',
    kind: 'PNG',
    marker: '![2 replicaのhealth・read-only・capability・no-new-privileges合否を判断する出力](../../assets/images/screenshots/chapter14/01-compliance-availability.png)',
    asset: 'docs/assets/images/screenshots/chapter14/01-compliance-availability.png',
  },
  {
    id: 'figure-failure-diagnosis-recovery',
    title: '図20：failure diagnosis・recovery',
    source: 'docs/chapters/chapter15/index.md',
    route: '/chapters/chapter15/',
    kind: 'PNG',
    marker: '![port競合の失敗・event・inspect根拠から復旧を判断する出力](../../assets/images/screenshots/chapter15/01-failure-diagnosis-recovery.png)',
    asset: 'docs/assets/images/screenshots/chapter15/01-failure-diagnosis-recovery.png',
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
    errors.push(`figure index links must be the exact ${expectedFigures.length}-item inventory: expected ${expectedLinks.join(', ')}, got ${indexedLinks.join(', ')}`);
  }
  if (indexText.match(/\]\(\{\{\s*'[^']+#figure-/g)?.length !== expectedFigures.length) {
    errors.push(`figure index must contain exactly ${expectedFigures.length} stable-anchor links`);
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
        expectedError: `exact ${expectedFigures.length}-item inventory`,
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

  console.log(`✅ Figure index check passed (${expectedFigures.length} figures: Mermaid 2, PNG 15, SVG 3).`);
}

module.exports = { expectedFigures, validateFigureIndex };
