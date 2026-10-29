// src/lib/contestStandings.ts
//
// Live standings for a store contest. A contest covers 1-4 business weeks
// (Thu 7:00 AM MT -> Thu 7:00 AM MT) starting on contest.startDate.
//
//   Google Reviews / Rewards Signups  counted clicks in those weeks
//   BADA                              published scorecard BADA %, sales-weighted
//   Bev / App / Dessert / Add-on      published scorecard incidence %, guest-weighted
//   Score (Leaderboard Score)         the leaderboard formula over those weeks
//
// Scorecard-based metrics fill in as each week's scorecard is published.

import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore"
import { db } from "./firebase"
import { calculateScore } from "./score"
import { getStaffDisplayName } from "./staffName"
import { addCalendarDays, getLeagueWeekWindowForThursday, parseDateKey } from "./league/leagueWeek"

export type ContestMetricKey =
  | "reviews"
  | "rewards"
  | "score"
  | "bada"
  | "bevIncidence"
  | "appIncidence"
  | "dessIncidence"
  | "addOnIncidence"

export type ContestStandingRow = {
  rank: number | null
  code: string
  name: string
  value: number | null
  display: string
  prize?: string
}

export type ContestStandings = {
  metricKey: ContestMetricKey | null
  rows: ContestStandingRow[]
  weeks: Array<{ dateKey: string; published: boolean; hasDetail: boolean }>
  usesScorecard: boolean
}

export function getContestMetricKey(metric: string): ContestMetricKey | null {
  const m = metric.toLowerCase()
  if (m.includes("review")) return "reviews"
  if (m.includes("reward")) return "rewards"
  if (m.includes("score")) return "score"
  if (m.includes("beverage")) return "bevIncidence"
  if (m.includes("appetizer")) return "appIncidence"
  if (m.includes("dessert")) return "dessIncidence"
  if (m.includes("add on") || m.includes("add-on") || m.includes("addon")) return "addOnIncidence"
  if (m.includes("bada")) return "bada"
  return null
}

const SCORECARD_METRICS: ContestMetricKey[] = [
  "bada",
  "bevIncidence",
  "appIncidence",
  "dessIncidence",
  "addOnIncidence",
]

type Agg = {
  reviews: number
  rewards: number
  sales: number
  promos: number
  badaWeighted: number
  badaSimple: number
  badaCount: number
  guests: number
  inc: Record<"bevIncidence" | "appIncidence" | "dessIncidence" | "addOnIncidence", number>
  incGuests: number
}

