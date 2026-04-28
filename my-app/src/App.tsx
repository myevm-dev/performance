// src/App.tsx
import { useEffect, useMemo, useState } from "react"
import "./App.css"
import { calculateScore } from "./lib/score"
import { fetchStaffCountsLast21Days } from "./lib/events"
import ServerClicksModal from "./components/ServerClicksModal"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "./lib/firebase"
import { stores as localStores } from "./data/stores"
import ServerProfilePage from "./pages/ServerProfilePage"

const PROMO_WEIGHT = 0.15

type ServerStats = {
  id: string
  code: string
  legacyid?: string | null
  name: string
  sales: number
  badaPercent: number
  reviews: number
  rewards: number
  promoDollars: number
}

type StoreOption = {
  id: string
  storeNumber: string
  label: string
}

type ViewMode = "store" | "league"

// add near your other helper functions, above App()

function getPromoPenaltyBase(promoRate: number) {
  if (promoRate > 0.75 / 100) return 250
  if (promoRate > 0.5 / 100) return 175
  if (promoRate > 0.3 / 100) return 100
  if (promoRate > 0.2 / 100) return 50
  return 0
}

function ScoreBreakdownModal({
  open,
  onClose,
  server,
}: {
  open: boolean
  onClose: () => void
  server: {
    name: string
    badaPercent: number
    reviews: number
    rewards: number
    promoDollars: number
    sales: number
    score: number
  } | null
}) {
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

function getPromoPenaltyColor(promoRate: number) {
  if (promoRate <= 0.002) return "rgba(105, 213, 118, 0.92)" // <= 0.20%
  if (promoRate <= 0.003) return "#fca5a5" // 0.21–0.30%
  if (promoRate <= 0.005) return "#f87171" // 0.31–0.50%
  if (promoRate <= 0.0075) return "#ef4444" // 0.51–0.75%
  return "#b91c1c" // > 0.75%
}

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
          <div />

          <div className="modalHeaderCenter">
            <div className="modalTitle">How scoring works</div>
            <div className="modalSub">Scoring v1.2.1</div>
          </div>

          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="codeBlock">
            Score = (460 × (BADA% ÷ 130)) + (390 × (Reviews ÷ (Sales ÷ 500))) + (150 × (Rewards ÷
            (Sales ÷ 800))) − (PromoPenalty × {PROMO_WEIGHT})
          </div>

          <div className="grid2">
            <div className="panel">
              <div className="panelTitle">How the score is weighted</div>
              <br/>

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
              <br/>

              <div className="hint">
                BADA, Reviews, and Rewards are weighted 46% / 39% / 15% of the total score. BADA is
                scaled against 130%. Reviews are expected at 1 per $500 in sales. Rewards are
                expected at 1 per $800 in sales.
              </div>

              <div className="hint" style={{ marginTop: "10px" }}>
                We mapped review, reward, and promo expectations to sales, so opportunity is
                proportional to sales volume to account for varience in business or quantity of shifts.
              </div>
            </div>

            <div className="panel">
              <div className="panelTitle">Promo/Void penalty</div>
              <div className="hint">
                Promos/voids are evaluated as % of sales. The tier below shows the base penalty, and
                the actual score deduction is weighted at {(PROMO_WEIGHT * 100).toFixed(0)}%.
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
              not count toward your totals. This ensures accurate performance tracking and protects the integrity of the leaderboard.

            </div>
            <div className="panelTitle">Want More Data?</div>

            <div className="hint">
              Dive deeper into performance by clicking on any server’s name or individual metric. You’ll unlock detailed breakdowns, trends, and insights that help you understand exactly what’s driving results. Keep an eye out for achievements, personal bests, and category‑specific competitions. The system is always tracking new milestones and highlighting standout performance.            </div>

          

          </div>

        </div>
      </div>
    </div>
  )
}

function LeagueComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          padding: 18,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
          overflow: "hidden",
          position: "relative",
        }}
      >
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

        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.20)",
            overflow: "hidden",
          }}
        >
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              alignItems: "center",
              padding: 14,
              gap: 12,
            }}
          >
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
                <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.9 }}>Awaiting Store</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, letterSpacing: 0.4 }}>
                AWAY
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.9 }}>Awaiting Store</div>
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

function HomeStoreModal({
  open,
  stores,
  search,
  setSearch,
  selectedStore,
  setSelectedStore,
  onConfirm,
}: {
  open: boolean
  stores: StoreOption[]
  search: string
  setSearch: (value: string) => void
  selectedStore: string
  setSelectedStore: (value: string) => void
  onConfirm: () => void
}) {
  if (!open) return null

  const query = search.toLowerCase().trim()

  const filtered =
    query.length === 0
      ? []
      : stores
          .filter((store) => {
            return (
              store.storeNumber.toLowerCase().includes(query) ||
              store.label.toLowerCase().includes(query)
            )
          })
          .slice(0, 8)

  return (
    <div className="modalOverlay" role="presentation">
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 560 }}
      >
        <div className="modalHeader">
          <div />
          <div className="modalHeaderCenter">
            <div className="modalTitle">Choose your home store</div>
            <div className="modalSub">You can change this later</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div className="modalBody">
          <div className="panel">
            <div className="panelTitle">Search stores</div>

            <div style={{ position: "relative", marginTop: 12 }}>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedStore("")
                }}
                placeholder="Search by name or store number"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  outline: "none",
                }}
              />

              {filtered.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(10,10,16,0.98)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                    overflow: "hidden",
                  }}
                >
                  {filtered.map((store, idx) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        setSelectedStore(store.storeNumber)
                        setSearch(`${store.label} (#${store.storeNumber})`)
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 14px",
                        border: "none",
                        borderBottom:
                          idx === filtered.length - 1
                            ? "none"
                            : "1px solid rgba(255,255,255,0.06)",
                        background: "transparent",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{store.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.72 }}>
                        #{store.storeNumber}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStore && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  Selected store
                </div>
                <div style={{ fontWeight: 500, color: "cyan", }}>{search}</div>
              </div>
            )}

            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedStore}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: selectedStore
                  ? "linear-gradient(90deg, rgba(253,1,245,0.22), rgba(1,252,252,0.18))"
                  : "rgba(255,255,255,0.08)",
                color: "white",
                fontWeight: 800,
                cursor: selectedStore ? "pointer" : "not-allowed",
                opacity: selectedStore ? 1 : 0.6,
              }}
            >
              Save Home Store
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [mode, setMode] = useState<ViewMode>("store")
  const [clicksOpen, setClicksOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedStaffName, setSelectedStaffName] = useState("")
  const [storesList, setStoresList] = useState<StoreOption[]>([])
  const [homeStore, setHomeStore] = useState<string>(() => localStorage.getItem("homeStore") ?? "")
  const [storePickerOpen, setStorePickerOpen] = useState(() => !localStorage.getItem("homeStore"))
  const [storeSearch, setStoreSearch] = useState("")
  const [selectedStore, setSelectedStore] = useState<string>(() => localStorage.getItem("homeStore") ?? "")
  const [scoreOpen, setScoreOpen] = useState(false)
  const [selectedScoreServer, setSelectedScoreServer] = useState<{
    name: string
    badaPercent: number
    reviews: number
    rewards: number
    promoDollars: number
    sales: number
    score: number
  } | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null)

  const [countsByStaff, setCountsByStaff] = useState<Record<string, { reviews: number; rewards: number }>>(
    {}
  )
  const [servers, setServers] = useState<ServerStats[]>([])
  const activeStore = homeStore || "6909"

const activeStoreName =
  localStores.find((s) => s.storeNumber === activeStore)?.name ??
  `Store ${activeStore}`

