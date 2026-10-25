// src/lib/league/weeklyStoreScore.ts (shared with daytadna league — keep in sync)

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { getStaffDisplayName } from "../staffName"
import { db } from "../firebase"
import { calculateLeagueScore as calculateScore } from "./leagueScore"

type UniqueClickDoc = {
  id: string
  storeNumber?: string
  staffId?: string
  event?: string
  weekKey?: string
  weekStartKey?: string
}

type BadaPublishedRow = Record<string, unknown>

export type WeeklyStaffScoreRow = {
  code: string
  name: string

  score: number
  reviews: number
  rewards: number
  signups: number

  badaPercent: number
  promoDollars: number
  sales: number
}

export type WeeklyStoreScoreInput = {
  storeNumber: string

  // Example: "2026-W26"
  // Used for current live week review/reward clicks.
  weekKey: string

  // Example: "2026-06-18"
  // Used for previous closed week BADA.
  badaWeekKey: string
}

export type WeeklyStoreScoreResult = {
  storeNumber: string
  weekKey: string
  badaWeekKey: string

  // Sum of top 8 staff scores.
  score: number

  badaPercent: number
  reviews: number
  rewards: number
  promoDollars: number
  sales: number

  badaPublished: boolean
  badaRowCount: number
  clickCount: number

  staffScores: WeeklyStaffScoreRow[]
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,]/g, "")
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function toBadaPercent(value: unknown) {
  const n = toNumber(value)

  // Allows either 159.2 or 1.592 formats.
  if (n > 0 && n <= 5) return n * 100

  return n
}

function pickNumber(row: BadaPublishedRow, keys: string[]) {
  for (const key of keys) {
    if (key in row) {
      const value = toNumber(row[key])
      if (value !== 0) return value
    }
  }

  return 0
}

function pickBadaPercent(row: BadaPublishedRow, keys: string[]) {
  for (const key of keys) {
    if (key in row) {
      const value = toBadaPercent(row[key])
      if (value !== 0) return value
    }
  }

  return 0
}

function pickString(row: BadaPublishedRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return ""
}

function getBadaRowCode(row: BadaPublishedRow) {
  return pickString(row, [
    "code",
    "staffId",
    "staffCode",
    "serverCode",
    "employeeCode",
  ])
}

function getBadaRowName(row: BadaPublishedRow) {
  return pickString(row, [
    "mappedName",
    "name",
    "serverName",
    "employeeName",
    "originalName",
  ])
}

function summarizeBadaRows(rows: BadaPublishedRow[]) {
  let sales = 0
  let promoDollars = 0
  let weightedBadaTotal = 0
  let simpleBadaTotal = 0
  let badaCount = 0

  for (const row of rows) {
    const rowSales = pickNumber(row, [
      "sales",
      "netSales",
      "totalSales",
      "salesAmount",
    ])

    const rowBadaPercent = pickBadaPercent(row, [
      "badaPercent",
      "bada",
      "badaPercentage",
      "badaPct",
    ])

    const rowPromoDollars = pickNumber(row, [
      "promoDollars",
      "promosVoidsSum",
      "promoVoids",
      "promoVoidDollars",
      "promos",
      "voids",
    ])

    sales += rowSales
    promoDollars += rowPromoDollars

    if (rowBadaPercent > 0) {
      simpleBadaTotal += rowBadaPercent
      badaCount += 1
    }

    if (rowSales > 0 && rowBadaPercent > 0) {
      weightedBadaTotal += rowBadaPercent * rowSales
    }
  }

  const badaPercent =
    sales > 0 && weightedBadaTotal > 0
      ? weightedBadaTotal / sales
      : badaCount > 0
        ? simpleBadaTotal / badaCount
        : 0

  return {
    badaPercent,
    sales,
    promoDollars,
  }
}

