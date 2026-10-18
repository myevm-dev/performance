type ChangelogModalProps = {
  open: boolean
  onClose: () => void
}

export default function ChangelogModal({
  open,
  onClose,
}: ChangelogModalProps) {
  if (!open) return null

  return (
    <div className="modalOverlay" onClick={onClose} role="presentation">
      <div
        className="modalCard"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 560 }}
      >
        <div className="modalHeader">
          <div />

          <div className="modalHeaderCenter">
            <div className="modalTitle">Changelog</div>
            <div className="modalSub">Version v1.4.3</div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="panel">
            <div className="panelTitle">v1.4.3</div>
            <div className="hint" style={{ marginTop: 10 }}>
              Moved 3 percentage points each from reviews and rewards to BADA.
              The score now allocates 57% to BADA, 31% to reviews, and 12% to
              rewards, worth 570, 310, and 120 points when each target is met.
            </div>
          </div>
          <div className="panel">
            <div className="panelTitle">v1.4.2</div>
            <div className="hint" style={{ marginTop: 10 }}>
              Moved 5 percentage points from Google reviews to BADA. The score
              now allocates 51% to BADA, 34% to reviews, and 15% to rewards,
              worth 510, 340, and 150 points when each target is met.
            </div>
          </div>
          <div className="panel">
            <div className="panelTitle">v1.4.1</div>
            <div className="hint" style={{ marginTop: 10 }}>
              Increased promo/void score deductions by 20%, raising the penalty
              multiplier from 0.15 to 0.18. The deductions are now 9, 18, 31.5,
              and 45 points across the existing penalty tiers.
            </div>
          </div>
          <div className="panel">
            <div className="panelTitle">v1.4.0</div>
            <div className="hint" style={{ marginTop: 10 }}>
              Added a Stats column showing 1 review and 1 reward per dollar
              amount in sales, using the same sales and counts as the score.
              Lower sales per review or reward means a stronger engagement rate.
              Zero counts and unavailable sales are labeled explicitly.
              The scoring formula and targets are unchanged.
            </div>
          </div>
          <div className="panel">
            <div className="panelTitle">v1.3.2</div>
            <div className="hint" style={{ marginTop: 10 }}>
              Restored sales-based engagement targets: 1 review per $500 in sales
              and 1 rewards signup per $800 in sales, replacing fixed targets of
              25 reviews and 10 rewards. Meeting the targets earns 390 and 150
              points respectively. With zero or unavailable sales, engagement
              points are zero. BADA and promo/void scoring are unchanged.
            </div>
          </div>
          <div className="panel">
            <div className="panelTitle">v1.3.1</div>

            <div className="hint" style={{ marginTop: 10 }}>
              BADA target was increased from 130% to 140%.
            </div>

            <div className="hint" style={{ marginTop: 10 }}>
              This means the BADA portion of the score is now scaled against a higher
              performance target. Servers at 140% BADA receive the full BADA score
              allocation. Servers below 140% receive a proportional amount, and servers
              above 140% can earn additional BADA points.
            </div>

            <div className="hint" style={{ marginTop: 10 }}>
              The leaderboard color threshold was also updated so BADA under 140% shows
              red, while 140% and above shows green.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}