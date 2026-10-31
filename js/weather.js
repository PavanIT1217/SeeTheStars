// Weather for the Sky Finder's layers: clouds (low, middle and high), wind and rain, hour by hour for two days,
// from Open-Meteo (free, no key). Besides your own spot we ask for 8 points about 60 km away in every direction:
// clouds that far off sit near your horizon, so the sky can show which way the clear (or cloudy) air is.
// Only a rounded location (about 10 km) is sent. Forecasts are cached for half an hour.
import { destination, fetchJSON } from './earth.js';

const KEY = 'stg.skyweather.v1';
const TTL = 30 * 60e3;
const RING_KM = 60;
export const RING = 8; // N, NE, E, SE, S, SW, W, NW
const round = (x) => Math.round(x * 10) / 10;
const VARS = ['cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high', 'wind_speed_10m', 'wind_direction_10m', 'precipitation', 'precipitation_probability', 'weather_code'];

export function weatherUrl(observer) {
  const c = { lat: round(observer.lat), lon: round(observer.lon) };
  const pts = [c, ...Array.from({ length: RING }, (_, i) => destination(c, i * 45, RING_KM))];
  return `https://api.open-meteo.com/v1/forecast?latitude=${pts.map((p) => p.lat.toFixed(2)).join(',')}&longitude=${pts.map((p) => p.lon.toFixed(2)).join(',')}&hourly=${VARS.join(',')}&forecast_days=2&timezone=GMT&wind_speed_unit=kmh`;
}

// One location (or a list of them) from Open-Meteo -> { times: [ms], points: [{ cloud: [], low: [], … }] }.
export function parseWeather(json) {
  const list = Array.isArray(json) ? json : [json];
  const h0 = list[0].hourly;
  return {
    times: h0.time.map((t) => Date.parse(`${t}:00Z`)),
    points: list.map(({ hourly: h }) => ({
      cloud: h.cloud_cover, low: h.cloud_cover_low, mid: h.cloud_cover_mid, high: h.cloud_cover_high,
      wind: h.wind_speed_10m, windFrom: h.wind_direction_10m, precip: h.precipitation, prob: h.precipitation_probability, code: h.weather_code,
    })),
  };
}

// Fresh forecast, or the last one for this place if Open-Meteo can't be reached (it still covers ~2 days).
export async function fetchSkyWeather(observer) {
  const lat = round(observer.lat), lon = round(observer.lon);
  let cached = null;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.lat === lat && c.lon === lon) cached = c;
  } catch { /* ignore */ }
  if (cached && Date.now() - cached.at < TTL) return cached.data;
  try {
    const data = parseWeather(await fetchJSON(weatherUrl(observer)));
    try { localStorage.setItem(KEY, JSON.stringify({ lat, lon, at: Date.now(), data })); } catch { /* ignore */ }
    return data;
  } catch (e) {
    if (cached) return cached.data;
    throw e;
  }
}

const SNOW = new Set([71, 73, 75, 77, 85, 86]);
const STORM = new Set([95, 96, 99]);

// The weather at one moment (nearest forecast hour), or null outside the forecast.
export function weatherAt(data, date) {
  if (!data?.times?.length) return null;
  const t = +date;
  let i = Math.round((t - data.times[0]) / 3600e3);
  if (i < 0 || i >= data.times.length) return null;
  const at = (p) => {
    const v = (k) => p[k]?.[i] ?? null;
    return { cloud: v('cloud'), low: v('low'), mid: v('mid'), high: v('high'), wind: v('wind'), windFrom: v('windFrom'), precip: v('precip'), prob: v('prob'), code: v('code') };
  };
  const [centre, ...ring] = data.points.map(at);
  if (centre.cloud === null) return null;
  return { time: new Date(data.times[i]), centre, ring: ring.length === RING ? ring : [], snow: SNOW.has(centre.code), thunder: STORM.has(centre.code) };
}

// How thick the clouds look (0–1): low clouds hide the stars, high thin ones only dim them.
export function opacity({ low, mid, high, cloud }) {
  if (low === null || low === undefined) return (cloud ?? 0) / 100 * 0.8;
  return 1 - (1 - 0.85 * low / 100) * (1 - 0.6 * mid / 100) * (1 - 0.3 * high / 100);
}

// Cloud thickness in any direction: your own sky overhead, blending into the far points near the horizon.
export function cloudAt(wx, az, alt) {
  const here = opacity(wx.centre);
  if (!wx.ring.length) return here;
  const k = (((az % 360) + 360) % 360) / 45, i = Math.floor(k) % RING, f = k - Math.floor(k);
  const far = opacity(wx.ring[i]) * (1 - f) + opacity(wx.ring[(i + 1) % RING]) * f;
  const w = Math.max(0, Math.min(1, (alt - 4) / 26));
  return far * (1 - w) + here * w;
}

const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export const dirName = (az) => DIRS[Math.round((((az % 360) + 360) % 360) / 45) % 8];

// "Clouds coming in from the west" – compares the sky upwind with the sky overhead.
// Returns the sentence (with {dir} to fill in) and the direction, or null when nothing is changing.
export function trendOf(wx) {
  if (!wx?.ring.length || wx.centre.windFrom === null || (wx.centre.wind ?? 0) < 4) return null;
  const from = wx.centre.windFrom;
  const upwind = cloudAt(wx, from, 0), here = opacity(wx.centre);
  if (upwind > here + 0.25) return { text: 'Clouds coming in from the {dir}.', dir: dirName(from) };
  if (upwind < here - 0.25) return { text: 'Clearer sky coming from the {dir}.', dir: dirName(from) };
  return null;
}
export const trend = (wx) => { const tr = trendOf(wx); return tr ? tr.text.replace('{dir}', tr.dir) : ''; };
