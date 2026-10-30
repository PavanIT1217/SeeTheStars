// Sky reminders: space stations flying over, full and new Moons, meteor showers, planets meeting up,
// and an optional nightly nudge. Worked out on the device and scheduled as local notifications in the
// iOS/Android apps – nothing is sent to a server. The web version has no reliable scheduling, so it only
// shows how to get them.
import { OBJECTS } from './data/catalog.js';
import { predictPasses, SATELLITES } from './iss.js';
import { compassName, nextMoonPhase } from './astro.js';
import { nightWindow, tonightPlan, meteorShowerNear, conjunctions } from './tonight.js';
import { Capacitor, registerPlugin } from './vendor/capacitor/core.js'; // @capacitor/core, copied from node_modules (MIT)

const MIN = 60e3, HOUR = 3600e3, DAY = 86400e3;
export const REMINDER_KINDS = {
  passes: ['🛰', 'Space stations flying over', 'A heads-up 15 minutes before a bright pass'],
  moon: ['🌕', 'Full and new Moon', 'The evening of each full and new Moon'],
  showers: ['☄', 'Meteor showers', 'The night of the peak'],
  meetups: ['🤝', 'Planets meeting up', 'When the Moon and planets line up'],
  daily: ['✨', 'Tonight’s challenge', 'Every evening at dusk'],
};
export const DEFAULT_PREFS = { on: false, passes: true, moon: true, showers: true, meetups: true, daily: false };

const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const at = (date, h, m = 0) => { const d = new Date(date); d.setHours(h, m, 0, 0); return d; };
// Stable 31-bit ids so rescheduling replaces the same reminder instead of duplicating it.
const idFor = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2147483647; };

// Everything to remind about in the next `days` days, soonest first.
export function buildReminders(observer, now = new Date(), prefs = DEFAULT_PREFS, days = 7) {
  const out = [];
  const add = (key, when, title, body, url) => { if (when > now) out.push({ id: idFor(key), at: when, title, body, url }); };

  if (prefs.passes) {
    for (const id of Object.keys(SATELLITES)) {
      for (const p of predictPasses(observer, now, 72, 10, id)) {
        if (!p.visible || p.maxAlt < 25) continue; // only the easy, bright ones
        const name = SATELLITES[id].short;
        add(`pass-${id}-${p.start.getTime()}`, new Date(p.start - 15 * MIN), `🛰 ${name} flies over at ${fmt(p.start)}`,
          `Look ${compassName(p.startAz).toLowerCase()} – a bright moving dot climbing to ${Math.round(p.maxAlt)}° high.`, id === 'iss' ? '/sky/iss/' : `/sky/sat-${id}/`);
      }
    }
  }
  if (prefs.moon) {
    for (const [angle, title, body] of [[180, '🌕 Full Moon tonight', 'The whole face is lit up – look for the dark “seas”.'], [0, '🌑 New Moon tonight', 'The darkest night of the month – perfect for faint stars.']]) {
      const t = nextMoonPhase(angle, now);
      if (t - now < days * DAY) add(`moon-${angle}-${t.toDateString()}`, at(t, 19), title, body, angle === 180 ? '/sky/moon/' : '/tonight/');
    }
  }
  if (prefs.showers) {
    const m = meteorShowerNear(now, days);
    if (m) add(`shower-${m.id}-${m.peak.getFullYear()}`, at(new Date(m.peak - DAY), 20), `☄ ${m.name} meteor shower tonight`,
      `Up to ${m.zhr} shooting stars an hour. Find a dark spot, lie back and look up – best after midnight.`, '/tonight/');
  }
  if (prefs.meetups) {
    for (const c of conjunctions(observer, now, days)) {
      const names = [c.a, c.b].map((b) => (b === 'moon' ? 'the Moon' : OBJECTS[b].name));
      add(`meet-${c.key}-${c.time.toDateString()}`, new Date(c.time - 30 * MIN), `🤝 ${names[0][0].toUpperCase()}${names[0].slice(1)} meets ${names[1]} tonight`,
        `Only ${c.sep.toFixed(1)}° apart in the ${compassName(c.az).toLowerCase()} – easy to spot without a telescope.`, `/sky/${c.b}/`);
    }
  }
  if (prefs.daily) {
    // A different journey object each night where possible (satellites have their own reminders).
    const used = new Set();
    for (let d = 0; d < days; d++) {
      const day = new Date(now.getTime() + d * DAY);
      const win = nightWindow(observer, at(day, 12));
      if (!win) continue;
      const options = tonightPlan(observer, win.start).highlights.filter((h) => h.key && OBJECTS[h.key] && !OBJECTS[h.key].pos?.iss);
      const top = options.find((h) => !used.has(h.key)) || options[0];
      if (top) used.add(top.key);
      if (top) add(`daily-${win.start.toDateString()}`, new Date(win.start.getTime() + 20 * MIN), '✨ Tonight’s challenge', `Can you find ${OBJECTS[top.key].name}? ${top.text}`, `/sky/${top.key}/`);
    }
  }
  return out.sort((a, b) => a.at - b.at).slice(0, 48); // iOS keeps at most 64 pending
}

// ───────────── native scheduling (iOS/Android apps only) ─────────────
let ln = null;
const plugin = () => (Capacitor.isNativePlatform() ? (ln ??= registerPlugin('LocalNotifications')) : null);
export const remindersAvailable = () => !!plugin();

export async function requestReminderPermission() {
  const ln = plugin();
  if (!ln) return false;
  const p = await ln.requestPermissions();
  return p.display === 'granted';
}

export async function scheduleReminders(observer, prefs) {
  const ln = plugin();
  if (!ln) return 0;
  const pending = await ln.getPending();
  if (pending.notifications.length) await ln.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  if (!prefs.on) return 0;
  const list = buildReminders(observer, new Date(), prefs);
  if (list.length) {
    await ln.schedule({
      notifications: list.map((r) => ({ id: r.id, title: r.title, body: r.body, schedule: { at: r.at, allowWhileIdle: true }, isExactNotification: false, extra: { url: r.url } })), // inexact: reminders fire early on purpose
    });
  }
  return list.length;
}

// Tapping a reminder opens the right page.
export function onReminderTap(open) {
  plugin()?.addListener('localNotificationActionPerformed', (e) => { const url = e.notification?.extra?.url; if (url) open(url); });
}
