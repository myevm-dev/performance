// src/lib/contestScoring/dessertIncidence.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreDessertIncidence(
  row: StaffContestInput
): ContestScoreResult {
  const value = row.dessertIncidence ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: `${value.toFixed(1)}%`,
  }
}