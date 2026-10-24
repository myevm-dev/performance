// src/lib/league/schedule.ts
//
// Read-only view of the preseason schedule that daytadna.com/league creates
// and finalizes (collection: leaguePreseasonWeeks). This app never writes it.

import { collection, doc, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { buildWeeklyStoreScore } from "./weeklyStoreScore"
import { getLeagueWeekWindowFromStartISO, type LeagueWeekWindow } from "./leagueWeek"

export const PRESEASON_COLLECTION = "leaguePreseasonWeeks"
export const PRESEASON_SEASON_ID = "preseason-2026"


export type PreseasonPhase = "upcoming" | "live" | "closing" | "final"

export type PreseasonWeek = LeagueWeekWindow & {
  seasonId: string
  weekNumber: number
  label: string
  status: string
  isFinal: boolean
  eligibleTeamCount: number
  matchupCount: number
  byeCount: number
  // Saved weekly standouts (see lib/weeklyHighlights.ts)
  highlights?: unknown
  playerScores?: unknown
}

export type PreseasonMatchup = {
  id: string
  matchupType: "game" | "bye"
  weekKey: string
  teamAStoreNumber: string
  teamAName: string
  teamBStoreNumber?: string | null
  teamBName?: string | null
  byeStoreNumber?: string | null
  byeStoreName?: string | null
  teamAScore: number
  teamBScore: number
  teamABadaPublished?: boolean
  teamBBadaPublished?: boolean
  winnerStoreNumber?: string | null
  final?: boolean
}

// ---------------------------------------------------------------------------
// Reading

function toPreseasonWeek(id: string, data: Record<string, unknown>): PreseasonWeek | null {
  const startISO =
    typeof data.weekStartAtISO === "string" ? data.weekStartAtISO : ""

  const window = startISO ? getLeagueWeekWindowFromStartISO(startISO) : null
  if (!window) return null

  const weekNumber = Number(data.weekNumber ?? 0) || 0
  const status = String(data.status ?? "generated")

  return {
    ...window,
    // Keep the stored key so legacy docs keep pointing at their matchups.
    weekKey: String(data.weekKey ?? id),
    seasonId: String(data.seasonId ?? PRESEASON_SEASON_ID),
    weekNumber,
    label: String(data.label ?? `Preseason Week ${weekNumber || "?"}`),
    status,
    isFinal: status === "final",
    eligibleTeamCount: Number(data.eligibleTeamCount ?? 0),
    matchupCount: Number(data.matchupCount ?? 0),
    byeCount: Number(data.byeCount ?? 0),
    highlights: data.highlights,
    playerScores: data.playerScores,
  }
}

export async function loadPreseasonWeeks(): Promise<PreseasonWeek[]> {
  const snap = await getDocs(collection(db, PRESEASON_COLLECTION))

  return snap.docs
    .map((docSnap) => toPreseasonWeek(docSnap.id, docSnap.data()))
    .filter((week): week is PreseasonWeek => Boolean(week))
    .sort((a, b) => a.weekStartAtISO.localeCompare(b.weekStartAtISO))
}

export async function loadPreseasonMatchups(weekKey: string): Promise<PreseasonMatchup[]> {
  const weekRef = doc(db, PRESEASON_COLLECTION, weekKey)
  const snap = await getDocs(collection(weekRef, "matchups"))

  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data() as Partial<PreseasonMatchup>
      const matchupType: "game" | "bye" = data.matchupType === "bye" ? "bye" : "game"

      return {
        id: String(data.id ?? docSnap.id),
        matchupType,
        weekKey: String(data.weekKey ?? weekKey),
        teamAStoreNumber: String(data.teamAStoreNumber ?? ""),
        teamAName: String(data.teamAName ?? ""),
        teamBStoreNumber: data.teamBStoreNumber ?? null,
        teamBName: data.teamBName ?? null,
        byeStoreNumber: data.byeStoreNumber ?? null,
        byeStoreName: data.byeStoreName ?? null,
        teamAScore: Number(data.teamAScore ?? 0),
        teamBScore: Number(data.teamBScore ?? 0),
        teamABadaPublished: data.teamABadaPublished,
        teamBBadaPublished: data.teamBBadaPublished,
        winnerStoreNumber: data.winnerStoreNumber ?? null,
        final: Boolean(data.final),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function getPreseasonPhase(week: PreseasonWeek, now: Date = new Date()): PreseasonPhase {
  if (week.isFinal) return "final"

  const t = now.getTime()
  if (t >= new Date(week.weekEndAtISO).getTime()) return "closing"
  if (t >= new Date(week.weekStartAtISO).getTime()) return "live"
  return "upcoming"
}

// The week to show by default: the live one, else the latest started week,
// else the first upcoming week.
export function pickDefaultPreseasonWeekIndex(weeks: PreseasonWeek[], now: Date = new Date()) {
  if (weeks.length === 0) return 0

  const liveIndex = weeks.findIndex((week) => getPreseasonPhase(week, now) === "live")
  if (liveIndex >= 0) return liveIndex

  let lastStarted = -1
  weeks.forEach((week, index) => {
    if (new Date(week.weekStartAtISO).getTime() <= now.getTime()) lastStarted = index
  })

  return lastStarted >= 0 ? lastStarted : 0
}

// Live/closing weeks get fresh scores; final weeks keep frozen scores;
// upcoming weeks have nothing to score yet.
export async function hydratePreseasonMatchupScores(
  week: PreseasonWeek,
  matchups: PreseasonMatchup[],
  now: Date = new Date()
): Promise<PreseasonMatchup[]> {
  const phase = getPreseasonPhase(week, now)
  if (phase === "final" || phase === "upcoming") return matchups

  return Promise.all(
    matchups.map(async (matchup) => {
      if (matchup.matchupType === "bye" || !matchup.teamBStoreNumber) return matchup

      try {
        const [teamA, teamB] = await Promise.all([
          buildWeeklyStoreScore({
            storeNumber: matchup.teamAStoreNumber,
            weekKey: week.weekKey,
            badaWeekKey: week.badaWeekKey,
          }),
          buildWeeklyStoreScore({
            storeNumber: String(matchup.teamBStoreNumber),
            weekKey: week.weekKey,
            badaWeekKey: week.badaWeekKey,
          }),
        ])

        return {
          ...matchup,
          teamAScore: teamA.score,
          teamBScore: teamB.score,
          teamABadaPublished: teamA.badaPublished,
          teamBBadaPublished: teamB.badaPublished,
          winnerStoreNumber:
            teamA.score > teamB.score
              ? matchup.teamAStoreNumber
              : teamB.score > teamA.score
                ? String(matchup.teamBStoreNumber)
                : null,
        }
      } catch (error) {
        console.error("Failed to hydrate preseason matchup score:", {
          matchupId: matchup.id,
          error,
        })
        return matchup
      }
    })
  )
}
