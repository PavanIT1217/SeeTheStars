// ISS position (SGP4 with the bundled TLE) against NASA JPL Horizons, seen from Hyderabad on 2026-10-11.
import test from 'node:test';
import assert from 'node:assert/strict';
import { issState, predictPasses } from '../js/iss.js';
import { angularDistance } from '../js/astro.js';

const observer = { lat: 17.385, lon: 78.4867 };
const HORIZONS = [
  ['06:00', 303.670566, -26.925027],
  ['06:12', 355.306082, -10.904793],
  ['06:24', 67.818529, -17.566439],
  ['06:48', 127.623664, -56.479523],
];

for (const [hm, az, alt] of HORIZONS) {
  test(`ISS at ${hm} UTC matches JPL Horizons`, () => {
    const s = issState(observer, new Date(`2026-10-11T${hm}:00Z`));
    const sep = angularDistance(alt, az, s.alt, s.az);
    assert.ok(sep < 1, `off by ${sep.toFixed(2)}°`);
  });
}

test('ISS orbit looks right', () => {
  const s = issState(observer, new Date('2026-10-11T06:00:00Z'));
  assert.ok(s.heightKm > 370 && s.heightKm < 460, `height ${s.heightKm}`);
  assert.ok(s.speedKms > 7.5 && s.speedKms < 7.8, `speed ${s.speedKms}`);
});

test('predicts passes over the next three days', () => {
  const passes = predictPasses(observer, new Date('2026-10-11T00:00:00Z'), 72);
  assert.ok(passes.length >= 6, `only ${passes.length} passes`);
  for (const p of passes) assert.ok(p.maxAlt >= 10 && p.end > p.start);
});
