# nick.day

Nicholas Day's portfolio site (NICK.OS). Astro static site on Cloudflare Pages; see README.md for structure and setup.

- Content lives in `src/components/*.astro` and is shared by the desktop windows (`src/pages/index.astro`) and the plain-text pages. Edit content once, there.
- Site-wide settings (email, links, client-spots counter) are in `src/data/site.js`.
- Desktop behaviour is vanilla JS: `src/scripts/os.js` (shell) and `src/scripts/apps.js` (apps). No framework.
- Prices appear in three places: `Services.astro`, and in `apps.js` (terminal `prices`, `estimate.exe` items, chaos_calc payback). Keep them in sync.
- Serverless: `functions/api/contact.js` (Resend; env RESEND_API_KEY, CONTACT_TO, CONTACT_FROM) and `functions/api/scores.js` (KV binding SCORES).
- Voice: clear, grounded, practical; no hype or corporate jargon. Never invent stats, testimonials or client results.
- Don't publish Nick's phone number or home city.
- Run `npm run build` before committing.
