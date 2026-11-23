// GET  /api/scores  ->  top 10 Scope Creep scores
// POST /api/scores  ->  { name, score } adds a score
// Needs a KV namespace bound as SCORES (Cloudflare Pages > Settings > Bindings).
// Without it, the game falls back to saving scores on each visitor's device.

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const KEY = 'top';
const MAX_SCORE = 397; // a 20x20 board can't hold more

async function readTop(env) {
  try { const rows = JSON.parse((await env.SCORES.get(KEY)) || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; }
}

export async function onRequestGet({ env }) {
  if (!env.SCORES) return json({ shared: false, scores: [] });
  const rows = await readTop(env);
  return json({ shared: true, scores: rows.slice(0, 10).map(({ name, score }) => ({ name, score })) });
}

export async function onRequestPost({ request, env }) {
  if (!env.SCORES) return json({ ok: false, error: 'No shared board yet.' }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }
  const name = String(data.name ?? '').replace(/[^A-Za-z0-9 ._-]/g, '').trim().slice(0, 12) || 'Anonymous';
  const score = Math.floor(Number(data.score));
  if (!Number.isFinite(score) || score < 1 || score > MAX_SCORE) return json({ ok: false }, 400);

  // One save per visitor per minute.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const rl = `rl:${ip}`;
  if (await env.SCORES.get(rl)) return json({ ok: false, error: 'Slow down.' }, 429);
  await env.SCORES.put(rl, '1', { expirationTtl: 60 });

  const rows = (await readTop(env)).concat([{ name, score, at: Date.now() }]).sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 50);
  await env.SCORES.put(KEY, JSON.stringify(rows));
  return json({ ok: true, scores: rows.slice(0, 10).map(({ name: n, score: s }) => ({ name: n, score: s })) });
}
