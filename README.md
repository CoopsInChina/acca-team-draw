# ⚽ Acca Acca Acca

A little web app for a friends' weekly football **accumulator league**. Two fixed
teams of five each place a 5‑fold acca every week; the site tracks wins, streaks,
profit and a stack of side‑competitions, and pits the two teams head‑to‑head
against an automated benchmark team, **Monkey Magic**.

Everything is static HTML/CSS/JS (no build step, no framework). A tiny optional
Node helper powers the weekly data‑entry editor and the Monkey generator.

**Live site**

| Page | URL |
|------|-----|
| Season stats dashboard | https://coopsinchina.github.io/acca-team-draw/stats/ |
| Team draw (week‑1 one‑off) | https://coopsinchina.github.io/acca-team-draw/ |

> ⚠️ The site is a **public** GitHub Pages site, so everything in it — including
> the players' photos — is reachable by anyone with the link.

---

## Repository layout

```
team-draw/
├── index.html                  Team-draw app (randomly splits 10 players into 2 teams)
├── README.md                   This file
├── .gitignore                  Ignores the API key, *.bak, .DS_Store
└── stats/
    ├── index.html              The season stats dashboard (reads data.js)
    ├── data.js                 ← THE data file. Everything is driven from here.
    ├── data week0.js           Pre-season snapshot (empty weeks) — keep for reference
    ├── data_old.js             An earlier data snapshot — keep for reference
    ├── README.md               Short "update each week" cheatsheet
    ├── assets/
    │   ├── players/<id>.png     One photo per player (fallback: initials)
    │   ├── teams/europe.svg     Team crests
    │   ├── teams/asia.svg
    │   └── teams/monkey.svg     Monkey Magic house-team crest
    └── admin/                   Local-only tooling (not needed to view the site)
        ├── index.html          The week-entry editor UI
        ├── serve.js            Zero-dependency Node server (saves data.js, runs Monkey)
        ├── monkey.js           Monkey Magic banker generator (calls The Odds API)
        ├── monkey.mock.js      Sample odds data so monkey.js can be tested offline
        └── oddsapi.key         Your Odds API key (git-ignored, create locally)
```

---

## 1. Team draw — `index.html`

The original app, meant for **week 1 only**. It shows the 10 players in a dugout
and, on **Draw Teams**, shuffles and animates them onto a 5‑a‑side pitch as two
teams. Once the real teams are fixed for the season it isn't used again — the
season runs on the stats page.

Pure front‑end; just open it or visit the live URL.

---

## 2. Season stats dashboard — `stats/index.html`

Reads `stats/data.js` and rebuilds every panel automatically. Sections, top to
bottom:

| Panel | What it shows |
|-------|---------------|
| **Weekly highlight** | A manual one‑line headline (the `highlight` field). |
| **Head to Head** | Team EU vs Team Asia across six metrics, **plus Monkey Magic** as an optional benchmark column. Best value per metric is gold. |
| **Accumulated EBIT** | A line chart of each team's running cumulative profit per round (EU & Asia only). |
| **Player Stats** | One table per team, with a Team Average row. |
| **Balls of Steel** & **Naughty Step** | Winning BoS bets / BoS bets that lost. |
| **Long Bets** | Successful vs failed long bets. |
| **Guilt Club** | £ charged to each week's sole non‑winner, per team. |
| **Week by Week** | Every pick, odds and result per week — including the Monkey's 5 picks. |

**Header controls**

- **Decimal ⇄ Fractional** — how odds are displayed (data is always decimal).
- **🐒 Monkey: on/off** — show/hide the Monkey benchmark. Hidden automatically if
  there's no monkey data. Choice is remembered in the browser.

### How each stat is worked out

The weekly bet is a **5‑fold accumulator** — it only pays if **all five win**. A
**draw counts as a loss** everywhere.

**Per player**
- **Correct** — winning bets · **% Correct** — wins ÷ bets placed
- **Ave Win / Lose / All Odds** — mean decimal odds of winning / losing / all bets
- **Win Streak / Lose Streak** — current run from their most recent settled bet

