// Page markup, as plain functions that return HTML strings and never touch the DOM.
// The app (js/app.js) renders these into the page and wires up the buttons; the build
// script (scripts/build-pages.mjs) runs the same functions in Node to pre-render a static,
// search-engine-friendly HTML page for every route.
import { SECTORS, OBJECTS, JOURNEY, sectorById } from './data/catalog.js';
import { CHAPTERS, HIGHLIGHTS } from './data/highlights.js';
import { PHOTOS } from './data/photos.js';
import { artSVG } from './art.js';
import * as store from './store.js';
import * as media from './media.js';
import { horizontalFor, formatRA, formatDec, lightTime, compassName, julianDate, skyPosition, nextHorizonCrossing, riseSet, moonPhase, nextMoonPhase, KM_PER_AU } from './astro.js';
import { timeMachine, formatYears } from './timemachine.js';
import { kidFacts, diameterKm, sizeComparison } from './kidfacts.js';
import { issState } from './iss.js';
import { tonightPlan } from './tonight.js';
import { REMINDER_KINDS, DEFAULT_PREFS } from './reminders.js';
import { t, LANGUAGES, language } from './i18n.js';

export const SITE = {
  name: 'See the Stars',
  origin: 'https://seethestars.webappslab.com',
  tagline: 'A journey through the universe for curious minds',
};

