// The service worker must precache every file the app needs, or the web version breaks offline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});

test('sw.js precaches every app file', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/^ {2}'([^']+)',$/gm)].map((m) => m[1]));
  const needed = ['index.html', 'manifest.webmanifest', ...['css', 'fonts', 'icons', 'js'].flatMap(walk)]
    .filter((f) => /\.(js|css|woff2|png|svg|html|webmanifest)$/.test(f));
  const missing = needed.filter((f) => !listed.has(f));
  assert.deepEqual(missing, []);
  for (const f of listed) if (f !== './') assert.ok(needed.includes(f), `listed but missing on disk: ${f}`);
});
