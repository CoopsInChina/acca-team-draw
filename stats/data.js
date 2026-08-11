/* ============================================================================
   ACCA ACCA ACCA — SEASON DATA
   ----------------------------------------------------------------------------
   This is the ONLY file you edit each week. The webpage reads it and rebuilds
   every table, stat and chart automatically.

   THE MODEL
   ---------
   Each team plays a 5-fold ACCUMULATOR every week (one pick per player). The
   acca only pays out if ALL 5 picks win. You enter, per week:
     • each player's single pick  (bet, DECIMAL odds, balls-of-steel?, result)
     • each team's EXPECTED RETURN (the acca's potential payout) — win or lose

   Everything else is worked out for you:
     • Total Won   = sum of expected returns on weeks the acca landed (all 5 win)
     • Total Staked= weeks played × £12.50 per team
     • Long bets   = any pick at odds ≥ 2.00 (won = successful, lost = failed)
     • Naughty Step= a balls-of-steel bet that lost or drew
     • Guilt Club  = the sole non-winner in a team is charged that week's full
                     expected return (they alone sank the acca)

   MONKEY MAGIC (house benchmark)
   ------------------------------
   An automated team (see stats/admin/monkey.js). It appears ONLY in the
   Head-to-Head and the week summaries — never in the player tables, BoS,
   naughty step, long bets or guilt club. A toggle on the page shows/hides it.
   Store its weekly acca under each week's "monkey" key.

   ODDS ARE ALWAYS DECIMAL here (1.45, 2.50, 4.00…). The page has a toggle to
   show them as fractions — you always TYPE decimals. A DRAW counts as a LOSS.

   Blocks marked DEMO are placeholder data — delete them when the season starts.
   ============================================================================ */

