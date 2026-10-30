// Explorer progress, kept on the device. XP is derived from what the explorer has done, never stored directly.
import { SECTORS, JOURNEY } from './data/catalog.js';

const KEY = 'stg.progress.v1';
const SETTINGS_KEY = 'stg.settings.v1';

function load(key, fallback) {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    return { ...fallback };
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable – progress just won't persist */ }
}

let state = load(KEY, { learned: {}, spotted: {}, quiz: {}, name: '' });
let settings = load(SETTINGS_KEY, { fov: 62, headingOffset: 0, location: null, camera: true, mode: 'explorer', night: false });
export const isScientist = () => settings.mode === 'scientist';
const listeners = new Set();

export const RANKS = [
  [0, 'Stargazer Cadet'],
  [100, 'Moon Walker'],
  [250, 'Planet Hopper'],
  [450, 'Star Sailor'],
  [700, 'Nebula Navigator'],
  [1000, 'Galaxy Ranger'],
  [1400, 'Cosmic Explorer'],
];

export const XP = { learn: 10, spot: 20, quizPass: 50, quizPerfect: 25 };

export function progress() {
  return state;
}

export function xp() {
  let total = Object.keys(state.learned).length * XP.learn + Object.keys(state.spotted).length * XP.spot;
  for (const r of Object.values(state.quiz)) {
    if (r.passed) total += XP.quizPass;
    if (r.best === r.total) total += XP.quizPerfect;
  }
  return total;
}

export function rank(points = xp()) {
  let current = RANKS[0], next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i][0]) { current = RANKS[i]; next = RANKS[i + 1] || null; }
  }
  return { title: current[1], floor: current[0], next: next && { title: next[1], at: next[0] } };
}

function commit() {
  save(KEY, state);
  listeners.forEach((fn) => fn());
}

export const onChange = (fn) => listeners.add(fn);

export const isLearned = (id) => !!state.learned[id];
export const isSpotted = (id) => !!state.spotted[id];

export function markLearned(id) {
  if (state.learned[id]) return false;
  state.learned[id] = Date.now();
  commit();
  return true;
}

export function markSpotted(id) {
  if (state.spotted[id]) return false;
  state.spotted[id] = Date.now();
  commit();
  return true;
}

export function recordQuiz(sectorId, score, total) {
  const prev = state.quiz[sectorId] || { best: 0 };
  state.quiz[sectorId] = { best: Math.max(prev.best, score), total, passed: prev.passed || score >= Math.ceil(total * 0.66) };
  commit();
}

export function sectorProgress(sector) {
  const done = sector.items.filter(isLearned).length;
  const quiz = state.quiz[sector.id];
  return { done, total: sector.items.length, complete: done === sector.items.length && !!quiz?.passed, quiz };
}

// The next thing to learn in journey order.
export function nextUp() {
  return JOURNEY.find((j) => !isLearned(j.id)) || null;
}

export function badges() {
  return SECTORS.filter((s) => sectorProgress(s).complete).map((s) => s.id);
}

export function getSettings() {
  return settings;
}
export function setSettings(patch) {
  settings = { ...settings, ...patch };
  save(SETTINGS_KEY, settings);
}

// Take in progress synced from another device (already merged with this one's).
export function replaceProgress(p) {
  state = { ...state, learned: { ...p.learned }, spotted: { ...p.spotted }, quiz: { ...p.quiz } };
  commit();
}

export function resetProgress() {
  state = { learned: {}, spotted: {}, quiz: {}, name: state.name };
  commit();
}
