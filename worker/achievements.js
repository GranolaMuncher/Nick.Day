// GET  /api/achievements  ->  { shared, visitors, counts: { id: n } }
// POST /api/achievements  ->  { visit: true } counts a new visitor; { id } counts an unlock
// Uses the same KV namespace as the high scores (binding SCORES), under the "ach:" key.
// KV has no atomic increments, so two unlocks landing at the same instant can lose a count.
// That's fine for "found by X%" on a portfolio site.
import { ACH } from '../src/scripts/achievements.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const KEY = 'ach:stats';
const IDS = new Set(ACH.map((a) => a.id));

async function read(env) {
  try {
    const d = JSON.parse((await env.SCORES.get(KEY)) || '{}');
    return { visitors: Number(d.visitors) || 0, counts: d.counts && typeof d.counts === 'object' ? d.counts : {} };
  } catch { return { visitors: 0, counts: {} }; }
}

export async function onRequestGet({ env }) {
  if (!env.SCORES) return json({ shared: false });
  return json({ shared: true, ...(await read(env)) });
}

export async function onRequestPost({ request, env }) {
  if (!env.SCORES) return json({ ok: false }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }
  const what = data.visit === true ? 'visit' : IDS.has(data.id) ? data.id : null;
  if (!what) return json({ ok: false }, 400);

  // Count each visitor (by IP) at most once per thing per day, so refreshing can't pad the numbers.
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const seen = `ach-rl:${ip}:${what}`;
  if (await env.SCORES.get(seen)) return json({ ok: true, counted: false });
  await env.SCORES.put(seen, '1', { expirationTtl: 86400 });

  const s = await read(env);
  if (what === 'visit') s.visitors += 1;
  else s.counts[what] = (Number(s.counts[what]) || 0) + 1;
  await env.SCORES.put(KEY, JSON.stringify(s));
  return json({ ok: true, counted: true });
}
