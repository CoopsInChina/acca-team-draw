/* ============================================================================
   ACCA ACCA ACCA — SEASON DATA   (managed by stats/admin/ — hand-editable too)
   Each team plays a 5-fold accumulator per week; it pays only if all 5 win.
   Odds are DECIMAL. A DRAW counts as a LOSS. Long bet = odds >= 2.00.
   ============================================================================ */

window.ACCA_DATA = {

  season:  "2026/27",
  updated: "Week 3 · 2026-09-03",

  highlight: "Monkey for the Win!  Abby for the bin! Mr Hanson enters the guilt club, with the first entry this year, while Gloryhunter narrowly avoids it with the safety net to Niblett keeping his long record of no guilt club intact. Barely.",

  stakePerTeamPerWeek: 12.5,
  longBetOdds:         2,
  oddsDisplayDefault:  "decimal",
  showMonkeyDefault:   true,

  teams: [
    { id: "sunshine", name: "The Sunshine Bus", short: "Sunshine Bus", color: "#f2a71b",
      img: "assets/teams/SunshinePhoto.jpg",
      members: ["roger", "lincoln", "lacey", "tim", "abby"] },
    { id: "infantino", name: "Team Infantino", short: "Infantino", color: "#1560bd",
      img: "assets/teams/InfantinoPhotov2.jpg",
      members: ["garry", "dewi", "mikael", "steve", "niblett"] },
  ],

  houseTeam: { id: "monkey", name: "Monkey Magic", short: "Monkey", color: "#7d3cc9", img: "assets/teams/monkey.svg" },

  players: {
    lacey: { name: "Next yrs Magpie", init: "NYM", img: "assets/players/lacey.png" },
    tim: { name: "City 'til I die", init: "CTD", img: "assets/players/tim.png" },
    mikael: { name: "Last Proletarians", init: "LPR", img: "assets/players/mikael.png" },
    roger: { name: "Hurzeler-ball", init: "HZB", img: "assets/players/roger.png" },
    niblett: { name: "Spursy", init: "SPU", img: "assets/players/niblett.png" },
    garry: { name: "GloryHunter", init: "GLH", img: "assets/players/garry.png" },
    dewi: { name: "Bang Average", init: "BAV", img: "assets/players/dewi.png" },
    steve: { name: "Garibaldi Reds", init: "GAR", img: "assets/players/steve.png" },
    lincoln: { name: "Red Devils", init: "RDV", img: "assets/players/lincoln.png" },
    abby: { name: "Valley Commando", init: "VLC", img: "assets/players/abby.png" },
  },

  weeks: [
    { week: 1, date: "2026-08-20",
      expectedReturn: { sunshine: 84.85, infantino: 107.8 },
      bets: {
        roger: { betOn: "Lincoln to beat pompey", odds: 2.4, ballsOfSteel: false, result: "loss" },
        lincoln: { betOn: "Man Utd to beat Hull", odds: 1.37, ballsOfSteel: true, result: "loss" },
        lacey: { betOn: "inter milan to beat monza", odds: 1.2, ballsOfSteel: false, result: "win" },
        tim: { betOn: "PSG to beat rennes", odds: 1.36, ballsOfSteel: false, result: "draw" },
        abby: { betOn: "Stockport to beat blackpool", odds: 1.57, ballsOfSteel: false, result: "loss" },
        garry: { betOn: "Forest to beat Leeds", odds: 2.25, ballsOfSteel: true, result: "loss" },
        dewi: { betOn: "Millwall to beat norwich", odds: 2.2, ballsOfSteel: false, result: "win" },
        mikael: { betOn: "Arsenal to beat Cov", odds: 1.16, ballsOfSteel: false, result: "win" },
        steve: { betOn: "AEK to beat Iraklis", odds: 1.16, ballsOfSteel: false, result: "win" },
        niblett: { betOn: "Luton to beat Notts country", odds: 1.6, ballsOfSteel: false, result: "draw" },
      },
      monkey: {
        expectedReturn: 39.7, seed: "0b9bc04a", poolSize: 5,
        picks: [
          { pick: "West Ham United", odds: 1.35, result: "loss", league: "Championship" },
          { pick: "Arsenal", odds: 1.17, result: "win", league: "Premier League" },
          { pick: "Inter Milan", odds: 1.2, result: "win", league: "Serie A" },
          { pick: "PSV Eindhoven", odds: 1.33, result: "win", league: "Eredivisie" },
          { pick: "Feyenoord", odds: 1.26, result: "win", league: "Eredivisie", backup: true },
        ],
      }
    },
    { week: 2, date: "2026-08-25",
      expectedReturn: { sunshine: 49.96, infantino: 52.13 },
      bets: {
        roger: { betOn: "Bayern Munich to beat stuggart", odds: 1.25, ballsOfSteel: false, result: "win" },
        lincoln: { betOn: "AC to beat Venezia", odds: 1.37, ballsOfSteel: false, result: "win" },
        lacey: { betOn: "Dortmund to beat Hamburg", odds: 1.3, ballsOfSteel: false, result: "win" },
        tim: { betOn: "Wolves to beat stoke", odds: 1.47, ballsOfSteel: false, result: "win" },
        abby: { betOn: "Southend to beat kidderminster", odds: 1.42, ballsOfSteel: false, result: "loss" },
        garry: { betOn: "Liverpool to beat forest", odds: 1.5, ballsOfSteel: false, result: "draw" },
        dewi: { betOn: "arsenal to beat villa", odds: 1.5, ballsOfSteel: false, result: "win" },
        mikael: { betOn: "Bayern Munich to beat stuggart", odds: 1.22, ballsOfSteel: false, result: "win" },
        steve: { betOn: "Dortmund to beat Hamburg", odds: 1.3, ballsOfSteel: false, result: "win" },
        niblett: { betOn: "Feryenoord to beat den haag", odds: 1.36, ballsOfSteel: false, result: "draw" },
      },
      monkey: {
        expectedReturn: 36.12, seed: "4b67c054", poolSize: 8,
        picks: [
          { pick: "Bayern Munich", odds: 1.26, result: "win", league: "Bundesliga" },
          { pick: "Real Madrid", odds: 1.17, result: "win", league: "La Liga" },
          { pick: "AC Milan", odds: 1.35, result: "win", league: "Serie A" },
          { pick: "Barcelona", odds: 1.21, result: "win", league: "La Liga" },
          { pick: "Juventus", odds: 1.2, result: "win", league: "Serie A" },
        ],
      }
    },
    { week: 3, date: "2026-09-03",
      expectedReturn: { sunshine: 0, infantino: 0 },
      bets: {
        roger: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        lincoln: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        lacey: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        tim: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        abby: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        garry: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        dewi: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        mikael: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        steve: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
        niblett: { betOn: "", odds: 0, ballsOfSteel: false, result: "pending" },
      },
      monkey: {
        expectedReturn: 36.88, seed: "d6123fa8", poolSize: 5,
        picks: [
          { pick: "Barcelona", odds: 1.27, result: "pending", league: "La Liga", backup: true },
          { pick: "Bayern Munich", odds: 1.15, result: "pending", league: "Bundesliga", backup: true },
          { pick: "VfL Wolfsburg", odds: 1.29, result: "pending", league: "2. Bundesliga" },
          { pick: "West Ham United", odds: 1.35, result: "pending", league: "Championship" },
          { pick: "Manchester City", odds: 1.16, result: "pending", league: "Premier League" },
        ],
      }
    },
  ],

};
