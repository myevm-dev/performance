// src/lib/contestScoring/index.ts
import { scoreGoogleReviews } from "./googleReviews"
import { scoreRewardsSignups } from "./rewardsSignups"
import { scoreOverall } from "./score"
import { scoreBada } from "./bada"
import { scoreBeverageIncidence } from "./beverageIncidence"
import { scoreAppetizerIncidence } from "./appetizerIncidence"
import { scoreDessertIncidence } from "./dessertIncidence"
import { scoreAddOnIncidence } from "./addOnIncidence"

import type {
  ContestDoc,
  ContestLeaderboardRow,
  ContestMetric,
  ContestScoreResult,
  ContestStatus,
  StaffContestInput,
} from "./types"

export type {
  ContestDoc,
  ContestLeaderboardRow,
  ContestMetric,
  ContestPrize,
  ContestScoreResult,
  ContestStatus,
  StaffContestInput,
} from "./types"

export const contestMetrics: ContestMetric[] = [
  "Google Reviews",
  "Rewards Signups",
  "Score",
  "BADA",
  "Beverage Incidence",
  "Appetizer Incidence",
  "Dessert Incidence",
  "Add On Incidence",
]

export function getContestStatus(
  contest: {
    startDate: string
    endDate: string
    status?: ContestStatus
  },
  now = new Date()
): ContestStatus {
  if (contest.status === "cancelled") return "cancelled"

  const start = new Date(`${contest.startDate}T00:00:00`)
  const end = new Date(`${contest.endDate}T23:59:59`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return contest.status ?? "upcoming"
  }

  if (now < start) return "upcoming"
  if (now > end) return "completed"

  return "active"
}

export function scoreContestMetric(
  metric: ContestMetric,
  row: StaffContestInput
): ContestScoreResult {
  if (metric === "Google Reviews") return scoreGoogleReviews(row)
  if (metric === "Rewards Signups") return scoreRewardsSignups(row)
  if (metric === "Score") return scoreOverall(row)
  if (metric === "BADA") return scoreBada(row)
  if (metric === "Beverage Incidence") return scoreBeverageIncidence(row)
  if (metric === "Appetizer Incidence") return scoreAppetizerIncidence(row)
  if (metric === "Dessert Incidence") return scoreDessertIncidence(row)
  if (metric === "Add On Incidence") return scoreAddOnIncidence(row)

  return {
    value: 0,
    sortValue: 0,
    formattedValue: "0",
  }
}

export function buildContestLeaderboard(
  contest: ContestDoc,
  rows: StaffContestInput[]
): ContestLeaderboardRow[] {
  const scoredRows = rows
    .map((row) => {
      const scored = scoreContestMetric(contest.metric, row)

      return {
        ...row,
        value: scored.value,
        sortValue: scored.sortValue,
        formattedValue: scored.formattedValue,
      }
    })
    .sort((a, b) => {
      if (b.sortValue !== a.sortValue) return b.sortValue - a.sortValue
      return a.staffName.localeCompare(b.staffName)
    })

  return scoredRows.map((row, index) => {
    const rank = index + 1
    const prize = contest.prizes.find((item) => item.place === rank)

    return {
      rank,
      staffId: row.staffId,
      staffName: row.staffName,
      storeNumber: row.storeNumber,
      value: row.value,
      formattedValue: row.formattedValue,
      prize: prize?.prize,
    }
  })
}