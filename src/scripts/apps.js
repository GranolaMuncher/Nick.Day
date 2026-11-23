// NICK.OS apps. Each app renders into its window's [data-app] element.
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');
const BTN = 'class="btn"';
const BTN2 = 'class="btn sm"';

export function createApps(ctx) {
  const apps = {};
  apps.diagnose = diagnose(ctx);
  apps.calc = calc(ctx);
  apps.taskmgr = taskmgr(ctx);
  apps.defrag = defrag(ctx);
  apps.terminal = terminal(ctx);
  apps.estimate = estimate(ctx);
  apps.inbox = inbox(ctx);
  apps.recycle = recycle(ctx);
  apps.game = game(ctx);
  return apps;
}

// ---------------------------------------------------------------- diagnose
const QUESTIONS = [
  { q: 'Where do new leads and inquiries land?', opts: [['One system that tracks every one', 0], ['My inbox, texts and DMs', 1], ['Wherever, honestly', 2]],
    leak: { title: 'Leads living in your inbox', detail: 'Inquiries scattered across email and DMs means some never get a reply.', fix: 'one pipeline every lead lands in, with follow-up reminders.' } },
  { q: 'How many apps and tools does it take to run the business?', opts: [['Under 5', 0], ['5 to 10', 1], ['More than 10, or I have lost count', 2]],
    leak: { title: 'Tool sprawl', detail: 'Every extra app is another login, another bill and another place data goes stale.', fix: 'a lean, connected stack you own.' } },
  { q: 'How do invoices and payment follow-ups happen?', opts: [['Automatically', 0], ['By hand, but it works', 1], ['By hand, and things slip', 2]],
    leak: { title: 'Manual invoicing', detail: 'Hand-made invoices and memory-based follow-ups leak cash and time.', fix: 'automatic invoices, receipts and reminders.' } },
  { q: 'Hours per week your team spends on copy-paste, data entry or repeat emails?', opts: [['Under 2', 0], ['2 to 5', 1], ['More than 5', 2]],
    leak: { title: 'Busywork drain', detail: 'Repetitive tasks eat the hours that should go to customers and growth.', fix: 'automations and AI agents for the repeat work.' } },
  { q: 'Can you see this month’s revenue and pipeline in under a minute?', opts: [['Yes, on a live dashboard', 0], ['After I update a spreadsheet', 1], ['Not really', 2]],
    leak: { title: 'No single source of truth', detail: 'If the numbers take an afternoon to assemble, decisions get made on gut feel.', fix: 'a live dashboard fed by your real systems.' } },
  { q: 'Is your website bringing in customers?', opts: [['Yes, steadily', 0], ['Some, now and then', 1], ['Not really, or no site', 2]],
    leak: { title: 'A website that doesn’t sell', detail: 'Your site should be working while you sleep, not just existing.', fix: 'a fast site built around how customers buy.' } },
  { q: 'If twice the customers showed up next month, would things hold?', opts: [['Yes, we’re ready', 0], ['Barely', 1], ['Everything would break', 2]],
    leak: { title: 'Won’t scale', detail: 'Systems that depend on you remembering everything cap your growth.', fix: 'documented processes and SOPs your team can run.' } },
];
const SCAN = ['> scanning lead_flow ...', '> counting tool_stack ...', '> tracing invoices ...', '> measuring busywork ...', '> reading dashboards ...', '> testing website ...', '> load-testing for growth ...'];

function diagnose(ctx) {
  const el = () => ctx.body('diagnose');
  let st = { phase: 'quiz', step: 0, answers: [], progress: 0 }, t = null;
  function render() {
    const r = el(); if (!r) return;
    if (st.phase === 'quiz') {
      const q = QUESTIONS[st.step];
      r.innerHTML = `<div class="dim" style="font-size:12px">SYSTEMS HEALTH SCAN · QUESTION ${st.step + 1} OF ${QUESTIONS.length}</div>
        <div style="height:6px;border:1px solid var(--dim);margin:6px 0 16px"><div style="height:100%;width:${Math.round(st.step / QUESTIONS.length * 100)}%;background:var(--amber)"></div></div>
        <h3 class="vt" style="margin:0 0 14px;font-size:30px;line-height:1.1">${esc(q.q)}</h3>
        <div style="display:flex;flex-direction:column;gap:8px">${q.opts.map((o) => `<button type="button" ${BTN2} data-sev="${o[1]}" style="justify-content:flex-start;text-align:left;border-color:var(--amber)">&gt; ${esc(o[0])}</button>`).join('')}</div>
        ${st.step > 0 ? '<button type="button" class="lnk" data-back style="margin-top:14px">&lt; back</button>' : ''}`;
    } else if (st.phase === 'scan') {
      r.innerHTML = `<div class="vt" style="font-size:26px">SCANNING YOUR SYSTEMS... ${st.progress}%</div>
        <div class="meter" style="margin:10px 0 14px"><div style="width:${st.progress}%;background:repeating-linear-gradient(90deg,var(--amber) 0 10px,transparent 10px 13px)"></div></div>
        ${SCAN.slice(0, Math.ceil(st.progress / 100 * SCAN.length)).map((l) => `<div>${esc(l)}</div>`).join('')}`;
    } else {
      const leaks = [];
      st.answers.forEach((sev, i) => { if (sev > 0) leaks.push({ ...QUESTIONS[i].leak, sev }); });
      leaks.sort((a, b) => b.sev - a.sev);
      const total = st.answers.reduce((a, b) => a + b, 0);
      const health = Math.round(100 - (total / (QUESTIONS.length * 2)) * 100);
      const summary = leaks.length === 0 ? 'No leaks found. Your systems are in good shape. If you want to go further, automation is the next lever.'
        : `${leaks.length} ${leaks.length === 1 ? 'leak' : 'leaks'} found. ${health < 50 ? 'Your business is running on effort, not systems. Good news: that’s very fixable.' : 'Solid foundation, with a few places time and money slip away.'}`;
      r.innerHTML = `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap"><div class="vt" style="font-size:30px">SCAN COMPLETE</div><div class="vt" style="font-size:30px">SYSTEM HEALTH: ${health}%</div></div>
        <p class="light" style="margin:6px 0 14px">${esc(summary)}</p>
        <div style="display:flex;flex-direction:column;gap:10px">${leaks.map((l) => `<div class="card" style="padding:12px"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(l.title)}</b><span style="color:var(--bg);background:var(--amber);text-shadow:none;padding:0 6px;font-size:12px;font-weight:600">${l.sev === 2 ? 'HIGH' : 'MEDIUM'}</span></div><div style="margin-top:4px">${esc(l.detail)}</div><div class="dim" style="margin-top:4px">Fix: ${esc(l.fix)}</div></div>`).join('')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button type="button" ${BTN} data-open="contact">BOOK A SYSTEMS AUDIT &gt;</button><button type="button" ${BTN2} data-restart>Run again</button></div>
        <p class="dim" style="margin:12px 0 0;font-size:12px">A quick self-check, not a full audit. The audit is where we find the real numbers.</p>`;
    }
  }
  function bind() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.sev !== undefined) {
        ctx.beep(700, 0.04);
        st.answers = st.answers.slice(0, st.step).concat([Number(b.dataset.sev)]);
        if (st.step + 1 < QUESTIONS.length) { st.step += 1; render(); }
        else {
          st.phase = 'scan'; st.progress = 0; render();
          clearInterval(t);
          t = setInterval(() => {
            st.progress = Math.min(100, st.progress + 4);
            if (st.progress % 16 === 0) ctx.beep(1200, 0.02);
            if (st.progress >= 100) { clearInterval(t); ctx.beep(520, 0.2); st.phase = 'report'; }
            render();
          }, 90);
        }
      } else if (b.hasAttribute('data-back')) { st.step -= 1; render(); }
      else if (b.hasAttribute('data-restart')) { st = { phase: 'quiz', step: 0, answers: [], progress: 0 }; render(); }
    });
  }
  return { open() { bind(); render(); }, close() { if (st.phase === 'scan') { clearInterval(t); st.phase = 'report'; } } };
}

