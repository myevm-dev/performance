// src/lib/badaWindow.ts
//
// BADA only counts toward the trailing-21-day leaderboard if its business
// week (Thu-Wed, rolling at Thursday 7:00 AM MT) is one of the last three
// completed weeks. Anything older is stale and ignored.

import { getLeagueWeekWindowAt, shiftLeagueWeek } from "./league/leagueWeek"

export const BADA_WINDOW_WEEKS = 3

// Thursday date key ("YYYY-MM-DD") of the oldest week that still counts.
export function getBadaCutoffWeekKey(now: Date = new Date()) {
  const current = getLeagueWeekWindowAt(now)
  return shiftLeagueWeek(current, -BADA_WINDOW_WEEKS).weekStartDateKey
}

// BADA docs are keyed by the week's Thursday date (stores/{n}/badaPublishedWeeks/{YYYY-MM-DD}).
export function getBadaWeekKey(docId: string, data?: object) {
  const raw = (data as { weekKey?: unknown } | undefined)?.weekKey
  const fromData = typeof raw === "string" ? raw : ""
  const key = /^\d{4}-\d{2}-\d{2}/.test(fromData) ? fromData : docId
  return key.slice(0, 10)
}

export function isBadaWeekInWindow(weekKey: string, now: Date = new Date()) {
  return /^\d{4}-\d{2}-\d{2}$/.test(weekKey) && weekKey >= getBadaCutoffWeekKey(now)
}
