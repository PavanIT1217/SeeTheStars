// "Is tonight a good night to look?" – cloud cover and haze from Open-Meteo (free, no key), plus the Moon.
// Only a rounded location (about 10 km) is sent, and only when online. Forecasts are cached for an hour.
import { horizontalFor, moonPhase } from './astro.js';
import { nightWindow } from './tonight.js';

const HOUR = 3600e3;
const KEY = 'stg.conditions.v1';
const round = (x) => Math.round(x * 10) / 10;

export async function fetchForecast(observer) {
  const lat = round(observer.lat), lon = round(observer.lon);
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.lat === lat && c.lon === lon && Date.now() - c.at < HOUR) return c.hours;
  } catch { /* ignore */ }
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,visibility&forecast_days=2&timezone=GMT`);
  if (!res.ok) throw new Error(`forecast ${res.status}`);
  const h = (await res.json()).hourly;
  const hours = h.time.map((t, i) => ({ t: Date.parse(`${t}:00Z`), cloud: h.cloud_cover[i], vis: h.visibility[i] }));
  try { localStorage.setItem(KEY, JSON.stringify({ lat, lon, at: Date.now(), hours })); } catch { /* ignore */ }
  return hours;
}

// Score each dark hour 0–1: clear sky × good visibility × (less when a bright Moon is up).
// The night's score is the best three-hour stretch, out of 10.
export function stargazingScore(hours, observer, now = new Date()) {
  const win = nightWindow(observer, now);
  if (!win) return null;
  const phase = moonPhase(now);
  const dark = hours.filter((h) => h.t >= win.start.getTime() - HOUR / 2 && h.t <= win.end.getTime());
  if (!dark.length) return null;
  const scored = dark.map((h) => {
    const moonUp = horizontalFor({ body: 'moon' }, observer, new Date(h.t)).alt > 0;
    const clear = 1 - (h.cloud ?? 100) / 100;
    const haze = Math.min(1, (h.vis ?? 20000) / 15000);
    return { ...h, moonUp, s: clear * (0.6 + 0.4 * haze) * (moonUp ? 1 - 0.4 * phase.illumination : 1) };
  });
  let best = { avg: -1, i: 0 };
  for (let i = 0; i < scored.length; i++) {
    const w = scored.slice(i, i + 3);
    const avg = w.reduce((a, h) => a + h.s, 0) / w.length;
    if (avg > best.avg + 0.02) best = { avg, i };
  }
  const score = Math.round(best.avg * 10);
  const from = new Date(scored[best.i].t);
  const cloudy = scored.every((h) => h.cloud > 70);
  const moonBright = phase.illumination > 0.6 && scored.some((h) => h.moonUp);
  const verdict = cloudy ? 'Cloudy tonight – a good night for the journey instead.'
    : score >= 7 ? `Great! Clearest from about ${fmt(from)}.`
      : score >= 4 ? `Not bad – clearest from about ${fmt(from)}.`
        : 'Mostly cloudy or hazy – bright planets and the Moon may still peek through.';
  return { score, from, verdict: moonBright && !cloudy ? `${verdict} The bright Moon will hide faint stars.` : verdict };
}

const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
