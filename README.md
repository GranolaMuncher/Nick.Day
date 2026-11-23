# nick.day — NICK.OS

Nicholas Day's portfolio site: a retro amber-CRT "operating system" where pages open as windows, plus plain-text pages for search engines and readers in a hurry.

- **Stack:** Astro (static) on Cloudflare Pages, with Pages Functions for the contact form (Resend) and the Scope Creep high-score board (Cloudflare KV).
- **Pages:** `/` (the desktop), `/services`, `/work`, `/experience`, `/about`, `/contact`, and a custom 404. Deep links open a window directly, e.g. `nick.day/#work`.

## Edit the site

| To change | Edit |
| --- | --- |
| Email, links, reply time, booking line, client-spots counter, screensaver delay | `src/data/site.js` |
| Services and prices | `src/components/Services.astro` (also the price lists in `src/scripts/apps.js`: terminal `prices` and `estimate.exe`) |
| Work, Experience, About | `src/components/*.astro` |
| Desktop apps, terminal commands, Scope Creep | `src/scripts/apps.js` |
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

1. **Put nick.day on Cloudflare.** If you bought it through Cloudflare Registrar, it's already there. Otherwise add the site in Cloudflare and switch your registrar's nameservers to the two Cloudflare gives you.
2. **Create the Pages project.** Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick `GranolaMuncher/nick.day`.
   - Framework preset: **Astro** · Build command: `npm run build` · Output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. **Connect the domain.** Pages project → Custom domains → add `nick.day` (and `www.nick.day`, which Cloudflare can redirect to `nick.day`).
4. **High-score board.** Workers & Pages → KV → create a namespace (e.g. `nickday-scores`). Pages project → Settings → Bindings → add KV namespace, variable name **`SCORES`**. Redeploy. Without it, scores just save on each visitor's device.
5. **Contact form email (Resend).**
   - In Resend, add the domain `nick.day` and add the DNS records it shows you in Cloudflare DNS (then click Verify).
   - Create an API key.
   - Pages project → Settings → Variables and secrets, for Production:
     - `RESEND_API_KEY` (type: Secret) = your key
     - `CONTACT_TO` = `nicholastday@gmail.com`
     - `CONTACT_FROM` = `NICK.OS <hello@nick.day>`
   - Redeploy. Until this is set, the form shows a friendly error and points people to your email.
6. **Optional:** turn on Cloudflare Web Analytics for the project (privacy-friendly, no cookie banner needed).

Every push to `main` redeploys automatically.

## Notes

- Hidden game: type `play` in the terminal. Reaching 25 unlocks the checklist and the free 20-minute systems roast.
- High scores are lightly protected (name cleanup, score cap, one save per visitor per minute). A determined person can still fake a score; you confirm every claim on a call anyway.
- The contact form has a hidden honeypot field to catch basic spam bots. If spam gets through, add Cloudflare Turnstile.
