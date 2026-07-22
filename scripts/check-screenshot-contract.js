#!/usr/bin/env node
/* Fail-closed contract for the published, sanitized screenshot inventory. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const EXPECTED_CHAPTERS = Array.from({ length: 15 }, (_, index) => `chapter${String(index + 1).padStart(2, '0')}`);
const MAX_BYTES = 500 * 1024;
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 400;
const FORBIDDEN = [
  { label: 'GitHub token', pattern: /(?:ghp_|github_pat_)[A-Za-z0-9_]+/i },
  { label: 'bearer token', pattern: /Bearer\s+[A-Za-z0-9._-]+/i },
  { label: 'email address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { label: 'absolute home path', pattern: /\/home\/[A-Za-z0-9._-]+/ },
  { label: 'known host name', pattern: /GMKP-OOTA/i },
  { label: 'known user name', pattern: /devuser/i },
  { label: 'organization identity', pattern: /itdojp/i },
  { label: 'account identity', pattern: /ootakazuhiko/i },
  { label: 'IPv4 address', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
];

function readJson(file, errors, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${label} is not readable JSON: ${error.message}`);
    return {};
  }
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return null;
  }
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function listPngFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) return listPngFiles(full);
    return entry.isFile() && entry.name.endsWith('.png') ? [full] : [];
  });
}

function count(text, value) {
  return text.split(value).length - 1;
}

function validateScreenshotContract(repoRoot = path.resolve(__dirname, '..')) {
  const errors = [];
  const screenshotRoot = path.join(repoRoot, 'docs', 'assets', 'images', 'screenshots');
  const manifestPath = path.join(screenshotRoot, 'manifest.json');
  const manifest = readJson(manifestPath, errors, 'manifest');
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];

  const packageJson = readJson(path.join(repoRoot, 'package.json'), errors, 'package.json');
  const expectedScript = 'node scripts/check-screenshot-contract.js && node scripts/check-screenshot-contract-regression.js';
  if (packageJson.scripts?.['check:screenshots'] !== expectedScript) {
    errors.push('package.json must define the complete check:screenshots contract');
  }
  if (!packageJson.scripts?.test?.includes('npm run check:screenshots')) {
    errors.push('package.json test must run check:screenshots');
  }
  for (const workflow of ['.github/workflows/build.yml', '.github/workflows/book-qa.yml']) {
    let text;
    try {
      text = fs.readFileSync(path.join(repoRoot, workflow), 'utf8');
    } catch (error) {
      errors.push(`${workflow} is missing`);
      continue;
    }
    if (!text.includes('name: Screenshot provenance contract check') || !text.includes('run: npm run check:screenshots')) {
      errors.push(`${workflow} must run the screenshot provenance contract`);
    }
  }
  let responsiveCss;
  try {
    responsiveCss = fs.readFileSync(path.join(repoRoot, 'docs/assets/css/responsive-images.css'), 'utf8');
  } catch (error) {
    errors.push('responsive image CSS is missing');
  }
  if (responsiveCss !== undefined && !/img\s*\{[^}]*max-width:\s*100%[^}]*height:\s*auto/s.test(responsiveCss)) {
    errors.push('responsive image CSS must constrain images to the content width');
  }
  for (const layout of ['docs/_layouts/book.html', 'docs/_layouts/default.html']) {
    let text;
    try {
      text = fs.readFileSync(path.join(repoRoot, layout), 'utf8');
    } catch (error) {
      errors.push(`${layout} is missing`);
      continue;
    }
    if (!text.includes("'/assets/css/responsive-images.css' | relative_url")) {
      errors.push(`${layout} must load responsive-images.css`);
    }
  }

  if (manifest.schemaVersion !== 1) errors.push('manifest schemaVersion must be 1');
  if (manifest.issue !== 189) errors.push('manifest issue must be 189');
  if (!/Actual command or public UI output only/.test(manifest.policy || '')) {
    errors.push('manifest policy must prohibit fabricated operational state');
  }
  if (entries.length !== EXPECTED_CHAPTERS.length) {
    errors.push(`manifest entry count: expected ${EXPECTED_CHAPTERS.length}, got ${entries.length}`);
  }

  const ids = new Set();
  const chapters = new Set();
  const files = new Set();
  const hashes = new Set();
  for (const [index, entry] of entries.entries()) {
    const label = entry.id || `entry[${index}]`;
    if (!entry.id || ids.has(entry.id)) errors.push(`${label}: duplicate or missing id`);
    ids.add(entry.id);
    if (!EXPECTED_CHAPTERS.includes(entry.chapter)) errors.push(`${label}: invalid chapter ${JSON.stringify(entry.chapter)}`);
    if (chapters.has(entry.chapter)) errors.push(`${label}: duplicate chapter ${entry.chapter}`);
    chapters.add(entry.chapter);

    const expectedPrefix = `docs/assets/images/screenshots/${entry.chapter}/`;
    const validFilePattern = /^docs\/assets\/images\/screenshots\/chapter\d{2}\/\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;
    if (typeof entry.file !== 'string' || !entry.file.startsWith(expectedPrefix) || !validFilePattern.test(entry.file)) {
      errors.push(`${label}: file must be a PNG below ${expectedPrefix}`);
      continue;
    }
    if (files.has(entry.file)) errors.push(`${label}: duplicate file ${entry.file}`);
    files.add(entry.file);
    const absoluteFile = path.join(repoRoot, entry.file);
    let buffer;
    try {
      buffer = fs.readFileSync(absoluteFile);
    } catch (error) {
      errors.push(`${label}: image is missing: ${entry.file}`);
      continue;
    }
    const dimensions = pngDimensions(buffer);
    if (!dimensions) {
      errors.push(`${label}: image is not a valid PNG with IHDR`);
      continue;
    }
    if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT) {
      errors.push(`${label}: image dimensions ${dimensions.width}x${dimensions.height} are below ${MIN_WIDTH}x${MIN_HEIGHT}`);
    }
    if (buffer.length >= MAX_BYTES) errors.push(`${label}: image is ${buffer.length} bytes; must be below ${MAX_BYTES}`);
    if (entry.width !== dimensions.width || entry.height !== dimensions.height || entry.bytes !== buffer.length) {
      errors.push(`${label}: manifest dimensions/bytes do not match the PNG`);
    }
    const digest = crypto.createHash('sha256').update(buffer).digest('hex');
    if (entry.sha256 !== digest) errors.push(`${label}: SHA-256 does not match the PNG`);
    if (hashes.has(digest)) errors.push(`${label}: duplicate image content hash ${digest}`);
    hashes.add(digest);

    if (!entry.alt || !entry.alt.includes('判断')) errors.push(`${label}: alt must state the reader decision point`);
    if (!entry.caption || !entry.caption.includes(entry.capturedAt || '')) errors.push(`${label}: caption must include capturedAt`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.capturedAt || '')) errors.push(`${label}: capturedAt must use YYYY-MM-DD`);
    if (!entry.captureTimezone || !entry.dateBasis) errors.push(`${label}: captureTimezone and dateBasis are required`);
    if (entry.captureTimezone === 'unknown') {
      if (!entry.caption?.includes('正確な撮影日時は不明')) errors.push(`${label}: unknown capture timezone must be explicit in the caption`);
    } else if (entry.captureTimezone !== 'Asia/Tokyo (UTC+09:00)' || !entry.caption?.includes('（JST）')) {
      errors.push(`${label}: capture timezone must be explicit and consistent with the JST caption`);
    }
    if (!entry.environment || !entry.versions || Object.keys(entry.versions).length === 0) {
      errors.push(`${label}: environment and versions are required`);
    }
    if (!['terminal-output', 'web-ui'].includes(entry.sourceKind)) errors.push(`${label}: invalid sourceKind`);
    if (!Array.isArray(entry.sourceCommands) || entry.sourceCommands.length === 0) errors.push(`${label}: sourceCommands are required`);
    if (!Array.isArray(entry.maskedFields)) errors.push(`${label}: maskedFields must be an array`);

    const chapterFile = path.join(repoRoot, 'docs', 'chapters', entry.chapter, 'index.md');
    let chapterText;
    try {
      chapterText = fs.readFileSync(chapterFile, 'utf8');
    } catch (error) {
      errors.push(`${label}: chapter source is missing`);
    }
    if (chapterText !== undefined) {
      const relativeReference = `../../assets/images/screenshots/${entry.chapter}/${path.basename(entry.file)}`;
      const marker = `![${entry.alt}](${relativeReference})\n\n_${entry.caption}_`;
      if (count(chapterText, relativeReference) !== 1) errors.push(`${label}: chapter must reference the image exactly once`);
      if (count(chapterText, marker) !== 1) errors.push(`${label}: alt and immediate caption must match the manifest`);
    }

    const sensitiveText = JSON.stringify(entry);
    for (const forbidden of FORBIDDEN) {
      if (forbidden.pattern.test(sensitiveText)) errors.push(`${label}: ${forbidden.label} remains in published metadata`);
    }
  }

  for (const chapter of EXPECTED_CHAPTERS) {
    if (!chapters.has(chapter)) errors.push(`manifest is missing ${chapter}`);
  }

  const inventoryFiles = listPngFiles(screenshotRoot)
    .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'))
    .sort();
  const manifestFiles = [...files].sort();
  for (const file of inventoryFiles) if (!files.has(file)) errors.push(`untracked screenshot PNG: ${file}`);
  for (const file of manifestFiles) if (!inventoryFiles.includes(file)) errors.push(`manifest references absent screenshot PNG: ${file}`);

  return errors;
}

if (require.main === module) {
  const errors = validateScreenshotContract();
  if (errors.length) {
    console.error(`Screenshot contract failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Screenshot contract passed: ${EXPECTED_CHAPTERS.length} chapters, unique PNG/hash/reference, sanitized provenance.`);
}

module.exports = { validateScreenshotContract };
