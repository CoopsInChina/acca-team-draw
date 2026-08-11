/* Sample data shaped like The Odds API /v4 h2h responses, for testing monkey.js
   without an API key. commence_time is set inside the given weekend window so
   the events pass the date filter. Exported as a function of the window. */
module.exports = function (win) {
  const sat = new Date(win.from); sat.setUTCDate(sat.getUTCDate() + 1); sat.setUTCHours(14, 0, 0, 0);
  const when = sat.toISOString();
  const outside = new Date(win.to); outside.setUTCDate(outside.getUTCDate() + 5); // beyond the window

  // helper to build an event with two bookmakers' h2h prices
  const ev = (id, home, away, hp, ap, dp, time = when) => ({
    id, commence_time: time, home_team: home, away_team: away,
    bookmakers: [
      { key: 'bookA', markets: [{ key: 'h2h', outcomes: [
        { name: home, price: hp[0] }, { name: away, price: ap[0] }, { name: 'Draw', price: dp[0] } ] }] },
      { key: 'bookB', markets: [{ key: 'h2h', outcomes: [
        { name: home, price: hp[1] }, { name: away, price: ap[1] }, { name: 'Draw', price: dp[1] } ] }] },
    ],
  });

  return [
    { league: { key: 'soccer_epl', country: 'England', label: 'Premier League' }, events: [
      ev('epl1', 'Man City',   'Burnley',      [1.20, 1.22], [13.0, 15.0], [7.0, 7.5]),   // fav 1.21 ✓
      ev('epl2', 'Arsenal',    'Everton',      [1.34, 1.36], [9.0, 10.0],  [5.0, 5.5]),   // fav 1.35 ✓
      ev('epl3', 'Chelsea',    'Newcastle',    [2.10, 2.20], [3.30, 3.50], [3.4, 3.5]),   // fav 2.15 ✗
      ev('epl4', 'Liverpool',  'Sheffield Utd',[1.18, 1.19], [16.0, 18.0], [8.0, 8.5]),   // fav 1.185 ✓
    ]},
    { league: { key: 'soccer_germany_bundesliga', country: 'Germany', label: 'Bundesliga' }, events: [
      ev('bun1', 'Bayern Munich', 'Bochum',    [1.14, 1.16], [19.0, 21.0], [8.5, 9.0]),   // fav 1.15 ✓
      ev('bun2', 'Leverkusen',    'Augsburg',  [1.38, 1.42], [8.0, 8.5],   [5.0, 5.2]),   // fav 1.40 ✗ (not < 1.40)
      ev('bun3', 'Dortmund',      'Union Berlin',[1.30, 1.33],[10.0, 11.0],[5.5, 6.0]),   // fav 1.315 ✓
    ]},
    { league: { key: 'soccer_italy_serie_a', country: 'Italy', label: 'Serie A' }, events: [
      ev('ita1', 'Inter',   'Empoli',   [1.25, 1.27], [12.0, 13.0], [6.0, 6.5]),          // fav 1.26 ✓
      ev('ita2', 'Juventus','Salernitana',[1.28, 1.30],[11.0, 12.0],[5.8, 6.0]),          // fav 1.29 ✓
      ev('ita3', 'Napoli',  'Genoa',    [1.55, 1.60], [6.0, 6.5],   [4.0, 4.2]),          // fav 1.575 ✗
      ev('ita4', 'AC Milan','Lecce',    [1.36, 1.39], [9.0, 9.5],   [5.0, 5.3], outside), // ✓ price but OUTSIDE window ✗
    ]},
    { league: { key: 'soccer_spain_la_liga', country: 'Spain', label: 'La Liga' }, events: [
      ev('spa1', 'Real Madrid', 'Getafe',    [1.20, 1.24], [13.0, 15.0], [7.0, 7.5]),   // HOME fav 1.22 ✓
      ev('spa2', 'Alaves',      'Barcelona', [9.0, 10.0],  [1.28, 1.32], [5.5, 6.0]),   // AWAY fav 1.30 — excluded by homeOnly ✗
    ]},
  ];
};
