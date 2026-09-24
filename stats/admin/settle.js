/* ============================================================================
   RESULT SETTLEMENT — proposes win/loss/draw for each pick from finished scores
   ----------------------------------------------------------------------------
   Never writes data.js. It only PROPOSES results; the editor shows them for
   review and the user applies + saves.

   What it can settle
     • Monkey picks (exact API team names + a known league)
     • Player bets phrased "X to beat Y" or "X to win" (free text → fuzzy match)
   Everything else ("Everton draw", "Liverpool -1", "BTTS"…) is reported as
   MANUAL with the reason — it is never guessed.

   Credit / reach facts (The Odds API)
     • /scores costs 2 credits per league per call and only reaches back 3 days.
     • So: search the local archive first (free); only hit the live feed for
       games inside the 3-day reach; query leagues one at a time and stop as soon
       as every pick is matched (capped by maxFeeds). Every completed game seen is
       archived locally, so results fetched on Monday are still there on Thursday.
   ============================================================================ */
'use strict';

const fs   = require('fs');
const path = require('path');

const ARCHIVE_FILE = path.join(__dirname, 'scores-archive.json');
const DAY = 86400000;
const FEED_REACH_DAYS = 3;

// ---- Name normalisation & fuzzy scoring ------------------------------------
const ALIASES = {
  'man city': 'manchester city', 'man utd': 'manchester united', 'man united': 'manchester united', 'manu': 'manchester united',
  'spurs': 'tottenham hotspur', 'tottenham': 'tottenham hotspur', 'forest': 'nottingham forest', 'nottm forest': 'nottingham forest',
  'notts forest': 'nottingham forest', 'wolves': 'wolverhampton wanderers', 'pompey': 'portsmouth', 'qpr': 'queens park rangers',
  'villa': 'aston villa', 'palace': 'crystal palace', 'brighton': 'brighton and hove albion', 'west ham': 'west ham united',
  'newcastle': 'newcastle united', 'leeds': 'leeds united', 'norwich': 'norwich city', 'stoke': 'stoke city', 'hull': 'hull city',
  'leicester': 'leicester city', 'sheff utd': 'sheffield united', 'sheffield utd': 'sheffield united', 'sheff wed': 'sheffield wednesday',
  'wba': 'west bromwich albion', 'west brom': 'west bromwich albion', 'boro': 'middlesbrough', 'preston': 'preston north end',
  'coventry': 'coventry city', 'cardiff': 'cardiff city', 'swansea': 'swansea city', 'derby': 'derby county', 'ipswich': 'ipswich town',
  'luton': 'luton town', 'charlton': 'charlton athletic', 'stockport': 'stockport county', 'southend': 'southend united',
  'kidderminster': 'kidderminster harriers', 'lincoln': 'lincoln city', 'blackburn': 'blackburn rovers', 'bolton': 'bolton wanderers',
  'inter': 'inter milan', 'internazionale': 'inter milan', 'psg': 'paris saint germain', 'bayern': 'bayern munich',
  'dortmund': 'borussia dortmund', 'gladbach': 'borussia monchengladbach', 'leverkusen': 'bayer leverkusen',
  'atletico': 'atletico madrid', 'barca': 'barcelona', 'real': 'real madrid', 'sporting': 'sporting cp', 'az': 'az alkmaar',
  'psv': 'psv eindhoven', 'twente': 'fc twente enschede', 'sirius': 'ik sirius', 'orgryte': 'orgryte is',
};
// Tokens carrying no identity ("FC", "IK"…). NOT stripped: as/ac/rb/real/united/city — those distinguish clubs.
const STOP = new Set(['fc','cf','afc','sc','ss','sv','if','ik','bk','fk','sk','cd','ud','rc','ca','ssc','bsc','vfb','vfl','tsg','fsv',
  'ogc','de','the','and','of','club','is','gf','ff','1','04','05','96']);

const NOISE = new Set(['as','ac','rb','us','al']);   // prefixes that don't change which club it is
const FOLD = { 'ø':'o', 'æ':'ae', 'ß':'ss', 'ł':'l', 'đ':'d', 'œ':'oe' };

function normalize(name) {
  let s = String(name || '').toLowerCase().replace(/[øæßłđœ]/g, c => FOLD[c]).normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  if (ALIASES[s]) s = ALIASES[s];
  const tokens = s.split(' ').filter(t => t && !STOP.has(t));
  return { full: tokens.join(' '), tokens };
}