// ---------------------------------------------------------------- calc
function calc(ctx) {
  const el = () => ctx.body('calc');
  const v = { people: 3, hours: 6, rate: 75 };
  function slider(id, label, key, min, max, step, show) {
    return `<div style="display:flex;flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between;gap:10px"><label for="${id}">${label}</label><span class="light" style="font-weight:600" data-show="${key}">${show}</span></div>
      <input id="${id}" class="range" type="range" min="${min}" max="${max}" step="${step}" value="${v[key]}" data-key="${key}"></div>`;
  }
  function update() {
    const r = el(); if (!r) return;
    const hoursYear = v.people * v.hours * 48, cost = hoursYear * v.rate, monthly = cost / 2 / 12;
    const months = monthly > 0 ? 14000 / monthly : 0;
    const payback = months < 1 ? 'under a month' : months > 36 ? '3+ years' : `~${Math.round(months)} ${Math.round(months) === 1 ? 'month' : 'months'}`;
    r.querySelector('[data-show=people]').textContent = v.people;
    r.querySelector('[data-show=hours]').textContent = v.hours;
    r.querySelector('[data-show=rate]').textContent = `$${v.rate}/hr`;
    r.querySelector('[data-cost]').textContent = fmt(cost);
    r.querySelector('[data-hours]').textContent = `${hoursYear.toLocaleString('en-US')} hours a year`;
    r.querySelector('[data-saved]').textContent = `${fmt(cost / 2)}/yr back`;
    r.querySelector('[data-payback]').textContent = payback;
  }
  function render() {
    const r = el(); if (!r || r.dataset.bound) { update(); return; } r.dataset.bound = '1';
    r.innerHTML = `<p class="light" style="margin:0 0 16px">What does the busywork actually cost you? Move the sliders.</p>
      <div style="display:flex;flex-direction:column;gap:16px">
      ${slider('cpeople', 'People on your team', 'people', 1, 25, 1, v.people)}
      ${slider('chours', 'Hours each, per week, on repetitive work', 'hours', 1, 30, 1, v.hours)}
      ${slider('crate', 'What an hour of their time is worth', 'rate', 25, 300, 5, `$${v.rate}/hr`)}
      </div>
      <div style="border:2px solid var(--amber);padding:16px;margin-top:18px;text-align:center"><div class="dim" style="font-size:12px">YOU'RE SPENDING EVERY YEAR ON WORK A SYSTEM COULD DO</div><div class="vt" style="font-size:64px;line-height:1" data-cost></div><div class="light" data-hours></div></div>
      <div class="grid2" style="margin-top:12px"><div class="card" style="padding:12px"><div class="dim" style="font-size:12px">IF EVEN HALF IS AUTOMATED</div><div class="vt" style="font-size:32px" data-saved></div></div>
      <div class="card" style="padding:12px"><div class="dim" style="font-size:12px">A SYSTEMS BUILD FROM $14,000 PAYS BACK IN</div><div class="vt" style="font-size:32px" data-payback></div></div></div>
      <p class="dim" style="margin:12px 0 0;font-size:12px">Rough math (48 working weeks), not a promise. Want the real numbers? <a href="/contact" data-open="contact">Book an audit.</a></p>`;
    r.addEventListener('input', (e) => { const k = e.target.dataset.key; if (!k) return; v[k] = Number(e.target.value); update(); });
    update();
  }
  return { open: render };
}

