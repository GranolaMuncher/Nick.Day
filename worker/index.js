// Cloudflare Worker: serves the static site from dist/ and handles the API routes.
import { onRequestPost as contactPost } from './contact.js';
import { onRequestGet as scoresGet, onRequestPost as scoresPost } from './scores.js';
import { onRequestGet as achGet, onRequestPost as achPost } from './achievements.js';

const notAllowed = () => new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return request.method === 'POST' ? contactPost({ request, env }) : notAllowed();
    if (pathname === '/api/scores') {
      if (request.method === 'GET') return scoresGet({ request, env });
      if (request.method === 'POST') return scoresPost({ request, env });
      return notAllowed();
    }
    if (pathname === '/api/achievements') {
      if (request.method === 'GET') return achGet({ request, env });
      if (request.method === 'POST') return achPost({ request, env });
      return notAllowed();
    }
    return env.ASSETS.fetch(request);
  },
};
