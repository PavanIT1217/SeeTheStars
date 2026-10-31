// Extra things the Sky Finder can draw over the sky: constellation pictures, clouds, wind and rain.
// Clouds and wind live on a flat "deck" above you (height 1), so they shrink towards the horizon and drift
// with the real wind direction, just like real clouds seen from the ground.
import { FIGURE_ART, pathToPolylines, frameToSky } from './data/figures.js';
import { equatorialVector } from './astro.js';
import { cloudAt, dirName } from './weather.js';

const DEG = Math.PI / 180;

// Constellation pictures as equatorial unit vectors, worked out once.
export const FIGURES = Object.entries(FIGURE_ART).map(([id, art]) => ({
  id,
  title: art.title,
  centre: equatorialVector(...art.c),
  parts: art.parts.map(([w, d]) => ({
    w,
    lines: pathToPolylines(d).map((pts) => {
      const out = new Float32Array(pts.length * 3);
      pts.forEach((p, k) => out.set(equatorialVector(...frameToSky(p, art.c)), k * 3));
      return out;
    }),
  })),
}));

// Deterministic random numbers, so the clouds look the same every time.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const DECK_R = 40; // how far the cloud deck reaches (in deck heights): down to about 1.5° above the horizon
const N_PUFFS = 320, N_STREAKS = 150;

