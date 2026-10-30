// The app: routing, rendering the views from views.js, and everything interactive.
import { SECTORS, OBJECTS, JOURNEY, sectorById } from './data/catalog.js';
import * as store from './store.js';
import * as media from './media.js';
import { mountSky } from './sky.js';
import { startStarfield } from './starfield.js';
import { compassName } from './astro.js';
import { predictPasses, refreshTLE, refreshAllTLE, tleAgeDays } from './iss.js';
import { DEFAULT_PREFS, remindersAvailable, requestReminderPermission, scheduleReminders, onReminderTap } from './reminders.js';
import * as account from './account.js';
import * as classroom from './classroom.js';
import { t, setLanguage, deviceLanguage } from './i18n.js';
import { fetchForecast, stargazingScore } from './conditions.js';
import { unlocked } from './pro.js';
import { updateWidget } from './widget.js';
import {
  url, esc, fmtTime, observer, photo, crumbs, progressBar, rankRing, modeSwitch,
  homeHtml, skyNowHtml, sectorHtml, objectHtml, factsHtml, libraryHtml, libraryItems, pageMeta, artFallback, tonightHtml, remindersHtml, accountHtml,
  classroomHtml, teacherHtml, worksheetHtml, classJoinHtml, languageHtml, conditionsHtml,
} from './views.js';

window.fillArt = artFallback; // called by photos that fail to load

let liveTimer = 0;
const fmtDay = (d) => (d.toDateString() === new Date().toDateString() ? 'Today' : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }));

const view = document.getElementById('view');
const starfield = startStarfield(document.getElementById('starfield'));
let sky = null;

// ───────────────────────── helpers ─────────────────────────
function toast(html, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3200);
}

function burst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
  const host = document.getElementById('fx');
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('i');
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120;
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--h:${[200, 40, 300, 260][i % 4]}`;
    host.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

function rewardToast(points, label) {
  const before = store.rank(store.xp() - points);
  const after = store.rank();
  toast(`<b>+${points} XP</b> ${label}`, 'xp');
  if (after.title !== before.title) {
    setTimeout(() => {
      burst();
      toast(`<span class="hud-label">New rank</span><b>${after.title}</b>`, 'rank');
    }, 600);
  }
}

// Explorer (default) keeps screens simple; Scientist shows all the data.
// Translate the page frame (navigation and footer) that lives in template.html.
function applyLanguage() {
  setLanguage(store.getSettings().lang || deviceLanguage());
  document.querySelectorAll('.topnav a, .tabbar a span, .footer-links a').forEach((el) => {
    el.dataset.en ??= el.textContent;
    el.textContent = t(el.dataset.en);
  });
}

function applyMode() {
  document.body.classList.toggle('scientist', store.isScientist());
  document.documentElement.classList.toggle('night', !!store.getSettings().night);
}

function bindModeSwitch(root) {
  root.querySelectorAll('.segmented [data-mode]').forEach((b) => b.addEventListener('click', () => {
    store.setSettings({ mode: b.dataset.mode });
    applyMode();
    root.querySelectorAll('.segmented [data-mode]').forEach((x) => {
      x.classList.toggle('on', x === b);
      x.setAttribute('aria-checked', String(x === b));
    });
    toast(b.dataset.mode === 'scientist' ? '🔬 Scientist view: all the data is shown' : '🧑‍🚀 Explorer view: nice and simple');
  }));
}

function updateTopbar() {
  const xp = store.xp();
  document.getElementById('xp-chip').innerHTML = `<span class="star">★</span><b>${xp} XP</b><small>${store.rank(xp).title}</small>`;
}
store.onChange(updateTopbar);

// Keep the title, description and canonical link right as the explorer moves around.
function applyMeta(route, id) {
  const m = pageMeta(route, id);
  document.title = m.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', m.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://seethestars.webappslab.com${m.path}`);
}