export const url = {
  home: '/',
  sector: (id) => `/sector/${id}/`,
  object: (id) => `/object/${id}/`,
  sky: (id) => (id ? `/sky/${id}/` : '/sky/'),
  tonight: '/tonight/',
  classroom: '/classroom/',
  worksheet: (id) => `/classroom/worksheet/${id}/`,
  quiz: (id) => `/quiz/${id}/`,
  library: '/library/',
  me: '/me/',
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
export const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const CATEGORY_ICONS = {
  Planets: '🪐', Moons: '🌙', 'Dwarf planets': '🪨', Comets: '☄️', Spacecraft: '🛰️', Stars: '⭐', Exoplanets: '🌍',
  Constellations: '✨', 'Star clusters': '✨', Nebulae: '🌫️', Pulsars: '💫', 'Black holes': '🕳️', Galaxies: '🌌', Cosmology: '💥',
};
export const CATEGORIES = ['All', ...Object.keys(CATEGORY_ICONS)];

export function category(o) {
  const t = o.art?.type;
  if (o.id === 'moon') return 'Moons';
  if (t === 'planet' || t === 'earth') return o.sector === 'dwarfs' ? 'Dwarf planets' : 'Planets';
  return { star: 'Stars', constellation: 'Constellations', nebula: 'Nebulae', ring: 'Nebulae', cluster: 'Star clusters', pulsar: 'Pulsars', blackhole: 'Black holes', galaxy: 'Galaxies', cosmos: 'Cosmology', comet: 'Comets', exoplanet: 'Exoplanets', system: 'Exoplanets', iss: 'Spacecraft' }[t] || 'Other';
}

export function observer() {
  const loc = store.getSettings().location;
  if (loc) return loc;
  return { lat: 30, lon: Math.max(-180, Math.min(180, (-new Date().getTimezoneOffset() / 60) * 15)), approx: true };
}

const hueOf = (o) => sectorById(o.sector)?.hue ?? 220;
export const chapterOf = (sectorId) => CHAPTERS.findIndex((c) => c.sectors.includes(sectorId));
const shortName = (o) => o.name.replace(/^The /, '');

// A real photo. If it can't load (offline, say) the app draws the object's illustration in its place
// (see fillArt in app.js), so pages stay light: drawings are only made when they're needed.
export function photo(o, { size = 'sm', cls = '', eager = false, alt = '' } = {}) {
  const src = PHOTOS[o.id]?.[size];
  const img = src
    ? `<img src="${src}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onload="this.classList.add('in')" onerror="window.fillArt?.(this)">`
    : '';
  return `<div class="ph ${cls}" style="--hue:${hueOf(o)}" data-id="${o.id}">${src ? img : `<div class="ph-art">${artSVG(o)}</div>`}</div>`;
}

// Swap a photo that failed to load for the drawn illustration.
export function artFallback(img) {
  const box = img.closest('.ph');
  const o = box && OBJECTS[box.dataset.id];
  if (o) box.insertAdjacentHTML('afterbegin', `<div class="ph-art">${artSVG(o)}</div>`);
  img.remove();
}

export function crumbs(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href]) => (href ? `<a href="${href}">${label}</a>` : `<span aria-current="page">${label}</span>`)).join('<span aria-hidden="true">/</span>')}</nav>`;
}

export function progressBar(frac) {
  return `<div class="bar"><span style="width:${Math.round(frac * 100)}%"></span></div>`;
}

export function rankRing(xp, r) {
  return `<div class="rank-ring" style="--p:${r.next ? (xp - r.floor) / (r.next.at - r.floor) : 1}"><span>${xp}</span><small>XP</small></div>`;
}

export function objCard(o, num) {
  const learned = store.isLearned(o.id);
  return `<a class="obj-card" href="${url.object(o.id)}">
    ${photo(o, { alt: o.name })}
    <span class="badges">${learned ? '<span class="tick" title="Explored">✓</span>' : ''}${store.isSpotted(o.id) ? '<span class="spot" title="Spotted in the sky">✦</span>' : ''}${media.isSaved(o.id) ? '<span class="dl" title="Saved offline">⤓</span>' : ''}</span>
    <div class="body">${num ? `<span class="num">${String(num).padStart(2, '0')}</span>` : ''}<b>${o.name}</b><small>${o.kind}</small></div>
  </a>`;
}

export function modeSwitch() {
  const sci = store.isScientist();
  return `<div class="segmented" role="radiogroup" aria-label="Detail level">
    <button role="radio" aria-checked="${!sci}" data-mode="explorer" class="${sci ? '' : 'on'}"><span>🧑‍🚀</span><b>${t('Explorer')}</b><small>${t('Simple and fun')}</small></button>
    <button role="radio" aria-checked="${sci}" data-mode="scientist" class="${sci ? 'on' : ''}"><span>🔬</span><b>${t('Scientist')}</b><small>${t('All the data')}</small></button>
  </div>`;
}

// ───────────────────────── home ─────────────────────────
const daysUntil = (d, now) => {
  const days = Math.round((d - now) / 86400e3);
  return days <= 0 ? t('today') : days === 1 ? t('tomorrow') : t('in {n} days', { n: days });
};

// Tonight's Moon: phase, how much is lit, rise and set, and the next full or new Moon.
export function moonHtml(now = new Date()) {
  const obs = observer();
  const ph = moonPhase(now);
  const rs = riseSet(OBJECTS.moon.pos, obs, now);
  const nextFull = nextMoonPhase(180, now), nextNew = nextMoonPhase(0, now);
  const next = nextFull < nextNew ? [t('Full Moon'), nextFull] : [t('New Moon'), nextNew];
  const times = [[t('rises'), rs.rise], [t('sets'), rs.set]].filter(([, t]) => t).sort((x, y) => x[1] - y[1]).map(([w, t]) => `${w} ${fmtTime(t)}`).join(' · ');
  // Shadow drawn with two arcs: the lit limb is a half circle, the terminator an ellipse.
  const k = Math.cos(ph.elongation * Math.PI / 180); // 1 new … -1 full
  const lit = ph.waxing ? 1 : 0;
  const disc = `<svg class="moon-disc" viewBox="-1 -1 2 2" aria-hidden="true"><circle r="1" fill="#2a2f45"/><path fill="#f4efd9" d="M0,-1 A1,1 0 0 ${lit} 0,1 A${Math.abs(k).toFixed(3)},1 0 0 ${(k > 0) === !!lit ? 0 : 1} 0,-1Z"/></svg>`;
  return `<a class="moon-card" href="${url.object('moon')}">${disc}<div><small>${t('Tonight’s Moon')}</small><b>${t(ph.name)} · ${Math.round(ph.illumination * 100)}% ${t('lit')}</b><small>${times ? `${times} · ` : ''}${next[0]} ${daysUntil(next[1], now)}</small></div></a>`;
}
// Where the bright planets and the Moon are in your sky right now.
export function skyNowHtml() {
  const obs = observer();
  const now = new Date();
  const rows = ['moon', 'venus', 'jupiter', 'mars', 'saturn', 'mercury'].map((id) => {
    const o = OBJECTS[id];
    const h = horizontalFor(o.pos, obs, now);
    let where;
    if (h.alt > 0) {
      const height = h.alt < 15 ? 'Low in the' : h.alt < 45 ? 'Halfway up in the' : 'High in the';
      where = `${height} ${compassName(h.az).toLowerCase()}`;
    } else {
      const c = nextHorizonCrossing(o.pos, obs, now, 26);
      where = c?.time ? `Rises at ${fmtTime(c.time)}` : 'Below the horizon';
    }
    return { o, up: h.alt > 0, alt: h.alt, where };
  }).sort((a, b) => (b.up - a.up) || (b.alt - a.alt));
  const sunUp = horizontalFor(OBJECTS.sun.pos, obs, now).alt > -6;
  const upCount = rows.filter((r) => r.up).length;
  const note = sunUp
    ? `It’s daytime${obs.approx ? '' : ' where you are'}, so sunlight hides most of these${upCount ? ' – but they’re up there.' : '. Come back after dark.'}`
    : upCount ? `${upCount} of them ${upCount === 1 ? 'is' : 'are'} above your horizon right now.` : 'None are up right now – check back later tonight.';
  return `${moonHtml(now)}<div class="section-head"><div><h2>In your sky right now</h2><p>${note}${obs.approx ? ' Using an approximate location – open the Sky Finder to use yours.' : ''}</p></div><a href="${url.sky()}">Open Sky Finder →</a></div>
    <div class="tonight">${rows.map((r) => `<a class="sky-now ${r.up ? '' : 'down'}" href="${url.sky(r.o.id)}">${photo(r.o, { alt: r.o.name })}<div><b>${shortName(r.o)}</b><small>${r.where}</small></div></a>`).join('')}</div>`;
}

function sectorCard(s, recommended) {
  const p = store.sectorProgress(s);
  const state = p.complete ? '<span class="state done">★ Badge earned</span>' : s === recommended ? '<span class="state next">Next up</span>' : '';
  return `<a class="sector-card" href="${url.sector(s.id)}" style="--hue:${s.hue}">
    ${photo(OBJECTS[s.cover], { alt: s.title })}
    <span class="code">${s.code}</span>${state}
    <div class="body">
      <h3>${s.title}</h3>
      <p>${s.subtitle}</p>
      <div class="meta">${progressBar(p.done / p.total)}<span>${p.done}/${p.total}</span></div>
    </div>
  </a>`;
}

// `live` is false when pre-rendering: parts that depend on the time and the visitor are filled in by the app.
export function homeHtml({ live = true } = {}) {
  const xp = store.xp();
  const r = store.rank(xp);
  const learned = Object.keys(store.progress().learned).length;
  const next = store.nextUp();
  const nextObj = next && OBJECTS[next.id];
  const nextSector = next && sectorById(next.sector);
  const recommended = SECTORS.find((s) => !store.sectorProgress(s).complete);
  const started = learned > 0 || xp > 0;

  return `
    <section class="hero">
      ${photo(OBJECTS.milkyway, { size: 'lg', eager: true, alt: 'The Milky Way over the Very Large Telescope in Chile' })}
      <div class="hero-copy">
        <span class="eyebrow">${SITE.tagline}</span>
        <h1>From your backyard to the edge of the universe</h1>
        <p class="lead">Explore ${JOURNEY.length} wonders of space one step at a time – planets, stars, black holes and galaxies – then hold up your phone to find them in the real sky.</p>
        <div class="btn-row">
          ${nextObj ? `<a class="btn primary" href="${url.object(nextObj.id)}">${started ? `Continue: ${nextObj.name}` : 'Start the journey'} →</a>` : `<a class="btn primary" href="${url.sky()}">Find them all in the sky →</a>`}
          <a class="btn" href="${url.sky()}">🔭 Sky Finder</a>
        </div>
      </div>
    </section>

    ${started ? `<section class="progress-strip">
      ${nextObj ? `<a class="continue" href="${url.object(nextObj.id)}">${photo(nextObj)}<div><small>Up next · ${nextSector.title}</small><b>${nextObj.name}</b><small>${nextObj.kind}</small></div><span class="go">→</span></a>` : ''}
      <a class="stats-card" href="${url.me}">${rankRing(xp, r)}<div><small>Your rank</small><b>${r.title}</b><small>${learned} of ${JOURNEY.length} explored · ${store.badges().length} badge${store.badges().length === 1 ? '' : 's'}</small></div></a>
    </section>` : ''}

    <section class="section sky-now-section">${live ? skyNowHtml() : ''}</section>

    ${CHAPTERS.map((c, ci) => `
      <section class="chapter" id="chapter-${ci + 1}">
        <div class="chapter-head">
          <span class="eyebrow">Chapter ${ci + 1}</span>
          <h2>${c.title}</h2>
          <span class="chapter-scale">${c.scale}</span>
          <p>${c.intro}</p>
        </div>
        <div class="grid sectors">
          ${c.sectors.map((sid) => sectorCard(sectorById(sid), recommended)).join('')}
        </div>
      </section>`).join('')}`;
}

// ───────────────────────── sector ─────────────────────────
export function sectorHtml(s) {
  const p = store.sectorProgress(s);
  const idx = SECTORS.indexOf(s);
  const ci = chapterOf(s.id);
  const quizReady = p.done === p.total;
  const prev = SECTORS[idx - 1], next = SECTORS[idx + 1];
  const firstNew = s.items.find((oid) => !store.isLearned(oid));
  return `
    <section class="banner" style="--hue:${s.hue}">
      ${photo(OBJECTS[s.cover], { size: 'lg', eager: true, alt: OBJECTS[s.cover].name })}
      ${crumbs([['Explore', url.home], [`Chapter ${ci + 1}: ${CHAPTERS[ci].title}`, `/#chapter-${ci + 1}`]])}
      <div class="banner-copy">
        <span class="eyebrow">Sector ${+s.code} of ${SECTORS.length}</span>
        <h1>${s.title}</h1>
        <p>${s.subtitle}</p>
      </div>
    </section>
    <section class="sector-intro" style="--hue:${s.hue}">
      <p class="lead">${s.briefing}</p>
      <div class="side">
        <div class="progress-line">${progressBar(p.done / p.total)}<span>${p.done} of ${p.total} explored</span></div>
        ${firstNew ? `<a class="btn primary" href="${url.object(firstNew)}">${p.done ? 'Continue' : 'Start this sector'} →</a>` : ''}
        <button class="btn ghost dl-sector">⤓ Save this sector for offline</button>
      </div>
    </section>
    <h2 class="visually-hidden">In this sector</h2>
    <div class="grid objects">${s.items.map((oid, i) => objCard(OBJECTS[oid], i + 1)).join('')}</div>
    <section class="challenge ${quizReady ? '' : 'locked'}">
      <div>
        <span class="eyebrow">Sector challenge</span>
        <h3>${quizReady ? 'Ready for the challenge?' : `Explore all ${p.total} to unlock the challenge`}</h3>
        <p>${p.quiz ? `Best score: ${p.quiz.best}/${p.quiz.total}${p.quiz.passed ? ' · Badge earned ★' : ''}` : `${s.quiz.length} questions · win ${store.XP.quizPass} XP and a badge`}</p>
      </div>
      ${quizReady ? `<a class="btn primary" href="${url.quiz(s.id)}">${p.quiz ? 'Try again' : 'Start the challenge'}</a>` : '<span class="lock" aria-label="Locked">🔒</span>'}
    </section>
    <nav class="pager" aria-label="Sectors">
      ${prev ? `<a class="pager-card" href="${url.sector(prev.id)}">${photo(OBJECTS[prev.cover])}<div><small>← Previous sector</small><b>${prev.title}</b></div></a>` : '<span></span>'}
      ${next ? `<a class="pager-card next" href="${url.sector(next.id)}">${photo(OBJECTS[next.cover])}<div><small>Next sector →</small><b>${next.title}</b></div></a>` : ''}
    </nav>`;
}

// ───────────────────────── object ─────────────────────────
export function liveData(o) {
  const rows = [];
  const obs = observer();
  const now = new Date();
  const sci = store.isScientist();
  if (o.pos?.iss) {
    const st = issState(obs, now);
    if (st) {
      rows.push(['Flying over', `${Math.abs(st.lat).toFixed(1)}°${st.lat >= 0 ? 'N' : 'S'}, ${Math.abs(st.lon).toFixed(1)}°${st.lon >= 0 ? 'E' : 'W'}`]);
      rows.push(['Height', `${Math.round(st.heightKm)} km`]);
      rows.push(['Speed', `${(st.speedKms * 3600).toLocaleString('en-US', { maximumFractionDigits: 0 })} km/h`]);
      rows.push([`From you${obs.approx ? '*' : ''}`, st.alt >= 0 ? `${st.alt.toFixed(0)}° up, ${compassName(st.az)}` : `Below the horizon, ${Math.round(st.km).toLocaleString('en-US')} km away`]);
      rows.push(['In sunlight', st.sunlit ? 'Yes' : 'No – in Earth’s shadow']);
    }
    return rows;
  }
  if (o.pos?.body === 'moon') {
    const ph = moonPhase(now);
    const rs = riseSet(o.pos, obs, now);
    rows.push(['Phase', `${ph.emoji} ${ph.name}`]);
    rows.push(['Lit up', `${Math.round(ph.illumination * 100)}%`]);
    if (rs.rise) rows.push([`Moonrise${obs.approx ? '*' : ''}`, `${rs.rise.toDateString() === now.toDateString() ? '' : 'Tomorrow '}${fmtTime(rs.rise)}`]);
    if (rs.set) rows.push([`Moonset${obs.approx ? '*' : ''}`, `${rs.set.toDateString() === now.toDateString() ? '' : 'Tomorrow '}${fmtTime(rs.set)}`]);
    const full = nextMoonPhase(180, now);
    rows.push(['Next full Moon', full.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })]);
    if (sci) rows.push(['Age', `${ph.age.toFixed(1)} days`]);
  }
  if (o.pos?.body) {
    const eq = skyPosition(o.pos, julianDate(now));
    const millions = (eq.km / 1e6).toLocaleString('en-US', { maximumFractionDigits: eq.km > 1e9 ? 0 : 1 });
    rows.push(['Distance now', eq.km > 1e7 ? `${millions} million km` : `${Math.round(eq.km).toLocaleString('en-US')} km`]);
    rows.push(['Its light takes', lightTime(eq.km)]);
    if (sci && eq.km > KM_PER_AU * 2) rows.push(['In AU', `${(eq.km / KM_PER_AU).toFixed(2)} AU`]);
  } else if (o.ly) {
    rows.push(['Its light takes', `${formatYears(o.ly)} years`]);
  }
  if (o.pos?.ra !== undefined || o.pos?.body) {
    const h = horizontalFor(o.pos, obs, now);
    if (sci) rows.push(['RA / Dec', `${formatRA(h.ra)} · ${formatDec(h.dec)}`]);
    rows.push([`From you${obs.approx ? '*' : ''}`, h.alt >= 0 ? `${h.alt.toFixed(0)}° up, ${compassName(h.az)}` : `Below the horizon (${compassName(h.az)})`]);
  }
  return rows;
}

export function factsHtml(o, { live = true } = {}) {
  const rows = live ? liveData(o) : [];
  return `<h2 class="facts-title">Quick facts</h2><dl>
    ${o.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
    ${rows.map(([k, v]) => `<div class="live"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
  </dl>${rows.some(([k]) => k.endsWith('*')) ? '<p class="fine" style="padding-bottom:14px">* Approximate location – open the Sky Finder to use yours.</p>' : ''}`;
}

// Earth next to the object, drawn to scale.
function scaleBlock(o) {
  if (o.id === 'earth') return '';
  const d = diameterKm(o.facts.filter(([label]) => /diameter|size/i.test(label)));
  if (!d) return '';
  const ratio = d / 12742;
  if (ratio > 400 || ratio < 1 / 80) return '';
  const W = 640, H = 240, cy = 120;
  const color = o.art?.color || `hsl(${hueOf(o)} 70% 60%)`;
  const color2 = o.art?.color2 || (o.art?.type === 'star' ? '#ff8a1e' : `hsl(${hueOf(o)} 60% 30%)`);
  const label = (x, r, text) => `<text x="${x}" y="${cy + Math.max(r, 3) + 28}" text-anchor="middle">${esc(text)}</text>`;
  let shapes;
  if (ratio > 12) {
    // Too big to fit: show the edge of the object curving past a tiny Earth.
    const rE = 5, R = rE * ratio, edge = 300;
    shapes = `<circle cx="${edge + R}" cy="${cy}" r="${R}" fill="url(#g-obj)"/><circle cx="160" cy="${cy}" r="${rE}" fill="url(#g-earth)"/>${label(160, rE, 'Earth')}<text x="${W - 24}" y="34" text-anchor="end">${esc(shortName(o))} (just the edge!)</text>`;
  } else {
    const k = 92 / Math.max(1, ratio);
    const rE = Math.max(2, k), rO = Math.max(2, k * ratio);
    const gap = 70;
    const x0 = (W - (rE * 2 + rO * 2 + gap)) / 2;
    const xO = x0 + rE * 2 + gap + rO;
    shapes = `<circle cx="${x0 + rE}" cy="${cy}" r="${rE}" fill="url(#g-earth)"/>${label(x0 + rE, rE, 'Earth')}<circle cx="${xO}" cy="${cy}" r="${rO}" fill="url(#g-obj)"/>${label(xO, rO, shortName(o))}`;
  }
  return `<div class="block">
    <h2>Size it up</h2>
    <div class="scale">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.name)} and Earth drawn to scale">
        <defs>
          <radialGradient id="g-earth" cx="35%" cy="35%"><stop offset="0" stop-color="#8fd0ff"/><stop offset="0.6" stop-color="#2d6fcf"/><stop offset="1" stop-color="#123a73"/></radialGradient>
          <radialGradient id="g-obj" cx="35%" cy="35%"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color2}"/></radialGradient>
          <clipPath id="clip-scale"><rect width="${W}" height="${H}" rx="12"/></clipPath>
        </defs>
        <g clip-path="url(#clip-scale)" font-family="Space Grotesk, sans-serif" font-size="22" fill="#a7aec4">${shapes}</g>
      </svg>
      <p>${sizeComparison(d)} Both are drawn to the same scale.</p>
    </div>
  </div>`;
}

export function objectHtml(o, { live = true } = {}) {
  const s = sectorById(o.sector);
  const j = JOURNEY.findIndex((x) => x.id === o.id);
  const prev = JOURNEY[j - 1] && OBJECTS[JOURNEY[j - 1].id], next = JOURNEY[j + 1] && OBJECTS[JOURNEY[j + 1].id];
  const learned = store.isLearned(o.id);
  const tm = timeMachine(o.ly);
  const bodyKm = live && o.pos?.body ? skyPosition(o.pos, julianDate(new Date())).km : null;
  const credit = PHOTOS[o.id];
  const canFind = o.pos && !o.pos.everywhere;
  const hl = HIGHLIGHTS[o.id] || [];
  const facts = kidFacts(o, bodyKm);

  return `
    ${crumbs([['Explore', url.home], [s.title, url.sector(s.id)], [o.name]])}
    <article class="object" style="--hue:${s.hue}">
      <div class="obj-top">
        <figure class="obj-media">
          ${photo(o, { size: 'lg', cls: 'obj-photo', eager: true, alt: `${o.name} – ${o.kind}` })}
          ${credit ? `<figcaption class="credit">Image: <a href="${credit.page}" target="_blank" rel="noopener">${esc(credit.credit)}</a></figcaption>` : ''}
        </figure>
        <div class="obj-intro">
          <span class="eyebrow">${CATEGORY_ICONS[category(o)] || '⭐'} ${category(o)} · ${s.title}</span>
          <h1>${o.name}</h1>
          <p class="kind">${o.kind}</p>
          <p class="lead">${o.nutshell}</p>
          ${facts.length ? `<ul class="glance">${facts.map((b) => `<li><span class="ic" aria-hidden="true">${b.icon}</span><div><b>${b.big}</b><small>${b.small}</small></div></li>`).join('')}</ul>` : ''}
          <div class="obj-cta">
            <a class="btn primary" href="${url.sky(o.id)}">🔭 ${canFind ? `Find it in the sky${o.pointLabel ? ` (${o.pointLabel})` : ''}` : 'Try the Sky Finder'}</a>
            <button class="btn save">${media.isSaved(o.id) ? '✓ Saved offline' : '⤓ Save offline'}</button>
          </div>
        </div>
      </div>

      <div class="obj-body">
        <div class="article">
          ${hl.length ? `<section class="block"><h2>Take a closer look</h2><div class="highlights">${hl.map((h) => `<div class="hl"><span class="ic" aria-hidden="true">${h.icon}</span><h3>${h.title}</h3><p>${h.text}</p></div>`).join('')}</div></section>` : ''}

          <aside class="wow"><span class="eyebrow">✨ Mind-blowing fact</span><p>${o.wow}</p></aside>

          ${scaleBlock(o)}

          <section class="block">
            <h2>How we found out</h2>
            <ol class="timeline">${o.story.map(([y, t]) => `<li><span class="year">${y}</span><p>${t}</p></li>`).join('')}</ol>
          </section>

          <section class="wonder">
            <span class="eyebrow">🤔 Something to wonder about</span>
            <h2 class="q">${o.wonder[0]}</h2>
            <button class="btn reveal">Have a think… then tap to see the answer</button>
            <p class="a" hidden>${o.wonder[1]}</p>
          </section>

          ${tm ? `<aside class="timemachine"><span class="eyebrow">⏳ Light is a time machine</span><p>${tm}</p></aside>` : ''}

          <section class="block see-it">
            <h2>See it yourself</h2>
            <p>${o.see}</p>
            ${o.pos?.iss ? '<div class="passes"></div>' : ''}
          </section>

          <section class="block encyclopedia" hidden>
            <h2>From the encyclopedia</h2>
            <p class="extract"></p>
            <a class="more" target="_blank" rel="noopener">Read the full article on Wikipedia ↗</a>
          </section>
        </div>

        <aside class="facts-aside">
          <div class="facts">${factsHtml(o, { live })}</div>
        </aside>
      </div>

      <section class="finish">
        <h2>${learned ? 'You’ve explored this one' : 'Got it?'}</h2>
        <p>${learned ? 'Nice work. On to the next wonder!' : `Mark ${esc(o.name)} as explored to earn ${store.XP.learn} XP.`}</p>
        <button class="btn ${learned ? 'done' : 'primary'} learn">${learned ? '✓ Explored' : `I explored this! +${store.XP.learn} XP`}</button>
      </section>

      <nav class="pager" aria-label="Wonders">
        ${prev ? `<a class="pager-card" href="${url.object(prev.id)}">${photo(prev)}<div><small>← Previous</small><b>${prev.name}</b></div></a>` : '<span></span>'}
        ${next ? `<a class="pager-card next" href="${url.object(next.id)}">${photo(next)}<div><small>Next →</small><b>${next.name}</b></div></a>` : `<a class="pager-card next" href="${url.sky()}">${photo(OBJECTS.milkyway)}<div><small>You did it →</small><b>Explore the real sky</b></div></a>`}
      </nav>
    </article>`;
}

// ───────────────────────── library ─────────────────────────
export function libraryHtml(cat = 'All') {
  return `
    <section class="page-head">
      <h1>Library of space wonders</h1>
      <p>All ${JOURNEY.length} wonders in one place – planets, moons, comets, stars, nebulae, pulsars, black holes and galaxies. Search for anything, even a scientist’s name.</p>
      <input class="search" type="search" placeholder="Search planets, stars, galaxies, people…" aria-label="Search the library">
    </section>
    <div class="chips">${CATEGORIES.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c === 'All' ? '' : CATEGORY_ICONS[c]} ${c}</button>`).join('')}</div>
    <div class="grid objects lib-list">${libraryItems(cat, '')}</div>`;
}

export function libraryItems(cat, q) {
  const needle = q.toLowerCase();
  const items = JOURNEY.map((jj) => OBJECTS[jj.id]).filter((o) => (cat === 'All' || category(o) === cat) && (!needle || [o.name, o.kind, o.nutshell, ...o.story.map((s) => s[1]), ...(HIGHLIGHTS[o.id] || []).map((h) => h.text)].join(' ').toLowerCase().includes(needle)));
  return items.length ? items.map((o) => objCard(o)).join('') : '<p class="empty" style="grid-column:1/-1">Nothing found. Try another word!</p>';
}

// ───────────────────────── tonight ─────────────────────────
const fmtDayTime = (d, now) => {
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400e3);
  const day = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${fmtTime(d)}`;
};

