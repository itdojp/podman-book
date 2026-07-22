#!/usr/bin/env node
/* Mutation regression for the fail-closed screenshot contract. */
const fs = require('fs');
const path = require('path');
const { validateScreenshotContract } = require('./check-screenshot-contract');

const repoRoot = path.resolve(__dirname, '..');
const cacheRoot = path.join(repoRoot, 'node_modules', '.cache');
fs.mkdirSync(cacheRoot, { recursive: true });
const fixtureRoot = fs.mkdtempSync(path.join(cacheRoot, 'podman-screenshot-contract-'));

function copy(relativePath) {
  const source = path.join(repoRoot, relativePath);
  const target = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), 'utf8'));
}

function writeManifest(value) {
  fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), `${JSON.stringify(value, null, 2)}\n`);
}

function expectFailure(name, evidence, mutate, restore) {
  mutate();
  try {
    const errors = validateScreenshotContract(fixtureRoot);
    if (!errors.some((error) => error.includes(evidence))) {
      throw new Error(`${name}: expected ${JSON.stringify(evidence)}, got:\n${errors.join('\n')}`);
    }
  } finally {
    restore();
  }
}

function expectDirectFailureOnly(name, evidence, derivedEvidence, mutate, restore) {
  mutate();
  try {
    const errors = validateScreenshotContract(fixtureRoot);
    if (!errors.some((error) => error.includes(evidence))) {
      throw new Error(`${name}: expected ${JSON.stringify(evidence)}, got:\n${errors.join('\n')}`);
    }
    if (errors.some((error) => error.includes(derivedEvidence))) {
      throw new Error(`${name}: unexpected derived diagnostic ${JSON.stringify(derivedEvidence)}:\n${errors.join('\n')}`);
    }
  } finally {
    restore();
  }
}

copy('docs/assets/images/screenshots');
copy('docs/chapters');
copy('package.json');
copy('.github/workflows/build.yml');
copy('.github/workflows/book-qa.yml');
copy('docs/assets/css/responsive-images.css');
copy('docs/_layouts/book.html');
copy('docs/_layouts/default.html');
const baselineManifest = fs.readFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), 'utf8');
let passed = 0;