// ───────────────────────── views ─────────────────────────
function homeView() {
  view.innerHTML = homeHtml();
}

function sectorView(id) {
  const s = sectorById(id);
  if (!s) return notFound();
  view.innerHTML = sectorHtml(s);
  view.querySelector('.dl-sector').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (!navigator.onLine) return toast('You’re offline – connect to download.');
    btn.disabled = true;
    const { failed } = await media.saveMany(s.items, (d, t) => { btn.textContent = `Downloading ${d}/${t}…`; });
    sectorView(id);
    toast(failed ? 'Some items could not be downloaded.' : `${s.title} saved for offline`);
  });
}

function objectView(id) {
  const o = OBJECTS[id];
  if (!o) return notFound();
  const s = sectorById(o.sector);
  view.innerHTML = objectHtml(o);

  const factsBox = view.querySelector('.facts');
  if (o.pos?.iss) {
    const renderPasses = () => {
      const list = predictPasses(observer(), new Date(), 72).filter((p) => p.visible).slice(0, 5);
      const age = tleAgeDays();
      view.querySelector('.passes').innerHTML = `<h3>🛰️ When can I see it from here?</h3>
        ${list.length ? `<ol class="pass-list">${list.map((p) => `<li><b>${fmtDay(p.start)} · ${fmtTime(p.start)}</b><span>Up to ${Math.round(p.maxAlt)}° high · appears in the ${compassName(p.startAz)}, leaves to the ${compassName(p.endAz)} · ${Math.max(1, Math.round((p.end - p.start) / 60000))} min</span></li>`).join('')}</ol>`
          : '<p>No easy-to-see passes in the next 3 days from your location. Check again soon – it changes every day!</p>'}
        <p>${observer().approx ? 'Using an approximate location – open the Sky Finder once to use your exact position. ' : ''}${age > 7 ? `Orbit data is ${Math.round(age)} days old – connect to the internet to update it.` : 'Times are for your location and time zone.'}</p>`;
    };
    renderPasses();
    liveTimer = setInterval(() => { factsBox.innerHTML = factsHtml(o); }, 2000);
    refreshTLE().then((fresh) => { if (fresh && view.contains(factsBox)) renderPasses(); });
  }

  view.querySelector('.reveal').addEventListener('click', (e) => { e.currentTarget.hidden = true; view.querySelector('.wonder .a').hidden = false; });

  view.querySelector('.learn').addEventListener('click', (e) => {
    if (!store.markLearned(id)) return;
    const b = e.currentTarget;
    b.className = 'btn done learn';
    b.textContent = '✓ Explored';
    const r = b.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    rewardToast(store.XP.learn, o.name);
    const sp = store.sectorProgress(s);
    if (sp.done === sp.total && !sp.quiz) setTimeout(() => toast(`${s.title} challenge unlocked! <a href="${url.quiz(s.id)}">Take it →</a>`, 'rank'), 900);
    view.querySelector('.pager .next')?.classList.add('glow');
  });

  view.querySelector('.save').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    if (media.isSaved(id)) {
      await media.removeOffline(id);
      b.textContent = '⤓ Save offline';
      toast(`Removed ${o.name} from offline`);
      return;
    }
    if (!navigator.onLine) return toast('You’re offline – connect to download.');
    b.disabled = true;
    b.textContent = 'Downloading…';
    try {
      const bytes = await media.saveForOffline(o);
      b.textContent = '✓ Saved offline';
      toast(`Saved ${o.name} for offline (${media.formatBytes(bytes)}) – tap again to remove`);
    } catch {
      b.textContent = '⤓ Save offline';
      toast('Download failed – try again later.');
    }
    b.disabled = false;
  });

  media.getMedia(o).then((m) => {
    if (!m || !view.contains(factsBox)) return;
    if (m.image && media.isSaved(id)) {
      // The saved copy on the device, so the photo shows even offline.
      const box = view.querySelector('.obj-photo');
      box.querySelector('.ph-art')?.remove();
      const img = box.querySelector('img') || box.appendChild(document.createElement('img'));
      img.onload = () => img.classList.add('in');
      img.src = m.image;
    }
    if (m.extract) {
      const enc = view.querySelector('.encyclopedia');
      enc.hidden = false;
      enc.querySelector('.extract').textContent = m.extract;
      if (m.url) enc.querySelector('.more').href = m.url; else enc.querySelector('.more').remove();
    }
  });
}

