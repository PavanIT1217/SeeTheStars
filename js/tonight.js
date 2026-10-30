// "What can I see tonight?" – the best things to look at from where you are, and what is coming up.
// Pure functions of (observer, time), so the Tonight page, notifications and tests all share them.
import { OBJECTS } from './data/catalog.js';
import { CONSTELLATIONS, STARS, STAR_NAMES } from './data/sky.js';
import { horizontalFor, toHorizontal, julianDate, compassName, moonPhase, nextMoonPhase, angularDistance, bodyPosition } from './astro.js';
import { predictPasses, SATELLITES } from './iss.js';

const MIN = 60e3, HOUR = 3600e3, DAY = 86400e3;
const sunAlt = (observer, t) => horizontalFor({ body: 'sun' }, observer, t).alt;

// Annual meteor showers: peak (month, day), radiant RA/Dec and the best-case meteors per hour (ZHR).
export const METEOR_SHOWERS = [
  { id: 'quadrantids', name: 'Quadrantids', month: 1, day: 3, ra: 230, dec: 49, zhr: 110 },
  { id: 'lyrids', name: 'Lyrids', month: 4, day: 22, ra: 272, dec: 33, zhr: 18 },
  { id: 'etaaquariids', name: 'Eta Aquariids', month: 5, day: 6, ra: 338, dec: -1, zhr: 50 },
  { id: 'perseids', name: 'Perseids', month: 8, day: 12, ra: 48, dec: 58, zhr: 100 },
  { id: 'orionids', name: 'Orionids', month: 10, day: 21, ra: 95, dec: 16, zhr: 20 },
  { id: 'leonids', name: 'Leonids', month: 11, day: 17, ra: 152, dec: 22, zhr: 15 },
  { id: 'geminids', name: 'Geminids', month: 12, day: 14, ra: 112, dec: 33, zhr: 150 },
];

const PLANETS = ['venus', 'jupiter', 'mars', 'saturn', 'mercury'];
const where = (alt, az) => `${alt < 20 ? 'low in the' : alt < 50 ? 'halfway up in the' : 'high in the'} ${compassName(az).toLowerCase()}`;

// Tonight's dark window: from when the Sun is 6° below the horizon (planets and bright stars show)
// until it climbs back. If it is dark now, the window starts now.
export function nightWindow(observer, now = new Date()) {
  const step = 10 * MIN;
  let start = null, dark = null, end = null;
  for (let t = now.getTime(); t < now.getTime() + 30 * HOUR; t += step) {
    const a = sunAlt(observer, new Date(t));
    if (start === null) { if (a < -6) start = t; continue; }
    if (dark === null && a < -12) dark = t;
    if (a >= -6) { end = t; break; }
  }
  if (start === null) return null; // midnight sun: it never gets dark
  return { start: new Date(start), end: new Date(end ?? start + 12 * HOUR), dark: dark && new Date(dark) };
}

function samples(win, every = 15 * MIN) {
  const out = [];
  for (let t = win.start.getTime(); t <= win.end.getTime(); t += every) out.push(new Date(t));
  return out;
}

// Prime time for kids: an hour and a half after dusk, but never later than 10 pm.
function primeTime(win) {
  const t = new Date(win.start.getTime() + 90 * MIN);
  const ten = new Date(win.start); ten.setHours(22, 0, 0, 0);
  return t > ten && ten > win.start ? ten : t;
}

function planetsTonight(observer, win) {
  const ts = samples(win);
  return PLANETS.map((id) => {
    let best = null, from = null, to = null;
    for (const t of ts) {
      const h = horizontalFor(OBJECTS[id].pos, observer, t);
      if (h.alt > 10) { from ??= t; to = t; }
      if (!best || h.alt > best.alt) best = { ...h, t };
    }
    return best.alt > 10 ? { id, best, from, to } : null;
  }).filter(Boolean);
}

function satellitesTonight(observer, win) {
  return Object.keys(SATELLITES).flatMap((id) => predictPasses(observer, win.start, (win.end - win.start) / HOUR, 10, id)
    .filter((p) => p.visible)
    .map((p) => ({ id, ...p })));
}

export function meteorShowerNear(date, days) {
  for (const m of METEOR_SHOWERS) {
    for (const y of [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1]) {
      const peak = new Date(y, m.month - 1, m.day, 2);
      const d = (peak - date) / DAY;
      if (d > -1 && d <= days) return { ...m, peak };
    }
  }
  return null;
}

