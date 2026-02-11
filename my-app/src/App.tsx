// src/App.tsx
import { useMemo, useState } from "react"
import "./App.css"
import { mockServers } from "./data/updateBADA"
import { calculateScore } from "./lib/score"

function InfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="modalOverlay" onClick={onClose} role="presentation">
      <div className="modalCard" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modalHeader">
          <div /> {/* left spacer */}

          <div className="modalHeaderCenter">
            <div className="modalTitle">How scoring works</div>
            <div className="modalSub">
              Rolling 21-day performance · Updated weekly
            </div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="sectionTitle">Equation v1.0.0</div>
            <div className="codeBlock">
              Score = (460 × (BADA% ÷ 135)) + (390 × (Reviews ÷ (Sales ÷ 500))) + (150 × (Rewards ÷ (Sales ÷ 800))) − (PromoPenalty × 0.15)

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
              BADA, Reviews, and Rewards are weighted 46% / 39% / 15% of the total score.
              BADA is scaled against 135%.
              Reviews are expected at 1 per $500 in sales.
              Rewards are expected at 1 per $800 in sales.
            </div>

            <div className="hint" style={{ marginTop: "10px" }}>
              Because review and reward expectations scale with sales, opportunity is proportional to volume.
              Higher performance relative to your sales increases your score.
              There are no caps.
            </div>


            </div>

            <div className="panel">
              <div className="panelTitle">Promo/Void penalty</div>
              <div className="hint">
                Promos/voids are evaluated as % of sales and subtract points if over standard.
              </div>

              <div className="penaltyTable">
                <div className="penRow">
                  <span>≤ 0.20%</span>
                  <span>0</span>
                </div>
                <div className="penRow">
                  <span>0.21–0.30%</span>
                  <span>−50</span>
                </div>
                <div className="penRow">
                  <span>0.31–0.50%</span>
                  <span>−100</span>
                </div>
                <div className="penRow">
                  <span>0.51–0.75%</span>
                  <span>−175</span>
                </div>
                <div className="penRow">
                  <span>&gt; 0.75%</span>
                  <span>−250</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sectionTitle">How to win</div>
          <div className="pillRow">
            <span className="pill">Push BADA</span>
            <span className="pill">Ask for reviews</span>
            <span className="pill">Enroll rewards</span>
            <span className="pill">Control promos</span>
          </div>
        </div>



        
      </div>
    </div>
  )
}

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false)

  const leaderboard = useMemo(() => {
    return mockServers
      .map((server) => ({
        ...server,
        score: calculateScore(server),
        promoRate: server.sales > 0 ? server.promoDollars / server.sales : 0,
      }))
      .sort((a, b) => b.score - a.score)
  }, [])

  return (
    <div className="appBg">
      <div className="nav">
        <div className="navInner">
          <div className="brand">
            <span className="brandMark" />
            <div className="brandText">
              <div className="brandTitle">Performance</div>
              <div className="brandSub">Server Leaderboard</div>
            </div>
          </div>


        </div>
        <div className="navGlow" />
      </div>

      <main className="container">
        <div className="hero">
          <h1 className="title">Server Performance Leaderboard</h1>
            <p className="subtitle">
              Trailing 21 days · Last refresh: Sun 2/8 · BADA & Promos weekly · Reviews & Rewards near real-time
            </p>

        </div>


        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Leaderboard</div>
              <div className="cardSub">Highest score wins the period</div>
            </div>
            <button className="iconBtn" onClick={() => setInfoOpen(true)} aria-label="Open scoring info">
              ?
            </button>
          </div>

          <div className="tableWrap" aria-label="Leaderboard table scroll area">

            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Rank</th>

                  {/* ✅ ADD THIS WIDTH */}
                  <th style={{ width: 120 }}>Server</th>

                  <th
                    className="scoreHeader"
                    style={{ width: 120, textAlign: "right" }}
                  >
                    Score
                    <span className="scrollHint" aria-hidden>› › ›</span>
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
            Tip: Click <span className="mono">Scoring</span> in the top bar to see the exact equation.
          </div>
        </div>
      </main>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
