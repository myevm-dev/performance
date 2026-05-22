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
            <div className="modalSub">Scoring v1.3.1</div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
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