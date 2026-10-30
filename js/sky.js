// Sky Finder: point your phone and see where things are – even through the Earth.
import { OBJECTS, SECTORS } from './data/catalog.js';
import { STARS, STAR_NAMES, CONSTELLATIONS, MESSIER } from './data/sky.js';
import { julianDate, compassName, nextHorizonCrossing, angularDistance, norm360, horizonMatrix, equatorialVector } from './astro.js';
import { getSettings, setSettings, markSpotted, isSpotted, isScientist, logObservation } from './store.js';
import { locate as whereIs, satOf } from './where.js';
import { TOURS } from './data/tours.js';
import { t, language } from './i18n.js';
import { tonightPlan } from './tonight.js';
import { predictPasses, refreshAllTLE, SATELLITES } from './iss.js';

const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDay = (d) => (d.toDateString() === new Date().toDateString() ? 'today' : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }));

const DEG = Math.PI / 180;
const LOCK_DEG = 5;
const LOCK_MS = 1200;

const vec = (alt, az) => [Math.cos(alt * DEG) * Math.sin(az * DEG), Math.cos(alt * DEG) * Math.cos(az * DEG), Math.sin(alt * DEG)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180;
const rotZ = (v, deg) => { const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };

const TYPE_COLORS = { planet: '#ffcf7a', earth: '#6fc3ff', star: '#fff6d8', cluster: '#9cc4ff', nebula: '#ff7fc4', ring: '#69f0d6', galaxy: '#b9a6ff', pulsar: '#7af4ff', blackhole: '#ff9a5a', constellation: '#7fdcff', cosmos: '#ffffff', comet: '#7affc8', iss: '#ffffff', exoplanet: '#8affb0', system: '#8affb0' };

// ---------- the star chart ----------
// Equatorial unit vectors are worked out once; each refresh only rotates them into your sky.
const N_STARS = STARS.length / 4;
const STAR_EQ = new Float32Array(N_STARS * 3);
for (let i = 0; i < N_STARS; i++) STAR_EQ.set(equatorialVector(STARS[i * 4], STARS[i * 4 + 1]), i * 3);
const toEq = (flat) => { const out = new Float32Array((flat.length / 2) * 3); for (let k = 0; k < flat.length / 2; k++) out.set(equatorialVector(flat[k * 2], flat[k * 2 + 1]), k * 3); return out; };
const CONST_EQ = CONSTELLATIONS.map((c) => ({ lines: c.lines.map(toEq), bounds: c.bounds.map(toEq), label: equatorialVector(...c.label) }));

// Constellations that have their own page in the journey.
const CON_OBJECT = { Ori: 'orion', UMa: 'ursamajor', Cas: 'cassiopeia', Sco: 'scorpius', Cru: 'crux', Cyg: 'cygnus' };
const CON_NAME = Object.fromEntries(CONSTELLATIONS.map((c) => [c.id, c.name]));
const STAR_LABEL = new Map(STAR_NAMES.map(([i, name, con]) => [i, { name, con, proper: !/^\p{Script=Greek}/u.test(name) }]));

// Star colour from its B–V index: blue-white hot stars to orange-red cool ones.
function starColor(bv) {
  const t = Math.max(0, Math.min(1, (bv + 0.3) / 2));
  const r = Math.round(170 + 85 * Math.min(1, t * 2.2));
  const g = Math.round(200 + 40 * (1 - Math.abs(t - 0.35) * 2.2));
  const b = Math.round(255 - 170 * Math.max(0, t - 0.25) / 0.75);
  return `rgb(${r},${Math.max(150, Math.min(245, g))},${Math.max(80, b)})`;
}
const STAR_COLORS = Array.from({ length: N_STARS }, (_, i) => starColor(STARS[i * 4 + 3]));

// Messier objects in plain words, and their journey page when there is one (same spot in the sky).
const MESSIER_KIND = {
  gc: 'Globular cluster – a ball of very old stars', oc: 'Open cluster – young stars born together', sfr: 'Nebula – a star nursery',
  rn: 'Nebula lit by nearby stars', pn: 'Planetary nebula – a dying star’s glowing shell', snr: 'Supernova remnant – what’s left of an exploded star',
  s: 'Spiral galaxy', e: 'Elliptical galaxy', i: 'Irregular galaxy', pos: 'A group of stars',
};
const MESSIER_COLOR = { gc: '#ffd98a', oc: '#9cc4ff', sfr: '#ff7fc4', rn: '#8fb8ff', pn: '#7af4ff', snr: '#ff9a5a', s: '#b9a6ff', e: '#b9a6ff', i: '#b9a6ff', pos: '#cfd6ff' };
const MESSIER_EQ = MESSIER.map((m) => equatorialVector(m[5], m[6]));
const messierJourney = new Map();
for (const m of MESSIER) {
  const o = Object.values(OBJECTS).find((x) => x.pos?.ra !== undefined && ['cluster', 'nebula', 'galaxy', 'pulsar', 'ring'].includes(x.art?.type) && Math.abs(x.pos.ra - m[5]) < 0.6 && Math.abs(x.pos.dec - m[6]) < 0.6);
  if (o && !messierJourney.has(m[0])) messierJourney.set(m[0], o.id);
}
const messierName = (m) => (m[2] ? `M${m[0]} · ${m[2]}` : `M${m[0]}`);

// Things you can find that are not journey objects: any of the 88 constellations, any named star.
export function chartTarget(key) {
  const [kind, ref] = String(key).split('-');
  if (kind === 'con') {
    const c = CONSTELLATIONS.find((x) => x.id === ref);
    if (!c) return null;
    if (CON_OBJECT[c.id]) return OBJECTS[CON_OBJECT[c.id]];
    return { id: key, chart: true, name: c.name, kind: `Constellation · ${c.gen}`, pos: { ra: c.label[0], dec: c.label[1] } };
  }
  if (kind === 'sat' && SATELLITES[ref] && ref !== 'iss') {
    return { id: key, chart: true, name: SATELLITES[ref].name, kind: 'Satellite · you can see it with your eyes', art: { type: 'iss' }, pos: { sat: ref } };
  }
  if (kind === 'm') {
    const m = MESSIER.find((x) => x[0] === +ref);
    if (!m) return null;
    if (messierJourney.has(m[0])) return OBJECTS[messierJourney.get(m[0])];
    return { id: key, chart: true, name: messierName(m), kind: `${MESSIER_KIND[m[3]] || 'Deep-sky object'} · ${m[1]} · brightness ${m[4]}`, pos: { ra: m[5], dec: m[6] } };
  }
  if (kind === 'star') {
    const i = +ref, s = STAR_LABEL.get(i);
    if (!s) return null;
    return { id: key, chart: true, name: s.name, kind: `Star in ${CON_NAME[s.con] || s.con} · brightness ${STARS[i * 4 + 2].toFixed(1)}`, pos: { ra: STARS[i * 4], dec: STARS[i * 4 + 1] } };
  }
  return null;
}

// Tour stops name stars as `star:<name>`; everything else is already a Sky Finder key.
export function resolveKey(key) {
  if (!key.startsWith('star:')) return key;
  const hit = STAR_NAMES.find(([, name]) => name === key.slice(5));
  return hit ? `star-${hit[0]}` : null;
}

// The tours, plus tonight's own tour built from the Tonight planner.
export function toursFor(observer, date) {
  const plan = tonightPlan(observer, date);
  const tonight = plan.highlights.filter((h) => h.key && !h.key.startsWith('sat-') && h.key !== 'iss');
  const list = tonight.length >= 2 ? [{ id: 'tonight', title: 'Tonight’s tour', emoji: '✨', best: 'Made for tonight, from where you are', intro: 'The best things in your sky tonight, one after another.', stops: tonight.map((h) => ({ key: h.key, say: `${h.title}. ${h.text}` })) }] : [];
  return [...list, ...TOURS];
}

// Everything the search box can find.
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function searchSky(q, limit = 12) {
  const n = fold(q.trim());
  if (!n) return [];
  const score = (text) => { const t = fold(text); return t.startsWith(n) ? 2 : t.includes(n) ? 1 : 0; };
  const results = [];
  for (const o of Object.values(OBJECTS)) {
    if (!o.pos) continue;
    const s = score(o.name);
    if (s) results.push({ key: o.id, name: o.name, kind: o.kind, s: s + 1 });
  }
  for (const [id, sat] of Object.entries(SATELLITES)) {
    if (id === 'iss') continue;
    const s = Math.max(score(sat.name), score(sat.short));
    if (s) results.push({ key: `sat-${id}`, name: sat.name, kind: 'Satellite', s: s + 1 });
  }
  for (const c of CONSTELLATIONS) {
    if (CON_OBJECT[c.id] && results.some((r) => r.key === CON_OBJECT[c.id])) continue;
    const s = score(c.name) || Math.max(score(c.es || ''), score(c.hi || '')) * 0.8; // names in other languages rank a little lower
    if (s) results.push({ key: CON_OBJECT[c.id] || `con-${c.id}`, name: c.name, kind: 'Constellation', s });
  }
  for (const m of MESSIER) {
    const key = messierJourney.get(m[0]) || `m-${m[0]}`;
    const sc = Math.max(n === `m${m[0]}` ? 3 : 0, score(`M${m[0]}`) && n.length > 1 ? score(`M${m[0]}`) : 0, score(m[2]), n.startsWith('ngc') && fold(m[1]).replace(/\s/g, '').startsWith(n.replace(/\s/g, '')) ? 2 : 0);
    if (sc && !results.some((r) => r.key === key)) results.push({ key, name: messierName(m), kind: MESSIER_KIND[m[3]] || 'Deep-sky object', s: sc });
  }
  for (const [i, name, con] of STAR_NAMES) {
    if (!STAR_LABEL.get(i).proper || results.some((r) => r.name === name)) continue; // Vega, Sirius… already have journey pages
    const s = score(name);
    if (s) results.push({ key: `star-${i}`, name, kind: `Star in ${CON_NAME[con] || con}`, s: s - STARS[i * 4 + 2] / 20 });
  }
  return results.sort((a, b) => b.s - a.s).slice(0, limit);
}

function guessLocation() {
  // Rough fallback from the time zone until GPS answers.
  const lon = Math.max(-180, Math.min(180, (-new Date().getTimezoneOffset() / 60) * 15));
  return { lat: 30, lon, approx: true };
}

// Device orientation (W3C: R = Rz(alpha)·Rx(beta)·Ry(gamma)) -> camera basis in East-North-Up coordinates.
function basisFromOrientation(alpha, beta, gamma, screenAngle) {
  const [a, b, g] = [alpha * DEG, beta * DEG, gamma * DEG];
  const [ca, sa, cb, sb, cg, sg] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(g), Math.sin(g)];
  const X = [ca * cg - sa * sb * sg, sa * cg + ca * sb * sg, -cb * sg];
  const Y = [-sa * cb, ca * cb, sb];
  const Z = [ca * sg + sa * sb * cg, sa * sg - ca * sb * cg, cb * cg];
  const t = (screenAngle || 0) * DEG;
  const right = X.map((v, i) => Math.cos(t) * v - Math.sin(t) * Y[i]);
  const up = X.map((v, i) => Math.sin(t) * v + Math.cos(t) * Y[i]);
  return { forward: Z.map((v) => -v), right, up };
}

