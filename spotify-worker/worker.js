/**
 * FINN — Spotify stats proxy (Cloudflare Worker)
 *
 * Fetches monthly listeners + total track play counts from Spotify's INTERNAL
 * (undocumented) web-player API, caches the result, and serves it as JSON to the
 * website so the browser never talks to Spotify directly (avoids CORS + hides the
 * sp_dc cookie).
 *
 * Two values you must provide (see README.md):
 *   1. SP_DC      — a secret (your Spotify sp_dc cookie). Set via `wrangler secret put SP_DC`.
 *   2. QUERY_HASH — the persisted-query hash for `queryArtistOverview` (below).
 *
 * Both the token endpoint and the query hash are undocumented and can change without
 * notice. When that happens this Worker returns an error and the website silently
 * falls back to its hardcoded numbers. See README.md for how to refresh the hash.
 */

const ARTIST_ID = '7udNzJxaBhqzAsxUJzvt3T';
const CACHE_TTL = 60 * 60 * 12; // seconds — refresh at most every 12h
const ALLOWED_ORIGIN = '*';     // restrict to 'https://www.finn-music.de' if you prefer

// Persisted-query hash for `queryArtistOverview`. If stats stop updating, grab the
// current hash from your browser (DevTools → Network → the `queryArtistOverview`
// request → copy `extensions` → `sha256Hash`). See README.md.
const QUERY_HASH = '4bc52527bb77a5f8bbb9afe491e9aa725698d29ab73bff58d49169ee29800167';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// --- Spotify TOTP token config (the rotating, fragile part) ---
// Spotify guards its token endpoint with a TOTP code generated from a secret baked into
// their web player, which they rotate every few days. This community repo auto-publishes
// the current secrets keyed by version. The Worker fetches it at runtime and uses the
// highest version, so it self-heals on rotation. FALLBACK_SECRET_DICT is used only if
// that fetch fails.
const SECRET_DICT_URL = 'https://raw.githubusercontent.com/xyloflake/spot-secrets-go/main/secrets/secretDict.json';
const FALLBACK_SECRET_DICT = {
  '59': [123, 105, 79, 70, 110, 59, 52, 125, 60, 49, 80, 70, 89, 75, 80, 86, 63, 53, 123, 37, 117, 49, 52, 93, 77, 62, 47, 86, 48, 104, 68, 72],
  '60': [79, 109, 69, 123, 90, 65, 46, 74, 94, 34, 58, 48, 70, 71, 92, 85, 122, 63, 91, 64, 87, 87],
  '61': [44, 55, 47, 42, 70, 40, 34, 114, 76, 74, 50, 111, 120, 97, 75, 76, 94, 102, 43, 69, 49, 120, 118, 80, 64, 78],
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    const cache = caches.default;
    const cacheKey = new Request('https://stats.finn/cache-v2');
    const hit = await cache.match(cacheKey);
    if (hit) return cors(hit);

    try {
      const token = await getToken(env.SP_DC);
      const stats = await getStats(token);
      const res = new Response(JSON.stringify({ ...stats, updated: new Date().toISOString() }), {
        headers: {
          'content-type': 'application/json',
          'cache-control': `public, max-age=${CACHE_TTL}`,
        },
      });
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
      return cors(res);
    } catch (err) {
      return cors(new Response(JSON.stringify({ error: String(err && err.message || err) }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      }));
    }
  },
};

async function getToken(spDc) {
  if (!spDc) throw new Error('SP_DC secret not set');

  // 1. Current TOTP secret (highest version), fetched live so it self-heals on rotation.
  const dict = await getSecretDict();
  const ver = Object.keys(dict).map(Number).sort((a, b) => b - a)[0];
  const cipher = dict[String(ver)];

  // 2. Spotify server time (drives the TOTP). Use the Date header so we're never skewed.
  const head = await fetch('https://open.spotify.com/', { method: 'HEAD', headers: { 'user-agent': UA } });
  const dateHeader = head.headers.get('date');
  const serverTimeSec = dateHeader ? Math.floor(new Date(dateHeader).getTime() / 1000) : Math.floor(Date.now() / 1000);

  // 3. Generate the TOTP code.
  const totp = await generateTotp(serverTimeSec, cipher);

  // 4. Exchange cookie + TOTP for an access token.
  const url =
    'https://open.spotify.com/api/token' +
    '?reason=transport&productType=web-player' +
    `&totp=${totp}&totpServer=${totp}&totpVer=${ver}`;
  const r = await fetch(url, {
    headers: {
      cookie: `sp_dc=${spDc}`,
      'user-agent': UA,
      'app-platform': 'WebPlayer',
      accept: 'application/json',
    },
  });
  const j = await r.json().catch(() => ({}));
  if (!j.accessToken) {
    throw new Error(`token fetch failed (status ${r.status}; sp_dc expired or TOTP secret outdated)`);
  }
  return j.accessToken;
}

// Fetch the current secret dict (self-healing); fall back to the baked-in copy on failure.
async function getSecretDict() {
  try {
    const r = await fetch(SECRET_DICT_URL, { headers: { 'user-agent': UA } });
    if (r.ok) {
      const j = await r.json();
      if (j && Object.keys(j).length) return j;
    }
  } catch (_) { /* fall through */ }
  return FALLBACK_SECRET_DICT;
}

// Standard RFC-6238 TOTP (SHA-1, 6 digits, 30s) using Spotify's rotating secret.
async function generateTotp(timeSec, cipher) {
  const transformed = cipher.map((e, t) => e ^ ((t % 33) + 9));
  const keyBytes = new TextEncoder().encode(transformed.join(''));

  let counter = Math.floor(timeSec / 30);
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) { counterBytes[i] = counter & 0xff; counter = Math.floor(counter / 256); }

  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes));

  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 1000000).toString().padStart(6, '0');
}

async function getStats(token) {
  const variables = JSON.stringify({ uri: `spotify:artist:${ARTIST_ID}`, locale: '' });
  const extensions = JSON.stringify({ persistedQuery: { version: 1, sha256Hash: QUERY_HASH } });
  const url =
    'https://api-partner.spotify.com/pathfinder/v1/query' +
    `?operationName=queryArtistOverview&variables=${encodeURIComponent(variables)}` +
    `&extensions=${encodeURIComponent(extensions)}`;

  const r = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      'app-platform': 'WebPlayer',
      'content-type': 'application/json',
      'user-agent': UA,
    },
  });
  const j = await r.json().catch(() => ({}));
  const artist = j && j.data && j.data.artistUnion;
  if (!artist) throw new Error('no artist data (query hash outdated?)');

  const monthlyListeners = artist.stats && artist.stats.monthlyListeners != null
    ? Number(artist.stats.monthlyListeners) : null;
  const followers = artist.stats && artist.stats.followers != null
    ? Number(artist.stats.followers) : null;

  const topTracks = (artist.discography && artist.discography.topTracks && artist.discography.topTracks.items) || [];
  const totalStreams = topTracks.reduce(
    (sum, it) => sum + Number((it && it.track && it.track.playcount) || 0), 0
  );

  return { monthlyListeners, followers, totalStreams };
}

function cors(res) {
  const r = new Response(res.body, res);
  r.headers.set('access-control-allow-origin', ALLOWED_ORIGIN);
  r.headers.set('access-control-allow-methods', 'GET, OPTIONS');
  return r;
}
