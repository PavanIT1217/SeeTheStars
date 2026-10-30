// Pre-renders a static HTML page for every route, so search engines (and people without JavaScript)
// get the full content, title, description, share image and structured data of each page.
// The app takes over in the browser and renders the same markup from js/views.js.
//
//   npm run pages          write the pages, sitemap.xml and robots.txt
//
// GitHub Pages serves them straight from the repository, so commit the output.
// tests/pages.test.js fails if they are out of date.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTORS, OBJECTS, JOURNEY } from '../js/data/catalog.js';
import { PHOTOS } from '../js/data/photos.js';
import { SITE, url, esc, pageMeta, headTags, homeHtml, sectorHtml, objectHtml, libraryHtml, skyLandingHtml, tonightHtml } from '../js/views.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function page(template, route, id, body) {
  return template
    .replace('<!--HEAD-->', headTags(pageMeta(route, id)))
    .replace('<!--VIEWNAME-->', route)
    .replace('<!--VIEW-->', body);
}

// Returns { 'relative/path': contents } for every generated file.
export function buildPages() {
  const template = readFileSync(join(ROOT, 'template.html'), 'utf8');
  const out = {};
  const noindexBody = (title, text) => `<section class="page-head"><h1>${title}</h1><p>${text}</p></section>`;

  out['index.html'] = page(template, 'home', null, homeHtml({ live: false }));
  out['library/index.html'] = page(template, 'library', null, libraryHtml());
  out['sky/index.html'] = page(template, 'sky', null, skyLandingHtml());
  out['tonight/index.html'] = page(template, 'tonight', null, tonightHtml({ live: false }));
  out['me/index.html'] = page(template, 'me', null, noindexBody('My journey', 'Your progress, badges and settings.'));
  for (const s of SECTORS) {
    out[`sector/${s.id}/index.html`] = page(template, 'sector', s.id, sectorHtml(s));
    out[`quiz/${s.id}/index.html`] = page(template, 'quiz', s.id, noindexBody(`${s.title} challenge`, `${s.quiz.length} questions about ${esc(s.subtitle.toLowerCase())}.`));
  }
  for (const { id } of JOURNEY) {
    out[`object/${id}/index.html`] = page(template, 'object', id, objectHtml(OBJECTS[id], { live: false }));
    // Shared Sky Finder links like /sky/saturn/ (canonical: /sky/).
    out[`sky/${id}/index.html`] = page(template, 'sky', id, skyLandingHtml());
  }
  // GitHub Pages serves 404.html for any other path; the app then shows the right page or "Lost in space".
  out['404.html'] = page(template, 'notfound', null, noindexBody('Lost in space', `That page drifted away. <a href="${url.home}">Back to Explore</a>`))
    .replace(/<link rel="canonical"[^>]*>\n\s*/, '')
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex">');

  const entry = (path, img) => `  <url>\n    <loc>${SITE.origin}${path}</loc>${img ? `\n    <image:image><image:loc>${esc(img)}</image:loc></image:image>` : ''}\n  </url>`;
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[
    entry('/'), entry(url.tonight), entry(url.library), entry(url.sky()),
    ...SECTORS.map((s) => entry(url.sector(s.id), PHOTOS[s.cover]?.lg)),
    ...JOURNEY.map(({ id }) => entry(url.object(id), PHOTOS[id]?.lg)),
  ].join('\n')}
</urlset>
`;
  out['robots.txt'] = `User-agent: *\nAllow: /\nDisallow: /me/\nDisallow: /quiz/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`;
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const dir of ['object', 'sector', 'quiz', 'library', 'sky', 'me', 'tonight']) {
    if (existsSync(join(ROOT, dir))) rmSync(join(ROOT, dir), { recursive: true });
  }
  const files = buildPages();
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(ROOT, path)), { recursive: true });
    writeFileSync(join(ROOT, path), contents);
  }
  console.log(`Wrote ${Object.keys(files).length} files.`);
}
