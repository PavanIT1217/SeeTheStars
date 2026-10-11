// International Space Station tracking with SGP4 (satellite.js). Orbit data (a "TLE") is refreshed from
// CelesTrak when online and remembered on the device; a bundled copy is the last resort.
import { twoline2satrec } from './vendor/satellite/io.js';
import { propagate, gstime } from './vendor/satellite/propagation.js';
import { eciToEcf, eciToGeodetic, ecfToLookAngles, degreesLat, degreesLong } from './vendor/satellite/transforms.js';
import { sunPos } from './vendor/satellite/sun.js';
import { shadowFraction } from './vendor/satellite/shadow.js';
import { jday } from './vendor/satellite/ext.js';
import { horizontalFor } from './astro.js';

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const KEY = 'stg.iss.tle.v1';
const REFRESH_MS = 12 * 3600e3;
const BUNDLED = {
  l1: '1 25544U 98067A   26284.17638745  .00009430  00000+0  18014-3 0  9995',
  l2: '2 25544  51.6312  86.0933 0006713 248.1316 111.8959 15.48821882589734',
  fetchedAt: Date.UTC(2026, 9, 11),
};
const DEG = Math.PI / 180;

let tle = load();
let satrec = twoline2satrec(tle.l1, tle.l2);

function load() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (t?.l1 && t?.l2) return t;
  } catch { /* fall through */ }
  return BUNDLED;
}

// Age of the orbit data in days, measured from the TLE epoch (YYDDD.DDDDDDDD in columns 19–32).
export function tleAgeDays(now = new Date()) {
  const yy = +tle.l1.slice(18, 20);
  const day = +tle.l1.slice(20, 32);
  const epoch = Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (day - 1) * 86400e3;
  return (now.getTime() - epoch) / 86400e3;
}

export async function refreshTLE(force = false) {
  if (!force && Date.now() - (tle.fetchedAt || 0) < REFRESH_MS) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    const res = await fetch(TLE_URL, { mode: 'cors' });
    if (!res.ok) return false;
    const lines = (await res.text()).split(/\r?\n/).map((l) => l.trim());
    const l1 = lines.find((l) => l.startsWith('1 25544'));
    const l2 = lines.find((l) => l.startsWith('2 25544'));
    if (!l1 || !l2) return false;
    tle = { l1, l2, fetchedAt: Date.now() };
    satrec = twoline2satrec(l1, l2);
    try { localStorage.setItem(KEY, JSON.stringify(tle)); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

// Where is the ISS, as seen from the observer? Returns alt/az (degrees), range and ground point.
export function issState(observer, date = new Date()) {
  const pv = propagate(satrec, date);
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

// Upcoming passes above `minAlt`. A pass is "visible" when the ISS is sunlit while the sky at the observer is dark.
export function predictPasses(observer, from = new Date(), hours = 72, minAlt = 10) {
  const passes = [];
  const step = 20e3;
  let cur = null;
  for (let t = from.getTime(); t < from.getTime() + hours * 3600e3; t += step) {
    const d = new Date(t);
    const s = issState(observer, d);
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
