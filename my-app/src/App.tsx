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
import { Routes, Route, useNavigate, useParams } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import LeagueComingSoon from "./components/LeagueComingSoon"
import HomeStoreModal from "./components/HomeStoreModal"
import ScoreBreakdownModal from "./components/ScoreBreakdownModal"

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


function getPromoPenaltyColor(promoRate: number) {
  if (promoRate <= 0.002) return "rgba(105, 213, 118, 0.92)" // <= 0.20%
  if (promoRate <= 0.003) return "#fca5a5" // 0.21–0.30%
  if (promoRate <= 0.005) return "#f87171" // 0.31–0.50%
  if (promoRate <= 0.0075) return "#ef4444" // 0.51–0.75%
  return "#b91c1c" // > 0.75%
}
  function InfoModal({
    open,
    onClose,
    onOpenChangelog,
  }: {
    open: boolean
    onClose: () => void
    onOpenChangelog: () => void
  }) {
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
            Scoring v1.3.1
          </button>
        </div>

        <button className="iconBtn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="modalBody">
        <div className="codeBlock">
          Score = (460 × (BADA% ÷ 140)) + (390 × (Reviews ÷ 25)) + (150 × (Rewards ÷ 10)) − (PromoPenalty × {PROMO_WEIGHT})
        </div>

        <div className="grid2">
          <div className="panel">
            <div className="panelTitle">How the score is weighted</div>
            <br />

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
            <br />

            <div className="hint">
              BADA, Reviews, and Rewards are weighted 46% / 39% / 15% of the total score.
              BADA is scaled against a 140% target. A server at 140% BADA earns the full BADA
              portion of the score. A server above 140% can earn extra BADA points, while a
              server below 140% earns a proportional amount.
            </div>

            <div className="hint" style={{ marginTop: "10px" }}>
              Reviews are scaled against a target of 25 reviews, and Rewards are scaled against
              a target of 10 rewards. This keeps the leaderboard simple while still rewarding
              servers who drive guest engagement beyond BADA performance.
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




function ServerProfileRoute() {
  const { staffCode } = useParams()
  const navigate = useNavigate()

  const [server, setServer] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function loadServerProfile() {
      if (!staffCode) {
        setLoading(false)
        return
      }

      try {
        const staffSnap = await getDocs(
          query(collection(db, "staffUsers"), where("code", "==", staffCode))
        )

        if (staffSnap.empty) {
          if (alive) setServer(null)
          return
        }

        const staffDoc = staffSnap.docs[0]
        const staffData = staffDoc.data() as {
          code?: string
          name?: string
          legacyid?: string | null
          storeNumber?: string
        }

        const storeNumber = String(staffData.storeNumber ?? "")
        const storeName =
          localStores.find((store) => store.storeNumber === storeNumber)?.name ??
          `Store ${storeNumber}`

        const counts = await fetchStaffCountsLast21Days(storeNumber)

        const directCounts = counts[String(staffData.code ?? staffDoc.id)] ?? {
          reviews: 0,
          rewards: 0,
        }

        const legacyCounts = staffData.legacyid
          ? counts[String(staffData.legacyid)] ?? { reviews: 0, rewards: 0 }
          : { reviews: 0, rewards: 0 }

        const badaSnap = await getDocs(
          query(
            collection(db, "stores", storeNumber, "badaPublishedWeeks"),
            orderBy("weekStart", "desc"),
            limit(3)
          )
        )

        let badaSum = 0
        let badaCount = 0
        let sales = 0
        let promoDollars = 0

        const badaWeeks: Array<{
          weekLabel: string
          badaPercent: number | null
        }> = []

        badaSnap.docs.forEach((docSnap) => {
          const data = docSnap.data() as {
            weekStart?: any
            rows?: Array<{
              code?: string
              sales?: number
              badaPercent?: number
              promosVoidsSum?: number
            }>
          }

          const weekStartDate = data.weekStart?.toDate?.()

          const weekLabel = weekStartDate
            ? weekStartDate.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
              })
            : docSnap.id

          const serverRow = (data.rows ?? []).find(
            (row) => String(row.code) === String(staffData.code)
          )

          if (!serverRow) {
            badaWeeks.push({
              weekLabel,
              badaPercent: null,
            })
            return
          }

          const rowBada = Number(serverRow.badaPercent ?? 0)

          badaWeeks.push({
            weekLabel,
            badaPercent: rowBada,
          })

          badaSum += rowBada
          badaCount += 1
          sales += Number(serverRow.sales ?? 0)
          promoDollars += Number(serverRow.promosVoidsSum ?? 0)
        })
        const badaPercent = badaCount > 0 ? badaSum / badaCount : 0
        const reviews = directCounts.reviews + legacyCounts.reviews
        const rewards = directCounts.rewards + legacyCounts.rewards
        const promoRate = sales > 0 ? promoDollars / sales : 0

        const profileServer = {
          id: String(staffData.code ?? staffDoc.id),
          code: String(staffData.code ?? staffDoc.id),
          name: staffData.name ?? "Unnamed",
          
          storeNumber,
          storeName,
          score: calculateScore({
            sales,
            badaPercent,
            reviews,
            rewards,
            promoDollars,
          }),
          badaPercent,
          reviews,
          rewards,
          promoDollars,
          sales,
          promoRate,
          badaWeeks,
          avatarSeed: String(staffData.code ?? staffDoc.id),
        }

        if (alive) setServer(profileServer)
      } catch (error) {
        console.error("Failed to load public server profile:", error)
        if (alive) setServer(null)
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadServerProfile()

    return () => {
      alive = false
    }
  }, [staffCode])

  if (loading) {
    return <div className="appBg" style={{ color: "white", padding: 24 }}>Loading profile...</div>
  }

  if (!server) {
    return <div className="appBg" style={{ color: "white", padding: 24 }}>Profile not found</div>
  }

  return (
    <ServerProfilePage
      server={server}
      onBack={() => navigate("/")}
    />
  )
}

function ChangelogModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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

function LeaderboardApp() {
  const navigate = useNavigate()
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

  const [changelogOpen, setChangelogOpen] = useState(false)


  const [lastBadaRefresh, setLastBadaRefresh] = useState<string>("")


  const [servers, setServers] = useState<ServerStats[]>([])
  const activeStore = homeStore || "6909"

const activeStoreName =
  localStores.find((s) => s.storeNumber === activeStore)?.name ??
  `Store ${activeStore}`

const handlePrintLeaderboard = () => {
  window.print()
}

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

    const latestBadaSnap = await getDocs(
      query(
        collection(db, "stores", activeStore, "badaPublishedWeeks"),
        orderBy("publishedAt", "desc"),
        limit(1)
      )
    )

    if (alive) {
      const latestPublishedAt = latestBadaSnap.docs[0]?.data()?.publishedAt

      if (latestPublishedAt?.toDate) {
        setLastBadaRefresh(
          latestPublishedAt.toDate().toLocaleDateString("en-US", {
            weekday: "short",
            month: "numeric",
            day: "numeric",
          })
        )
      } else {
        setLastBadaRefresh("")
      }
    }

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
        <h1 className="title" style={{ fontSize: 28 }}>
          Leaderboard V2 Coming Soon
        </h1>
          <div
            style={{
              marginTop: 6,
              fontSize: 24,
              color: "cyan",
              fontWeight: 700,
              opacity: 0.75,
              letterSpacing: 0.3,
            }}
          >
            {activeStoreName}
          </div>
          <p className="subtitle">
            Trailing 21 days · Reviews & Rewards near real-time · BADA & Promos weekly · Last BADA refresh:{" "}
            {lastBadaRefresh || "Not published yet"}
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
                      opacity: 0.55, // 👈 faded again
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 12, opacity: 0.9 }}>
                      🔒
                    </span>
                    League
                  </button>
                </div>
              </div>

            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="iconBtn printBtn"
                onClick={handlePrintLeaderboard}
                aria-label="Print leaderboard"
                title="Print leaderboard"
              >
                ⎙
              </button>
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
              <div className="printLeaderboardHeader">
                <div>
                  <div className="printTitle">
                    Team {activeStore} · {activeStoreName}
                  </div>
                  <div className="printSub">
                    Scan to visit portal.daytadna.com
                  </div>
                </div>

                <div className="printQrBox">
                  <QRCodeSVG
                    value="https://portal.daytadna.com"
                    size={86}
                    level="M"
                    includeMargin
                  />
                </div>
              </div>

              <div className="tableWrap" aria-label="Leaderboard table scroll area">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Server</th>
                      <th className="scoreHeader" style={{ textAlign: "right" }}>
                        Score
                      </th>
                      <th style={{ textAlign: "right" }}>BADA %</th>
                      <th style={{ textAlign: "right" }}>Reviews</th>
                      <th style={{ textAlign: "right" }}>Rewards</th>
                      <th style={{ textAlign: "right" }}>Promos/Voids ($)</th>
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
                            setSelectedStaffId(s.id)
                            setSelectedStaffName(s.name)

                            setSelectedScoreServer({
                              name: s.name,
                              badaPercent: s.badaPercent,
                              reviews: s.reviews,
                              rewards: s.rewards,
                              promoDollars: s.promoDollars,
                              sales: s.sales,
                              score: s.score,
                            })

                          navigate(`/profile/${s.code}`)

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
                                color: s.badaPercent >= 140 ? "#22c55e" : "#ef4444",
                                fontWeight: 700,
                              }}
                            >
                              {Number(s.badaPercent.toFixed(1))}%
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>{s.reviews}</td>
                          <td style={{ textAlign: "right" }}>{s.rewards}</td>
                          <td style={{ textAlign: "right", color: getPromoPenaltyColor(s.promoRate), fontWeight: 800 }}>
                            ${s.promoDollars.toFixed(2)}
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

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onOpenChangelog={() => setChangelogOpen(true)}
      />
      <ChangelogModal
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
      />

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
        getPromoPenaltyColor={getPromoPenaltyColor}
      />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LeaderboardApp />} />
      <Route path="/profile/:staffCode" element={<ServerProfileRoute />} />
    </Routes>
  )
}