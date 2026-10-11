// Photos and encyclopedia extracts come from Wikipedia on demand. Explorers choose what to keep offline:
// saved items live in the Cache API ("stg-saved"), which the service worker serves first when offline.
import { OBJECTS } from './data/catalog.js';

export const SAVED_CACHE = 'stg-saved-v1';
const INDEX_KEY = 'stg.saved.v1';
const IMG_WIDTH = 960;
const memory = new Map();

const summaryUrl = (obj) => `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(obj.wiki.replace(/ /g, '_'))}`;

function readIndex() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}'); } catch { return {}; }
}
function writeIndex(index) {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* ignore */ }
}

export const savedIndex = readIndex;
export const isSaved = (id) => !!readIndex()[id];

// Wikipedia serves resized thumbnails by rewriting the "/NNNpx-" part of the URL.
function sizedImage(summary) {
  const thumb = summary.thumbnail?.source;
  const orig = summary.originalimage;
  if (!thumb) return null;
  if (orig && orig.width <= IMG_WIDTH) return orig.source;
  return thumb.replace(/\/\d+px-/, `/${IMG_WIDTH}px-`);
}

async function cachedFetch(url) {
  if ('caches' in window) {
    const hit = await (await caches.open(SAVED_CACHE)).match(url);
    if (hit) return hit;
  }
  return fetch(url, { mode: 'cors' });
}

// Returns { image, extract, url } or null when offline and not saved.
export async function getMedia(obj) {
  if (memory.has(obj.id)) return memory.get(obj.id);
  try {
    const res = await cachedFetch(summaryUrl(obj));
    if (!res.ok) throw new Error(res.status);
    const s = await res.json();
    const media = { image: sizedImage(s), extract: s.extract, url: s.content_urls?.mobile?.page || s.content_urls?.desktop?.page };
    memory.set(obj.id, media);
    return media;
  } catch {
    return null;
  }
}

async function putInCache(cache, url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  const blob = await res.clone().blob();
  await cache.put(url, res);
  return blob.size;
}

export async function saveForOffline(obj) {
  const cache = await caches.open(SAVED_CACHE);
  let bytes = await putInCache(cache, summaryUrl(obj));
  memory.delete(obj.id);
  const media = await getMedia(obj);
  if (media?.image) bytes += await putInCache(cache, media.image);
  const index = readIndex();
  index[obj.id] = { bytes, image: media?.image || null, at: Date.now() };
  writeIndex(index);
  navigator.storage?.persist?.(); // ask the browser not to evict saved items
  return bytes;
}

export async function removeOffline(id) {
  const index = readIndex();
  const entry = index[id];
  if (!entry) return;
  const cache = await caches.open(SAVED_CACHE);
  await cache.delete(summaryUrl(OBJECTS[id]));
  if (entry.image) await cache.delete(entry.image);
  delete index[id];
  writeIndex(index);
}

export async function saveMany(ids, onProgress = () => {}) {
  let done = 0, failed = 0;
  for (const id of ids) {
    if (!isSaved(id)) {
      try { await saveForOffline(OBJECTS[id]); } catch { failed++; }
    }
    onProgress(++done, ids.length);
  }
  return { failed };
}

export function savedBytes() {
  return Object.values(readIndex()).reduce((n, e) => n + (e.bytes || 0), 0);
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
