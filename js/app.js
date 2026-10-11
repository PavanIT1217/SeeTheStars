import { SECTORS, OBJECTS, JOURNEY, sectorById } from './data/catalog.js';
import { artSVG } from './art.js';
import * as store from './store.js';
import * as media from './media.js';
import { mountSky } from './sky.js';
import { startStarfield } from './starfield.js';
import { horizontalFor, formatRA, formatDec, lightTime, compassName, julianDate, skyPosition, KM_PER_AU } from './astro.js';
import { timeMachine, formatYears } from './timemachine.js';

const view = document.getElementById('view');
const starfield = startStarfield(document.getElementById('starfield'));
let sky = null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--h:${[190, 45, 300, 260][i % 4]}`;
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
      toast(`<span class="hud-label">RANK UP</span><b>${after.title}</b>`, 'rank');
    }, 600);
  }
}

function category(o) {
  const t = o.art?.type;
  if (o.id === 'moon') return 'Moons';
  if (t === 'planet' || t === 'earth') return o.sector === 'dwarfs' ? 'Dwarf planets' : 'Planets';
  return { star: 'Stars', constellation: 'Constellations', nebula: 'Nebulae', ring: 'Nebulae', cluster: 'Star clusters', pulsar: 'Pulsars', blackhole: 'Black holes', galaxy: 'Galaxies', cosmos: 'Cosmology' }[t] || 'Other';
}

function observer() {
  const loc = store.getSettings().location;
  if (loc) return loc;
  return { lat: 30, lon: Math.max(-180, Math.min(180, (-new Date().getTimezoneOffset() / 60) * 15)), approx: true };
}

function objCard(o, idx) {
  const learned = store.isLearned(o.id);
  return `<a class="obj-card glass ${learned ? 'learned' : ''}" href="#/object/${o.id}">
    <div class="obj-art">${artSVG(o)}</div>
    <div class="obj-meta">
      ${idx !== undefined ? `<span class="hud-label">${String(idx + 1).padStart(2, '0')}</span>` : ''}
      <b>${o.name}</b><small>${o.kind}</small>
    </div>
    <div class="obj-status">${learned ? '<span class="tick" title="Learned">✓</span>' : ''}${store.isSpotted(o.id) ? '<span class="spot" title="Spotted in the sky">✦</span>' : ''}${media.isSaved(o.id) ? '<span class="dl" title="Saved offline">⤓</span>' : ''}</div>
  </a>`;
}

function progressBar(frac) {
  return `<div class="bar"><span style="width:${Math.round(frac * 100)}%"></span></div>`;
}

function updateTopbar() {
  const xp = store.xp();
  const r = store.rank(xp);
  document.getElementById('xp-chip').innerHTML = `<span class="hud-label">${r.title}</span><b>${xp} XP</b>`;
}
store.onChange(updateTopbar);

// ───────────────────────── views ─────────────────────────
function homeView() {
  const xp = store.xp();
  const r = store.rank(xp);
  const learned = Object.keys(store.progress().learned).length;
  const spotted = Object.keys(store.progress().spotted).length;
  const next = store.nextUp();
  const nextObj = next && OBJECTS[next.id];
  const nextSector = next && sectorById(next.sector);
  const recommended = SECTORS.find((s) => !store.sectorProgress(s).complete);

  view.innerHTML = `
    <section class="hero">
      <div class="hud-label">MISSION CONTROL · ${new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <h1 class="title">See the <span>Universe</span></h1>
      <p class="lead">Ten sectors. Forty-nine wonders. From the ground under your feet to the edge of the observable universe – explore them in order, and point your phone to find each one in the real sky.</p>
      <div class="rank-card glass">
        <div class="rank-ring" style="--p:${r.next ? (xp - r.floor) / (r.next.at - r.floor) : 1}"><span>${xp}</span><small>XP</small></div>
        <div class="rank-info">
          <span class="hud-label">CURRENT RANK</span>
          <b>${r.title}</b>
          <small>${r.next ? `${r.next.at - xp} XP to <i>${r.next.title}</i>` : 'Highest rank reached!'}</small>
          <div class="stats"><span><b>${learned}</b>/${JOURNEY.length} learned</span><span><b>${spotted}</b> spotted</span><span><b>${store.badges().length}</b>/10 badges</span></div>
        </div>
      </div>
      ${nextObj ? `
      <a class="continue glass" href="#/object/${nextObj.id}">
        <div class="obj-art big">${artSVG(nextObj)}</div>
        <div><span class="hud-label">${learned ? 'CONTINUE YOUR JOURNEY' : 'BEGIN YOUR JOURNEY'} · SECTOR ${nextSector.code}</span><b>${nextObj.name}</b><small>${nextObj.kind}</small></div>
        <span class="go">→</span>
      </a>` : `<div class="continue glass"><div><span class="hud-label">JOURNEY COMPLETE</span><b>You have explored every wonder!</b><small>Now try to spot them all in the real sky.</small></div></div>`}
    </section>

    <section>
      <div class="section-head"><span class="hud-label">THE JOURNEY</span><h2>Star map</h2></div>
      <ol class="journey">
        ${SECTORS.map((s) => {
          const p = store.sectorProgress(s);
          const state = p.complete ? 'complete' : s === recommended ? 'current' : p.done ? 'started' : '';
          return `<li class="node ${state}" style="--hue:${s.hue}">
            <span class="dot"></span>
            <a class="sector-card glass" href="#/sector/${s.id}">
              <span class="code">${s.code}</span>
              <div class="sector-body">
                <b>${s.title}</b><small>${s.subtitle}</small>
                ${progressBar(p.done / p.total)}
              </div>
              <span class="sector-state">${p.complete ? '<span class="badge-mini">★</span>' : state === 'current' ? '<span class="hud-label pulse">NEXT</span>' : `${p.done}/${p.total}`}</span>
            </a>
          </li>`;
        }).join('')}
      </ol>
    </section>`;
}

function sectorView(id) {
  const s = sectorById(id);
  if (!s) return notFound();
  const p = store.sectorProgress(s);
  const idx = SECTORS.indexOf(s);
  const quizReady = p.done === p.total;
  view.innerHTML = `
    <a class="back" href="#/">← Star map</a>
    <section class="sector-hero" style="--hue:${s.hue}">
      <div class="hud-label">SECTOR ${s.code} OF 10</div>
      <h1 class="title">${s.title}</h1>
      <p class="sub">${s.subtitle}</p>
      <div class="briefing glass"><span class="hud-label">MISSION BRIEFING</span><p>${s.briefing}</p></div>
      <div class="row">
        ${progressBar(p.done / p.total)}<span class="mono">${p.done}/${p.total}</span>
      </div>
      <button class="btn ghost dl-sector">⤓ Save this sector for offline</button>
    </section>
    <section class="obj-list">${s.items.map((oid, i) => objCard(OBJECTS[oid], i)).join('')}</section>
    <section class="quiz-card glass ${quizReady ? '' : 'locked'}">
      <div><span class="hud-label">SECTOR CHALLENGE</span>
      <b>${quizReady ? 'Ready for the challenge?' : `Learn all ${p.total} to unlock the challenge`}</b>
      <small>${p.quiz ? `Best score: ${p.quiz.best}/${p.quiz.total}${p.quiz.passed ? ' · Badge earned ★' : ''}` : `${s.quiz.length} questions · earn ${store.XP.quizPass} XP and the sector badge`}</small></div>
      ${quizReady ? `<a class="btn primary" href="#/quiz/${s.id}">${p.quiz ? 'Retry' : 'Start'}</a>` : '<span class="lock">🔒</span>'}
    </section>
    <nav class="pager">
      ${idx > 0 ? `<a class="btn ghost" href="#/sector/${SECTORS[idx - 1].id}">← ${SECTORS[idx - 1].title}</a>` : '<span></span>'}
      ${idx < SECTORS.length - 1 ? `<a class="btn ghost" href="#/sector/${SECTORS[idx + 1].id}">${SECTORS[idx + 1].title} →</a>` : ''}
    </nav>`;

  view.querySelector('.dl-sector').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (!navigator.onLine) return toast('You’re offline – connect to download.');
    btn.disabled = true;
    const { failed } = await media.saveMany(s.items, (d, t) => { btn.textContent = `Downloading ${d}/${t}…`; });
    btn.textContent = failed ? `Saved with ${failed} error(s)` : '✓ Saved for offline';
    sectorView(id);
    toast(failed ? 'Some items could not be downloaded.' : `Sector ${s.code} saved for offline`);
  });
}

function liveData(o) {
  const rows = [];
  const obs = observer();
  const now = new Date();
  if (o.pos?.body) {
    const eq = skyPosition(o.pos, julianDate(now));
    const millions = (eq.km / 1e6).toLocaleString('en-US', { maximumFractionDigits: eq.km > 1e9 ? 0 : 1 });
    rows.push(['Distance right now', eq.km > 1e7 ? `${millions} million km` : `${Math.round(eq.km).toLocaleString('en-US')} km`]);
    rows.push(['Light takes', lightTime(eq.km)]);
    if (eq.km > KM_PER_AU * 2) rows.push(['That is', `${(eq.km / KM_PER_AU).toFixed(1)} × Earth–Sun`]);
  } else if (o.ly) {
    rows.push(['Light travel time', `${formatYears(o.ly)} years`]);
  }
  if (o.pos?.ra !== undefined || o.pos?.body) {
    const h = horizontalFor(o.pos, obs, now);
    rows.push(['RA / Dec', `${formatRA(h.ra)} · ${formatDec(h.dec)}`]);
    rows.push([`From you now${obs.approx ? '*' : ''}`, h.alt >= 0 ? `${h.alt.toFixed(0)}° up, towards the ${compassName(h.az)}` : `${(-h.alt).toFixed(0)}° below the horizon (${compassName(h.az)})`]);
  }
  if (o.pos?.everywhere) rows.push(['Direction', 'Every direction at once']);
  if (o.pos?.down) rows.push(['Direction', 'Straight down – under your feet']);
  return rows;
}

function objectView(id) {
  const o = OBJECTS[id];
  if (!o) return notFound();
  const s = sectorById(o.sector);
  const j = JOURNEY.findIndex((x) => x.id === id);
  const prev = JOURNEY[j - 1], next = JOURNEY[j + 1];
  const learned = store.isLearned(id);
  const tm = timeMachine(o.ly);
  const live = liveData(o);

  view.innerHTML = `
    <a class="back" href="#/sector/${s.id}">← Sector ${s.code} · ${s.title}</a>
    <article class="object" style="--hue:${s.hue}">
      <div class="obj-hero">
        <div class="obj-hero-art">${artSVG(o, 'hero-art')}</div>
        <img class="obj-photo" alt="" hidden>
        <div class="scanline"></div>
        <span class="photo-credit" hidden>Photo via Wikipedia</span>
      </div>
      <header class="obj-head">
        <div class="hud-label">${esc(category(o).toUpperCase())} · ${String(j + 1).padStart(2, '0')}/${JOURNEY.length}</div>
        <h1 class="title">${o.name}</h1>
        <p class="sub">${o.kind}</p>
      </header>

      <div class="data-panel glass">
        ${o.facts.map(([k, v]) => `<div><span class="hud-label">${k}</span><b>${v}</b></div>`).join('')}
        ${live.map(([k, v]) => `<div class="live"><span class="hud-label">${k}</span><b>${v}</b></div>`).join('')}
      </div>
      ${observer().approx && live.some(([k]) => k.endsWith('*')) ? '<p class="fine">* Using an approximate location – open the Sky Finder to use your exact position.</p>' : ''}

      ${o.pos && !o.pos.everywhere ? `<a class="btn primary locate" href="#/sky/${o.id}">◎ Find it in the sky${o.pointLabel ? ` (${o.pointLabel})` : ''}</a>` : `<a class="btn primary locate" href="#/sky/${o.id}">◎ Where is it? Try the Sky Finder</a>`}

      ${tm ? `<div class="timemachine glass"><span class="hud-label">⧗ TIME MACHINE</span><p>${tm}</p></div>` : ''}

      <section class="block"><h3><span class="hud-label">01</span> In a nutshell</h3><p>${o.nutshell}</p></section>

      <section class="block"><h3><span class="hud-label">02</span> How we found out</h3>
        <ol class="timeline">${o.story.map(([y, t]) => `<li><span class="year">${y}</span><p>${t}</p></li>`).join('')}</ol>
      </section>

      <section class="block wow glass"><span class="hud-label">✦ MIND-BLOWING FACT</span><p>${o.wow}</p></section>

      <section class="block wonder glass"><span class="hud-label">? WONDER</span><p class="q">${o.wonder[0]}</p>
        <button class="btn ghost reveal">Think about it… then tap to reveal</button><p class="a" hidden>${o.wonder[1]}</p>
      </section>

      <section class="block"><h3><span class="hud-label">03</span> See it yourself</h3><p>${o.see}</p></section>

      <section class="block encyclopedia" hidden><h3><span class="hud-label">04</span> From the encyclopedia</h3><p class="extract"></p><a class="more" target="_blank" rel="noopener">Read the full article on Wikipedia ↗</a></section>

      <div class="actions">
        <button class="btn ${learned ? 'done' : 'primary'} learn">${learned ? '✓ Learned' : `I learned this! +${store.XP.learn} XP`}</button>
        <button class="btn ghost save">${media.isSaved(id) ? '✓ Saved offline · remove' : '⤓ Save for offline'}</button>
      </div>
      <nav class="pager">
        ${prev ? `<a class="btn ghost" href="#/object/${prev.id}">← ${OBJECTS[prev.id].name}</a>` : '<span></span>'}
        ${next ? `<a class="btn ghost next" href="#/object/${next.id}">${OBJECTS[next.id].name} →</a>` : ''}
      </nav>
    </article>`;

  view.querySelector('.reveal').addEventListener('click', (e) => { e.currentTarget.hidden = true; view.querySelector('.wonder .a').hidden = false; });

  view.querySelector('.learn').addEventListener('click', (e) => {
    if (!store.markLearned(id)) return;
    const b = e.currentTarget;
    b.className = 'btn done learn';
    b.textContent = '✓ Learned';
    const r = b.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    rewardToast(store.XP.learn, o.name);
    const sp = store.sectorProgress(s);
    if (sp.done === sp.total && !sp.quiz) setTimeout(() => toast(`Sector ${s.code} challenge unlocked! <a href="#/quiz/${s.id}">Take it →</a>`, 'rank'), 900);
    view.querySelector('.pager .next')?.classList.add('glow');
  });

  view.querySelector('.save').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    if (media.isSaved(id)) {
      await media.removeOffline(id);
      b.textContent = '⤓ Save for offline';
      return;
    }
    if (!navigator.onLine) return toast('You’re offline – connect to download.');
    b.disabled = true;
    b.textContent = 'Downloading…';
    try {
      const bytes = await media.saveForOffline(o);
      b.textContent = '✓ Saved offline · remove';
      toast(`Saved ${o.name} (${media.formatBytes(bytes)})`);
    } catch {
      b.textContent = '⤓ Save for offline';
      toast('Download failed – try again later.');
    }
    b.disabled = false;
  });

  media.getMedia(o).then((m) => {
    if (!m || !view.contains(view.querySelector('.object'))) return;
    if (m.image) {
      const img = view.querySelector('.obj-photo');
      img.onload = () => { img.hidden = false; img.classList.add('in'); view.querySelector('.photo-credit').hidden = false; };
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
      <a class="back" href="#/sector/${s.id}">← Sector ${s.code}</a>
      <section class="quiz" style="--hue:${s.hue}">
        <div class="hud-label">SECTOR ${s.code} CHALLENGE · QUESTION ${i + 1}/${s.quiz.length}</div>
        ${progressBar(i / s.quiz.length)}
        <h2 class="q">${q.q}</h2>
        <div class="options">${q.options.map((op, k) => `<button class="opt glass" data-k="${k}"><span class="mono">${'ABCD'[k]}</span>${op}</button>`).join('')}</div>
        <div class="why glass" hidden></div>
        <button class="btn primary nextq" hidden>${i === s.quiz.length - 1 ? 'See results' : 'Next question →'}</button>
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
        <div class="hud-label">CHALLENGE COMPLETE</div>
        <div class="score">${score}<small>/${s.quiz.length}</small></div>
        ${p.complete ? `<div class="badge glass"><span class="badge-icon">★</span><div><span class="hud-label">BADGE</span><b>${s.title}</b></div></div>` : '<p>Score 2 or more to earn the sector badge. Have another look and try again!</p>'}
        ${gained ? `<p class="mono">+${gained} XP</p>` : ''}
        <div class="actions">
          <a class="btn ghost" href="#/quiz/${s.id}">Retry</a>
          ${nextSector ? `<a class="btn primary" href="#/sector/${nextSector.id}">Next: ${nextSector.title} →</a>` : '<a class="btn primary" href="#/sky">Explore the real sky →</a>'}
        </div>
      </section>`;
    if (p.complete && !hadBadge) { burst(); setTimeout(burst, 300); }
    if (gained) rewardToast(gained, 'challenge');
  }
  render();
}

