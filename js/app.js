// The app: routing, rendering the views from views.js, and everything interactive.
import { SECTORS, OBJECTS, JOURNEY, sectorById } from './data/catalog.js';
import * as store from './store.js';
import * as media from './media.js';
import { mountSky } from './sky.js';
import { startStarfield } from './starfield.js';
import { compassName } from './astro.js';
import { predictPasses, refreshTLE, tleAgeDays } from './iss.js';
import {
  url, esc, fmtTime, observer, photo, crumbs, progressBar, rankRing, modeSwitch,
  homeHtml, skyNowHtml, sectorHtml, objectHtml, factsHtml, libraryHtml, libraryItems, pageMeta, artFallback,
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
function applyMode() {
  document.body.classList.toggle('scientist', store.isScientist());
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
    <section class="page-head"><h1>My journey</h1><p>Your progress, badges and settings. Everything is stored on this device only.</p></section>
    <div class="me-grid">
      <section class="panel">
        <div class="rank-card">${rankRing(xp, r)}<div><small>Your rank</small><b>${r.title}</b><small>${r.next ? `${r.next.at - xp} XP to ${r.next.title}` : 'Highest rank reached!'}</small></div></div>
        <div class="stats">
          <div><b>${learned}</b><small>of ${JOURNEY.length} explored</small></div>
          <div><b>${spotted}</b><small>spotted in the sky</small></div>
          <div><b>${store.badges().length}</b><small>of ${SECTORS.length} badges</small></div>
        </div>
      </section>
      <section class="panel" id="settings">
        <h2>How much detail?</h2>
        ${modeSwitch()}
        <p class="fine" style="margin-top:12px">Scientist view adds coordinates and extra data in the Sky Finder and on every object page.</p>
      </section>
      <section class="panel wide">
        <h2>Badges</h2>
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
  view.querySelector('.reset').addEventListener('click', () => {
    if (confirm('Erase all XP, badges and explored items on this device?')) { store.resetProgress(); toast('Progress reset.'); meView(); }
  });
}

function skyView(id) {
  view.innerHTML = '<div class="sky-host"></div>';
  sky = mountSky(view.querySelector('.sky-host'), {
    targetId: id,
    onTarget: (tid) => history.replaceState(null, '', url.sky(tid)),
    onSpotted: (o) => { burst(); rewardToast(store.XP.spot, `Spotted ${o.name}!`); },
  });
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
    case 'sky': skyView(parts[1]); break;
    case 'library': libraryView(params); break;
    case 'me': meView(); break;
    default: notFound();
  }
  applyMeta(tab, parts[1]);
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

applyMode();
updateTopbar();
route();

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
