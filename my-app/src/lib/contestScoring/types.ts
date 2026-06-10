// src/lib/contestScoring/types.ts

export type ContestMetric =
  | "Google Reviews"
  | "Rewards Signups"
  | "Score"
  | "BADA"
  | "Beverage Incidence"
  | "Appetizer Incidence"
  | "Dessert Incidence"
  | "Add On Incidence"

export type ContestStatus = "upcoming" | "active" | "completed" | "cancelled"

export type ContestPrize = {
  place: number
  prize: string
}

export type ContestDoc = {
  id: string
  storeNumber: string
  name: string
  metric: ContestMetric
  durationWeeks: number
  startDate: string
  endDate: string
  prizes: ContestPrize[]
  status?: ContestStatus
  businessWeekStartDay?: "Thursday"
}

export type StaffContestInput = {
  staffId: string
  staffName: string
  storeNumber: string

  googleReviews?: number
  rewardsSignups?: number

  score?: number
  badaPercent?: number

  beverageIncidence?: number
  appetizerIncidence?: number
  dessertIncidence?: number
  addOnIncidence?: number
}

export type ContestScoreResult = {
  value: number
  formattedValue: string
  sortValue: number
}

export type ContestLeaderboardRow = {
  rank: number
  staffId: string
  staffName: string
  storeNumber: string
  value: number
  formattedValue: string
  prize?: string
}