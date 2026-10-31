// Star distances and constellation pictures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STAR_NAMES, CONSTELLATIONS, STARS } from '../js/data/sky.js';
import { FIGURE_ART, pathToPolylines, frameToSky } from '../js/data/figures.js';

const star = (name) => STAR_NAMES.find((s) => s[1] === name);
const sep = ([r1, d1], [r2, d2]) => {
  const D = Math.PI / 180;
  return Math.acos(Math.min(1, Math.sin(d1 * D) * Math.sin(d2 * D) + Math.cos(d1 * D) * Math.cos(d2 * D) * Math.cos((r1 - r2) * D))) / D;
};

test('named stars carry their distance in light-years', () => {
  assert.ok(STAR_NAMES.filter((s) => s[3]).length > 1400);
  for (const [name, ly, tol] of [['Sirius', 8.6, 0.1], ['Rigil Kentaurus', 4.3, 0.1], ['Vega', 25, 1], ['Arcturus', 37, 1], ['Polaris', 430, 30]]) {
    const s = star(name);
    assert.ok(s, `${name} is named`);
    assert.ok(Math.abs(s[3] - ly) <= tol, `${name}: ${s[3]} ly, expected about ${ly}`);
  }
});

// Flat frame around `c` (the inverse of frameToSky): x right = west, y down = south, in degrees.
function toFrame([ra, dec], [ra0, dec0]) {
  const D = Math.PI / 180, dr = (ra - ra0) * D, d = dec * D, d0 = dec0 * D;
  const cc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(dr);
  return [-(Math.cos(d) * Math.sin(dr) / cc) / D, -((Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(dr)) / cc) / D];
}
const inside = ([x, y], ring) => {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const edgeDistance = ([x, y], ring) => Math.min(...ring.map(([x1, y1], i) => {
  const [x2, y2] = ring[(i + 1) % ring.length];
  const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2 || 1)));
  return Math.hypot(x - x1 - t * (x2 - x1), y - y1 - t * (y2 - y1));
}));

test('every constellation picture stays inside its own constellation\'s boundary', () => {
  const ids = new Set(CONSTELLATIONS.map((c) => c.id));
  for (const [id, art] of Object.entries(FIGURE_ART)) {
    assert.ok(ids.has(id), `${id} is a constellation`);
    assert.ok(art.title && art.parts.length, `${id} has a title and parts`);
    const c = CONSTELLATIONS.find((x) => x.id === id);
    // IAU boundaries in the picture's own flat frame, with extra points along each edge (they curve on the sky).
    const rings = c.bounds.map((b) => {
      const pts = [];
      for (let k = 0; k < b.length; k += 2) {
        const [r1, d1, r2, d2] = [b[k], b[k + 1], b[(k + 2) % b.length], b[(k + 3) % b.length]];
        const dr = ((r2 - r1 + 540) % 360) - 180;
        for (let s = 0; s < 8; s++) pts.push(toFrame([r1 + (dr * s) / 8, d1 + ((d2 - d1) * s) / 8], art.c));
      }
      return pts;
    });
    for (const [w, d] of art.parts) {
      assert.ok(w >= 0 && w < 3, `${id}: sensible stroke width`);
      for (const line of pathToPolylines(d)) for (const p of line) {
        const ok = rings.some((r) => inside(p, r)) || Math.min(...rings.map((r) => edgeDistance(p, r))) < 2.5;
        assert.ok(ok, `${id}: point ${p.map((v) => v.toFixed(1))} of the picture is outside the constellation`);
      }
    }
  }
});

test('frameToSky puts the frame centre on the centre, with right = west and down = south', () => {
  const c = [81.65, 6.51];
  assert.deepEqual(frameToSky([0, 0], c), c);
  const [raR] = frameToSky([5, 0], c), [, decD] = frameToSky([0, 5], c);
  assert.ok(raR < c[0], 'right is towards smaller RA (west)');
  assert.ok(decD < c[1], 'down is south');
  // Betelgeuse and Rigel land where the Orion picture expects them.
  const bet = STARS.slice(9 * 4, 9 * 4 + 2);
  assert.ok(sep(frameToSky([-7.1, -1], c), bet) < 0.2);
});

test('the path reader handles every command the pictures use, and rejects others', () => {
  const [line] = pathToPolylines('M 0 0 L 1 0 Q 2 0 2 1 C 2 2 1 2 0 2 Z', 2);
  assert.deepEqual(line[0], [0, 0]);
  assert.deepEqual(line.at(-1), [0, 0]);
  assert.equal(line.length, 1 + 1 + 2 + 2 + 1);
  assert.throws(() => pathToPolylines('M 0 0 A 1 1 0 0 0 1 1'));
});
