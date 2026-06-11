// src/pages/ContestLeaderboardPage.tsx

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"

type ContestPrize = {
  place: number
  prize: string
}

type ContestData = {
  id: string
  storeNumber: string
  name: string
  metric: string
  durationWeeks: number
  startDate: string
  endDate: string
  prizes: ContestPrize[]
  status: "upcoming" | "active" | "completed" | "cancelled"
}

type ContestLeaderboardPageProps = {
  activeStore: string
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value || "Not set"
  }

  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  })
}

function getDateTime(value: string, endOfDay = false) {
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

function getContestCountdown(contest: ContestData, now: Date) {
  if (contest.status === "cancelled") {
    return "Cancelled"
  }

  const start = getDateTime(contest.startDate)
  const end = getDateTime(contest.endDate, true)

  if (!start || !end) {
    return "Schedule not set"
  }

  if (now < start) {
    return `Starts in ${formatDuration(start.getTime() - now.getTime())}`
  }

  if (now <= end) {
    return `Ends in ${formatDuration(end.getTime() - now.getTime())}`
  }

  return "Finished"
}

function getMetricBadge(metric: string) {
  if (metric.includes("Review")) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  if (metric.includes("Rewards")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
  }

  if (metric.includes("BADA")) {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-600"
  }

  if (metric.includes("Score")) {
    return "border-violet-500/30 bg-violet-500/10 text-violet-600"
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-600"
}

function formatStatus(status: ContestData["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getStatusBadge(status: ContestData["status"]) {
  if (status === "active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
  }

  if (status === "upcoming") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  if (status === "completed") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-600"
  }

  return "border-red-500/30 bg-red-500/10 text-red-600"
}

export default function ContestLeaderboardPage({
  activeStore,
}: ContestLeaderboardPageProps) {
  const navigate = useNavigate()
  const { contestId } = useParams()

  const [contest, setContest] = useState<ContestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let alive = true

    async function loadContest() {
      if (!contestId) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const contestRef = doc(db, "stores", activeStore, "contests", contestId)
        const snap = await getDoc(contestRef)

        if (!alive) return

        if (!snap.exists()) {
          setContest(null)
          return
        }

        const data = snap.data() as {
          storeNumber?: string
          name?: string
          metric?: string
          durationWeeks?: number
          startDate?: string
          endDate?: string
          prizes?: ContestPrize[]
          status?: ContestData["status"]
        }

        setContest({
          id: snap.id,
          storeNumber: data.storeNumber ?? activeStore,
          name: data.name ?? "Untitled Contest",
          metric: data.metric ?? "Contest",
          durationWeeks: data.durationWeeks ?? 1,
          startDate: data.startDate ?? "",
          endDate: data.endDate ?? "",
          prizes: Array.isArray(data.prizes) ? data.prizes : [],
          status: data.status ?? "upcoming",
        })
      } catch (error) {
        console.error("Failed to load contest:", error)

        if (!alive) return
        setContest(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadContest()

    return () => {
      alive = false
    }
  }, [activeStore, contestId])

  return (
    <main className="container">
      <div className="card">
        <div className="cardHeader leaderboardHeader">
          <div className="leaderboardHeaderActions leaderboardHeaderActionsLeft">
            <button
              type="button"
              onClick={() => navigate("/contest")}
              className="leaderboardHeaderAction"
            >
              ← Back
            </button>
          </div>

          <div className="leaderboardStoreSearchWrap">
            <div className="leaderboardStoreSearchInput flex items-center justify-center">
              Contest Leaderboard
            </div>
          </div>

          <div className="leaderboardHeaderActions leaderboardHeaderActionsRight">
            <button type="button" className="leaderboardHeaderAction">
              Store {activeStore}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 56 }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>
              Loading contest leaderboard...
            </div>

            <div className="meta" style={{ marginTop: 8 }}>
              Checking Store {activeStore}.
            </div>
          </div>
        ) : contest ? (
          <>
            <div className="border-b border-[var(--stroke)] px-6 py-6">
                <div className="rounded-[2rem] border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_42%,transparent)] p-5 shadow-sm">
                    <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-stretch">
                    <div className="flex min-h-[190px] flex-col justify-between rounded-[1.5rem] border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] p-5">
                        <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getMetricBadge(
                                contest.metric
                            )}`}
                            >
                            {contest.metric}
                            </span>

                            <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getStatusBadge(
                                contest.status
                            )}`}
                            >
                            {formatStatus(contest.status)}
                            </span>
                        </div>

                        <h1 className="mt-5 text-4xl font-black tracking-tight text-[var(--text)] md:text-5xl">
                            {contest.name}{" "}
                            <span className="align-middle text-lg font-black text-[var(--muted)] md:text-xl">
                            ({contest.durationWeeks} week
                            {contest.durationWeeks === 1 ? "" : "s"})
                            </span>
                        </h1>
                        </div>

                        <div className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                        Store {contest.storeNumber}
                        </div>
                    </div>

                    <div className="flex min-h-[190px] flex-col justify-center rounded-[1.5rem] border border-cyan-400/30 bg-cyan-500/10 p-5 text-left lg:text-right">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                        Contest Clock
                        </div>

                        <div className="mt-2 text-4xl font-black tracking-tight text-cyan-600 md:text-5xl">
                        {getContestCountdown(contest, now)}
                        </div>

                        <div className="mt-3 text-sm font-bold text-[var(--muted)]">
                        {formatDate(contest.startDate)} to {formatDate(contest.endDate)}
                        </div>
                    </div>
                    </div>

                    {contest.prizes.length > 0 ? (
                    <div className="mt-5">
                        <div className="mb-3 flex items-center justify-center gap-3">
                        <div className="h-px flex-1 bg-[var(--stroke)]" />

                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                            Prizes
                        </div>

                        <div className="h-px flex-1 bg-[var(--stroke)]" />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[...contest.prizes]
                            .sort((a, b) => a.place - b.place)
                            .map((prize) => (
                            <div
                                key={prize.place}
                                className="rounded-2xl border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card)_78%,transparent)] px-4 py-4 text-center shadow-sm"
                            >
                                <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                                Place #{prize.place}
                                </div>

                                <div className="mt-2 text-lg font-black text-[var(--text)]">
                                {prize.prize}
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                    ) : null}
                </div>
                </div>

            <div className="tableWrap" aria-label="Contest leaderboard table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Server</th>
                    <th>Metric</th>
                    <th style={{ textAlign: "right" }}>Result</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 56 }}>
                      <div style={{ fontWeight: 900, fontSize: 20 }}>
                        Contest standings coming soon.
                      </div>

                      <div className="meta" style={{ marginTop: 8 }}>
                        This page is ready. Next step is connecting the scoring
                        logic for {contest.metric}.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 56 }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>
              Contest not found.
            </div>

            <div className="meta" style={{ marginTop: 8 }}>
              This contest may have been removed or belongs to another store.
            </div>

            <button
              type="button"
              onClick={() => navigate("/contest")}
              className="leaderboardHeaderAction"
              style={{ marginTop: 18 }}
            >
              Back to Contests
            </button>
          </div>
        )}
      </div>
    </main>
  )
}