// ---------------------------------------------------------------- taskmgr
const PROCS = [
  { id: 'inbox', name: 'inbox_as_crm.exe', cpu: 22, what: 'Leads and client threads living in email and DMs.', fix: 'Replaced by one pipeline every lead lands in.' },
  { id: 'sheet', name: 'spreadsheet_of_truth.xlsx', cpu: 18, what: 'The 40-tab sheet only one person understands.', fix: 'Replaced by clean data and a live dashboard.' },
  { id: 'invoice', name: 'manual_invoicing.exe', cpu: 16, what: 'Invoices typed by hand, payments chased by memory.', fix: 'Replaced by automatic invoices and reminders.' },
  { id: 'copy', name: 'copy_paste_daemon', cpu: 14, what: 'Moving the same data between apps, every day.', fix: 'Replaced by automations that sync it for you.' },
  { id: 'saas', name: 'saas_subscriptions_x11.svc', cpu: 12, what: 'Monthly tools you pay for and barely use.', fix: 'Replaced by a lean stack you own.' },
  { id: 'site', name: 'website_that_doesnt_sell.html', cpu: 10, what: 'A site that looks fine and converts no one.', fix: 'Replaced by a fast site built to bring in customers.' },
];
function taskmgr(ctx) {
  const el = () => ctx.body('taskmgr');
  let ended = {};
  function render() {
    const r = el(); if (!r) return;
    const cpu = Math.min(99, 7 + PROCS.reduce((a, p) => a + (ended[p.id] ? 0 : p.cpu), 0));
    const all = PROCS.every((p) => ended[p.id]);
    r.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><div class="vt" style="font-size:26px">CPU USAGE: ${cpu}%</div><div class="dim" style="font-size:12px">A typical growing business (example)</div></div>
      <div class="meter" style="margin:8px 0 14px"><div style="width:${cpu}%"></div></div>
      <div role="table" aria-label="Processes" style="display:flex;flex-direction:column;gap:8px">${PROCS.map((p) => `<div role="row" class="card" style="padding:10px 12px;display:flex;gap:12px;align-items:center">
        <div role="cell" style="flex:1 1 auto;min-width:0"><div style="font-weight:600;overflow-wrap:anywhere">${p.name}</div><div class="${ended[p.id] ? 'light' : 'dim'}" style="font-size:13px">${ended[p.id] ? p.fix : p.what}</div></div>
        <div role="cell" class="vt" style="font-size:24px;flex:0 0 52px;text-align:right">${ended[p.id] ? 0 : p.cpu}%</div>
        <div role="cell" style="flex:0 0 96px">${ended[p.id] ? '<span class="dim" style="font-size:13px">replaced</span>' : `<button type="button" ${BTN2} data-end="${p.id}" style="width:96px;border-color:var(--amber);font-size:13px">End task</button>`}</div></div>`).join('')}</div>
      ${all ? '<p class="light" style="margin:14px 0 0">All clear. That’s what your week looks like when the systems do the work. <a href="/contact" data-open="contact">Let’s do it for real.</a></p>' : ''}
      <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button type="button" ${BTN2} data-endall style="border-color:var(--amber)">End all</button><button type="button" ${BTN2} data-reset>Reset</button></div>`;
  }
  function bind() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.end) { ctx.beep(260, 0.08); ended[b.dataset.end] = true; render(); }
      else if (b.hasAttribute('data-endall')) { ctx.beep(200, 0.2); PROCS.forEach((p) => { ended[p.id] = true; }); render(); }
      else if (b.hasAttribute('data-reset')) { ended = {}; render(); }
    });
  }
  return { open() { bind(); render(); } };
}

// ---------------------------------------------------------------- defrag
const CASES = {
  laury: { title: 'Art by Laury', before: [30, 46, 72, 44], after: [74, 58, 10, 50],
    beforeText: 'A painter with large originals, print vendors to evaluate, payments, photography and a business to register. Nothing connected.',
    afterText: 'One storefront: Sanity catalog to Stripe checkout to print-on-demand fulfillment, color-calibrated photos, no monthly platform fee. Result: $0 a month in platform fees, and print orders ship without anyone touching them.' },
  crm: { title: 'Zero-Friction CRM', before: [24, 40, 84, 44], after: [70, 62, 8, 52],
    beforeText: 'The usual small-business pipeline: deals in a spreadsheet, follow-ups in someone’s head, and a CRM subscription full of unused features.',
    afterText: 'One file that runs offline: Kanban pipeline, auto-save, stale-deal alerts, analytics, CSV in and out, PDF invoices. Zero subscription.' },
  nune: { title: 'NUNE / Afternune', before: [16, 30, 90, 56], after: [66, 56, 14, 56],
    beforeText: 'A coffee brand idea with every open question at once: product, packaging, vendors, pricing, payments, and one founder to run it.',
    afterText: 'Brand architecture, product line, packaging and vendor research, subscription unit economics, payment rails and an AI operating structure for running solo.' },
};
const COLORS = ['#FFB547', '#FFE2B0', '#A8742A', '#3A2810'];
function defrag(ctx) {
  const el = () => ctx.body('defrag');
  let id = 'laury', blocks = [], pos = 0, running = false, done = false, t = null, cells = [];
  const make = (cid) => {
    const arr = []; CASES[cid].before.forEach((n, ty) => { for (let i = 0; i < n; i++) arr.push(ty); });
    let r = cid.length * 7919 + 13;
    for (let i = arr.length - 1; i > 0; i--) { r = (r * 9301 + 49297) % 233280; const j = Math.floor((r / 233280) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  };
  const target = (cid) => { const arr = []; CASES[cid].after.forEach((n, ty) => { for (let i = 0; i < n; i++) arr.push(ty); }); return arr; };
  function paint() { cells.forEach((c, i) => { c.style.background = COLORS[blocks[i]]; }); }
  function status() {
    const r = el();
    r.querySelector('[data-run]').textContent = running ? 'Defragmenting...' : done ? 'Reset' : 'Defragment';
    r.querySelector('[data-status]').textContent = running ? `${Math.round(pos / blocks.length * 100)}% complete` : done ? 'Defragmentation complete.' : 'Fragmented. Press Defragment.';
    r.querySelector('[data-before]').textContent = CASES[id].beforeText;
    r.querySelector('[data-after]').textContent = CASES[id].afterText;
    r.querySelectorAll('[data-case]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.case === id)));
  }
  function pick(cid) { clearInterval(t); id = cid; blocks = make(cid); pos = 0; running = false; done = false; paint(); status(); }
  function run() {
    if (running) return;
    if (done) { pick(id); return; }
    const tgt = target(id); running = true; status();
    t = setInterval(() => {
      for (let n = 0; n < 2 && pos < blocks.length; n++, pos++) { blocks[pos] = tgt[pos]; cells[pos].style.background = COLORS[tgt[pos]]; }
      if (pos % 24 === 0) ctx.beep(300 + pos * 3, 0.02);
      if (pos >= blocks.length) { clearInterval(t); running = false; done = true; ctx.beep(880, 0.15); }
      status();
    }, 22);
  }
  function build() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    const sw = (c, l, extra = '') => `<span><span style="display:inline-block;width:10px;height:10px;background:${c};${extra}"></span> ${l}</span>`;
    r.innerHTML = `<div role="group" aria-label="Case study" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${Object.entries(CASES).map(([k, c]) => `<button type="button" class="tbtn" data-case="${k}">${esc(c.title)}</button>`).join('')}</div>
      <div class="defrag-grid" aria-hidden="true"></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:12px">${sw(COLORS[0], 'connected systems')}${sw(COLORS[1], 'clean data')}${sw(COLORS[2], 'manual work')}${sw(COLORS[3], 'free capacity', 'border:1px solid var(--dim)')}</div>
      <div style="display:flex;align-items:center;gap:12px;margin:12px 0;flex-wrap:wrap"><button type="button" ${BTN} data-run></button><span class="vt" style="font-size:24px" data-status></span></div>
      <div class="grid2"><div class="card" style="padding:12px"><div class="dim" style="font-size:12px">BEFORE</div><div data-before></div></div><div class="card" style="padding:12px;border-color:var(--amber)"><div class="dim" style="font-size:12px">AFTER</div><div data-after></div></div></div>`;
    const grid = r.querySelector('.defrag-grid');
    cells = Array.from({ length: 192 }, () => { const d = document.createElement('div'); grid.appendChild(d); return d; });
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.case) pick(b.dataset.case); else if (b.hasAttribute('data-run')) run();
    });
    pick('laury');
  }
  return { open: build, close() { if (running) { clearInterval(t); running = false; status(); } } };
}

// ---------------------------------------------------------------- terminal
function terminal(ctx) {
  const el = () => ctx.body('terminal');
  let out, input, scroller;
  const PRICES = ['Systems Audit .................... from $2,500', 'Launch-in-a-Box .................. from $9,000', 'SaaS De-Bloat & Systems Rebuild .. from $14,000', 'Business systems, end to end ..... from $14,000', 'AI agents & automation ........... from $8,500', 'Websites, e-commerce & POD ....... from $9,000', 'Growth: SEO & ads ................ from $3,000/mo', 'Fractional operations partner .... from $6,000/mo'];
  const OPEN = { services: 'services', work: 'work', experience: 'experience', about: 'about', contact: 'contact', diagnose: 'diagnose', 'diagnose.exe': 'diagnose', calc: 'calc', chaos_calc: 'calc', 'chaos_calc.exe': 'calc', taskmgr: 'taskmgr', 'taskmgr.exe': 'taskmgr', defrag: 'defrag', 'defrag.exe': 'defrag', recycle: 'recycle', bin: 'recycle', estimate: 'estimate', 'estimate.exe': 'estimate', inbox: 'inbox', 'inbox.exe': 'inbox' };
  const later = (k, ms = 200) => setTimeout(() => ctx.openWin(k), ms);
  function print(lines) {
    lines.forEach((l) => { const d = document.createElement('div'); d.className = 'ln'; d.textContent = l; out.appendChild(d); });
    while (out.childElementCount > 300) out.firstChild.remove();
    scroller.scrollTop = scroller.scrollHeight;
  }
  function run(raw) {
    const cmd = raw.trim(), lc = cmd.toLowerCase();
    let o = [];
    if (lc === '') o = [];
    else if (lc === 'help') o = ['Commands:', '  whoami          who runs this machine', '  ls              list the desktop', '  open <name>     open a window (e.g. open work)', '  services        what I build', '  skills          everything I do', '  stream          where I go live', '  prices          starting prices', '  diagnose        run a systems health scan', '  estimate        ballpark a project', '  specs           machine specs', '  hire nick       start a project', '  date, uptime, echo <text>, clear, exit', '  ...and a few hidden ones.'];
    else if (lc === 'whoami') o = ['visitor', 'But this machine belongs to Nick Day: I build the systems that let businesses grow.', 'SF Bay Area. Operations, automation, websites and custom tools.'];
    else if (lc === 'ls' || lc === 'dir' || lc === 'ls -la') o = ['services/  work/  experience/  about/  contact/', 'diagnose.exe  chaos_calc.exe  taskmgr.exe  defrag.exe  estimate.exe  inbox.exe  Recycle Bin'];
    else if (/^(open |cd |\.\/)/.test(lc)) {
      const name = lc.replace(/^open\s+|^cd\s+|^\.\//, '').replace(/^\.\//, '').replace(/\/$/, '');
      if (OPEN[name]) { o = [`opening ${name} ...`]; later(OPEN[name]); } else o = [`no such file: ${name}. Try "ls".`];
    }
    else if (lc === 'services') o = ['PACKAGES', '  Launch-in-a-Box (starting clean)', '  SaaS De-Bloat & Systems Rebuild (cleaning up)', 'SERVICES', '  01  Business systems, end to end', '  02  AI agents & automation', '  03  Websites, e-commerce & print-on-demand', '  04  Growth: SEO & ads', '  05  Fractional operations partner', 'Type "prices" or "open services".'];
    else if (lc === 'prices' || lc === 'pricing') o = PRICES.concat(['Starting points. Every project is scoped after the audit.']);
    else if (lc === 'skills') o = ['Systems · automation & agents · web & e-commerce · print-on-demand', 'SEO & ads · data analysis · CRM & sales ops · streaming production'];
    else if (lc === 'stream' || lc === 'twitch') o = ['Live DJ sets and build sessions on twitch.tv/lunch00', 'Production: OBS + Streamer.bot', 'Record: 30 days straight.'];
    else if (lc === 'specs' || lc === 'neofetch') o = ['NICK-PC (custom build, assembled by hand)', '  CPU ....... 1x human, overclocked on single-origin coffee', '  GPU ....... renders one more match at unlimited fps', '  RAM ....... remembers every client requirement; forgets where the keys are', '  Storage ... 2 TB of drum & bass, 4 GB free', '  Cooling ... two dogs (unreliable)', '  PSU ....... Tao Te Ching, 81 chapters', '  Uptime .... 30 days straight on Twitch'];
    else if (lc === 'diagnose') { o = ['launching diagnose.exe ...']; later('diagnose'); }
    else if (lc === 'estimate') { o = ['launching estimate.exe ...']; later('estimate'); }
    else if (lc === 'inbox' || lc === 'mail') { o = ['opening inbox.exe ...']; later('inbox'); }
    else if (['play', 'snake', 'scopecreep', 'scope creep', 'game'].includes(lc)) { o = ['You found it.', 'launching scopecreep.exe ...']; later('game', 250); }
    else if (['hire', 'hire nick', 'hire me'].includes(lc)) { o = ['Excellent choice.', 'opening ./contact ...']; later('contact', 300); }
    else if (lc === 'date') o = [new Date().toString()];
    else if (lc === 'uptime') { const s = ctx.uptime(); o = [`up ${Math.floor(s / 60)} min ${s % 60} sec, 1 visitor`]; }
    else if (lc.startsWith('echo ')) o = [cmd.slice(5)];
    else if (lc === 'clear' || lc === 'cls') { out.textContent = ''; return; }
    else if (lc === 'exit' || lc === 'quit') { ctx.closeWin('terminal'); return; }
    else if (lc === 'sudo roast coffee' || lc === 'roast coffee') o = ['[sudo] password for visitor: ********', 'Loading Ethiopian Yirgacheffe into the Behmor ...', 'First crack. Dropping at a light-medium roast.', 'Rest 10–14 days before brewing. Patience is a system too.'];
    else if (lc === 'play dnb' || lc === 'play music') o = ['Sound system is warming up.', 'Catch live drum & bass sets at twitch.tv/lunch00'];
    else if (lc.includes('rm -rf')) o = ['Nice try.', 'I do that to bloated tech stacks, not to this machine.'];
    else if (lc === 'sudo' || lc.startsWith('sudo ')) o = ['visitor is not in the sudoers file. This incident will be reported.', '(to Nick, who will find it funny)'];
    else if (['black belt', 'hwa rang do', 'kick'].includes(lc)) o = ['2nd dan, Hwa Rang Do.', 'Rule one: stay calm under pressure. Rule two: see rule one.'];
    else if (['hello', 'hi', 'hey'].includes(lc)) o = ['Hey. Type "help", or skip ahead with "hire nick".'];
    else if (lc === 'coffee') o = ['Try: sudo roast coffee'];
    else o = [`command not found: ${cmd}`, 'Type "help" for a list of commands.'];
    ctx.beep(900, 0.02);
    print([`visitor@nick.os:~$ ${cmd}`].concat(o));
  }
  function build() {
    const r = el(); if (!r) return;
    if (!r.dataset.bound) {
      r.dataset.bound = '1';
      scroller = r.parentElement;
      r.innerHTML = `<div data-out></div><form data-form style="display:flex;gap:8px;align-items:center"><label for="tin" class="light" style="white-space:nowrap">visitor@nick.os:~$</label><input id="tin" autocomplete="off" spellcheck="false" autocapitalize="off" enterkeyhint="go"></form>`;
      out = r.querySelector('[data-out]'); input = r.querySelector('#tin');
      print(['NICK.OS terminal v1.0', 'Type "help" to see what this machine can do.']);
      r.querySelector('[data-form]').addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
      scroller.addEventListener('click', () => { const sel = window.getSelection && String(window.getSelection()); if (!sel) input.focus({ preventScroll: true }); });
    }
    scroller.scrollTop = scroller.scrollHeight;
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }
  return { open: build };
}

// ---------------------------------------------------------------- estimate
const EST = [
  { id: 'launch', title: 'Launch-in-a-Box', note: 'Starting clean: domain, site, payments or booking, handoff docs', price: 9000 },
  { id: 'debloat', title: 'SaaS De-Bloat & Systems Rebuild', note: 'Cleaning up: migrate off bloated tools to a lean stack you own', price: 14000 },
  { id: 'systems', title: 'Business systems, end to end', note: 'Connected ops backbone, data in one place, SOPs', price: 14000 },
  { id: 'agents', title: 'AI agents & automation', note: 'Agents and scripts for the repetitive work', price: 8500 },
  { id: 'web', title: 'Websites, e-commerce & print-on-demand', note: 'Fast site or store, POD wired into checkout', price: 9000 },
  { id: 'seo', title: 'Growth: SEO & ads', note: 'Get found and get customers', price: 3000, monthly: true },
  { id: 'frac', title: 'Fractional operations partner', note: 'Ongoing ops, automation and growth partner', price: 6000, monthly: true },
];
const TEAMS = [['solo', 'Just me', 1], ['small', '2-10 people', 1.15], ['mid', '11-50', 1.35], ['large', '50+', 1.6]];
function estimate(ctx) {
  const el = () => ctx.body('estimate');
  let sel = {}, team = 'solo';
  const r500 = (n) => Math.round(n / 500) * 500;
  function calcOut() {
    const t = TEAMS.find((x) => x[0] === team);
    let one = 0, mon = 0; const notes = [], picked = [];
    EST.forEach((it) => {
      if (!sel[it.id]) return;
      picked.push(it.title);
      if (it.monthly) { mon += it.price; return; }
      if (it.id === 'web' && sel.launch) { notes.push('Your website is already included in Launch-in-a-Box.'); return; }
      if (it.id === 'systems' && sel.debloat) { one += it.price / 2; notes.push('De-Bloat and Business systems overlap, so they are combined.'); return; }
      one += it.price;
    });
    const low = r500(one * t[2]), high = r500(low * 1.5);
    if (picked.length && t[2] > 1) notes.push('Larger teams mean more people, data and tools to connect, so the range scales up.');
    const range = one > 0 ? `${fmt(low)} – ${fmt(high)}` : mon > 0 ? 'Monthly only' : 'Pick something';
    const monthly = mon > 0 ? `+ from ${fmt(mon)}/mo ongoing` : one > 0 ? 'one-time' : 'Tick what you need above';
    return { range, monthly, notes, picked, team: t[1] };
  }
  function update() {
    const r = el(), o = calcOut();
    r.querySelector('[data-range]').textContent = o.range;
    r.querySelector('[data-monthly]').textContent = o.monthly;
    const n = r.querySelector('[data-notes]'); n.textContent = '';
    o.notes.forEach((t) => { const p = document.createElement('p'); p.className = 'dim'; p.style.cssText = 'margin:8px 0 0;font-size:13px'; p.textContent = '> ' + t; n.appendChild(p); });
    r.querySelectorAll('[data-team]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.team === team)));
  }
  function build() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    r.innerHTML = `<p class="light" style="margin:0 0 12px">What do you need? Tick everything that applies and get a ballpark in seconds.</p>
      <div style="display:flex;flex-direction:column;gap:6px">${EST.map((it) => `<label class="opt"><input type="checkbox" data-item="${it.id}" style="accent-color:var(--amber);width:18px;height:18px;margin-top:2px;flex:0 0 auto"><span style="flex:1 1 auto"><b>${esc(it.title)}</b><br><span class="dim" style="font-size:13px">${esc(it.note)}</span></span><span class="light" style="white-space:nowrap;font-size:13px">from ${fmt(it.price)}${it.monthly ? '/mo' : ''}</span></label>`).join('')}</div>
      <div style="margin-top:14px"><div style="margin-bottom:6px">Team size</div><div role="group" aria-label="Team size" style="display:flex;gap:6px;flex-wrap:wrap">${TEAMS.map((t) => `<button type="button" class="tbtn" data-team="${t[0]}">${t[1]}</button>`).join('')}</div></div>
      <div style="border:2px solid var(--amber);padding:16px;margin-top:16px;text-align:center"><div class="dim" style="font-size:12px">BALLPARK ESTIMATE</div><div class="vt" style="font-size:44px;line-height:1.05" data-range></div><div class="light" data-monthly></div></div>
      <div data-notes></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button type="button" ${BTN} data-send>SEND THIS SCOPE TO NICK &gt;</button><button type="button" ${BTN2} data-reset>Reset</button></div>
      <p class="dim" style="margin:12px 0 0;font-size:12px">Built from my starting prices. A ballpark, not a quote: real numbers come from the Systems Audit (from $2,500).</p>`;
    r.addEventListener('change', (e) => { const k = e.target.dataset.item; if (!k) return; ctx.beep(800, 0.02); sel[k] = e.target.checked; update(); });
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.team) { team = b.dataset.team; update(); }
      else if (b.hasAttribute('data-reset')) { sel = {}; team = 'solo'; r.querySelectorAll('[data-item]').forEach((c) => { c.checked = false; }); update(); }
      else if (b.hasAttribute('data-send')) {
        const o = calcOut();
        if (o.picked.length) ctx.setScope(`Scope: ${o.picked.join(', ')}\nTeam: ${o.team}\nBallpark: ${o.range}${o.monthly.startsWith('+') ? ' ' + o.monthly : ''}`);
        ctx.openWin('contact');
      }
    });
    update();
  }
  return { open: build };
}

// ---------------------------------------------------------------- inbox
const MSGS = [
  { from: 'Nick Day', subject: 'Founding client program', offer: true, body: ['I’m opening a small number of founding-client spots.', 'You get a reduced rate on any package or service. In return, I get a testimonial and permission to write up the results as a case study for this inbox.', 'Same scope, same care, same ownership of everything I build. Spots are limited, so ask early.'] },
  { from: 'Your business', subject: 'Your testimonial goes here', offer: false, body: ['This inbox is where real client reviews will live.', 'None of them are made up, so for now it’s quiet. Want to be the first message here? Ask about a founding spot.'] },
];
function inbox(ctx) {
  const el = () => ctx.body('inbox');
  let cur = 0;
  function render() {
    const r = el(); if (!r) return;
    const m = MSGS[cur];
    r.innerHTML = `<div style="display:flex;flex-wrap:wrap;margin:-20px">
      <div role="list" aria-label="Messages" style="flex:1 1 200px;min-width:0;border-right:1px solid var(--dim)">${MSGS.map((x, i) => `<button type="button" class="tbtn" data-msg="${i}" aria-pressed="${i === cur}" style="display:block;width:100%;text-align:left;padding:10px 12px;border:0;border-bottom:1px solid var(--deep);white-space:normal;min-height:0"><span style="font-size:12px;opacity:.8">${esc(x.from)}</span><br><b>${esc(x.subject)}</b></button>`).join('')}</div>
      <div style="flex:999 1 300px;min-width:0;padding:16px 18px"><div class="dim" style="font-size:12px">FROM: ${esc(m.from)}</div><h3 class="vt" style="margin:4px 0 10px;font-size:28px;line-height:1.1">${esc(m.subject)}</h3>
      ${m.body.map((p) => `<p style="margin:0 0 10px">${esc(p)}</p>`).join('')}
      ${m.offer ? `<button type="button" ${BTN} data-apply style="margin-top:4px">ASK ABOUT A FOUNDING SPOT &gt;</button>` : ''}</div></div>`;
  }
  function bind() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.msg) { cur = Number(b.dataset.msg); render(); }
      else if (b.hasAttribute('data-apply')) { ctx.setScope('Founding client inquiry'); ctx.openWin('contact'); }
    });
  }
  return { open() { bind(); render(); } };
}

// ---------------------------------------------------------------- recycle
const BIN = [
  ['unused_saas_subscriptions (x6)', 'Hundreds a month for tools nobody opens'],
  ['duplicate_crm_2.exe', 'The second CRM someone started "just for now"'],
  ['MASTER_tracker_FINAL_v7.xlsx', '47 tabs, three different totals'],
  ['automation_chain_nobody_understands.zap', '14 steps, breaks quietly every few weeks'],
  ['welcome_email_sent_by_hand.txt', 'Copy, paste, change the name, send. Every time.'],
  ['old_website_backup_OLD_final.zip', 'Still on the hosting bill'],
];
function recycle(ctx) {
  const el = () => ctx.body('recycle');
  let empty = false;
  const fileIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"></path></svg>';
  function render() {
    const r = el(); if (!r) return;
    r.innerHTML = empty
      ? `<div class="vt" style="font-size:30px;line-height:1.2">&gt; RECYCLE BIN IS EMPTY.<br>&gt; FREED: MONEY, TIME AND ONE SOURCE OF TRUTH.</div>
         <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button type="button" ${BTN} data-open="contact">Clean up my stack &gt;</button><button type="button" ${BTN2} data-restore>Restore</button></div>`
      : `<p class="light" style="margin:0 0 12px">Things that get thrown out of messy setups. Typical finds, not one client’s files.</p>
         <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px">${BIN.map(([n, d]) => `<li style="display:flex;gap:10px">${fileIcon}<div><b>${esc(n)}</b><br><span class="dim">${esc(d)}</span></div></li>`).join('')}</ul>
         <button type="button" ${BTN} data-empty style="margin-top:14px">Empty Recycle Bin</button>`;
  }
  function bind() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-empty')) { ctx.beep(150, 0.3); empty = true; render(); }
      else if (b.hasAttribute('data-restore')) { empty = false; render(); }
    });
  }
  return { open() { bind(); render(); } };
}

// ---------------------------------------------------------------- Scope Creep (hidden: type "play" in the terminal)
const REQUESTS = ['"quick tweak"', '"one more page"', '"can it also do payroll?"', '"make the logo pop"', '"add a chatbot"', '"just a small change"', '"can we go viral?"', '"dark mode, but warmer"', '"integrate with my fax machine"', '"what if it was an app?"', '"move it one pixel left"', '"add blockchain"', '"make it like Amazon"', '"can you also do my taxes?"', '"redo it, but the same"', '"need it by Friday"', '"put AI in it"', '"my nephew had an idea"', '"can it print?"', '"one last revision"', '"make it pop more"', '"what about the metaverse?"'];
const N = 20, TARGET = 25;
function game(ctx) {
  const el = () => ctx.body('game');
  let g = null, timer = null, nextDir = null, best = 0, board = [], shared = false, cvs, c2d, ui = {};
  try { best = Number(localStorage.getItem('nickos-best')) || 0; } catch (e) { /* storage off */ }

  const fresh = () => ({ phase: 'ready', snake: [[10, 10], [9, 10], [8, 10]], dir: [1, 0], food: [15, 10], score: 0, req: 0, won: false, saved: false });
  function food(snake) {
    for (let i = 0; i < 400; i++) { const f = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; if (!snake.some((p) => p[0] === f[0] && p[1] === f[1])) return f; }
    return [0, 0];
  }
  function draw() {
    if (!c2d) return;
    const s = cvs.width / N;
    c2d.fillStyle = '#0E0904'; c2d.fillRect(0, 0, cvs.width, cvs.height);
    c2d.strokeStyle = 'rgba(168,116,42,.15)'; c2d.lineWidth = 1;
    for (let i = 1; i < N; i++) { c2d.beginPath(); c2d.moveTo(i * s, 0); c2d.lineTo(i * s, cvs.height); c2d.moveTo(0, i * s); c2d.lineTo(cvs.width, i * s); c2d.stroke(); }
    if (g.phase !== 'ready' && g.food) {
      c2d.fillStyle = '#FFE2B0'; c2d.fillRect(g.food[0] * s + 1, g.food[1] * s + 1, s - 2, s - 2);
      c2d.fillStyle = '#0E0904'; c2d.font = `bold ${Math.floor(s * 0.8)}px monospace`; c2d.textAlign = 'center'; c2d.textBaseline = 'middle';
      c2d.fillText('?', g.food[0] * s + s / 2, g.food[1] * s + s / 2 + 1);
    }
    g.snake.forEach((p, i) => { c2d.fillStyle = i === 0 ? '#FFE2B0' : (i % 2 ? '#FFB547' : '#E8952F'); c2d.fillRect(p[0] * s + 1, p[1] * s + 1, s - 2, s - 2); });
  }
  function hud() {
    ui.score.textContent = g.score;
    ui.best.textContent = Math.max(best, g.score);
    ui.req.textContent = g.phase === 'ready' ? 'Clients are waiting.' : 'Incoming request: ' + REQUESTS[g.req];
    ['ready', 'paused', 'won', 'over'].forEach((ph) => { ui[ph].hidden = g.phase !== ph; });
    if (g.phase === 'over') {
      ui.overScore.textContent = g.score;
      ui.saveForm.hidden = g.saved || g.score <= 0;
      ui.reward2.hidden = g.score < TARGET;
    }
  }
  function speed() { clearInterval(timer); timer = setInterval(step, Math.max(65, 150 - g.score * 3)); }
  function start() {
    clearInterval(timer);
    g = fresh(); g.phase = 'playing'; g.food = food(g.snake); nextDir = null;
    ui.savedMsg.hidden = true;
    ctx.beep(520, 0.08); speed(); draw(); hud();
    setTimeout(() => ui.boardEl.focus({ preventScroll: true }), 30);
  }
  function pause() {
    if (g.phase === 'playing') { clearInterval(timer); g.phase = 'paused'; hud(); }
    else if (g.phase === 'paused' || g.phase === 'won') resume();
  }
  function resume() { g.phase = 'playing'; speed(); hud(); setTimeout(() => ui.boardEl.focus({ preventScroll: true }), 30); }
  function turn(dx, dy) {
    if (g.phase === 'ready' || g.phase === 'over') start();
    else if (g.phase === 'paused') resume();
    else if (g.phase === 'won') return;
    const cur = nextDir || g.dir;
    if (cur[0] === -dx && cur[1] === -dy) return;
    nextDir = [dx, dy];
  }
  function step() {
    if (g.phase !== 'playing') return;
    const dir = nextDir || g.dir; nextDir = null; g.dir = dir;
    const head = [g.snake[0][0] + dir[0], g.snake[0][1] + dir[1]];
    const hit = head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || g.snake.slice(0, -1).some((p) => p[0] === head[0] && p[1] === head[1]);
    if (hit) {
      clearInterval(timer); ctx.beep(140, 0.4);
      if (g.score > best) { best = g.score; try { localStorage.setItem('nickos-best', String(best)); } catch (e) { /* */ } }
      g.phase = 'over'; draw(); hud(); return;
    }
    const ate = head[0] === g.food[0] && head[1] === g.food[1];
    g.snake = [head].concat(ate ? g.snake : g.snake.slice(0, -1));
    if (ate) {
      g.score += 1; g.req = (g.req + 1) % REQUESTS.length; g.food = food(g.snake);
      ctx.beep(660 + (g.score % 8) * 40, 0.05);
      if (g.score === TARGET && !g.won) { clearInterval(timer); g.won = true; g.phase = 'won'; ctx.beep(880, 0.3); draw(); hud(); return; }
      speed();
    }
    draw(); hud();
  }
  function renderBoard() {
    ui.list.textContent = '';
    board.forEach((r) => {
      const li = document.createElement('li'); li.style.cssText = 'display:flex;justify-content:space-between;gap:10px';
      const a = document.createElement('span'); a.textContent = r.name;
      const b = document.createElement('span'); b.className = 'light'; b.textContent = r.score;
      li.append(a, b); ui.list.appendChild(li);
    });
    ui.empty.hidden = board.length > 0;
    ui.note.textContent = shared ? 'Shared high-score board.' : 'High scores saved on this device.';
  }
  function loadLocal() { try { const rows = JSON.parse(localStorage.getItem('nickos-scores') || '[]'); return Array.isArray(rows) ? rows.slice(0, 10) : []; } catch (e) { return []; } }
  async function loadBoard() {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      if (res.ok && data.shared) { board = data.scores || []; shared = true; renderBoard(); return; }
    } catch (e) { /* offline or no API */ }
    board = loadLocal(); shared = false; renderBoard();
  }
  async function save(e) {
    e.preventDefault();
    if (g.saved || g.score <= 0) return;
    const name = ui.name.value.replace(/[^A-Za-z0-9 ._-]/g, '').trim().slice(0, 12) || 'Anonymous';
    g.saved = true; hud();
    let ok = false;
    if (shared) {
      try { const res = await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, score: g.score }) }); const d = await res.json(); if (res.ok && d.ok) { ok = true; board = d.scores || board; } } catch (ex) { /* fall back */ }
    }
    if (!ok) {
      try { board = loadLocal().concat([{ name, score: g.score }]).sort((a, b) => b.score - a.score).slice(0, 10); localStorage.setItem('nickos-scores', JSON.stringify(board)); } catch (ex) { /* */ }
      if (shared) shared = false;
    }
    ui.savedMsg.textContent = ok ? 'Saved to the shared high-score board.' : 'Saved to the high-score board on this device.';
    ui.savedMsg.hidden = false;
    renderBoard();
  }
  function build() {
    const r = el(); if (!r || r.dataset.bound) return; r.dataset.bound = '1';
    const reward = `<div style="border:1px solid var(--amber);padding:10px;text-align:left;font-size:13px;width:100%"><div class="light" style="font-weight:600">Your rewards</div>
      <div style="margin-top:4px">1. <a href="/files/SaaS-Bloat-Checklist.pdf" target="_blank" rel="noopener">The SaaS Bloat Checklist (PDF)</a>: 12 signs your tools cost more than they save.</div>
      <div style="margin-top:4px">2. A free 20-minute systems roast. Mention your score when you book and the first call is on me. <button type="button" class="lnk" data-claim>Claim it</button></div></div>`;
    r.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:8px"><span class="vt" style="font-size:24px">REQUESTS: <span data-score>0</span></span><span class="vt" style="font-size:24px">BEST: <span data-best>0</span></span></div>
      <div class="board" tabindex="0" role="application" aria-label="Scope Creep game board. Use the arrow keys or WASD to move, space to pause.">
        <canvas width="400" height="400"></canvas>
        <div class="overlay" data-ph="ready"><div class="vt" style="font-size:44px;line-height:1">SCOPE CREEP</div><div>Every request you eat makes the project longer. Hit a wall or yourself and the project goes over budget.</div><div class="dim" style="font-size:13px">Arrow keys or WASD to move · Space to pause · Reach ${TARGET} for a secret</div><button type="button" ${BTN} data-start>START &gt;</button></div>
        <div class="overlay" data-ph="paused" hidden><div class="vt" style="font-size:40px">PAUSED</div><button type="button" ${BTN} data-resume>RESUME</button></div>
        <div class="overlay top" data-ph="won" hidden><div class="vt" style="font-size:38px;line-height:1">SCOPE MASTERED</div><div style="text-align:left;font-size:13px;border-left:2px solid var(--amber);padding-left:10px">You handled ${TARGET} requests without blowing the budget. Most projects die at five. A message from Nick: if you have the patience for this, you have the patience to fix your systems. Let’s do it properly, with a real scope.</div>${reward}<button type="button" ${BTN} data-resume>KEEP GOING &gt;</button></div>
        <div class="overlay top" data-ph="over" hidden><div class="vt" style="font-size:36px;line-height:1">PROJECT OVER BUDGET.</div><div>You accepted <span data-over-score>0</span> unscoped requests. This is why every project starts with an audit.</div>
          <form data-save style="display:flex;gap:8px;width:100%;max-width:300px"><label for="gname" class="sr-only">Your name for the high-score board</label><input id="gname" class="field" maxlength="12" placeholder="Your name" autocomplete="off" style="flex:1 1 auto;min-width:0"><button type="submit" ${BTN2}>Save</button></form>
          <div class="light" style="font-size:13px" data-saved hidden></div>
          <div data-reward2 hidden style="width:100%">${reward}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button type="button" ${BTN} data-start>PLAY AGAIN</button><button type="button" ${BTN2} data-open="contact">Book an audit</button></div></div>
      </div>
      <div class="light" style="text-align:center;margin-top:8px;min-height:22px;font-size:13px" data-req></div>
      <div class="dpad" aria-label="Direction controls"><span></span><button type="button" ${BTN2} data-dir="0,-1" aria-label="Up">&#9650;</button><span></span><button type="button" ${BTN2} data-dir="-1,0" aria-label="Left">&#9664;</button><button type="button" ${BTN2} data-pause aria-label="Pause">II</button><button type="button" ${BTN2} data-dir="1,0" aria-label="Right">&#9654;</button><span></span><button type="button" ${BTN2} data-dir="0,1" aria-label="Down">&#9660;</button><span></span></div>
      <h3 class="vt" style="margin:16px 0 6px;font-size:26px;font-weight:400">HIGH SCORES</h3><ol style="margin:0;padding-left:26px" data-list></ol><p class="dim" style="margin:0;font-size:13px" data-empty>No scores yet. Be the first.</p><p class="dim" style="margin:6px 0 0;font-size:12px" data-note></p>`;
    const q = (s) => r.querySelector(s);
    ui = { score: q('[data-score]'), best: q('[data-best]'), req: q('[data-req]'), boardEl: q('.board'), ready: q('[data-ph=ready]'), paused: q('[data-ph=paused]'), won: q('[data-ph=won]'), over: q('[data-ph=over]'),
      overScore: q('[data-over-score]'), saveForm: q('[data-save]'), name: q('#gname'), savedMsg: q('[data-saved]'), reward2: q('[data-reward2]'), list: q('[data-list]'), empty: q('[data-empty]'), note: q('[data-note]') };
    cvs = q('canvas'); c2d = cvs.getContext('2d');
    g = fresh();
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    ui.boardEl.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (k) { e.preventDefault(); turn(k[0], k[1]); }
      else if (e.key === ' ') { e.preventDefault(); if (g.phase === 'ready') start(); else pause(); }
    });
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-start')) start();
      else if (b.hasAttribute('data-resume')) resume();
      else if (b.hasAttribute('data-pause')) pause();
      else if (b.dataset.dir) { const [dx, dy] = b.dataset.dir.split(',').map(Number); turn(dx, dy); }
      else if (b.hasAttribute('data-claim')) { ctx.setScope(`Scope Creep score: ${g.score} — claiming the free 20-minute systems roast`); ctx.openWin('contact'); }
    });
    ui.saveForm.addEventListener('submit', save);
    draw(); hud(); loadBoard();
  }
  return {
    open() { build(); },
    close() { if (g && g.phase === 'playing') { clearInterval(timer); g.phase = 'paused'; hud(); } },
    playing() { return !!g && g.phase === 'playing'; },
  };
}
