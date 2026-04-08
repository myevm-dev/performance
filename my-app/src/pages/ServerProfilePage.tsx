import React, { useMemo, useState } from "react"

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
}

type ServerProfilePageProps = {
  server: ServerProfile | null
  onBack: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatMoney(value?: number) {
  return `$${(value ?? 0).toLocaleString()}`
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
  if (badaPercent >= 130) return "#22c55e"
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

function buildBadaBars(currentBada: number) {
  const base = currentBada || 0
  const raw = [
    Math.max(base - 14, 40),
    Math.max(base - 7, 50),
    Math.max(base - 3, 60),
    base,
    Math.max(base - 5, 55),
    Math.max(base + 2, 60),
    base,
  ]

  return raw.map((v) => clamp(v, 30, 180))
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
        border: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.72, fontWeight: 800, letterSpacing: 0.3 }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 950,
          color: accent || "white",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
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
  const badaPoints = 460 * (badaPercent / 130)
  const reviewPoints = 390 * (reviews / 25)
  const rewardPoints = 150 * (rewards / 10)

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "min(760px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10,10,18,0.96)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.5)",
          color: "white",
        }}
      >
        <div
          style={{
            padding: "18px 18px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 950 }}>{server.name} Score Breakdown</div>
            <div style={{ fontSize: 13, opacity: 0.68 }}>Current score inputs and weighted formula</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              cursor: "pointer",
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              color: "inherit",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div
            style={{
              borderRadius: 16,
              padding: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            Score = (460 × (BADA% ÷ 130)) + (390 × (Reviews ÷ 25)) + (150 × (Rewards ÷ 10)) - (PromoPenalty × 0.15)
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <StatCard label="BADA %" value={formatPercent(badaPercent)} accent={getBadaColor(badaPercent)} />
            <StatCard label="Reviews" value={String(reviews)} accent="#67e8f9" />
            <StatCard label="Rewards" value={String(rewards)} accent="#c084fc" />
            <StatCard label="Promo Rate" value={formatPercent(promoRate * 100, 2)} accent={getPromoPenaltyColor(promoRate)} />
          </div>

          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}
          >
            {[
              [`460 × (${badaPercent} ÷ 130)`, badaPoints.toFixed(2)],
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
                  borderBottom: index === 5 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  fontSize: 14,
                  alignItems: "center",
                }}
              >
                <div style={{ opacity: 0.82 }}>{label}</div>
                <div
                  style={{
                    fontWeight: 900,
                    color: label === "Promo/Void $" || label === "Sales"
                      ? "white"
                      : label === `${promoPenaltyBase} × 0.15`
                      ? getPromoPenaltyColor(promoRate)
                      : "#e5e7eb",
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
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(90deg, rgba(253,1,245,0.16), rgba(1,252,252,0.12))",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800, letterSpacing: 0.3 }}>
              FINAL SCORE
            </div>
            <div style={{ marginTop: 8, fontSize: 42, fontWeight: 950 }}>
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
  const [activityFilter, setActivityFilter] = useState<"all" | "review" | "rewards">("all")
  const [badgeStart, setBadgeStart] = useState(0)

  if (!server) return null


  const badges = [
    { id: "first-review", label: "First Review", image: "/badges/firstreviewbadge.png", unlocked: true },
    { id: "five-reviews", label: "5 Reviews", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-store", label: "Top Store", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-district", label: "Top District", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-region", label: "Top Region", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-company", label: "Top Company", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-district-2", label: "Top District", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-region-2", label: "Top Region", image: "/badges/firstreviewbadge.png", unlocked: false },
    { id: "top-company-2", label: "Top Company", image: "/badges/firstreviewbadge.png", unlocked: false },
  ]

  const avatarUrl = `https://api.dicebear.com/7.x/glass/svg?seed=${server.avatarSeed || server.id}`


  const visibleBadgeCount = 5
  const maxBadgeStart = Math.max(0, badges.length - visibleBadgeCount)
  const visibleBadges = badges.slice(badgeStart, badgeStart + visibleBadgeCount)

  const badaPercent = server.badaPercent ?? 0
  const reviews = server.reviews ?? 0
  const rewards = server.rewards ?? 0
  const promoDollars = server.promoDollars ?? 0
  const sales = server.sales ?? 0
  const score = server.score ?? 0
  const promoRate = sales > 0 ? promoDollars / sales : server.promoRate ?? 0
  const promoPenaltyColor = getPromoPenaltyColor(promoRate)
  const badaBars = useMemo(() => buildBadaBars(badaPercent), [badaPercent])
  const activityRows = useMemo(() => buildDummyActivity(reviews, rewards), [reviews, rewards])

  const filteredActivity = useMemo(() => {
    if (activityFilter === "review") return activityRows.filter((row) => row.type === "Review")
    if (activityFilter === "rewards") return activityRows.filter((row) => row.type === "Rewards")
    return activityRows
  }, [activityRows, activityFilter])

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(253,1,245,0.10), transparent 22%), radial-gradient(circle at top right, rgba(1,252,252,0.08), transparent 20%), #060617",
        color: "white",
        padding: 18,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1500,
          margin: "0 auto",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(7,10,28,0.98), rgba(6,8,22,0.98))",
          boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 4,
            background: "linear-gradient(90deg, rgba(253,1,245,0.9), rgba(1,252,252,0.9))",
          }}
        />

        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                borderRadius: 999,
                padding: "10px 16px",
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>

            <div>
              <div style={{ fontSize: 26, fontWeight: 950, lineHeight: 1.05 }}>
                {server.name}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.68 }}>
                {server.storeName || `Store ${server.storeNumber || ""}`}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setBadgeStart((prev) => Math.max(0, prev - 1))}
              disabled={badgeStart === 0}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: badgeStart === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                color: "white",
                cursor: badgeStart === 0 ? "not-allowed" : "pointer",
                opacity: badgeStart === 0 ? 0.45 : 1,
                fontWeight: 900,
                flexShrink: 0,
              }}
              aria-label="Previous badges"
              title="Previous badges"
            >
              ‹
            </button>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 8,
                alignItems: "start",
              }}
            >
              {visibleBadges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  title={badge.label}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 72,
                      aspectRatio: "1 / 1",
                      borderRadius: 16,
                      overflow: "hidden",
                      border: badge.unlocked
                        ? "1px solid rgba(255,255,255,0.14)"
                        : "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.04)",
                      boxShadow: badge.unlocked ? "0 8px 20px rgba(0,0,0,0.22)" : "none",
                      opacity: badge.unlocked ? 1 : 0.35,
                      filter: badge.unlocked ? "none" : "grayscale(1)",
                    }}
                  >
                    <img
                      src={badge.image}
                      alt={badge.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      opacity: badge.unlocked ? 0.85 : 0.45,
                      textAlign: "center",
                      lineHeight: 1.2,
                      width: "100%",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {badge.label}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setBadgeStart((prev) => Math.min(maxBadgeStart, prev + 1))}
              disabled={badgeStart >= maxBadgeStart}
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background:
                  badgeStart >= maxBadgeStart ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                color: "white",
                cursor: badgeStart >= maxBadgeStart ? "not-allowed" : "pointer",
                opacity: badgeStart >= maxBadgeStart ? 0.45 : 1,
                fontWeight: 900,
                flexShrink: 0,
              }}
              aria-label="Next badges"
              title="Next badges"
            >
              ›
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 12,
                fontWeight: 800,
                opacity: 0.88,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(222, 18, 18, 0.92)",
                  display: "inline-block",
                }}
              />
              Demo WIP
            </div>

          </div>
        </div>

        <div
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 4,
                  background: "linear-gradient(90deg, rgba(253,1,245,0.9), rgba(1,252,252,0.9))",
                }}
              />

              <div style={{ padding: 18 }}>
                <div
                   
                    style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 24,
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                        margin: "0 auto",
                    }}
                    >
                    <img
                        src="https://api.dicebear.com/9.x/glass/svg?seed=Chase"
                        alt="avatar"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                        }}
                        />
                    </div>

                <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => setScoreOpen(true)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "white",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 50, fontWeight: 950, lineHeight: 1 }}>
                    {score}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      opacity: 0.72,
                      textDecoration: "underline dotted",
                    }}
                  >
                    View score breakdown
                  </div>
                </button>

                <div style={{ marginTop: 18, fontSize: 24, fontWeight: 900 }}>
                  {server.name}
                </div>

                <div style={{ marginTop: 6, fontSize: 15, opacity: 0.78 }}>
                  {server.storeName || `Store ${server.storeNumber || ""}`}
                </div>
              </div>

                <div
                  style={{
                    marginTop: 16,
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
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ fontSize: 13, opacity: 0.74, fontWeight: 800 }}>{label}</span>
                      <span
                        style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color,
                            background: "rgba(255,255,255,0.06)",
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        >
                        {value}
                        </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
                padding: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.88 }}>
                Quick Snapshot
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
                  .
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    background: "rgba(1,252,252,0.06)",
                    border: "1px solid rgba(1,252,252,0.12)",
                    fontSize: 12,
                    opacity: 0.86,
                    lineHeight: 1.6,
                  }}
                >
                  .
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>BADA Performance</div>
                
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    fontSize: 12,
                    fontWeight: 900,
                    color: getBadaColor(badaPercent),
                  }}
                >
                  Trailing 4 week average: {formatPercent(badaPercent)}
                </div>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  style={{
                    height: 280,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background:
                      "linear-gradient(180deg, rgba(1,252,252,0.04), rgba(253,1,245,0.04)), rgba(0,0,0,0.12)",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: "repeat(4, 1fr)",
                      gap: 0,
                      flex: 1,
                      position: "relative",
                    }}
                  >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: `${(130 / 180) * 100}%`,
                      height: 2,
                      background: "rgba(128, 239, 239, 0.9)",
                      zIndex: 2,
                    }}
                  />
                    {[150, 120, 90, 60].map((tick) => (
                      <div
                        key={tick}
                        style={{
                          borderTop: "1px dashed rgba(255,255,255,0.10)",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: -10,
                            left: 0,
                            fontSize: 11,
                            opacity: 0.45,
                          }}
                        >
                          {tick}%
                        </span>
                      </div>
                    ))}

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 12,
                        paddingTop: 6,
                      }}
                    >
                      {badaBars.map((value, index) => (
                        <div
                          key={`${value}-${index}`}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 10,
                            height: "100%",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              maxWidth: 52,
                              height: `${(value / 180) * 100}%`,
                              minHeight: 18,
                              borderRadius: 14,
                              background:
                                value >= 130
                                  ? "linear-gradient(180deg, rgba(34,197,94,0.95), rgba(16,185,129,0.82))"
                                  : "linear-gradient(180deg, rgba(239,68,68,0.95), rgba(185,28,28,0.82))",
                              boxShadow:
                                value >= 130
                                  ? "0 8px 24px rgba(34,197,94,0.18)"
                                  : "0 8px 24px rgba(239,68,68,0.18)",
                              border: "1px solid rgba(255,255,255,0.10)",
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "center",
                              paddingBottom: 8,
                              fontSize: 10,
                              fontWeight: 900,
                              color: "white",
                            }}
                          >
                            {formatPercent(value)}
                          </div>

                          <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700 }}>
                            W{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <StatCard
                      label="Target"
                      value="130.0%"
                      accent="#67e8f9"
                    />
                    <StatCard
                      label="Current"
                      value={formatPercent(badaPercent)}
                      accent={getBadaColor(badaPercent)}
                    />
                    <StatCard
                      label="Gap"
                      value={formatPercent(Math.abs(130 - badaPercent))}
                      accent={badaPercent >= 130 ? "#22c55e" : "#ef4444"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>Recent Activity</div>
                  
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    padding: 4,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                    gap: 4,
                  }}
                >
                  {[
                    { key: "all" as const, label: "All" },
                    { key: "review" as const, label: "Reviews" },
                    { key: "rewards" as const, label: "Rewards" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActivityFilter(item.key)}
                      style={{
                        border: "none",
                        cursor: "pointer",
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: 0.2,
                        color: "inherit",
                        background:
                          activityFilter === item.key ? "rgba(255,255,255,0.10)" : "transparent",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <StatCard label="Reviews" value={String(reviews)} accent="#67e8f9" />
                  <StatCard label="Rewards" value={String(rewards)} accent="#c084fc" />
                  <StatCard label="Promo/Void $" value={formatMoney(promoDollars)} accent={promoPenaltyColor} />
                  <StatCard label="Sales" value={formatMoney(sales)} accent="white" />
                  <StatCard label="Promo Rate" value={formatPercent(promoRate * 100, 2)} accent={promoPenaltyColor} />
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.16)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr 140px",
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12,
                      fontWeight: 900,
                      opacity: 0.85,
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
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr 140px",
                        padding: "14px",
                        borderBottom:
                          index === filteredActivity.length - 1
                            ? "none"
                            : "1px solid rgba(255,255,255,0.06)",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          color: row.type === "Review" ? "#67e8f9" : "#c084fc",
                        }}
                      >
                        {row.type}
                      </div>

                      <div style={{ fontSize: 13, opacity: 0.82 }}>
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
                            fontWeight: 900,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
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
                    opacity: 0.62,
                  }}
                >
                  Next step: swap the placeholder activity array with your real Firestore click events for this server.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScoreBreakdownModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        server={server}
      />

      <style>{`
        @media (max-width: 1100px) {
          .server-profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}