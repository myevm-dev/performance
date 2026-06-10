// src/lib/contestScoring/beverageIncidence.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreBeverageIncidence(
  row: StaffContestInput
): ContestScoreResult {
  const value = row.beverageIncidence ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: `${value.toFixed(1)}%`,
  }
}