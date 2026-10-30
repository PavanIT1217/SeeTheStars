// Real-sky quests, worked out from the observing log (every lock-on in the Sky Finder) and finished tours.
const PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const CONSTELLATIONS = ['orion', 'ursamajor', 'cassiopeia', 'scorpius', 'crux', 'cygnus'];
const STARS = ['sirius', 'polaris', 'betelgeuse', 'rigel', 'vega', 'proxima'];
const DEEP = ['orionnebula', 'pleiades', 'pillars', 'ringnebula', 'crabnebula', 'andromeda', 'triangulum', 'whirlpool', 'sombrero', 'lmc', 'smc'];

const distinct = (log, test) => new Set(log.map((e) => e.key).filter(test)).size;

export const QUESTS = [
  { id: 'first-light', emoji: '🔭', title: 'First light', desc: 'Lock on to anything in the real sky', need: 1, count: (log) => log.length },
  { id: 'moon', emoji: '🌙', title: 'Moon watcher', desc: 'Find the Moon', need: 1, count: (log) => distinct(log, (k) => k === 'moon') },
  { id: 'planets', emoji: '🪐', title: 'Planet hunter', desc: 'Find 3 different planets', need: 3, count: (log) => distinct(log, (k) => PLANETS.includes(k)) },
  { id: 'constellations', emoji: '✨', title: 'Constellation collector', desc: 'Find 5 different constellations', need: 5, count: (log) => distinct(log, (k) => CONSTELLATIONS.includes(k) || k.startsWith('con-')) },
  { id: 'stars', emoji: '⭐', title: 'Star namer', desc: 'Find 5 different named stars', need: 5, count: (log) => distinct(log, (k) => STARS.includes(k) || k.startsWith('star-')) },
  { id: 'deep', emoji: '🌌', title: 'Deep-sky diver', desc: 'Find 3 nebulae, clusters or galaxies', need: 3, count: (log) => distinct(log, (k) => DEEP.includes(k) || k.startsWith('m-')) },
  { id: 'station', emoji: '🛰', title: 'Space station spotter', desc: 'Catch a space station or Hubble flying over', need: 1, count: (log) => distinct(log, (k) => k === 'iss' || k.startsWith('sat-')) },
  { id: 'nights', emoji: '🦉', title: 'Night owl', desc: 'Go stargazing on 3 different nights', need: 3, count: (log) => new Set(log.map((e) => new Date(e.at - 12 * 3600e3).toDateString())).size },
  { id: 'tours', emoji: '🎧', title: 'Tour guide', desc: 'Finish 2 guided sky tours', need: 2, count: (log, tours) => Object.keys(tours).length },
];

export function questProgress(log = [], tours = {}) {
  return QUESTS.map((q) => {
    const have = Math.min(q.need, q.count(log, tours));
    return { ...q, have, done: have >= q.need };
  });
}
