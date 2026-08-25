/* ============================================================================
   ACCA ACCA ACCA — SEASON DATA   (managed by stats/admin/ — hand-editable too)
   Each team plays a 5-fold accumulator per week; it pays only if all 5 win.
   Odds are DECIMAL. A DRAW counts as a LOSS. Long bet = odds >= 2.00.
   ============================================================================ */

window.ACCA_DATA = {

  season:  "2026/27",
  updated: "Week 2 · 2026-08-25",

  highlight: "Monkey in the lead! Terrible first week for all involved... except Bang Average... first Long bet ticked off! \nCaptain Rog poor performance offset by Brightons magic... Sadly Garry couldnt rely on forest to improve his weeked. \nLong season ahead for Spurs and Man Utd Fans....",

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
        expectedReturn: 36.12, seed: "4b67c054", poolSize: 8,
        picks: [
          { pick: "Bayern Munich", odds: 1.26, result: "pending", league: "Bundesliga" },
          { pick: "Real Madrid", odds: 1.17, result: "pending", league: "La Liga" },
          { pick: "AC Milan", odds: 1.35, result: "pending", league: "Serie A" },
          { pick: "Barcelona", odds: 1.21, result: "pending", league: "La Liga" },
          { pick: "Juventus", odds: 1.2, result: "pending", league: "Serie A" },
        ],
      }
    },
  ],

};
