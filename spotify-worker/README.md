# FINN — Spotify stats Worker

A tiny Cloudflare Worker that pulls **monthly listeners** and **total track streams**
from Spotify's internal web-player API, caches them for 12h, and serves them as JSON.
Your static GitHub Pages site fetches that JSON and updates the presskit numbers.
If the Worker is ever unreachable or Spotify changes its internal API, the site
silently keeps showing its hardcoded fallback numbers.

> ⚠️ This uses **undocumented** Spotify endpoints. It works today but can break without
> notice. That's expected — the site degrades gracefully. When it breaks, refresh the
> two values below.

## What you need (one-time)

You provide two things the Worker can't hardcode safely:

### 1. `SP_DC` cookie (a secret)
This is what lets the Worker get a Spotify token reliably.
1. Open <https://open.spotify.com> in a browser and **log in**.
2. Open DevTools → **Application** (Chrome) / **Storage** (Firefox) → **Cookies** → `https://open.spotify.com`.
3. Copy the value of the cookie named **`sp_dc`** (a long string).
4. You'll paste it during deploy (step below). It lasts ~1 year; refresh when it expires.

### 2. `QUERY_HASH` (already filled in, but here's how to refresh it)
If stats stop updating (Worker returns `"no artist data (query hash outdated?)"`):
1. Open your artist page: <https://open.spotify.com/artist/7udNzJxaBhqzAsxUJzvt3T>
2. DevTools → **Network** → filter `query` → click the **`queryArtistOverview`** request.
3. In the request URL, find `extensions` → copy the `sha256Hash` value.
4. Paste it into `QUERY_HASH` at the top of `worker.js` and redeploy.

## Deploy (free, no credit card)

```bash
npm install -g wrangler          # Cloudflare's CLI
cd spotify-worker
wrangler login                   # opens browser, create a free account if needed
wrangler secret put SP_DC        # paste your sp_dc cookie when prompted
wrangler deploy
```

`wrangler deploy` prints a URL like:

```
https://finn-spotify-stats.<your-subdomain>.workers.dev
```

## Wire it to the site

Open `js/main.js`, find `SPOTIFY_STATS_ENDPOINT`, and paste that URL:

```js
const SPOTIFY_STATS_ENDPOINT = 'https://finn-spotify-stats.<your-subdomain>.workers.dev';
```

Commit + push. Done — the presskit "Streams" and "Monatliche Hörer" numbers now
update automatically (cached up to 12h).

## Test it

Visit the Worker URL directly in your browser. You should see:

```json
{ "monthlyListeners": 8800, "totalStreams": 41234, "updated": "2026-..." }
```

If you see `{ "error": ... }`, check the error:
- `SP_DC secret not set` → run `wrangler secret put SP_DC`
- `token fetch failed (sp_dc expired?)` → grab a fresh `sp_dc` cookie, re-run the secret command
- `no artist data (query hash outdated?)` → refresh `QUERY_HASH` (see above)
