# nick.day

Nicholas Day's portfolio site (NICK.OS). Astro static site served by a Cloudflare Worker with static assets (`wrangler.jsonc`); see README.md for structure and setup.

- Content lives in `src/components/*.astro` and is shared by the desktop windows (`src/pages/index.astro`) and the plain-text pages. Edit content once, there.
- Site-wide settings (email, links, client-spots counter) are in `src/data/site.js`.
- Desktop behaviour is vanilla JS: `src/scripts/os.js` (shell) and `src/scripts/apps.js` (apps). No framework.
- Prices appear in three places: `Services.astro`, and in `apps.js` (terminal `prices`, `estimate.exe` items, chaos_calc payback). Keep them in sync.
- Serverless: `worker/index.js` routes `/api/contact` (`worker/contact.js`, Resend; secret RESEND_API_KEY, vars CONTACT_TO/CONTACT_FROM in wrangler.jsonc) and `/api/scores` (`worker/scores.js`, KV binding SCORES). Everything else is served from `dist/`.
- Voice: clear, grounded, practical; no hype or corporate jargon. Never invent stats, testimonials or client results.
- Don't publish Nick's phone number or home city.
- Run `npm run build` before committing.