function basisFromLook(az, alt) {
  const forward = vec(alt, az);
  const right = [Math.cos(az * DEG), -Math.sin(az * DEG), 0];
  return { forward, right, up: cross(right, forward) };
}

export function mountSky(root, { targetId, onTarget, onSpotted, onLogged, onTourDone, tourId }) {
  const settings = getSettings();
  let observer = settings.location || guessLocation();
  let target = OBJECTS[targetId] || chartTarget(targetId) || null;
  let mode = 'idle'; // idle | sensor | manual
  let look = { az: 180, alt: 30 };
  let basis = basisFromLook(look.az, look.alt);
  let rawBasis = null;
  let iosOffset = null;
  let stream = null;
  let raf = 0;
  let positions = [];
  let chart = null; // stars and constellations in East-North-Up, refreshed with the positions
  let zoomFov = settings.fov; // the drag view can zoom; the camera view keeps the calibrated field of view
  let targetHz = null;
  let lockStart = 0;
  let lastCompute = 0;
  let crossing = null;
  let passes = null; // ISS passes for the current observer
  let hits = [];
  let disposed = false;
  let hintUntil = 0;
  let aimPending = false; // point the drag view near the target once its position is known
  // Time travel: the sky can be shown at any moment; playRate is sky-seconds per real second.
  let timeOffset = 0, playRate = 0, lastFrameAt = 0, computedOffset = 0, crossingAt = 0;
  const skyNow = () => new Date(Date.now() + timeOffset);
  const live = () => Math.abs(timeOffset) < 60e3;

  root.innerHTML = `
    <div class="sky">
      <video class="sky-video" playsinline muted autoplay></video>
      <canvas class="sky-canvas"></canvas>
      <div class="sky-top">
        <select class="sky-select" aria-label="Choose what to find"></select>
        <button class="icon-btn sky-search-btn" title="Search" aria-label="Search the sky">⌕</button>
        <button class="icon-btn sky-night" title="Red night mode" aria-label="Red night mode">☾</button>
        <button class="icon-btn sky-cam" title="Camera on/off" aria-label="Camera on or off">◉</button>
        <button class="icon-btn sky-gear" title="Settings" aria-label="Sky settings">⚙</button>
      </div>
      <div class="sky-search glass" hidden>
        <input type="search" class="sky-search-input" placeholder="${t('Search, or pick a guided tour…')}" aria-label="Search the sky" autocomplete="off" enterkeyhint="search">
        <div class="sky-search-results" role="listbox"></div>
      </div>
      <div class="sky-zoom" hidden>
        <button class="icon-btn sky-zoom-in" aria-label="Zoom in">+</button>
        <button class="icon-btn sky-zoom-out" aria-label="Zoom out">−</button>
      </div>
      <div class="sky-alert" hidden></div>
      <div class="sky-time glass" hidden>
        <button class="sky-play" aria-label="Play time">▶</button>
        <div class="sky-time-mid">
          <div class="sky-time-label"></div>
          <input type="range" class="sky-scrub" min="-1440" max="1440" step="10" value="0" aria-label="Move time back or forward">
        </div>
        <button class="sky-now-btn" hidden>${t('Now')}</button>
        <label class="sky-date-btn sci-only" title="Jump to a date">📅<input type="datetime-local" class="sky-date" aria-label="Jump to a date"></label>
      </div>
      <div class="sky-hud glass">
        <div class="sky-tour" hidden>
          <div class="sky-tour-head"><span class="hud-label sky-tour-title"></span><button class="sky-tour-voice" aria-label="Read aloud on or off">🔊</button><button class="sky-tour-exit" aria-label="End tour">✕</button></div>
          <p class="sky-tour-say"></p>
          <div class="sky-tour-nav"><button class="btn ghost small sky-tour-prev">${t('← Back')}</button><span class="sky-tour-step"></span><button class="btn primary small sky-tour-next">${t('Next →')}</button></div>
        </div>
        <div class="hud-row"><span class="hud-label sci-only">TARGET</span><span class="sky-spotted" hidden>✦ SPOTTED</span></div>
        <div class="sky-name"></div>
        <div class="sky-guide"></div>
        <div class="closeness" hidden><span class="closeness-bar"><i></i></span><small class="closeness-text"></small></div>
        <div class="hud-grid sci-only">
          <div><span class="hud-label">ALT</span><b class="sky-alt">—</b></div>
          <div><span class="hud-label">AZ</span><b class="sky-az">—</b></div>
          <div><span class="hud-label">YOU</span><b class="sky-you">—</b></div>
        </div>
        <div class="sky-extra"></div>
        <div class="sky-actions">
          <a class="btn ghost sky-learn" href="#">${t('Learn about it')}</a>
          <button class="btn ghost sky-calibrate" hidden>${t('It’s right here – calibrate')}</button>
        </div>
      </div>
      <div class="sky-start">
        <div class="sky-start-card glass">
          <div class="hud-label">SKY SCANNER</div>
          <h2>${t('Find anything in the universe')}</h2>
          <p>${t('Hold your phone up like you’re taking a photo. Arrows will guide you to your target – even if it is on the other side of the Earth.')}</p>
          <button class="btn primary sky-engage">${t('Engage scanner')}</button>
          <button class="btn ghost sky-manual">${t('No sensors? Drag to explore')}</button>
          <p class="fine">${t('Uses your camera, motion sensors and location. Nothing leaves your device.')}</p>
        </div>
      </div>
      <div class="sky-settings glass" hidden>
        <div class="segmented sky-mode">
          <button data-mode="explorer"><span>🧑‍🚀</span><b>Explorer</b><small>Simple</small></button>
          <button data-mode="scientist"><span>🔬</span><b>Scientist</b><small>All the data</small></button>
        </div>
        <div class="hud-label">CALIBRATION</div>
        <label>Field of view <input type="range" min="35" max="100" class="set-fov"><span class="set-fov-v"></span></label>
        <label>Compass nudge <input type="range" min="-60" max="60" class="set-head"><span class="set-head-v"></span></label>
        <div class="hud-label">LOCATION</div>
        <div class="loc-row"><input class="set-lat" inputmode="decimal" placeholder="Latitude"><input class="set-lon" inputmode="decimal" placeholder="Longitude"></div>
        <div class="loc-row"><button class="btn ghost set-gps">Use GPS</button><button class="btn primary set-save">Save</button></div>
        <p class="fine">Tip: if arrows seem off, move your phone in a figure-8 to wake up the compass, or point at the Moon and tap “calibrate”.</p>
      </div>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const video = $('.sky-video');
  const canvas = $('.sky-canvas');
  const ctx = canvas.getContext('2d');
  const select = $('.sky-select');

  // Target picker grouped by sector.
  select.innerHTML = `<option value="">— Free look —</option>` + SECTORS.map((s) => `<optgroup label="${s.code} · ${s.title}">${s.items.map((id) => `<option value="${id}">${OBJECTS[id].name}</option>`).join('')}</optgroup>`).join('');
  select.value = target?.id || '';
  select.addEventListener('change', () => { setTarget(select.value); if (mode === 'manual') aimPending = true; });

  function setTarget(id) {
    target = OBJECTS[id] || chartTarget(id) || null;
    select.value = target && !target.chart ? target.id : '';
    lockStart = 0;
    crossing = null; passes = null;
    lastCompute = 0;
    onTarget?.(target?.id || null);
    updateStatic();
  }

  function updateStatic() {
    $('.sky-name').innerHTML = target ? `${target.name}<small>${target.kind}</small>` : `${t('Free look')}<small>${t('Tap anything on screen to target it')}</small>`;
    $('.sky-learn').href = target && !target.chart ? `/object/${target.id}/` : '/';
    $('.sky-learn').hidden = !target || !!target.chart;
    $('.sky-spotted').hidden = !(target && isSpotted(target.id));
    const lat = observer.lat, lon = observer.lon;
    $('.sky-you').textContent = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}${observer.approx ? '?' : ''}`;
  }

  // ---------- positions ----------
  function computePositions(now) {
    const jd = julianDate(now);
    positions = [];
    for (const o of Object.values(OBJECTS)) {
      if (!o.pos || o.pos.everywhere || o.pos.down) continue;
      if (o.art?.type === 'constellation') continue; // drawn as figures instead
      if (o.id === 'crabpulsar' || o.id === 'milkyway') continue; // same spot as another object
      const h = whereIs(o.pos, observer, now);
      if (!h) continue;
      positions.push({ fast: !!satOf(o.pos), kid: !!satOf(o.pos) || ['home', 'rocky', 'giants'].includes(o.sector), o, alt: h.alt, az: h.az, v: vec(h.alt, h.az), color: TYPE_COLORS[o.art?.type] || '#fff' });
    }
    for (const id of Object.keys(SATELLITES)) {
      if (id === 'iss') continue; // the ISS is a journey object
      const o = chartTarget(`sat-${id}`);
      const h = whereIs(o.pos, observer, now);
      if (h) positions.push({ fast: true, kid: true, o, alt: h.alt, az: h.az, v: vec(h.alt, h.az), color: TYPE_COLORS.iss });
    }
    computeChart(jd);
    if (target) {
      if (target.pos?.down) targetHz = { alt: -90, az: 0 };
      else if (target.pos?.everywhere) targetHz = null;
      else targetHz = whereIs(target.pos, observer, now);
      if (satOf(target.pos)) { if (!passes) { passes = predictPasses(observer, now, 72, 10, satOf(target.pos)); crossingAt = +now; } }
      else if (targetHz && !crossing) { crossing = nextHorizonCrossing(target.pos, observer, now); crossingAt = +now; }
    } else targetHz = null;
  }

  function computeChart(jd) {
    const m = horizonMatrix(observer.lat, observer.lon, jd);
    const rot = (src) => {
      const out = new Float32Array(src.length);
      for (let k = 0; k < src.length; k += 3) {
        const x = src[k], y = src[k + 1], z = src[k + 2];
        out[k] = m[0] * x + m[1] * y + m[2] * z;
        out[k + 1] = m[3] * x + m[4] * y + m[5] * z;
        out[k + 2] = m[6] * x + m[7] * y + m[8] * z;
      }
      return out;
    };
    chart = {
      stars: rot(STAR_EQ),
      cons: CONST_EQ.map((c, i) => ({ c: CONSTELLATIONS[i], lines: c.lines.map(rot), bounds: c.bounds.map(rot), label: Array.from(rot(c.label)) })),
      messier: MESSIER_EQ.map((v) => Array.from(rot(v))),
    };
  }

  // ---------- rendering ----------
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // The optical centre sits in the middle of the area not covered by the toolbar and HUD.
  let cx = 0, cy = 0, viewR = 90, videoH = 0;
  function measure() {
    const top = $('.sky-top').getBoundingClientRect().bottom;
    const bottom = $('.sky-hud').getBoundingClientRect().top;
    cx = canvas.clientWidth / 2;
    cy = bottom > top + 120 ? (top + bottom) / 2 : canvas.clientHeight / 2;
    viewR = Math.max(50, Math.min(90, (bottom - top) / 2 - 36));
    // Shift (and grow) the camera picture so its centre matches the overlay's optical centre.
    const shift = cy - canvas.clientHeight / 2;
    videoH = canvas.clientHeight + 2 * Math.abs(shift);
    const style = `top:${(shift - Math.abs(shift)).toFixed(0)}px;height:${videoH.toFixed(0)}px`;
    if (video.getAttribute('style') !== style) video.setAttribute('style', style);
  }

  const fovNow = () => (mode === 'sensor' ? getSettings().fov : zoomFov);

  // Same as project() for the vector stored at arr[k..k+2].
  function projectAt(arr, k, f) {
    const x = arr[k], y = arr[k + 1], z0 = arr[k + 2];
    const z = x * basis.forward[0] + y * basis.forward[1] + z0 * basis.forward[2];
    if (z <= 0.05) return null;
    return [cx + ((x * basis.right[0] + y * basis.right[1] + z0 * basis.right[2]) / z) * f, cy - ((x * basis.up[0] + y * basis.up[1] + z0 * basis.up[2]) / z) * f];
  }

  function polyline(arr, f, W, H) {
    let prev = null;
    for (let k = 0; k < arr.length; k += 3) {
      const p = projectAt(arr, k, f);
      if (p && prev && Math.abs(p[0] - prev[0]) < W * 2 && Math.abs(p[1] - prev[1]) < H * 2) { ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); }
      prev = p;
    }
  }

  function drawChart(W, H, f, sci) {
    if (!chart) return;
    const fov = fovNow();
    const zoomed = Math.log2(Math.max(1, 62 / fov));
    const onCamera = !!stream && mode === 'sensor';
    // Faint stars appear as you zoom in; over a bright camera picture only the brighter ones are useful.
    const magLimit = Math.min(6, (onCamera ? 3.5 : sci ? 5 : 4.3) + zoomed * 1.2);
    const minDot = Math.cos(Math.min(170, fov * 1.2) * DEG);
    const up = (arr, k) => arr[k + 2] >= 0;

    // Constellation boundaries (Scientist) and figures.
    ctx.lineWidth = 1;
    if (sci) {
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = 'rgba(169,150,255,0.22)';
      ctx.beginPath();
      for (const c of chart.cons) for (const b of c.bounds) polyline(b, f, W, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const c of chart.cons) {
      const isTarget = target && (target.id === `con-${c.c.id}` || target.id === CON_OBJECT[c.c.id]);
      const below = c.label[2] < -0.05;
      if (below && !sci && !isTarget) continue;
      ctx.strokeStyle = isTarget ? 'rgba(255,211,107,0.85)' : below ? 'rgba(127,220,255,0.18)' : 'rgba(127,220,255,0.42)';
      ctx.lineWidth = isTarget ? 2 : 1.1;
      ctx.beginPath();
      for (const l of c.lines) polyline(l, f, W, H);
      ctx.stroke();
    }

    // Stars, brightest first; the list is sorted by brightness so we can stop at the limit.
    const fw = basis.forward;
    for (let i = 0; i < N_STARS; i++) {
      const mag = STARS[i * 4 + 2];
      if (mag > magLimit) break;
      const k = i * 3;
      if (chart.stars[k] * fw[0] + chart.stars[k + 1] * fw[1] + chart.stars[k + 2] * fw[2] < minDot) continue;
      const p = projectAt(chart.stars, k, f);
      if (!p || p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) continue;
      const below = !up(chart.stars, k);
      if (below && !sci) continue;
      const r = Math.max(0.55, (3.4 - 0.55 * mag) * (1 + zoomed * 0.18));
      ctx.globalAlpha = below ? 0.3 : Math.min(1, 0.45 + (magLimit - mag) * 0.25);
      ctx.fillStyle = STAR_COLORS[i];
      if (r < 1.1) ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      else { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill(); }
      const named = STAR_LABEL.get(i);
      if (named?.proper) {
        hits.push({ x: p[0], y: p[1], id: `star-${i}`, weak: true });
        const labelMag = (sci ? 2.2 : 1.0) + zoomed * 1.5;
        if (mag < labelMag || target?.id === `star-${i}`) {
          ctx.fillStyle = 'rgba(255,255,255,0.62)';
          ctx.font = '500 11px "Space Grotesk", system-ui, sans-serif';
          ctx.fillText(named.name, p[0], p[1] + r + 12);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Messier objects appear when zoomed in (or in Scientist view): a small ring, coloured by kind.
    if (sci || fov < 40) {
      ctx.font = '500 11px "Space Grotesk", system-ui, sans-serif';
      MESSIER.forEach((m, k) => {
        const v = chart.messier[k];
        if (v[2] < 0 && !sci) return;
        const p = projectAt(v, 0, f);
        if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) return;
        const id = messierJourney.get(m[0]) || `m-${m[0]}`;
        if (OBJECTS[id] && positions.some((x) => x.o?.id === id && (sci || x.kid))) return; // already drawn as a journey object
        ctx.globalAlpha = v[2] < 0 ? 0.35 : 0.85;
        ctx.strokeStyle = MESSIER_COLOR[m[3]] || '#cfd6ff';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`M${m[0]}`, p[0], p[1] - 8);
        hits.push({ x: p[0], y: p[1], id });
      });
      ctx.globalAlpha = 1;
    }

    // Constellation names: the famous ones at first, all of them when zoomed in or in Scientist view.
    ctx.font = '600 12px "Space Grotesk", system-ui, sans-serif';
    for (const c of chart.cons) {
      const below = c.label[2] < -0.05;
      if (below && !sci) continue;
      const p = projectAt(c.label, 0, f);
      if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
      const id = CON_OBJECT[c.c.id] || `con-${c.c.id}`;
      const show = sci || fov < 48 || c.c.rank === 1 || target?.id === id;
      if (!show) continue;
      ctx.globalAlpha = below ? 0.35 : 0.85;
      ctx.fillStyle = target?.id === id ? '#ffd36b' : 'rgba(127,220,255,0.9)';
      ctx.fillText((c.c[language()] || c.c.name).toUpperCase(), p[0], p[1]);
      hits.push({ x: p[0], y: p[1], id });
    }
    ctx.globalAlpha = 1;
  }

  function project(v, W, H, f) {
    const z = dot(v, basis.forward);
    if (z <= 0.05) return null;
    return [cx + (dot(v, basis.right) / z) * f, cy - (dot(v, basis.up) / z) * f];
  }

  function draw(now) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    measure();
    const f = Math.max(W, videoH) / 2 / Math.tan((fovNow() * DEG) / 2);
    ctx.clearRect(0, 0, W, H);
    hits = [];

    if (!stream) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(6,10,30,0.55)');
      g.addColorStop(1, 'rgba(20,10,40,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Ground: shade everything below the horizon.
    ctx.save();
    ctx.beginPath();
    let started = false;
    for (let az = 0; az <= 360; az += 3) {
      const p = project(vec(0, az), W, H, f);
      if (!p) { started = false; continue; }
      if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = 'rgba(120,220,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#5ad7ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
    const downZ = -dot([0, 0, 1], basis.forward);
    if (downZ > -0.2) {
      ctx.fillStyle = `rgba(40,16,10,${Math.min(0.35, 0.15 + downZ * 0.3)})`;
      // approximate tint when looking down
      const horizonY = project(vec(0, cameraAz()), W, H, f);
      const y = horizonY ? Math.max(0, Math.min(H, horizonY[1])) : (downZ > 0 ? 0 : H);
      ctx.fillRect(0, y, W, H - y);
    }

    // Explorer view keeps the sky simple: big compass letters, bright planets, constellation shapes and the target.
    const sci = isScientist();

    // Altitude rings and compass ticks.
    ctx.font = sci ? '600 12px "JetBrains Mono", ui-monospace, monospace' : '700 16px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let az = 0; az < 360; az += sci ? 15 : 90) {
      const p = project(vec(0, az), W, H, f);
      if (!p) continue;
      const major = az % 45 === 0;
      ctx.strokeStyle = 'rgba(120,220,255,0.6)';
      ctx.beginPath();
      ctx.moveTo(p[0], p[1] - (major ? 10 : 5));
      ctx.lineTo(p[0], p[1] + (major ? 10 : 5));
      ctx.stroke();
      if (major) {
        ctx.fillStyle = az === 0 ? '#ff6b8b' : '#9fe8ff';
        ctx.fillText(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][az / 45], p[0], p[1] - 16);
      }
    }
    for (const alt of sci ? [30, 60] : []) {
      ctx.beginPath();
      let s = false;
      for (let az = 0; az <= 360; az += 5) {
        const p = project(vec(alt, az), W, H, f);
        if (!p) { s = false; continue; }
        if (!s) { ctx.moveTo(p[0], p[1]); s = true; } else ctx.lineTo(p[0], p[1]);
      }
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = 'rgba(120,220,255,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const zen = project([0, 0, 1], W, H, f);
    if (zen && sci) { ctx.fillStyle = 'rgba(159,232,255,0.6)'; ctx.fillText('ZENITH', zen[0], zen[1]); }

    drawChart(W, H, f, sci);

    // Journey objects: planets, the Moon, nebulae, galaxies…
    ctx.font = '500 12px "Space Grotesk", system-ui, sans-serif';
    for (const p of positions) {
      const s = project(p.v, W, H, f);
      if (!s) continue;
      const below = p.alt < 0;
      const isTarget = target && p.o?.id === target.id;
      if (!sci && !isTarget && (below || !p.kid)) continue;
      ctx.globalAlpha = below ? 0.4 : 1;
      {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(s[0], s[1], isTarget ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = isTarget ? '#fff' : 'rgba(255,255,255,0.85)';
        ctx.fillText(t(p.o.name.replace(/ \(.*\)| –.*/g, '')) + (below ? ' ↓' : ''), s[0], s[1] - 10);
        hits.push({ x: s[0], y: s[1], id: p.o.id });
      }
      ctx.globalAlpha = 1;
    }

    drawTarget(now, W, H, f);
  }

  function cameraAz() {
    return norm360(Math.atan2(basis.forward[0], basis.forward[1]) / DEG);
  }
  function cameraAlt() {
    return Math.asin(Math.max(-1, Math.min(1, basis.forward[2]))) / DEG;
  }

  function drawTarget(now, W, H, f) {
    const guide = $('.sky-guide');
    const alert = $('.sky-alert');
    alert.hidden = !(mode === 'manual' && now < hintUntil);
    $('.sky-calibrate').hidden = !(target && mode === 'sensor' && targetHz && targetHz.alt > 0);

    if (!target || target.pos?.everywhere) $('.closeness').hidden = true;
    if (!target) {
      guide.innerHTML = `${t('Facing')} <b>${compassName(cameraAz())}</b> · ${Math.round(cameraAlt())}° ${t(cameraAlt() >= 0 ? 'up' : 'down')}`;
      $('.sky-alt').textContent = `${cameraAlt().toFixed(0)}°`;
      $('.sky-az').textContent = `${cameraAz().toFixed(0)}°`;
      $('.sky-extra').textContent = '';
      return;
    }

    if (target.pos?.everywhere) {
      guide.innerHTML = '<b>Point anywhere!</b> It is in every direction around you.';
      $('.sky-alt').textContent = '∀';
      $('.sky-az').textContent = '∀';
      $('.sky-extra').textContent = target.see;
      if (mode !== 'idle') tryLock(now, true);
      return;
    }
    if (!targetHz) return;

    const tv = vec(targetHz.alt, targetHz.az);
    const p = project(tv, W, H, f);
    const pulse = 1 + 0.12 * Math.sin(now / 180);
    const onScreen = p && p[0] > 0 && p[0] < W && p[1] > 0 && p[1] < H;

    if (onScreen) {
      const r = 26 * pulse;
      ctx.strokeStyle = '#ffd36b';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffd36b';
      ctx.shadowBlur = 12;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(p[0] + sx * r, p[1] + sy * (r - 10));
        ctx.lineTo(p[0] + sx * r, p[1] + sy * r);
        ctx.lineTo(p[0] + sx * (r - 10), p[1] + sy * r);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    } else {
      // Arrow on the screen edge pointing the way.
      const x = dot(tv, basis.right), y = dot(tv, basis.up);
      const ang = Math.atan2(-y, x);
      // Orbit the crosshair (the bottom of the screen is covered by the HUD).
      const R = viewR;
      const ax = cx + Math.cos(ang) * R, ay = cy + Math.sin(ang) * R;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,211,107,0.25)';
      ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = '#ffd36b';
      ctx.shadowColor = '#ffd36b';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(26 * pulse, 0); ctx.lineTo(-12, -17); ctx.lineTo(-5, 0); ctx.lineTo(-12, 17); ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffd36b';
      ctx.font = '600 13px "JetBrains Mono", ui-monospace, monospace';
      if (isScientist()) ctx.fillText(`${Math.round(angularDistance(targetHz.alt, targetHz.az, cameraAlt(), cameraAz()))}°`, cx + Math.cos(ang) * (R + 44), cy + Math.sin(ang) * (R + 44) + 4);
    }

    // Centre crosshair.
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 4, cy); ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 4); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 12);
    ctx.stroke();

    const dAz = wrap180(targetHz.az - cameraAz());
    const dAlt = targetHz.alt - cameraAlt();
    const sep = angularDistance(targetHz.alt, targetHz.az, cameraAlt(), cameraAz());
    let text;
    if (sep < LOCK_DEG) text = `<b class="locked">${t('◎ LOCKED ON')}</b>`;
    else if (!isScientist()) {
      // Explorer: big arrows and plain words instead of degrees.
      const amount = (d) => t(Math.abs(d) < 15 ? ' a little' : Math.abs(d) > 90 ? ' a lot' : '');
      const parts = [];
      if (Math.abs(dAz) > 3 && Math.abs(targetHz.alt) < 85) parts.push(`<span class="dir">${t(dAz > 0 ? 'Turn right' : 'Turn left')}${amount(dAz)} <b>${dAz > 0 ? '➜' : '⬅'}</b></span>`);
      if (Math.abs(dAlt) > 3) parts.push(`<span class="dir">${t(dAlt > 0 ? 'Look up' : 'Look down')}${amount(dAlt)} <b>${dAlt > 0 ? '⬆' : '⬇'}</b></span>`);
      text = parts.join('') || `<span class="dir">${t('Almost there…')}</span>`;
    } else {
      const parts = [];
      if (Math.abs(dAz) > 3 && Math.abs(targetHz.alt) < 85) parts.push(t('turn {dir}', { dir: `<b>${t(dAz > 0 ? 'right' : 'left')} ${Math.abs(Math.round(dAz))}°</b>` }));
      if (Math.abs(dAlt) > 3) parts.push(t('tilt {dir}', { dir: `<b>${t(dAlt > 0 ? 'up' : 'down')} ${Math.abs(Math.round(dAlt))}°</b>` }));
      text = parts.join(t(' and ')) || t('almost there…');
      text = text[0].toUpperCase() + text.slice(1);
    }
    guide.innerHTML = text;
    // Hot-and-cold meter: fills up as the phone gets closer to the target.
    const meter = $('.closeness');
    meter.hidden = mode === 'idle';
    meter.querySelector('i').style.width = `${Math.round(100 - (sep / 180) * 100)}%`;
    meter.querySelector('.closeness-text').textContent = t(sep < LOCK_DEG ? 'Found it!' : sep < 15 ? 'Almost there!' : sep < 45 ? 'Getting warmer…' : sep < 100 ? 'Keep turning…' : 'Cold – try the other way!');
    $('.sky-alt').textContent = `${targetHz.alt.toFixed(1)}°`;
    $('.sky-az').textContent = `${targetHz.az.toFixed(1)}° ${compassName(targetHz.az).replace(/orth|outh|ast|est/g, '').replace(/-/g, '')}`;

    let extra = '';
    if (satOf(target.pos)) extra = issText();
    else if (target.pos?.down) extra = 'Earth is right under your feet. Point straight down!';
    else if (targetHz.alt < 0) {
      extra = `🌏 ${t('Below your horizon right now – you’re pointing <i>through the Earth</i>.')}`;
      if (crossing?.time) extra += ` ${t('It rises at')} <b>${crossing.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>.`;
      else if (crossing?.never) extra += ' It never rises from where you are – people in the other hemisphere can see it.';
    } else if (crossing?.time) {
      extra = `${t('Above your horizon now. It sets at')} <b>${crossing.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>.`;
    } else if (crossing?.never) extra = t('It never sets from where you are.');
    $('.sky-extra').innerHTML = extra;

    if (target.safety && targetHz.alt > -2) {
      alert.hidden = false;
      alert.textContent = t('⚠ Never look at the Sun – point the phone, not your eyes!');
    }
    if (mode !== 'idle') tryLock(now, sep < LOCK_DEG);
  }

  function issText() {
    const now = skyNow();
    const upcoming = (passes || []).filter((p) => p.end > now);
    const vis = upcoming.find((p) => p.visible);
    let t = targetHz.alt > 0
      ? `🛰 Above your horizon right now, ${Math.round(targetHz.km).toLocaleString('en-US')} km away and moving fast!`
      : `🛰 Below your horizon – flying over ${targetHz.iss.lat.toFixed(0)}°, ${targetHz.iss.lon.toFixed(0)}° right now.`;
    if (vis) t += ` Next time you can <b>see it with your eyes</b>: <b>${fmtDay(vis.start)} ${fmtTime(vis.start)}</b>, up to ${Math.round(vis.maxAlt)}° high, from the ${compassName(vis.startAz)}.`;
    else if (upcoming[0]) t += ` Next pass overhead: ${fmtDay(upcoming[0].start)} ${fmtTime(upcoming[0].start)} (in daylight – hard to see).`;
    return t;
  }

  function tryLock(now, aligned) {
    if (!aligned) { lockStart = 0; return; }
    if (!lockStart) lockStart = now;
    if (now - lockStart > LOCK_MS && target && live() && !target.pos?.everywhere && !target.pos?.down && logObservation(target.id, target.name)) onLogged?.(target);
    if (now - lockStart > LOCK_MS && target && !target.chart && live() && markSpotted(target.id)) {
      $('.sky-spotted').hidden = false;
      onSpotted?.(target);
    }
  }

  function frame(now) {
    if (disposed) return;
    if (playRate && lastFrameAt) { timeOffset += playRate * (now - lastFrameAt); syncTime(); }
    lastFrameAt = now;
    const moved = Math.abs(timeOffset - computedOffset) > 20e3;
    if (now - lastCompute > 5000 || !lastCompute || (moved && now - lastCompute > 40)) {
      if (Math.abs(skyNow() - crossingAt) > 30 * 60e3) { crossing = null; passes = null; }
      computePositions(skyNow()); lastCompute = now; computedOffset = timeOffset;
    } else {
      // The ISS crosses the sky in minutes: keep it (and the target, if it is the ISS) up to date every frame.
      const d = skyNow();
      for (const p of positions) {
        if (!p.fast) continue;
        const h = whereIs(p.o.pos, observer, d);
        if (h) Object.assign(p, { alt: h.alt, az: h.az, v: vec(h.alt, h.az) });
      }
      if (satOf(target?.pos)) targetHz = whereIs(target.pos, observer, d) || targetHz;
    }
    if (aimPending && mode === 'manual' && targetHz) {
      look = { az: norm360(targetHz.az + 35), alt: Math.max(-20, Math.min(70, targetHz.alt)) };
      aimPending = false;
    }
    if (mode === 'sensor' && rawBasis) {
      const off = getSettings().headingOffset;
      const tgt = { forward: rotZ(rawBasis.forward, -off), right: rotZ(rawBasis.right, -off), up: rotZ(rawBasis.up, -off) };
      const k = 0.25;
      const fwd = norm(lerp(basis.forward, tgt.forward, k));
      const up0 = norm(lerp(basis.up, tgt.up, k));
      const right = norm(cross(fwd, up0));
      basis = { forward: fwd, right, up: cross(right, fwd) };
    } else if (mode !== 'sensor') {
      basis = basisFromLook(look.az, look.alt);
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  // ---------- sensors ----------
  function onOrientation(e) {
    if (e.alpha === null) return;
    let alpha = e.alpha;
    if (e.webkitCompassHeading !== undefined && !e.absolute) {
      // iOS: alpha is relative; align it to the compass once it settles.
      const off = norm360(360 - e.webkitCompassHeading - e.alpha);
      iosOffset = iosOffset === null ? off : iosOffset + wrap180(off - iosOffset) * 0.05;
      alpha = e.alpha + iosOffset;
    }
    const angle = screen.orientation?.angle ?? window.orientation ?? 0;
    rawBasis = basisFromOrientation(alpha, e.beta, e.gamma, angle);
    if (mode !== 'sensor') { mode = 'sensor'; basis = rawBasis; $('.sky-zoom').hidden = true; timeBar.hidden = false; }
  }

  async function startSensors() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        await DeviceOrientationEvent.requestPermission();
      }
    } catch { /* denied – fall back to manual */ }
    if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', onOrientation);
    else window.addEventListener('deviceorientation', onOrientation);
    setTimeout(() => { if (mode !== 'sensor' && !disposed) startManual(true); }, 1500);
  }

  async function startCamera() {
    if (!getSettings().camera || !navigator.mediaDevices?.getUserMedia) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (disposed) return stopCamera();
      video.srcObject = stream;
      video.hidden = false;
    } catch {
      stream = null;
    }
  }
  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
    video.hidden = true;
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition((p) => {
      observer = { lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) };
      setSettings({ location: observer });
      crossing = null; passes = null;
      lastCompute = 0;
      if (mode === 'manual' && !drag) aimPending = true;
      updateStatic();
    }, () => {}, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  }

  function startManual(auto) {
    if (mode === 'sensor') return;
    mode = 'manual';
    $('.sky-zoom').hidden = false;
    timeBar.hidden = false;
    $('.sky-start').hidden = true;
    if (auto) hintUntil = performance.now() + 6000;
    aimPending = !auto;
  }

  // Drag to look around (desktop / no sensors); pinch, scroll or the +/− buttons to zoom.
  let drag = null;
  const pointers = new Map();
  let pinch = null;
  const setZoom = (fov) => { zoomFov = Math.max(12, Math.min(120, fov)); };
  canvas.addEventListener('pointerdown', (e) => {
    aimPending = false;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), fov: zoomFov };
      drag = null;
      return;
    }
    drag = { x: e.clientX, y: e.clientY, az: look.az, alt: look.alt, moved: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pointers.size === 2 && mode !== 'sensor') {
      const [a, b] = [...pointers.values()];
      setZoom(pinch.fov * (pinch.d / Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1]))));
      return;
    }
    if (!drag || mode === 'sensor') return;
    const k = zoomFov / Math.max(canvas.clientWidth, canvas.clientHeight);
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    look.az = norm360(drag.az - dx * k);
    look.alt = Math.max(-89, Math.min(89, drag.alt + dy * k));
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    if (e.type === 'pointerup' && drag && !drag.moved) {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      // Stars only count when tapped closely, so planets and constellation names win near them.
      let best = null, bd = Infinity;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y) + (h.weak ? 14 : 0); if (d < bd && d < 34) { bd = d; best = h; } }
      if (best) setTarget(best.id);
    }
    drag = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', (e) => { if (mode === 'sensor') return; e.preventDefault(); setZoom(zoomFov * Math.exp(e.deltaY * 0.0015)); }, { passive: false });
  $('.sky-zoom-in').addEventListener('click', () => setZoom(zoomFov / 1.4));
  $('.sky-zoom-out').addEventListener('click', () => setZoom(zoomFov * 1.4));

  // Search everything in the sky.
  const searchBox = $('.sky-search'), searchInput = $('.sky-search-input'), searchResults = $('.sky-search-results');
  function renderSearch() {
    if (!searchInput.value.trim()) {
      const now = skyNow();
      const up = (tr) => tr.stops.filter((st) => { const k = resolveKey(st.key); const o = k && (OBJECTS[k] || chartTarget(k)); const h = o?.pos && whereIs(o.pos, observer, now); return h && h.alt > 0; }).length;
      const tours = toursFor(observer, now).map((tr) => ({ t: tr, up: up(tr) })).sort((a, b) => (b.t.id === 'tonight') - (a.t.id === 'tonight') || b.up / b.t.stops.length - a.up / a.t.stops.length);
      tourList = tours.map((x) => x.t);
      searchResults.innerHTML = `<div class="hud-label tour-label">${t('GUIDED TOURS')}</div>` + tours.map(({ t: tr, up: n }, i) => `<button role="option" data-tour="${i}"><b>${tr.emoji} ${tr.title}</b><small>${tr.best} · ${n} ${t('of')} ${tr.stops.length} ${t('stops up now')}</small></button>`).join('');
      return;
    }
    const res = searchSky(searchInput.value);
    searchResults.innerHTML = res.map((r) => `<button role="option" data-key="${r.key}"><b>${r.name}</b><small>${r.kind}</small></button>`).join('')
      || (searchInput.value.trim() ? `<p class="fine">${t('Nothing found – try a planet, a star like “Vega” or a constellation like “Leo”.')}</p>` : '');
  }
  $('.sky-search-btn').addEventListener('click', () => {
    searchBox.hidden = !searchBox.hidden;
    panel.hidden = true;
    if (!searchBox.hidden) { searchInput.value = ''; renderSearch(); searchInput.focus(); }
  });
  searchInput.addEventListener('input', renderSearch);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchResults.querySelector('button')?.click(); if (e.key === 'Escape') searchBox.hidden = true; });
  searchResults.addEventListener('click', (e) => {
    const tb = e.target.closest('[data-tour]');
    if (tb) { startTour(tourList[+tb.dataset.tour]); searchBox.hidden = true; return; }
    const b = e.target.closest('[data-key]');
    if (!b) return;
    setTarget(b.dataset.key);
    if (mode === 'manual') aimPending = true;
    searchBox.hidden = true;
  });

  // Time travel controls.
  const timeBar = $('.sky-time'), scrub = $('.sky-scrub'), playBtn = $('.sky-play');
  const RATES = [0, 600, 3600]; // stopped, 10 minutes a second, 1 hour a second
  function syncTime() {
    const when = skyNow();
    const label = live() ? t('Now') : when.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const h = timeOffset / 3600e3;
    const rel = live() ? '' : ` <small>${h > 0 ? '+' : '−'}${Math.abs(h) < 48 ? `${Math.abs(h).toFixed(1).replace(/\.0$/, '')} h` : `${Math.round(Math.abs(h) / 24)} days`}</small>`;
    $('.sky-time-label').innerHTML = `${label}${rel}`;
    scrub.value = Math.max(-1440, Math.min(1440, Math.round(timeOffset / 60e3)));
    $('.sky-now-btn').hidden = live();
    timeBar.classList.toggle('travelling', !live());
    // ▶ start → ▶▶ faster → ■ stop
    playBtn.textContent = { 0: '▶', 600: '▶▶', 3600: '■' }[playRate];
    playBtn.setAttribute('aria-label', { 0: 'Play time forward', 600: 'Faster', 3600: 'Stop time' }[playRate]);
    playBtn.classList.toggle('on', !!playRate);
  }
  const jump = (offsetMs) => { timeOffset = offsetMs; lockStart = 0; syncTime(); };
  scrub.addEventListener('input', () => { playRate = 0; jump(+scrub.value * 60e3); });
  $('.sky-now-btn').addEventListener('click', () => { playRate = 0; jump(0); });
  playBtn.addEventListener('click', () => { playRate = RATES[(RATES.indexOf(playRate) + 1) % RATES.length]; syncTime(); });
  $('.sky-date').addEventListener('click', (e) => { try { e.target.showPicker?.(); } catch { /* not supported – the field still works */ } });
  $('.sky-date').addEventListener('change', (e) => { const t = new Date(e.target.value); if (!isNaN(t)) { playRate = 0; jump(t - Date.now()); } });
  syncTime();

  // Guided tours: step from stop to stop, with the story read aloud where the device can speak.
  let tourList = [], tour = null, tourStep = 0;
  const canSpeak = typeof speechSynthesis !== 'undefined';
  const speak = (text) => {
    if (!canSpeak || getSettings().voice === false) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.lang = 'en'; // tour stories are English for now
    speechSynthesis.speak(u);
  };
  function showStop() {
    const st = tour.stops[tourStep];
    const key = resolveKey(st.key);
    setTarget(key);
    if (mode === 'manual') aimPending = true;
    $('.sky-tour-title').textContent = `${tour.emoji} ${tour.title}`;
    $('.sky-tour-say').textContent = st.say;
    $('.sky-tour-step').textContent = `${tourStep + 1} / ${tour.stops.length}`;
    $('.sky-tour-prev').disabled = tourStep === 0;
    $('.sky-tour-next').textContent = t(tourStep === tour.stops.length - 1 ? 'Finish ✓' : 'Next →');
    $('.sky-tour-voice').hidden = !canSpeak;
    $('.sky-tour-voice').textContent = getSettings().voice === false ? '🔇' : '🔊';
    speak(st.say);
  }
  function startTour(t) {
    tour = t; tourStep = 0;
    $('.sky-tour').hidden = false;
    if (mode === 'idle') startManual(false);
    speak(t.intro);
    showStop();
  }
  function endTour() {
    tour = null;
    $('.sky-tour').hidden = true;
    if (canSpeak) speechSynthesis.cancel();
  }
  $('.sky-tour-next').addEventListener('click', () => {
    if (tourStep < tour.stops.length - 1) { tourStep++; showStop(); } else { onTourDone?.(tour); endTour(); }
  });
  $('.sky-tour-prev').addEventListener('click', () => { if (tourStep > 0) { tourStep--; showStop(); } });
  $('.sky-tour-exit').addEventListener('click', endTour);
  $('.sky-tour-voice').addEventListener('click', () => {
    setSettings({ voice: getSettings().voice === false });
    $('.sky-tour-voice').textContent = getSettings().voice === false ? '🔇' : '🔊';
    if (getSettings().voice === false && canSpeak) speechSynthesis.cancel();
  });

  // Red night mode keeps your eyes adjusted to the dark (applies to the whole app).
  $('.sky-night').addEventListener('click', () => {
    setSettings({ night: !getSettings().night });
    document.documentElement.classList.toggle('night', !!getSettings().night);
  });

  $('.sky-engage').addEventListener('click', async () => {
    $('.sky-start').hidden = true;
    locate();
    await Promise.all([startSensors(), startCamera()]);
  });
  $('.sky-manual').addEventListener('click', () => { locate(); startManual(false); });
  $('.sky-cam').addEventListener('click', () => {
    const on = !stream;
    setSettings({ camera: on });
    if (on) startCamera(); else stopCamera();
  });
  $('.sky-calibrate').addEventListener('click', () => {
    if (!targetHz) return;
    const err = wrap180(cameraAz() - targetHz.az);
    setSettings({ headingOffset: Math.round(wrap180(getSettings().headingOffset - err)) });
    syncSettingsPanel();
  });

  // Settings panel.
  const panel = $('.sky-settings');
  function syncSettingsPanel() {
    const s = getSettings();
    root.querySelectorAll('.sky-mode [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === (s.mode || 'explorer')));
    $('.set-fov').value = s.fov; $('.set-fov-v').textContent = `${s.fov}°`;
    $('.set-head').value = s.headingOffset; $('.set-head-v').textContent = `${s.headingOffset > 0 ? '+' : ''}${s.headingOffset}°`;
    $('.set-lat').value = observer.lat; $('.set-lon').value = observer.lon;
  }
  $('.sky-gear').addEventListener('click', () => { panel.hidden = !panel.hidden; searchBox.hidden = true; syncSettingsPanel(); });
  $('.set-fov').addEventListener('input', (e) => { setSettings({ fov: +e.target.value }); syncSettingsPanel(); });
  $('.set-head').addEventListener('input', (e) => { setSettings({ headingOffset: +e.target.value }); syncSettingsPanel(); });
  $('.set-gps').addEventListener('click', locate);
  root.querySelectorAll('.sky-mode [data-mode]').forEach((b) => b.addEventListener('click', () => {
    setSettings({ mode: b.dataset.mode });
    document.body.classList.toggle('scientist', isScientist());
    syncSettingsPanel();
  }));
  $('.set-save').addEventListener('click', () => {
    const lat = parseFloat($('.set-lat').value), lon = parseFloat($('.set-lon').value);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      observer = { lat, lon };
      setSettings({ location: observer });
      crossing = null; passes = null; lastCompute = 0;
      updateStatic();
    }
    panel.hidden = true;
  });

  // Manual-mode hint shown when sensors don't respond.
  $('.sky-alert').textContent = t('No motion sensors detected – drag the sky to look around.');
  video.hidden = true;

  if (tourId) { const t = toursFor(observer, skyNow()).find((x) => x.id === tourId); if (t) startTour(t); }

  refreshAllTLE().then((fresh) => { if (fresh) { passes = null; lastCompute = 0; } });
  window.addEventListener('resize', resize);
  resize();
  updateStatic();
  raf = requestAnimationFrame(frame);

  return {
    setTarget,
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      stopCamera();
      window.removeEventListener('resize', resize);
      if (canSpeak) speechSynthesis.cancel();
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('deviceorientationabsolute', onOrientation);
    },
  };
}
