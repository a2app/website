// Content parity: every piece of visible copy from the legacy single-file site
// must appear, verbatim, in the built page. Run `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const legacyPath = path.join(here, 'fixtures', 'legacy-index.html');
const distPath = path.join(here, '..', 'dist', 'index.html');

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
const squash = (s) => decode(s).replace(/\s+/g, ' ').trim();

// Content deliberately dropped from the new site:
// - the legacy hero's agent.ts snippet — A2App is about plain verbal requests,
//   so the page shows no code at all;
// - the hero's "See It in Action" button — the assembly stage beside the copy
//   is the action, so a link to a lesser demo below it only competed with it.
const OMITTED = [
  /<div class="code-preview[\s\S]*?<div class="code-body">[\s\S]*?<\/div>\s*<\/div>/,
  /<a href="#demo" class="btn-primary">See It in Action<\/a>/,
];

// Text content of the legacy <body>, minus scripts, styles and the omitted
// blocks, as a list of visible strings (text nodes with at least one letter).
function visibleStrings(html) {
  const body = html.slice(html.indexOf('<body'));
  let clean = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const re of OMITTED) clean = clean.replace(re, '');
  return clean
    .split(/<[^>]+>/)
    .map(squash)
    .filter((s) => /[A-Za-z]/.test(s));
}

test('built page exists', () => {
  assert.ok(existsSync(distPath), `expected ${distPath}; run \`npm run build\` first`);
});

test('every visible legacy string appears in the built page', () => {
  const legacy = visibleStrings(readFileSync(legacyPath, 'utf8'));
  const built = squash(readFileSync(distPath, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' '));
  const missing = legacy.filter((s) => !built.includes(s));
  assert.deepEqual(missing, [], `missing legacy copy:\n  ${missing.join('\n  ')}`);
});

test('every legacy section anchor survives', () => {
  const legacy = readFileSync(legacyPath, 'utf8');
  const builtHtml = readFileSync(distPath, 'utf8');
  const ids = [...legacy.matchAll(/<section id="([a-z-]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 10, 'legacy fixture should declare its section ids');
  const missing = ids.filter((id) => !new RegExp(`id="${id}"`).test(builtHtml));
  assert.deepEqual(missing, []);
});

test('every external link from the legacy page is kept', () => {
  const legacy = readFileSync(legacyPath, 'utf8');
  const builtHtml = readFileSync(distPath, 'utf8');
  const hrefs = [...new Set([...legacy.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]))]
    .filter((h) => !h.includes('fonts.googleapis.com'));
  const missing = hrefs.filter((h) => !builtHtml.includes(`href="${h}"`));
  assert.deepEqual(missing, []);
});
