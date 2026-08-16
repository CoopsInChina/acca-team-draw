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
  updated: "Week 0 · Teams drafted 2026-08-16",

  /* ---- Weekly highlight — a manual headline, rewrite it each week ------- */
  highlight: "🪣 Teams are locked in! The Sunshine Bus (captain Roger) vs Team Infantino (captain Garry) — bring on Week 1.",

  /* ---- Global settings ------------------------------------------------- */
  stakePerTeamPerWeek: 12.50,   // Total Staked per team = weeks played × this
  longBetOdds:         2.00,    // a pick at odds ≥ this counts as a "long bet"
  oddsDisplayDefault:  "decimal",
  showMonkeyDefault:   true,     // Head-to-Head shows Monkey Magic by default

  /* ---- The two fixed teams (drafted 2026-08-16) -------------------------- */
  teams: [
    { id: "sunshine",  name: "The Sunshine Bus", short: "Sunshine Bus", color: "#f2a71b",
      img: "assets/teams/sunshine.svg", captain: "roger",
      members: ["roger", "lincoln", "lacey", "tim", "abby"] },
    { id: "infantino", name: "Team Infantino",   short: "Infantino",    color: "#1560bd",
      img: "assets/teams/infantino.svg", captain: "garry",
      members: ["garry", "dewi", "mikael", "steve", "niblett"] },
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

  /* ---- Weekly results ---------------------------------------------------- *
   * Week 0 — teams are drafted but no bets placed yet. Add the first        *
   * { week: 1, ... } block (via stats/admin/) once fixtures kick off.        */
  weeks: [],
};
