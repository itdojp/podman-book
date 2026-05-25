#!/usr/bin/env node
/* Validate publication metadata and configured routes for the Podman book. */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(repoRoot, 'docs');
const expectedRepo = 'itdojp/podman-book';
const expectedRepoUrl = `https://github.com/${expectedRepo}`;
const expectedHomepage = 'https://itdojp.github.io/podman-book/';
const expectedOrigin = 'https://itdojp.github.io';
const expectedBaseurl = '/podman-book';
const requiredAssets = [
  'assets/css/main.css',
  'assets/css/search.css',
  'assets/css/syntax-highlighting.css',
  'assets/js/theme.js',
  'assets/js/search.js',
  'assets/js/code-copy-lightweight.js',
];

const errors = [];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, rel), 'utf8'));
}

function parseScalar(value) {
  const trimmed = String(value || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseSimpleYaml(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || /^\s/.test(line) || trimmed.startsWith('-')) continue;
    const idx = trimmed.indexOf(':');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (value) out[key] = parseScalar(value);
  }
  return out;
}

function parseFrontMatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) return {};
  const out = {};
  for (const line of text.slice(4, end).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx < 0) continue;
    out[trimmed.slice(0, idx).trim()] = parseScalar(trimmed.slice(idx + 1));
  }
  return out;
}

function parseNavigation(file) {
  const entries = [];
  let current = null;
  const flush = () => {
    if (current?.fields.title && current?.fields.path) {
      entries.push({
        title: current.fields.title,
        path: current.fields.path,
        titleLine: current.lines.title,
        pathLine: current.lines.path,
      });
    }
    current = null;
  };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (!line.trim() || line.trim().startsWith('#')) return;
    const indent = line.match(/^ */)[0].length;
    const trimmed = line.trim();
    const itemMatch = trimmed.match(/^-\s+(title|path):\s*(.+)$/);
    if (itemMatch) {
      flush();
      current = { indent, fields: { [itemMatch[1]]: parseScalar(itemMatch[2]) }, lines: { [itemMatch[1]]: lineNo } };
      return;
    }
    if (trimmed.startsWith('- ')) {
      flush();
      return;
    }
    const fieldMatch = trimmed.match(/^(title|path):\s*(.+)$/);
    if (fieldMatch && current && indent > current.indent) {
      current.fields[fieldMatch[1]] = parseScalar(fieldMatch[2]);
      current.lines[fieldMatch[1]] = lineNo;
    }
  });
  flush();
  return entries;
}

