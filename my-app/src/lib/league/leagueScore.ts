// src/lib/league/leagueScore.ts
//
// The league scores each week with the exact same formula as this
// leaderboard (../score.ts) — just over one week instead of 21 days.
// daytadna.com/league uses an identical copy (datadna src/lib/score.ts).

export { calculateScore as calculateLeagueScore } from "../score"
