// src/components/LeagueMatchup.tsx
//
// The viewed team's preseason league matchup, with week paging.
// Reads the same schedule and scoring as daytadna.com/league.

import { useEffect, useMemo, useState } from "react"
import { stores as localStores } from "../data/stores"
import {
  getPreseasonPhase,
  hydratePreseasonMatchupScores,
  loadPreseasonMatchups,
  loadPreseasonWeeks,
  pickDefaultPreseasonWeekIndex,
  type PreseasonMatchup,
  type PreseasonPhase,
  type PreseasonWeek,
} from "../lib/league/schedule"
import { buildWeeklyStoreScore, type WeeklyStaffScoreRow } from "../lib/league/weeklyStoreScore"
import { formatLeagueDateTime } from "../lib/league/leagueWeek"

const LEAGUE_URL = "https://www.daytadna.com/league"
const COUNTED_PLAYERS = 8

type WeekEntry = {
  week: PreseasonWeek
  matchup: PreseasonMatchup
}

type Side = {
  storeNumber: string
  name: string
  score: number
  badaPublished?: boolean
}

function normalize(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return ""
  return String(value).padStart(4, "0")
}

function storeName(storeNumber: string, fallback?: string | null) {
  return (
    localStores.find((s) => normalize(s.storeNumber) === normalize(storeNumber))?.name ??
    fallback ??
    `Store ${storeNumber}`
  )
}

function storeLogo(storeNumber: string) {
  const name = localStores.find((s) => normalize(s.storeNumber) === normalize(storeNumber))?.name
  return `https://www.daytadna.com/storelogos/${encodeURIComponent(name ?? "Fallback")}.png`
}

const PHASE_LABEL: Record<PreseasonPhase, string> = {
  live: "Live",
  upcoming: "Upcoming",
  closing: "Closing",
  final: "Final",
}