function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// similarity of two single tokens (typos, prefixes like lyon/lyonnais)
function tokSim(t, u) {
  if (t === u) return 1;
  const [s, l] = t.length <= u.length ? [t, u] : [u, t];
  if (s.length >= 4 && l.startsWith(s)) return 0.9;
  const sim = 1 - lev(t, u) / Math.max(t.length, u.length);
  return sim >= 0.75 ? sim : 0;
}

function nameScore(a, b) {
  if (!a.tokens.length || !b.tokens.length) return 0;
  if (a.full === b.full) return 1;
  const A = new Set(a.tokens), B = new Set(b.tokens);
  const inter = [...A].filter(t => B.has(t)).length;
  const jac = inter / new Set([...A, ...B]).size;
  if (inter === Math.min(A.size, B.size)) {                                     // one side wholly inside the other
    // "Monaco" ⊂ "AS Monaco": if the extra tokens are only club-prefix noise it's effectively the same name.
    // ("Milan" ⊂ "Inter Milan" is NOT noise — 'inter' names a different club — so that stays lower.)
    const [small, large] = A.size <= B.size ? [A, B] : [B, A];
    const extra = [...large].filter(t => !small.has(t));
    return extra.every(t => NOISE.has(t)) ? 0.95 : Math.max(0.8, jac);
  }
  const small = a.tokens.length <= b.tokens.length ? a.tokens : b.tokens;
  const large = small === a.tokens ? b.tokens : a.tokens;
  let total = 0;
  small.forEach(t => { let best = 0; large.forEach(u => { best = Math.max(best, tokSim(t, u)); }); total += best; });
  const fuzzy = (total / small.length) * (small.length / large.length >= 0.5 ? 1 : 0.85);
  return Math.max(jac, fuzzy);
}

// ---- Bet text → what to look for -------------------------------------------
function parseBet(text) {
  const t = String(text || '').trim().replace(/\s+/g, ' ');
  if (!t) return { kind: 'empty' };
  let m = t.match(/^(.+?)\s+to\s+(?:beat|defeat|win\s+(?:against|vs\.?|v))\s+(.+)$/i);
  if (m) return { kind: 'win', team: m[1].trim(), opponent: m[2].trim() };
  m = t.match(/^(.+?)\s+to\s+win$/i);
  if (m) return { kind: 'win', team: m[1].trim(), opponent: null };
  return { kind: 'other', reason: 'not a simple "team to beat opponent" win bet — settle by hand' };
}

// ---- Events ----------------------------------------------------------------
function toEvent(raw, sport, league) {
  const sc = {};
  (raw.scores || []).forEach(s => { sc[s.name] = Number(s.score); });
  const hs = sc[raw.home_team], as = sc[raw.away_team];
  return {
    id: raw.id, sport, league: league || sport, home: raw.home_team, away: raw.away_team, commence: raw.commence_time,
    completed: !!raw.completed, homeScore: Number.isFinite(hs) ? hs : null, awayScore: Number.isFinite(as) ? as : null,
  };
}

function candidatesFor(parsed, events, from, to) {
  const t = normalize(parsed.team), o = parsed.opponent ? normalize(parsed.opponent) : null;
  const out = [];
  for (const e of events) {
    const c = Date.parse(e.commence);
    if (!(c >= from && c <= to)) continue;
    const h = normalize(e.home), a = normalize(e.away);
    const sH = nameScore(t, h), sA = nameScore(t, a);
    const side = sH >= sA ? 'home' : 'away', s1 = Math.max(sH, sA);
    let score, confidence;
    if (o) {
      const s2 = nameScore(o, side === 'home' ? a : h);
      if (s1 < 0.75 || s2 < 0.6) continue;
      score = (s1 + s2) / 2; confidence = score >= 0.85 ? 'high' : 'medium';
    } else {
      if (s1 < 0.85) continue;          // no opponent to corroborate → demand a strong team match
      score = s1 * 0.9; confidence = 'medium';
    }
    out.push({ event: e, side, score, confidence });
  }
  return out.sort((x, y) => y.score - x.score);
}

