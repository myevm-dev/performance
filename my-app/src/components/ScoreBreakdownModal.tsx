const PROMO_WEIGHT = 0.15

function getPromoPenaltyBase(promoRate: number) {
  if (promoRate > 0.75 / 100) return 250
  if (promoRate > 0.5 / 100) return 175
  if (promoRate > 0.3 / 100) return 100
  if (promoRate > 0.2 / 100) return 50
  return 0
}

type ScoreBreakdownServer = {
  name: string
  badaPercent: number
  reviews: number
  rewards: number
  promoDollars: number
  sales: number
  score: number
}

type ScoreBreakdownModalProps = {
  open: boolean
  onClose: () => void
  server: ScoreBreakdownServer | null
  getPromoPenaltyColor: (promoRate: number) => string
}

export default function ScoreBreakdownModal({
  open,
  onClose,
  server,
  getPromoPenaltyColor,
}: ScoreBreakdownModalProps) {
  if (!open || !server) return null

  const badaPoints = 460 * (server.badaPercent / 130)
  const reviewPoints = 390 * (server.reviews / 25)
  const rewardPoints = 150 * (server.rewards / 10)
  const promoRate = server.sales > 0 ? server.promoDollars / server.sales : 0
  const promoPenaltyBase = getPromoPenaltyBase(promoRate)
  const weightedPromoPenalty = promoPenaltyBase * PROMO_WEIGHT

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
            <div className="modalTitle">{server.name} Score Breakdown</div>
            <div className="modalSub">How this score was calculated</div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="codeBlock">
            Score = (460 × (BADA% ÷ 130)) + (390 × (Reviews ÷ 25)) + (150 × (Rewards ÷ 10)) − (PromoPenalty × {PROMO_WEIGHT})
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panelTitle">Inputs</div>

            <div className="penaltyTable" style={{ marginTop: 12 }}>
              <div className="penRow">
                <span>BADA %</span>
                <span>{server.badaPercent}%</span>
              </div>
              <div className="penRow">
                <span>Reviews</span>
                <span>{server.reviews}</span>
              </div>
              <div className="penRow">
                <span>Rewards</span>
                <span>{server.rewards}</span>
              </div>
              <div className="penRow">
                <span>Promo/Void $</span>
                <span>${server.promoDollars}</span>
              </div>
              <div className="penRow">
                <span>Sales</span>
                <span>${server.sales}</span>
              </div>
              <div className="penRow">
                <span>Promo Rate</span>
                <span>{(promoRate * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panelTitle">Calculation</div>

            <div className="penaltyTable" style={{ marginTop: 12 }}>
              <div className="penRow">
                <span>460 × ({server.badaPercent} ÷ 130)</span>
                <span>{badaPoints.toFixed(2)}</span>
              </div>
              <div className="penRow">
                <span>390 × ({server.reviews} ÷ 25)</span>
                <span>{reviewPoints.toFixed(2)}</span>
              </div>
              <div className="penRow">
                <span>150 × ({server.rewards} ÷ 10)</span>
                <span>{rewardPoints.toFixed(2)}</span>
              </div>
              <div className="penRow" style={{ color: getPromoPenaltyColor(promoRate) }}>
                <span>{promoPenaltyBase} × {PROMO_WEIGHT}</span>
                <span>-{weightedPromoPenalty.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panelTitle">Final Score</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 32,
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              {server.score}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}