export default function LeagueMatchup({ storeNumber }: { storeNumber: string }) {
  const viewed = normalize(storeNumber)

  const [entries, setEntries] = useState<WeekEntry[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  const [scheduleError, setScheduleError] = useState("")
  const [index, setIndex] = useState(0)

  const [scored, setScored] = useState<PreseasonMatchup | null>(null)
  const [staff, setStaff] = useState<{ mine: WeeklyStaffScoreRow[]; theirs: WeeklyStaffScoreRow[] }>({
    mine: [],
    theirs: [],
  })
  const [loadingDetail, setLoadingDetail] = useState(false)

  // 1. Every league week this team was scheduled in.
  useEffect(() => {
    let alive = true
    setLoadingSchedule(true)
    setScheduleError("")
    setEntries([])

    ;(async () => {
      try {
        const weeks = await loadPreseasonWeeks()
        const perWeek = await Promise.all(
          weeks.map(async (week) => {
            const matchups = await loadPreseasonMatchups(week.weekKey)
            const matchup = matchups.find(
              (m) =>
                normalize(m.teamAStoreNumber) === viewed ||
                normalize(m.teamBStoreNumber) === viewed ||
                normalize(m.byeStoreNumber) === viewed
            )
            return matchup ? { week, matchup } : null
          })
        )

        if (!alive) return

        const found = perWeek.filter(Boolean) as WeekEntry[]
        setEntries(found)

        const defaultWeek = weeks[pickDefaultPreseasonWeekIndex(weeks, new Date())]
        const defaultIndex = found.findIndex((e) => e.week.weekKey === defaultWeek?.weekKey)
        setIndex(defaultIndex >= 0 ? defaultIndex : Math.max(0, found.length - 1))
      } catch (error) {
        console.error("Failed to load league schedule:", error)
        if (alive) setScheduleError("Couldn't load the league schedule.")
      } finally {
        if (alive) setLoadingSchedule(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [viewed])

  const entry = entries[index] ?? null
  const phase = entry ? getPreseasonPhase(entry.week) : null

  // 2. Scores + both rosters for the selected week.
  useEffect(() => {
    if (!entry || entry.matchup.matchupType === "bye" || !entry.matchup.teamBStoreNumber) {
      setScored(entry?.matchup ?? null)
      setStaff({ mine: [], theirs: [] })
      return
    }

    let alive = true
    setScored(entry.matchup)
    setLoadingDetail(true)

    ;(async () => {
      try {
        const { week, matchup } = entry
        const isA = normalize(matchup.teamAStoreNumber) === viewed
        const mineNumber = isA ? matchup.teamAStoreNumber : String(matchup.teamBStoreNumber)
        const theirNumber = isA ? String(matchup.teamBStoreNumber) : matchup.teamAStoreNumber

        const [hydrated, mine, theirs] = await Promise.all([
          hydratePreseasonMatchupScores(week, [matchup], new Date()).then((rows) => rows[0]),
          buildWeeklyStoreScore({ storeNumber: mineNumber, weekKey: week.weekKey, badaWeekKey: week.badaWeekKey }),
          buildWeeklyStoreScore({ storeNumber: theirNumber, weekKey: week.weekKey, badaWeekKey: week.badaWeekKey }),
        ])

        if (!alive) return
        setScored(hydrated ?? matchup)
        setStaff({ mine: mine.staffScores, theirs: theirs.staffScores })
      } catch (error) {
        console.error("Failed to load matchup detail:", error)
      } finally {
        if (alive) setLoadingDetail(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [entry, viewed])

  const sides = useMemo(() => {
    const m = scored
    if (!m || m.matchupType === "bye" || !m.teamBStoreNumber) return null

    const a: Side = {
      storeNumber: normalize(m.teamAStoreNumber),
      name: storeName(m.teamAStoreNumber, m.teamAName),
      score: m.teamAScore,
      badaPublished: m.teamABadaPublished,
    }
    const b: Side = {
      storeNumber: normalize(m.teamBStoreNumber),
      name: storeName(String(m.teamBStoreNumber), m.teamBName),
      score: m.teamBScore,
      badaPublished: m.teamBBadaPublished,
    }

    return a.storeNumber === viewed ? { mine: a, theirs: b } : { mine: b, theirs: a }
  }, [scored, viewed])

  if (loadingSchedule) {
    return <div className="card lmCard lmStatus">Loading league matchup...</div>
  }

  if (scheduleError) {
    return <div className="card lmCard lmStatus">{scheduleError}</div>
  }

  if (!entry || !phase) {
    return (
      <div className="card lmCard lmStatus">
        <div className="lmStatusTitle">No matchup yet</div>
        <div>This team joins the next generated league week.</div>
        <a className="lmLeagueLink" href={LEAGUE_URL}>
          View the league →
        </a>
      </div>
    )
  }

  const { week } = entry
  const showWinner = phase === "final"
  const mineWon = sides ? sides.mine.score > sides.theirs.score : false
  const theirsWon = sides ? sides.theirs.score > sides.mine.score : false
  const pendingMark = (side: Side) =>
    (phase === "live" || phase === "closing") && side.badaPublished === false ? "*" : ""

  return (
    <div className="card lmCard">
      <div className="lmHeader">
        <button
          type="button"
          className="lmPageBtn"
          aria-label="Previous week"
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          ‹
        </button>

        <div className="lmHeaderText">
          <div className="lmWeekLabel">
            <span className="lmWeekName">{week.label}</span>
            <span className={`lmPhase lmPhase-${phase}`}>{PHASE_LABEL[phase]}</span>
          </div>
          <div className="lmWeekDates">
            {phase === "final"
              ? `Final · closed ${formatLeagueDateTime(week.weekEndAtISO)}`
              : phase === "upcoming"
                ? `Starts ${formatLeagueDateTime(week.weekStartAtISO)}`
                : phase === "closing"
                  ? `Closed ${formatLeagueDateTime(week.weekEndAtISO)} · final scores posting`
                  : `Closes ${formatLeagueDateTime(week.weekEndAtISO)}`}
          </div>
        </div>

        <button
          type="button"
          className="lmPageBtn"
          aria-label="Next week"
          disabled={index >= entries.length - 1}
          onClick={() => setIndex((i) => Math.min(entries.length - 1, i + 1))}
        >
          ›
        </button>
      </div>

      {!sides ? (
        <div className="lmBye">
          <img
            className="lmLogo"
            src={storeLogo(viewed)}
            alt=""
            onError={(e) => {
              e.currentTarget.src = "https://www.daytadna.com/storelogos/Fallback.png"
            }}
          />
          <div className="lmStatusTitle">Bye week</div>
          <div className="lmMuted">{storeName(viewed)} doesn&apos;t play this week.</div>
        </div>
      ) : (
        <>
          <div className="lmScoreboard">
            <TeamBlock side={sides.mine} mark={pendingMark(sides.mine)} won={showWinner && mineWon} lost={showWinner && theirsWon} />
            <div className="lmVs">VS</div>
            <TeamBlock side={sides.theirs} mark={pendingMark(sides.theirs)} won={showWinner && theirsWon} lost={showWinner && mineWon} />
          </div>

          {phase === "final" && sides.mine.score === sides.theirs.score ? (
            <div className="lmResult">Final · Tie</div>
          ) : phase === "final" ? (
            <div className={`lmResult ${mineWon ? "lmWin" : "lmLoss"}`}>
              {mineWon ? "Win" : "Loss"} · {sides.mine.score.toLocaleString()} – {sides.theirs.score.toLocaleString()}
            </div>
          ) : null}

          <div className="lmRosters">
            <Roster title={sides.mine.name} rows={staff.mine} loading={loadingDetail} />
            <Roster title={sides.theirs.name} rows={staff.theirs} loading={loadingDetail} />
          </div>

          <div className="lmFootnote">
            Team score = top {COUNTED_PLAYERS} players. Base from BADA for the week of {week.badaWeekKey}
            {phase === "live" || phase === "closing" ? " (* = not published yet)" : ""}, plus reviews and
            rewards through Thursday 7:00 AM MT.
          </div>
        </>
      )}

      <div className="lmFooter">
        <a className="lmLeagueLink" href={LEAGUE_URL}>
          Full league, standings & matchups →
        </a>
      </div>
    </div>
  )
}

function TeamBlock({ side, mark, won, lost }: { side: Side; mark: string; won: boolean; lost: boolean }) {
  return (
    <div className={`lmTeam ${lost ? "lmTeamLost" : ""}`}>
      <img
        className="lmLogo"
        src={storeLogo(side.storeNumber)}
        alt=""
        onError={(e) => {
          e.currentTarget.src = "https://www.daytadna.com/storelogos/Fallback.png"
        }}
      />
      <div className="lmTeamName">{side.name}</div>
      <div className="lmTeamNumber">#{side.storeNumber}</div>
      <div className="lmTeamScore">
        {won ? "🏆 " : ""}
        {side.score.toLocaleString()}
        {mark}
      </div>
    </div>
  )
}

function Roster({ title, rows, loading }: { title: string; rows: WeeklyStaffScoreRow[]; loading: boolean }) {
  return (
    <div className="lmRoster">
      <div className="lmRosterTitle">{title}</div>
      {loading && rows.length === 0 ? (
        <div className="lmMuted lmRosterEmpty">Loading players...</div>
      ) : rows.length === 0 ? (
        <div className="lmMuted lmRosterEmpty">No players yet.</div>
      ) : (
        <table className="lmTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Server</th>
              <th>Rev</th>
              <th>Rew</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.code} className={i >= COUNTED_PLAYERS ? "lmUncounted" : ""}>
                <td>{i + 1}</td>
                <td className="lmName">{row.name}</td>
                <td>{row.reviews}</td>
                <td>{row.rewards}</td>
                <td className="lmScore">{row.score.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