function libraryView(params) {
  const cats = ['All', 'Planets', 'Moons', 'Dwarf planets', 'Stars', 'Constellations', 'Star clusters', 'Nebulae', 'Pulsars', 'Black holes', 'Galaxies', 'Cosmology'];
  let cat = params.get('c') || 'All';
  let q = '';
  view.innerHTML = `
    <section class="lib-head">
      <div class="hud-label">ARCHIVE · ${JOURNEY.length} OBJECTS</div>
      <h1 class="title">Library</h1>
      <input class="search glass" type="search" placeholder="Search planets, stars, galaxies, people…" aria-label="Search">
      <div class="chips">${cats.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
    </section>
    <section class="obj-list lib-list"></section>`;
  const list = view.querySelector('.lib-list');
  function render() {
    const needle = q.toLowerCase();
    const items = JOURNEY.map((j) => OBJECTS[j.id]).filter((o) => (cat === 'All' || category(o) === cat) && (!needle || [o.name, o.kind, o.nutshell, ...o.story.map((s) => s[1])].join(' ').toLowerCase().includes(needle)));
    list.innerHTML = items.length ? items.map((o) => objCard(o)).join('') : '<p class="empty">Nothing found. Try another word!</p>';
  }
  view.querySelector('.search').addEventListener('input', (e) => { q = e.target.value; render(); });
  view.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
    cat = c.dataset.c;
    view.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
    render();
  }));
  render();
}

