// NICK.OS achievements: unlocks, pop-up toasts, the achievements.exe window, and shared "found by X%" stats.
// Progress lives in this browser (localStorage). Counts are shared through /api/achievements (KV) when it's available.
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const TIERS = {
  bronze: { label: 'BRONZE', pts: 10 },
  silver: { label: 'SILVER', pts: 25 },
  gold: { label: 'GOLD', pts: 50 },
  legendary: { label: 'LEGENDARY', pts: 150 },
};

// hint = what a locked achievement shows. Keep hints nudging, not spoiling.
export const ACH = [
  // exploring
  { id: 'boot', name: 'Boot Sequence', tier: 'bronze', desc: 'Powered on NICK.OS.', hint: 'Press the button.' },
  { id: 'tour', name: 'Full Tour', tier: 'silver', desc: 'Opened every folder on the desktop.', hint: 'Open every ./folder.' },
  { id: 'toolbox', name: 'Toolbox', tier: 'silver', desc: 'Opened every tool in ./tools.', hint: 'Try every .exe in ./tools.' },
  { id: 'bin', name: 'Dumpster Diver', tier: 'bronze', desc: 'Emptied the Recycle Bin.', hint: 'Take out the trash.' },
  { id: 'reboot', name: 'Have You Tried…', tier: 'bronze', desc: 'Turned it off and on again.', hint: 'The oldest fix in IT.' },
  { id: 'night', name: 'Night Owl', tier: 'silver', desc: 'Visited between midnight and 4am.', hint: 'Come back very late.' },
  { id: 'afk', name: 'AFK', tier: 'bronze', desc: 'Let the screensaver kick in.', hint: 'Walk away for a bit.', desktopOnly: true },
  // terminal
  { id: 'hello', name: 'Hello World', tier: 'bronze', desc: 'Said hi to the terminal.', hint: 'Be polite to the terminal.' },
  { id: 'belt', name: 'Rule One', tier: 'bronze', desc: 'Asked about the black belt.', hint: 'Ask the terminal about Hwa Rang Do.' },
  { id: 'sudo', name: 'Permission Denied', tier: 'silver', desc: 'Tried to get admin rights.', hint: 'Ask the terminal for admin rights.' },
  { id: 'rmrf', name: 'Nice Try', tier: 'silver', desc: 'Tried to delete everything.', hint: 'Try to wipe the machine.' },
  { id: 'coffee', name: 'Coffee Snob', tier: 'silver', desc: 'Roasted a batch with root access.', hint: 'The machine runs on coffee.' },
  { id: 'history', name: 'Snoop', tier: 'bronze', desc: 'Read the last user’s command history.', hint: 'What did the last user type?' },
  { id: 'power', name: 'Power User', tier: 'gold', desc: 'Ran 10 different terminal commands.', hint: 'Get comfortable in the terminal.' },
  // hidden game
  { id: 'game', name: 'Scope Creep', tier: 'gold', desc: 'Found the hidden game.', hint: 'There’s a game in here somewhere.' },
  { id: 'scope', name: 'Scope Mastered', tier: 'gold', desc: 'Handled 25 requests in Scope Creep.', hint: 'Get good at the hidden game.' },
  // working with Nick
  { id: 'defrag', name: 'Defragmented', tier: 'bronze', desc: 'Ran a defrag to completion.', hint: 'Clean up a hard drive.' },
  { id: 'calc', name: 'Do the Math', tier: 'bronze', desc: 'Priced out your busywork.', hint: 'Run some numbers.' },
  { id: 'diagnose', name: 'Self-Aware', tier: 'silver', desc: 'Finished a systems health scan.', hint: 'Get your systems checked.' },
  { id: 'estimate', name: 'Ballpark', tier: 'silver', desc: 'Got a ballpark for a project.', hint: 'Find out what a project costs.' },
  { id: 'hire', name: 'Excellent Choice', tier: 'silver', desc: 'Opened the contact window.', hint: 'Get in touch.' },
  { id: 'sent', name: 'Final Boss', tier: 'legendary', desc: 'Sent Nick a message. The real game starts now.', hint: 'The final boss. Start a project.' },
];

const FOLDERS = ['services', 'work', 'experience', 'about', 'contact'];
const TOOLS = ['diagnose', 'calc', 'taskmgr', 'defrag', 'estimate', 'inbox'];
const KEY = 'nickos-ach', SEEN = 'nickos-seen', VISIT = 'nickos-visit';

const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage off */ } };

