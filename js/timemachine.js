// Light is a time machine: link the age of an object's light to what was happening on Earth when it set off.

const EVENTS = [
  [57, 'humans first walked on the Moon'],
  [123, 'the Wright brothers made the first aeroplane flight'],
  [245, 'William Herschel discovered the planet Uranus'],
  [339, 'Isaac Newton published his laws of motion and gravity'],
  [417, 'Galileo first turned a telescope to the sky'],
  [534, 'Columbus crossed the Atlantic'],
  [972, 'astronomers in China watched the Crab supernova explode'],
  [1527, 'Aryabhata wrote that the Earth spins'],
  [2266, 'Eratosthenes measured the size of the Earth'],
  [4600, 'the Great Pyramid of Giza was being built'],
  [5200, 'people first invented writing'],
  [12000, 'people first started farming, at the end of the last Ice Age'],
  [45000, 'people painted some of the oldest known cave art'],
  [300000, 'the first modern humans (Homo sapiens) appeared'],
  [2600000, 'early human ancestors made the first stone tools'],
  [7000000, 'our ancestors split from the ancestors of chimpanzees'],
  [66000000, 'an asteroid wiped out the dinosaurs'],
  [230000000, 'the first dinosaurs appeared'],
  [375000000, 'the first fish crawled onto land'],
  [540000000, 'the first animals with shells and eyes spread through the oceans'],
  [2400000000, 'oxygen first built up in Earth’s air'],
  [4600000000, 'the Sun and Earth were forming'],
  [13800000000, 'the universe was very young'],
];

export function formatYears(y) {
  if (y >= 1e9) return `${+(y / 1e9).toFixed(1)} billion`;
  if (y >= 1e6) return `${+(y / 1e6).toFixed(1)} million`;
  return Math.round(y).toLocaleString('en-US');
}

// Returns a sentence like “The light you see left ~2.5 million years ago, around when …”, or null.
export function timeMachine(ly) {
  if (!ly || ly < 1) return null;
  let best = null, bestScore = Infinity;
  for (const [age, text] of EVENTS) {
    const score = Math.abs(Math.log(age / ly));
    if (score < bestScore) { bestScore = score; best = [age, text]; }
  }
  const when = ly < 40 ? `${formatYears(ly)} years ago` : `about ${formatYears(ly)} years ago`;
  if (ly < 40) return `The light reaching you now set off ${when} – maybe before you were born!`;
  if (bestScore > Math.log(1.8)) return `The light reaching you now set off ${when}.`;
  const rel = best[0] > ly * 1.15 ? 'a while after' : best[0] < ly / 1.15 ? 'a while before' : 'around the time';
  return `The light reaching you now set off ${when} – ${rel} ${best[1]}.`;
}
