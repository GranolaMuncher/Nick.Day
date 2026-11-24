# nick.day — NICK.OS

Nicholas Day's portfolio site: a retro amber-CRT "operating system" where pages open as windows, plus plain-text pages for search engines and readers in a hurry.

- **Stack:** Astro (static) served by a Cloudflare Worker (static assets), with two API routes in `worker/` for the contact form (Resend) and the Scope Creep high-score board (Cloudflare KV). Config: `wrangler.jsonc`.
- **Pages:** `/` (the desktop), `/services`, `/work`, `/experience`, `/about`, `/contact`, and a custom 404. Deep links open a window directly, e.g. `nick.day/#work`.

## Edit the site

| To change | Edit |
| --- | --- |
| Email, links, reply time, booking line, client-spots counter, screensaver delay | `src/data/site.js` |
| Services and prices | `src/components/Services.astro` (also the price lists in `src/scripts/apps.js`: terminal `prices` and `estimate.exe`) |
| Work, Experience, About | `src/components/*.astro` |
| Desktop apps, terminal commands, Scope Creep | `src/scripts/apps.js` |
| Contact form and high-score API | `worker/` |
| Windows, boot screen, taskbar, screensaver | `src/scripts/os.js`, `src/pages/index.astro` |
| Look and feel | `src/styles/global.css` |
| CV, checklist PDFs, photo | `public/files/`, `public/images/` |

Each content component is used twice: as a desktop window and as its plain-text page, so you only edit it once.

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
```

## Go live (one-time setup)

1. **Domain:** nick.day is registered with Cloudflare, so DNS is already there.
2. **Create the Worker from Git.** Cloudflare dashboard → Workers & Pages → Create application → Import a repository → `GranolaMuncher/Nick.Day`.
   - Project name: `nick-day` (must match `name` in `wrangler.jsonc`) · Build command: `npm run build` · Deploy command: `npx wrangler deploy`
   - No variables needed in the dashboard: they live in `wrangler.jsonc`.
3. **Connect the domain.** Worker → Settings → Domains & Routes → Add → Custom domain → `nick.day` (and `www.nick.day` if wanted).
4. **High-score board.** Run `npx wrangler kv namespace create nickday-scores`, then add the printed id to `kv_namespaces` in `wrangler.jsonc` (binding `SCORES`) and push. Without it, scores save on each visitor's device.
5. **Contact form email (Resend).**
   - In Resend, add the domain `nick.day` and add the DNS records it shows you in Cloudflare DNS, then click Verify.
   - Create an API key, then run `npx wrangler secret put RESEND_API_KEY` and paste it.
   - `CONTACT_TO` and `CONTACT_FROM` are set in `wrangler.jsonc`. Until the key is set, the form shows a friendly error and points people to your email.
6. **Optional:** Cloudflare Web Analytics.

Every push to `main` rebuilds and redeploys automatically.

## Notes

- Hidden game: type `play` in the terminal. Reaching 25 unlocks the checklist and the free 20-minute systems roast.
- High scores are lightly protected (name cleanup, score cap, one save per visitor per minute). A determined person can still fake a score; you confirm every claim on a call anyway.
- The contact form has a hidden honeypot field to catch basic spam bots. If spam gets through, add Cloudflare Turnstile.
