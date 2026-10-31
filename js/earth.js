// Places on Earth as Sky Finder targets: landmarks, any town (online search) and tropical cyclones.
// A place is found the same way as a star: by the direction you have to point the phone. For anything beyond
// the horizon that direction goes *through the Earth*, along the straight line (chord) between you and it.
import { PLACES, PLACE_ICON } from './data/places.js';
import { PLACE_PHOTOS } from './data/place-photos.js';

const DEG = Math.PI / 180;
export const EARTH_KM = 6371;
const norm360 = (x) => ((x % 360) + 360) % 360;

// Great-circle distance and the compass bearing you'd set off on, from `a` to `b` ({ lat, lon } in degrees).
export function bearingDistance(a, b) {
  const [p1, p2, dl] = [a.lat * DEG, b.lat * DEG, (b.lon - a.lon) * DEG];
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const angle = 2 * Math.asin(Math.min(1, Math.sqrt(h))); // central angle, radians
  const az = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl));
  return { km: angle * EARTH_KM, az: norm360(az / DEG), angle: angle / DEG };
}

// The point `km` away from `a` on bearing `az`.
export function destination(a, az, km) {
  const d = km / EARTH_KM, t = az * DEG, p1 = a.lat * DEG;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
  const l2 = a.lon * DEG + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return { lat: p2 / DEG, lon: ((l2 / DEG + 540) % 360) - 180 };
}

// Where to point: same bearing, tipped down by half the central angle (the chord through a round Earth).
export function earthHorizontal(place, observer) {
  const { km, az, angle } = bearingDistance(observer, place);
  return { alt: -angle / 2, az, km, earth: true };
}

export const fmtKm = (km) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString('en-US')} km`);

// ---------- targets ----------
// Keys: place-<index> (built-in list), geo:<lat>,<lon>:<name> (online search), storm-<GDACS event id>.
export function placeTarget(key) {
  if (key.startsWith('place-')) {
    const p = PLACES[+key.slice(6)];
    return p && { id: key, chart: true, earth: true, name: p[0], kind: `📍 ${p[3]}`, icon: PLACE_ICON[p[0]] || '🏙️', photo: PLACE_PHOTOS[p[0]] || null, pos: { earth: { lat: p[1], lon: p[2] } } };
  }
  if (key.startsWith('geo:')) {
    const m = key.match(/^geo:(-?[\d.]+),(-?[\d.]+):(.*)$/);
    if (!m) return null;
    const [lat, lon] = [+m[1], +m[2]];
    if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
    const [name, ...rest] = m[3].split(', ');
    return { id: key, chart: true, earth: true, name: name || 'Place', kind: `📍 ${rest.join(', ') || 'A place on Earth'}`, icon: '🏙️', photo: null, pos: { earth: { lat, lon } } };
  }
  if (key.startsWith('storm-')) {
    const s = cachedStorms().find((x) => `storm-${x.id}` === key);
    return s && { id: key, chart: true, earth: true, storm: s, name: s.name, kind: `🌀 ${s.kind}`, pos: { earth: { lat: s.lat, lon: s.lon } } };
  }
  return null;
}

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function searchPlaces(q, limit = 6) {
  const n = fold(q.trim());
  if (n.length < 2) return [];
  const out = [];
  PLACES.forEach((p, i) => {
    const name = fold(p[0]), where = fold(p[3]);
    const s = name.startsWith(n) ? 2 : name.includes(n) ? 1.2 : where.includes(n) ? 0.6 : 0;
    if (s) out.push({ key: `place-${i}`, name: p[0], kind: `📍 ${p[3]}`, s });
  });
  for (const st of cachedStorms()) {
    if (fold(st.name).includes(n) || 'cyclone hurricane typhoon storm'.includes(n)) out.push({ key: `storm-${st.id}`, name: st.name, kind: `🌀 ${st.kind}`, s: 2 });
  }
  return out.sort((a, b) => b.s - a.s).slice(0, limit);
}

// Any town or city in the world, from Open-Meteo's geocoder (GeoNames data). Only the typed text is sent.
export async function searchWorld(q) {
  const json = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&format=json`, 8000);
  return (json.results || []).map((r) => {
    const where = [r.admin1, r.country].filter(Boolean).join(', ');
    return { key: `geo:${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}:${[r.name, where].filter(Boolean).join(', ')}`, name: r.name, kind: `📍 ${where || 'A place on Earth'}` };
  });
}

