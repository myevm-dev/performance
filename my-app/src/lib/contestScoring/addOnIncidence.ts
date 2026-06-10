// src/lib/contestScoring/addOnIncidence.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreAddOnIncidence(
  row: StaffContestInput
): ContestScoreResult {
  const value = row.addOnIncidence ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: `${value.toFixed(1)}%`,
  }
}