function emptyAgg(): Agg {
  return {
    reviews: 0,
    rewards: 0,
    sales: 0,
    promos: 0,
    badaWeighted: 0,
    badaSimple: 0,
    badaCount: 0,
    guests: 0,
    inc: { bevIncidence: 0, appIncidence: 0, dessIncidence: 0, addOnIncidence: 0 },
    incGuests: 0,
  }
}

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function loadContestStandings(contest: {
  storeNumber: string
  metric: string
  startDate: string
  durationWeeks: number
  prizes: Array<{ place: number; prize: string }>
}): Promise<ContestStandings> {
  const metricKey = getContestMetricKey(contest.metric)
  const start = parseDateKey(contest.startDate)
  const weekCount = Math.max(1, Math.min(4, contest.durationWeeks || 1))

  if (!metricKey || !start) {
    return { metricKey, rows: [], weeks: [], usesScorecard: false }
  }

  const windows = Array.from({ length: weekCount }, (_, i) =>
    getLeagueWeekWindowForThursday(addCalendarDays(start, i * 7))
  )

  const store = contest.storeNumber

  const [staffSnap, clickSnap, badaSnaps] = await Promise.all([
    getDocs(query(collection(db, "staffUsers"), where("storeNumber", "==", store))),
    // By when the click happened; older clicks carry a weekKey label that is
    // one week low during daylight time, so the label can't be trusted.
    getDocs(
      query(
        collection(db, "stores", store, "uniqueClicks"),
        where("createdAt", ">=", Timestamp.fromDate(new Date(windows[0].weekStartAtISO))),
        where("createdAt", "<", Timestamp.fromDate(new Date(windows[windows.length - 1].weekEndAtISO)))
      )
    ),
    Promise.all(
      windows.map((w) => getDoc(doc(db, "stores", store, "badaPublishedWeeks", w.weekStartDateKey)))
    ),
  ])

  // Staff (with legacy ids folded into their current code, like the leaderboard).
  const names = new Map<string, string>()
  const aliasToCode = new Map<string, string>()

  staffSnap.docs.forEach((d) => {
    const data = d.data() as { code?: string; name?: string; legacyid?: string | null }
    const code = String(data.code ?? d.id)
    names.set(code, getStaffDisplayName(data, code))
    aliasToCode.set(code, code)
    if (data.legacyid) aliasToCode.set(String(data.legacyid), code)
  })

  const aggs = new Map<string, Agg>()
  const aggFor = (code: string) => {
    const existing = aggs.get(code)
    if (existing) return existing
    const next = emptyAgg()
    aggs.set(code, next)
    return next
  }

  clickSnap.docs.forEach((d) => {
    const data = d.data() as { staffId?: string; event?: string }
    if (!data.staffId) return
    const code = aliasToCode.get(String(data.staffId))
    if (!code) return
    if (data.event === "click_review") aggFor(code).reviews += 1
    if (data.event === "click_rewards") aggFor(code).rewards += 1
  })

  const weeks = windows.map((w, i) => {
    const snap = badaSnaps[i]
    const rows = snap.exists() ? ((snap.data().rows ?? []) as Array<Record<string, unknown>>) : []
    return {
      dateKey: w.weekStartDateKey,
      published: snap.exists(),
      hasDetail: rows.some((r) => typeof r.bevIncidence === "number"),
      rows,
    }
  })

  weeks.forEach((week) => {
    week.rows.forEach((row) => {
      const code = aliasToCode.get(String(row.code ?? ""))
      if (!code) return

      const a = aggFor(code)
      const sales = num(row.sales)
      const bada = num(row.badaPercent)
      const guests = num(row.guestCount)

      a.sales += sales
      a.promos += num(row.promosVoidsSum)

      if (bada > 0) {
        a.badaWeighted += bada * sales
        a.badaSimple += bada
        a.badaCount += 1
      }

      if (typeof row.bevIncidence === "number") {
        const weight = guests > 0 ? guests : sales
        a.guests += guests
        a.incGuests += weight
        a.inc.bevIncidence += num(row.bevIncidence) * weight
        a.inc.appIncidence += num(row.appIncidence) * weight
        a.inc.dessIncidence += num(row.dessIncidence) * weight
        a.inc.addOnIncidence += num(row.addOnIncidence) * weight
      }
    })
  })

  const badaOf = (a: Agg) =>
    a.sales > 0 && a.badaWeighted > 0
      ? a.badaWeighted / a.sales
      : a.badaCount > 0
        ? a.badaSimple / a.badaCount
        : 0

  const valueOf = (a: Agg): number | null => {
    switch (metricKey) {
      case "reviews":
        return a.reviews
      case "rewards":
        return a.rewards
      case "score":
        return calculateScore({
          badaPercent: badaOf(a),
          reviews: a.reviews,
          rewards: a.rewards,
          promoDollars: a.promos,
          sales: a.sales,
        })
      case "bada":
        return a.badaCount > 0 ? badaOf(a) : null
      default:
        return a.incGuests > 0 ? a.inc[metricKey] / a.incGuests : null
    }
  }

  const format = (value: number | null) => {
    if (value === null) return "—"
    if (metricKey === "reviews" || metricKey === "rewards" || metricKey === "score") {
      return value.toLocaleString()
    }
    return `${value.toFixed(1)}%`
  }

  const unranked = Array.from(names.keys()).map((code) => {
    const value = valueOf(aggs.get(code) ?? emptyAgg())
    return { code, name: names.get(code) ?? code, value }
  })

  unranked.sort((a, b) => {
    if (a.value === null && b.value === null) return a.name.localeCompare(b.name)
    if (a.value === null) return 1
    if (b.value === null) return -1
    return b.value - a.value || a.name.localeCompare(b.name)
  })

  // Standard competition ranking (ties share a place).
  let lastValue: number | null = null
  let lastRank = 0
  const rows: ContestStandingRow[] = unranked.map((row, index) => {
    let rank: number | null = null
    // Only servers with a result above zero are placed (no prizes for 0).
    if (row.value !== null && row.value > 0) {
      rank = row.value === lastValue ? lastRank : index + 1
      lastValue = row.value
      lastRank = rank
    }

    return {
      rank,
      code: row.code,
      name: row.name,
      value: row.value,
      display: format(row.value),
      prize: rank ? contest.prizes.find((p) => p.place === rank)?.prize : undefined,
    }
  })

  return {
    metricKey,
    rows,
    weeks: weeks.map(({ dateKey, published, hasDetail }) => ({ dateKey, published, hasDetail })),
    usesScorecard: SCORECARD_METRICS.includes(metricKey) || metricKey === "score",
  }
}
