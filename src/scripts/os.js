// NICK.OS — desktop shell: boot, windows, taskbar, sound, screensaver.
import { initContact } from './contact.js';
import { createApps } from './apps.js';
import { createAchievements } from './achievements.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const BOOT = [
  'NICK.OS BIOS v1.0',
  'Memory check ........ OK',
  'Loading: systems_design.sys ... OK',
  'Loading: automation.dll ....... OK',
  'Loading: web_stack.drv ........ Astro / Stripe / Cloudflare',
  'Loading: agents.exe ........... ready',
  'Loading: growth.drv ........... SEO / ads',
  'Mounting desktop ............. 8 items',
  'Welcome, visitor.',
];

export function initOS() {
  const os = $('#os');
  const off = $('#off'), boot = $('#boot'), desk = $('#desktop'), bar = $('#taskbar'), saver = $('#saver');
  const idleMs = (Number(os.dataset.idle) || 30) * 1000;
  const state = { phase: 'off', sound: true, secs: 0, topZ: 10, active: null, lastAct: Date.now(), drag: null };
  let ac = null, clockT = null, bootT = null;

  // ---------- sound ----------
  function beep(freq, dur) {
    if (!state.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
    } catch (e) { /* no audio */ }
  }
  const soundBtn = $('#sound');
  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    soundBtn.textContent = state.sound ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    if (!state.sound) ach && ach.unlock('silent');
  });

  // ---------- windows ----------
  const wins = {};
  $$('.win', desk).forEach((el) => { wins[el.dataset.win] = el; });
  const labels = Object.fromEntries(Object.entries(wins).map(([k, el]) => [k, el.getAttribute('aria-label')]));
  const tasks = $('#tasks');

  function renderTasks() {
    tasks.textContent = '';
    Object.entries(wins).forEach(([k, el]) => {
      if (el.hidden) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tbtn'; b.textContent = labels[k];
      b.setAttribute('aria-pressed', String(state.active === k));
      b.addEventListener('click', () => focusWin(k));
      tasks.appendChild(b);
    });
  }
  function focusWin(k) {
    const el = wins[k]; if (!el) return;
    state.topZ += 1; el.style.zIndex = state.topZ;
    Object.values(wins).forEach((w) => w.classList.remove('active'));
    el.classList.add('active'); state.active = k;
    renderTasks();
  }
  function openWin(k) {
    const el = wins[k]; if (!el) return;
    if (state.phase !== 'desktop') { quickBoot(); }
    beep(740, 0.06);
    el.hidden = false;
    focusWin(k);
    apps[k] && apps[k].open && apps[k].open();
    ach && ach.opened(k);
  }
  function closeWin(k) {
    const el = wins[k]; if (!el) return;
    beep(330, 0.06);
    el.hidden = true;
    apps[k] && apps[k].close && apps[k].close();
    if (state.active === k) state.active = null;
    renderTasks();
  }
  Object.entries(wins).forEach(([k, el]) => {
    el.addEventListener('pointerdown', () => { if (state.active !== k) focusWin(k); });
    $('[data-close]', el).addEventListener('click', (e) => { e.stopPropagation(); closeWin(k); });
    const handle = $('[data-drag]', el);
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      state.drag = { el, sx: e.clientX, sy: e.clientY, ox: el.offsetLeft, oy: el.offsetTop };
      handle.style.cursor = 'grabbing';
    });
  });
  window.addEventListener('pointermove', (e) => {
    activity();
    const d = state.drag; if (!d) return;
    d.el.style.left = Math.max(0, d.ox + e.clientX - d.sx) + 'px';
    d.el.style.top = Math.max(0, d.oy + e.clientY - d.sy) + 'px';
  });
  window.addEventListener('pointerup', () => {
    if (state.drag) { $('[data-drag]', state.drag.el).style.cursor = ''; state.drag = null; }
  });

  // any [data-open] element opens a window (links keep working on plain pages)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open]');
    if (!t || !wins[t.dataset.open]) return;
    e.preventDefault();
    openWin(t.dataset.open);
  });

  // ---------- boot ----------
  function showDesktop() {
    state.phase = 'desktop';
    off.hidden = true; boot.hidden = true; desk.hidden = false; bar.hidden = false;
    state.secs = 0; state.lastAct = Date.now();
    clearInterval(clockT);
    clockT = setInterval(tick, 1000);
    ach && ach.visit();
  }
  let wasOff = false;
  function powerOn() {
    beep(440, 0.12);
    ach && ach.unlock('boot');
    if (wasOff) ach && ach.unlock('reboot');
    state.phase = 'booting';
    off.hidden = true; boot.hidden = false;
    const lines = $('#bootlines'); lines.textContent = '';
    let i = 0;
    clearInterval(bootT);
    bootT = setInterval(() => {
      beep(880, 0.03);
      if (i >= BOOT.length) { clearInterval(bootT); beep(660, 0.15); showDesktop(); return; }
      const d = document.createElement('div'); d.textContent = BOOT[i++]; lines.appendChild(d);
    }, 260);
  }
  function quickBoot() { clearInterval(bootT); showDesktop(); }
  function powerOff() {
    beep(220, 0.2);
    clearInterval(clockT); clearInterval(bootT);
    Object.keys(wins).forEach((k) => { if (!wins[k].hidden) { wins[k].hidden = true; apps[k] && apps[k].close && apps[k].close(); } });
    state.active = null; renderTasks();
    desk.hidden = true; bar.hidden = true; boot.hidden = true; off.hidden = false;
    state.phase = 'off'; wasOff = true;
    history.replaceState(null, '', location.pathname);
  }
  $('#power').addEventListener('click', powerOn);
  $('#shutdown').addEventListener('click', powerOff);

  // ---------- clock + screensaver ----------
  const uptime = $('#uptime');
  // Phones and tablets: no screensaver. Reading there is scrolling, and a saver just gets in the way.
  const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  function tick() {
    state.secs += 1;
    uptime.textContent = String(Math.floor(state.secs / 60)).padStart(2, '0') + ':' + String(state.secs % 60).padStart(2, '0');
    if (!touchOnly && saver.hidden && !state.drag && Date.now() - state.lastAct > idleMs && !(apps.game && apps.game.playing())) startSaver();
  }
  function activity() {
    state.lastAct = Date.now();
    if (!saver.hidden) { saver.hidden = true; saver.textContent = ''; }
  }
  ['pointerdown', 'keydown', 'wheel', 'input', 'touchstart'].forEach((ev) => window.addEventListener(ev, activity, { passive: true }));
  document.addEventListener('scroll', activity, { passive: true, capture: true });
  function startSaver() {
    const layer = (seed, cls) => {
      let r = seed; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
      const d = document.createElement('div'); d.className = 'starlayer' + (cls ? ' ' + cls : '');
      for (let i = 0; i < 70; i++) {
        const s = document.createElement('span'); s.className = 'star';
        const z = 1 + Math.round(rnd() * 2);
        s.style.cssText = `left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;width:${z}px;height:${z}px;animation-delay:${(-rnd() * 2.4).toFixed(1)}s`;
        d.appendChild(s);
      }
      return d;
    };
    saver.appendChild(layer(7));
    saver.appendChild(layer(42, 'b'));
    const t = document.createElement('div'); t.className = 'drift vt'; t.textContent = 'NICHOLAS DAY · I BUILD THE SYSTEMS THAT LET BUSINESSES GROW · ';
    saver.appendChild(t);
    const w = document.createElement('div'); w.className = 'dim'; w.style.cssText = 'position:absolute;bottom:24px;left:0;right:0;text-align:center;font-size:13px'; w.textContent = 'Move the mouse to wake';
    saver.appendChild(w);
    saver.hidden = false;
    ach && ach.unlock('afk');
  }

  // ---------- apps ----------
  const contact = initContact(wins.contact);
  let ach = null;
  const ctx = {
    beep, openWin, closeWin,
    setScope: (text) => { contact && contact.setScope(text); },
    uptime: () => state.secs,
    body: (k) => wins[k] && $('[data-app]', wins[k]),
    ach: (id) => ach && ach.unlock(id),
    cmd: (name) => ach && ach.command(name),
  };
  ach = createAchievements(ctx);
  const apps = createApps(ctx);
  apps.achievements = { open: ach.open };

  // deep links: nick.day/#work opens that window straight away
  const hash = location.hash.replace('#', '');
  if (hash && wins[hash]) { showDesktop(); openWin(hash); }
  window.addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (wins[h]) openWin(h); });
}
