// Procedural SVG artwork for every object, so the app looks great even offline (before photos are downloaded).
import { FIGURES } from './data/catalog.js';

let uid = 0;

// Deterministic pseudo-random numbers so each object always gets the same picture.
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function backgroundStars(rand, n = 40) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const r = rand() * 0.9 + 0.2;
    out += `<circle cx="${(rand() * 200).toFixed(1)}" cy="${(rand() * 200).toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.2 + rand() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

const painters = {
  planet(a, id) {
    const egg = a.egg ? 'scale(1.35 0.8)' : '';
    let bands = '';
    if (a.bands) {
      for (let i = -3; i <= 3; i++) bands += `<rect x="40" y="${100 + i * 13}" width="120" height="${5 + (i % 2 ? 3 : 0)}" fill="${a.color2}" opacity="0.28"/>`;
    }
    const heart = a.heart ? `<path d="M112 108 c6-14 26-10 22 4 c-3 10-18 18-22 22 c-4-4-19-12-22-22 c-4-14 16-18 22-4z" fill="#fff4e4" opacity="0.75"/>` : '';
    const ringBack = a.ring ? `<ellipse cx="100" cy="100" rx="${a.ring === 'thin' ? 70 : 92}" ry="${a.ring === 'thin' ? 68 : 22}" fill="none" stroke="${a.color}" stroke-opacity="0.35" stroke-width="${a.ring === 'thin' ? 1.5 : 9}" transform="rotate(${a.ring === 'thin' ? 80 : -18} 100 100)"/>` : '';
    const ringFront = a.ring && a.ring !== 'thin' ? `<path d="M10.6 116.9 A92 22 -18 0 0 189.4 83.1" fill="none" stroke="${a.color}" stroke-opacity="0.75" stroke-width="9" transform="rotate(0 100 100)"/>` : '';
    return `
      <defs>
        <radialGradient id="p${id}" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="${a.color}"/><stop offset="0.75" stop-color="${a.color2}"/><stop offset="1" stop-color="#050510"/></radialGradient>
        <radialGradient id="h${id}" cx="50%" cy="50%" r="50%"><stop offset="0.6" stop-color="${a.color}" stop-opacity="0.25"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient>
        <clipPath id="c${id}"><circle cx="100" cy="100" r="58" transform="${egg ? 'translate(100 100) scale(1.35 0.8) translate(-100 -100)' : ''}"/></clipPath>
      </defs>
      <circle cx="100" cy="100" r="78" fill="url(#h${id})"/>
      ${ringBack}
      <g clip-path="url(#c${id})"><rect width="200" height="200" fill="url(#p${id})"/>${bands}${heart}</g>
      ${ringFront}`;
  },
  earth(a, id) {
    return `
      <defs>
        <radialGradient id="o${id}" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#5fb4ff"/><stop offset="0.7" stop-color="#1747a8"/><stop offset="1" stop-color="#030820"/></radialGradient>
        <radialGradient id="h${id}" cx="50%" cy="50%" r="50%"><stop offset="0.7" stop-color="#6fc3ff" stop-opacity="0.35"/><stop offset="1" stop-color="#6fc3ff" stop-opacity="0"/></radialGradient>
        <clipPath id="c${id}"><circle cx="100" cy="100" r="58"/></clipPath>
      </defs>
      <circle cx="100" cy="100" r="74" fill="url(#h${id})"/>
      <g clip-path="url(#c${id})">
        <rect width="200" height="200" fill="url(#o${id})"/>
        <path d="M62 70 q14-14 30-6 q10 8 4 18 q-8 6-4 16 q4 12-8 16 q-14 0-18-14 q-10-14-4-30z" fill="#3fa36b" opacity="0.9"/>
        <path d="M112 60 q20-6 30 8 q6 14-6 20 q-12 4-10 18 q0 10 12 14 q-6 16-22 12 q-10-10-8-24 q-8-16 4-48z" fill="#4bb070" opacity="0.85"/>
        <path d="M50 120 q30-8 48 4 q20 2 40-6" stroke="#fff" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>
        <path d="M70 52 q24-8 50-2" stroke="#fff" stroke-width="4" fill="none" opacity="0.45" stroke-linecap="round"/>
      </g>`;
  },
  star(a, id, rand) {
    const s = a.size || 1;
    return `
      <defs><radialGradient id="g${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff"/><stop offset="0.18" stop-color="${a.color}"/><stop offset="0.45" stop-color="${a.color}" stop-opacity="0.35"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient></defs>
      ${backgroundStars(rand, 30)}
      <circle cx="100" cy="100" r="${90 * s}" fill="url(#g${id})"/>
      <g stroke="${a.color}" stroke-linecap="round" opacity="0.8">
        <line x1="100" y1="${100 - 85 * s}" x2="100" y2="${100 + 85 * s}" stroke-width="1.6"/>
        <line x1="${100 - 85 * s}" y1="100" x2="${100 + 85 * s}" y2="100" stroke-width="1.6"/>
        <line x1="70" y1="70" x2="130" y2="130" stroke-width="0.8"/><line x1="130" y1="70" x2="70" y2="130" stroke-width="0.8"/>
      </g>
      <circle cx="100" cy="100" r="${10 * s}" fill="#fff"/>`;
  },
  cluster(a, id, rand) {
    let stars = '';
    for (let i = 0; i < 9; i++) {
      const x = 50 + rand() * 100, y = 50 + rand() * 100, r = 2 + rand() * 4;
      stars += `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="url(#g${id})"/><circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="#fff"/>`;
    }
    return `<defs><radialGradient id="g${id}"><stop offset="0" stop-color="${a.color}" stop-opacity="0.9"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient>
      <radialGradient id="n${id}"><stop offset="0" stop-color="${a.color}" stop-opacity="0.25"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient></defs>
      ${backgroundStars(rand, 50)}<ellipse cx="100" cy="100" rx="90" ry="70" fill="url(#n${id})"/>${stars}`;
  },
  nebula(a, id, rand) {
    let blobs = '';
    for (let i = 0; i < 14; i++) {
      const c = i % 2 ? a.color : a.color2;
      blobs += `<ellipse cx="${(40 + rand() * 120).toFixed(0)}" cy="${(40 + rand() * 120).toFixed(0)}" rx="${(20 + rand() * 40).toFixed(0)}" ry="${(15 + rand() * 30).toFixed(0)}" fill="${c}" opacity="${(0.12 + rand() * 0.2).toFixed(2)}" transform="rotate(${(rand() * 180).toFixed(0)} 100 100)"/>`;
    }
    const pillars = a.pillars ? `<path d="M60 200 L66 110 q4-16 12-4 L84 200z M100 200 L104 70 q6-16 14-2 L122 200z M140 200 L144 130 q5-12 10 0 L156 200z" fill="#2b1a10" opacity="0.85"/>` : '';
    let fil = '';
    if (a.filaments) for (let i = 0; i < 12; i++) fil += `<path d="M100 100 q${(rand() * 120 - 60).toFixed(0)} ${(rand() * 120 - 60).toFixed(0)} ${(rand() * 160 - 80).toFixed(0)} ${(rand() * 160 - 80).toFixed(0)}" stroke="${a.color}" stroke-width="1.2" fill="none" opacity="0.6"/>`;
    return `<defs><filter id="b${id}"><feGaussianBlur stdDeviation="9"/></filter></defs>
      ${backgroundStars(rand, 45)}<g filter="url(#b${id})">${blobs}</g>${fil}${pillars}
      <circle cx="100" cy="100" r="2.5" fill="#fff"/>`;
  },
  ring(a, id, rand) {
    return `<defs><radialGradient id="r${id}"><stop offset="0.35" stop-color="${a.color}" stop-opacity="0.15"/><stop offset="0.6" stop-color="${a.color}" stop-opacity="0.7"/><stop offset="0.8" stop-color="${a.color2}" stop-opacity="0.8"/><stop offset="1" stop-color="${a.color2}" stop-opacity="0"/></radialGradient>
      <filter id="b${id}"><feGaussianBlur stdDeviation="3"/></filter></defs>
      ${backgroundStars(rand, 40)}<ellipse cx="100" cy="100" rx="68" ry="56" fill="url(#r${id})" filter="url(#b${id})"/><circle cx="100" cy="100" r="2.5" fill="#fff"/>`;
  },
  galaxy(a, id, rand) {
    let arms = '';
    const N = a.irregular ? 0 : 2;
    for (let k = 0; k < N; k++) {
      for (let i = 0; i < 160; i++) {
        const t = i / 160 * 3.6;
        const r = 8 + t * 22;
        const ang = t * 1.4 + k * Math.PI + (rand() - 0.5) * 0.5;
        const x = 100 + Math.cos(ang) * r, y = 100 + Math.sin(ang) * r;
        arms += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + rand() * 1.8).toFixed(1)}" fill="${i % 7 === 0 ? '#ffb3d9' : a.color2}" opacity="${(0.25 + rand() * 0.5).toFixed(2)}"/>`;
      }
    }
    if (a.irregular) for (let i = 0; i < 260; i++) arms += `<circle cx="${(100 + (rand() - 0.5) * 120 * rand()).toFixed(1)}" cy="${(100 + (rand() - 0.5) * 90 * rand()).toFixed(1)}" r="${(0.5 + rand() * 1.6).toFixed(1)}" fill="${i % 9 ? a.color : a.color2}" opacity="${(0.3 + rand() * 0.5).toFixed(2)}"/>`;
    const squash = a.edgeOn ? 'scale(1 0.32)' : a.tilt ? 'scale(1 0.45)' : a.faceOn ? 'scale(1 0.9)' : 'scale(1 0.7)';
    const dust = a.edgeOn ? `<ellipse cx="100" cy="100" rx="82" ry="5" fill="#120a05" opacity="0.85"/>` : '';
    const comp = a.companion ? `<circle cx="160" cy="48" r="10" fill="url(#c${id})"/>` : '';
    return `<defs><radialGradient id="c${id}"><stop offset="0" stop-color="#fff"/><stop offset="0.25" stop-color="${a.color}"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient>
      <filter id="b${id}"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
      ${backgroundStars(rand, 35)}
      <g transform="translate(100 100) rotate(-28) ${squash} translate(-100 -100)">
        <g filter="url(#b${id})">${arms}</g>
        <ellipse cx="100" cy="100" rx="${a.bar ? 30 : 22}" ry="${a.bar ? 12 : 22}" fill="url(#c${id})"/>
        <circle cx="100" cy="100" r="34" fill="url(#c${id})" opacity="0.6"/>
      </g>${dust}${comp}`;
  },
  pulsar(a, id, rand) {
    return `<defs><linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.color}" stop-opacity="0"/><stop offset="0.5" stop-color="${a.color}" stop-opacity="0.85"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></linearGradient>
      <radialGradient id="g${id}"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="${a.color}"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient></defs>
      ${backgroundStars(rand, 40)}
      <g class="spin" style="transform-origin:100px 100px"><polygon points="92,0 108,0 101,100 99,100" fill="url(#b${id})"/><polygon points="99,100 101,100 108,200 92,200" fill="url(#b${id})"/></g>
      ${[30, 44, 58].map((r) => `<ellipse cx="100" cy="100" rx="${r}" ry="${r * 0.35}" fill="none" stroke="${a.color}" stroke-opacity="0.35" transform="rotate(20 100 100)"/>`).join('')}
      <circle cx="100" cy="100" r="22" fill="url(#g${id})"/>`;
  },
  blackhole(a, id, rand) {
    const R = a.big ? 34 : 28;
    return `<defs><radialGradient id="d${id}"><stop offset="0.45" stop-color="${a.color}" stop-opacity="0"/><stop offset="0.55" stop-color="#fff2d0"/><stop offset="0.68" stop-color="${a.color}"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient>
      <filter id="b${id}"><feGaussianBlur stdDeviation="2.5"/></filter></defs>
      ${backgroundStars(rand, 40)}
      <ellipse cx="100" cy="100" rx="92" ry="20" fill="url(#d${id})" filter="url(#b${id})" transform="rotate(-8 100 100)"/>
      <circle cx="100" cy="100" r="${R * 1.9}" fill="url(#d${id})" filter="url(#b${id})"/>
      <circle cx="100" cy="100" r="${R}" fill="#000"/>
      <path d="M8 104 Q100 ${120 - R * 0.2} 192 96" stroke="${a.color}" stroke-width="5" fill="none" opacity="0.8" filter="url(#b${id})" transform="rotate(-8 100 100)"/>`;
  },
  constellation(a, id, rand) {
    const f = FIGURES[a.id];
    const ras = f.stars.map((s) => s[1]);
    const decs = f.stars.map((s) => s[2]);
    const midDec = (Math.max(...decs) + Math.min(...decs)) / 2;
    const k = Math.cos((midDec * Math.PI) / 180);
    const pts0 = f.stars.map(([, ra, dec]) => [-(ra - ras[0]) * k, -dec]);
    const xs = pts0.map((p) => p[0]), ys = pts0.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const sc = 140 / Math.max(w, h);
    const pts = pts0.map(([x, y]) => [100 + (x - (Math.max(...xs) + Math.min(...xs)) / 2) * sc, 100 + (y - (Math.max(...ys) + Math.min(...ys)) / 2) * sc]);
    const lines = f.lines.map(([i, j]) => `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}"/>`).join('');
    const stars = pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 0 ? 4 : 3}" fill="#fff"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="url(#g${id})"/>`).join('');
    return `<defs><radialGradient id="g${id}"><stop offset="0" stop-color="#9fe8ff" stop-opacity="0.8"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient></defs>
      ${backgroundStars(rand, 50)}<g stroke="#7fdcff" stroke-opacity="0.6" stroke-width="1.2" stroke-dasharray="3 3">${lines}</g>${stars}`;
  },
  comet(a, id, rand) {
    const head = a.duck
      ? `<g transform="translate(118 70) rotate(-20)"><ellipse cx="0" cy="8" rx="16" ry="11" fill="#6d6a66"/><ellipse cx="13" cy="-8" rx="10" ry="8" fill="#7d7a76"/></g>`
      : a.cigar
        ? `<ellipse cx="118" cy="70" rx="22" ry="6" fill="#8a5a3a" transform="rotate(-30 118 70)"/>`
        : `<circle cx="118" cy="70" r="9" fill="#fff"/>`;
    const tails = a.cigar ? '' : `
      <path d="M118 70 L18 178 L44 182 Z" fill="url(#t${id})" opacity="0.9"/>
      ${a.twoTails ? `<path d="M118 70 Q60 120 30 196 L58 190 Q76 130 118 70Z" fill="url(#d${id})" opacity="0.8"/>` : ''}`;
    return `<defs>
        <linearGradient id="t${id}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.color}" stop-opacity="0.9"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></linearGradient>
        <linearGradient id="d${id}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7b0" stop-opacity="0.85"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>
        <radialGradient id="g${id}"><stop offset="0" stop-color="${a.color}" stop-opacity="0.8"/><stop offset="1" stop-color="${a.color}" stop-opacity="0"/></radialGradient>
        <filter id="b${id}"><feGaussianBlur stdDeviation="${a.cigar ? 0 : 3}"/></filter></defs>
      ${backgroundStars(rand, 45)}<g filter="url(#b${id})">${tails}</g>
      <circle cx="118" cy="70" r="${a.cigar ? 30 : 26}" fill="url(#g${id})"/>${head}
      ${a.cigar ? `<path d="M160 40 L182 26 M176 24 l6 2 -2 6" stroke="#ffb36b" stroke-width="2" fill="none" stroke-linecap="round"/>` : ''}`;
  },
  iss(a, id, rand) {
    const panel = (x, y) => `<rect x="${x}" y="${y}" width="34" height="16" fill="url(#s${id})" stroke="#8fb4ff" stroke-width="0.6"/>`;
    return `<defs><linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a4a9a"/><stop offset="1" stop-color="#7a5a2a"/></linearGradient>
        <radialGradient id="e${id}" cx="50%" cy="0%" r="100%"><stop offset="0.6" stop-color="#1747a8"/><stop offset="0.95" stop-color="#6fc3ff"/><stop offset="1" stop-color="#6fc3ff" stop-opacity="0"/></radialGradient></defs>
      ${backgroundStars(rand, 30)}
      <ellipse cx="100" cy="260" rx="190" ry="110" fill="url(#e${id})"/>
      <g transform="rotate(-12 100 90)">
        <rect x="40" y="86" width="120" height="6" rx="2" fill="#d8dde8"/>
        ${panel(22, 60)}${panel(22, 100)}${panel(144, 60)}${panel(144, 100)}
        <rect x="58" y="62" width="4" height="54" fill="#c5ccda"/><rect x="138" y="62" width="4" height="54" fill="#c5ccda"/>
        <rect x="82" y="78" width="36" height="22" rx="5" fill="#eef1f7"/><rect x="92" y="98" width="16" height="22" rx="4" fill="#dfe4ee"/>
        <rect x="74" y="100" width="12" height="8" fill="#e8ecf4"/><circle cx="100" cy="89" r="3" fill="#7fdcff"/>
      </g>`;
  },
  exoplanet(a, id, rand) {
    const planet = a.planet;
    return `<defs><radialGradient id="g${id}"><stop offset="0" stop-color="#fff"/><stop offset="0.2" stop-color="${a.star}"/><stop offset="1" stop-color="${a.star}" stop-opacity="0"/></radialGradient>
        <radialGradient id="p${id}" cx="30%" cy="35%" r="75%"><stop offset="0" stop-color="${planet}"/><stop offset="0.8" stop-color="#0a0a18"/></radialGradient></defs>
      ${backgroundStars(rand, 40)}
      <circle cx="58" cy="70" r="${a.pulsar ? 40 : 62}" fill="url(#g${id})"/>
      ${a.pulsar ? `<polygon points="54,0 62,0 59,70 57,70" fill="${a.star}" opacity="0.6"/><polygon points="57,70 59,70 66,200 50,200" fill="${a.star}" opacity="0.4"/>` : ''}
      <ellipse cx="90" cy="100" rx="78" ry="26" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-dasharray="3 5" transform="rotate(15 90 100)"/>
      ${a.tail ? `<path d="M140 130 Q175 128 198 110 L198 150 Q172 142 140 138Z" fill="${planet}" opacity="0.3"/>` : ''}
      <circle cx="140" cy="134" r="${a.hot ? 22 : 20}" fill="url(#p${id})"/>
      ${a.hot ? `<circle cx="140" cy="134" r="24" fill="none" stroke="#ff8a3a" stroke-opacity="0.5" stroke-width="3"/>` : ''}
      ${a.earthlike ? `<path d="M128 128 q6-6 12 0 q4 6-2 10z M142 140 q8-2 10 4" fill="#2f6a3a" stroke="none" opacity="0.8"/>` : ''}
      ${a.ocean ? `<circle cx="140" cy="134" r="24" fill="none" stroke="#9fe8ff" stroke-opacity="0.35" stroke-width="4"/>` : ''}`;
  },
  system(a, id, rand) {
    let orbits = '', planets = '';
    for (let k = 0; k < a.count; k++) {
      const r = 22 + k * 11;
      const ang = rand() * Math.PI * 2;
      orbits += `<ellipse cx="100" cy="100" rx="${r}" ry="${r * 0.42}" fill="none" stroke="#fff" stroke-opacity="0.13"/>`;
      planets += `<circle cx="${(100 + Math.cos(ang) * r).toFixed(1)}" cy="${(100 + Math.sin(ang) * r * 0.42).toFixed(1)}" r="${(3.2 + rand() * 1.6).toFixed(1)}" fill="hsl(${[20, 30, 200, 170, 140, 210, 260][k % 7]} 50% 62%)"/>`;
    }
    return `<defs><radialGradient id="g${id}"><stop offset="0" stop-color="#fff"/><stop offset="0.2" stop-color="${a.star}"/><stop offset="1" stop-color="${a.star}" stop-opacity="0"/></radialGradient></defs>
      ${backgroundStars(rand, 40)}${orbits}<circle cx="100" cy="100" r="22" fill="url(#g${id})"/>${planets}`;
  },
  cosmos(a, id, rand) {
    if (a.cmb) {
      let cells = '';
      for (let i = 0; i < 160; i++) {
        const hue = rand() < 0.5 ? 210 + rand() * 30 : 10 + rand() * 30;
        cells += `<circle cx="${(rand() * 200).toFixed(0)}" cy="${(rand() * 200).toFixed(0)}" r="${(6 + rand() * 12).toFixed(0)}" fill="hsl(${hue.toFixed(0)} 80% 55%)" opacity="0.45"/>`;
      }
      return `<defs><filter id="b${id}"><feGaussianBlur stdDeviation="6"/></filter><clipPath id="e${id}"><ellipse cx="100" cy="100" rx="94" ry="58"/></clipPath></defs>
        <g clip-path="url(#e${id})"><rect width="200" height="200" fill="#2a3f8f"/><g filter="url(#b${id})">${cells}</g></g>
        <ellipse cx="100" cy="100" rx="94" ry="58" fill="none" stroke="#9fe8ff" stroke-opacity="0.5"/>`;
    }
    if (a.expanding) {
      let dots = '';
      for (let i = 0; i < 70; i++) {
        const ang = rand() * Math.PI * 2, r = 10 + rand() * 85;
        const x = 100 + Math.cos(ang) * r, y = 100 + Math.sin(ang) * r;
        dots += `<line x1="${(100 + Math.cos(ang) * r * 0.82).toFixed(1)}" y1="${(100 + Math.sin(ang) * r * 0.82).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ffd79a" stroke-opacity="0.4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + rand() * 1.8).toFixed(1)}" fill="#fff"/>`;
      }
      return `<defs><radialGradient id="g${id}"><stop offset="0" stop-color="#fff"/><stop offset="0.15" stop-color="#ffcf7a"/><stop offset="0.5" stop-color="#ff5fa8" stop-opacity="0.35"/><stop offset="1" stop-color="#3a1a8a" stop-opacity="0"/></radialGradient></defs>
        <circle cx="100" cy="100" r="98" fill="url(#g${id})"/>${dots}`;
    }
    if (a.dark) {
      let web = '';
      const nodes = Array.from({ length: 18 }, () => [20 + rand() * 160, 20 + rand() * 160]);
      nodes.forEach(([x, y], i) => {
        const [x2, y2] = nodes[(i * 7 + 3) % nodes.length];
        web += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="#8a6cff" stroke-opacity="0.35" stroke-width="2"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(3 + rand() * 6).toFixed(0)}" fill="#b49cff" opacity="0.35"/>`;
      });
      return `<defs><filter id="b${id}"><feGaussianBlur stdDeviation="3"/></filter></defs>${backgroundStars(rand, 30)}<g filter="url(#b${id})">${web}</g>`;
    }
    let gals = '';
    for (let i = 0; i < 70; i++) {
      const hue = [30, 200, 330, 50][i % 4];
      gals += `<ellipse cx="${(rand() * 200).toFixed(0)}" cy="${(rand() * 200).toFixed(0)}" rx="${(1 + rand() * 5).toFixed(1)}" ry="${(0.8 + rand() * 2.5).toFixed(1)}" fill="hsl(${hue} 90% 75%)" opacity="${(0.4 + rand() * 0.6).toFixed(2)}" transform="rotate(${(rand() * 180).toFixed(0)} 100 100)"/>`;
    }
    return backgroundStars(rand, 20) + gals;
  },
};

export function artSVG(obj, cls = '') {
  const a = obj.art || { type: 'star', color: '#fff' };
  const id = `a${++uid}`;
  const body = (painters[a.type] || painters.star)(a, id, rng(obj.id || obj.name));
  return `<svg class="art ${cls}" viewBox="0 0 200 200" aria-hidden="true">${body}</svg>`;
}