async function savedView() {
  const index = media.savedIndex();
  const ids = Object.keys(index);
  let est = null;
  try { est = await navigator.storage?.estimate?.(); } catch { /* ignore */ }
  view.innerHTML = `
    <section class="lib-head">
      <div class="hud-label">OFFLINE STORAGE</div>
      <h1 class="title">Saved</h1>
      <div class="glass info">
        <p><b>Always available offline:</b> every lesson, timeline, quiz, illustration and the Sky Finder – they’re built into the app.</p>
        <p><b>Your choice:</b> photos and encyclopedia extracts are downloaded only for the objects or sectors you save.</p>
        <div class="row"><span class="mono">${ids.length} saved · ${media.formatBytes(media.savedBytes())}</span>${est?.quota ? `<span class="mono dim">device space free: ${media.formatBytes(est.quota - est.usage)}</span>` : ''}</div>
        <div class="row"><button class="btn ghost dl-all">⤓ Save everything (~${JOURNEY.length} photos)</button>${ids.length ? '<button class="btn ghost clear-all">Remove all</button>' : ''}</div>
      </div>
    </section>
    <section class="obj-list">${ids.length ? ids.filter((id) => OBJECTS[id]).map((id) => `<div class="saved-row">${objCard(OBJECTS[id])}<button class="icon-btn rm" data-id="${id}" aria-label="Remove ${esc(OBJECTS[id].name)}">✕</button></div>`).join('') : '<p class="empty">Nothing saved yet. Open any object or sector and tap “Save for offline”.</p>'}</section>
    <section class="danger glass">
      <span class="hud-label">EXPLORER LOG</span>
      <p>Your progress is stored on this device only.</p>
      <button class="btn ghost reset">Reset my progress</button>
    </section>`;
  view.querySelectorAll('.rm').forEach((b) => b.addEventListener('click', async () => { await media.removeOffline(b.dataset.id); savedView(); }));
  view.querySelector('.clear-all')?.addEventListener('click', async () => { for (const id of ids) await media.removeOffline(id); savedView(); });
  view.querySelector('.dl-all').addEventListener('click', async (e) => {
    if (!navigator.onLine) return toast('You’re offline – connect to download.');
    const b = e.currentTarget;
    b.disabled = true;
    await media.saveMany(JOURNEY.map((j) => j.id), (d, t) => { b.textContent = `Downloading ${d}/${t}…`; });
    savedView();
  });
  view.querySelector('.reset').addEventListener('click', () => {
    if (confirm('Erase all XP, badges and learned items on this device?')) { store.resetProgress(); toast('Progress reset.'); }
  });
}

