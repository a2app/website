// Content parity: every piece of visible copy from the legacy single-file site
// must appear, verbatim, in the built page. Run `npm run build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const legacyPath = path.join(here, 'fixtures', 'legacy-index.html');

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
const squash = (s) => decode(s).replace(/\s+/g, ' ').trim();

// Content deliberately dropped from the new site:
// - the legacy hero's agent.ts snippet — A2App is about plain verbal requests,
//   so the page shows no code at all;
// - the Demo section's Forms and Data Views tabs — the section now shows one
//   real, running app (charts) instead of three mockups;
// - the "Inspired by A2UI. Built with Makepad 2.0." (protocol) section — hidden;
// - the "Trusted Webviews" (trust) section, and its nav link — hidden.
const OMITTED = [
  /<div class="code-preview[\s\S]*?<div class="code-body">[\s\S]*?<\/div>\s*<\/div>/,
  /<div class="demo-tabs">[\s\S]*?<\/div>/,
  /<div class="demo-panel" id="panel-1">[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>\s*<\/div>/,
  /<div class="demo-panel" id="panel-2">[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>\s*<\/div>/,
  /<section id="protocol">[\s\S]*?<\/section>/,
  /<section id="trust">[\s\S]*?<\/section>/,
  /<a href="#trust">Trust<\/a>/,
];

// The legacy <body> minus scripts, styles and the omitted blocks.
function legacyBody() {
  const html = readFileSync(legacyPath, 'utf8');
  let clean = html.slice(html.indexOf('<body')).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const re of OMITTED) clean = clean.replace(re, '');
  return clean;
}

// Visible strings (text nodes with at least one letter).
const visibleStrings = (html) => html.split(/<[^>]+>/).map(squash).filter((s) => /[A-Za-z]/.test(s));

// Legacy content may land on either built page: the index or the live demos page.
const builtPages = ['index.html', 'demos.html'].map((f) => path.join(here, '..', 'dist', f));
const builtHtml = () => builtPages.map((f) => readFileSync(f, 'utf8')).join('\n');

test('built pages exist', () => {
  for (const f of builtPages) assert.ok(existsSync(f), `expected ${f}; run \`npm run build\` first`);
});

test('every visible legacy string appears in the built pages', () => {
  const legacy = visibleStrings(legacyBody());
  const built = squash(builtHtml().replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' '));
  const missing = legacy.filter((s) => !built.includes(s));
  assert.deepEqual(missing, [], `missing legacy copy:\n  ${missing.join('\n  ')}`);
});

test('every legacy section anchor survives', () => {
  const ids = [...legacyBody().matchAll(/<section id="([a-z-]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 9, 'legacy fixture should declare its section ids');
  const built = builtHtml();
  const missing = ids.filter((id) => !new RegExp(`id="${id}"`).test(built));
  assert.deepEqual(missing, []);
});

test('every external link from the legacy page is kept', () => {
  const hrefs = [...new Set([...legacyBody().matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]))];
  const built = builtHtml();
  const missing = hrefs.filter((h) => !built.includes(`href="${h}"`));
  assert.deepEqual(missing, []);
});
