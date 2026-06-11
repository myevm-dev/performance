// src/pages/ContestPage.tsx

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"



type ContestPrize = {
  place: number
  prize: string
}

type ContestRow = {
  id: string
  storeNumber: string
  contest: string
  metric: string
  dates: string
  durationWeeks: number
  prize: string
  status: ContestStatus
  body: string
}

type ContestDocData = {
  storeNumber?: string
  name?: string
  metric?: string
  durationWeeks?: number
  startDate?: string
  endDate?: string
  prizes?: ContestPrize[]
  status?: FirestoreContestStatus
}

type ContestStatus = "Upcoming" | "Active" | "Completed" | "Cancelled"

type FirestoreContestStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled"

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

function normalizeFirestoreStatus(status: unknown): FirestoreContestStatus | undefined {
  if (
    status === "upcoming" ||
    status === "active" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return status
  }

  return undefined
}

function getLiveStatus(data: {
  startDate: string
  endDate: string
  status?: unknown
}): ContestStatus {
  const normalizedStatus = normalizeFirestoreStatus(data.status)

  if (normalizedStatus === "cancelled") return "Cancelled"

  const now = new Date()
  const start = new Date(`${data.startDate}T00:00:00`)
  const end = new Date(`${data.endDate}T23:59:59`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    if (normalizedStatus === "active") return "Active"
    if (normalizedStatus === "completed") return "Completed"

    return "Upcoming"
  }

  if (now < start) return "Upcoming"
  if (now > end) return "Completed"

  return "Active"
}

function formatPrizeSummary(prizes: ContestPrize[]) {
  if (!prizes.length) return "No prize listed"

  const sorted = [...prizes].sort((a, b) => a.place - b.place)

  if (sorted.length === 1) {
    return sorted[0].prize
  }

  const firstPrize = sorted.find((prize) => prize.place === 1)

  return `${sorted.length} prizes · 1st: ${
    firstPrize?.prize ?? sorted[0].prize
  }`
}

function getStatusBadge(status: ContestStatus) {
  if (status === "Active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
  }

  if (status === "Upcoming") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  if (status === "Completed") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-600"
  }

  return "border-red-500/30 bg-red-500/10 text-red-600"
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

export default function ContestPage({
  activeStore,
}: {
  activeStore: string
}) {
  const navigate = useNavigate()
  const [contests, setContests] = useState<ContestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ContestStatus>("all")

  useEffect(() => {
    let alive = true

    async function loadContests() {
      setLoading(true)

      try {
        const snap = await getDocs(
          collection(db, "stores", activeStore, "contests")
        )

        if (!alive) return

        const rows: ContestRow[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as ContestDocData

          const startDate = data.startDate ?? ""
          const endDate = data.endDate ?? ""
          const prizes = Array.isArray(data.prizes) ? data.prizes : []
          const status = getLiveStatus({
            startDate,
            endDate,
            status: data.status,
          })

          return {
            id: docSnap.id,
            storeNumber: data.storeNumber ?? activeStore,
            contest: data.name ?? "Untitled Contest",
            metric: data.metric ?? "Contest",
            dates: `${formatDate(startDate)} to ${formatDate(endDate)}`,
            durationWeeks: data.durationWeeks ?? 1,
            prize: formatPrizeSummary(prizes),
            status,
            body: `${data.durationWeeks ?? 1} business week${
              (data.durationWeeks ?? 1) === 1 ? "" : "s"
            } · Store ${data.storeNumber ?? activeStore}`,
          }
        })

        rows.sort((a, b) => {
          const statusOrder: Record<ContestStatus, number> = {
            Active: 1,
            Upcoming: 2,
            Completed: 3,
            Cancelled: 4,
          }

          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status]
          }

          return a.contest.localeCompare(b.contest)
        })

        setContests(rows)
      } catch (error) {
        console.error("Failed to load contests:", error)

        if (!alive) return
        setContests([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadContests()

    return () => {
      alive = false
    }
  }, [activeStore])

  const filteredContests = useMemo(() => {
    const query = search.toLowerCase().trim()

    return contests.filter((contest) => {
      const matchesStatus =
        statusFilter === "all" || contest.status === statusFilter

      const matchesSearch =
        !query ||
        contest.contest.toLowerCase().includes(query) ||
        contest.metric.toLowerCase().includes(query) ||
        contest.dates.toLowerCase().includes(query) ||
        contest.prize.toLowerCase().includes(query) ||
        contest.status.toLowerCase().includes(query) ||
        contest.storeNumber.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [contests, search, statusFilter])

  return (
    <main className="container">
      <div className="card contestBoardCard">
        <div className="cardHeader leaderboardHeader">
          <div className="leaderboardHeaderActions leaderboardHeaderActionsLeft">
            <select
              className="leaderboardHeaderAction"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | ContestStatus)
              }
              aria-label="Filter contests by status"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="leaderboardStoreSearchWrap">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search contests"
              className="leaderboardStoreSearchInput"
            />
          </div>

          <div className="leaderboardHeaderActions leaderboardHeaderActionsRight">
            <button type="button" className="leaderboardHeaderAction">
              <span aria-hidden>⌕</span>
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="tableWrap" aria-label="Contests table scroll area">
          <table className="table">
            <thead>
              <tr>
                <th>Contest</th>
                <th>Metric</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Prize</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 56 }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>
                      Loading contests...
                    </div>

                    <div className="meta" style={{ marginTop: 8 }}>
                      Checking Store {activeStore}.
                    </div>
                  </td>
                </tr>
              ) : filteredContests.length > 0 ? (
                filteredContests.map((contest) => (
                  <tr
                    key={contest.id}
                    className="contestClickableRow"
                    onClick={() => navigate(`/contest/${contest.id}`)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        navigate(`/contest/${contest.id}`)
                      }
                    }}
                  >
                    <td>
                      <div className="nameCell">
                        <div>
                          <div className="clickableName">{contest.contest}</div>
                          <div className="meta">{contest.body}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getMetricBadge(
                          contest.metric
                        )}`}
                      >
                        {contest.metric}
                      </span>
                    </td>

                    <td>{contest.dates}</td>

                    <td>
                      {contest.durationWeeks} week
                      {contest.durationWeeks === 1 ? "" : "s"}
                    </td>

                    <td>{contest.prize}</td>

                    <td style={{ textAlign: "right" }}>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getStatusBadge(
                          contest.status
                        )}`}
                      >
                        {contest.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 56 }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>
                      No contests to see for now.
                    </div>

                    <div className="meta" style={{ marginTop: 8 }}>
                      Active and upcoming store contests will appear here once
                      posted for Store {activeStore}.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}