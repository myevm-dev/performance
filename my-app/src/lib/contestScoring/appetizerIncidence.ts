// src/lib/contestScoring/appetizerIncidence.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreAppetizerIncidence(
  row: StaffContestInput
): ContestScoreResult {
  const value = row.appetizerIncidence ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: `${value.toFixed(1)}%`,
  }
}