try {
  const cases = [
    ['package integration drift', 'complete check:screenshots contract',
      () => { const p = path.join(fixtureRoot, 'package.json'); const v = JSON.parse(fs.readFileSync(p, 'utf8')); v.scripts['check:screenshots'] = 'true'; fs.writeFileSync(p, `${JSON.stringify(v, null, 2)}\n`); },
      () => fs.copyFileSync(path.join(repoRoot, 'package.json'), path.join(fixtureRoot, 'package.json'))],
    ['responsive layout drift', 'must load responsive-images.css',
      () => { const p = path.join(fixtureRoot, 'docs/_layouts/book.html'); const v = fs.readFileSync(p, 'utf8').replace("    <link rel=\"stylesheet\" href=\"{{ '/assets/css/responsive-images.css' | relative_url }}\">\n", ''); fs.writeFileSync(p, v); },
      () => fs.copyFileSync(path.join(repoRoot, 'docs/_layouts/book.html'), path.join(fixtureRoot, 'docs/_layouts/book.html'))],
    ['missing manifest entry', 'manifest entry count',
      () => { const m = readManifest(); m.entries.pop(); writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
    ['duplicate id', 'duplicate or missing id',
      () => { const m = readManifest(); m.entries[1].id = m.entries[0].id; writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
    ['digest drift', 'SHA-256 does not match',
      () => { const m = readManifest(); m.entries[0].sha256 = '0'.repeat(64); writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
    ['dimension drift', 'dimensions/bytes do not match',
      () => { const m = readManifest(); m.entries[0].width += 1; writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
    ['source kind drift', 'invalid sourceKind',
      () => { const m = readManifest(); m.entries[0].sourceKind = 'fabricated'; writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
    ['capture timezone drift', 'capture timezone must be explicit',
      () => { const m = readManifest(); m.entries[0].captureTimezone = 'UTC'; writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
    ['sensitive version metadata', 'organization identity remains',
      () => { const m = readManifest(); m.entries[0].versions.build = 'itdojp-internal'; writeManifest(m); },
      () => fs.writeFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/manifest.json'), baselineManifest)],
  ];
  for (const [name, evidence, mutate, restore] of cases) {
    expectFailure(name, evidence, mutate, restore);
    passed += 1;
  }

  const buildWorkflow = path.join(fixtureRoot, '.github/workflows/build.yml');
  expectDirectFailureOnly(
    'missing workflow reports one actionable cause',
    '.github/workflows/build.yml is missing',
    '.github/workflows/build.yml must run the screenshot provenance contract',
    () => fs.rmSync(buildWorkflow, { force: true }),
    () => fs.copyFileSync(path.join(repoRoot, '.github/workflows/build.yml'), buildWorkflow),
  );
  passed += 1;

  const responsiveCss = path.join(fixtureRoot, 'docs/assets/css/responsive-images.css');
  expectDirectFailureOnly(
    'missing responsive CSS reports one actionable cause',
    'responsive image CSS is missing',
    'responsive image CSS must constrain images to the content width',
    () => fs.rmSync(responsiveCss, { force: true }),
    () => fs.copyFileSync(path.join(repoRoot, 'docs/assets/css/responsive-images.css'), responsiveCss),
  );
  passed += 1;

  const bookLayout = path.join(fixtureRoot, 'docs/_layouts/book.html');
  expectDirectFailureOnly(
    'missing layout reports one actionable cause',
    'docs/_layouts/book.html is missing',
    'docs/_layouts/book.html must load responsive-images.css',
    () => fs.rmSync(bookLayout, { force: true }),
    () => fs.copyFileSync(path.join(repoRoot, 'docs/_layouts/book.html'), bookLayout),
  );
  passed += 1;

  const chapterFile = path.join(fixtureRoot, 'docs/chapters/chapter01/index.md');
  const baselineChapter = fs.readFileSync(chapterFile, 'utf8');
  expectFailure(
    'missing chapter reference',
    'chapter must reference the image exactly once',
    () => fs.writeFileSync(chapterFile, baselineChapter.replace('../../assets/images/screenshots/chapter01/01-daemonless-process-audit.png', '../../assets/images/screenshots/chapter01/missing.png')),
    () => fs.writeFileSync(chapterFile, baselineChapter),
  );
  passed += 1;

  expectFailure(
    'alt drift',
    'alt and immediate caption must match',
    () => fs.writeFileSync(chapterFile, baselineChapter.replace('Podmanのdaemon常駐有無とrootless実行境界を判断する出力', '単なる画面')),
    () => fs.writeFileSync(chapterFile, baselineChapter),
  );
  passed += 1;

  const extra = path.join(fixtureRoot, 'docs/assets/images/screenshots/chapter01/untracked.png');
  expectFailure(
    'untracked PNG',
    'untracked screenshot PNG',
    () => fs.copyFileSync(path.join(fixtureRoot, 'docs/assets/images/screenshots/chapter01/01-daemonless-process-audit.png'), extra),
    () => fs.rmSync(extra, { force: true }),
  );
  passed += 1;

  const imageFile = path.join(fixtureRoot, 'docs/assets/images/screenshots/chapter01/01-daemonless-process-audit.png');
  const baselineImage = fs.readFileSync(imageFile);
  expectFailure(
    'invalid PNG',
    'not a valid PNG',
    () => fs.writeFileSync(imageFile, Buffer.from('not a png')),
    () => fs.writeFileSync(imageFile, baselineImage),
  );
  passed += 1;

  const finalErrors = validateScreenshotContract(fixtureRoot);
  if (finalErrors.length) throw new Error(`Restored fixture failed:\n${finalErrors.join('\n')}`);
  console.log(`Screenshot contract regression passed: ${passed}/${passed} negative mutations, 1/1 restored baseline.`);
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
