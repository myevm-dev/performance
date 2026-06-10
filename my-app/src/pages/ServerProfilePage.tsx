import { useMemo, useState } from "react"
import { getGlassGradient } from "../lib/glassColors"

type ServerProfile = {
  id: string
  name: string
  storeName?: string
  storeNumber?: string
  score?: number
  badaPercent?: number
  reviews?: number
  rewards?: number
  promoDollars?: number
  sales?: number
  promoRate?: number
  avatarSeed?: string
  badaWeeks?: Array<{
    weekLabel: string
    badaPercent: number | null
  }>
}

type ServerProfilePageProps = {
  server: ServerProfile | null
  onBack: () => void
}

type BadaWindow = "all" | "12w" | "4w"

function formatMoney(value?: number) {
  return `$${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPercent(value?: number, digits = 1) {
  return `${(value ?? 0).toFixed(digits)}%`
}

function getPromoPenaltyBase(promoRate: number) {
  if (promoRate > 0.75 / 100) return 250
  if (promoRate > 0.5 / 100) return 175
  if (promoRate > 0.3 / 100) return 100
  if (promoRate > 0.2 / 100) return 50
  return 0
}

function getPromoPenaltyColor(promoRate: number) {
  if (promoRate <= 0.002) return "rgba(105, 213, 118, 0.92)"
  if (promoRate <= 0.003) return "#fca5a5"
  if (promoRate <= 0.005) return "#f87171"
  if (promoRate <= 0.0075) return "#ef4444"
  return "#b91c1c"
}

function getBadaColor(badaPercent: number) {
  if (badaPercent >= 140) return "#22c55e"
  if (badaPercent >= 115) return "#84cc16"
  if (badaPercent >= 100) return "#facc15"
  return "#ef4444"
}

function buildDummyActivity(reviews: number, rewards: number) {
  const rows: Array<{ type: "Review" | "Rewards"; label: string }> = []

  const reviewCount = Math.min(reviews, 8)
  const rewardCount = Math.min(rewards, 8)

  for (let i = 0; i < reviewCount; i++) {
    rows.push({ type: "Review", label: `Review click ${reviewCount - i}` })
  }

  for (let i = 0; i < rewardCount; i++) {
    rows.push({ type: "Rewards", label: `Rewards click ${rewardCount - i}` })
  }

  if (rows.length === 0) {
    return [
      { type: "Review" as const, label: "No recent click data yet" },
      { type: "Rewards" as const, label: "No recent click data yet" },
    ]
  }

  return rows.slice(0, 12)
}

function buildBadaBars(
  weeks?: Array<{
    weekLabel: string
    badaPercent: number | null
  }>
) {
  return [...(weeks ?? [])]
    .reverse()
    .map((week) => ({
      weekLabel: week.weekLabel,
      value: week.badaPercent,
    }))
}

function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string
  value: string
  accent?: string
  sub?: string
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid var(--stroke)",
        background: "color-mix(in srgb, var(--card2) 46%, transparent)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.14)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--muted)",
          fontWeight: 900,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 950,
          color: accent || "var(--text)",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  )
}

function ScoreBreakdownModal({
  open,
  onClose,
  server,
}: {
  open: boolean
  onClose: () => void
  server: ServerProfile
}) {
  if (!open) return null

  const badaPercent = server.badaPercent ?? 0
  const reviews = server.reviews ?? 0
  const rewards = server.rewards ?? 0
  const promoDollars = server.promoDollars ?? 0
  const sales = server.sales ?? 0
  const score = server.score ?? 0
  const promoRate = sales > 0 ? promoDollars / sales : server.promoRate ?? 0
  const promoPenaltyBase = getPromoPenaltyBase(promoRate)
  const promoWeighted = promoPenaltyBase * 0.15
  const badaPoints = 460 * (badaPercent / 140)
  const reviewPoints = 390 * (reviews / 25)
  const rewardPoints = 150 * (rewards / 10)

  return (
    <div className="modalOverlay" onClick={onClose} role="presentation">
      <div
        className="modalCard"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <button
            type="button"
            onClick={onClose}
            className="iconBtn"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>

          <div className="modalTitle">{server.name} Score Breakdown</div>
          <div className="modalSub">
            Current score inputs and weighted formula
          </div>
        </div>

        <div className="modalBody">
          <div className="codeBlock">
            Score = (460 × (BADA% ÷ 140)) + (390 × (Reviews ÷ 25)) + (150 ×
            (Rewards ÷ 10)) - (PromoPenalty × 0.15)
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <StatCard
              label="BADA %"
              value={formatPercent(badaPercent)}
              accent={getBadaColor(badaPercent)}
            />
            <StatCard label="Reviews" value={String(reviews)} accent="#67e8f9" />
            <StatCard label="Rewards" value={String(rewards)} accent="#c084fc" />
            <StatCard
              label="Promo Rate"
              value={formatPercent(promoRate * 100, 2)}
              accent={getPromoPenaltyColor(promoRate)}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              border: "1px solid var(--stroke)",
              background: "color-mix(in srgb, var(--card2) 38%, transparent)",
              overflow: "hidden",
            }}
          >
            {[
              [`460 × (${badaPercent.toFixed(1)} ÷ 140)`, badaPoints.toFixed(2)],
              [`390 × (${reviews} ÷ 25)`, reviewPoints.toFixed(2)],
              [`150 × (${rewards} ÷ 10)`, rewardPoints.toFixed(2)],
              [`${promoPenaltyBase} × 0.15`, `-${promoWeighted.toFixed(2)}`],
              ["Promo/Void $", formatMoney(promoDollars)],
              ["Sales", formatMoney(sales)],
            ].map(([label, value], index) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom:
                    index === 5 ? "none" : "1px solid var(--stroke)",
                  fontSize: 14,
                  alignItems: "center",
                }}
              >
                <div style={{ color: "var(--muted)" }}>{label}</div>
                <div
                  style={{
                    fontWeight: 950,
                    color:
                      label === `${promoPenaltyBase} × 0.15`
                        ? getPromoPenaltyColor(promoRate)
                        : "var(--text)",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: 18,
              border: "1px solid var(--stroke)",
              background:
                "linear-gradient(90deg, rgba(253,1,245,0.18), rgba(1,252,252,0.14))",
              textAlign: "center",
              boxShadow:
                "0 0 24px rgba(253,1,245,0.10), 0 0 24px rgba(1,252,252,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 900,
                letterSpacing: 0.3,
              }}
            >
              FINAL SCORE
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 42,
                fontWeight: 950,
                color: "var(--text)",
              }}
            >
              {score}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ServerProfilePage({
  server,
  onBack,
}: ServerProfilePageProps) {
  const [scoreOpen, setScoreOpen] = useState(false)
  const [activityFilter, setActivityFilter] = useState<
    "all" | "review" | "rewards"
  >("all")
  const [badaWindow, setBadaWindow] = useState<BadaWindow>("12w")

  if (!server) return null

  const gradient = getGlassGradient(server.avatarSeed || server.id)

  const badaPercent = server.badaPercent ?? 0
  const reviews = server.reviews ?? 0
  const rewards = server.rewards ?? 0
  const score = server.score ?? 0
  const sales = server.sales ?? 0
  const promoDollars = server.promoDollars ?? 0
  const promoRate = sales > 0 ? promoDollars / sales : server.promoRate ?? 0

  const badaBars = useMemo(
    () => buildBadaBars(server.badaWeeks),
    [server.badaWeeks]
  )

  const visibleBadaBars = useMemo(() => {
    if (badaWindow === "4w") return badaBars.slice(-4)
    if (badaWindow === "12w") return badaBars.slice(-12)
    return badaBars
  }, [badaBars, badaWindow])

  const plottedBadaBars = visibleBadaBars.filter(
    (bar): bar is { weekLabel: string; value: number } =>
      typeof bar.value === "number"
  )

  const chartMin = 50
  const chartMax = 210
  const chartTicks = [210, 180, 140, 100, 50]

  const svgWidth = 1000
  const svgHeight = 330
  const padLeft = 52
  const padRight = 24
  const padTop = 20
  const padBottom = 42
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  const getY = (value: number) => {
    const clamped = Math.max(chartMin, Math.min(chartMax, value))
    return padTop + ((chartMax - clamped) / (chartMax - chartMin)) * plotHeight
  }

  const getX = (index: number, total: number) => {
    if (total <= 1) return padLeft + plotWidth / 2
    return padLeft + (index / (total - 1)) * plotWidth
  }

  const linePoints = plottedBadaBars
    .map((bar, index) => `${getX(index, plottedBadaBars.length)},${getY(bar.value)}`)
    .join(" ")

  const activityRows = useMemo(
    () => buildDummyActivity(reviews, rewards),
    [reviews, rewards]
  )

  const filteredActivity = useMemo(() => {
    if (activityFilter === "review") {
      return activityRows.filter((row) => row.type === "Review")
    }

    if (activityFilter === "rewards") {
      return activityRows.filter((row) => row.type === "Rewards")
    }

    return activityRows
  }, [activityRows, activityFilter])

  return (
    <div className="appBg">
      <div className="nav">
        <div className="navInner">
          <div className="brand">
            <div className="brandMark" />

            <div>
              <div className="brandTitle">Dayta DNA</div>
              <div className="brandSub">Server performance profile</div>
            </div>
          </div>

          <div className="navRight">
            <div className="navBadge">
              {server.storeName || `Store ${server.storeNumber || ""}`}
            </div>

            <button
              type="button"
              onClick={onBack}
              className="btnPrimary"
              style={{
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="navGlow" />
      </div>

      <main className="container" style={{ maxWidth: 1200 }}>
        <div className="hero">
          <h1 className="title" style={{ fontSize: 34 }}>
            {server.name}
          </h1>

          <div className="heroStoreName">
            {server.storeName || `Store ${server.storeNumber || ""}`}
          </div>

          <p className="subtitle">
            BADA performance · Review clicks · Rewards clicks · Promo/Void impact
          </p>
        </div>

        <div
          className="serverProfileGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <section className="card" style={{ marginTop: 0 }}>
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`,
              }}
            />

            <div style={{ padding: 18 }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "color-mix(in srgb, var(--card2) 40%, transparent)",
                  border: "1px solid var(--stroke)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 22,
                    overflow: "hidden",
                    position: "relative",
                    background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 58,
                      fontWeight: 950,
                      color: "rgba(0,0,0,0.76)",
                      letterSpacing: 1,
                      zIndex: 2,
                    }}
                  >
                    {server.name?.charAt(0) ?? "?"}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 22,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06))",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 18, textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setScoreOpen(true)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text)",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 950,
                      lineHeight: 1,
                      color: "var(--a2)",
                      textShadow: "0 0 18px rgba(1,252,252,0.18)",
                    }}
                  >
                    {score}
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 12,
                      color: "var(--muted)",
                      textDecoration: "underline dotted",
                      fontWeight: 800,
                    }}
                  >
                    View score breakdown
                  </div>
                </button>

                <div
                  style={{
                    marginTop: 18,
                    fontSize: 24,
                    fontWeight: 950,
                    color: "var(--text)",
                  }}
                >
                  {server.name}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "var(--muted)",
                  }}
                >
                  {server.storeName || `Store ${server.storeNumber || ""}`}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gap: 10,
                }}
              >
                {[
                  ["Store Rank", "Soon", "#67e8f9"],
                  ["District Rank", "Soon", "#c084fc"],
                  ["Region Rank", "Soon", "#fb7185"],
                  ["Company Rank", "Soon", "#facc15"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 14,
                      background:
                        "color-mix(in srgb, var(--card2) 38%, transparent)",
                      border: "1px solid var(--stroke)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        fontWeight: 900,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 950,
                        color,
                        background:
                          "color-mix(in srgb, var(--card2) 42%, transparent)",
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid var(--stroke)",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section className="card" style={{ marginTop: 0 }}>
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">Performance Snapshot</div>
                  <div className="cardSub">Current server-level score inputs</div>
                </div>
              </div>

              <div
                className="profileStatsGrid"
                style={{
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <StatCard
                  label="BADA %"
                  value={formatPercent(badaPercent)}
                  accent={getBadaColor(badaPercent)}
                  sub="Target is 140%"
                />

                <StatCard
                  label="Reviews"
                  value={String(reviews)}
                  accent="#67e8f9"
                  sub="Trailing click count"
                />

                <StatCard
                  label="Rewards"
                  value={String(rewards)}
                  accent="#c084fc"
                  sub="Trailing click count"
                />

                <StatCard
                  label="Promo/Void"
                  value={formatMoney(promoDollars)}
                  accent={getPromoPenaltyColor(promoRate)}
                  sub={`${formatPercent(promoRate * 100, 2)} of sales`}
                />
              </div>
            </section>

            <section className="card" style={{ marginTop: 0 }}>
              <div className="cardHeader">
                <div>
                  <div className="cardTitle" style={{ fontSize: 18 }}>
                    Server BADA Over Time
                  </div>
                  <div className="cardSub">
                    Recent published BADA weeks
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      fontWeight: 800,
                    }}
                  >
                    {badaBars.length} published weeks
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: 4,
                      borderRadius: 999,
                      border: "1px solid var(--stroke)",
                      background:
                        "color-mix(in srgb, var(--card2) 48%, transparent)",
                    }}
                  >
                    {[
                      { key: "all" as const, label: "All" },
                      { key: "12w" as const, label: "12W" },
                      { key: "4w" as const, label: "4W" },
                    ].map((item) => {
                      const active = badaWindow === item.key

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setBadaWindow(item.key)}
                          style={{
                            border: "none",
                            cursor: "pointer",
                            padding: "8px 16px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 900,
                            color: active ? "#fff" : "var(--muted)",
                            background: active
                              ? "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.92))"
                              : "transparent",
                            boxShadow: active
                              ? "0 8px 20px rgba(37,99,235,0.22)"
                              : "none",
                          }}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "1px solid var(--stroke)",
                      background:
                        "color-mix(in srgb, var(--card2) 62%, transparent)",
                      fontSize: 14,
                      fontWeight: 950,
                      color: getBadaColor(badaPercent),
                      whiteSpace: "nowrap",
                    }}
                  >
                    Average: {formatPercent(badaPercent)}
                  </div>
                </div>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  style={{
                    borderRadius: 20,
                    border: "1px solid var(--stroke)",
                    background:
                      "linear-gradient(180deg, rgba(1,252,252,0.04), rgba(253,1,245,0.035)), color-mix(in srgb, var(--card2) 42%, transparent)",
                    padding: 16,
                    overflow: "hidden",
                  }}
                >
                  {plottedBadaBars.length > 0 ? (
                    <div style={{ width: "100%", overflowX: "auto" }}>
                      <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        style={{
                          width: "100%",
                          minWidth: 760,
                          height: "auto",
                          display: "block",
                        }}
                      >
                        {chartTicks.map((tick) => {
                          const y = getY(tick)

                          return (
                            <g key={tick}>
                              <line
                                x1={padLeft}
                                x2={svgWidth - padRight}
                                y1={y}
                                y2={y}
                                stroke={
                                  tick === 140
                                    ? "rgba(107,114,128,0.85)"
                                    : "rgba(148,163,184,0.28)"
                                }
                                strokeWidth={tick === 140 ? 2.2 : 1}
                                strokeDasharray={tick === 140 ? "0" : "4 6"}
                              />
                              <text
                                x={4}
                                y={y + 4}
                                fontSize="12"
                                fontWeight="800"
                                fill="var(--muted)"
                              >
                                {tick}%
                              </text>
                            </g>
                          )
                        })}

                        {plottedBadaBars.map((bar, index) => {
                          const x = getX(index, plottedBadaBars.length)

                          return (
                            <line
                              key={`v-${bar.weekLabel}-${index}`}
                              x1={x}
                              x2={x}
                              y1={padTop}
                              y2={svgHeight - padBottom}
                              stroke="rgba(148,163,184,0.18)"
                              strokeWidth="1"
                            />
                          )
                        })}

                        {linePoints ? (
                          <polyline
                            fill="none"
                            stroke="#e85d2f"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            points={linePoints}
                          />
                        ) : null}

                        {plottedBadaBars.map((bar, index) => {
                          const x = getX(index, plottedBadaBars.length)
                          const y = getY(bar.value)

                          return (
                            <g key={`p-${bar.weekLabel}-${index}`}>
                              <circle
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#e85d2f"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={x}
                                y={svgHeight - 10}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="800"
                                fill="var(--text)"
                              >
                                {bar.weekLabel}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  ) : (
                    <div
                      style={{
                        minHeight: 260,
                        display: "grid",
                        placeItems: "center",
                        color: "var(--muted)",
                        fontWeight: 900,
                      }}
                    >
                      No BADA history published for this server yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="card" style={{ marginTop: 0 }}>
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">Guest Engagement</div>
                  <div className="cardSub">Review and Rewards activity</div>
                </div>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  className="profileEngagementGrid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActivityFilter((prev) =>
                        prev === "review" ? "all" : "review"
                      )
                    }
                    style={{
                      border: "1px solid var(--stroke)",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 18,
                      background:
                        activityFilter === "review"
                          ? "linear-gradient(180deg, rgba(103,232,249,0.16), rgba(255,255,255,0.03))"
                          : "color-mix(in srgb, var(--card2) 42%, transparent)",
                      boxShadow:
                        activityFilter === "review"
                          ? "0 14px 34px rgba(103,232,249,0.12)"
                          : "0 14px 34px rgba(0,0,0,0.10)",
                      padding: 16,
                      color: "var(--text)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 900,
                        letterSpacing: 0.3,
                      }}
                    >
                      Reviews
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 30,
                        fontWeight: 950,
                        color: "#67e8f9",
                        lineHeight: 1.05,
                      }}
                    >
                      {reviews}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        color: "var(--muted)",
                        fontWeight: 900,
                      }}
                    >
                      {activityFilter === "review"
                        ? "Showing reviews"
                        : "Click to filter"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActivityFilter((prev) =>
                        prev === "rewards" ? "all" : "rewards"
                      )
                    }
                    style={{
                      border: "1px solid var(--stroke)",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 18,
                      background:
                        activityFilter === "rewards"
                          ? "linear-gradient(180deg, rgba(192,132,252,0.16), rgba(255,255,255,0.03))"
                          : "color-mix(in srgb, var(--card2) 42%, transparent)",
                      boxShadow:
                        activityFilter === "rewards"
                          ? "0 14px 34px rgba(192,132,252,0.12)"
                          : "0 14px 34px rgba(0,0,0,0.10)",
                      padding: 16,
                      color: "var(--text)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 900,
                        letterSpacing: 0.3,
                      }}
                    >
                      Rewards
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 30,
                        fontWeight: 950,
                        color: "#c084fc",
                        lineHeight: 1.05,
                      }}
                    >
                      {rewards}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        color: "var(--muted)",
                        fontWeight: 900,
                      }}
                    >
                      {activityFilter === "rewards"
                        ? "Showing rewards"
                        : "Click to filter"}
                    </div>
                  </button>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid var(--stroke)",
                    background:
                      "color-mix(in srgb, var(--card2) 34%, transparent)",
                  }}
                >
                  <div
                    className="profileActivityHeader"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr 120px",
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--stroke)",
                      fontSize: 12,
                      fontWeight: 950,
                      color: "var(--muted)",
                      letterSpacing: 0.3,
                    }}
                  >
                    <div>Type</div>
                    <div>Description</div>
                    <div style={{ textAlign: "right" }}>Status</div>
                  </div>

                  {filteredActivity.map((row, index) => (
                    <div
                      key={`${row.type}-${row.label}-${index}`}
                      className="profileActivityRow"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 120px",
                        padding: "14px",
                        borderBottom:
                          index === filteredActivity.length - 1
                            ? "none"
                            : "1px solid var(--stroke)",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 950,
                          color:
                            row.type === "Review" ? "#67e8f9" : "#c084fc",
                        }}
                      >
                        {row.type}
                      </div>

                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {row.label}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 950,
                            color: "var(--text)",
                            background:
                              "color-mix(in srgb, var(--card2) 42%, transparent)",
                            border: "1px solid var(--stroke)",
                          }}
                        >
                          Counted
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  Next step: swap the placeholder activity array with your real
                  Firestore click events for this server.
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <ScoreBreakdownModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        server={server}
      />

      <style>{`
        @media (max-width: 1100px) {
          .serverProfileGrid {
            grid-template-columns: 1fr !important;
          }

          .profileStatsGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 720px) {
          .profileStatsGrid,
          .profileEngagementGrid {
            grid-template-columns: 1fr !important;
          }

          .profileActivityHeader,
          .profileActivityRow {
            grid-template-columns: 90px 1fr 84px !important;
          }
        }
      `}</style>
    </div>
  )
}