async function getStaffForStore(storeNumber: string) {
  const staffSnap = await getDocs(
    query(
      collection(db, "staffUsers"),
      where("storeNumber", "==", String(storeNumber))
    )
  )

  return staffSnap.docs.map((docSnap) => {
    const data = docSnap.data() as {
      code?: string
      name?: string
      preferredName?: string
    }

    const code = String(data.code ?? docSnap.id)

    return {
      code,
      // Shown publicly
      name: getStaffDisplayName(data, code),
      // Scorecard name, used only to match BADA rows that have no code
      matchName: data.name ?? code,
    }
  })
}

async function getBadaPublishedRows(args: {
  storeNumber: string
  badaWeekKey: string
}) {
  const ref = doc(
    db,
    "stores",
    args.storeNumber,
    "badaPublishedWeeks",
    args.badaWeekKey
  )

  const snap = await getDoc(ref)

  if (!snap.exists()) {
    return {
      published: false,
      rows: [] as BadaPublishedRow[],
    }
  }

  const data = snap.data()
  const rows = Array.isArray(data.rows) ? data.rows : []

  return {
    published: true,
    rows: rows as BadaPublishedRow[],
  }
}

async function getWeeklyUniqueClicks(args: {
  storeNumber: string
  weekKey: string
}) {
  const clicksRef = collection(
    db,
    "stores",
    args.storeNumber,
    "uniqueClicks"
  )

  const snap = await getDocs(
    query(clicksRef, where("weekKey", "==", args.weekKey))
  )

  return snap.docs.map((clickDoc) => ({
    id: clickDoc.id,
    ...clickDoc.data(),
  })) as UniqueClickDoc[]
}

function groupClicksByStaff(clicks: UniqueClickDoc[]) {
  const byStaff = new Map<
    string,
    {
      reviews: number
      rewards: number
    }
  >()

  for (const click of clicks) {
    const staffId = String(click.staffId ?? "").trim()
    if (!staffId) continue

    const current = byStaff.get(staffId) ?? {
      reviews: 0,
      rewards: 0,
    }

    if (click.event === "click_review") {
      current.reviews += 1
    }

    if (click.event === "click_rewards") {
      current.rewards += 1
    }

    byStaff.set(staffId, current)
  }

  return byStaff
}

function groupBadaRows(rows: BadaPublishedRow[]) {
  const byCode = new Map<string, BadaPublishedRow[]>()
  const byName = new Map<string, BadaPublishedRow[]>()

  rows.forEach((row) => {
    const code = getBadaRowCode(row)
    const name = normalizeText(getBadaRowName(row))

    if (code) {
      byCode.set(code, [...(byCode.get(code) ?? []), row])
    }

    if (name) {
      byName.set(name, [...(byName.get(name) ?? []), row])
    }
  })

  return {
    byCode,
    byName,
  }
}

function summarizeTopEight(staffScores: WeeklyStaffScoreRow[]) {
  const topEight = staffScores.slice(0, 8)

  const score = topEight.reduce((sum, row) => sum + row.score, 0)
  const reviews = topEight.reduce((sum, row) => sum + row.reviews, 0)
  const rewards = topEight.reduce((sum, row) => sum + row.rewards, 0)
  const promoDollars = topEight.reduce((sum, row) => sum + row.promoDollars, 0)
  const sales = topEight.reduce((sum, row) => sum + row.sales, 0)

  const weightedBadaTotal = topEight.reduce(
    (sum, row) => sum + row.badaPercent * row.sales,
    0
  )

  const simpleBadaTotal = topEight.reduce(
    (sum, row) => sum + row.badaPercent,
    0
  )

  const badaPercent =
    sales > 0 && weightedBadaTotal > 0
      ? weightedBadaTotal / sales
      : topEight.length > 0
        ? simpleBadaTotal / topEight.length
        : 0

  return {
    score,
    reviews,
    rewards,
    promoDollars,
    sales,
    badaPercent,
  }
}