const handleSaveHomeStore = () => {
  if (!selectedStore) return
  localStorage.setItem("homeStore", selectedStore)
  setHomeStore(selectedStore)
  setStorePickerOpen(false)
}

  useEffect(() => {
  let alive = true

  ;(async () => {
  try {
    const counts = await fetchStaffCountsLast21Days(activeStore)

    const staffSnap = await getDocs(
      query(collection(db, "staffUsers"), where("storeNumber", "==", activeStore))
    )

    const liveStaff = staffSnap.docs.map((docSnap) => {
      const data = docSnap.data() as {
        code?: string
        name?: string
        legacyid?: string | null
      }

      return {
        code: data.code ?? docSnap.id,
        name: data.name ?? "Unnamed",
        legacyid: data.legacyid ?? null,
      }
    })

    const badaSnap = await getDocs(
      query(
        collection(db, "stores", activeStore, "badaPublishedWeeks"),
        orderBy("weekStart", "desc"),
        limit(3)
      )
    )

    const badaAgg = new Map<
      string,
      { badaSum: number; count: number; sales: number; promos: number }
    >()

    badaSnap.docs.forEach((doc) => {
      const data = doc.data() as {
        rows?: Array<{
          code?: string
          sales?: number
          badaPercent?: number
          promosVoidsSum?: number
        }>
      }

      ;(data.rows ?? []).forEach((row) => {
        if (!row.code) return

        const key = String(row.code)

        const existing = badaAgg.get(key) ?? {
          badaSum: 0,
          count: 0,
          sales: 0,
          promos: 0,
        }

        existing.badaSum += Number(row.badaPercent ?? 0)
        existing.count += 1
        existing.sales += Number(row.sales ?? 0)
        existing.promos += Number(row.promosVoidsSum ?? 0)

        badaAgg.set(key, existing)
      })
    })

    const rows: ServerStats[] = liveStaff.map((staff) => {
      const bada = badaAgg.get(staff.code)

      const directCounts = counts[staff.code] ?? { reviews: 0, rewards: 0 }
      const legacyCounts = staff.legacyid
        ? counts[staff.legacyid] ?? { reviews: 0, rewards: 0 }
        : { reviews: 0, rewards: 0 }

      return {
        id: staff.code,
        code: staff.code,
        legacyid: staff.legacyid,
        name: staff.name,

        badaPercent: bada && bada.count > 0 ? bada.badaSum / bada.count : 0,
        sales: bada?.sales ?? 0,
        promoDollars: bada?.promos ?? 0,

        reviews: directCounts.reviews + legacyCounts.reviews,
        rewards: directCounts.rewards + legacyCounts.rewards,
      }
    })

    if (alive) setServers(rows)
  } catch (err) {
    console.error("Failed to load leaderboard data:", err)
  }
})()

  return () => {
    alive = false
  }
}, [activeStore])
      


  useEffect(() => {
  let alive = true

  ;(async () => {
    try {
      const snap = await getDocs(collection(db, "stores"))

      const rows: StoreOption[] = snap.docs
        .map((docSnap) => {
          const data = docSnap.data() as {
            storeNumber?: string
          }

          const storeNumber = String(data.storeNumber ?? docSnap.id)

          const localMatch = localStores.find(
            (s) => s.storeNumber === storeNumber
          )

          return {
            id: docSnap.id,
            storeNumber,
            label: localMatch?.name ?? `Store ${storeNumber}`,
          }
        })
        .sort((a, b) => a.storeNumber.localeCompare(b.storeNumber))

      if (alive) setStoresList(rows)
    } catch (err) {
      console.error("Failed to load stores:", err)
    }
  })()

  return () => {
    alive = false
  }
}, [])


  const leaderboard = useMemo(() => {
    return servers
      .map((server) => ({
        ...server,
        score: calculateScore(server),
        promoRate:
          server.sales > 0 ? server.promoDollars / server.sales : 0,
      }))
      .sort((a, b) => b.score - a.score)
  }, [servers])

  return (
    <div className="appBg">
      <div className="nav">
        <div className="navInner">
   
        </div>
        <div className="navGlow" />
      </div>

      <main className="container">
        <div className="hero">
          <h1 className="title">Server Leaderboard V2 Coming Soon</h1>

          <div
            style={{
              marginTop: 6,
              fontSize: 20,
              color: "cyan",
              fontWeight: 700,
              opacity: 0.75,
              letterSpacing: 0.3,
            }}
          >
            {activeStoreName}
          </div>
          <p className="subtitle">
            Trailing 21 days · Reviews & Rewards near real-time · BADA & Promos weekly · Last BADA refresh:
            Friday 4/2
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
                    Team {activeStore}
                  </button>

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
                    League Preview
                  </button>
                </div>
              </div>

            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="iconBtn"
                onClick={() => {
                  setSelectedStore(activeStore)
                  setStoreSearch("")
                  setStorePickerOpen(true)
                }}
                aria-label="Change store"
                title="Change store"
              >
                ⇄
              </button>

              <button
                className="iconBtn"
                onClick={() => setInfoOpen(true)}
                aria-label="Open scoring info"
                title="Scoring info"
              >
                ?
              </button>
            </div>
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
                      
                      </th>
                      <th style={{ width: 120, textAlign: "right" }}>BADA %</th>
                      <th style={{ width: 110, textAlign: "right" }}>Reviews</th>
                      <th style={{ width: 110, textAlign: "right" }}>Rewards</th>
                      <th style={{ width: 140, textAlign: "right" }}>Promos/Voids ($)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaderboard.map((s, idx) => {
                      const top = idx === 0
                      const second = idx === 1
                      const third = idx === 2
                      const rowClass = top ? "rowTop" : second ? "rowSecond" : third ? "rowThird" : ""

                      return (
                        <tr
                          key={s.id}
                          className={rowClass}
                          onClick={() => {
                            setSelectedProfile({
                              id: s.id,
                              name: s.name,
                              storeNumber: activeStore,
                              storeName: activeStoreName,
                              score: s.score,
                              badaPercent: s.badaPercent,
                              reviews: s.reviews,
                              rewards: s.rewards,
                              promoDollars: s.promoDollars,
                              sales: s.sales,
                              promoRate: s.promoRate,
                              avatarSeed: s.id,
                            })
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="rankPill">{idx + 1}</div>
                          </td>

                          <td>
                            <div className="nameCell">
                              <div>
                                <div className="clickableName">
                                  {s.name}
                                </div>
                                <div className="meta">Promo {(s.promoRate * 100).toFixed(2)}%</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <span className="score" style={{ textDecoration: "underline dotted" }}>
                              {s.score}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <span
                              style={{
                                color: s.badaPercent >= 130 ? "#22c55e" : "#ef4444",
                                fontWeight: 700,
                              }}
                            >
                              {Number(s.badaPercent.toFixed(1))}%
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>{s.reviews}</td>
                          <td style={{ textAlign: "right" }}>{s.rewards}</td>
                          <td style={{ textAlign: "right", color: getPromoPenaltyColor(s.promoRate), fontWeight: 800 }}>
                            ${s.promoDollars}
                          </td>
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

      {/* ✅ Render the modal once, outside the table */}
      <ServerClicksModal
        open={clicksOpen}
        onClose={() => setClicksOpen(false)}
        storeNumber={activeStore}
        staffId={selectedStaffId}
        staffName={selectedStaffName}
      />
      <HomeStoreModal
        open={storePickerOpen}
        stores={storesList}
        search={storeSearch}
        setSearch={setStoreSearch}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        onConfirm={handleSaveHomeStore}
      />
      <ScoreBreakdownModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        server={selectedScoreServer}
      />
    </div>
  )
}
