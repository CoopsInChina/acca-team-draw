#!/usr/bin/env node
/* ============================================================================
   MONKEY MAGIC — automated banker picker
   ----------------------------------------------------------------------------
   Pulls upcoming-weekend odds for the English/German/Italian leagues from
   The Odds API, keeps every match whose favourite is priced under 1.40 (a
   "banker"), then randomly picks 5 of them as Monkey Magic's weekly acca.

   Both the full qualifying pool and the 5 chosen are recorded, with the RNG
   seed, so any draw can be reproduced/audited.

   USAGE
     node stats/admin/monkey.js --mock            # test with bundled sample data
     node stats/admin/monkey.js                   # live (needs an API key)
     node stats/admin/monkey.js --out picks.json  # also write result to a file
     node stats/admin/monkey.js --seed 1a2b3c4d   # reproduce a specific draw

   API KEY (live mode) — set either:
     • env var:  ODDS_API_KEY=xxxxx node stats/admin/monkey.js
     • or a file: stats/admin/oddsapi.key  containing just the key
   Get a free key at https://the-odds-api.com  (git-ignored, never committed).
   ============================================================================ */

const fs   = require('fs');
const path = require('path');

// ---- Config ----------------------------------------------------------------
const CONFIG = {
  minOdds:   1.10,     // the pick must be priced at this or above (no near-certainties)
  threshold: 1.40,     // the pick must be priced strictly under this
  homeOnly:  true,     // only home teams are eligible (home win under 1.40)
  poolCap:   50,       // record at most this many bankers (shortest-priced)
  pick:      5,        // how many the monkey submits
  region:    'uk',     // bookmaker region for The Odds API
  leagues: [
    { key: 'soccer_epl',                    country: 'England',     label: 'Premier League' },
    { key: 'soccer_efl_champ',              country: 'England',     label: 'Championship' },
    { key: 'soccer_england_league1',        country: 'England',     label: 'League One' },
    { key: 'soccer_england_league2',        country: 'England',     label: 'League Two' },
    { key: 'soccer_germany_bundesliga',     country: 'Germany',     label: 'Bundesliga' },
    { key: 'soccer_germany_bundesliga2',    country: 'Germany',     label: '2. Bundesliga' },
    { key: 'soccer_italy_serie_a',          country: 'Italy',       label: 'Serie A' },
    { key: 'soccer_italy_serie_b',          country: 'Italy',       label: 'Serie B' },
    { key: 'soccer_spain_la_liga',          country: 'Spain',       label: 'La Liga' },
    { key: 'soccer_spain_segunda_division', country: 'Spain',       label: 'La Liga 2' },
    { key: 'soccer_netherlands_eredivisie', country: 'Netherlands', label: 'Eredivisie' },

    // International competitions — these fill the pool on international-break
    // weeks when the domestic leagues are idle. The Odds API has NO "international
    // friendlies" feed at all (checked every soccer key), so those can't be added.
    // Only feeds the API currently reports as active are queried (see
    // fetchActiveKeys), so listing off-season competitions here costs nothing.
    { key: 'soccer_uefa_nations_league',                      country: 'International', label: 'Nations League' },
    { key: 'soccer_fifa_world_cup_qualifiers_europe',         country: 'International', label: 'World Cup Qualifiers (Europe)' },
    { key: 'soccer_fifa_world_cup_qualifiers_south_america',  country: 'International', label: 'World Cup Qualifiers (S. America)' },
    { key: 'soccer_uefa_euro_qualification',                  country: 'International', label: 'Euro Qualification' },
    { key: 'soccer_fifa_world_cup',                           country: 'International', label: 'World Cup' },
    { key: 'soccer_uefa_european_championship',               country: 'International', label: 'Euros' },
    { key: 'soccer_conmebol_copa_america',                    country: 'International', label: 'Copa América' },
    { key: 'soccer_concacaf_gold_cup',                        country: 'International', label: 'Gold Cup' },
    { key: 'soccer_africa_cup_of_nations',                    country: 'International', label: 'Africa Cup of Nations' },
  ],
  requestTimeoutMs: 15000,   // per attempt
  requestAttempts:  3,       // total tries per request before giving up
};

