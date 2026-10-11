// One place to ask "where is this object in my sky right now?" for every kind of object.
import { horizontalFor } from './astro.js';
import { issState } from './iss.js';

export function locate(pos, observer, date = new Date()) {
  if (pos?.iss) {
    const s = issState(observer, date);
    return s && { alt: s.alt, az: s.az, km: s.km, iss: s };
  }
  return horizontalFor(pos, observer, date);
}
