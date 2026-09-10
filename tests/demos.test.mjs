// Every demo in the manifest must have its wasm staged, a poster, and an
// entry in the shared host page; the built /demos page must list it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const demos = JSON.parse(readFileSync(path.join(root, 'src/data/demos.json'), 'utf8'));
const runHtml = readFileSync(path.join(root, 'public/demos/run.html'), 'utf8');

const magic = (file, n) => {
  const fd = openSync(file, 'r');
  const buf = Buffer.alloc(n);
  readSync(fd, buf, 0, n, 0);
  closeSync(fd);
  return buf;
};

test('manifest is well formed', () => {
  assert.ok(demos.length >= 1);
  for (const d of demos) for (const k of ['id', 'title', 'say', 'blurb', 'width', 'height', 'source']) assert.ok(d[k], `${d.id ?? '?'} missing ${k}`);
});

for (const d of demos) {
  test(`${d.id}: gzipped wasm is staged`, () => {
    const file = path.join(root, 'public/demos/wasm', `${d.id}.wasm.gz`);
    assert.ok(existsSync(file), `missing ${file}; run scripts/build-demos.sh`);
    const m = magic(file, 2);
    assert.deepEqual([m[0], m[1]], [0x1f, 0x8b], 'not gzip');
  });
  test(`${d.id}: poster exists`, () => {
    assert.ok(existsSync(path.join(root, 'public/demos/posters', `${d.id}.webp`)));
  });
  test(`${d.id}: host page knows the app`, () => {
    assert.match(runHtml, new RegExp(`\\b${d.id}:\\s*\\{`));
  });
}

test('shared runtime is staged', () => {
  for (const f of ['makepad_platform/web_gl.js', 'makepad_platform/web.js', 'makepad_wasm_bridge/wasm_bridge.js', 'makepad_widgets/resources/IBMPlexSans-Text.ttf']) {
    assert.ok(existsSync(path.join(root, 'public/demos', f)), `missing public/demos/${f}`);
  }
});

test('built /demos page lists every demo', () => {
  const dist = path.join(root, 'dist', 'demos.html');
  assert.ok(existsSync(dist), 'run `npm run build` first');
  const html = readFileSync(dist, 'utf8');
  for (const d of demos) assert.ok(html.includes(`data-embed="${d.id}"`), `${d.id} not embedded`);
});
