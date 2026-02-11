// src/App.tsx
import { useEffect, useMemo, useState } from "react"
import "./App.css"
import { mockServers } from "./data/updateBADA"
import { calculateScore } from "./lib/score"
import { fetchStaffCountsLast21Days } from "./lib/events"

const PROMO_WEIGHT = 0.12

type ViewMode = "store" | "league"

function InfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  const weighted = (base: number) => Math.round(base * PROMO_WEIGHT)

  return (
    <div className="modalOverlay" onClick={onClose} role="presentation">
      <div
        className="modalCard"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <div /> {/* left spacer */}

          <div className="modalHeaderCenter">
            <div className="modalTitle">How scoring works</div>
            <div className="modalSub">Scoring v1.0.0</div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="codeBlock">
            Score = (460 × (BADA% ÷ 135)) + (390 × (Reviews ÷ (Sales ÷ 500))) + (150 ×
            (Rewards ÷ (Sales ÷ 800))) − (PromoPenalty × {PROMO_WEIGHT})
          </div>

          <div className="grid2">
            <div className="panel">
              <div className="panelTitle">How the score is weighted</div>

              <ul className="list">
                <li>
                  <b>BADA:</b> 46% of the score
                </li>
                <li>
                  <b>Reviews:</b> 39% of the score
                </li>
                <li>
                  <b>Rewards:</b> 15% of the score
                </li>
              </ul>

              <div className="hint">
                BADA, Reviews, and Rewards are weighted 46% / 39% / 15% of the total score. BADA is
                scaled against 135%. Reviews are expected at 1 per $500 in sales. Rewards are
                expected at 1 per $800 in sales.
              </div>

              <div className="hint" style={{ marginTop: "10px" }}>
                We mapped review, reward, and promo expectations to sales, so opportunity is
                proportional to volume to account for varience in business or quantity of shifts.
              </div>
            </div>

            <div className="panel">
              <div className="panelTitle">Promo/Void penalty</div>
              <div className="hint">
                Promos/voids are evaluated as % of sales. The tier below shows the base penalty, and
                the actual score deduction is weighted at {(PROMO_WEIGHT * 100).toFixed(0)}%.
              </div>

              <div className="penaltyTable">
                <div className="penRow">
                  <span>≤ 0.20% of sales</span>
                  <span>0</span>
                </div>

                <div className="penRow">
                  <span>0.21–0.30%</span>
                  <span>−50 (−{weighted(50)} pts)</span>
                </div>

                <div className="penRow">
                  <span>0.31–0.50%</span>
                  <span>−100 (−{weighted(100)} pts)</span>
                </div>

                <div className="penRow">
                  <span>0.51–0.75%</span>
                  <span>−175 (−{weighted(175)} pts)</span>
                </div>

                <div className="penRow">
                  <span>&gt; 0.75%</span>
                  <span>−250 (−{weighted(250)} pts)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pillRow">
            <span className="pill">Use your QR codes</span>
            <span className="pill">Suggestive Sell</span>
            <span className="pill">Ask for reviews</span>
            <span className="pill">Offer rewards</span>
            <span className="pill">Double check when ringing in orders</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeagueComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Matchup card */}
      <div
        style={{
          padding: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.2 }}>
              WKS Denny&apos;s League
            </div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>Coming soon</div>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            Preseason
          </div>
        </div>

        {/* Matchup */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.20)",
            overflow: "hidden",
          }}
        >
          {/* Header strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 800,
              opacity: 0.85,
              letterSpacing: 0.3,
            }}
          >
            <div>Matchup</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ opacity: 0.8 }}>Awaiting competitors</span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.45)",
                  display: "inline-block",
                }}
              />
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              alignItems: "center",
              padding: 14,
              gap: 12,
            }}
          >
            {/* Left team */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, letterSpacing: 0.4 }}>
                HOME
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.20)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    opacity: 0.85,
                  }}
                >
                  ?
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.9 }}>
                  Awaiting Store
                </div>
              </div>
            </div>

            {/* Score */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 950,
                  letterSpacing: 0.5,
                  opacity: 0.8,
                  lineHeight: 1,
                }}
              >
                — : —
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>VS</div>
            </div>

            {/* Right team */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, letterSpacing: 0.4 }}>
                AWAY
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.9 }}>
                  Awaiting Store
                </div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.20)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    opacity: 0.85,
                  }}
                >
                  ?
                </div>
              </div>
            </div>
          </div>

          {/* Footer strip */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              opacity: 0.75,
            }}
          >
            <div>Format: store vs store</div>
            <div style={{ fontWeight: 800, opacity: 0.85 }}>Score = Team Avg</div>
          </div>
        </div>
      </div>

      {/* Scoreboard table under it */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px",
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 800,
            opacity: 0.85,
            letterSpacing: 0.3,
          }}
        >
          <div>Team</div>
          <div style={{ textAlign: "right" }}>Score</div>
        </div>

        {["Awaiting competitors", "Awaiting competitors", "Awaiting competitors"].map((t, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px",
              padding: "12px",
              borderBottom: i === 2 ? "none" : "1px solid rgba(255,255,255,0.06)",
              alignItems: "center",
            }}
          >
            <div style={{ opacity: 0.82, fontWeight: 700 }}>{t}</div>
            <div style={{ textAlign: "right", opacity: 0.65, fontWeight: 900 }}>—</div>
          </div>
        ))}
      </div>

      <div style={{ opacity: 0.7, fontSize: 12 }}>
        League will compare stores and districts once competitors are onboarded.
      </div>
    </div>
  )
}


