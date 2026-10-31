// Places and storms: directions on a round Earth, and reading the GDACS storm feed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bearingDistance, destination, earthHorizontal, parseStorms, parseTrack, stormMotion, placeTarget, searchPlaces } from '../js/earth.js';
import { PLACES } from '../js/data/places.js';
import { locate } from '../js/where.js';

const fixture = (f) => JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8'));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('great-circle distance and starting bearing match the textbook London → New York', () => {
  const { km, az } = bearingDistance({ lat: 51.5074, lon: -0.1278 }, { lat: 40.7128, lon: -74.006 });
  near(km, 5570, 5, 'distance');
  near(az, 288.3, 0.2, 'bearing');
});

test('directions work across the date line and to the poles', () => {
  const tokyoToLA = bearingDistance({ lat: 35.6762, lon: 139.6503 }, { lat: 34.0522, lon: -118.2437 });
  near(tokyoToLA.km, 8815, 15, 'Tokyo–LA');
  assert.ok(tokyoToLA.az > 30 && tokyoToLA.az < 70, `Tokyo–LA heads north-east, got ${tokyoToLA.az}`);
  near(bearingDistance({ lat: 17.385, lon: 78.4867 }, { lat: 90, lon: 0 }).az % 360, 0, 0.01, 'north pole is due north');
  near(bearingDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }).km, Math.PI * 6371, 1, 'antipode');
});

test('destination() undoes bearingDistance()', () => {
  const from = { lat: 17.385, lon: 78.4867 };
  for (const az of [0, 45, 133, 270]) {
    const p = destination(from, az, 60);
    const back = bearingDistance(from, p);
    near(back.km, 60, 0.01, `km at ${az}°`);
    near(back.az, az, 0.01, `bearing at ${az}°`);
  }
});

test('far places are pointed at through the Earth: half the central angle below the horizon', () => {
  const h = earthHorizontal({ lat: 48.8584, lon: 2.2945 }, { lat: 17.385, lon: 78.4867 });
  near(h.alt, -34, 0.5, 'dip to the Eiffel Tower from Hyderabad');
  near(h.az, 316.4, 0.3, 'north-west');
  const close = earthHorizontal({ lat: 17.36, lon: 78.47 }, { lat: 17.385, lon: 78.4867 });
  assert.ok(close.alt > -0.1 && close.km < 4, 'a place across town is right on the horizon');
  assert.deepEqual(locate({ earth: { lat: 48.8584, lon: 2.2945 } }, { lat: 17.385, lon: 78.4867 }).az.toFixed(1), h.az.toFixed(1));
});

test('the built-in places are valid and findable', () => {
  const names = new Set();
  for (const [name, lat, lon, where] of PLACES) {
    assert.ok(Math.abs(lat) <= 90 && Math.abs(lon) <= 180, `${name} has a valid position`);
    assert.ok(where, `${name} says where it is`);
    assert.ok(!names.has(name), `${name} is listed once`);
    names.add(name);
  }
  assert.equal(searchPlaces('eiffel')[0].name, 'Eiffel Tower');
  assert.equal(placeTarget(searchPlaces('taj')[0].key).name, 'Taj Mahal');
  assert.deepEqual(searchPlaces('x'), [], 'one letter is not enough');
});

test('online place keys survive a round trip and reject nonsense', () => {
  const t = placeTarget('geo:16.1875,81.1389:Machilipatnam, Andhra Pradesh, India');
  assert.equal(t.name, 'Machilipatnam');
  assert.deepEqual(t.pos.earth, { lat: 16.1875, lon: 81.1389 });
  assert.equal(t.kind, '📍 Andhra Pradesh, India');
  assert.equal(placeTarget('geo:95,10:Nowhere'), null);
  assert.equal(placeTarget('geo:abc'), null);
});

test('GDACS storm list: last observed position, name, wind, and old storms dropped', () => {
  const lastFix = Date.UTC(2026, 9, 28, 6);
  const storms = parseStorms(fixture('gdacs-tc-list.json'), lastFix + 2 * 3600e3);
  // The fixture has Arnab (last fix 28 Oct), Champi (25 Oct 18:00) and Simon (16 Oct): Simon is too old.
  assert.deepEqual(storms.map((x) => x.name), ['Tropical Cyclone Arnab', 'Tropical Cyclone Champi'], 'newest first, only the last 3 days');
  const s = storms[0];
  assert.equal(s.name, 'Tropical Cyclone Arnab');
  assert.deepEqual([s.lat, s.lon, s.at], [16.4, 81.8, lastFix]);
  assert.equal(s.wind, 222);
  assert.equal(s.kind, 'Tropical Storm');
  assert.equal(parseStorms(fixture('gdacs-tc-list.json'), lastFix + 3.1 * 86400e3).length, 0, 'gone after 3 days');
  assert.deepEqual(parseStorms(null), []);
  assert.deepEqual(parseStorms({ features: [{ properties: { eventtype: 'EQ' }, geometry: { coordinates: [0, 0] } }] }), []);
});

test('GDACS track: fixes in time order, forecast after the last report, and the storm\'s motion', () => {
  const track = parseTrack(fixture('gdacs-tc-track.json'), 2026);
  assert.equal(track.length, 13);
  assert.ok(track.every((p, i) => !i || p.t > track[i - 1].t), 'sorted by time');
  assert.deepEqual(track[0], { t: Date.UTC(2026, 9, 26, 0), lat: 16, lon: 89.1 });
  const lastFix = Date.UTC(2026, 9, 28, 6);
  assert.deepEqual(track.find((p) => p.t === lastFix), { t: lastFix, lat: 16.4, lon: 81.8 }, 'last fix matches the event list');
  assert.equal(track.filter((p) => p.t > lastFix).length, 3, 'three forecast points');
  const m = stormMotion({ at: lastFix, track });
  assert.ok(m.az > 20 && m.az < 70, `drifting north-east, got ${m.az}`);
  near(m.kmh, 5.1, 0.5, 'speed');
  assert.equal(stormMotion({ at: lastFix, track: [] }), null);
});

test('every built-in place has a picture: a credited free photo, or an icon', async () => {
  const { PLACE_PHOTOS } = await import('../js/data/place-photos.js');
  const names = new Set(PLACES.map((p) => p[0]));
  for (const [name, ph] of Object.entries(PLACE_PHOTOS)) {
    assert.ok(names.has(name), `${name} is a place`);
    assert.match(ph.src, /^https:\/\/(upload|thumb)\.wikimedia\.org\//, `${name}: photo from Wikimedia`);
    assert.ok(ph.credit && ph.license && ph.page.startsWith('https://commons.wikimedia.org/'), `${name}: credit, licence and source page`);
    assert.match(ph.license, /public domain|^cc|pd|gfdl|^fal|godl/i, `${name}: free licence`);
  }
  for (let i = 0; i < PLACES.length; i++) {
    const t = placeTarget(`place-${i}`);
    assert.ok(t.photo || t.icon, `${t.name} has a photo or an icon`);
    assert.ok(t.icon, `${t.name} has an offline icon`);
  }
  assert.ok(Object.keys(PLACE_PHOTOS).length >= PLACES.length - 5, 'nearly every place has a photo');
});