export function tonightHtml({ live = true } = {}) {
  const head = `<section class="page-head"><span class="eyebrow">${t('Tonight')}</span><h1>${t('What can I see tonight?')}</h1>
    <p>${t('The best things in your sky tonight – planets, the Moon, space stations flying over and stars to learn – worked out for exactly where you are.')}</p></section>`;
  if (!live) return head;
  const obs = observer();
  const now = new Date();
  const plan = tonightPlan(obs, now);
  const n = plan.night;
  const darkLine = !n ? 'It doesn’t get dark where you are tonight – the Sun stays too close to the horizon.'
    : n.start <= now ? t('It’s dark now, until about {end}.', { end: `<b>${fmtTime(n.end)}</b>` })
      : t('It gets dark at about {start} and stays dark until {end}.', { start: `<b>${fmtTime(n.start)}</b>`, end: `<b>${fmtTime(n.end)}</b>` });
  const challenge = plan.highlights.find((h) => h.key && OBJECTS[h.key] && !store.isSpotted(h.key));
  const card = (h) => `<article class="tn-item">
      <span class="tn-emoji" aria-hidden="true">${h.emoji}</span>
      <div><h3>${esc(h.title)}</h3><p>${h.text}</p></div>
      ${h.key ? `<a class="btn ghost small" href="${url.sky(h.key)}">${t('Find it')}</a>` : ''}
    </article>`;
  return `${head}
    <p class="tn-dark">${darkLine}${obs.approx ? ' <small>Using an approximate location – open the Sky Finder once to use yours.</small>' : ''}</p>
    <div class="tn-cond" hidden></div>
    ${moonHtml(now)}
    ${challenge ? `<a class="tn-challenge" href="${url.sky(challenge.key)}"><span class="hud-label">${t('Tonight’s challenge')}</span><b>${t('Find {name} in the real sky', { name: esc(t(OBJECTS[challenge.key].name)) })}</b><small>${t('Point your phone at it until it says LOCKED ON to earn +{xp} XP', { xp: store.XP.spot })}</small></a>` : ''}
    <section class="section"><div class="section-head"><div><h2>${t('Best things to see')}</h2></div></div>
      <div class="tn-list">${plan.highlights.map(card).join('') || '<p class="empty">Nothing bright is up tonight – check back tomorrow!</p>'}</div>
    </section>
    <section class="section"><div class="section-head"><div><h2>${t('Coming up')}</h2><p>${t('The next two weeks in the sky.')}</p></div></div>
      <div class="tn-list">${plan.events.map((e) => card({ ...e, title: `${e.title} · ${fmtDayTime(e.time, now)}` })).join('') || '<p class="empty">A quiet two weeks – a great time to learn constellations.</p>'}</div>
    </section>
    <section class="section">${remindersHtml()}</section>`;
}

