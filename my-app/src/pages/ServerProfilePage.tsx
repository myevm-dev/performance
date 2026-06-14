import { useEffect, useMemo, useRef, useState } from "react"
import { getGlassGradient } from "../lib/glassColors"
import {
  collection,
  getDocs,

  query,
  where,
} from "firebase/firestore"
import { db } from "../lib/firebase"
import GuestEngagementSection, {
  type GuestActivityRow,
} from "../components/GuestEngagementSection"
import { stores } from "../data/stores"

type EngagementTooltipState = {
  x: number
  y: number
  bar: EngagementWeeklyBar
} | null


type ServerProfile = {
  id: string
  code?: string
  staffId?: string
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
  servers: ServerProfile[]
  onBack: () => void
}
type BadaWindow = "all" | "12w" | "4w"

type EngagementWeeklyBar = {
  key: string
  label: string
  reviews: number
  rewards: number
  total: number
  startMs: number
}

type GuestEngagementSummary = {
  lifetimeReviews: number
  lifetimeRewards: number
  weeklyBars: EngagementWeeklyBar[]
}

function getWeekStartForChart(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  const day = d.getDay()
  const diff = (day - 4 + 7) % 7 // Thu start
  d.setDate(d.getDate() - diff)

  return d
}

function formatChartDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  })
}

function emptyGuestEngagementSummary(): GuestEngagementSummary {
  return {
    lifetimeReviews: 0,
    lifetimeRewards: 0,
    weeklyBars: [],
  }
}

function formatMoney(value?: number) {
  return `$${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getRankLabel(rank: number | null, total: number) {
  if (!rank || total <= 0) return "Soon"
  return `#${rank} of ${total}`
}

