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