// Grown-up account panel on My journey. `account` is null when signed out.
export function accountHtml(account, { providers = ['google'], status = '' } = {}) {
  if (account) {
    return `<h2>Progress is backed up</h2>
      <p>Signed in as <b>${esc(account.name)}</b>. Explored items, spotted objects and quiz scores are saved to this account and kept the same on every device you sign in on.</p>
      <p class="fine acct-status">${esc(status)}</p>
      <div class="btn-row"><button class="btn ghost acct-signout">Sign out</button><button class="btn ghost danger acct-delete">Delete account</button></div>
      <div class="acct-confirm" hidden><p><b>Delete the account and its backed-up progress?</b> Progress on this device stays. This can’t be undone.</p><div class="btn-row"><button class="btn danger acct-delete-yes">Yes, delete it</button><button class="btn ghost acct-delete-no">Keep it</button></div></div>`;
  }
  const a = 4 + Math.floor(Math.random() * 6), b = 6 + Math.floor(Math.random() * 4);
  return `<h2>For grown-ups: back up progress</h2>
    <p>Sign in to keep your explorer’s progress safe and the same on every phone, tablet and computer. We only save what they explored, spotted and their quiz scores – nothing else.</p>
    <button class="btn acct-start">Grown-up sign-in</button>
    <div class="acct-gate" hidden data-answer="${a * b}">
      <label>To continue, a grown-up please answer: <b>${a} × ${b} = ?</b> <input class="acct-gate-input" inputmode="numeric" autocomplete="off" aria-label="Answer"></label>
      <div class="btn-row acct-providers" hidden>${providers.map((p) => `<button class="btn ${p === 'apple' ? 'apple' : 'google'}" data-provider="${p}">${p === 'apple' ? ' Continue with Apple' : 'Continue with Google'}</button>`).join('')}</div>
    </div>
    <p class="fine acct-status">${esc(status)}</p>`;
}