function quizView(id) {
  const s = sectorById(id);
  if (!s) return notFound();
  let i = 0, score = 0;

  function render() {
    if (i >= s.quiz.length) return finish();
    const q = s.quiz[i];
    view.innerHTML = `
      ${crumbs([['Explore', url.home], [s.title, url.sector(s.id)], ['Challenge']])}
      <section class="quiz" style="--hue:${s.hue}">
        <span class="eyebrow">${s.title} challenge · Question ${i + 1} of ${s.quiz.length}</span>
        <div class="row" style="margin-top:12px">${progressBar(i / s.quiz.length)}</div>
        <h1 class="q">${q.q}</h1>
        <div class="options">${q.options.map((op, k) => `<button class="opt" data-k="${k}"><span class="mono">${'ABCD'[k]}</span>${op}</button>`).join('')}</div>
        <div class="why" hidden></div>
        <button class="btn primary nextq" hidden>${i === s.quiz.length - 1 ? 'See my score' : 'Next question →'}</button>
      </section>`;
    view.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.k;
      view.querySelectorAll('.opt').forEach((x) => { x.disabled = true; if (+x.dataset.k === q.answer) x.classList.add('right'); });
      if (k === q.answer) score++; else b.classList.add('wrong');
      const why = view.querySelector('.why');
      why.hidden = false;
      why.innerHTML = `<b>${k === q.answer ? 'Correct!' : 'Not quite.'}</b> ${q.why}`;
      view.querySelector('.nextq').hidden = false;
    }));
    view.querySelector('.nextq').addEventListener('click', () => { i++; render(); });
  }

  function finish() {
    const before = store.xp();
    const hadBadge = store.sectorProgress(s).complete;
    store.recordQuiz(s.id, score, s.quiz.length);
    const gained = store.xp() - before;
    const p = store.sectorProgress(s);
    const nextSector = SECTORS[SECTORS.indexOf(s) + 1];
    view.innerHTML = `
      <section class="quiz-result" style="--hue:${s.hue}">
        <span class="eyebrow">Challenge complete</span>
        <div class="score">${score}<small>/${s.quiz.length}</small></div>
        ${p.complete ? `<div class="badge"><span class="badge-icon">★</span><div><span class="hud-label">Badge earned</span><b style="display:block">${s.title}</b></div></div>` : '<p class="dim">Score 2 or more to earn the sector badge. Have another look and try again!</p>'}
        ${gained ? `<p class="dim">+${gained} XP</p>` : ''}
        <div class="btn-row">
          <a class="btn" href="${url.quiz(s.id)}" data-reload>Try again</a>
          ${nextSector ? `<a class="btn primary" href="${url.sector(nextSector.id)}">Next: ${nextSector.title} →</a>` : `<a class="btn primary" href="${url.sky()}">Explore the real sky →</a>`}
        </div>
      </section>`;
    if (p.complete && !hadBadge) { burst(); setTimeout(burst, 300); }
    if (gained) rewardToast(gained, 'challenge');
  }
  render();
}

function libraryView(params) {
  let cat = params.get('c') || 'All';
  let q = '';
  view.innerHTML = libraryHtml(cat);
  const list = view.querySelector('.lib-list');
  const render = () => { list.innerHTML = libraryItems(cat, q); };
  view.querySelector('.search').addEventListener('input', (e) => { q = e.target.value; render(); });
  view.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
    cat = c.dataset.c;
    view.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
    render();
  }));
}

