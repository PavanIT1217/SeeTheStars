// One place to ask "where is this object in my sky right now?" for every kind of object.
import { horizontalFor } from './astro.js';
import { satState } from './iss.js';
import { earthHorizontal } from './earth.js';

// The satellite a position refers to, if any: the ISS ({ iss: true }) or another one ({ sat: 'hubble' }).
export const satOf = (pos) => (pos?.iss ? 'iss' : pos?.sat || null);

// Places on Earth ({ earth: { lat, lon } }): landmarks, towns and storms. They don't rise or set.
export const isEarth = (pos) => !!pos?.earth;

export function locate(pos, observer, date = new Date()) {
  if (isEarth(pos)) return earthHorizontal(pos.earth, observer);
  const sat = satOf(pos);
  if (sat) {
    const s = satState(sat, observer, date);
    return s && { alt: s.alt, az: s.az, km: s.km, iss: s };
  }
  return horizontalFor(pos, observer, date);
}