// ───────────────────────── classroom ─────────────────────────
export function classroomHtml() {
  return `<section class="page-head"><span class="eyebrow">For teachers</span><h1>See the Stars in the classroom</h1>
    <p>A free, guided astronomy course for primary and middle school: 12 chapters from the Earth and Moon to galaxies and the Big Bang, each with a quiz, plus a Sky Finder that turns every clear night into homework kids actually want to do.</p></section>
    <div class="me-grid">
      <section class="panel wide teacher"><h2>Your classes</h2><p class="fine">Loading…</p></section>
      <section class="panel"><h2>How it works</h2>
        <ol class="steps"><li>Sign in as a grown-up on <a href="${url.me}#account">My journey</a> and create a class here.</li><li>Share the 6-letter code. Students enter it with a nickname on their own device – no email or account needed.</li><li>See who explored, spotted and finished what. Only nicknames and counts are shared, nothing else.</li></ol>
      </section>
      <section class="panel"><h2>Printable worksheets</h2><p>One per chapter: key facts, the chapter quiz and a “find it in the sky” checklist.</p>
        <ul class="ws-list">${SECTORS.map((s) => `<li><a href="${url.worksheet(s.id)}">${s.code} · ${esc(s.title)}</a></li>`).join('')}</ul>
      </section>
    </div>`;
}

