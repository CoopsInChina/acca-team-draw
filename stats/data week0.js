/* ============================================================================
   ACCA ACCA ACCA — SEASON DATA
   ----------------------------------------------------------------------------
   This is the ONLY file you edit each week. The webpage reads it and rebuilds
   every table, stat and chart automatically.

   >>> CURRENT STATE: WEEK 0 (pre-season). No weeks played yet, so every stat
       shows 0 / £0.00 / empty. Team line-ups below are TEMPORARY placeholders
       until the Week 1 draw. Add your first week to bring the page to life.

   THE MODEL
   ---------
   Each team plays a 5-fold ACCUMULATOR every week (one pick per player). The
   acca only pays out if ALL 5 picks win. You enter, per week:
     • each player's single pick  (bet, DECIMAL odds, balls-of-steel?, result)
     • each team's EXPECTED RETURN (the acca's potential payout) — win or lose

   Everything else is worked out for you (Total Won, Staked, Profit, ROI, Team
   Score, long bets, naughty step, guilt club, EBIT chart).

   ODDS ARE ALWAYS DECIMAL here (1.45, 2.50, 4.00…). A DRAW counts as a LOSS.

   ADD A WEEK: push a { week: N, date, expectedReturn: {…}, bets: {…} } block
   into the "weeks" array below. See data.demo.js for a fully worked example
   (4 weeks of sample data) you can copy the shape from — or, to preview the
   page fully populated, temporarily point index.html's
       <script src="data.js"></script>
   at "data.demo.js" instead.
   ============================================================================ */

window.ACCA_DATA = {

  season:  "2025/26",
  updated: "Week 0 · season not started",

  /* ---- Global settings ------------------------------------------------- */
  stakePerTeamPerWeek: 12.50,   // Total Staked per team = weeks played × this
  longBetOdds:         2.00,    // a pick at odds ≥ this counts as a "long bet"
  oddsDisplayDefault:  "decimal",

  /* ---- The two teams (TEMPORARY line-ups until the Week 1 draw) --------- */
  teams: [
    { id: "europe", name: "Team Europe", short: "Team EU",   color: "#2f6fed",
      members: ["lacey", "tim", "mikael", "roger", "niblett"] },
    { id: "asia",   name: "Team Asia",   short: "Team Asia", color: "#e8641c",
      members: ["garry", "dewi", "steve", "lincoln", "abby"] },
  ],

  /* ---- The players (name = alias shown on the sheet) -------------------- */
  players: {
    lacey:   { name: "Next yrs Magpie",   init: "NYM" },
    tim:     { name: "City 'til I die",   init: "CTD" },
    mikael:  { name: "Last Proletarians", init: "LPR" },
    roger:   { name: "Hurzeler-ball",     init: "HZB" },
    niblett: { name: "Spursy",            init: "SPU" },
    garry:   { name: "GloryHunter",       init: "GLH" },
    dewi:    { name: "Bang Average",      init: "BAV" },
    steve:   { name: "Garibaldi Reds",    init: "GAR" },
    lincoln: { name: "Red Devils",        init: "RDV" },
    abby:    { name: "Valley Commando",   init: "VLC" },
  },

  /* ---- Weekly results -------------------------------------------------- *
   * Empty = Week 0. Add your first { week: 1, … } block here to start.      */
  weeks: [],

};