async function meView() {
  const xp = store.xp();
  const r = store.rank(xp);
  const learned = Object.keys(store.progress().learned).length;
  const spotted = Object.keys(store.progress().spotted).length;
  const ids = Object.keys(media.savedIndex()).filter((id) => OBJECTS[id]);
  let est = null;
  try { est = await navigator.storage?.estimate?.(); } catch { /* ignore */ }
  view.innerHTML = `
    <section class="page-head"><h1>My journey</h1><p>Your progress, badges and settings. Everything stays on this device unless a grown-up backs it up below.</p></section>
    <div class="me-grid">
      <section class="panel">
        <div class="rank-card">${rankRing(xp, r)}<div><small>Your rank</small><b>${r.title}</b><small>${r.next ? `${r.next.at - xp} XP to ${r.next.title}` : 'Highest rank reached!'}</small></div></div>
        <div class="stats">
          <div><b>${learned}</b><small>of ${JOURNEY.length} explored</small></div>
          <div><b>${spotted}</b><small>spotted in the sky</small></div>
          <div><b>${store.badges().length}</b><small>of ${SECTORS.length} badges</small></div>
        </div>
      </section>
      <section class="panel class-join-box"></section>
      <section class="panel acct" id="account">${accountHtml(me, { providers: account.PROVIDERS, status: syncStatus })}</section>
      <section class="panel" id="settings">
        <h2>${t('How much detail?')}</h2>
        ${modeSwitch()}
        <p class="fine" style="margin-top:12px">Scientist view adds coordinates and extra data in the Sky Finder and on every object page.</p>
        ${remindersHtml().replace('class="panel remind"', 'class="remind nested"')}
        ${languageHtml()}
        <label class="switch-row"><span><b>${t('Red night mode')}</b><small>${t('Turns the screen red so your eyes stay used to the dark.')}</small></span><input type="checkbox" class="night-toggle" ${store.getSettings().night ? 'checked' : ''}></label>
      </section>
      <section class="panel wide">
        <h2>${t('Real-sky quests')}</h2>
        <div class="quest-grid">${store.quests().map((q) => `<div class="quest ${q.done ? 'done' : ''}"><span class="quest-emoji">${q.emoji}</span><div><b>${q.title}</b><small>${q.desc}</small>${progressBar(q.have / q.need)}<small>${q.done ? `✓ Done · +${store.XP.quest} XP` : `${q.have} of ${q.need}`}</small></div></div>`).join('')}</div>
      </section>
      <section class="panel wide">
        <h2>${t('Observing log')}</h2>
        ${store.progress().log.length ? `<ol class="obs-log">${[...store.progress().log].reverse().slice(0, 30).map((e) => `<li><a href="${url.sky(e.key)}">${esc(e.name)}</a><time>${new Date(e.at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></li>`).join('')}</ol>` : `<p class="fine">Everything you find in the real sky with the Sky Finder is written here. <a href="${url.sky()}">Start with a guided tour →</a></p>`}
      </section>
      <section class="panel wide">
        <h2>${t('Badges')}</h2>
        <div class="badge-grid">${SECTORS.map((s) => `<a class="badge-item ${store.sectorProgress(s).complete ? 'on' : 'off'}" href="${url.sector(s.id)}">${photo(OBJECTS[s.cover])}<span>${s.title}</span></a>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>Offline</h2>
        <p>Lessons, quizzes, drawings and the Sky Finder always work offline. Photos and encyclopedia texts are kept only for what you save.</p>
        <p class="fine" style="margin-top:8px">${ids.length} saved · ${media.formatBytes(media.savedBytes())}${est?.quota ? ` · ${media.formatBytes(est.quota - est.usage)} free on this device` : ''}</p>
        <div class="btn-row" style="margin-top:14px"><button class="btn small dl-all">⤓ Save everything</button>${ids.length ? '<button class="btn small ghost clear-all">Remove all</button>' : ''}</div>
        <div class="saved-list">${ids.map((id) => `<div class="saved-row">${photo(OBJECTS[id])}<a href="${url.object(id)}">${OBJECTS[id].name}</a><button class="rm" data-id="${id}" aria-label="Remove ${esc(OBJECTS[id].name)}">✕</button></div>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>Start over</h2>
        <p>Erase your XP, badges and explored items on this device.</p>
        <button class="btn small ghost reset" style="margin-top:14px">Reset my progress</button>
        <p class="fine" style="margin-top:14px"><a href="https://seethestars.webappslab.com/privacy.html" target="_blank" rel="noopener">Privacy policy</a> · No accounts, no ads, no tracking.</p>
      </section>
    </div>`;
  bindModeSwitch(view);
  view.querySelectorAll('.rm').forEach((b) => b.addEventListener('click', async () => { await media.removeOffline(b.dataset.id); meView(); }));
  view.querySelector('.clear-all')?.addEventListener('click', async () => { for (const id of ids) await media.removeOffline(id); meView(); });
  view.querySelector('.dl-all').addEventListener('click', async (e) => {
    if (!navigator.onLine) return toast('You’re offline – connect to download.');
    const b = e.currentTarget;
    b.disabled = true;
    await media.saveMany(JOURNEY.map((jj) => jj.id), (d, t) => { b.textContent = `Downloading ${d}/${t}…`; });
    meView();
  });
  bindClassJoin(view.querySelector('.class-join-box'));
  bindAccount(view.querySelector('.acct'));
  bindReminders(view);
  view.querySelector('.lang-select').addEventListener('change', (e) => { store.setSettings({ lang: e.target.value }); applyLanguage(); meView(); });
  view.querySelector('.night-toggle').addEventListener('change', (e) => { store.setSettings({ night: e.target.checked }); applyMode(); });
  view.querySelector('.reset').addEventListener('click', () => {
    if (confirm('Erase all XP, badges and explored items on this device?')) { store.resetProgress(); toast('Progress reset.'); meView(); }
  });
}

function skyView(id, params) {
  view.innerHTML = '<div class="sky-host"></div>';
  sky = mountSky(view.querySelector('.sky-host'), {
    targetId: id,
    tourId: params.get('tour'),
    onTarget: (tid) => history.replaceState(null, '', url.sky(tid)),
    onSpotted: (o) => { burst(); rewardToast(store.XP.spot, `Spotted ${o.name}!`); },
    onLogged: (o) => { if (!OBJECTS[o.id]) toast(`📓 Logged <b>${esc(o.name)}</b> in your observing log`); },
    onTourDone: (t) => { if (store.finishTour(t.id)) { burst(); rewardToast(store.XP.tour, `Finished the ${t.title} tour!`); } else toast('Tour finished – great stargazing!'); },
  });
}

// Celebrate quests as they are completed, wherever that happens.
let questsDone = new Set(store.quests().filter((q) => q.done).map((q) => q.id));
store.onChange(() => {
  for (const q of store.quests()) {
    if (q.done && !questsDone.has(q.id)) setTimeout(() => { burst(); rewardToast(store.XP.quest, `Quest complete: ${q.emoji} ${q.title}`); }, 900);
  }
  questsDone = new Set(store.quests().filter((q) => q.done).map((q) => q.id));
});

// ───────────────────────── grown-up account & sync ─────────────────────────
let me = null; // the signed-in account, if any
let syncStatus = '';
let pushTimer = 0, applyingRemote = false;

async function syncNow() {
  if (!me) return;
  try {
    const remote = await account.pullProgress(me.uid);
    const merged = account.mergeProgress(store.progress(), remote || {});
    applyingRemote = true;
    store.replaceProgress(merged);
    applyingRemote = false;
    await account.pushProgress(me.uid, merged);
    syncStatus = `Synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  } catch {
    applyingRemote = false;
    syncStatus = 'Couldn’t sync right now – it will try again when you’re online.';
  }
  renderAccount();
}

// Push a few seconds after progress changes, so a burst of XP is one write.
let classTimer = 0;
store.onChange(() => {
  if (applyingRemote) return;
  if (classroom.myClass()) { clearTimeout(classTimer); classTimer = setTimeout(() => classroom.pushClassProgress().catch(() => {}), 5000); }
  if (!me) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(syncNow, 4000);
});
window.addEventListener('online', () => syncNow());

account.watchAccount((a) => {
  const was = me?.uid;
  me = a && !a.anonymous ? a : null; // a student's anonymous class sign-in is not a grown-up account
  if (a && a.uid !== was) syncNow();
  renderAccount();
});

function renderAccount() {
  if (document.body.dataset.view === 'classroom') renderTeacher();
  const box = document.querySelector('.acct');
  if (!box) return;
  box.innerHTML = accountHtml(me, { providers: account.PROVIDERS, status: syncStatus });
  bindAccount(box);
}

function bindAccount(box) {
  const status = (t) => { box.querySelector('.acct-status').textContent = t; };
  box.querySelector('.acct-start')?.addEventListener('click', (e) => {
    e.target.hidden = true;
    box.querySelector('.acct-gate').hidden = false;
    box.querySelector('.acct-gate-input').focus();
  });
  box.querySelector('.acct-gate-input')?.addEventListener('input', (e) => {
    box.querySelector('.acct-providers').hidden = e.target.value.trim() !== box.querySelector('.acct-gate').dataset.answer;
  });
  box.querySelectorAll('[data-provider]').forEach((b) => b.addEventListener('click', async () => {
    status('Opening sign-in…');
    try {
      me = await account.signIn(b.dataset.provider);
      await syncNow();
      toast('☁️ Progress backed up');
    } catch (err) {
      status(account.isCancelled(err) ? '' : 'Sign-in didn’t work. Check the internet connection and try again.');
    }
  }));
  box.querySelector('.acct-signout')?.addEventListener('click', async () => {
    await account.signOut();
    me = null; syncStatus = '';
    renderAccount();
    toast('Signed out. Progress stays on this device.');
  });
  box.querySelector('.acct-delete')?.addEventListener('click', () => { box.querySelector('.acct-confirm').hidden = false; });
  box.querySelector('.acct-delete-no')?.addEventListener('click', () => { box.querySelector('.acct-confirm').hidden = true; });
  box.querySelector('.acct-delete-yes')?.addEventListener('click', async () => {
    status('Confirm it’s you to delete the account…');
    try {
      await account.deleteAccount();
      me = null; syncStatus = '';
      renderAccount();
      toast('Account deleted.');
    } catch (err) {
      status(account.isCancelled(err) ? '' : 'Couldn’t delete the account right now. Please try again.');
    }
  });
}

// ───────────────────────── classroom ─────────────────────────
let teacherState = { classes: [], rosters: {}, status: '' };
async function loadTeacher() {
  if (!me) return renderTeacher();
  try {
    teacherState.classes = await classroom.myClasses();
    renderTeacher();
    await Promise.all(teacherState.classes.map(async (c) => { teacherState.rosters[c.code] = await classroom.roster(c.code); }));
  } catch { teacherState.status = 'Couldn’t load your classes – check the internet connection.'; }
  renderTeacher();
}
function renderTeacher() {
  const box = view.querySelector('.teacher');
  if (!box) return;
  box.innerHTML = teacherHtml({ account: me, ...teacherState });
  box.querySelector('.class-new')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    teacherState.status = 'Creating…'; renderTeacher();
    try {
      const code = await classroom.createClass(new FormData(e.target).get('name'));
      teacherState.status = `Class created. Share the code ${code} with your students.`;
      await loadTeacher();
    } catch { teacherState.status = 'Couldn’t create the class. Please try again.'; renderTeacher(); }
  });
  box.querySelectorAll('.class-card').forEach((card) => {
    const code = card.dataset.code;
    card.querySelector('.class-refresh').addEventListener('click', async () => { teacherState.rosters[code] = await classroom.roster(code); renderTeacher(); });
    card.querySelector('.class-delete').addEventListener('click', async (e) => {
      if (e.target.dataset.sure !== '1') { e.target.dataset.sure = '1'; e.target.textContent = 'Tap again to delete'; return; }
      await classroom.deleteClass(code);
      teacherState.status = `Class ${code} deleted.`;
      await loadTeacher();
    });
    card.querySelectorAll('.class-remove').forEach((b) => b.addEventListener('click', async () => {
      await classroom.removeMember(code, b.dataset.uid);
      teacherState.rosters[code] = await classroom.roster(code); renderTeacher();
    }));
  });
}
function classroomView(sub, id) {
  if (!unlocked('classroom')) { notFound(); return; }
  if (sub === 'worksheet' && sectorById(id)) { view.innerHTML = worksheetHtml(sectorById(id)); return; }
  view.innerHTML = classroomHtml();
  teacherState.status = '';
  loadTeacher();
}

function bindClassJoin(box, status = '') {
  if (!box) return;
  box.innerHTML = classJoinHtml(classroom.myClass(), status);
  box.querySelector('.class-join')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    box.querySelector('.class-join-status').textContent = 'Joining…';
    try {
      const c = await classroom.joinClass(f.get('code'), f.get('nick'));
      toast(`🏫 You joined ${esc(c.name)}!`);
      bindClassJoin(box);
    } catch (err) {
      bindClassJoin(box, err.code === 'no-class' || /code/.test(err.message) ? err.message : 'Couldn’t join right now – check the internet connection.');
    }
  });
  box.querySelector('.class-leave')?.addEventListener('click', async () => { await classroom.leaveClass(); bindClassJoin(box, 'You left the class.'); });
}

// ───────────────────────── reminders ─────────────────────────
const reminderPrefs = () => ({ ...DEFAULT_PREFS, ...store.getSettings().reminders });
let lastScheduled = 0;
async function rescheduleReminders(force = false) {
  if (!remindersAvailable() || (!force && Date.now() - lastScheduled < 6 * 3600e3)) return null;
  lastScheduled = Date.now();
  await refreshAllTLE();
  try { return await scheduleReminders(observer(), reminderPrefs()); } catch { return null; }
}

function bindReminders(root) {
  const box = root.querySelector('.remind');
  if (!box) return;
  box.querySelectorAll('[data-remind]').forEach((input) => input.addEventListener('change', async () => {
    const key = input.dataset.remind;
    if (key === 'on' && input.checked && !(await requestReminderPermission())) {
      input.checked = false;
      box.querySelector('.remind-status').textContent = 'Notifications are switched off for See the Stars – turn them on in your phone’s Settings first.';
      return;
    }
    store.setSettings({ reminders: { ...reminderPrefs(), [key]: input.checked } });
    box.querySelector('.remind-kinds').hidden = !reminderPrefs().on;
    const n = await rescheduleReminders(true);
    box.querySelector('.remind-status').textContent = reminderPrefs().on ? `${n || 0} reminder${n === 1 ? '' : 's'} set for the coming week.` : 'Reminders are off.';
  }));
}

function showConditions() {
  const box = view.querySelector('.tn-cond');
  if (!box || !navigator.onLine) return;
  const obs = observer();
  fetchForecast(obs).then((hours) => {
    const c = stargazingScore(hours, obs);
    if (!c || document.body.dataset.view !== 'tonight') return;
    box.innerHTML = conditionsHtml(c);
    box.hidden = false;
  }).catch(() => {}); // no forecast offline – the rest of the page still works
}

function tonightView() {
  view.innerHTML = tonightHtml();
  showConditions();
  bindReminders(view);
  // Satellite orbits change; refresh them and redraw if the plan used stale ones.
  refreshAllTLE().then((fresh) => { if (fresh && document.body.dataset.view === 'tonight') { view.innerHTML = tonightHtml(); showConditions(); bindReminders(view); } });
}

function notFound() {
  view.innerHTML = `<section class="page-head"><h1>Lost in space</h1><p>That page drifted away. <a href="${url.home}">Back to Explore</a></p></section>`;
}

// ───────────────────────── router ─────────────────────────
// Real paths (/object/saturn/) so every page can be found by search engines; each one also exists
// as a pre-rendered HTML file. Old #/ links are upgraded.
function route() {
  clearInterval(liveTimer);
  sky?.destroy();
  sky = null;
  const parts = location.pathname.split('/').filter(Boolean);
  const params = new URLSearchParams(location.search);
  let tab = parts[0] || 'home';
  if (tab === 'saved') tab = 'me';
  if (tab === 'index.html') tab = 'home';
  document.body.dataset.view = tab;
  starfield.pause(tab === 'sky');
  const navTab = ['sector', 'object', 'quiz'].includes(tab) ? 'home' : tab;
  document.querySelectorAll('[data-tab]').forEach((a) => a.classList.toggle('on', a.dataset.tab === navTab));
  switch (tab) {
    case 'home': homeView(); break;
    case 'sector': sectorView(parts[1]); break;
    case 'object': objectView(parts[1]); break;
    case 'quiz': quizView(parts[1]); break;
    case 'sky': skyView(parts[1], params); break;
    case 'tonight': tonightView(); break;
    case 'classroom': classroomView(parts[1], parts[2]); break;
    case 'library': libraryView(params); break;
    case 'me': meView(); break;
    default: notFound();
  }
  applyMeta(tab, tab === 'classroom' ? parts[2] : parts[1]);
  if (location.hash.length > 1) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
  else if (tab !== 'sky') window.scrollTo(0, 0);
}

function navigate(href) {
  history.pushState(null, '', href);
  route();
}

// Handle clicks on our own links inside the page instead of reloading.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
  const dest = new URL(a.href, location.href);
  if (dest.origin !== location.origin || /\.(html|xml|txt|png|svg|json)$/.test(dest.pathname)) return;
  e.preventDefault();
  if (dest.pathname === location.pathname && dest.search === location.search && dest.hash && !a.hasAttribute('data-reload')) {
    document.getElementById(dest.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', dest.hash);
    return;
  }
  navigate(dest.pathname + dest.search + dest.hash);
});
window.addEventListener('popstate', route);

// Links from older versions looked like /#/object/saturn.
if (location.hash.startsWith('#/')) {
  const old = location.hash.slice(2).replace(/\/?$/, '/');
  history.replaceState(null, '', old === '/' ? '/' : `/${old}`);
}

applyLanguage();
applyMode();
updateTopbar();
route();

// Keep the week of reminders topped up (passes shift as orbits change), and open the page a reminder points to.
onReminderTap((href) => navigate(href));
rescheduleReminders();
updateWidget(observer());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { rescheduleReminders(); updateWidget(observer()); } });

// The home page's "in your sky right now" depends on the time, so refresh it every few minutes.
setInterval(() => {
  const box = document.body.dataset.view === 'home' && view.querySelector('.sky-now-section');
  if (box) box.innerHTML = skyNowHtml();
}, 5 * 60 * 1000);

// Offline indicator + service worker (installable, works without internet).
function netStatus() { document.body.classList.toggle('offline', !navigator.onLine); }
window.addEventListener('online', netStatus);
window.addEventListener('offline', netStatus);
netStatus();
const isNativeApp = !!window.Capacitor?.isNativePlatform?.(); // the iOS/Android apps bundle every file already
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !isNativeApp) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
