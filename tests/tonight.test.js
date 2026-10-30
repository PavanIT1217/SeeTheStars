// The Tonight planner: dark window, highlights and coming-up events.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nightWindow, tonightPlan, meteorShowerNear, conjunctions } from '../js/tonight.js';

const delhi = { lat: 28.6, lon: 77.2 };

test('night starts after sunset and ends before sunrise in Delhi', () => {
  const w = nightWindow(delhi, new Date(Date.UTC(2026, 9, 30, 6))); // 11:30 IST
  const ist = (d) => (d.getTime() / 3600e3 + 5.5) % 24;
  const startIST = ist(w.start), endIST = ist(w.end);
  assert.ok(startIST > 17.5 && startIST < 19, `dusk ${startIST}`);
  assert.ok(endIST > 5 && endIST < 6.5, `dawn ${endIST}`);
  assert.ok(w.dark > w.start);
});

test('there is no night under the midnight sun', () => {
  assert.equal(nightWindow({ lat: 78.2, lon: 15.6 }, new Date(Date.UTC(2026, 5, 21))), null); // Svalbard, June
});

test('the plan has highlights that link to the Sky Finder', () => {
  const p = tonightPlan(delhi, new Date(Date.UTC(2026, 9, 30, 10)));
  assert.ok(p.highlights.length >= 3);
  assert.ok(p.highlights.some((h) => h.key === 'saturn'), 'Saturn is up all evening in late October 2026');
  for (const h of p.highlights) assert.ok(h.title && h.text);
});

test('meteor showers are found near their peak', () => {
  assert.equal(meteorShowerNear(new Date(2026, 7, 11), 3)?.id, 'perseids');
  assert.equal(meteorShowerNear(new Date(2026, 6, 1), 3), null);
});

// Venus and Jupiter pass within half a degree of each other on 9 June 2026 (evening sky).
test('finds the June 2026 Venus–Jupiter conjunction', () => {
  const c = conjunctions(delhi, new Date(Date.UTC(2026, 5, 4)), 10).find((x) => x.key === 'venus-jupiter');
  assert.ok(c, 'not found');
  assert.ok(c.sep < 2, `sep ${c.sep}`);
});

test('reminders cover passes, the Moon and meetups, soonest first, with stable ids', async () => {
  const { buildReminders } = await import('../js/reminders.js');
  const now = new Date(Date.UTC(2026, 9, 30, 6));
  const prefs = { on: true, passes: true, moon: true, showers: true, meetups: true, daily: true };
  const a = buildReminders(delhi, now, prefs, 14), b = buildReminders(delhi, now, prefs, 14);
  assert.ok(a.length >= 3, `${a.length} reminders`);
  assert.deepEqual(a.map((r) => r.id), b.map((r) => r.id));
  assert.equal(new Set(a.map((r) => r.id)).size, a.length);
  for (let i = 1; i < a.length; i++) assert.ok(a[i].at >= a[i - 1].at);
  assert.ok(a.every((r) => r.at > now && r.url.startsWith('/')));
  assert.ok(a.some((r) => r.title.includes('New Moon')));
  assert.ok(a.some((r) => r.title.includes('challenge')));
  const none = buildReminders(delhi, now, { passes: false, moon: false, showers: false, meetups: false, daily: false });
  assert.equal(none.length, 0);
});

test('merging progress from two devices never loses anything', async () => {
  const { mergeProgress } = await import('../js/account.js');
  const phone = { learned: { moon: 5, mars: 9 }, spotted: { moon: 6 }, quiz: { home: { best: 3, total: 5, passed: false } } };
  const laptop = { learned: { mars: 2, saturn: 4 }, spotted: {}, quiz: { home: { best: 4, total: 5, passed: true }, rocky: { best: 1, total: 5, passed: false } } };
  const m = mergeProgress(phone, laptop);
  assert.deepEqual(m.learned, { moon: 5, mars: 2, saturn: 4 });
  assert.deepEqual(m.spotted, { moon: 6 });
  assert.deepEqual(m.quiz.home, { best: 4, total: 5, passed: true });
  assert.ok(m.quiz.rocky);
  assert.deepEqual(mergeProgress(laptop, phone), m);
});