function rankServersByExistingScore(
  servers: ServerProfile[],
  currentServerId: string,
  filterFn: (server: ServerProfile) => boolean
) {
  const ranked = servers
    .filter(filterFn)
    .filter((server) => typeof server.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const index = ranked.findIndex((server) => server.id === currentServerId)

  return {
    rank: index >= 0 ? index + 1 : null,
    total: ranked.length,
  }
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

function eventToType(event?: string): "Review" | "Rewards" {
  if (event === "click_rewards") return "Rewards"
  return "Review"
}

async function fetchGuestEngagement(storeNumber: string, staffId: string) {
  const clicksRef = collection(db, "stores", storeNumber, "uniqueClicks")

  const q = query(clicksRef, where("staffId", "==", staffId))
  const snap = await getDocs(q)

  const weeklyMap = new Map<string, EngagementWeeklyBar>()
  let lifetimeReviews = 0
  let lifetimeRewards = 0

  const allRows = snap.docs.map((docSnap) => {
    const data = docSnap.data()
    const type = eventToType(data.event)
    const createdAt = data.createdAt ?? null

    if (type === "Review") lifetimeReviews += 1
    if (type === "Rewards") lifetimeRewards += 1

    try {
      const date = createdAt?.toDate?.()

      if (date) {
        const weekStart = getWeekStartForChart(date)
        const key = weekStart.toISOString().slice(0, 10)

        const existing =
          weeklyMap.get(key) ??
          {
            key,
            label: formatChartDate(weekStart),
            reviews: 0,
            rewards: 0,
            total: 0,
            startMs: weekStart.getTime(),
          }

        if (type === "Review") existing.reviews += 1
        if (type === "Rewards") existing.rewards += 1

        existing.total = existing.reviews + existing.rewards
        weeklyMap.set(key, existing)
      }
    } catch {
      // ignore malformed dates
    }

    return {
      id: docSnap.id,
      type,
      label: type === "Review" ? "Google review click" : "Rewards signup click",
      createdAt,
      weekKey: data.weekKey,
      weekOfYear: data.weekOfYear,
    } satisfies GuestActivityRow
  })

  const rows = allRows
    .sort((a, b) => {
      const aMs = a.createdAt?.toMillis?.() ?? 0
      const bMs = b.createdAt?.toMillis?.() ?? 0
      return bMs - aMs
    })
    .slice(0, 50)

  const weeklyBars = Array.from(weeklyMap.values())
    .sort((a, b) => a.startMs - b.startMs)
    .slice(-12)

  return {
    rows,
    summary: {
      lifetimeReviews,
      lifetimeRewards,
      weeklyBars,
    },
  }
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

function GuestEngagementLifetimeChart({
  summary,
}: {
  summary: GuestEngagementSummary
}) {
  const bars = summary.weeklyBars
  const lifetimeTotal = summary.lifetimeReviews + summary.lifetimeRewards

  const chartWrapRef = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<EngagementTooltipState>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const svgWidth = 1000
  const svgHeight = 285
  const padLeft = 52
  const padRight = 24
  const padTop = 20
  const padBottom = 56
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  const maxValue = Math.max(1, ...bars.map((bar) => bar.total))

  const ticks = [
    maxValue,
    Math.ceil(maxValue * 0.75),
    Math.ceil(maxValue * 0.5),
    Math.ceil(maxValue * 0.25),
    0,
  ].filter((value, index, arr) => arr.indexOf(value) === index)

  const getY = (value: number) => {
    return padTop + ((maxValue - value) / maxValue) * plotHeight
  }

  const getX = (index: number) => {
    if (bars.length <= 1) return padLeft + plotWidth / 2
    return padLeft + (index / (bars.length - 1)) * plotWidth
  }

  const baseBarWidth =
    bars.length <= 4 ? 44 : bars.length <= 8 ? 34 : 28

  function showTooltip(
    clientX: number,
    clientY: number,
    bar: EngagementWeeklyBar
  ) {
    const wrap = chartWrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const tooltipWidth = 180
    const tooltipHeight = 126

    let x = clientX - rect.left + 14
    let y = clientY - rect.top - 14

    if (x + tooltipWidth > rect.width - 8) {
      x = rect.width - tooltipWidth - 8
    }

    if (x < 8) x = 8

    if (y + tooltipHeight > rect.height - 8) {
      y = rect.height - tooltipHeight - 8
    }

    if (y < 8) y = 8

    setTooltip({ x, y, bar })
  }

  return (
    <section
      className="card profileGuestLifetimeCard"
      style={{
        gridColumn: "1 / -1",
        marginTop: 0,
        overflow: "hidden",
      }}
    >
      <div className="cardHeader">
        <div>
          <div className="cardTitle">Guest Engagement Trend</div>
          <div className="cardSub">
            Lifetime totals and weekly review/rewards clicks for this server
          </div>
        </div>
      </div>

      <div
        className="profileGuestLifetimeStats"
        style={{
          padding: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <StatCard
          label="Lifetime Reviews"
          value={String(summary.lifetimeReviews)}
          accent="#19c37d"
          sub="All counted review clicks"
        />

        <StatCard
          label="Lifetime Rewards"
          value={String(summary.lifetimeRewards)}
          accent="#7c5cff"
          sub="All counted rewards clicks"
        />

        <StatCard
          label="Lifetime Total"
          value={String(lifetimeTotal)}
          accent="#2563eb"
          sub="Reviews plus rewards"
        />
      </div>

      <div style={{ padding: "0 18px 18px" }}>
        <div
          style={{
            borderRadius: 20,
            border: "1px solid var(--stroke)",
            background:
              "linear-gradient(180deg, rgba(37,99,235,0.03), rgba(139,92,246,0.03)), color-mix(in srgb, var(--card2) 42%, transparent)",
            padding: 14,
            overflow: "hidden",
          }}
        >
          {bars.length > 0 ? (
            <div
              ref={chartWrapRef}
              style={{
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                position: "relative",
                scrollbarGutter: "stable",
              }}
            >
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{
                  width: "100%",
                  minWidth: 720,
                  height: "auto",
                  display: "block",
                }}
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
              >
                {ticks.map((tick) => {
                  const y = getY(tick)

                  return (
                    <g key={tick}>
                      <line
                        x1={padLeft}
                        x2={svgWidth - padRight}
                        y1={y}
                        y2={y}
                        stroke="rgba(148,163,184,0.24)"
                        strokeWidth="1"
                        strokeDasharray="4 7"
                      />

                      <text
                        x={8}
                        y={y + 4}
                        fontSize="12"
                        fontWeight="800"
                        fill="var(--muted)"
                      >
                        {tick}
                      </text>
                    </g>
                  )
                })}

                {bars.map((bar, index) => {
                  const isActive = hoveredKey === bar.key
                  const currentBarWidth = baseBarWidth
                  const x = getX(index) - currentBarWidth / 2
                  const centerX = x + currentBarWidth / 2
                  const isNewestWeek = index === bars.length - 1

                  const reviewHeight = (bar.reviews / maxValue) * plotHeight
                  const rewardHeight = (bar.rewards / maxValue) * plotHeight
                  const reviewY = padTop + plotHeight - reviewHeight
                  const rewardY = reviewY - rewardHeight

                  return (
                    <g
                      key={bar.key}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => {
                        setHoveredKey(bar.key)
                        showTooltip(e.clientX, e.clientY, bar)
                      }}
                      onMouseLeave={() => {
                        setHoveredKey(null)
                        setTooltip(null)
                      }}
                    >
                      <line
                        x1={centerX}
                        x2={centerX}
                        y1={padTop}
                        y2={svgHeight - padBottom}
                        stroke={
                          isActive
                            ? "rgba(37,99,235,0.14)"
                            : "rgba(148,163,184,0.08)"
                        }
                        strokeWidth="1"
                      />

                      {bar.reviews > 0 ? (
                        <rect
                          x={x}
                          y={reviewY}
                          width={currentBarWidth}
                          height={reviewHeight}
                          rx="8"
                          fill="#19c37d"
                          style={{
                            filter: isActive
                              ? "drop-shadow(0 8px 16px rgba(25,195,125,0.28))"
                              : "drop-shadow(0 5px 10px rgba(25,195,125,0.16))",
                            opacity: isActive ? 1 : 0.96,
                            transition: "opacity 160ms ease, filter 160ms ease",
                          }}
                        />
                      ) : null}

                      {bar.rewards > 0 ? (
                        <rect
                          x={x}
                          y={rewardY}
                          width={currentBarWidth}
                          height={rewardHeight}
                          rx="8"
                          fill="#7c5cff"
                          style={{
                            filter: isActive
                              ? "drop-shadow(0 6px 14px rgba(124,92,255,0.28))"
                              : "drop-shadow(0 4px 8px rgba(124,92,255,0.16))",
                            opacity: isActive ? 1 : 0.96,
                            transition: "opacity 160ms ease, filter 160ms ease",
                          }}
                        />
                      ) : null}

                      <text
                        x={centerX}
                        y={svgHeight - (isNewestWeek ? 28 : 16)}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight={isActive ? "950" : "850"}
                        fill={isActive ? "var(--text)" : "var(--muted)"}
                      >
                        {bar.label}
                      </text>

                      {isNewestWeek ? (
                        <g>
                          <rect
                            x={centerX - 20}
                            y={svgHeight - 22}
                            width="40"
                            height="17"
                            rx="8.5"
                            fill="rgba(25,195,125,0.14)"
                            stroke="rgba(25,195,125,0.35)"
                          />

                          <circle
                            cx={centerX - 11}
                            cy={svgHeight - 13.5}
                            r="3"
                            fill="#19c37d"
                          />

                          <text
                            x={centerX + 6}
                            y={svgHeight - 9.5}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="950"
                            fill="#19c37d"
                            letterSpacing="0.5"
                          >
                            LIVE
                          </text>
                        </g>
                      ) : null}
                    </g>
                  )
                })}
              </svg>

              {tooltip ? (
                <div
                  style={{
                    position: "absolute",
                    left: tooltip.x,
                    top: tooltip.y,
                    width: 180,
                    pointerEvents: "none",
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.24)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
                    padding: 12,
                    zIndex: 5,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 950,
                      color: "#0f172a",
                      marginBottom: 10,
                    }}
                  >
                    Week of {tooltip.bar.label}
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#059669", fontWeight: 800 }}>
                        Reviews
                      </span>
                      <span style={{ color: "#0f172a", fontWeight: 950 }}>
                        {tooltip.bar.reviews}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#7c3aed", fontWeight: 800 }}>
                        Rewards
                      </span>
                      <span style={{ color: "#0f172a", fontWeight: 950 }}>
                        {tooltip.bar.rewards}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 1,
                        background: "rgba(148,163,184,0.18)",
                        margin: "2px 0",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#334155", fontWeight: 900 }}>
                        Total
                      </span>
                      <span style={{ color: "#0f172a", fontWeight: 950 }}>
                        {tooltip.bar.total}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                minHeight: 190,
                display: "grid",
                placeItems: "center",
                color: "var(--muted)",
                fontWeight: 900,
              }}
            >
              No engagement history found for this server yet.
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 900,
          }}
        >
          <span>
            <span style={{ color: "#19c37d" }}>■</span> Reviews
          </span>
          <span>
            <span style={{ color: "#7c5cff" }}>■</span> Rewards
          </span>
        </div>
      </div>
    </section>
  )
}

export default function ServerProfilePage({
  server,
  servers,
}: ServerProfilePageProps) {
  const [scoreOpen, setScoreOpen] = useState(false)
  const [activityFilter, setActivityFilter] = useState<
    "all" | "review" | "rewards"
  >("all")
  const [badaWindow, setBadaWindow] = useState<BadaWindow>("12w")
  const [activityRows, setActivityRows] = useState<GuestActivityRow[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [isMobileChart, setIsMobileChart] = useState(false)

  const [engagementSummary, setEngagementSummary] =
  useState<GuestEngagementSummary>(emptyGuestEngagementSummary())
  const serverId = server?.code ?? server?.staffId ?? server?.id ?? ""
  const serverStoreNumber = server?.storeNumber ?? ""
  const currentStore = stores.find(
  (store) => store.storeNumber === server?.storeNumber
)

  const currentDistrictId = currentStore?.districtId
  const currentRegionId = currentStore?.regionId

  const storeRank = rankServersByExistingScore(
    servers,
    serverId,
    (item) => item.storeNumber === server?.storeNumber
  )

  const districtRank = rankServersByExistingScore(servers, serverId, (item) => {
    const itemStore = stores.find(
      (store) => store.storeNumber === item.storeNumber
    )

    return Boolean(
      currentDistrictId && itemStore?.districtId === currentDistrictId
    )
  })

  const regionRank = rankServersByExistingScore(servers, serverId, (item) => {
    const itemStore = stores.find(
      (store) => store.storeNumber === item.storeNumber
    )

    return Boolean(currentRegionId && itemStore?.regionId === currentRegionId)
  })

  const companyRank = rankServersByExistingScore(
    servers,
    serverId,
    () => true
  )

  const badaPercent = server?.badaPercent ?? 0
  const reviews = server?.reviews ?? 0
  const rewards = server?.rewards ?? 0
  const score = server?.score ?? 0
  const sales = server?.sales ?? 0
  const promoDollars = server?.promoDollars ?? 0
  const promoRate =
    sales > 0 ? promoDollars / sales : server?.promoRate ?? 0

  const badaBars = useMemo(
    () => buildBadaBars(server?.badaWeeks),
    [server?.badaWeeks]
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

  const filteredActivity = useMemo(() => {
    if (activityFilter === "review") {
      return activityRows.filter((row) => row.type === "Review")
    }

    if (activityFilter === "rewards") {
      return activityRows.filter((row) => row.type === "Rewards")
    }

    return activityRows
  }, [activityRows, activityFilter])

  useEffect(() => {
  if (!serverStoreNumber || !serverId) {
    setActivityRows([])
    setEngagementSummary(emptyGuestEngagementSummary())
    return
  }

  let cancelled = false

  async function loadActivity() {
    setActivityLoading(true)

    try {
      const result = await fetchGuestEngagement(serverStoreNumber, serverId)

      if (!cancelled) {
        setActivityRows(result.rows)
        setEngagementSummary(result.summary)
      }
    } catch (error) {
      console.error("Failed to load guest activity", error)

      if (!cancelled) {
        setActivityRows([])
        setEngagementSummary(emptyGuestEngagementSummary())
      }
    } finally {
      if (!cancelled) {
        setActivityLoading(false)
      }
    }
  }

  loadActivity()

  return () => {
    cancelled = true
  }
}, [serverStoreNumber, serverId])

  useEffect(() => {
  const checkMobile = () => {
    setIsMobileChart(window.innerWidth <= 720)
  }

  checkMobile()
  window.addEventListener("resize", checkMobile)

  return () => {
    window.removeEventListener("resize", checkMobile)
  }
}, [])

  if (!server) return null

  const gradient = getGlassGradient(server.avatarSeed || server.id)

  const chartMin = isMobileChart ? 128 : 50
  const chartMax = isMobileChart ? 148 : 210
  const chartTicks = isMobileChart
    ? [148, 144, 140, 136, 132, 128]
    : [200, 180, 160, 140, 120, 100, 80]

  const svgWidth = 1000
const svgHeight = isMobileChart ? 330 : 500
const padLeft = isMobileChart ? 58 : 52
const padRight = isMobileChart ? 18 : 24
const padTop = isMobileChart ? 22 : 42
const padBottom = isMobileChart ? 42 : 58
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
    .map(
      (bar, index) =>
        `${getX(index, plottedBadaBars.length)},${getY(bar.value)}`
    )
    .join(" ")

  return (
    <>
      <main className="serverProfileContainer">
        <div
          className="serverProfileGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "360px minmax(0, 1fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <section
            className="card profileSideCard"
            style={{
              marginTop: 0,
              height: "100%",
              alignSelf: "stretch",
            }}
          >
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`,
              }}
            />

            <div style={{ padding: 18 }}>
              <div
                className="profileAvatarBox"
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
                    className="profileScoreText"
                    style={{
                      fontSize: 52,
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
                    className="profileScoreText"
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
                    score breakdown
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
  className="profileRankPanel"
  style={{
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid var(--stroke)",
    background: "color-mix(in srgb, var(--card2) 34%, transparent)",
    padding: 12,
  }}
>


  <div
    className="profileRankDesktopList"
    style={{
      display: "grid",
      gap: 10,
    }}
  >
    {[
      {
        label: "Store Rank",
        value: getRankLabel(storeRank.rank, storeRank.total),
        color: "#67e8f9",
      },
      {
        label: "District Rank",
        value: getRankLabel(districtRank.rank, districtRank.total),
        color: "#c084fc",
      },
      {
        label: "Region Rank",
        value: getRankLabel(regionRank.rank, regionRank.total),
        color: "#fb7185",
      },
      {
        label: "Company Rank",
        value: getRankLabel(companyRank.rank, companyRank.total),
        color: "#facc15",
      },
    ].map((item) => (
      <div
        key={item.label}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          padding: "10px 12px",
          borderRadius: 14,
          background: "color-mix(in srgb, var(--card2) 38%, transparent)",
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
          {item.label}
        </span>

        <span
          style={{
            fontSize: 14,
            fontWeight: 950,
            color: item.color,
            background: "color-mix(in srgb, var(--card2) 42%, transparent)",
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid var(--stroke)",
            whiteSpace: "nowrap",
          }}
        >
          {item.value}
        </span>
      </div>
    ))}
  </div>

  <div
    className="profileRankMiniGrid"
    style={{
      display: "none",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 8,
    }}
  >
    {[
      {
        label: "Store",
        rank: storeRank.rank,
        color: "#67e8f9",
      },
      {
        label: "District",
        rank: districtRank.rank,
        color: "#c084fc",
      },
      {
        label: "Region",
        rank: regionRank.rank,
        color: "#fb7185",
      },
      {
        label: "Company",
        rank: companyRank.rank,
        color: "#facc15",
      },
    ].map((item) => (
      <div
        key={item.label}
        className="profileRankMiniCard"
        style={{
          minWidth: 0,
          borderRadius: 14,
          border: "1px solid var(--stroke)",
          background: "color-mix(in srgb, var(--card2) 46%, transparent)",
          padding: "10px 6px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            fontWeight: 950,
            lineHeight: 1.1,
          }}
        >
          {item.label}
        </div>

        <div
          style={{
            marginTop: 7,
            fontSize: 16,
            color: item.color,
            fontWeight: 950,
            lineHeight: 1,
          }}
        >
          {item.rank ? `#${item.rank}` : "Soon"}
        </div>
      </div>
    ))}

              </div>
            </div>
            </div>
          </section>

          <div
            className="profileTopRight"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              height: "100%",
              minHeight: 0,
            }}
          >
            <section className="card" style={{ marginTop: 0 }}>
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

            <section
              className="card profileBadaCard"
              style={{
                marginTop: 0,
                flex: isMobileChart ? "none" : 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div className="cardHeader">
                <div
                  className="profileBadaTitleRow"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  <div>
                    <div className="cardTitle" style={{ fontSize: 18 }}>
                      BADA Over Time
                    </div>
                    <div className="cardSub">Recent published BADA weeks</div>
                  </div>

                  <div
                    className="profileBadaAverageBadge"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "1px solid var(--stroke)",
                      background: "color-mix(in srgb, var(--card2) 62%, transparent)",
                      fontSize: 14,
                      fontWeight: 950,
                      color: getBadaColor(badaPercent),
                      whiteSpace: "nowrap",
                    }}
                  >
                    Average: {formatPercent(badaPercent)}
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

                  
                </div>
              </div>

              <div
                className="profileBadaChartBody"
                style={{
                  padding: 18,
                  flex: 1,
                  display: "flex",
                  minHeight: 0,
                }}
              >
                <div
                  className="profileBadaChartBox"
                  style={{
                    borderRadius: 20,
                    border: "1px solid var(--stroke)",
                    background:
                      "linear-gradient(180deg, rgba(1,252,252,0.04), rgba(253,1,245,0.035)), color-mix(in srgb, var(--card2) 42%, transparent)",
                    padding: 16,
                    overflow: "hidden",
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {plottedBadaBars.length > 0 ? (
                    <div
                      className="profileBadaSvgWrap"
                      style={{
                        width: "100%",
                        height: "100%",
                        overflowX: "auto",
                      }}
                    >
                     <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        style={{
                          width: "100%",
                          minWidth: isMobileChart ? 0 : 760,
                          height: "auto",
                          display: "block",
                        }}
                        shapeRendering="geometricPrecision"
                        textRendering="geometricPrecision"
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
                        minHeight: isMobileChart ? 180 : 260,
                        width: "100%",
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
          </div>

          <GuestEngagementLifetimeChart summary={engagementSummary} />

          <GuestEngagementSection
            reviews={reviews}
            rewards={rewards}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            filteredActivity={filteredActivity}
            activityLoading={activityLoading}
          />
        </div>
      </main>

      <ScoreBreakdownModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        server={server}
      />

<style>{`
  @media (max-width: 1100px) {
    .serverProfileContainer {
      padding: 14px !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    .serverProfileGrid {
      grid-template-columns: minmax(0, 1fr) !important;
      align-items: start !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    .profileGuestEngagement {
      grid-column: auto !important;
    }

    .profileSideCard,
    .profileTopRight,
    .profileBadaCard {
      height: auto !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }

    .profileStatsGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 720px) {
    .serverProfileContainer {
      padding: 12px !important;
      padding-bottom: 92px !important;
      overflow-x: hidden !important;
    }

    .serverProfileGrid {
      gap: 12px !important;
    }

    .profileSideCard {
      border-radius: 24px !important;
      overflow: hidden !important;
    }

    .profileSideCard > div:nth-child(2) {
      padding: 14px !important;
    }

    .profileAvatarBox {
      width: min(170px, 54vw) !important;
      max-width: 170px !important;
      margin: 0 auto !important;
      border-radius: 20px !important;
    }

    .profileScoreText {
      font-size: 36px !important;
    }

    .profileRankPanel {
      margin-top: 14px !important;
      padding: 10px !important;
      border-radius: 16px !important;
    }

    .profileRankTitle {
      margin-bottom: 8px !important;
      text-align: left !important;
    }

    .profileRankDesktopList {
      display: none !important;
    }

    .profileRankMiniGrid {
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
      gap: 6px !important;
    }

    .profileRankMiniCard {
      padding: 9px 4px !important;
      border-radius: 13px !important;
    }

    .profileRankMiniCard div:first-child {
      font-size: 10px !important;
    }

    .profileRankMiniCard div:nth-child(2) {
      font-size: 15px !important;
    }

    .profileStatsGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

    .profileStatsGrid > div {
      padding: 12px !important;
      border-radius: 16px !important;
    }

    .profileStatsGrid > div > div:nth-child(2) {
      font-size: 24px !important;
    }

    .profileGuestEngagement .cardHeader {
  padding: 14px 16px !important;
  text-align: center !important;
}

.profileGuestEngagement .cardHeader > div:first-child {
  width: 100% !important;
  text-align: center !important;
}

.profileGuestEngagement .cardTitle {
  font-size: 16px !important;
  line-height: 1.15 !important;
}

.profileGuestEngagement .cardSub {
  font-size: 12px !important;
  line-height: 1.2 !important;
  margin-top: 4px !important;
}

.profileEngagementGrid {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

.profileEngagementGrid > * {
  min-width: 0 !important;
}

.profileEngagementGrid > * > div,
.profileEngagementGrid > * button {
  width: 100% !important;
}

    .profileBadaCard {
  flex: none !important;
}

.profileBadaCard .cardHeader {
  padding: 12px 14px !important;
  gap: 8px !important;
}

.profileBadaCard .cardHeader .cardTitle {
  font-size: 16px !important;
  line-height: 1.15 !important;
}

.profileBadaCard .cardHeader .cardSub {
  font-size: 12px !important;
  line-height: 1.2 !important;
  margin-top: 2px !important;
}

.profileBadaCard .cardHeader > div:last-child {
  justify-content: flex-start !important;
  gap: 6px !important;
  row-gap: 6px !important;
}

.profileBadaCard .cardHeader > div:last-child > div:first-child {
  font-size: 12px !important;
  font-weight: 800 !important;
}

.profileBadaCard .cardHeader > div:last-child > div:nth-child(2) {
  padding: 3px !important;
  gap: 4px !important;
}

.profileBadaCard .cardHeader > div:last-child > div:nth-child(2) button {
  padding: 6px 12px !important;
  font-size: 12px !important;
}

.profileBadaCard .cardHeader > div:last-child > div:last-child {
  padding: 7px 12px !important;
  font-size: 12px !important;
}

.profileBadaChartBody {
  padding: 8px 12px 12px !important;
  flex: none !important;
  min-height: 0 !important;
  display: block !important;
}

.profileBadaChartBox {
  min-height: 0 !important;
  height: auto !important;
  padding: 6px !important;
  display: block !important;
  align-items: unset !important;
}

.profileBadaSvgWrap {
  width: 100% !important;
  height: auto !important;
  overflow-x: hidden !important;
  display: block !important;
}

.profileBadaCard svg {
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  min-width: 0 !important;
  display: block !important;
}

    .profileActivityHeader,
    .profileActivityRow {
      grid-template-columns: 1fr auto !important;
      align-items: center !important;
    }

    .profileActivityHeader > div:nth-child(2),
    .profileActivityHeader > div:nth-child(4),
    .profileActivityHeader > div:nth-child(5),
    .profileActivityRow > div:nth-child(2),
    .profileActivityRow > div:nth-child(4),
    .profileActivityRow > div:nth-child(5) {
      display: none !important;
    }

    .profileActivityHeader > div:nth-child(1),
    .profileActivityRow > div:nth-child(1) {
      text-align: left !important;
    }

    .profileActivityHeader > div:nth-child(3),
    .profileActivityRow > div:nth-child(3) {
      text-align: right !important;
      grid-column: auto !important;
    }

    .profileActivityRow {
      padding: 13px 14px !important;
      gap: 10px !important;
    }

    .profileActivityRow > div:nth-child(1) {
      font-size: 14px !important;
    }

    .profileActivityRow > div:nth-child(3) {
      font-size: 12px !important;
      color: var(--muted) !important;
      font-weight: 900 !important;
    }
  }

  @media (max-width: 430px) {
    .profileAvatarBox {
      width: min(155px, 50vw) !important;
      max-width: 155px !important;
    }
    .profileBadaAverageBadge {
      padding: 6px 9px !important;
      font-size: 10px !important;
    }

    .profileScoreText {
      font-size: 34px !important;
    }

    .profileRankMiniGrid {
      gap: 5px !important;
    }

    .profileRankMiniCard {
      padding: 8px 3px !important;
    }

    .profileRankMiniCard div:first-child {
      font-size: 9px !important;
    }

    .profileRankMiniCard div:nth-child(2) {
      font-size: 14px !important;
    }
  }

  .profileBadaTitleRow {
  align-items: flex-start !important;
}

.profileBadaAverageBadge {
  padding: 7px 10px !important;
  font-size: 11px !important;
}
  .profileGuestEngagement .cardHeader {
  padding: 12px 14px !important;
}

.profileGuestEngagement .cardTitle {
  font-size: 15px !important;
}

.profileGuestEngagement .cardSub {
  font-size: 11px !important;
}



.profileEngagementGrid > * {
  min-width: 0 !important;
}
`}</style>
    </>
  )
}