export async function buildWeeklyStoreScore({
  storeNumber,
  weekKey,
  badaWeekKey,
}: WeeklyStoreScoreInput): Promise<WeeklyStoreScoreResult> {
  const [staffRows, badaResult, clicks] = await Promise.all([
    getStaffForStore(storeNumber),
    getBadaPublishedRows({
      storeNumber,
      badaWeekKey,
    }),
    getWeeklyUniqueClicks({
      storeNumber,
      weekKey,
    }),
  ])

  const clicksByStaff = groupClicksByStaff(clicks)
  const badaGroups = groupBadaRows(badaResult.rows)

  const staffMap = new Map<
    string,
    {
      code: string
      name: string
      matchName?: string
    }
  >()

  staffRows.forEach((staff) => {
    staffMap.set(staff.code, staff)
  })

  clicksByStaff.forEach((_counts, code) => {
    if (!staffMap.has(code)) {
      staffMap.set(code, {
        code,
        name: code,
      })
    }
  })

  badaResult.rows.forEach((row, index) => {
    const code = getBadaRowCode(row)
    const name = getBadaRowName(row)

    if (code && !staffMap.has(code)) {
      staffMap.set(code, {
        code,
        name: name || code,
      })
    }

    if (!code && name) {
      // Skip rows that already belong to a known server by scorecard name,
      // otherwise that server would be counted twice.
      const key = normalizeText(name)
      const alreadyKnown = Array.from(staffMap.values()).some(
        (staff) => normalizeText(staff.matchName ?? staff.name) === key
      )
      if (alreadyKnown) return

      const fallbackCode = `bada-${key || index}`
      if (!staffMap.has(fallbackCode)) {
        staffMap.set(fallbackCode, {
          code: fallbackCode,
          name,
        })
      }
    }
  })

  const staffScores = Array.from(staffMap.values())
    .map((staff) => {
      const clickCounts = clicksByStaff.get(staff.code) ?? {
        reviews: 0,
        rewards: 0,
      }

      const nameKey = normalizeText(staff.matchName ?? staff.name)

      const badaRows =
        badaGroups.byCode.get(staff.code) ??
        badaGroups.byName.get(nameKey) ??
        []

      const badaSummary = summarizeBadaRows(badaRows)

      const score = calculateScore({
        badaPercent: badaSummary.badaPercent,
        reviews: clickCounts.reviews,
        rewards: clickCounts.rewards,
        promoDollars: badaSummary.promoDollars,
        sales: badaSummary.sales,
      })

      return {
        code: staff.code,
        name: staff.name,

        score,
        reviews: clickCounts.reviews,
        rewards: clickCounts.rewards,
        signups: clickCounts.rewards,

        badaPercent: Number(badaSummary.badaPercent.toFixed(2)),
        promoDollars: Number(badaSummary.promoDollars.toFixed(2)),
        sales: Number(badaSummary.sales.toFixed(2)),
      }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.reviews !== a.reviews) return b.reviews - a.reviews
      if (b.rewards !== a.rewards) return b.rewards - a.rewards
      return a.name.localeCompare(b.name)
    })

  const totals = summarizeTopEight(staffScores)

  return {
    storeNumber,
    weekKey,
    badaWeekKey,

    score: totals.score,

    badaPercent: Number(totals.badaPercent.toFixed(2)),
    reviews: totals.reviews,
    rewards: totals.rewards,
    promoDollars: Number(totals.promoDollars.toFixed(2)),
    sales: Number(totals.sales.toFixed(2)),

    badaPublished: badaResult.published,
    badaRowCount: badaResult.rows.length,
    clickCount: clicks.length,

    staffScores,
  }
}

// Current matchup week start key.
// Example: 2026-06-25T13:00:00.000Z -> "2026-06-25"
export function getBadaWeekKeyFromWeekStartISO(weekStartAtISO: string) {
  return formatDateKey(new Date(weekStartAtISO))
}

// Previous closed BADA week key.
// Example: matchup starts 2026-06-25, BADA base is 2026-06-18.
export function getPreviousBadaWeekKeyFromWeekStartISO(weekStartAtISO: string) {
  const weekStart = new Date(weekStartAtISO)
  const previousWeekStart = addDays(weekStart, -7)

  return formatDateKey(previousWeekStart)
}