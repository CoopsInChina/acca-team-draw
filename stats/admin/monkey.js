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
  ],
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
    if (!fav || !(fav.odds < CONFIG.threshold)) return;
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
async function fetchLeague(league, key) {
  const url = `https://api.the-odds-api.com/v4/sports/${league.key}/odds/`
            + `?regions=${CONFIG.region}&markets=h2h&oddsFormat=decimal&apiKey=${key}`;
  const res = await fetch(url);
  if (res.status === 401) throw new Error('401 Unauthorised — check your API key');
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

  let pool = [];
  let remaining = null;
  const leaguesUsed = [];

  if (opts.mock) {
    const mock = require('./monkey.mock.js')(win);
    mock.forEach(({ league, events }) => { leaguesUsed.push(league.label); pool = pool.concat(buildPool(events, league, win)); });
  } else {
    const key = opts.key || resolveKey();
    if (!key) throw new Error('No API key. Set ODDS_API_KEY or create stats/admin/oddsapi.key (see --help).');
    for (const league of CONFIG.leagues) {
      try {
        const { data, remaining: rem } = await fetchLeague(league, key);
        if (rem != null) remaining = rem;
        leaguesUsed.push(league.label);
        pool = pool.concat(buildPool(data, league, win));
      } catch (e) {
        console.error(`  ! ${league.label}: ${e.message}`);
      }
    }
  }

  // sort shortest-priced first, cap the recorded pool
  pool.sort((a, b) => a.odds - b.odds);
  const fullSize = pool.length;
  pool = pool.slice(0, CONFIG.poolCap);

  if (pool.length < CONFIG.pick)
    throw new Error(`Only ${pool.length} banker(s) found under ${CONFIG.threshold} — need at least ${CONFIG.pick}.`);

  const picks = shuffle(pool, rng).slice(0, CONFIG.pick);

  return {
    generatedAt: new Date().toISOString(),
    source: opts.mock ? 'mock' : 'the-odds-api v4',
    apiRequestsRemaining: remaining,
    window: { from: win.from.toISOString(), to: win.to.toISOString() },
    threshold: CONFIG.threshold,
    leagues: leaguesUsed,
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
    console.log(`  bankers under ${result.threshold}: ${result.qualifyingFound} found, ${result.poolSize} in pool`);
    if (result.apiRequestsRemaining != null) console.log(`  API requests remaining: ${result.apiRequestsRemaining}`);
    console.log('\n  THE 5 PICKS:');
    result.picks.forEach((p, i) => console.log(`   ${i + 1}. ${p.pick}  @ ${p.odds}  (${p.league}: ${p.home} v ${p.away})`));
    if (opts.out) { fs.writeFileSync(opts.out, JSON.stringify(result, null, 2)); console.log(`\n  written → ${opts.out}`); }
    console.log('');
  }).catch(err => { console.error('\n  ✘ ' + err.message + '\n'); process.exit(1); });
}

module.exports = { generate, buildPool, candidate, teamOdds, weekendWindow, mulberry32, shuffle, CONFIG };
