# Acca Acca Acca — Season Stats

A self-updating stats page for the league. The whole site rebuilds itself from a
single data file — you never touch the HTML.

## Files

| File         | What it is                                                        |
|--------------|-------------------------------------------------------------------|
| `index.html` | The webpage. Reads `data.js`, draws every table, stat and chart. Leave alone. |
| `data.js`    | **The only file you edit.** Teams, players and each week's picks.  |

## The model

Each team plays a **5-fold accumulator** every week — one pick per player. The
acca only pays out if **all 5 win**. Each week you enter:

1. Every player's single pick — `betOn`, **decimal** `odds`, `ballsOfSteel`, `result`.
2. Each team's **`expectedReturn`** — the acca's potential payout, win or lose.

Everything else is worked out automatically:

- **Total Won** = sum of expected returns for weeks the acca landed (all 5 won).
- **Total Staked** = weeks played × £12.50 per team.
- **Profit / ROI**, **Team Score** (weeks all 5 win), per-player win %, average
  win/lose/all odds, and win/lose streaks.
- **Long bets** = any pick at odds ≥ 2.00 (won → Successful, lost/drew → Failed).
- **Naughty Step** = a Balls-of-Steel bet that lost or drew.
- **Guilt Club** = the sole non-winner in a team is charged that week's full
  expected return (they alone sank the acca).
- **Accumulated EBIT** chart = each team's running cumulative profit per round.

## Updating each week

1. Open `data.js`, copy the last `{ week: N, … }` block, bump the week + date.
2. Set `expectedReturn` for each team.
3. Fill in each player's pick. `result` is `"win"`, `"loss"`, `"draw"` or
   `"pending"` — **a draw counts as a loss** everywhere.
4. Save, commit, push. GitHub Pages refreshes within a minute.

```js
{ week: 5, date: "2025-09-20",
  expectedReturn: { europe: 132.00, asia: 88.50 },
  bets: {
    tim: { betOn: "Man City to win", odds: 1.45, ballsOfSteel: false, result: "win" },
    // …one line per player…
  }
}
```

## Before the real season starts

- Delete the `DEMO` week blocks (or set every result to `"pending"`).
- Confirm the team line-ups and update `season` / `updated` at the top.

## Tweakable rules (top of `data.js`)

| Setting                | Default   | Meaning                              |
|------------------------|-----------|--------------------------------------|
| `stakePerTeamPerWeek`  | `12.50`   | Weekly acca stake per team           |
| `longBetOdds`          | `2.00`    | Odds at/above which a pick is "long" |
| `oddsDisplayDefault`   | `decimal` | Startup odds format (page has a toggle) |

Odds are always **typed as decimals**; the page has a Decimal ⇄ Fractional
toggle for display only.
