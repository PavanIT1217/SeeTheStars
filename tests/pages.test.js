// The pre-rendered pages (for search engines) must match what scripts/build-pages.mjs produces now.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPages } from '../scripts/build-pages.mjs';
import { OBJECTS } from '../js/data/catalog.js';

const root = new URL('..', import.meta.url).pathname;
const files = buildPages();

test('pre-rendered pages are up to date (run `npm run pages`)', () => {
  const stale = Object.entries(files).filter(([path, contents]) => {
    try { return readFileSync(join(root, path), 'utf8') !== contents; } catch { return true; }
  }).map(([path]) => path);
  assert.deepEqual(stale, []);
});

test('every object page has its own title, description, canonical URL and structured data', () => {
  const titles = new Set();
  for (const id of Object.keys(OBJECTS)) {
    const html = files[`object/${id}/index.html`];
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `unique title for ${id}`);
    titles.add(title);
    assert.match(html, /<meta name="description" content="[^"]{50,}">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://seethestars\\.webappslab\\.com/object/${id}/">`));
    assert.match(html, /<h1>[^<]+<\/h1>/);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)[1]);
    assert.equal(ld['@context'], 'https://schema.org');
  }
});

test('sitemap lists every indexable page and robots.txt points to it', () => {
  const urls = [...files['sitemap.xml'].matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(urls.length, 5 + 12 + 12 + Object.keys(OBJECTS).length); // home, tonight, library, sky, classroom; sectors; worksheets
  assert.match(files['robots.txt'], /Sitemap: https:\/\/seethestars\.webappslab\.com\/sitemap\.xml/);
});
