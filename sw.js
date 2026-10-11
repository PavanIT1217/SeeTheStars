// Service worker: the whole app (lessons, quizzes, artwork, Sky Finder) is cached on install so it works offline.
// Photos and encyclopedia extracts are cached only when the explorer saves them (cache "stg-saved-v1", written by the page),
// plus a small rolling cache of recently viewed media.
const VERSION = 'v1';
const SHELL = `stg-shell-${VERSION}`;
const RUNTIME = 'stg-runtime-v1';
const SAVED = 'stg-saved-v1';
const RUNTIME_LIMIT = 40;

const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/astro.js', 'js/art.js', 'js/media.js', 'js/sky.js', 'js/starfield.js', 'js/store.js', 'js/timemachine.js',
  'js/data/catalog.js', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('stg-shell-') && key !== SHELL) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - RUNTIME_LIMIT; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // App shell: cache first, refresh in the background.
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('Offline', { status: 503 });
    })());
    return;
  }

  // Fonts: stale-while-revalidate.
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('', { status: 503 });
    })());
    return;
  }

  // Wikipedia / Wikimedia media: saved items first, then network, then the recently-viewed cache.
  if (url.host.endsWith('wikipedia.org') || url.host.endsWith('wikimedia.org')) {
    event.respondWith((async () => {
      const saved = await (await caches.open(SAVED)).match(req.url);
      if (saved) return saved;
      const runtime = await caches.open(RUNTIME);
      try {
        const res = await fetch(req);
        if (res.ok) { runtime.put(req.url, res.clone()).then(() => trim(runtime)); }
        return res;
      } catch {
        return (await runtime.match(req.url)) || new Response('', { status: 503 });
      }
    })());
  }
});