// Moon–planet and planet–planet meetings in the evening sky over the next `days` days.
export function conjunctions(observer, from = new Date(), days = 14) {
  const out = [];
  const bodies = ['moon', ...PLANETS];
  for (let d = 0; d < days; d++) {
    const t = new Date(from.getTime() + d * DAY);
    const win = nightWindow(observer, t);
    if (!win) continue;
    const pt = primeTime(win);
    const jd = julianDate(pt);
    const pos = Object.fromEntries(bodies.map((b) => [b, bodyPosition(b, jd)]));
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const [a, b] = [bodies[i], bodies[j]];
        const sep = angularDistance(pos[a].dec, pos[a].ra, pos[b].dec, pos[b].ra);
        const limit = a === 'moon' ? 4 : 2;
        if (sep > limit) continue;
        const h = horizontalFor({ body: b }, observer, pt);
        if (h.alt < 5) continue;
        const key = `${a}-${b}`;
        const prev = out.find((c) => c.key === key && pt - c.time < 3 * DAY);
        if (prev) { if (sep < prev.sep) Object.assign(prev, { sep, time: pt, alt: h.alt, az: h.az }); continue; }
        out.push({ key, a, b, sep, time: pt, alt: h.alt, az: h.az });
      }
    }
  }
  return out.sort((x, y) => x.time - y.time);
}

