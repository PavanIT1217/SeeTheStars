// Astronomy engine: where is everything in the sky, right now, from right here?
// Accuracy target: well under 1° (phone compasses are rarely better than ~5°).

const DEG = Math.PI / 180;
const OBLIQUITY = 23.43928 * DEG; // tilt of Earth's axis (J2000)
export const KM_PER_AU = 149597870.7;
export const KM_PER_LY = 9460730472580.8;
const LIGHT_KM_S = 299792.458;

const norm360 = (x) => ((x % 360) + 360) % 360;
const sind = (x) => Math.sin(x * DEG);
const cosd = (x) => Math.cos(x * DEG);

export const julianDate = (date) => date.getTime() / 86400000 + 2440587.5;

// Greenwich mean sidereal time in degrees.
export function gmst(jd) {
  const d = jd - 2451545.0;
  const T = d / 36525;
  return norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000);
}

// Equatorial (RA/Dec, degrees) -> horizontal (altitude, azimuth from North through East).
export function toHorizontal(ra, dec, lat, lon, jd) {
  const H = (gmst(jd) + lon - ra) * DEG;
  const phi = lat * DEG;
  const d = dec * DEG;
  const sinAlt = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(phi) * Math.sin(d) - Math.sin(phi) * Math.cos(d) * Math.cos(H));
  return { alt: alt / DEG, az: norm360(az / DEG) };
}

// Rotation from equatorial unit vectors [cos δ cos α, cos δ sin α, sin δ] to East-North-Up.
// Thousands of stars go through this every few seconds, so it skips the trig of toHorizontal.
export function horizonMatrix(lat, lon, jd) {
  const L = (gmst(jd) + lon) * DEG, phi = lat * DEG;
  const [sL, cL, sp, cp] = [Math.sin(L), Math.cos(L), Math.sin(phi), Math.cos(phi)];
  return [-sL, cL, 0, -sp * cL, -sp * sL, cp, cp * cL, cp * sL, sp];
}

export const equatorialVector = (ra, dec) => [cosd(dec) * cosd(ra), cosd(dec) * sind(ra), sind(dec)];

