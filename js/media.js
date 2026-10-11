// Photos come from Wikimedia Commons (see data/photos.js) and encyclopedia extracts from Wikipedia, on demand.
// Explorers choose what to keep offline: saved items (extract + photo) are stored in IndexedDB,
// which works in browsers and inside the iOS/Android apps.
import { OBJECTS } from './data/catalog.js';
import { PHOTOS } from './data/photos.js';

const DB_NAME = 'stg-media';
const STORE = 'saved';
const INDEX_KEY = 'stg.saved.v1';
const memory = new Map();
const objectUrls = new Map();

const summaryUrl = (obj) => `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(obj.wiki.replace(/ /g, '_'))}`;

// A small synchronous index (id -> size) so lists can show saved state instantly.
function readIndex() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}'); } catch { return {}; }
}
function writeIndex(index) {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* ignore */ }
}

export const savedIndex = readIndex;
export const isSaved = (id) => !!readIndex()[id];

// ---- IndexedDB helpers ----
let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}
const dbGet = (id) => tx('readonly', (s) => s.get(id));
const dbPut = (id, value) => tx('readwrite', (s) => s.put(value, id));
const dbDelete = (id) => tx('readwrite', (s) => s.delete(id));

const photoUrl = (obj) => PHOTOS[obj.id]?.lg || null;

async function fetchSummary(obj) {
  const res = await fetch(summaryUrl(obj), { mode: 'cors' });
  if (!res.ok) throw new Error(`summary ${res.status}`);
  return res.json();
}

function fromSaved(id, rec) {
  if (rec.image && !objectUrls.has(id)) objectUrls.set(id, URL.createObjectURL(rec.image));
  return { image: objectUrls.get(id) || null, extract: rec.extract, url: rec.url };
}

// Returns { image, extract, url } or null when offline and not saved.
export async function getMedia(obj) {
  if (memory.has(obj.id)) return memory.get(obj.id);
  try {
    if (isSaved(obj.id)) {
      const rec = await dbGet(obj.id);
      if (rec) { const m = fromSaved(obj.id, rec); memory.set(obj.id, m); return m; }
      await removeOffline(obj.id); // index entry without data (e.g. saved by an older version)
    }
  } catch { /* fall back to the network */ }
  try {
    const s = await fetchSummary(obj);
    const media = { image: photoUrl(obj), extract: s.extract, url: s.content_urls?.mobile?.page || s.content_urls?.desktop?.page };
    memory.set(obj.id, media);
    return media;
  } catch {
    return null;
  }
}

export async function saveForOffline(obj) {
  const s = await fetchSummary(obj);
  const imageUrl = photoUrl(obj);
  let image = null;
  if (imageUrl) {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`image ${res.status}`);
    image = await res.blob();
  }
  const rec = { extract: s.extract, url: s.content_urls?.mobile?.page || s.content_urls?.desktop?.page, image, at: Date.now() };
  await dbPut(obj.id, rec);
  const bytes = (image?.size || 0) + (rec.extract?.length || 0);
  const index = readIndex();
  index[obj.id] = { bytes, at: rec.at };
  writeIndex(index);
  memory.delete(obj.id);
  navigator.storage?.persist?.(); // ask the browser not to evict saved items
  return bytes;
}

export async function removeOffline(id) {
  const index = readIndex();
  delete index[id];
  writeIndex(index);
  memory.delete(id);
  if (objectUrls.has(id)) { URL.revokeObjectURL(objectUrls.get(id)); objectUrls.delete(id); }
  try { await dbDelete(id); } catch { /* already gone */ }
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
