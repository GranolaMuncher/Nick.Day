// POST /api/contact  ->  emails the inquiry to you through Resend.
// Environment variables (Cloudflare Pages > Settings > Variables and secrets):
//   RESEND_API_KEY  (secret)  your Resend API key
//   CONTACT_TO                where inquiries go, e.g. nicholastday@gmail.com
//   CONTACT_FROM              a sender on your verified Resend domain, e.g. "NICK.OS <hello@nick.day>"

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v, n) => String(v ?? '').replace(/\r/g, '').trim().slice(0, n);
const esc = (v) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'That request didn’t look right.' }, 400);
  }

  // Honeypot: bots fill the hidden "website" field. Pretend it worked.
  if (clean(data.website, 200)) return json({ ok: true });

  const name = clean(data.name, 100);
  const email = clean(data.email, 200);
  const business = clean(data.business, 200);
  const message = clean(data.message, 5000);
  const scope = clean(data.scope, 1000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, error: 'Please add your name, a valid email and a short message.' }, 400);
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    return json({ ok: false, error: 'The contact form isn’t switched on yet.' }, 503);
  }

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    business ? `Business / website: ${business}` : null,
    scope ? `Attached: ${scope}` : null,
    '',
    message,
  ].filter((l) => l !== null);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'NICK.OS <hello@nick.day>',
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `New inquiry from ${name}${business ? ` (${business})` : ''}`,
      text: lines.join('\n'),
      html: `<div style="font-family:monospace;white-space:pre-wrap">${esc(lines.join('\n'))}</div>`,
    }),
  });

  if (!res.ok) return json({ ok: false, error: 'Couldn’t send right now.' }, 502);
  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'Use POST.' }, 405);
}