// ---- API key resolution ----------------------------------------------------
function resolveKey() {
  if (process.env.ODDS_API_KEY) return process.env.ODDS_API_KEY.trim();
  const keyFile = path.join(__dirname, 'oddsapi.key');
  if (fs.existsSync(keyFile)) return fs.readFileSync(keyFile, 'utf8').trim();
  return null;
}

// ---- Upcoming-weekend window (Fri 00:00 → Mon 23:59, UTC) ------------------
function weekendWindow(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();                 // 0 Sun .. 6 Sat
  // Saturday of the relevant weekend: Sunday uses yesterday; otherwise next Sat
  let sat = new Date(d);
  if (day === 0) sat.setUTCDate(d.getUTCDate() - 1);
  else sat.setUTCDate(d.getUTCDate() + ((6 - day + 7) % 7));
  const from = new Date(sat); from.setUTCDate(sat.getUTCDate() - 1); from.setUTCHours(0, 0, 0, 0);   // Fri 00:00
  const to   = new Date(sat); to.setUTCDate(sat.getUTCDate() + 2);   to.setUTCHours(23, 59, 59, 0);  // Mon 23:59
  return { from, to };
}

// ---- Seeded RNG (mulberry32) so draws are reproducible ---------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Average each team's decimal odds across bookmakers --------------------
function teamOdds(event) {
  const prices = {};                         // outcome name -> [decimal prices]
  (event.bookmakers || []).forEach(bk => {
    const m = (bk.markets || []).find(mk => mk.key === 'h2h');
    if (!m) return;
    (m.outcomes || []).forEach(o => { (prices[o.name] = prices[o.name] || []).push(o.price); });
  });
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
  const one = name => (prices[name] && prices[name].length) ? { odds: avg(prices[name]), books: prices[name].length } : null;
  return { home: one(event.home_team), away: one(event.away_team) };
}

// ---- Pick the eligible team for a match ------------------------------------
// homeOnly: only the home team can be the banker (a home win under the threshold).
// otherwise: the shorter-priced of home/away.
function candidate(event) {
  const { home, away } = teamOdds(event);
  if (CONFIG.homeOnly)
    return home ? { team: event.home_team, odds: home.odds, side: 'home', books: home.books } : null;
  const opts = [];
  if (home) opts.push({ team: event.home_team, odds: home.odds, side: 'home', books: home.books });
  if (away) opts.push({ team: event.away_team, odds: away.odds, side: 'away', books: away.books });
  return opts.sort((a, b) => a.odds - b.odds)[0] || null;
}

// ---- Build the qualifying pool from raw events -----------------------------
function buildPool(events, league, win) {
  const out = [];
  (events || []).forEach(ev => {
    const t = new Date(ev.commence_time);
    if (win && (t < win.from || t > win.to)) return;
    const fav = candidate(ev);
    if (!fav || fav.odds < CONFIG.minOdds || !(fav.odds < CONFIG.threshold)) return;
    out.push({
      gameId: ev.id,
      league: league.label,
      country: league.country,
      commence: ev.commence_time,
      home: ev.home_team,
      away: ev.away_team,
      pick: fav.team,
      side: fav.side,
      odds: Math.round(fav.odds * 100) / 100,
      books: fav.books,
    });
  });
  return out;
}

// ---- Fetch odds for one league (live) --------------------------------------
// Node's fetch reports every network failure as the useless message "fetch failed";
// the actual reason (ETIMEDOUT, ENOTFOUND, ECONNRESET, UND_ERR_CONNECT_TIMEOUT…)
// lives on e.cause. Surface it so a failure is diagnosable instead of a mystery.
function describeNetErr(e) {
  if (e && e.name === 'TimeoutError') return `timed out after ${CONFIG.requestTimeoutMs / 1000}s`;
  const cause = e && e.cause;
  const code = cause && (cause.code || cause.name || cause.message);
  const base = (e && e.message) || String(e);
  return code ? `${base} (${code})` : base;
}

// GET with a per-attempt timeout and a few retries — the odds pull is a burst of
// requests, and a single dropped connection shouldn't sink the whole draw.
async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 1; attempt <= CONFIG.requestAttempts; attempt++) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(CONFIG.requestTimeoutMs) });
    } catch (e) {
      lastErr = e;
      if (attempt < CONFIG.requestAttempts) await new Promise(r => setTimeout(r, 700 * attempt));
    }
  }
  const err = new Error(describeNetErr(lastErr));
  err.network = true;
  throw err;
}

