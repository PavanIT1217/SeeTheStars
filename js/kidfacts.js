// Turn big numbers into things a kid can picture: car trips, Earths side by side, light racing across space.
import { formatYears } from './timemachine.js';

const EARTH_KM = 12742;
const CAR_KMH = 100;

const round = (n) => (n >= 10 ? Math.round(n).toLocaleString('en-US') : String(+n.toFixed(1)));
const lightYears = (ly) => (ly < 100 ? String(+ly.toFixed(1)) : formatYears(ly));

export function humanKm(km) {
  if (km >= 1e9) return `${+(km / 1e9).toFixed(1)} billion km`;
  if (km >= 1e6) return `${Math.round(km / 1e6).toLocaleString('en-US')} million km`;
  return `${Math.round(km).toLocaleString('en-US')} km`;
}

function carTrip(km) {
  const hours = km / CAR_KMH;
  if (hours < 48) return `${round(hours)} hours`;
  const days = hours / 24;
  if (days < 365) return `${round(days)} days`;
  return `${formatYears(days / 365.25)} years`;
}

// Diameter in km from facts like "12,742 km", "~940 km" or "1.39 million km (109 Earths)".
export function diameterKm(facts) {
  for (const [label, value] of facts) {
    if (!/diameter|size/i.test(label)) continue;
    const m = value.match(/([\d.,]+)\s*(million)?\s*km/i);
    if (m) return parseFloat(m[1].replace(/,/g, '')) * (m[2] ? 1e6 : 1);
  }
  return null;
}

export function sizeComparison(km) {
  const ratio = km / EARTH_KM;
  if (ratio >= 1.5) return `About ${round(ratio)} Earths would fit side by side across it.`;
  if (ratio >= 0.75) return 'Almost exactly the same size as Earth!';
  return `You could line up ${Math.round(1 / ratio)} of them across Earth.`;
}

const ICONS = [
  [/diameter|size|width/i, '📏'],
  [/year/i, '🗓️'], [/day/i, '🌗'], [/moon/i, '🌙'], [/temp|surface|core/i, '🌡️'], [/mass/i, '⚖️'],
  [/discover|found/i, '🔎'], [/age/i, '⏳'], [/speed|spins|winds|pulse/i, '💨'], [/constellation|where/i, '✨'],
  [/ring/i, '💍'], [/planet/i, '🪐'], [/star/i, '⭐'], [/height|orbit/i, '🛰️'], [/visited|landed/i, '🚀'],
];
const iconFor = (label) => (ICONS.find(([re]) => re.test(label)) || [null, '⭐'])[1];

// Up to three { icon, big, small } bubbles for an object. `liveKm` is its distance right now, if known.
export function kidFacts(o, liveKm = null) {
  const bubbles = [];
  const used = new Set();

  // 1. How far away?
  if (o.pos?.down) bubbles.push({ icon: '📍', big: '0 km away', small: 'You are standing on it right now!' });
  else if (o.pos?.everywhere) bubbles.push({ icon: '🌌', big: 'Everywhere', small: 'It is all around you, in every direction.' });
  else if (o.pos?.iss) {
    used.add('Height');
    bubbles.push({ icon: '🚗', big: 'About 400 km up', small: 'A car would get there in about 4 hours – if it could drive straight up!' });
  }
  else if (liveKm) bubbles.push({ icon: '🚗', big: `${humanKm(liveKm)} away`, small: `A car driving non-stop would need ${carTrip(liveKm)} to get there.` });
  else if (o.ly) bubbles.push({ icon: '💡', big: `${lightYears(o.ly)} light-years away`, small: `Even light – the fastest thing there is – needs ${lightYears(o.ly)} years to get here.` });

  // 2. How big?
  const sizeFact = o.id !== 'earth' && o.facts.find(([label]) => /diameter|size/i.test(label));
  const d = sizeFact && diameterKm([sizeFact]);
  const times = sizeFact && sizeFact[1].match(/([\d.]+)\s*×\s*Earth/);
  if (d || times) {
    used.add(sizeFact[0]);
    const small = d ? sizeComparison(d) : `About ${times[1]} times as wide as Earth.`;
    bubbles.push({ icon: '📏', big: sizeFact[1].replace(/\s*\(.*\)/, ''), small });
  }

  // 3. Fill up with the object's own facts.
  for (const [label, value] of o.facts) {
    if (bubbles.length >= 3) break;
    if (used.has(label) || /distance/i.test(label)) continue;
    bubbles.push({ icon: iconFor(label), big: value, small: label });
  }
  return bubbles.slice(0, 3);
}
