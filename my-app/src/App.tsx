// src/App.tsx
import { useEffect, useMemo, useState } from "react"
import "./App.css"
import { mockServers } from "./data/updateBADA"
import { calculateScore } from "./lib/score"
import { fetchStaffCountsLast21Days } from "./lib/events"

const PROMO_WEIGHT = 0.12

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
            <div className="modalSub">Rolling 21-day performance · Updated weekly</div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="sectionTitle">Equation v1.0.0</div>
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
                Because review and reward expectations scale with sales, opportunity is proportional
                to volume. Higher performance relative to your sales increases your score. There
                are no caps.
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
                  <span>≤ 0.20%</span>
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

          <div className="sectionTitle">How to win</div>
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

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false)

  // Firebase-derived counts (last 21 days) keyed by staffId
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
                <div className="brandSub">Store 6909</div>
              </div>
          </div>
        </div>
        <div className="navGlow" />
      </div>

      <main className="container">
        <div className="hero">
          <h1 className="title">Leaderboard</h1>
          <p className="subtitle">
            Trailing 21 days · Reviews & Rewards near real-time · BADA & Promos weekly · Last refresh: Sun 2/8
          </p>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Leaderboard</div>
              <div className="cardSub">.</div>
            </div>
            <button
              className="iconBtn"
              onClick={() => setInfoOpen(true)}
              aria-label="Open scoring info"
            >
              ?
            </button>
          </div>

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
        </div>
      </main>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