// Everything for the Tonight page. Each highlight links to the Sky Finder with `key`.
export function tonightPlan(observer, now = new Date()) {
  const win = nightWindow(observer, now);
  const phase = moonPhase(now);
  const highlights = [];
  const events = [];

  if (win) {
    const pt = primeTime(win);
    const jd = julianDate(pt);

    // The best pass of each satellite (repeat passes are noise for a quick plan).
    const best = {};
    for (const s of satellitesTonight(observer, win)) if (!best[s.id] || s.maxAlt > best[s.id].maxAlt) best[s.id] = s;
    const bestPasses = Object.values(best);
    for (const s of bestPasses) {
      const mins = Math.max(1, Math.round((s.end - s.start) / MIN));
      highlights.push({
        key: s.id === 'iss' ? 'iss' : `sat-${s.id}`, emoji: '🛰', score: 100 + s.maxAlt,
        title: `${SATELLITES[s.id].short} flies over at ${fmt(s.start)}`, time: s.start,
        text: `A bright moving dot, from the ${compassName(s.startAz).toLowerCase()} to the ${compassName(s.endAz).toLowerCase()}, up to ${Math.round(s.maxAlt)}° high. It takes about ${mins} minute${mins === 1 ? '' : 's'}.`,
      });
    }

    const moonUp = horizontalFor(OBJECTS.moon.pos, observer, pt);
    if (moonUp.alt > 5) {
      highlights.push({ key: 'moon', emoji: phase.emoji, score: 60 + phase.illumination * 20, title: `The Moon (${phase.name.toLowerCase()})`, time: pt, text: `${where(moonUp.alt, moonUp.az)[0].toUpperCase()}${where(moonUp.alt, moonUp.az).slice(1)}. ${phase.illumination > 0.2 && phase.illumination < 0.8 ? 'Craters along the shadow edge look amazing through binoculars.' : phase.illumination >= 0.8 ? 'So bright it can cast shadows!' : 'A thin crescent – look for the faint glow of “earthshine” on the dark part.'}` });
    }

    const brightness = { venus: 95, jupiter: 90, mars: 75, saturn: 70, mercury: 55 };
    for (const p of planetsTonight(observer, win)) {
      // Kids look in the evening: a planet that only rises after 10 pm is a "before dawn" planet.
      const bedtime = new Date(win.start); bedtime.setHours(22, 0, 0, 0);
      const evening = p.from < Math.max(bedtime, win.start.getTime() + HOUR);
      highlights.push({
        key: p.id, emoji: '🪐', score: brightness[p.id] - (evening ? 0 : 35),
        title: OBJECTS[p.id].name, time: p.best.t,
        text: evening
          ? `Best around ${fmt(p.best.t)}, ${where(p.best.alt, p.best.az)}. Up from ${fmt(p.from)} to ${fmt(p.to)}.`
          : `An early-morning planet: it rises at ${fmt(p.from)} and is best around ${fmt(p.best.t)}, ${where(p.best.alt, p.best.az)}, before dawn.`,
      });
    }

    const shower = meteorShowerNear(now, 1.5);
    if (shower) {
      const r = toHorizontal(shower.ra, shower.dec, observer.lat, observer.lon, julianDate(new Date(win.end.getTime() - 2 * HOUR)));
      if (r.alt > 10) highlights.push({ key: null, emoji: '☄', score: 85 - phase.illumination * 25, title: `${shower.name} meteor shower`, time: win.end, text: `Up to ${shower.zhr} shooting stars an hour under a dark sky, best before dawn${phase.illumination > 0.6 ? ' (the bright Moon will hide the fainter ones)' : ''}. Lie back and look up – no telescope needed.` });
    }

    // A constellation to learn: the highest of the famous ones at prime time.
    const con = CONSTELLATIONS.filter((c) => c.rank === 1).map((c) => ({ c, h: toHorizontal(c.label[0], c.label[1], observer.lat, observer.lon, jd) }))
      .filter((x) => x.h.alt > 25).sort((a, b) => b.h.alt - a.h.alt)[0];
    if (con) {
      const journey = { Ori: 'orion', UMa: 'ursamajor', Cas: 'cassiopeia', Sco: 'scorpius', Cru: 'crux', Cyg: 'cygnus' }[con.c.id];
      highlights.push({ key: journey || `con-${con.c.id}`, emoji: '✨', score: 50, title: con.c.name, time: pt, text: `A constellation to learn tonight, ${where(con.h.alt, con.h.az)} around ${fmt(pt)}.` });
    }

    // The brightest named star that is up.
    const star = STAR_NAMES.slice(0, 25).map(([i, name]) => ({ i, name, h: toHorizontal(STARS[i * 4], STARS[i * 4 + 1], observer.lat, observer.lon, jd) })).find((s) => s.h.alt > 20);
    if (star) highlights.push({ key: OBJECTS[star.name.toLowerCase()] ? star.name.toLowerCase() : `star-${star.i}`, emoji: '⭐', score: 45, title: star.name, time: pt, text: `One of the brightest stars, ${where(star.h.alt, star.h.az)} around ${fmt(pt)}.` });

    // Deep-sky wonders that are high once it is properly dark (they need a dark sky and binoculars).
    if (win.dark && phase.illumination < 0.7) {
      const djd = julianDate(new Date(win.dark.getTime() + HOUR));
      const deep = Object.values(OBJECTS).filter((o) => ['cluster', 'nebula', 'galaxy'].includes(o.art?.type) && o.pos?.ra !== undefined)
        .map((o) => ({ o, h: toHorizontal(o.pos.ra, o.pos.dec, observer.lat, observer.lon, djd) }))
        .filter((x) => x.h.alt > 35).sort((a, b) => b.h.alt - a.h.alt).slice(0, 1);
      for (const { o, h } of deep) highlights.push({ key: o.id, emoji: '🔭', score: 40, title: o.name, time: new Date(win.dark.getTime() + HOUR), text: `${where(h.alt, h.az)[0].toUpperCase()}${where(h.alt, h.az).slice(1)} once it is fully dark. Try binoculars from somewhere without streetlights.` });
    }
  }

  // Coming up in the next two weeks.
  const full = nextMoonPhase(180, now), nw = nextMoonPhase(0, now);
  if (full - now < 14 * DAY) events.push({ time: full, emoji: '🌕', title: 'Full Moon', text: 'The whole face is lit. Great for spotting the dark “seas”.' });
  if (nw - now < 14 * DAY) events.push({ time: nw, emoji: '🌑', title: 'New Moon', text: 'The darkest nights of the month – best for faint stars and the Milky Way.' });
  const upcomingShower = meteorShowerNear(now, 14);
  if (upcomingShower && upcomingShower.peak > now) events.push({ time: upcomingShower.peak, emoji: '☄', title: `${upcomingShower.name} meteor shower peak`, text: `Up to ${upcomingShower.zhr} meteors an hour under dark skies.` });
  for (const c of conjunctions(observer, now, 14)) {
    const names = [c.a, c.b].map((b) => (b === 'moon' ? 'the Moon' : OBJECTS[b].name));
    events.push({ time: c.time, emoji: '🤝', key: c.b, title: `${names[0][0].toUpperCase()}${names[0].slice(1)} meets ${names[1]}`, text: `Only ${c.sep.toFixed(1)}° apart – about ${Math.max(1, Math.round(c.sep * 2))} finger${Math.round(c.sep * 2) > 1 ? 's' : ''} wide at arm’s length – ${where(c.alt, c.az)}.` });
  }

  highlights.sort((a, b) => b.score - a.score);
  events.sort((a, b) => a.time - b.time);
  return { night: win, moon: phase, highlights: highlights.slice(0, 6), events: events.slice(0, 6) };
}

function fmt(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
