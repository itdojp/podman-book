#!/usr/bin/env node
/* Ensure literal template braces remain copyable through GitHub Pages' Liquid pass. */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(repoRoot, 'docs');
const rawOpen = '<!-- {% raw %} -->';
const rawClose = '<!-- {% endraw %} -->';

const requiredSourceMarkers = {
  'docs/chapters/chapter03/index.md': ["$ podman info --format '{{.Host.NetworkBackend}}'"],
  'docs/chapters/chapter09/index.md': ['summary: "Container {{ $labels.name }} is down"'],
  'docs/chapters/chapter10/index.md': [
    'IMAGE_NAME: ${{ github.repository }}',
    'http_requests_total{{app="{self.app_name}",version="{version}",status=~"5.."}}[5m]',
  ],
  'docs/chapters/chapter15/index.md': ["--format '{{.State.ExitCode}}'"],
};

const requiredRenderedMarkers = {
  'chapters/chapter03/index.html': ["$ podman info --format '{{.Host.NetworkBackend}}'"],
  'chapters/chapter09/index.html': ['Container {{ $labels.name }} is down'],
  'chapters/chapter10/index.html': [
    'IMAGE_NAME: ${{ github.repository }}',
    'http_requests_total{{app="{self.app_name}",version="{version}",status=~"5.."}}[5m]',
  ],
  'chapters/chapter15/index.html': ["--format '{{.State.ExitCode}}'"],
};

function markdownFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function fenceBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^\s*(`{3,}|~{3,})/);
    if (!opening) continue;
    const fenceChar = opening[1][0];
    const start = index;
    index += 1;
    while (index < lines.length && !new RegExp(`^\\s*${fenceChar}{3,}\\s*$`).test(lines[index])) index += 1;
    if (index >= lines.length) {
      blocks.push({ start, end: lines.length - 1, closed: false, text: lines.slice(start).join('\n'), lines });
      break;
    }
    blocks.push({ start, end: index, closed: true, text: lines.slice(start, index + 1).join('\n'), lines });
  }
  return blocks;
}

function validateMarkdown(text, sourceLabel = 'markdown') {
  const errors = [];
  const lines = text.split(/\r?\n/);
  const blocks = fenceBlocks(text);

  if (/\\\{\\\{|\\\}\\\}/u.test(text)) {
    errors.push(`${sourceLabel}: escaped double braces remain in the Markdown source`);
  }

  for (const block of blocks) {
    const line = block.start + 1;
    if (!block.closed) {
      errors.push(`${sourceLabel}:${line}: unclosed code fence`);
      continue;
    }
    if (block.text.includes('{{')) {
      if (lines[block.start - 1] !== rawOpen) {
        errors.push(`${sourceLabel}:${line}: literal template block is missing the opening Liquid raw boundary`);
      }
      if (lines[block.end + 1] !== rawClose) {
        errors.push(`${sourceLabel}:${line}: literal template block is missing the closing Liquid raw boundary`);
      }
    }
    const withoutCommentBoundaries = block.text.replaceAll(rawOpen, '').replaceAll(rawClose, '');
    if (withoutCommentBoundaries.includes('{% raw %}') || withoutCommentBoundaries.includes('{% endraw %}')) {
      errors.push(`${sourceLabel}:${line}: raw tag is embedded in copyable code instead of an HTML comment boundary`);
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] === rawOpen && !/^\s*(`{3,}|~{3,})/.test(lines[index + 1] || '')) {
      errors.push(`${sourceLabel}:${index + 1}: opening Liquid raw boundary is not adjacent to a code fence`);
    }
    if (lines[index] === rawClose && !/^\s*(`{3,}|~{3,})\s*$/.test(lines[index - 1] || '')) {
      errors.push(`${sourceLabel}:${index + 1}: closing Liquid raw boundary is not adjacent to a code fence`);
    }
  }
  const opens = lines.filter((line) => line === rawOpen).length;
  const closes = lines.filter((line) => line === rawClose).length;
  if (opens !== closes) errors.push(`${sourceLabel}: Liquid raw boundary count differs (${opens} open, ${closes} close)`);

  return errors;
}

function validateSource() {
  const errors = [];
  let protectedBlocks = 0;
  const files = markdownFiles(docsRoot);
  for (const file of files) {
    const relative = path.relative(repoRoot, file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    errors.push(...validateMarkdown(text, relative));
    protectedBlocks += text.split(rawOpen).length - 1;
  }
  for (const [relative, markers] of Object.entries(requiredSourceMarkers)) {
    const file = path.join(repoRoot, relative);
    if (!fs.existsSync(file)) {
      errors.push(`${relative}: required source file is missing`);
      continue;
    }
    const text = fs.readFileSync(file, 'utf8');
    for (const marker of markers) {
      if (!text.includes(marker)) errors.push(`${relative}: missing literal source marker: ${marker}`);
    }
  }
  return { errors, fileCount: files.length, protectedBlocks };
}

function decodeHtml(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] === '#') {
        const hex = entity[1].toLowerCase() === 'x';
        const value = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
        return Number.isFinite(value) ? String.fromCodePoint(value) : match;
      }
      return Object.prototype.hasOwnProperty.call(named, entity.toLowerCase()) ? named[entity.toLowerCase()] : match;
    })
    .replace(/\r/g, '');
}

function htmlFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function validateRenderedSite(siteRoot) {
  const errors = [];
  if (!fs.existsSync(siteRoot)) return { errors: [`rendered site is missing: ${siteRoot}`], htmlCount: 0 };
  const files = htmlFiles(siteRoot);
  for (const file of files) {
    const relative = path.relative(siteRoot, file).split(path.sep).join('/');
    const renderedText = decodeHtml(fs.readFileSync(file, 'utf8'));
    if (/\\\{\\\{|\\\}\\\}/u.test(renderedText)) {
      errors.push(`${relative}: rendered HTML still contains escaped double braces`);
    }
  }
  for (const [relative, markers] of Object.entries(requiredRenderedMarkers)) {
    const file = path.join(siteRoot, relative);
    if (!fs.existsSync(file)) {
      errors.push(`${relative}: required rendered page is missing`);
      continue;
    }
    const renderedText = decodeHtml(fs.readFileSync(file, 'utf8'));
    for (const marker of markers) {
      if (!renderedText.includes(marker)) errors.push(`${relative}: missing rendered literal marker: ${marker}`);
    }
  }
  return { errors, htmlCount: files.length };
}

function main() {
  const siteFlag = process.argv.indexOf('--site');
  const source = validateSource();
  const errors = [...source.errors];
  let rendered = null;
  if (siteFlag >= 0) {
    const value = process.argv[siteFlag + 1];
    if (!value) errors.push('--site requires a directory');
    else {
      rendered = validateRenderedSite(path.resolve(value));
      errors.push(...rendered.errors);
    }
  }
  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }
  const renderedSummary = rendered ? ` + ${rendered.htmlCount} rendered HTML files` : '';
  console.log(`Literal template rendering contract: OK (${source.protectedBlocks} protected blocks${renderedSummary})`);
}

if (require.main === module) main();

module.exports = { rawOpen, rawClose, validateMarkdown, validateRenderedSite, validateSource };
