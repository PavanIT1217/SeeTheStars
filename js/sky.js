// Sky Finder: point your phone and see where things are – even through the Earth.
import { OBJECTS, SECTORS, FIGURES, GUIDE_STARS } from './data/catalog.js';
import { toHorizontal, julianDate, compassName, nextHorizonCrossing, angularDistance, norm360 } from './astro.js';
import { getSettings, setSettings, markSpotted, isSpotted, isScientist } from './store.js';
import { locate as whereIs } from './where.js';
import { predictPasses, refreshTLE } from './iss.js';

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

export function mountSky(root, { targetId, onTarget, onSpotted }) {
  const settings = getSettings();
  let observer = settings.location || guessLocation();
  let target = OBJECTS[targetId] || null;
  let mode = 'idle'; // idle | sensor | manual
  let look = { az: 180, alt: 30 };
  let basis = basisFromLook(look.az, look.alt);
  let rawBasis = null;
  let iosOffset = null;
  let stream = null;
  let raf = 0;
  let positions = [];
  let figures = [];
  let targetHz = null;
  let lockStart = 0;
  let lastCompute = 0;
  let crossing = null;
  let passes = null; // ISS passes for the current observer
  let hits = [];
  let disposed = false;
  let hintUntil = 0;
  let aimPending = false; // point the drag view near the target once its position is known

  root.innerHTML = `
    <div class="sky">
      <video class="sky-video" playsinline muted autoplay></video>
      <canvas class="sky-canvas"></canvas>
      <div class="sky-top">
        <select class="sky-select" aria-label="Choose what to find"></select>
        <button class="icon-btn sky-cam" title="Camera on/off" aria-label="Camera on or off">◉</button>
        <button class="icon-btn sky-gear" title="Settings" aria-label="Sky settings">⚙</button>
      </div>
      <div class="sky-alert" hidden></div>
      <div class="sky-hud glass">
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
          <a class="btn ghost sky-learn" href="#">Learn about it</a>
          <button class="btn ghost sky-calibrate" hidden>It’s right here – calibrate</button>
        </div>
      </div>
      <div class="sky-start">
        <div class="sky-start-card glass">
          <div class="hud-label">SKY SCANNER</div>
          <h2>Find anything in the universe</h2>
          <p>Hold your phone up like you’re taking a photo. Arrows will guide you to your target – even if it is on the other side of the Earth.</p>
          <button class="btn primary sky-engage">Engage scanner</button>
          <button class="btn ghost sky-manual">No sensors? Drag to explore</button>
          <p class="fine">Uses your camera, motion sensors and location. Nothing leaves your device.</p>
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
    target = OBJECTS[id] || null;
    select.value = target?.id || '';
    lockStart = 0;
    crossing = null; passes = null;
    lastCompute = 0;
    onTarget?.(target?.id || null);
    updateStatic();
  }

  function updateStatic() {
    $('.sky-name').innerHTML = target ? `${target.name}<small>${target.kind}</small>` : 'Free look<small>Tap anything on screen to target it</small>';
    $('.sky-learn').href = target ? `#/object/${target.id}` : '#/';
    $('.sky-learn').hidden = !target;
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
      positions.push({ fast: !!o.pos.iss, kid: !!o.pos.iss || ['home', 'rocky', 'giants'].includes(o.sector), o, alt: h.alt, az: h.az, v: vec(h.alt, h.az), color: TYPE_COLORS[o.art?.type] || '#fff' });
    }
    for (const [name, ra, dec] of GUIDE_STARS) {
      const h = toHorizontal(ra, dec, observer.lat, observer.lon, jd);
      positions.push({ guide: name, alt: h.alt, az: h.az, v: vec(h.alt, h.az) });
    }
    figures = Object.entries(FIGURES).map(([id, f]) => ({
      id,
      name: OBJECTS[id].name.split(/ [&–]/)[0],
      stars: f.stars.map(([n, ra, dec]) => { const h = toHorizontal(ra, dec, observer.lat, observer.lon, jd); return { n, alt: h.alt, v: vec(h.alt, h.az) }; }),
      lines: f.lines,
    }));
    if (target) {
      if (target.pos?.down) targetHz = { alt: -90, az: 0 };
      else if (target.pos?.everywhere) targetHz = null;
      else targetHz = whereIs(target.pos, observer, now);
      if (target.pos?.iss) { if (!passes) passes = predictPasses(observer, now, 72); }
      else if (targetHz && !crossing) crossing = nextHorizonCrossing(target.pos, observer, now);
    } else targetHz = null;
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

  function project(v, W, H, f) {
    const z = dot(v, basis.forward);
    if (z <= 0.05) return null;
    return [cx + (dot(v, basis.right) / z) * f, cy - (dot(v, basis.up) / z) * f];
  }

  function draw(now) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    measure();
    const f = Math.max(W, videoH) / 2 / Math.tan((getSettings().fov * DEG) / 2);
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

    // Constellation figures.
    for (const fig of figures) {
      const pts = fig.stars.map((s) => project(s.v, W, H, f));
      const below = fig.stars.every((s) => s.alt < 0);
      if (below && !sci && fig.id !== target?.id) continue;
      ctx.globalAlpha = below ? 0.35 : 0.9;
      ctx.strokeStyle = 'rgba(127,220,255,0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      for (const [i, j] of fig.lines) {
        if (!pts[i] || !pts[j]) continue;
        ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[j]); ctx.stroke();
      }
      ctx.setLineDash([]);
      let cx = 0, cy = 0, n = 0;
      pts.forEach((p) => {
        if (!p) return;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2); ctx.fill();
        cx += p[0]; cy += p[1]; n++;
      });
      if (n) {
        ctx.fillStyle = 'rgba(127,220,255,0.9)';
        ctx.font = '600 13px "Orbitron", "Space Grotesk", sans-serif';
        ctx.fillText(fig.name.toUpperCase(), cx / n, cy / n + 22);
        hits.push({ x: cx / n, y: cy / n, id: fig.id });
      }
      ctx.globalAlpha = 1;
    }

    // Objects and guide stars.
    ctx.font = '500 12px "Space Grotesk", system-ui, sans-serif';
    for (const p of positions) {
      const s = project(p.v, W, H, f);
      if (!s) continue;
      const below = p.alt < 0;
      const isTarget = target && p.o?.id === target.id;
      if (!sci && !isTarget && (below || (!p.guide && !p.kid))) continue;
      ctx.globalAlpha = below ? 0.4 : 1;
      if (p.guide) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s[0], s[1], 1.8, 0, Math.PI * 2); ctx.fill();
        if (sci) {
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillText(p.guide, s[0], s[1] + 14);
        }
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(s[0], s[1], isTarget ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = isTarget ? '#fff' : 'rgba(255,255,255,0.85)';
        ctx.fillText(p.o.name.replace(/ \(.*\)| –.*/g, '') + (below ? ' ↓' : ''), s[0], s[1] - 10);
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
      guide.innerHTML = `Facing <b>${compassName(cameraAz())}</b> · ${Math.round(cameraAlt())}° ${cameraAlt() >= 0 ? 'up' : 'down'}`;
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
    if (sep < LOCK_DEG) text = '<b class="locked">◎ LOCKED ON</b>';
    else if (!isScientist()) {
      // Explorer: big arrows and plain words instead of degrees.
      const amount = (d) => (Math.abs(d) < 15 ? ' a little' : Math.abs(d) > 90 ? ' a lot' : '');
      const parts = [];
      if (Math.abs(dAz) > 3 && Math.abs(targetHz.alt) < 85) parts.push(`<span class="dir">${dAz > 0 ? 'Turn right' : 'Turn left'}${amount(dAz)} <b>${dAz > 0 ? '➜' : '⬅'}</b></span>`);
      if (Math.abs(dAlt) > 3) parts.push(`<span class="dir">${dAlt > 0 ? 'Look up' : 'Look down'}${amount(dAlt)} <b>${dAlt > 0 ? '⬆' : '⬇'}</b></span>`);
      text = parts.join('') || '<span class="dir">Almost there…</span>';
    } else {
      const parts = [];
      if (Math.abs(dAz) > 3 && Math.abs(targetHz.alt) < 85) parts.push(`turn <b>${dAz > 0 ? 'right' : 'left'} ${Math.abs(Math.round(dAz))}°</b>`);
      if (Math.abs(dAlt) > 3) parts.push(`tilt <b>${dAlt > 0 ? 'up' : 'down'} ${Math.abs(Math.round(dAlt))}°</b>`);
      text = parts.join(' and ') || 'almost there…';
      text = text[0].toUpperCase() + text.slice(1);
    }
    guide.innerHTML = text;
    // Hot-and-cold meter: fills up as the phone gets closer to the target.
    const meter = $('.closeness');
    meter.hidden = mode === 'idle';
    meter.querySelector('i').style.width = `${Math.round(100 - (sep / 180) * 100)}%`;
    meter.querySelector('.closeness-text').textContent = sep < LOCK_DEG ? 'Found it!' : sep < 15 ? 'Almost there!' : sep < 45 ? 'Getting warmer…' : sep < 100 ? 'Keep turning…' : 'Cold – try the other way!';
    $('.sky-alt').textContent = `${targetHz.alt.toFixed(1)}°`;
    $('.sky-az').textContent = `${targetHz.az.toFixed(1)}° ${compassName(targetHz.az).replace(/orth|outh|ast|est/g, '').replace(/-/g, '')}`;

    let extra = '';
    if (target.pos?.iss) extra = issText();
    else if (target.pos?.down) extra = 'Earth is right under your feet. Point straight down!';
    else if (targetHz.alt < 0) {
      extra = `🌏 Below your horizon right now – you’re pointing <i>through the Earth</i>.`;
      if (crossing?.time) extra += ` It rises at <b>${crossing.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>.`;
      else if (crossing?.never) extra += ' It never rises from where you are – people in the other hemisphere can see it.';
    } else if (crossing?.time) {
      extra = `Above your horizon now. It sets at <b>${crossing.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>.`;
    } else if (crossing?.never) extra = 'It never sets from where you are.';
    $('.sky-extra').innerHTML = extra;

    if (target.safety && targetHz.alt > -2) {
      alert.hidden = false;
      alert.textContent = '⚠ Never look at the Sun – point the phone, not your eyes!';
    }
    if (mode !== 'idle') tryLock(now, sep < LOCK_DEG);
  }

  function issText() {
    const now = new Date();
    const upcoming = (passes || []).filter((p) => p.end > now);
    const vis = upcoming.find((p) => p.visible);
    let t = targetHz.alt > 0
      ? `🛰 Above your horizon right now, ${Math.round(targetHz.km).toLocaleString('en-US')} km away and moving fast!`
      : `🛰 Below your horizon – over ${targetHz.iss.lat.toFixed(0)}°, ${targetHz.iss.lon.toFixed(0)}° right now.`;
    if (vis) t += ` Next time you can <b>see it with your eyes</b>: <b>${fmtDay(vis.start)} ${fmtTime(vis.start)}</b>, up to ${Math.round(vis.maxAlt)}° high, from the ${compassName(vis.startAz)}.`;
    else if (upcoming[0]) t += ` Next pass overhead: ${fmtDay(upcoming[0].start)} ${fmtTime(upcoming[0].start)} (in daylight – hard to see).`;
    return t;
  }

  function tryLock(now, aligned) {
    if (!aligned) { lockStart = 0; return; }
    if (!lockStart) lockStart = now;
    if (now - lockStart > LOCK_MS && target && markSpotted(target.id)) {
      $('.sky-spotted').hidden = false;
      onSpotted?.(target);
    }
  }

  function frame(now) {
    if (disposed) return;
    if (now - lastCompute > 5000 || !lastCompute) { computePositions(new Date()); lastCompute = now; }
    else {
      // The ISS crosses the sky in minutes: keep it (and the target, if it is the ISS) up to date every frame.
      const d = new Date();
      for (const p of positions) {
        if (!p.fast) continue;
        const h = whereIs(p.o.pos, observer, d);
        if (h) Object.assign(p, { alt: h.alt, az: h.az, v: vec(h.alt, h.az) });
      }
      if (target?.pos?.iss) targetHz = whereIs(target.pos, observer, d) || targetHz;
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
    if (mode !== 'sensor') { mode = 'sensor'; basis = rawBasis; }
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
    $('.sky-start').hidden = true;
    if (auto) hintUntil = performance.now() + 6000;
    aimPending = !auto;
  }

  // Drag to look around (desktop / no sensors).
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { aimPending = false; drag = { x: e.clientX, y: e.clientY, az: look.az, alt: look.alt, moved: false }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || mode === 'sensor') return;
    const k = getSettings().fov / Math.max(canvas.clientWidth, canvas.clientHeight);
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    look.az = norm360(drag.az - dx * k);
    look.alt = Math.max(-89, Math.min(89, drag.alt + dy * k));
  });
  canvas.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved) {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      let best = null, bd = 34;
      for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
      if (best) setTarget(best.id);
    }
    drag = null;
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
  $('.sky-gear').addEventListener('click', () => { panel.hidden = !panel.hidden; syncSettingsPanel(); });
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
  $('.sky-alert').textContent = 'No motion sensors detected – drag the sky to look around.';
  video.hidden = true;

  refreshTLE().then((fresh) => { if (fresh) { passes = null; lastCompute = 0; } });
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
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('deviceorientationabsolute', onOrientation);
    },
  };
}
