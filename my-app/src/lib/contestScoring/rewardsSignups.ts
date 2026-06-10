// src/lib/contestScoring/rewardsSignups.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreRewardsSignups(row: StaffContestInput): ContestScoreResult {
  const value = row.rewardsSignups ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: Math.round(value).toLocaleString(),
  }
}