// Which sports the API currently lists as in-season. This endpoint costs no
// quota, lets us skip idle competitions (no wasted credits), and doubles as a
// fast connectivity check: if it can't be reached, nothing else will be either.
async function fetchActiveKeys(key) {
  const res = await fetchWithRetry(`https://api.the-odds-api.com/v4/sports/?apiKey=${key}`);
  if (res.status === 401) throw new Error('401 Unauthorised — check your API key (or the monthly credits are used up)');
  if (!res.ok) throw new Error(`sports list: HTTP ${res.status}`);
  return new Set((await res.json()).filter(s => s.active).map(s => s.key));
}

async function fetchLeague(league, key) {
  const url = `https://api.the-odds-api.com/v4/sports/${league.key}/odds/`
            + `?regions=${CONFIG.region}&markets=h2h&oddsFormat=decimal&apiKey=${key}`;
  const res = await fetchWithRetry(url);
  if (res.status === 401) throw new Error('401 Unauthorised — check your API key (or the monthly credits are used up)');
  if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`${league.key}: HTTP ${res.status} ${body.slice(0, 120)}`); }
  const remaining = res.headers.get('x-requests-remaining');
  const data = await res.json();
  return { data, remaining };
}

// ---- Main generation -------------------------------------------------------
async function generate(opts = {}) {
  const win = weekendWindow();
  const seedNum = opts.seed != null ? (parseInt(opts.seed, 16) >>> 0) : (require('crypto').randomBytes(4).readUInt32BE(0));
  const rng = mulberry32(seedNum);

  // Collect the raw events per league once — used for the primary home pool and,
  // if needed, the away-favourite backfill below (no extra API calls).
  const rawLeagues = [];
  let remaining = null;
  const leaguesUsed = [];
  const leagueErrors = [];      // { league, error } for every feed that failed to load
  const skippedInactive = [];   // configured feeds the API says are out of season

  if (opts.mock) {
    require('./monkey.mock.js')(win).forEach(({ league, events }) => {
      leaguesUsed.push(league.label); rawLeagues.push({ league, events });
    });
  } else {
    const key = opts.key || resolveKey();
    if (!key) throw new Error('No API key. Set ODDS_API_KEY or create stats/admin/oddsapi.key (see --help).');

    // Connectivity check + in-season filter in one free call. If THIS fails, the
    // machine can't reach the API at all — say so plainly rather than letting
    // eleven separate "fetch failed" lines (and an empty pool) hide the cause.
    let activeKeys = null;
    try {
      activeKeys = await fetchActiveKeys(key);
    } catch (e) {
      if (e.network) {
        throw new Error(`Can't reach The Odds API from this computer: ${e.message}. `
          + `The API itself is fine — this is your network path (VPN/proxy/firewall). `
          + `Node ignores system proxy settings; if you use one, start the editor with `
          + `https_proxy set (the launcher now enables NODE_USE_ENV_PROXY for this).`);
      }
      throw e;            // e.g. bad key / out of credits — already a clear message
    }

    for (const league of CONFIG.leagues) {
      if (activeKeys && !activeKeys.has(league.key)) { skippedInactive.push(league.label); continue; }
      try {
        const { data, remaining: rem } = await fetchLeague(league, key);
        if (rem != null) remaining = rem;
        leaguesUsed.push(league.label);
        rawLeagues.push({ league, events: data });
      } catch (e) {
        leagueErrors.push({ league: league.label, error: e.message });
        console.error(`  ! ${league.label}: ${e.message}`);
      }
    }
  }

  // Primary pool: home favourites only (the standard rule).
  let pool = rawLeagues.flatMap(({ league, events }) => buildPool(events, league, win));
  pool.sort((a, b) => a.odds - b.odds);
  const homeFound = pool.length;

  // Backup: if home-only can't reach the required 5, top up with the next-best
  // AWAY favourites in the same odds range (only for games not already used).
  let backupFound = 0;
  if (pool.length < CONFIG.pick) {
    const used = new Set(pool.map(p => p.gameId));
    const away = [];
    rawLeagues.forEach(({ league, events }) => {
      (events || []).forEach(ev => {
        if (used.has(ev.id)) return;
        const t = new Date(ev.commence_time);
        if (win && (t < win.from || t > win.to)) return;
        const { away: a } = teamOdds(ev);
        if (!a || a.odds < CONFIG.minOdds || !(a.odds < CONFIG.threshold)) return;
        away.push({
          gameId: ev.id, league: league.label, country: league.country, commence: ev.commence_time,
          home: ev.home_team, away: ev.away_team, pick: ev.away_team, side: 'away',
          odds: Math.round(a.odds * 100) / 100, books: a.books, backup: true,
        });
      });
    });
    away.sort((a, b) => a.odds - b.odds);
    const needed = CONFIG.pick - pool.length;
    const topUp = away.slice(0, Math.max(needed, 0));
    backupFound = topUp.length;
    pool = pool.concat(topUp).sort((a, b) => a.odds - b.odds);
  }

  const fullSize = pool.length;
  pool = pool.slice(0, CONFIG.poolCap);

  if (pool.length < CONFIG.pick)
    throw new Error(`Only ${pool.length} banker(s) found between ${CONFIG.minOdds} and ${CONFIG.threshold} (home ${homeFound}, away backup ${backupFound}) — need at least ${CONFIG.pick}.`
      + ` Searched ${leaguesUsed.length} in-season competition(s)`
      + (leagueErrors.length ? `; ${leagueErrors.length} failed to load (${leagueErrors.map(x => `${x.league}: ${x.error}`).join('; ')})` : '')
      + '.');

  const picks = shuffle(pool, rng).slice(0, CONFIG.pick);

  return {
    generatedAt: new Date().toISOString(),
    source: opts.mock ? 'mock' : 'the-odds-api v4',
    apiRequestsRemaining: remaining,
    window: { from: win.from.toISOString(), to: win.to.toISOString() },
    minOdds: CONFIG.minOdds,
    threshold: CONFIG.threshold,
    leagues: leaguesUsed,
    leagueErrors, skippedInactive,
    homeFound, backupFound,          // how many of the qualifiers were home vs away-backup
    qualifyingFound: fullSize,      // total bankers found (before the 50 cap)
    poolSize: pool.length,          // recorded pool (<= 50)
    seed: seedNum.toString(16).padStart(8, '0'),
    pool,
    picks,
  };
}

