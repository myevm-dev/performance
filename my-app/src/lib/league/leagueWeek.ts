// src/lib/league/leagueWeek.ts (shared with daytadna league — keep in sync)
//
// Single source of truth for the business / league week.
//
// - Business weeks run Thursday -> Wednesday.
// - A week rolls over at 7:00 AM Mountain Time on Thursday
//   (America/Denver, so MDT/MST is handled automatically).
// - weekKey ("2026-W43") matches the key written on uniqueClicks by tracking.ts.
// - badaWeekKey ("2026-10-15") is the Thursday date of the PREVIOUS week, which
//   is the key PublishBadaModal writes to stores/{store}/badaPublishedWeeks.

export const LEAGUE_TIME_ZONE = "America/Denver"
export const WEEK_START_WEEKDAY = 4 // Thursday (Sun=0 ... Sat=6)
export const WEEK_ROLLOVER_HOUR = 7 // 7:00 AM Mountain

const MS_PER_DAY = 86400000
const PERIOD_PATTERN_WEEKS = [4, 4, 5] as const

const pad2 = (n: number) => String(n).padStart(2, "0")

export type CalendarDate = {
  year: number
  month: number // 1-12
  day: number
}

export type LeagueWeekWindow = {
  // "2026-W43" — league / click week id
  weekKey: string
  // "2026-10-22" — the Thursday this week starts on
  weekStartDateKey: string
  // "2026-10-15" — previous week's Thursday (BADA base score week)
  badaWeekKey: string
  // Thursday 7:00 AM Mountain, as UTC ISO
  weekStartAtISO: string
  // Following Thursday 7:00 AM Mountain, as UTC ISO
  weekEndAtISO: string

  year: number
  period: number
  periodKey: string
  weekOfYear: number
  weekOfPeriod: number
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

let zonedFormatter: Intl.DateTimeFormat | null = null

function getZonedFormatter() {
  if (!zonedFormatter) {
    zonedFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: LEAGUE_TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    })
  }

  return zonedFormatter
}

export function getLeagueZonedParts(date: Date) {
  const parts = getZonedFormatter().formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""

  const hour = Number(get("hour"))

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: hour === 24 ? 0 : hour,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  }
}

// Converts a Mountain Time wall-clock time into a real Date.
export function leagueWallTimeToDate(date: CalendarDate, hour: number) {
  const target = Date.UTC(date.year, date.month - 1, date.day, hour, 0, 0, 0)
  let guess = target

  for (let i = 0; i < 3; i += 1) {
    const p = getLeagueZonedParts(new Date(guess))
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
    const offset = asUtc - guess
    const next = target - offset
    if (next === guess) break
    guess = next
  }

  return new Date(guess)
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day) + days * MS_PER_DAY)

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

export function toDateKey(date: CalendarDate) {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`
}

export function parseDateKey(value: string): CalendarDate | null {
  const m = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null

  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

function getPeriodInfoForDate(date: CalendarDate) {
  const { year } = date
  const diffDays = Math.round(
    (Date.UTC(year, date.month - 1, date.day) - Date.UTC(year, 0, 1)) / MS_PER_DAY
  )
  const weekIndex = Math.floor(diffDays / 7)

  let period = 1
  let weekCursor = 0
  let patternIndex = 0

  while (period < 12) {
    const weeksInPeriod = PERIOD_PATTERN_WEEKS[patternIndex % 3]
    if (weekIndex < weekCursor + weeksInPeriod) break
    weekCursor += weeksInPeriod
    period += 1
    patternIndex += 1
  }

  const weekOfPeriod = Math.max(1, weekIndex - weekCursor + 1)
  const weekOfYear = Math.max(1, weekIndex + 1)

  return {
    year,
    period,
    weekOfPeriod,
    weekOfYear,
    periodKey: `${year}-P${pad2(period)}`,
    weekKey: `${year}-W${pad2(weekOfYear)}`,
  }
}

export function getLeagueWeekWindowForThursday(thursday: CalendarDate): LeagueWeekWindow {
  const info = getPeriodInfoForDate(thursday)
  const nextThursday = addCalendarDays(thursday, 7)
  const previousThursday = addCalendarDays(thursday, -7)

  return {
    weekKey: info.weekKey,
    weekStartDateKey: toDateKey(thursday),
    badaWeekKey: toDateKey(previousThursday),
    weekStartAtISO: leagueWallTimeToDate(thursday, WEEK_ROLLOVER_HOUR).toISOString(),
    weekEndAtISO: leagueWallTimeToDate(nextThursday, WEEK_ROLLOVER_HOUR).toISOString(),
    year: info.year,
    period: info.period,
    periodKey: info.periodKey,
    weekOfYear: info.weekOfYear,
    weekOfPeriod: info.weekOfPeriod,
  }
}

// The league week that is live at `date`.
export function getLeagueWeekWindowAt(date: Date = new Date()): LeagueWeekWindow {
  const p = getLeagueZonedParts(date)
  const today: CalendarDate = { year: p.year, month: p.month, day: p.day }
  const daysSinceThursday = (p.weekday - WEEK_START_WEEKDAY + 7) % 7

  let thursday = addCalendarDays(today, -daysSinceThursday)

  if (daysSinceThursday === 0 && p.hour < WEEK_ROLLOVER_HOUR) {
    thursday = addCalendarDays(thursday, -7)
  }

  return getLeagueWeekWindowForThursday(thursday)
}

export function shiftLeagueWeek(window: LeagueWeekWindow, weeks: number) {
  const thursday = parseDateKey(window.weekStartDateKey)
  if (!thursday) return window

  return getLeagueWeekWindowForThursday(addCalendarDays(thursday, weeks * 7))
}

// Rebuilds the canonical window from any stored start ISO (handles legacy docs).
export function getLeagueWeekWindowFromStartISO(weekStartAtISO: string) {
  const start = new Date(weekStartAtISO)
  if (!Number.isFinite(start.getTime())) return null

  // Nudge forward a few hours so a legacy midnight/UTC-ish start still lands
  // inside the intended Thursday week.
  return getLeagueWeekWindowAt(new Date(start.getTime() + 12 * 60 * 60 * 1000))
}

// Uses the web server's clock when available so a visitor with a wrong device
// clock can never close a week early.
let serverOffsetMs: number | null = null

export async function getTrustedNow(): Promise<Date> {
  if (serverOffsetMs === null) {
    try {
      const startedAt = Date.now()
      const res = await fetch(`/?__t=${startedAt}`, {
        method: "HEAD",
        cache: "no-store",
      })
      const header = res.headers.get("date")
      const serverMs = header ? Date.parse(header) : NaN

      if (Number.isFinite(serverMs)) {
        const midpoint = startedAt + (Date.now() - startedAt) / 2
        serverOffsetMs = serverMs - midpoint
      } else {
        serverOffsetMs = 0
      }
    } catch {
      serverOffsetMs = 0
    }
  }

  return new Date(Date.now() + serverOffsetMs)
}

export function formatLeagueDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: LEAGUE_TIME_ZONE,
    timeZoneName: "short",
  })
}