function outcomeOf(best) {
  const e = best.event;
  if (!e.completed || e.homeScore == null || e.awayScore == null) return null;
  const mine = best.side === 'home' ? e.homeScore : e.awayScore, theirs = best.side === 'home' ? e.awayScore : e.homeScore;
  return mine > theirs ? 'win' : mine < theirs ? 'loss' : 'draw';
}

const fixtureText = e => `${e.home} v ${e.away}`;

// ---- Archive (completed games kept locally, beyond the API's 3-day reach) ---
function loadArchive(file = ARCHIVE_FILE) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).events || {}; } catch (e) { return {}; }
}
function saveArchive(events, file = ARCHIVE_FILE) {
  fs.writeFileSync(file, JSON.stringify({ note: 'Completed games seen by the results tool. Safe to delete.', events }, null, 1));
}

// ---- The search --------------------------------------------------------------
/*
  picks: [{ id, kind:'player'|'monkey', text, league? }]   date: 'YYYY-MM-DD' (the week's date)
  deps : { loadArchive(), saveArchive(map), listActiveKeys(), fetchFeed(key)->{events,remaining},
           leagueKeyForLabel(label), leagueLabelForKey(key), priorityKeys(activeSet) }
*/
async function proposeResults({ picks, date, deps, maxFeeds = 12, now = new Date(), allowFruitless = false }) {
  const base = Date.parse(date);
  if (!Number.isFinite(base)) throw new Error('A valid week date is needed to find the games (set the Date field).');
  const from = base - DAY, to = base + 7 * DAY;
  const reachFrom = now.getTime() - FEED_REACH_DAYS * DAY;

  const parsed = picks.map(p => ({ pick: p, bet: p.kind === 'monkey' ? { kind: 'win', team: p.text, opponent: null } : parseBet(p.text) }));
  const archive = deps.loadArchive();
  const pool = new Map();                                // id -> event (live wins over archive)
  Object.values(archive).forEach(e => pool.set(e.id, e));

  const notes = [], searched = [], feedErrors = [];
  let remaining = null, creditsUsed = 0, archiveDirty = false;

  const resolveAll = () => parsed.map(x => {
    if (x.bet.kind !== 'win') return { x, cands: null };
    return { x, cands: candidatesFor(x.bet, [...pool.values()], from, to) };
  });
  // A pick only NEEDS a live search while we haven't found its game's league at all.
  // "Found but not finished yet" and "found but too old for the feed" are settled
  // facts — searching more leagues can't change them, and each one costs 2 credits.
  const locateFrom = from - 14 * DAY;
  // "Located" = this feed set mentions the team at all. A feed that no longer holds last
  // week's game still lists the team's NEXT fixture (different opponent), which is enough
  // to know we've found the right league — so don't require the opponent to match here.
  const locate = bet => {
    const evs = [...pool.values()];
    const exact = candidatesFor(bet, evs, locateFrom, Infinity);
    if (exact.length) return exact;
    const t = normalize(bet.team);
    return evs.filter(e => Date.parse(e.commence) >= locateFrom
      && Math.max(nameScore(t, normalize(e.home)), nameScore(t, normalize(e.away))) >= 0.85).map(e => ({ event: e }));
  };
  const needsSearch = () => parsed.filter(x => x.bet.kind === 'win' && !locate(x.bet).length);

  const fmtD = t => new Date(t).toISOString().slice(0, 10);
  const fmtDT = t => new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  // Before spending anything: can results plausibly exist? (Games run ~Thu/Fri..Monday.)
  function fruitlessReason() {
    const coreEnd = base + 4 * DAY, capped = Math.min(now.getTime(), coreEnd);
    const played = Math.max(0, capped - base);
    if (played / (coreEnd - base) < 0.3)
      return `Most of this week's games haven't been played yet (they start ${fmtD(base)}), so there are few results to fetch.`;
    const inReach = Math.max(0, capped - Math.max(base, reachFrom));
    if (inReach / played < 0.5)
      return `Most of this week's games (${fmtD(base)} to ${fmtD(coreEnd - DAY)}) finished before the results feed's reach — it only sees games since ${fmtDT(reachFrom)}.`;
    return null;
  }

  const needLive = needsSearch().length > 0;
  const windowReachable = to >= reachFrom;
  let needsConfirm = null;
  if (needLive && !windowReachable)
    notes.push(`These games are older than the results feed's ${FEED_REACH_DAYS}-day reach, so the live feed was skipped (no credits spent). Anything not already in the local archive must be settled by hand.`);
  if (needLive && windowReachable && !allowFruitless) needsConfirm = fruitlessReason();
  if (needsConfirm) notes.push(`${needsConfirm} No credits were spent — you can still search (up to ${2 * maxFeeds} credits), but most picks probably won't be found.`);

  if (needLive && windowReachable && !needsConfirm) {
    let activeKeys;
    try { activeKeys = await deps.listActiveKeys(); }
    catch (e) { throw e; }
    // Feeds to try, most likely first: the leagues Monkey's own picks named, then the usual ones, then the rest.
    const order = [];
    const add = k => { if (k && activeKeys.has(k) && !order.includes(k)) order.push(k); };
    parsed.filter(x => x.pick.kind === 'monkey' && x.pick.league).forEach(x => add(deps.leagueKeyForLabel(x.pick.league)));
    deps.priorityKeys(activeKeys).forEach(add);

    for (const key of order) {
      if (!needsSearch().length) break;
      if (searched.length >= maxFeeds) { notes.push(`Stopped after ${maxFeeds} leagues to protect your API credits — use "Search more leagues" to go further.`); break; }
      try {
        const { events, remaining: rem, last } = await deps.fetchFeed(key);
        searched.push({ key, credits: Number(last) || 2 });
        creditsUsed += Number(last) || 2;
        if (rem != null) remaining = rem;
        const label = deps.leagueLabelForKey(key);
        (events || []).forEach(raw => {
          const ev = toEvent(raw, key, label);
          pool.set(ev.id, ev);
          if (ev.completed && ev.homeScore != null && ev.awayScore != null && !archive[ev.id]) { archive[ev.id] = ev; archiveDirty = true; }
        });
      } catch (e) {
        feedErrors.push({ key, error: e.message });
        if (e.network) { notes.push(`Lost connection while searching: ${e.message}`); break; }
      }
    }
    if (archiveDirty) deps.saveArchive(archive);
  }

  const proposals = resolveAll().map(({ x, cands }) => {
    const base = { id: x.pick.id, kind: x.pick.kind, text: x.pick.text, status: null, result: null, confidence: null, reason: '', match: null };
    if (x.bet.kind === 'empty') return { ...base, status: 'manual', reason: 'no bet entered' };
    if (x.bet.kind === 'other') return { ...base, status: 'manual', reason: x.bet.reason };
    if (!cands.length) {
      const loc = locate(x.bet)[0];
      let why;
      if (loc) why = `Found ${x.bet.team} in ${loc.event.league} (next fixture: ${fixtureText(loc.event)}) but not this game — it finished more than ${FEED_REACH_DAYS} days ago, beyond the results feed. Settle by hand (running this within ${FEED_REACH_DAYS} days of the games archives them).`;
      else if (!windowReachable) why = 'Older than the 3-day results feed and not in the local archive — settle by hand (fetching within 3 days of the games archives them).';
      else if (needsConfirm) why = 'Not searched yet — see the note above (no credits spent).';
      else why = `No matching game found in the ${searched.length} league(s) searched.`;
      return { ...base, status: 'notfound', reason: why };
    }
    const best = cands[0];
    const rival = cands.find(c => c.event.id !== best.event.id && c.score >= best.score - 0.05);
    const m = { home: best.event.home, away: best.event.away, homeScore: best.event.homeScore, awayScore: best.event.awayScore,
                league: best.event.league, commence: best.event.commence, side: best.side };
    if (rival) return { ...base, status: 'ambiguous', confidence: 'low', match: m,
      reason: `Could be ${fixtureText(best.event)} or ${fixtureText(rival.event)} — settle by hand.` };
    const result = outcomeOf(best);
    if (result == null) return { ...base, status: 'pending', confidence: best.confidence, match: m,
      reason: 'Matched, but the game has not finished (or the feed has no final score yet).' };
    return { ...base, status: 'settled', result, confidence: best.confidence, match: m };
  });

  return { proposals, searched, feedErrors, creditsUsed, remaining, notes, needsConfirm: !!needsConfirm, confirmMaxCredits: 2 * maxFeeds, window: { from: new Date(from).toISOString(), to: new Date(to).toISOString() } };
}

module.exports = { normalize, nameScore, parseBet, candidatesFor, outcomeOf, toEvent, proposeResults, loadArchive, saveArchive, ARCHIVE_FILE };
