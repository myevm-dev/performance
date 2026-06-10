// src/lib/contestScoring/bada.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreBada(row: StaffContestInput): ContestScoreResult {
  const value = row.badaPercent ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: `${value.toFixed(1)}%`,
  }
}