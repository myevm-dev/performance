// src/lib/contestScoring/score.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreOverall(row: StaffContestInput): ContestScoreResult {
  const value = row.score ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: Math.round(value).toLocaleString(),
  }
}