// ---------- tropical cyclones (GDACS, the UN/EU Global Disaster Alert and Coordination System) ----------
// The event list gives each storm's last observed position (at `todate`); its track file adds the earlier fixes
// and the forecast points (anything after `todate`), which tell us which way it is heading.
const STORM_KEY = 'stg.storms.v2';
const STORM_TTL = 30 * 60e3;
const RECENT_MS = 3 * 86400e3; // keep a storm for 3 days after its last report, marked as "last seen"
const LIST_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC';
let storms = null, stormsAt = 0;

// fetch() with a time limit, so a slow server never leaves the Sky Finder waiting.
export async function fetchJSON(url, ms = 12000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

export function parseStorms(json, now = Date.now()) {
  return (json?.features || []).flatMap((f) => {
    const p = f.properties || {};
    const [lon, lat] = f.geometry?.coordinates || [];
    const at = Date.parse(`${p.todate}Z`);
    if (p.eventtype !== 'TC' || !Number.isFinite(lat) || !Number.isFinite(lon) || !(now - at < RECENT_MS)) return [];
    const wind = Math.round(p.severitydata?.severity || 0);
    // GDACS gives the storm's current class with the strongest wind of its whole life (they can disagree).
    const kind = (p.severitydata?.severitytext || 'Tropical cyclone').replace(/\s*\(.*\)/, '').replace('Hurricane/Typhoon > 74 mph', 'Hurricane / typhoon');
    return [{
      id: p.eventid, episode: p.episodeid, name: (p.name || 'Tropical cyclone').replace(/-\d\d$/, '').replace(/\b([A-Z])([A-Z]+)\b/g, (m, a, b) => a + b.toLowerCase()), lat, lon, at, wind, kind,
      alert: p.alertlevel || 'Green', country: p.country || '', source: p.source || '',
      report: p.url?.report || 'https://www.gdacs.org/', geometry: p.url?.geometry || '',
    }];
  }).sort((a, b) => b.at - a.at);
}

// Track points from a GDACS geometry file: [{ t, lat, lon }] in time order. Each point is a small circle
// labelled "28/10 06:00 UTC"; its centre is the storm's position. The year comes from the last report.
export function parseTrack(json, year) {
  const pts = (json?.features || []).flatMap((f) => {
    const p = f.properties || {};
    const m = String(p.polygonlabel || '').match(/^(\d\d)\/(\d\d) (\d\d):(\d\d) UTC$/);
    if (!m || !String(p.Class || '').startsWith('Point_Polygon_Point')) return [];
    const ring = f.geometry?.type === 'Polygon' ? f.geometry.coordinates[0] : null;
    if (!ring?.length) return [];
    const n = ring.length - (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? 1 : 0);
    let x = 0, y = 0;
    for (let i = 0; i < n; i++) { x += ring[i][0]; y += ring[i][1]; }
    return [{ t: Date.UTC(year, +m[2] - 1, +m[1], +m[3], +m[4]), lat: +(y / n).toFixed(2), lon: +(x / n).toFixed(2) }];
  });
  return pts.sort((a, b) => a.t - b.t);
}

// Which way the storm is going and how fast, from its last two observed positions.
export function stormMotion(storm) {
  const past = (storm.track || []).filter((p) => p.t <= storm.at);
  if (past.length < 2) return null;
  const [a, b] = past.slice(-2);
  const { km, az } = bearingDistance(a, b);
  const hours = (b.t - a.t) / 3600e3;
  return hours > 0 ? { az, kmh: km / hours } : null;
}

export function cachedStorms() {
  if (storms) return storms;
  try {
    const c = JSON.parse(localStorage.getItem(STORM_KEY) || 'null');
    if (c?.storms) { storms = c.storms; stormsAt = c.at; }
  } catch { /* ignore */ }
  return storms || [];
}
export const stormsUpdated = () => (cachedStorms(), stormsAt);

// Fresh storms, or the last good list if GDACS can't be reached (each storm says when it was last seen).
export async function fetchStorms(now = Date.now()) {
  cachedStorms();
  if (storms && now - stormsAt < STORM_TTL) return storms;
  try {
    const list = parseStorms(await fetchJSON(LIST_URL), now);
    await Promise.allSettled(list.filter((s) => s.geometry && now - s.at < 2 * 86400e3).map(async (s) => {
      s.track = parseTrack(await fetchJSON(s.geometry), new Date(s.at).getUTCFullYear());
    }));
    storms = list; stormsAt = now;
    try { localStorage.setItem(STORM_KEY, JSON.stringify({ at: now, storms })); } catch { /* ignore */ }
  } catch (e) {
    if (!storms) throw e;
    storms = storms.filter((s) => now - s.at < RECENT_MS);
  }
  return storms;
}

// Links that open the place in the phone's maps app for real directions.
export function mapsLink({ lat, lon }) {
  const ios = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  return ios ? `https://maps.apple.com/?daddr=${lat},${lon}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}