window.ACCA_DATA = {

  season:  "2026/27",
  updated: "Pre-season · demo data",

  /* ---- Weekly highlight — a manual headline, rewrite it each week ------- */
  highlight: "🔥 Week 4: Last Proletarians finally lands a Balls of Steel banker — but Hurzeler-ball blanks and sinks the Europe acca. Team Asia stretch clear on EBIT.",

  /* ---- Global settings ------------------------------------------------- */
  stakePerTeamPerWeek: 12.50,   // Total Staked per team = weeks played × this
  longBetOdds:         2.00,    // a pick at odds ≥ this counts as a "long bet"
  oddsDisplayDefault:  "decimal",
  showMonkeyDefault:   true,     // Head-to-Head shows Monkey Magic by default

  /* ---- The two fixed teams (real line-ups) ----------------------------- */
  teams: [
    { id: "europe", name: "Team Europe", short: "Team EU",   color: "#2f6fed",
      img: "assets/teams/europe.svg",
      members: ["lacey", "tim", "mikael", "roger", "niblett"] },
    { id: "asia",   name: "Team Asia",   short: "Team Asia", color: "#e8641c",
      img: "assets/teams/asia.svg",
      members: ["garry", "dewi", "steve", "lincoln", "abby"] },
  ],

  /* ---- House team: Monkey Magic (automated benchmark; head-to-head only) - */
  houseTeam: { id: "monkey", name: "Monkey Magic", short: "Monkey", color: "#7d3cc9",
               img: "assets/teams/monkey.svg" },

  /* ---- The players (name = alias shown on the sheet) -------------------- */
  players: {
    lacey:   { name: "Next yrs Magpie",   init: "NYM", img: "assets/players/lacey.png" },
    tim:     { name: "City 'til I die",   init: "CTD", img: "assets/players/tim.png" },
    mikael:  { name: "Last Proletarians", init: "LPR", img: "assets/players/mikael.png" },
    roger:   { name: "Hurzeler-ball",     init: "HZB", img: "assets/players/roger.png" },
    niblett: { name: "Spursy",            init: "SPU", img: "assets/players/niblett.png" },
    garry:   { name: "GloryHunter",       init: "GLH", img: "assets/players/garry.png" },
    dewi:    { name: "Bang Average",      init: "BAV", img: "assets/players/dewi.png" },
    steve:   { name: "Garibaldi Reds",    init: "GAR", img: "assets/players/steve.png" },
    lincoln: { name: "Red Devils",        init: "RDV", img: "assets/players/lincoln.png" },
    abby:    { name: "Valley Commando",   init: "VLC", img: "assets/players/abby.png" },
  },

  /* ---- Weekly results (DEMO data, decimal odds) ------------------------ *
   * expectedReturn = the team's 5-fold acca potential payout that week.     *
   * monkey = the automated house team's 5 banker picks + acca return.       */
  weeks: [

    /* ---------- WEEK 1 (DEMO) — Asia: Garibaldi Reds sole loser ---------- */
    { week: 1, date: "2026-08-16",  note: "DEMO",
      expectedReturn: { europe: 308.50, asia: 250.60 },
      bets: {
        lacey:   { betOn: "Newcastle to win",   odds: 1.60, ballsOfSteel: false, result: "win"  },
        tim:     { betOn: "Man City to win",    odds: 1.45, ballsOfSteel: false, result: "win"  },
        mikael:  { betOn: "Everton draw",       odds: 3.20, ballsOfSteel: true,  result: "loss" },
        roger:   { betOn: "Brighton to win",    odds: 1.90, ballsOfSteel: false, result: "loss" },
        niblett: { betOn: "Spurs to win",       odds: 1.75, ballsOfSteel: false, result: "draw" },
        garry:   { betOn: "Man Utd to win",     odds: 1.72, ballsOfSteel: false, result: "win"  },
        dewi:    { betOn: "Villa over 2.5",     odds: 2.00, ballsOfSteel: false, result: "win"  },
        steve:   { betOn: "Forest to win",      odds: 2.25, ballsOfSteel: false, result: "loss" },
        lincoln: { betOn: "Liverpool to win",   odds: 1.40, ballsOfSteel: false, result: "win"  },
        abby:    { betOn: "Charlton to win",    odds: 1.85, ballsOfSteel: true,  result: "win"  },
      },
      monkey: {
        expectedReturn: 34.47, seed: "9f3a2b10", poolSize: 22,
        picks: [
          { pick: "Man City",      odds: 1.20, result: "win",  league: "Premier League" },
          { pick: "Bayern Munich", odds: 1.15, result: "win",  league: "Bundesliga" },
          { pick: "Real Madrid",   odds: 1.22, result: "win",  league: "La Liga" },
          { pick: "Inter",         odds: 1.26, result: "win",  league: "Serie A" },
          { pick: "PSV",           odds: 1.30, result: "loss", league: "Eredivisie" },
        ],
      },
    },

    /* ---------- WEEK 2 (DEMO) — Europe acca LANDS; Monkey lands too ------- */
    { week: 2, date: "2026-08-23",  note: "DEMO",
      expectedReturn: { europe: 124.30, asia: 96.00 },
      bets: {
        lacey:   { betOn: "Newcastle over 1.5", odds: 1.55, ballsOfSteel: false, result: "win"  },
        tim:     { betOn: "Man City to win",    odds: 1.35, ballsOfSteel: false, result: "win"  },
        mikael:  { betOn: "Arsenal to win",     odds: 1.65, ballsOfSteel: false, result: "win"  },
        roger:   { betOn: "Brighton to win",    odds: 1.80, ballsOfSteel: false, result: "win"  },
        niblett: { betOn: "Spurs to win",       odds: 1.60, ballsOfSteel: false, result: "win"  },
        garry:   { betOn: "Man Utd to win",     odds: 2.10, ballsOfSteel: false, result: "loss" },
        dewi:    { betOn: "Villa to win",       odds: 1.90, ballsOfSteel: false, result: "loss" },
        steve:   { betOn: "Forest to win",      odds: 2.40, ballsOfSteel: true,  result: "loss" },
        lincoln: { betOn: "Liverpool -1",       odds: 2.30, ballsOfSteel: true,  result: "win"  },
        abby:    { betOn: "Charlton BTTS",      odds: 1.70, ballsOfSteel: false, result: "draw" },
      },
      monkey: {
        expectedReturn: 40.80, seed: "1c4d7e22", poolSize: 25,
        picks: [
          { pick: "Liverpool", odds: 1.25, result: "win", league: "Premier League" },
          { pick: "Barcelona", odds: 1.28, result: "win", league: "La Liga" },
          { pick: "Bayern Munich", odds: 1.18, result: "win", league: "Bundesliga" },
          { pick: "Juventus",  odds: 1.30, result: "win", league: "Serie A" },
          { pick: "Ajax",      odds: 1.33, result: "win", league: "Eredivisie" },
        ],
      },
    },

    /* ---------- WEEK 3 (DEMO) — Asia acca LANDS ---------- */
    { week: 3, date: "2026-08-30",  note: "DEMO",
      expectedReturn: { europe: 88.00, asia: 345.40 },
      bets: {
        lacey:   { betOn: "Newcastle to win",   odds: 1.95, ballsOfSteel: false, result: "loss" },
        tim:     { betOn: "Man City to win",    odds: 1.50, ballsOfSteel: false, result: "win"  },
        mikael:  { betOn: "Palace to win",      odds: 4.00, ballsOfSteel: true,  result: "loss" },
        roger:   { betOn: "Brighton to win",    odds: 2.20, ballsOfSteel: false, result: "loss" },
        niblett: { betOn: "Spurs over 2.5",     odds: 1.85, ballsOfSteel: false, result: "loss" },
        garry:   { betOn: "Man Utd BTTS",       odds: 1.72, ballsOfSteel: false, result: "win"  },
        dewi:    { betOn: "Villa to win",       odds: 2.00, ballsOfSteel: false, result: "win"  },
        steve:   { betOn: "Forest to win",      odds: 2.50, ballsOfSteel: false, result: "win"  },
        lincoln: { betOn: "Liverpool to win",   odds: 1.53, ballsOfSteel: false, result: "win"  },
        abby:    { betOn: "Charlton to win",    odds: 2.10, ballsOfSteel: false, result: "win"  },
      },
      monkey: {
        expectedReturn: 35.80, seed: "7b2f9c01", poolSize: 19,
        picks: [
          { pick: "Man City",    odds: 1.22, result: "win",  league: "Premier League" },
          { pick: "Real Madrid", odds: 1.20, result: "loss", league: "La Liga" },
          { pick: "Inter",       odds: 1.24, result: "win",  league: "Serie A" },
          { pick: "Bayern Munich", odds: 1.16, result: "win", league: "Bundesliga" },
          { pick: "Feyenoord",   odds: 1.36, result: "loss", league: "Eredivisie" },
        ],
      },
    },

    /* ---------- WEEK 4 (DEMO) — Europe: Hurzeler-ball sole loser ---------- */
    { week: 4, date: "2026-09-13",  note: "DEMO",
      expectedReturn: { europe: 150.00, asia: 110.00 },
      bets: {
        lacey:   { betOn: "Newcastle to win",   odds: 1.70, ballsOfSteel: false, result: "win"  },
        tim:     { betOn: "Man City to win",    odds: 1.40, ballsOfSteel: false, result: "win"  },
        mikael:  { betOn: "Arsenal draw",       odds: 3.40, ballsOfSteel: true,  result: "win"  },
        roger:   { betOn: "Brighton to win",    odds: 2.00, ballsOfSteel: false, result: "loss" },
        niblett: { betOn: "Spurs to win",       odds: 1.65, ballsOfSteel: false, result: "win"  },
        garry:   { betOn: "Man Utd to win",     odds: 1.80, ballsOfSteel: false, result: "win"  },
        dewi:    { betOn: "Villa to win",       odds: 1.75, ballsOfSteel: false, result: "loss" },
        steve:   { betOn: "Forest draw",        odds: 3.10, ballsOfSteel: false, result: "draw" },
        lincoln: { betOn: "Liverpool to win",   odds: 1.45, ballsOfSteel: false, result: "win"  },
        abby:    { betOn: "Charlton to win",    odds: 1.95, ballsOfSteel: false, result: "loss" },
      },
      monkey: {
        expectedReturn: 37.21, seed: "3e8a11ff", poolSize: 28,
        picks: [
          { pick: "Man City",      odds: 1.18, result: "win",  league: "Premier League" },
          { pick: "Bayern Munich", odds: 1.14, result: "win",  league: "Bundesliga" },
          { pick: "Barcelona",     odds: 1.30, result: "win",  league: "La Liga" },
          { pick: "Juventus",      odds: 1.28, result: "draw", league: "Serie A" },
          { pick: "PSV",           odds: 1.33, result: "win",  league: "Eredivisie" },
        ],
      },
    },

  ],
};