// --- Planets: JPL "Keplerian Elements for Approximate Positions" (valid 1800–2050) ---
// [a, e, I, L, longPeri, longNode] and their rates per Julian century.
const PLANETS = {
  mercury: [[0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
  venus: [[0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]],
  earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  mars: [[1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
  uranus: [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
  neptune: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]],
  pluto: [[39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684], [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482]],
};

// Dwarf planets: osculating elements from JPL Small-Body Database, epoch JD 2461200.5.
// [a, e, i, node, argPeri, meanAnomaly, meanMotion(deg/day)]
const SMALL_BODIES = {
  ceres: [2.765552595, 0.0796922951, 10.5880278, 80.2486268, 73.2942145, 274.4193464, 0.2143044506],
  eris: [67.93394688, 0.4382385348, 43.9258279, 36.0047704, 150.7949236, 211.7744343, 0.0017602478],
  haumea: [43.06029024, 0.1944430149, 28.2084739, 121.7860561, 240.6905473, 223.2104119, 0.0034880977],
  makemake: [45.57093317, 0.158888995, 29.027856, 79.2948338, 297.0922733, 169.9379962, 0.0032038501],
};
const SMALL_EPOCH = 2461200.5;

// Comets: osculating heliocentric elements from JPL Horizons at 2026-Oct-01 (perihelion form, works for any eccentricity).
// [e, q (AU), i, node, argPeri, perihelion time (JD)]
const COMETS = {
  halley: [0.968027264, 0.571016952, 162.190241, 59.272122, 112.172671, 2474040.32447],
  c67p: [0.649487002, 1.212424001, 3.866097, 36.287975, 22.237595, 2461871.04759],
  halebopp: [0.994890296, 0.925507724, 89.73523, 281.806554, 130.726992, 2450536.52713],
  oumuamua: [1.209057354, 0.266333283, 123.079423, 24.838579, 242.507998, 2458003.97142],
  atlas3i: [6.123801808, 1.352033393, 175.240112, 323.024223, 128.796896, 2460977.9455],
};
const GAUSS_K = 0.01720209895; // radians per day

function solveKepler(Mdeg, e) {
  const M = norm360(Mdeg) * DEG;
  let E = e < 0.8 ? M : Math.PI;
  for (let k = 0; k < 30; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

// Rotate a position in the orbital plane (perihelion along +x) into heliocentric ecliptic J2000 coordinates.
function orient(xp, yp, i, node, argPeri) {
  const [cw, sw, cO, sO, ci, si] = [cosd(argPeri), sind(argPeri), cosd(node), sind(node), cosd(i), sind(i)];
  return [
    (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp,
    (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp,
    sw * si * xp + cw * si * yp,
  ];
}

// Heliocentric ecliptic (J2000) position in AU from classical elements (angles in degrees).
function orbitPosition(a, e, i, node, argPeri, M) {
  const E = solveKepler(M, e);
  return orient(a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E), i, node, argPeri);
}

// Comet or interstellar object from perihelion elements – elliptical (e < 1) or hyperbolic (e > 1).
function cometPosition([e, q, i, node, argPeri, tp], jd) {
  const a = q / (1 - e);
  const n = GAUSS_K / Math.pow(Math.abs(a), 1.5); // radians per day
  const M = n * (jd - tp);
  if (e < 1) return orbitPosition(a, e, i, node, argPeri, M / DEG);
  // Hyperbolic Kepler equation: e·sinh(H) − H = M
  let H = Math.asinh(M / e);
  for (let k = 0; k < 50; k++) {
    const dH = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    H -= dH;
    if (Math.abs(dH) < 1e-12) break;
  }
  const A = -a; // positive semi-axis length
  return orient(A * (e - Math.cosh(H)), A * Math.sqrt(e * e - 1) * Math.sinh(H), i, node, argPeri);
}

function heliocentric(body, jd) {
  if (PLANETS[body]) {
    const T = (jd - 2451545.0) / 36525;
    const [el, rate] = PLANETS[body];
    const [a, e, I, L, wbar, node] = el.map((v, k) => v + rate[k] * T);
    return orbitPosition(a, e, I, node, wbar - node, L - wbar);
  }
  if (COMETS[body]) return cometPosition(COMETS[body], jd);
  const [a, e, i, node, w, M0, n] = SMALL_BODIES[body];
  return orbitPosition(a, e, i, node, w, M0 + n * (jd - SMALL_EPOCH));
}

function eclipticToEquatorial([x, y, z]) {
  const ye = y * Math.cos(OBLIQUITY) - z * Math.sin(OBLIQUITY);
  const ze = y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY);
  const r = Math.hypot(x, ye, ze);
  return { ra: norm360(Math.atan2(ye, x) / DEG), dec: Math.asin(ze / r) / DEG, r };
}

// Low-precision Moon (Astronomical Almanac), good to ~0.3°.
function moonPosition(jd) {
  const T = (jd - 2451545.0) / 36525;
  const lam = 218.32 + 481267.881 * T + 6.29 * sind(135.0 + 477198.87 * T) - 1.27 * sind(259.3 - 413335.36 * T)
    + 0.66 * sind(235.7 + 890534.22 * T) + 0.21 * sind(269.9 + 954397.74 * T)
    - 0.19 * sind(357.5 + 35999.05 * T) - 0.11 * sind(186.5 + 966404.03 * T);
  const bet = 5.13 * sind(93.3 + 483202.02 * T) + 0.28 * sind(228.2 + 960400.89 * T)
    - 0.28 * sind(318.3 + 6003.15 * T) - 0.17 * sind(217.6 - 407332.21 * T);
  const par = 0.9508 + 0.0518 * cosd(135.0 + 477198.87 * T) + 0.0095 * cosd(259.3 - 413335.36 * T)
    + 0.0078 * cosd(235.7 + 890534.22 * T) + 0.0028 * cosd(269.9 + 954397.74 * T);
  const rKm = 6378.14 / sind(par);
  const eq = eclipticToEquatorial([cosd(bet) * cosd(lam), cosd(bet) * sind(lam), sind(bet)]);
  return { ra: eq.ra, dec: eq.dec, km: rKm, parallax: par };
}

export const SOLAR_SYSTEM_BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ceres', 'eris', 'haumea', 'makemake', ...Object.keys(COMETS)];

// Geocentric RA/Dec (degrees) and distance (km) of a solar-system body.
export function bodyPosition(body, jd) {
  if (body === 'moon') return moonPosition(jd);
  const earth = heliocentric('earth', jd);
  let p = body === 'sun' ? [0, 0, 0] : heliocentric(body, jd);
  let geo = p.map((v, k) => v - earth[k]);
  // Correct for light travel time (matters for the outer planets).
  if (body !== 'sun') {
    const tau = (Math.hypot(...geo) * KM_PER_AU) / LIGHT_KM_S / 86400;
    p = heliocentric(body, jd - tau);
    geo = p.map((v, k) => v - earth[k]);
  }
  const eq = eclipticToEquatorial(geo);
  return { ra: eq.ra, dec: eq.dec, km: eq.r * KM_PER_AU };
}

// Where is a catalog object? Returns null for things that are "everywhere" or not in the sky.
export function skyPosition(pos, jd) {
  if (!pos) return null;
  if (pos.body) return bodyPosition(pos.body, jd);
  if (pos.ra !== undefined) return { ra: pos.ra, dec: pos.dec };
  return null;
}

export function horizontalFor(pos, observer, date = new Date()) {
  const jd = julianDate(date);
  const eq = skyPosition(pos, jd);
  if (!eq) return null;
  const h = toHorizontal(eq.ra, eq.dec, observer.lat, observer.lon, jd);
  if (eq.parallax) h.alt -= eq.parallax * cosd(h.alt); // the Moon is close enough that your spot on Earth matters
  return { ...h, ...eq };
}

// Find the next time the object crosses the horizon (rising or setting), scanning ahead in 10-minute steps.
export function nextHorizonCrossing(pos, observer, from = new Date(), hours = 26) {
  const step = 10 * 60 * 1000;
  let prev = horizontalFor(pos, observer, from);
  if (!prev) return null;
  for (let t = from.getTime() + step; t <= from.getTime() + hours * 3600e3; t += step) {
    const cur = horizontalFor(pos, observer, new Date(t));
    if ((prev.alt < 0) !== (cur.alt < 0)) {
      const f = prev.alt / (prev.alt - cur.alt);
      return { rising: cur.alt >= 0, time: new Date(t - step + f * step) };
    }
    prev = cur;
  }
  return { never: true, up: prev.alt >= 0 };
}

// The next rise and set within `hours` (either can be missing: circumpolar, or never rises).
export function riseSet(pos, observer, from = new Date(), hours = 26) {
  const out = { rise: null, set: null };
  let t = from;
  for (let i = 0; i < 2; i++) {
    const c = nextHorizonCrossing(pos, observer, t, hours - (t - from) / 3600e3);
    if (!c?.time) break;
    out[c.rising ? 'rise' : 'set'] ??= c.time;
    t = new Date(c.time.getTime() + 60e3);
  }
  return out;
}

// --- Moon phase ---
const SYNODIC_MONTH = 29.530588;
const eclipticLon = ({ ra, dec }) => norm360(Math.atan2(sind(ra) * Math.cos(OBLIQUITY) + Math.tan(dec * DEG) * Math.sin(OBLIQUITY), cosd(ra)) / DEG);
const PHASES = [['New Moon', '🌑'], ['Waxing crescent', '🌒'], ['First quarter', '🌓'], ['Waxing gibbous', '🌔'], ['Full Moon', '🌕'], ['Waning gibbous', '🌖'], ['Last quarter', '🌗'], ['Waning crescent', '🌘']];

// How far the Moon is ahead of the Sun along the ecliptic: 0° new, 90° first quarter, 180° full.
export function moonElongation(date = new Date()) {
  const jd = julianDate(date);
  return norm360(eclipticLon(moonPosition(jd)) - eclipticLon(bodyPosition('sun', jd)));
}

export function moonPhase(date = new Date()) {
  const e = moonElongation(date);
  const [name, emoji] = PHASES[Math.round(e / 45) % 8];
  return { elongation: e, illumination: (1 - cosd(e)) / 2, age: (e / 360) * SYNODIC_MONTH, waxing: e < 180, name, emoji };
}

// Next time the elongation reaches `target` degrees (0 new, 90 first quarter, 180 full, 270 last quarter).
export function nextMoonPhase(target, from = new Date()) {
  const gap = (d) => norm360(target - moonElongation(d));
  let t = from.getTime() + (gap(from) / 360) * SYNODIC_MONTH * 86400e3; // first guess at the Moon's mean speed
  for (let i = 0; i < 6; i++) {
    const g = ((gap(new Date(t)) + 180) % 360) - 180;
    t += (g / 12.19) * 86400e3; // the Moon gains about 12.19° a day on the Sun
    if (Math.abs(g) < 0.01) break;
  }
  return new Date(t);
}

export function angularDistance(alt1, az1, alt2, az2) {
  const c = sind(alt1) * sind(alt2) + cosd(alt1) * cosd(alt2) * cosd(az1 - az2);
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}

export function compassName(az) {
  const names = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  return names[Math.round(norm360(az) / 45) % 8];
}

export function formatRA(ra) {
  const h = norm360(ra) / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round(((h - hh) * 60 - mm) * 60);
  return `${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m ${String(ss % 60).padStart(2, '0')}s`;
}

export function formatDec(dec) {
  const s = dec < 0 ? '−' : '+';
  const a = Math.abs(dec);
  const d = Math.floor(a);
  const m = Math.round((a - d) * 60);
  return `${s}${String(m === 60 ? d + 1 : d).padStart(2, '0')}° ${String(m % 60).padStart(2, '0')}′`;
}

export function lightTime(km) {
  const s = km / LIGHT_KM_S;
  if (s < 60) return `${s.toFixed(1)} seconds`;
  if (s < 3600) return `${(s / 60).toFixed(1)} minutes`;
  return `${(s / 3600).toFixed(1)} hours`;
}

export { norm360 };
