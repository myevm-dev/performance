// src/pages/ContestPage.tsx
import { useMemo } from "react"

type ContestStatus = "upcoming" | "active" | "completed" | "cancelled"

type Prize = {
  place: number
  prize: string
}

type LeaderboardRow = {
  rank: number
  staffName: string
  staffId: string
  storeNumber: string
  score: number
  formattedScore: string
  prize?: string
}

type Contest = {
  id: string
  storeNumber: string
  name: string
  metric: string
  startDate: string
  endDate: string
  status: ContestStatus
  prizes: Prize[]
}

const mockContest: Contest = {
  id: "demo-contest",
  storeNumber: "0000",
  name: "Review Sprint",
  metric: "Google Reviews",
  startDate: "2026-06-18",
  endDate: "2026-06-24",
  status: "active",
  prizes: [
    { place: 1, prize: "$25 Gift Card" },
    { place: 2, prize: "Free Meal" },
    { place: 3, prize: "Dessert Voucher" },
  ],
}

const mockRows: LeaderboardRow[] = [
  {
    rank: 1,
    staffName: "Nathan Z",
    staffId: "ABC123",
    storeNumber: "0000",
    score: 18,
    formattedScore: "18",
    prize: "$25 Gift Card",
  },
  {
    rank: 2,
    staffName: "Maria G",
    staffId: "DEF456",
    storeNumber: "0000",
    score: 14,
    formattedScore: "14",
    prize: "Free Meal",
  },
  {
    rank: 3,
    staffName: "Chris R",
    staffId: "GHI789",
    storeNumber: "0000",
    score: 11,
    formattedScore: "11",
    prize: "Dessert Voucher",
  },
  {
    rank: 4,
    staffName: "Jordan T",
    staffId: "JKL012",
    storeNumber: "0000",
    score: 8,
    formattedScore: "8",
  },
]

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getStatusStyles(status: ContestStatus) {
  if (status === "active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
  }

  if (status === "upcoming") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300"
  }

  if (status === "completed") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300"
  }

  return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
}

function getRankGradient(rank: number) {
  if (rank === 1) {
    return "from-yellow-400 via-amber-500 to-orange-500"
  }

  if (rank === 2) {
    return "from-slate-300 via-slate-400 to-slate-500"
  }

  if (rank === 3) {
    return "from-orange-400 via-orange-600 to-amber-700"
  }

  return "from-blue-500 via-indigo-500 to-violet-500"
}

export default function ContestPage() {
  const contest = mockContest
  const rows = mockRows

  const topPrizeRows = useMemo(() => {
    return contest.prizes
      .sort((a, b) => a.place - b.place)
      .map((prize) => {
        const winner = rows.find((row) => row.rank === prize.place)

        return {
          ...prize,
          winner,
        }
      })
  }, [contest.prizes, rows])

  return (
    <main className="min-h-screen bg-main px-4 py-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-5 py-6 text-white sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/85">
                  Store {contest.storeNumber}
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                  {contest.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/85">
                  Live contest leaderboard for {contest.metric}. Contest runs
                  from {formatDate(contest.startDate)} to{" "}
                  {formatDate(contest.endDate)}.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <HeroStat label="Metric" value={contest.metric} />
                <HeroStat label="Prizes" value={String(contest.prizes.length)} />
                <HeroStat label="Players" value={String(rows.length)} />
              </div>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Contest Status
                </div>

                <div className="mt-1 text-xl font-black text-foreground">
                  {contest.status.charAt(0).toUpperCase() +
                    contest.status.slice(1)}
                </div>
              </div>

              <div
                className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${getStatusStyles(
                  contest.status
                )}`}
              >
                {contest.status}
              </div>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
              {topPrizeRows.map((prize) => (
                <PrizeCard
                  key={prize.place}
                  place={prize.place}
                  prize={prize.prize}
                  winner={prize.winner}
                />
              ))}
            </section>

            <section className="rounded-3xl border border-border bg-background p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Contest Leaderboard
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    Rankings update from the contest scoring app.
                  </p>
                </div>

                <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {contest.metric}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="px-4 py-2">Rank</th>
                      <th className="px-4 py-2">Server</th>
                      <th className="px-4 py-2">Store</th>
                      <th className="px-4 py-2 text-right">Score</th>
                      <th className="px-4 py-2 text-right">Prize</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.length > 0 ? (
                      rows.map((row) => (
                        <tr key={row.staffId}>
                          <td className="rounded-l-2xl border-y border-l border-border bg-card px-4 py-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getRankGradient(
                                row.rank
                              )} text-sm font-black text-white shadow-sm`}
                            >
                              #{row.rank}
                            </div>
                          </td>

                          <td className="border-y border-border bg-card px-4 py-4">
                            <div className="font-black text-foreground">
                              {row.staffName}
                            </div>

                            <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
                              {row.staffId}
                            </div>
                          </td>

                          <td className="border-y border-border bg-card px-4 py-4 text-sm font-semibold text-muted-foreground">
                            Store {row.storeNumber}
                          </td>

                          <td className="border-y border-border bg-card px-4 py-4 text-right text-xl font-black text-primary">
                            {row.formattedScore}
                          </td>

                          <td className="rounded-r-2xl border-y border-r border-border bg-card px-4 py-4 text-right">
                            {row.prize ? (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                                {row.prize}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-muted-foreground">
                                No prize
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center"
                        >
                          <div className="text-lg font-black text-foreground">
                            No leaderboard rows yet.
                          </div>

                          <p className="mt-2 text-sm font-semibold text-muted-foreground">
                            Scores will appear once contest data is available.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
      <div className="max-w-[110px] truncate text-lg font-black leading-none text-white">
        {value}
      </div>

      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
        {label}
      </div>
    </div>
  )
}

function PrizeCard({
  place,
  prize,
  winner,
}: {
  place: number
  prize: string
  winner?: LeaderboardRow
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div
        className={`bg-gradient-to-br ${getRankGradient(
          place
        )} px-5 py-4 text-white`}
      >
        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
          Prize Place
        </div>

        <div className="mt-1 text-3xl font-black">#{place}</div>
      </div>

      <div className="p-5">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Prize
        </div>

        <div className="mt-1 text-xl font-black text-foreground">{prize}</div>

        <div className="mt-4 rounded-2xl border border-border bg-background p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            Current Holder
          </div>

          {winner ? (
            <>
              <div className="mt-1 text-lg font-black text-foreground">
                {winner.staffName}
              </div>

              <div className="mt-1 text-sm font-semibold text-muted-foreground">
                {winner.formattedScore} points
              </div>
            </>
          ) : (
            <div className="mt-1 text-sm font-semibold text-muted-foreground">
              No winner yet
            </div>
          )}
        </div>
      </div>
    </article>
  )
}