**Per team (Head to Head)**
- **Individual Wins** — sum of the five members' wins
- **Team Score** — weeks where all five placed a bet *and* all five won
- **Total Staked** — weeks played × **£12.50** per team
- **Total Won** — sum of that team's **expected return** on weeks the acca landed
- **Profit** — Total Won − Total Staked · **ROI** — Profit ÷ Staked × 100

**Side competitions**
- **Long bet** — any pick at odds **≥ 2.00** (won = successful, lost/drew = failed)
- **Naughty Step** — a Balls‑of‑Steel bet that lost or drew
- **Balls of Steel** table — count of **winning** BoS bets
- **Guilt Club** — if exactly one team member fails to win, they alone sink the
  acca and are charged that week's **full expected return**

**Monkey Magic** is a house benchmark: it appears **only** in Head to Head and the
week summaries, and is deliberately excluded from the player tables, Balls of
Steel, Naughty Step, Long Bets, Guilt Club and the EBIT chart.

---

## 3. The data file — `stats/data.js`

A single JS file assigning one object to `window.ACCA_DATA`. It is hand‑editable,
but the admin editor (below) writes it for you. Shape:

```js
window.ACCA_DATA = {
  season: "2026/27",
  updated: "Week 5 · 2026-09-20",
  highlight: "🔥 …one-line headline shown at the top…",

  stakePerTeamPerWeek: 12.50,   // acca stake per team per week
  longBetOdds: 2.00,            // odds ≥ this = a "long bet"
  oddsDisplayDefault: "decimal",
  showMonkeyDefault: true,      // Head-to-Head shows Monkey by default

  teams: [                      // two fixed teams, five members each
    { id:"europe", name:"Team Europe", short:"Team EU", color:"#2f6fed",
      img:"assets/teams/europe.svg", members:["lacey","tim","mikael","roger","niblett"] },
    { id:"asia",   name:"Team Asia",   short:"Team Asia", color:"#e8641c",
      img:"assets/teams/asia.svg",   members:["garry","dewi","steve","lincoln","abby"] },
  ],

  houseTeam: { id:"monkey", name:"Monkey Magic", short:"Monkey",
               color:"#7d3cc9", img:"assets/teams/monkey.svg" },

  players: {                    // name = the alias shown on screen
    tim: { name:"City 'til I die", init:"CTD", img:"assets/players/tim.png" },
    // …ten players…
  },

  weeks: [
    { week:1, date:"2026-08-16",
      expectedReturn: { europe: 124.30, asia: 96.00 },   // each acca's potential payout
      bets: {
        tim: { betOn:"Man City to win", odds:1.45, ballsOfSteel:false, result:"win" },
        // …one line per player… result = "win" | "loss" | "draw" | "pending"
      },
      monkey: {                                          // the house team's week
        expectedReturn: 34.47, seed:"9f3a2b10", poolSize:22,
        picks: [
          { pick:"Man City", odds:1.20, result:"win", league:"Premier League" },
          // …five picks…
        ],
      },
    },
    // …one block per week…
  ],
};
```

- **Odds are always decimal** (e.g. `1.45`). The page has a display toggle.
- `expectedReturn` per team = the acca's potential payout for the £12.50 stake.
- The Monkey's `expectedReturn` is **auto‑computed** = product of the 5 odds × £12.50.
- `data week0.js` / `data_old.js` are kept snapshots — the live file is `data.js`.

---

## 4. Admin tooling (local only)

None of this is needed to *view* the site — it's for **entering data each week**.
It runs on your machine and is never exposed by GitHub Pages.

### 4a. The week editor — `stats/admin/` + `serve.js`

A form that writes `stats/data.js` for you, so you never hand‑edit it.

**Easiest way to start it — double‑click [`acca-editor.command`](acca-editor.command)**
in Finder (repo root). It starts the server and opens the editor in your
browser automatically; leave the Terminal window it opens running while you
work, and close it (or press Ctrl+C) when you're done. First run on macOS may
need a right‑click → **Open** to get past Gatekeeper's unsigned‑script warning.

Or start it manually:

```bash
node stats/admin/serve.js
```

Then open **http://localhost:4599/stats/admin/**.