function sprite(rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.45, `rgba(${rgb},0.55)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export function createLayers() {
  const rand = rng(20261031);
  // Puffs spread out more thinly far away, but each is bigger there, so the deck stays covered.
  const puffs = Array.from({ length: N_PUFFS }, () => {
    const r = DECK_R * Math.pow(rand(), 1.7), a = rand() * Math.PI * 2;
    return { x: r * Math.sin(a), y: r * Math.cos(a), size: 0.55 + 0.16 * r * (0.7 + rand() * 0.6), th: rand() };
  });
  const streaks = Array.from({ length: N_STREAKS }, () => ({ x: 0, y: 0, life: 0, max: 1 }));
  const drops = [];
  let puffImg = null, artCanvas = null;

  const toVec = (x, y) => { const l = Math.hypot(x, y, 1); return [x / l, y / l, 1 / l]; };
  const windVec = (wx, scale) => {
    const to = ((wx.centre.windFrom ?? 0) + 180) * DEG, s = (wx.centre.wind ?? 0) * scale;
    return [Math.sin(to) * s, Math.cos(to) * s];
  };

  function drawClouds(ctx, v, wx, dt) {
    if (!wx) return;
    puffImg ||= sprite('214,222,238');
    const [vx, vy] = windVec(wx, 0.0025);
    const base = v.camera ? 0.42 : 0.55;
    for (const p of puffs) {
      p.x += vx * dt; p.y += vy * dt;
      const r = Math.hypot(p.x, p.y);
      if (r > DECK_R) { p.x = -p.x * 0.98; p.y = -p.y * 0.98; } // blown off one side, comes back on the other
      const dir = toVec(p.x, p.y);
      const alt = Math.asin(dir[2]) / DEG, az = Math.atan2(dir[0], dir[1]) / DEG;
      const a = Math.min(1, (cloudAt(wx, az, alt) - p.th * 0.85) * 2.4);
      if (a <= 0.02) continue;
      const s = v.project(dir);
      if (!s) continue;
      // Never much bigger than its height above the horizon, so clouds don't spill onto the ground.
      const rad = Math.min((p.size / Math.hypot(r, 1)) * v.pxPerRad * 0.95, Math.asin(dir[2]) * v.pxPerRad * 1.3);
      if (rad < 1.5 || s[0] < -rad || s[0] > v.W + rad || s[1] < -rad || s[1] > v.H + rad) continue;
      ctx.globalAlpha = a * base;
      ctx.drawImage(puffImg, s[0] - rad, s[1] - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawWind(ctx, v, wx, dt) {
    if (!wx || wx.centre.windFrom === null) return;
    const speed = wx.centre.wind ?? 0;
    const [vx, vy] = windVec(wx, 0.012);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    for (const p of streaks) {
      p.life += dt;
      if (p.life > p.max || Math.hypot(p.x, p.y) > 14) {
        const r = 14 * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
        Object.assign(p, { x: r * Math.sin(a), y: r * Math.cos(a), life: 0, max: 2 + Math.random() * 3 });
      }
      p.x += vx * dt; p.y += vy * dt;
      if (speed < 1) continue;
      const a = v.project(toVec(p.x, p.y)), b = v.project(toVec(p.x - vx * 0.5, p.y - vy * 0.5));
      if (!a || !b || Math.abs(a[0] - b[0]) > v.W) continue;
      const fade = Math.sin((p.life / p.max) * Math.PI);
      ctx.strokeStyle = `rgba(190,240,255,${(0.7 * fade).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.stroke();
    }
    // Where the wind comes from, on the horizon.
    const from = wx.centre.windFrom;
    const s = v.project(v.vec(4, from));
    if (s && s[0] > 0 && s[0] < v.W && s[1] > 0 && s[1] < v.H) {
      ctx.fillStyle = 'rgba(190,240,255,0.95)';
      ctx.font = '600 13px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💨 ${v.t('Wind from the {dir}', { dir: v.t(dirName(from)) })} · ${Math.round(speed)} km/h`, s[0], s[1] - 6);
    }
  }

  function drawRain(ctx, v, wx, dt) {
    if (!wx) return;
    const mm = wx.centre.precip ?? 0;
    const want = mm > 0 ? Math.min(260, Math.round(40 + mm * 70)) : 0;
    while (drops.length < want) drops.push({ x: Math.random() * v.W, y: Math.random() * v.H, s: 0.6 + Math.random() * 0.8 });
    drops.length = want;
    if (!want) return;
    // Rain leans with the wind as it crosses your view.
    const to = ((wx.centre.windFrom ?? 0) + 180 - v.camAz) * DEG;
    const lean = Math.sin(to) * Math.min(1, (wx.centre.wind ?? 0) / 40);
    const snow = wx.snow;
    ctx.strokeStyle = 'rgba(170,200,255,0.5)';
    ctx.fillStyle = 'rgba(240,245,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of drops) {
      const fall = (snow ? 60 : 700) * d.s * dt;
      d.y += fall; d.x += lean * fall * (snow ? 1.5 : 0.35) + (snow ? Math.sin(d.y / 30) * 0.4 : 0);
      if (d.y > v.H) { d.y = -10; d.x = Math.random() * v.W; }
      if (d.x < 0) d.x += v.W; else if (d.x > v.W) d.x -= v.W;
      if (snow) { ctx.moveTo(d.x + 1.6 * d.s, d.y); ctx.arc(d.x, d.y, 1.6 * d.s, 0, Math.PI * 2); }
      else { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - lean * 9 * d.s, d.y - 14 * d.s); }
    }
    if (snow) ctx.fill(); else ctx.stroke();
  }

  // The pictures go on their own layer first, so where parts overlap they don't get darker.
  function drawFigures(ctx, v, figs, highlight) {
    if (!figs) return;
    const dpr = ctx.getTransform().a || 1;
    artCanvas ||= document.createElement('canvas');
    if (artCanvas.width !== ctx.canvas.width || artCanvas.height !== ctx.canvas.height) { artCanvas.width = ctx.canvas.width; artCanvas.height = ctx.canvas.height; }
    const a = artCanvas.getContext('2d');
    a.setTransform(dpr, 0, 0, dpr, 0, 0);
    a.clearRect(0, 0, v.W, v.H);
    const pxPerDeg = v.pxPerRad * DEG;
    const outlines = [];
    for (const fig of figs) {
      if (fig.centre[2] < -0.12 && fig.id !== highlight) continue;
      if (v.project(fig.centre) === null) continue;
      a.fillStyle = a.strokeStyle = fig.id === highlight ? '#ffd36b' : '#f5e3b5';
      for (const part of fig.parts) {
        a.beginPath();
        let ok = true;
        for (const line of part.lines) {
          for (let k = 0; k < line.length; k += 3) {
            const p = v.projectAt(line, k);
            if (!p) { ok = false; break; }
            if (k === 0) a.moveTo(p[0], p[1]); else a.lineTo(p[0], p[1]);
          }
          if (!ok) break;
        }
        if (!ok) continue;
        if (part.w) { a.lineWidth = Math.max(1, part.w * pxPerDeg); a.lineCap = a.lineJoin = 'round'; a.stroke(); }
        else { a.fill(); outlines.push(part, fig.id === highlight); }
      }
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = v.camera ? 0.16 : 0.2;
    ctx.drawImage(artCanvas, 0, 0);
    ctx.restore();
    // A fine outline around the filled shapes.
    ctx.lineWidth = 1;
    for (let i = 0; i < outlines.length; i += 2) {
      ctx.strokeStyle = outlines[i + 1] ? 'rgba(255,211,107,0.7)' : 'rgba(245,227,181,0.4)';
      ctx.beginPath();
      for (const line of outlines[i].lines) for (let k = 0; k < line.length; k += 3) { const p = v.projectAt(line, k); if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
      ctx.stroke();
    }
  }

  return { drawClouds, drawWind, drawRain, drawFigures };
}