export function createAchievements(ctx) {
  const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const list = ACH.filter((a) => !(a.desktopOnly && touchOnly));
  let got = load(KEY, {});
  const seen = load(SEEN, { open: [], cmds: [] });
  let stats = null; // { visitors, counts }
  const queue = []; let showing = false;

  // ---------- toast ----------
  const host = document.createElement('div');
  host.className = 'toasts'; host.setAttribute('aria-live', 'polite');
  document.getElementById('os').appendChild(host);
  function jingle(tier) {
    const notes = tier === 'legendary' ? [523, 659, 784, 1047, 1319] : tier === 'gold' ? [659, 784, 1047] : [784, 1047];
    notes.forEach((f, i) => setTimeout(() => ctx.beep(f, 0.09), i * 90));
  }
  function nextToast() {
    if (showing || !queue.length) return;
    showing = true;
    const a = queue.shift(), t = TIERS[a.tier];
    const el = document.createElement('button');
    el.type = 'button'; el.className = `toast ${a.tier}`;
    el.innerHTML = `<span class="trophy" aria-hidden="true">${trophySvg(28)}</span><span style="min-width:0"><span class="tt">ACHIEVEMENT UNLOCKED · ${t.label} · +${t.pts}</span><span class="tn vt">${esc(a.name)}</span><span class="td">${esc(a.desc)}</span></span>`;
    el.addEventListener('click', () => { ctx.openWin('achievements'); el.remove(); showing = false; nextToast(); });
    host.appendChild(el);
    jingle(a.tier);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => { el.remove(); showing = false; nextToast(); }, 350); }, a.tier === 'legendary' ? 6500 : 4200);
  }

  // ---------- shared stats ----------
  async function loadStats() {
    try { const r = await fetch('/api/achievements'); const d = await r.json(); if (r.ok && d.shared) { stats = d; render(); } } catch (e) { /* offline or no API */ }
  }
  function report(body) {
    try { fetch('/api/achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => {}); } catch (e) { /* */ }
  }

  // ---------- unlocking ----------
  function unlock(id) {
    const a = list.find((x) => x.id === id);
    if (!a || got[id]) return;
    got[id] = Date.now(); store(KEY, got);
    queue.push(a); nextToast();
    report({ id });
    if (stats) { stats.counts[id] = (stats.counts[id] || 0) + 1; }
    render();
  }
  function opened(k) {
    if (k === 'contact') unlock('hire');
    if (k === 'game') unlock('game');
    if (!seen.open.includes(k)) { seen.open.push(k); store(SEEN, seen); }
    if (FOLDERS.every((f) => seen.open.includes(f))) unlock('tour');
    if (TOOLS.every((f) => seen.open.includes(f))) unlock('toolbox');
  }
  function command(name) {
    if (!seen.cmds.includes(name)) { seen.cmds.push(name); store(SEEN, seen); }
    if (seen.cmds.length >= 10) unlock('power');
  }
  function visit() {
    const h = new Date().getHours();
    if (h >= 0 && h < 4) unlock('night');
    // count each browser once as a visitor, so "found by X%" has a denominator
    let first = false;
    try { if (!localStorage.getItem(VISIT)) { localStorage.setItem(VISIT, '1'); first = true; } } catch (e) { /* storage off: don't count */ }
    if (first) report({ visit: true });
    loadStats();
  }
  document.addEventListener('nickos:sent', () => unlock('sent'));

  // ---------- achievements.exe ----------
  function pct(id) {
    if (!stats || !stats.visitors) return '';
    const n = stats.counts[id] || 0;
    if (stats.visitors < 10) return n ? `${n} found` : 'nobody yet';
    const p = Math.min(100, (n / stats.visitors) * 100);
    return n === 0 ? 'nobody yet' : p < 1 ? '<1% of visitors' : `${Math.round(p)}% of visitors`;
  }
  function render() {
    const r = ctx.body('achievements'); if (!r || r.closest('.win').hidden) return;
    const done = list.filter((a) => got[a.id]);
    const pts = done.reduce((s, a) => s + TIERS[a.tier].pts, 0), max = list.reduce((s, a) => s + TIERS[a.tier].pts, 0);
    const order = ['legendary', 'gold', 'silver', 'bronze'];
    const rows = list.slice().sort((a, b) => (got[b.id] ? 1 : 0) - (got[a.id] ? 1 : 0) || order.indexOf(a.tier) - order.indexOf(b.tier));
    r.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><div class="vt" style="font-size:28px">${done.length} / ${list.length} UNLOCKED</div><div class="vt" style="font-size:28px">${pts} / ${max} PTS</div></div>
      <div class="meter" style="margin:8px 0 14px"><div style="width:${Math.round(done.length / list.length * 100)}%"></div></div>
      <div style="display:flex;flex-direction:column;gap:8px">${rows.map((a) => {
        const on = !!got[a.id], t = TIERS[a.tier], p = pct(a.id);
        return `<div class="ach ${a.tier}${on ? ' on' : ''}"><span class="trophy" aria-hidden="true">${on ? trophySvg(26) : lockSvg(26)}</span>
          <div style="flex:1 1 auto;min-width:0"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b class="vt an">${on ? esc(a.name) : '???'}</b><span class="tier">${t.label} · ${t.pts}</span></div>
          <div class="${on ? 'light' : 'dim'}" style="font-size:13px">${esc(on ? a.desc : a.hint)}</div>${p ? `<div class="dim" style="font-size:12px;margin-top:2px">Found by ${esc(p)}</div>` : ''}</div></div>`;
      }).join('')}</div>
      <p class="dim" style="margin:14px 0 0;font-size:12px">Progress is saved in this browser.${stats ? ' Percentages come from everyone who has booted NICK.OS.' : ''} <button type="button" class="lnk" data-ach-reset style="font-size:12px">Reset progress</button></p>`;
  }
  function bind() {
    const r = ctx.body('achievements'); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    r.addEventListener('click', (e) => {
      if (!e.target.closest('[data-ach-reset]')) return;
      got = {}; seen.open = []; seen.cmds = []; store(KEY, got); store(SEEN, seen); render();
    });
  }
  return { unlock, opened, command, visit, open() { bind(); render(); loadStats(); } };
}

function trophySvg(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h10v5a5 5 0 0 1-10 0z"></path><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v3M8 21h8M9 17h6v4H9z"></path></svg>`;
}
function lockSvg(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>`;
}