function skyView(id) {
  view.innerHTML = '<div class="sky-host"></div>';
  sky = mountSky(view.querySelector('.sky-host'), {
    targetId: id,
    onTarget: (tid) => history.replaceState(null, '', tid ? `#/sky/${tid}` : '#/sky'),
    onSpotted: (o) => { burst(); rewardToast(store.XP.spot, `Spotted ${o.name}!`); },
  });
}

function notFound() {
  view.innerHTML = '<section class="hero"><h1 class="title">Lost in space</h1><p>That page drifted away. <a href="#/">Return to Mission Control</a></p></section>';
}

// ───────────────────────── router ─────────────────────────
function route() {
  sky?.destroy();
  sky = null;
  const [path, query] = (location.hash.slice(1) || '/').split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query || '');
  const tab = parts[0] || 'home';
  document.body.dataset.view = tab;
  starfield.pause(tab === 'sky');
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (['sector', 'object', 'quiz'].includes(tab) ? 'home' : tab)));
  switch (tab) {
    case 'home': homeView(); break;
    case 'sector': sectorView(parts[1]); break;
    case 'object': objectView(parts[1]); break;
    case 'quiz': quizView(parts[1]); break;
    case 'sky': skyView(parts[1]); break;
    case 'library': libraryView(params); break;
    case 'saved': savedView(); break;
    default: notFound();
  }
  if (tab !== 'sky') window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
updateTopbar();
route();

// Offline indicator + service worker (installable, works without internet).
function netStatus() { document.body.classList.toggle('offline', !navigator.onLine); }
window.addEventListener('online', netStatus);
window.addEventListener('offline', netStatus);
netStatus();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
