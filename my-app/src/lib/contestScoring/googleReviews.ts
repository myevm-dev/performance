// src/lib/contestScoring/googleReviews.ts
import type { ContestScoreResult, StaffContestInput } from "./types"

export function scoreGoogleReviews(row: StaffContestInput): ContestScoreResult {
  const value = row.googleReviews ?? 0

  return {
    value,
    sortValue: value,
    formattedValue: Math.round(value).toLocaleString(),
  }
}