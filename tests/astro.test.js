// Checks the astronomy engine against NASA JPL Horizons (geocentric astrometric RA/Dec, 2026-10-11 00:00 UT).
import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyPosition, julianDate, toHorizontal, angularDistance, nextHorizonCrossing } from '../js/astro.js';

const hms = (h, m, s) => (h + m / 60 + s / 3600) * 15;
const dms = (sign, d, m, s) => sign * (d + m / 60 + s / 3600);

const HORIZONS = {
  sun: [hms(13, 3, 53.55), dms(-1, 6, 48, 8.4)],
  moon: [hms(13, 12, 52.71), dms(-1, 12, 7, 35.6)],
  mercury: [hms(14, 35, 50.0), dms(-1, 18, 10, 44.0)],
  venus: [hms(14, 7, 51.23), dms(-1, 20, 58, 31.8)],
  mars: [hms(8, 39, 1.03), dms(1, 19, 39, 49.1)],
  jupiter: [hms(9, 34, 7.25), dms(1, 15, 6, 28.5)],
  saturn: [hms(0, 42, 32.17), dms(1, 1, 37, 29.9)],
  uranus: [hms(4, 12, 6.25), dms(1, 20, 58, 1.6)],
  neptune: [hms(0, 10, 21.79), dms(-1, 0, 25, 29.8)],
  pluto: [hms(20, 24, 10.73), dms(-1, 23, 43, 29.9)],
  ceres: [hms(7, 19, 35.77), dms(1, 23, 22, 57.1)],
  eris: [hms(1, 48, 19.12), dms(-1, 0, 4, 59.4)],
  haumea: [hms(14, 40, 43.32), dms(1, 13, 33, 39.4)],
  makemake: [hms(13, 26, 58.48), dms(1, 19, 44, 1.1)],
  halley: [hms(8, 20, 32.97), dms(1, 2, 52, 13.5)],
  c67p: [hms(17, 9, 58.47), dms(-1, 25, 49, 17.5)],
  halebopp: [hms(21, 37, 13.09), dms(-1, 85, 10, 54.5)],
  oumuamua: [hms(23, 53, 26.99), dms(1, 24, 36, 10.4)],
  atlas3i: [hms(7, 12, 26.62), dms(1, 19, 15, 17.8)],
};

const jd = julianDate(new Date(Date.UTC(2026, 9, 11, 0, 0, 0)));

for (const [body, [ra, dec]] of Object.entries(HORIZONS)) {
  test(`${body} matches JPL Horizons`, () => {
    const p = bodyPosition(body, jd);
    const sep = angularDistance(dec, ra, p.dec, p.ra); // dec/ra used as alt/az on the sphere
    const limit = body === 'moon' ? 0.5 : 0.25;
    assert.ok(sep < limit, `${body} off by ${sep.toFixed(3)}°`);
  });
}

test('Polaris sits at an altitude equal to the observer latitude', () => {
  const h = toHorizontal(37.95, 89.264, 40, -74, jd);
  assert.ok(Math.abs(h.alt - 40) < 1, `alt ${h.alt}`);
  assert.ok(h.az < 2 || h.az > 358, `az ${h.az}`);
});

test('The Sun rises and sets', () => {
  const c = nextHorizonCrossing({ body: 'sun' }, { lat: 28.6, lon: 77.2 }, new Date(Date.UTC(2026, 9, 11, 0, 0)));
  assert.ok(c.time instanceof Date);
});

test('The horizon matrix agrees with toHorizontal', async () => {
  const { horizonMatrix, equatorialVector } = await import('../js/astro.js');
  const m = horizonMatrix(-33.9, 151.2, jd);
  for (const [ra, dec] of [[101.29, -16.72], [279.23, 38.78], [37.95, 89.26], [200, -60]]) {
    const v = equatorialVector(ra, dec);
    const [e, n, u] = [0, 3, 6].map((k) => m[k] * v[0] + m[k + 1] * v[1] + m[k + 2] * v[2]);
    const alt = Math.asin(u) * 180 / Math.PI, az = (Math.atan2(e, n) * 180 / Math.PI + 360) % 360;
    const h = toHorizontal(ra, dec, -33.9, 151.2, jd);
    assert.ok(angularDistance(alt, az, h.alt, h.az) < 0.001, `${ra},${dec}`);
  }
});

// Eclipses pin the Moon's phase to the minute: the total lunar eclipse of 3 March 2026 (11:33 UT)
// happened at full Moon, the total solar eclipse of 12 August 2026 (17:46 UT) at new Moon.
test('Moon phase is full at the March 2026 lunar eclipse and new at the August 2026 solar eclipse', async () => {
  const { moonPhase } = await import('../js/astro.js');
  const full = moonPhase(new Date(Date.UTC(2026, 2, 3, 11, 33)));
  const nw = moonPhase(new Date(Date.UTC(2026, 7, 12, 17, 46)));
  assert.ok(full.illumination > 0.995, `full ${full.illumination}`);
  assert.equal(full.name, 'Full Moon');
  assert.ok(nw.illumination < 0.005, `new ${nw.illumination}`);
  assert.equal(nw.name, 'New Moon');
});

test('nextMoonPhase finds the eclipse full and new Moons within 2 hours', async () => {
  const { nextMoonPhase } = await import('../js/astro.js');
  const full = nextMoonPhase(180, new Date(Date.UTC(2026, 1, 20)));
  const nw = nextMoonPhase(0, new Date(Date.UTC(2026, 7, 1)));
  assert.ok(Math.abs(full - Date.UTC(2026, 2, 3, 11, 38)) < 2 * 3600e3, full.toISOString());
  assert.ok(Math.abs(nw - Date.UTC(2026, 7, 12, 17, 37)) < 2 * 3600e3, nw.toISOString());
});

test('riseSet returns both a rise and a set for the Moon at mid-latitudes', async () => {
  const { riseSet } = await import('../js/astro.js');
  const r = riseSet({ body: 'moon' }, { lat: 28.6, lon: 77.2 }, new Date(Date.UTC(2026, 9, 11)));
  assert.ok(r.rise instanceof Date && r.set instanceof Date);
});