// ---- CLI -------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node monkey.js [--mock] [--out file.json] [--seed hex]');
    process.exit(0);
  }
  const opts = { mock: args.includes('--mock') };
  const outIdx = args.indexOf('--out');   if (outIdx >= 0) opts.out = args[outIdx + 1];
  const seedIdx = args.indexOf('--seed'); if (seedIdx >= 0) opts.seed = args[seedIdx + 1];

  generate(opts).then(result => {
    console.log(`\n  🐒 Monkey Magic — ${result.source}`);
    console.log(`  weekend ${result.window.from.slice(0,10)} → ${result.window.to.slice(0,10)} · seed ${result.seed}`);
    console.log(`  bankers ${result.minOdds}–${result.threshold}: ${result.qualifyingFound} found (home ${result.homeFound}, away backup ${result.backupFound}), ${result.poolSize} in pool`);
    if (result.apiRequestsRemaining != null) console.log(`  API requests remaining: ${result.apiRequestsRemaining}`);
    console.log('\n  THE 5 PICKS:');
    result.picks.forEach((p, i) => console.log(`   ${i + 1}. ${p.pick}  @ ${p.odds}  (${p.league}: ${p.home} v ${p.away})${p.backup ? '  [away backup]' : ''}`));
    if (opts.out) { fs.writeFileSync(opts.out, JSON.stringify(result, null, 2)); console.log(`\n  written → ${opts.out}`); }
    console.log('');
  }).catch(err => { console.error('\n  ✘ ' + err.message + '\n'); process.exit(1); });
}

module.exports = { generate, buildPool, candidate, teamOdds, weekendWindow, mulberry32, shuffle, CONFIG,
  // shared with the results tool (settle.js / serve.js) so both use the same hardened networking
  resolveKey, fetchWithRetry, fetchActiveKeys, describeNetErr };