export default function App() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [mode, setMode] = useState<ViewMode>("store")

  const [countsByStaff, setCountsByStaff] = useState<
    Record<string, { reviews: number; rewards: number }>
  >({})

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const counts = await fetchStaffCountsLast21Days("6909")
        console.log("Loaded event counts:", counts)
        if (alive) setCountsByStaff(counts)
      } catch (err) {
        console.error("Failed to load events:", err)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const leaderboard = useMemo(() => {
    return mockServers
      .map((server) => {
        const c = countsByStaff[server.id] ?? { reviews: 0, rewards: 0 }

        const merged = {
          ...server,
          reviews: c.reviews,
          rewards: c.rewards,
        }

        return {
          ...merged,
          score: calculateScore(merged),
          promoRate: merged.sales > 0 ? merged.promoDollars / merged.sales : 0,
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [countsByStaff])

  return (
    <div className="appBg">
      <div className="nav">
        <div className="navInner">
          <div className="brand">
            <span className="brandMark" />
            <div className="brandText">
              <div className="brandTitle">Performance</div>
              <div className="brandSub">Team 6909</div>
            </div>
          </div>
        </div>
        <div className="navGlow" />
      </div>

      <main className="container">
        <div className="hero">
          <h1 className="title">Server Leaderboard</h1>
          <p className="subtitle">
            Trailing 21 days · Reviews & Rewards near real-time · BADA & Promos weekly · Last refresh:
            Sun 2/8
          </p>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>


                <div
                  role="tablist"
                  aria-label="Leaderboard mode"
                  style={{
                    display: "inline-flex",
                    padding: 4,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                    gap: 4,
                  }}
                >

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "store"}
                    onClick={() => setMode("store")}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: 0.2,
                      color: "inherit",
                      background: mode === "store" ? "rgba(255,255,255,0.10)" : "transparent",
                    }}
                  >
                    Store
                  </button>

                  {/* LOCKED TAB */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={false}
                    aria-disabled="true"
                    disabled
                    title="Coming soon"
                    style={{
                      border: "none",
                      cursor: "not-allowed",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: 0.2,
                      color: "inherit",
                      background: "transparent",
                      opacity: 0.55,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 12, opacity: 0.9 }}>
                      🔒
                    </span>
                    WKS League
                  </button>
                </div>
              </div>

              {/* FIX: compare to "store" (lowercase), not "Store" */}
              <div className="cardSub">{mode === "store" ? "Team 6909" : "WKS league mode"}</div>
            </div>

            <button className="iconBtn" onClick={() => setInfoOpen(true)} aria-label="Open scoring info">
              ?
            </button>
          </div>

          {mode === "league" ? (
            <div style={{ padding: 16 }}>
              <LeagueComingSoon />
            </div>
          ) : (
            <>
              <div className="tableWrap" aria-label="Leaderboard table scroll area">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 70 }}>Rank</th>
                      <th style={{ width: 120 }}>Server</th>

                      <th className="scoreHeader" style={{ width: 120, textAlign: "right" }}>
                        Score
                        <span className="scrollHint" aria-hidden>
                          › › ›
                        </span>
                      </th>

                      <th style={{ width: 120, textAlign: "right" }}>BADA %</th>
                      <th style={{ width: 110, textAlign: "right" }}>Reviews</th>
                      <th style={{ width: 110, textAlign: "right" }}>Rewards</th>
                      <th style={{ width: 140, textAlign: "right" }}>Promos ($)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaderboard.map((s, idx) => {
                      const top = idx === 0
                      const second = idx === 1
                      const third = idx === 2
                      const rowClass = top ? "rowTop" : second ? "rowSecond" : third ? "rowThird" : ""

                      return (
                        <tr key={s.id} className={rowClass}>
                          <td>
                            <div className="rankPill">{idx + 1}</div>
                          </td>

                          <td>
                            <div className="nameCell">
                              <div>
                                <div className="name">{s.name}</div>
                                <div className="meta">Promo {(s.promoRate * 100).toFixed(2)}%</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <span className="score">{s.score}</span>
                          </td>

                          <td style={{ textAlign: "right" }}>{s.badaPercent}%</td>
                          <td style={{ textAlign: "right" }}>{s.reviews}</td>
                          <td style={{ textAlign: "right" }}>{s.rewards}</td>
                          <td style={{ textAlign: "right" }}>${s.promoDollars}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="footerNote">
                Tip: Click <span className="mono"> "?" </span> in the top bar to see how scoring works.
              </div>
            </>
          )}
        </div>
      </main>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
