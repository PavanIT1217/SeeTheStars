// Satellite tracking (ISS, Tiangong, Hubble) with SGP4 (satellite.js). Orbit data (a "TLE") is refreshed from
// CelesTrak when online and remembered on the device; a bundled copy is the last resort.
import { twoline2satrec } from './vendor/satellite/io.js';
import { propagate, gstime } from './vendor/satellite/propagation.js';
import { eciToEcf, eciToGeodetic, ecfToLookAngles, degreesLat, degreesLong } from './vendor/satellite/transforms.js';
import { sunPos } from './vendor/satellite/sun.js';
import { shadowFraction } from './vendor/satellite/shadow.js';
import { jday } from './vendor/satellite/ext.js';
import { horizontalFor } from './astro.js';

const TLE_URL = (catnr) => `https://celestrak.org/NORAD/elements/gp.php?CATNR=${catnr}&FORMAT=TLE`;
const REFRESH_MS = 12 * 3600e3;
const DEG = Math.PI / 180;

// Satellites bright enough to see with your own eyes, with bundled orbit data as a last resort.
export const SATELLITES = {
  iss: {
    name: 'International Space Station', short: 'ISS', catnr: 25544, key: 'stg.iss.tle.v1',
    l1: '1 25544U 98067A   26284.17638745  .00009430  00000+0  18014-3 0  9995',
    l2: '2 25544  51.6312  86.0933 0006713 248.1316 111.8959 15.48821882589734',
    fetchedAt: Date.UTC(2026, 9, 11),
  },
  tiangong: {
    name: 'Tiangong space station', short: 'Tiangong', catnr: 48274, key: 'stg.sat.48274.v1',
    l1: '1 48274U 21035A   26302.83066373  .00006003  00000+0  72695-4 0  9996',
    l2: '2 48274  41.4690 223.9968 0003720 232.1880 127.8622 15.61232232314199',
    fetchedAt: Date.UTC(2026, 9, 30),
  },
  hubble: {
    name: 'Hubble Space Telescope', short: 'Hubble', catnr: 20580, key: 'stg.sat.20580.v1',
    l1: '1 20580U 90037B   26302.97284593  .00004615  00000+0  13722-3 0  9997',
    l2: '2 20580  28.4733 238.4064 0001801 206.5186 153.5318 15.32118600809256',
    fetchedAt: Date.UTC(2026, 9, 30),
  },
};

const tles = {};
const satrecs = {};
for (const id of Object.keys(SATELLITES)) use(id, load(id));

function load(id) {
  try {
    const t = JSON.parse(localStorage.getItem(SATELLITES[id].key) || 'null');
    if (t?.l1 && t?.l2) return t;
  } catch { /* fall through */ }
  const { l1, l2, fetchedAt } = SATELLITES[id];
  return { l1, l2, fetchedAt };
}
function use(id, t) {
  tles[id] = t;
  satrecs[id] = twoline2satrec(t.l1, t.l2);
}

// Age of the orbit data in days, measured from the TLE epoch (YYDDD.DDDDDDDD in columns 19–32).
export function tleAgeDays(now = new Date(), id = 'iss') {
  const l1 = tles[id].l1;
  const yy = +l1.slice(18, 20);
  const day = +l1.slice(20, 32);
  const epoch = Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (day - 1) * 86400e3;
  return (now.getTime() - epoch) / 86400e3;
}

export async function refreshTLE(force = false, id = 'iss') {
  const sat = SATELLITES[id];
  if (!force && Date.now() - (tles[id].fetchedAt || 0) < REFRESH_MS) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    const res = await fetch(TLE_URL(sat.catnr), { mode: 'cors' });
    if (!res.ok) return false;
    const lines = (await res.text()).split(/\r?\n/).map((l) => l.trim());
    const l1 = lines.find((l) => l.startsWith(`1 ${sat.catnr}`));
    const l2 = lines.find((l) => l.startsWith(`2 ${sat.catnr}`));
    if (!l1 || !l2) return false;
    use(id, { l1, l2, fetchedAt: Date.now() });
    try { localStorage.setItem(sat.key, JSON.stringify(tles[id])); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

export const refreshAllTLE = async () => (await Promise.all(Object.keys(SATELLITES).map((id) => refreshTLE(false, id)))).some(Boolean);

// Where is the satellite, as seen from the observer? Returns alt/az (degrees), range and ground point.
export function satState(id, observer, date = new Date()) {
  const pv = propagate(satrecs[id], date);
  if (!pv?.position) return null;
  const gmst = gstime(date);
  const ecf = eciToEcf(pv.position, gmst);
  const look = ecfToLookAngles({ latitude: observer.lat * DEG, longitude: observer.lon * DEG, height: 0 }, ecf);
  const geo = eciToGeodetic(pv.position, gmst);
  const v = pv.velocity;
  return {
    alt: look.elevation / DEG,
    az: ((look.azimuth / DEG) % 360 + 360) % 360,
    km: look.rangeSat,
    lat: degreesLat(geo.latitude),
    lon: degreesLong(geo.longitude),
    heightKm: geo.height,
    speedKms: Math.hypot(v.x, v.y, v.z),
    sunlit: shadowFraction(sunPos(jday(date)).rsun, pv.position) < 0.5,
  };
}

export const issState = (observer, date) => satState('iss', observer, date);

// Upcoming passes above `minAlt`. A pass is "visible" when the ISS is sunlit while the sky at the observer is dark.
export function predictPasses(observer, from = new Date(), hours = 72, minAlt = 10, id = 'iss') {
  const passes = [];
  const step = 20e3;
  let cur = null;
  for (let t = from.getTime(); t < from.getTime() + hours * 3600e3; t += step) {
    const d = new Date(t);
    const s = satState(id, observer, d);
    if (!s) break;
    if (s.alt >= minAlt) {
      if (!cur) cur = { start: d, startAz: s.az, max: s, maxTime: d, visible: false };
      if (s.alt > cur.max.alt) { cur.max = s; cur.maxTime = d; }
      if (s.sunlit && horizontalFor({ body: 'sun' }, observer, d).alt < -6) cur.visible = true;
      cur.end = d; cur.endAz = s.az;
    } else if (cur) {
      passes.push(cur);
      cur = null;
    }
  }
  if (cur) passes.push(cur);
  return passes.map((p) => ({ start: p.start, end: p.end, maxTime: p.maxTime, maxAlt: p.max.alt, startAz: p.startAz, endAz: p.endAz, visible: p.visible }));
}