> A webpage — including the live GitHub Pages site — can never start this
> server itself; browsers deliberately block a page from launching programs
> on your machine. The editor always has to be started locally, one way or
> the other, by you.

`serve.js` is a tiny zero‑dependency Node server that:
- serves the repo locally (so the editor and assets load),
- **`POST /api/save-data`** — overwrites `stats/data.js`, keeping the previous
  version as `stats/data.js.bak` (rejects anything that isn't a data file),
- **`GET /api/monkey`** — runs the Monkey generator and returns the picks.

**The editor UI lets you:**
- Pick **New week** (auto‑numbered) or edit/delete an existing week.
- Enter each player's **bet, decimal odds, 🔩 balls‑of‑steel, result**.
- Enter each team's **expected return**, and the **weekly highlight**.
- **🐒 Generate picks** for Monkey Magic (see below).
- **Apply week** (stages it in memory + updates the live preview), then **Save to
  data.js** — or **Download** / **Copy** if you're running it without the server
  (plain `file://`, where in‑place saving isn't possible).

**The two‑stage weekly workflow**

1. **Before the games** — New week → enter the players' picks/odds (results left
   *pending*) → set expected returns → **🐒 Generate picks** → Save. Everything
   sits pending.
2. **After the games** — re‑open that week → set every **result** (players *and*
   the 5 Monkey picks) via the dropdowns → Save.

### 4b. Monkey Magic generator — `stats/admin/monkey.js`

Monkey Magic is the automated benchmark "team". Each week it:

1. Pulls upcoming‑weekend odds from **[The Odds API](https://the-odds-api.com)**
   for the English, German, Italian, Spanish and Dutch leagues (top *and* lower
   divisions, to widen the pool).
2. Keeps every match whose **home** team is a favourite priced **under 1.40** in
   the coming Fri–Mon window.
3. **Randomly picks 5** of them via a recorded RNG **seed** (so any draw is
   reproducible), recording both the pool size and the 5 chosen.

The pick is **locked on the first attempt** — no re‑rolling — and its expected
return is auto‑computed (product of the 5 odds × £12.50).

**API key** — free tier (500 requests/month; a generation uses ~11). Get a key at
the‑odds‑api.com, then either:

```bash
echo "YOUR_KEY" > stats/admin/oddsapi.key        # git-ignored
# or:  ODDS_API_KEY=YOUR_KEY node stats/admin/monkey.js
```

**Run it from the command line** (handy for testing):

```bash
node stats/admin/monkey.js            # live pull
node stats/admin/monkey.js --mock     # offline sample data (no key)
node stats/admin/monkey.js --seed 1a2b3c4d   # reproduce a specific draw
node stats/admin/monkey.js --out picks.json  # also write the full result to a file
```

From the editor, the **🐒 Generate picks** button calls the server's
`/api/monkey`. To rehearse the flow before the season starts (when too few
bankers exist for a live pull), open the editor with a mock flag:
`http://localhost:4599/stats/admin/?mock=1`.

Config (leagues, the 1.40 threshold, home‑only, pool cap, region) lives in the
`CONFIG` object at the top of `monkey.js`.

---

## 5. Updating each week (the full loop)

```bash
open acca-editor.command                  # or double-click it in Finder
# — or, without the launcher —
node stats/admin/serve.js                 # start the editor
# → edit in the browser, Save
git add -A
git commit -m "Week N results"
git push                                  # GitHub Pages redeploys in ~1–2 min
```

---

## 6. Deployment

- Hosted on **GitHub Pages** from the `main` branch, repo root.
- Any push to `main` triggers a redeploy (a minute or two).
- The repo is **public**; a private repo would disable Pages on the free plan,
  and Pages sites are public regardless of repo visibility.

## 7. Requirements

- **Viewing / editing the site:** any modern browser. Nothing else.
- **The editor's Save and the Monkey generator:** Node.js (uses only built‑ins;
  no `npm install`).

---

*Player photos and crests live in `stats/assets/` — drop a replacement file in
with the same name to update one. Odds are always entered as decimals; a draw
always counts as a loss.*
