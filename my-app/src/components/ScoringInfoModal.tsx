import { PROMO_WEIGHT } from "../lib/score"

type ScoringInfoModalProps = {
  open: boolean
  onClose: () => void
  onOpenChangelog: () => void
}

export default function ScoringInfoModal({
  open,
  onClose,
  onOpenChangelog,
}: ScoringInfoModalProps) {
  if (!open) return null

  const weighted = (base: number) => (base * PROMO_WEIGHT).toFixed(2)

  return (
    <div className="modalOverlay" onClick={onClose} role="presentation">
      <div
        className="modalCard"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <div />

          <div className="modalHeaderCenter">
            <div className="modalTitle">How scoring works</div>
            <button
              type="button"
              className="modalSub"
              onClick={onOpenChangelog}
              title="View changelog"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                textDecoration: "underline dotted",
              }}
            >
              Scoring v1.4.3
            </button>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="codeBlock">
            Score = (570 × (BADA% ÷ 140)) + (310 × (Reviews ÷ (Sales ÷ 500))) + (120 × (Rewards ÷ (Sales ÷ 800))) − (PromoPenalty × {PROMO_WEIGHT})
          </div>

          <div className="grid2">
            <div className="panel">
              <div className="panelTitle">How the score is weighted</div>
              <br />

              <ul className="list">
                <li>
                  <b>BADA:</b> 57% of the score
                </li>
                <li>
                  <b>Reviews:</b> 31% of the score
                </li>
                <li>
                  <b>Rewards:</b> 12% of the score
                </li>
              </ul>
              <br />

              <div className="hint">
                BADA, Reviews, and Rewards are weighted 57% / 31% / 12% of the total score.
                BADA is scaled against a 140% target. A server at 140% BADA earns the full BADA
                portion of the score. A server above 140% can earn extra BADA points, while a
                server below 140% earns a proportional amount.
              </div>

              <div className="hint" style={{ marginTop: "10px" }}>
                Reviews are scaled against a target of 1 review per $500 in sales, and Rewards
                against 1 signup per $800 in sales. Meeting these targets earns 310 review
                points and 120 reward points. Reviews and rewards earn zero points when sales
                are zero or unavailable.
              </div>

              <div className="hint" style={{ marginTop: "10px" }}>
                Promo and void activity is evaluated as a percentage of sales. Higher promo/void
                rates reduce the final score so the leaderboard rewards both sales performance
                and clean order accuracy.
              </div>
            </div>

            <div className="panel">
              <div className="panelTitle">Promo/Void penalty</div>
              <div className="hint">
                Promos/voids are evaluated as % of sales. The tier below shows the base penalty,
                and the actual score deduction is weighted at {(PROMO_WEIGHT * 100).toFixed(0)}%.
              </div>

              <div className="penaltyTable">
                <div className="penRow" style={{ color: "rgba(105, 213, 118, 0.92)" }}>
                  <span>≤ 0.20% of sales</span>
                  <span>0</span>
                </div>

                <div className="penRow" style={{ color: "#fca5a5" }}>
                  <span>0.21–0.30%</span>
                  <span>−50 (−{weighted(50)} pts)</span>
                </div>

                <div className="penRow" style={{ color: "#f87171" }}>
                  <span>0.31–0.50%</span>
                  <span>−100 (−{weighted(100)} pts)</span>
                </div>

                <div className="penRow" style={{ color: "#ef4444" }}>
                  <span>0.51–0.75%</span>
                  <span>−175 (−{weighted(175)} pts)</span>
                </div>

                <div className="penRow" style={{ color: "#b91c1c" }}>
                  <span>&gt; 0.75%</span>
                  <span>−250 (−{weighted(250)} pts)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pillRow">
            <span className="pill">Use your QR codes</span>
            <span className="pill">Suggestive sell</span>
            <span className="pill">Ask for reviews</span>
            <span className="pill">Offer rewards</span>
            <span className="pill">Double check when ringing in orders</span>
          </div>

          <div className="panel" style={{ marginTop: 18 }}>
            <div className="panelTitle">Missing Customer Clicks?</div>

            <div className="hint">
              If your Reviews or Rewards feel lower than expected, make sure you are actively using
              your personal QR code and encouraging guests to scan it before they leave.
            </div>

            <div className="hint" style={{ marginTop: 10 }}>
              Click tracking uses device ID verification to maintain fairness and prevent abuse.
              Multiple submissions from the same device are subject to cooldown limits and may
              not count toward your totals. This ensures accurate performance tracking and protects
              the integrity of the leaderboard.
            </div>

            <div className="panelTitle" style={{ marginTop: 16 }}>
              Want More Data?
            </div>

            <div className="hint">
              Dive deeper into performance by clicking on any server’s name or individual metric.
              You’ll unlock detailed breakdowns, trends, and insights that help you understand
              exactly what’s driving results. Keep an eye out for achievements, personal bests,
              and category-specific competitions. The system is always tracking new milestones
              and highlighting standout performance.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}