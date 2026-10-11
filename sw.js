// Service worker (web version only – the iOS/Android apps bundle these files directly).
// Every app file is cached on install, so lessons, quizzes, artwork and the Sky Finder work offline.
// Photos the explorer saves live in IndexedDB (see js/media.js); recently viewed ones are kept here briefly.
const VERSION = 'v3';
const SHELL = `stg-shell-${VERSION}`;
const RUNTIME = 'stg-runtime-v1';
const RUNTIME_LIMIT = 40;

// Keep in sync with the files on disk – tests/sw.test.js checks this list.
const APP_FILES = [
  './',
  'css/fonts.css',
  'css/style.css',
  'fonts/JetBrainsMono-latin-ext-tDbv2o-flE.woff2',
  'fonts/JetBrainsMono-latin-tDbv2o-flE.woff2',
  'fonts/Orbitron-latin-yMJRMIlzdp.woff2',
  'fonts/SpaceGrotesk-latin-V8mDoQDjQS.woff2',
  'fonts/SpaceGrotesk-latin-ext-V8mDoQDjQS.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'index.html',
  'js/app.js',
  'js/art.js',
  'js/astro.js',
  'js/data/catalog.js',
  'js/iss.js',
  'js/kidfacts.js',
  'js/media.js',
  'js/sky.js',
  'js/starfield.js',
  'js/store.js',
  'js/timemachine.js',
  'js/vendor/satellite/common-types.js',
  'js/vendor/satellite/constants.js',
  'js/vendor/satellite/dopplerFactor.js',
  'js/vendor/satellite/ext.js',
  'js/vendor/satellite/io.js',
  'js/vendor/satellite/propagation.js',
  'js/vendor/satellite/propagation/SatRec.js',
  'js/vendor/satellite/propagation/check-for-decay.js',
  'js/vendor/satellite/propagation/dpper.js',
  'js/vendor/satellite/propagation/dscom.js',
  'js/vendor/satellite/propagation/dsinit.js',
  'js/vendor/satellite/propagation/dspace.js',
  'js/vendor/satellite/propagation/gstime.js',
  'js/vendor/satellite/propagation/initl.js',
  'js/vendor/satellite/propagation/propagate.js',
  'js/vendor/satellite/propagation/sgp4.js',
  'js/vendor/satellite/propagation/sgp4init.js',
  'js/vendor/satellite/shadow.js',
  'js/vendor/satellite/sun.js',
  'js/vendor/satellite/transforms.js',
  'js/where.js',
  'manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== SHELL && key !== RUNTIME) await caches.delete(key);
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

  // App files: cache first, refreshed in the background.
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('Offline', { status: 503 });
    })());
    return;
  }

  // Wikipedia / Wikimedia: network first, falling back to recently viewed items.
  if (url.host.endsWith('wikipedia.org') || url.host.endsWith('wikimedia.org')) {
    event.respondWith((async () => {
      const runtime = await caches.open(RUNTIME);
      try {
        const res = await fetch(req);
        if (res.ok) runtime.put(req.url, res.clone()).then(() => trim(runtime));
        return res;
      } catch {
        return (await runtime.match(req.url)) || new Response('', { status: 503 });
      }
    })());
  }
});