function normalizeRepoUrl(url) {
  return String(url || '').replace(/\/$/, '').replace(/\.git$/, '');
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) errors.push(`${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function isMalformedPath(value) {
  return /[\0\r\n\\]/.test(value);
}

function candidatesForPublicPath(publicPath) {
  if (typeof publicPath !== 'string' || !publicPath.trim()) {
    errors.push('configured path is missing');
    return [];
  }
  const value = publicPath.trim();
  if (/^(https?:|mailto:)/.test(value)) return [];
  if (!value.startsWith('/')) {
    errors.push(`configured path must start with '/': ${value}`);
    return [];
  }
  if (value.includes('?') || value.includes('#') || isMalformedPath(value)) {
    errors.push(`configured path is malformed: ${JSON.stringify(value)}`);
    return [];
  }
  const parts = value.split('/').filter(Boolean);
  if (parts.includes('..')) {
    errors.push(`configured path must not contain '..': ${value}`);
    return [];
  }
  if (value === '/') return [path.join(docsRoot, 'index.md')];
  const rel = value.replace(/^\//, '').replace(/\/$/, '');
  if (/\.(md|html?|pdf|txt)$/i.test(rel)) return [path.join(docsRoot, rel)];
  return [path.join(docsRoot, `${rel}.md`), path.join(docsRoot, rel, 'index.md')];
}

function existingCandidate(candidates, label) {
  for (const candidate of candidates) {
    let resolved;
    try {
      resolved = fs.realpathSync(candidate);
    } catch {
      continue;
    }
    const rel = path.relative(fs.realpathSync(docsRoot), resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      errors.push(`${label} target escapes docs tree: ${candidate}`);
      return null;
    }
    const stat = fs.statSync(resolved);
    if (stat.isFile() && stat.size > 0) return resolved;
  }
  if (candidates.length) {
    errors.push(`${label} target does not exist in docs: ${candidates.map((c) => path.relative(repoRoot, c)).join(', ')}`);
  }
  return null;
}

function flattenStructure(structure) {
  const entries = [];
  for (const section of ['chapters', 'appendices']) {
    for (const item of structure?.[section] || []) entries.push({ section, ...item });
  }
  if (structure?.afterword) entries.push({ section: 'afterword', ...structure.afterword });
  return entries;
}

const book = readJson('book-config.json');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const rootConfig = parseSimpleYaml(path.join(repoRoot, '_config.yml'));
const docsConfig = parseSimpleYaml(path.join(docsRoot, '_config.yml'));
const indexFrontMatter = parseFrontMatter(path.join(docsRoot, 'index.md'));
const navEntries = parseNavigation(path.join(docsRoot, '_data', 'navigation.yml'));
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');

expectEqual('package.json name', pkg.name, 'podman-book');
expectEqual('package.json version', pkg.version, book.version);
expectEqual('package.json description', pkg.description, book.description);
expectEqual('package.json author', pkg.author, book.author);
expectEqual('package.json license', pkg.license, book.license);
expectEqual('package.json repository.url', normalizeRepoUrl(pkg.repository?.url), expectedRepoUrl);
expectEqual('package.json homepage', pkg.homepage, expectedHomepage);
expectEqual('package.json bugs.url', pkg.bugs?.url, `${expectedRepoUrl}/issues`);
expectEqual('package-lock root name', lock.packages?.['']?.name, pkg.name);
expectEqual('package-lock root version', lock.packages?.['']?.version, pkg.version);
expectEqual('package-lock root license', lock.packages?.['']?.license, pkg.license);

expectEqual('book-config repository.url', normalizeRepoUrl(book.repository?.url), expectedRepoUrl);
expectEqual('book-config repository.branch', book.repository?.branch, 'main');
expectEqual('book-config homepage', book.homepage, expectedHomepage);

for (const [label, cfg] of [['root _config.yml', rootConfig], ['docs/_config.yml', docsConfig]]) {
  expectEqual(`${label} title`, cfg.title, book.title);
  expectEqual(`${label} description`, cfg.description, book.description);
  expectEqual(`${label} author`, cfg.author, book.author);
  expectEqual(`${label} version`, cfg.version, book.version);
  expectEqual(`${label} lang`, cfg.lang, book.language);
  expectEqual(`${label} repository`, cfg.repository, expectedRepo);
}
expectEqual('docs/_config.yml url', docsConfig.url, expectedOrigin);
expectEqual('docs/_config.yml baseurl', docsConfig.baseurl, expectedBaseurl);

for (const [key, expected] of Object.entries({
  title: book.title,
  description: book.description,
  author: book.author,
  version: book.version,
  permalink: '/',
})) {
  expectEqual(`docs/index.md front matter ${key}`, indexFrontMatter[key], expected);
}

if (!readme.includes(expectedHomepage)) errors.push(`README.md must include canonical Pages URL: ${expectedHomepage}`);
if (!readme.includes(book.title)) errors.push('README.md must include canonical book title');

const structureEntries = flattenStructure(book.structure);
const seenIds = new Map();
const seenPaths = new Map();
structureEntries.forEach((item) => {
  if (!item.id) errors.push(`book-config ${item.section} entry is missing id`);
  if (!item.path) errors.push(`book-config ${item.id || item.title} is missing path`);
  if (item.id) {
    if (seenIds.has(item.id)) errors.push(`duplicated book-config id: ${item.id}`);
    seenIds.set(item.id, true);
  }
  if (item.path) {
    if (seenPaths.has(item.path)) errors.push(`duplicated book-config path: ${item.path}`);
    seenPaths.set(item.path, true);
    existingCandidate(candidatesForPublicPath(item.path), `book-config ${item.id}`);
  }
});

const navPathSet = new Set();
navEntries.forEach((entry) => {
  if (navPathSet.has(entry.path)) errors.push(`duplicated navigation path: ${entry.path}`);
  navPathSet.add(entry.path);
  existingCandidate(candidatesForPublicPath(entry.path), `navigation line ${entry.pathLine}`);
});
for (const item of structureEntries) {
  if (item.path && item.section !== 'afterword' && !navPathSet.has(item.path)) {
    errors.push(`book-config path is not present in docs navigation: ${item.path}`);
  }
}

for (const asset of requiredAssets) {
  const assetPath = path.join(docsRoot, asset);
  if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile() || fs.statSync(assetPath).size === 0) {
    errors.push(`required public asset is missing or empty: docs/${asset}`);
  }
}

if (errors.length) {
  console.error('Metadata consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`✅ Metadata consistency check passed (${structureEntries.length} configured pages, ${navEntries.length} navigation paths, ${requiredAssets.length} assets).`);