export function teacherHtml({ account, classes, rosters = {}, status = '' }) {
  if (!account) return `<h2>Your classes</h2><p>Sign in as a grown-up on <a href="${url.me}#account">My journey</a> to create a class.</p>`;
  return `<h2>Your classes</h2>
    <form class="class-new"><input name="name" maxlength="40" placeholder="Class name, e.g. Class 5B" aria-label="Class name" required><button class="btn primary">Create class</button></form>
    <p class="fine class-status">${esc(status)}</p>
    ${classes.length ? classes.map((c) => {
      const r = rosters[c.code];
      return `<article class="class-card" data-code="${c.code}">
        <div class="class-head"><div><b>${esc(c.name)}</b><small>Code <span class="class-code">${c.code}</span> · ${r ? `${r.length} student${r.length === 1 ? '' : 's'}` : '…'}</small></div>
          <div class="btn-row"><button class="btn ghost small class-refresh">Refresh</button><button class="btn ghost small danger class-delete">Delete</button></div></div>
        ${r?.length ? `<div class="table-wrap"><table class="roster"><thead><tr><th>Nickname</th><th>Explored</th><th>Spotted</th><th>Quests</th><th>Badges</th><th>XP</th><th>Last seen</th><th></th></tr></thead><tbody>${r.map((m) => `<tr><td>${esc(m.nick)}</td><td>${m.explored}</td><td>${m.spotted}</td><td>${m.quests}</td><td>${m.badges}</td><td>${m.xp}</td><td>${new Date(m.updatedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</td><td><button class="link class-remove" data-uid="${m.uid}" aria-label="Remove ${esc(m.nick)}">Remove</button></td></tr>`).join('')}</tbody></table></div>`
          : r ? '<p class="fine">No students yet. Share the code!</p>' : ''}
      </article>`;
    }).join('') : '<p class="fine">No classes yet.</p>'}`;
}

export function worksheetHtml(s) {
  const objs = s.items.map((id) => OBJECTS[id]);
  const findable = objs.filter((o) => o.pos && !o.pos.everywhere && !o.pos.down);
  return `<article class="worksheet">
    <div class="ws-tools no-print"><a href="${url.classroom}">← Classroom</a><button class="btn primary small" onclick="window.print()">Print</button></div>
    <header><span class="eyebrow">See the Stars · ${s.code}</span><h1>${esc(s.title)}</h1><p>${esc(s.subtitle)}</p>
      <div class="ws-lines"><span>Name: ______________________</span><span>Date: ____________</span></div></header>
    <section><h2>Key facts</h2><dl>${objs.map((o) => `<dt>${esc(o.name)}</dt><dd>${esc(o.nutshell)}</dd>`).join('')}</dl></section>
    <section><h2>Quiz</h2><ol class="ws-quiz">${s.quiz.map((q) => `<li><p>${esc(q.q)}</p><ul>${q.options.map((o) => `<li>☐ ${esc(o)}</li>`).join('')}</ul></li>`).join('')}</ol></section>
    ${findable.length ? `<section><h2>Find it in the sky</h2><p>Use the Sky Finder at seethestars.webappslab.com. Tick what you find and write when you saw it.</p>
      <table class="ws-find"><thead><tr><th></th><th>Object</th><th>Date and time</th><th>Where in the sky?</th></tr></thead><tbody>${findable.map((o) => `<tr><td>☐</td><td>${esc(o.name)}</td><td></td><td></td></tr>`).join('')}</tbody></table></section>` : ''}
    <section class="ws-answers"><h2>Answers (for the teacher)</h2><p>${s.quiz.map((q, i) => `${i + 1}. ${esc(q.options[q.answer])}`).join(' · ')}</p></section>
  </article>`;
}

export function classJoinHtml(cls, status = '') {
  if (cls) return `<h2>${t('🏫 My class')}</h2><p>You’re in <b>${esc(cls.name)}</b> as <b>${esc(cls.nick)}</b>. Your teacher can see how many things you explored and spotted.</p><p class="fine class-join-status">${esc(status)}</p><button class="btn ghost class-leave">Leave class</button>`;
  return `<h2>${t('🏫 Join a class')}</h2><p>Got a code from your teacher? Join with a nickname – no email needed.</p>
    <form class="class-join"><input name="code" maxlength="7" placeholder="${t('Class code')}" autocapitalize="characters" autocomplete="off" aria-label="Class code" required><input name="nick" maxlength="20" placeholder="${t('Nickname')}" autocomplete="off" aria-label="Nickname" required><button class="btn primary">${t('Join')}</button></form>
    <p class="fine">Use a first name or a fun nickname – not your full name.</p><p class="fine class-join-status">${esc(status)}</p>`;
}

export function conditionsHtml(c) {
  if (!c) return '';
  const tone = c.score >= 7 ? 'good' : c.score >= 4 ? 'ok' : 'bad';
  return `<div class="cond-score ${tone}"><b>${c.score}</b><small>/10</small></div><div><small>${t('Stargazing tonight')}</small><b>${esc(c.verdict)}</b><small class="fine">${t('Forecast: Open-Meteo')}</small></div>`;
}

// Language choice (My journey).
export function languageHtml() {
  return `<label class="switch-row"><span><b>${t('Language')}</b>${language() === 'en' ? '' : `<small>${t('Lesson texts are in English for now.')}</small>`}</span>
    <select class="lang-select" aria-label="Language">${Object.entries(LANGUAGES).map(([code, name]) => `<option value="${code}" ${code === language() ? 'selected' : ''}>${name}</option>`).join('')}</select></label>`;
}

// Reminder settings (Tonight page and My journey). Only the apps can schedule them.
export function remindersHtml() {
  const native = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
  if (!native) {
    return `<div class="panel remind"><h2>🔔 Never miss a pass</h2><p>The See the Stars app for iPhone and Android can remind you when the space station flies over, on full Moon nights and when meteor showers peak. Reminders are worked out on your phone – nothing is sent anywhere.</p></div>`;
  }
  const prefs = { ...DEFAULT_PREFS, ...store.getSettings().reminders };
  return `<div class="panel remind"><h2>${t('🔔 Sky reminders')}</h2>
    <label class="switch-row first"><span><b>${t('Remind me')}</b><small>Worked out on your phone for where you are. Nothing is sent anywhere.</small></span><input type="checkbox" data-remind="on" ${prefs.on ? 'checked' : ''}></label>
    <div class="remind-kinds" ${prefs.on ? '' : 'hidden'}>${Object.entries(REMINDER_KINDS).map(([k, [emoji, title, hint]]) => `<label class="switch-row"><span><b>${emoji} ${title}</b><small>${hint}</small></span><input type="checkbox" data-remind="${k}" ${prefs[k] ? 'checked' : ''}></label>`).join('')}</div>
    <p class="fine remind-status"></p>
  </div>`;
}

// What search engines see at /sky/ before the app takes over.
export function skyLandingHtml() {
  return `<section class="page-head">
    <h1>Sky Finder: find planets, stars and the ISS from where you are</h1>
    <p>Hold up your phone and follow the arrows to any planet, star, galaxy or black hole – even when it is below the horizon, so you know you are pointing through the Earth. The Sky Finder uses your phone’s camera, compass, motion sensors and location. Everything is worked out on your device, and nothing is sent anywhere.</p>
    <p>On a computer, drag the sky to look around.</p>
    <p><a class="btn primary" href="${url.sky()}">Open the Sky Finder</a></p>
  </section>`;
}

// ───────────────────────── page metadata (title, description, structured data) ─────────────────────────
const clip = (s, n = 158) => { const t = strip(s).replace(/\s+/g, ' ').trim(); return t.length <= n ? t : `${t.slice(0, t.lastIndexOf(' ', n - 1))}…`; };
const abs = (path) => SITE.origin + path;
const PUBLISHER = { '@type': 'Organization', name: SITE.name, url: SITE.origin + '/', logo: abs('/icons/icon-512.png') };
const breadcrumbLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
const wikiUrl = (o) => `https://en.wikipedia.org/wiki/${encodeURIComponent(o.wiki.replace(/ /g, '_'))}`;

// Returns { title, description, path, image, type, noindex, jsonld } for a route.
export function pageMeta(route, id) {
  const homeImg = abs('/store/play-feature-graphic.png');
  if (route === 'object' && OBJECTS[id]) {
    const o = OBJECTS[id];
    const s = sectorById(o.sector);
    const path = url.object(id);
    return {
      title: `${o.name}: facts, history and where to see it | ${SITE.name}`,
      description: clip(o.nutshell),
      path, type: 'article', image: PHOTOS[id]?.lg || homeImg, imageAlt: o.name,
      jsonld: [
        {
          '@type': ['Article', 'LearningResource'],
          headline: o.name,
          name: `${o.name} – ${o.kind}`,
          description: clip(o.nutshell, 300),
          image: PHOTOS[id]?.lg,
          url: abs(path),
          inLanguage: 'en',
          learningResourceType: 'Lesson',
          educationalLevel: 'Beginner',
          audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: 'Children and families' },
          about: { '@type': 'Thing', name: o.name, sameAs: wikiUrl(o) },
          isPartOf: { '@type': 'CollectionPage', name: s.title, url: abs(url.sector(s.id)) },
          author: PUBLISHER, publisher: PUBLISHER,
          isAccessibleForFree: true,
        },
        breadcrumbLd([['Explore', '/'], [s.title, url.sector(s.id)], [o.name, path]]),
      ],
    };
  }
  if (route === 'sector' && sectorById(id)) {
    const s = sectorById(id);
    const path = url.sector(id);
    return {
      title: `${s.title}: ${s.subtitle} | ${SITE.name}`,
      description: clip(s.briefing),
      path, type: 'website', image: PHOTOS[s.cover]?.lg || homeImg, imageAlt: s.title,
      jsonld: [
        {
          '@type': 'CollectionPage',
          name: `${s.title} – ${s.subtitle}`,
          description: clip(s.briefing, 300),
          url: abs(path),
          inLanguage: 'en',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: s.items.map((oid, i) => ({ '@type': 'ListItem', position: i + 1, name: OBJECTS[oid].name, url: abs(url.object(oid)) })),
          },
        },
        {
          '@type': 'Quiz',
          name: `${s.title} challenge`,
          about: { '@type': 'Thing', name: s.subtitle },
          educationalLevel: 'Beginner',
          hasPart: s.quiz.map((q) => ({
            '@type': 'Question',
            eduQuestionType: 'Multiple choice',
            text: q.q,
            acceptedAnswer: { '@type': 'Answer', text: q.options[q.answer], answerExplanation: { '@type': 'Comment', text: q.why } },
            suggestedAnswer: q.options.filter((_, k) => k !== q.answer).map((t) => ({ '@type': 'Answer', text: t })),
          })),
        },
        breadcrumbLd([['Explore', '/'], [s.title, path]]),
      ],
    };
  }
  if (route === 'library') {
    return {
      title: `Library: ${JOURNEY.length} planets, stars, galaxies and more | ${SITE.name}`,
      description: `Browse all ${JOURNEY.length} space wonders – planets, dwarf planets, comets, stars, exoplanets, constellations, nebulae, pulsars, black holes and galaxies – with photos, history and fun facts.`,
      path: url.library, type: 'website', image: homeImg,
      jsonld: [{
        '@type': 'CollectionPage', name: 'Library of space wonders', url: abs(url.library),
        mainEntity: { '@type': 'ItemList', itemListElement: JOURNEY.map((jj, i) => ({ '@type': 'ListItem', position: i + 1, name: OBJECTS[jj.id].name, url: abs(url.object(jj.id)) })) },
      }],
    };
  }
  if (route === 'sky') {
    return {
      title: `Sky Finder: find planets, stars and the ISS in your sky | ${SITE.name}`,
      description: 'Point your phone at the sky and follow the arrows to any planet, star, galaxy, black hole or the International Space Station – even below the horizon. Free, no sign-up.',
      path: url.sky(), type: 'website', image: homeImg,
      jsonld: [{ '@type': 'WebApplication', name: `${SITE.name} – Sky Finder`, url: abs(url.sky()), applicationCategory: 'EducationalApplication', operatingSystem: 'Any (web browser), Android, iOS', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }],
    };
  }
  if (route === 'tonight') {
    return {
      title: `What can I see in the sky tonight? | ${SITE.name}`,
      description: 'Planets, the Moon, the ISS and space stations flying over, meteor showers and stars to learn – the best things in your sky tonight, worked out for where you are.',
      path: url.tonight, type: 'website', image: homeImg,
    };
  }
  if (route === 'classroom' && id && sectorById(id)) {
    const s = sectorById(id);
    return { title: `${s.title} – free astronomy worksheet | ${SITE.name}`, description: clip(`Printable astronomy worksheet for kids: ${s.title} (${s.subtitle}). Key facts, a ${s.quiz.length}-question quiz with answers, and a find-it-in-the-sky checklist.`), path: url.worksheet(s.id), type: 'article', image: homeImg };
  }
  if (route === 'classroom') {
    return { title: `Astronomy for the classroom: free course, quizzes and worksheets | ${SITE.name}`, description: 'A free guided astronomy course for schools: 12 chapters with quizzes, printable worksheets, and a class code so teachers can follow progress. No student emails or accounts.', path: url.classroom, type: 'website', image: homeImg };
  }
  if (route === 'me' || route === 'quiz') {
    return { title: `${route === 'me' ? 'My journey' : 'Challenge'} | ${SITE.name}`, description: SITE.tagline, path: route === 'me' ? url.me : url.quiz(id), noindex: true, type: 'website', image: homeImg };
  }
  return {
    title: `${SITE.name} – explore the universe and find planets in your sky`,
    description: `A free space-learning journey for curious kids and families: ${JOURNEY.length} planets, stars, black holes and galaxies with real photos and history, plus a Sky Finder that shows where they are right now.`,
    path: '/', type: 'website', image: homeImg,
    jsonld: [
      { '@type': 'WebSite', name: SITE.name, url: SITE.origin + '/', description: SITE.tagline, inLanguage: 'en', publisher: PUBLISHER },
      {
        '@type': ['WebApplication', 'LearningResource'], name: SITE.name, url: SITE.origin + '/',
        applicationCategory: 'EducationalApplication', operatingSystem: 'Any (web browser), Android, iOS',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        educationalLevel: 'Beginner', audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
        isAccessibleForFree: true,
      },
    ],
  };
}

// The <head> tags for a page's metadata.
export function headTags(m) {
  const canonical = abs(m.path);
  const ld = m.jsonld ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': m.jsonld }).replace(/</g, '\\u003c')}</script>` : '';
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    m.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">',
    `<meta property="og:site_name" content="${SITE.name}">`,
    `<meta property="og:type" content="${m.type}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${m.image}">`,
    m.imageAlt ? `<meta property="og:image:alt" content="${esc(m.imageAlt)}">` : '',
    '<meta property="og:locale" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${m.image}">`,
    ld,
  ].filter(Boolean).join('\n  ');
}
