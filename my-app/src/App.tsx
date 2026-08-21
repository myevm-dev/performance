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

import Navbar from "./components/Navbar"
import HomeStoreModal from "./components/HomeStoreModal"
import ScoreBreakdownModal from "./components/ScoreBreakdownModal"
import ScoringInfoModal from "./components/ScoringInfoModal"
import ChangelogModal from "./components/ChangelogModal"
import BulletinBoardPage from "./pages/BulletinBoardPage"
import ContestPage from "./pages/ContestPage"
import ContestLeaderboardPage from "./pages/ContestLeaderboardPage"

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

type LeaderboardSearchResult =
  | {
      type: "store"
      id: string
      storeNumber: string
      label: string
      subLabel: string
    }
  | {
      type: "user"
      id: string
      code: string
      name: string
      storeNumber: string
      storeName: string
      subLabel: string
    }

type ThemeMode = "light" | "dark"
type LeaderboardView = "t21" | "donations" | "league"

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem("app_theme")
  return saved === "dark" || saved === "light" ? saved : "light"
}

function normalizeStoreNumber(value?: string | null) {
  if (!value) return ""
  return String(value).padStart(4, "0")
}

function getPromoPenaltyColor(promoRate: number) {
  if (promoRate <= 0.002) return "rgba(105, 213, 118, 0.92)"
  if (promoRate <= 0.003) return "#fca5a5"
  if (promoRate <= 0.005) return "#f87171"
  if (promoRate <= 0.0075) return "#ef4444"
  return "#b91c1c"
}

type ProfileRankServer = ServerStats & {
  storeNumber: string
  storeName: string
  score: number
  promoRate: number
  avatarSeed: string
}

async function loadRankServersForStore(storeNumber: string) {
  const storeName =
    localStores.find((store) => store.storeNumber === storeNumber)?.name ??
    `Store ${storeNumber}`

  const counts = await fetchStaffCountsLast21Days(storeNumber)

  const staffSnap = await getDocs(
    query(collection(db, "staffUsers"), where("storeNumber", "==", storeNumber))
  )

  const liveStaff = staffSnap.docs.map((docSnap) => {
    const data = docSnap.data() as {
      code?: string
      name?: string
      legacyid?: string | null
    }

    return {
      code: String(data.code ?? docSnap.id),
      name: data.name ?? "Unnamed",
      legacyid: data.legacyid ?? null,
    }
  })

  const badaSnap = await getDocs(
    query(
      collection(db, "stores", storeNumber, "badaPublishedWeeks"),
      orderBy("weekStart", "desc"),
      limit(3)
    )
  )

  const badaAgg = new Map<
    string,
    { badaSum: number; count: number; sales: number; promos: number }
  >()

  badaSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as {
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

  return liveStaff.map((staff) => {
    const bada = badaAgg.get(staff.code)

    const directCounts = counts[staff.code] ?? { reviews: 0, rewards: 0 }
    const legacyCounts = staff.legacyid
      ? counts[staff.legacyid] ?? { reviews: 0, rewards: 0 }
      : { reviews: 0, rewards: 0 }

    const row = {
      id: staff.code,
      code: staff.code,
      legacyid: staff.legacyid,
      name: staff.name,
      storeNumber,
      storeName,
      badaPercent: bada && bada.count > 0 ? bada.badaSum / bada.count : 0,
      sales: bada?.sales ?? 0,
      promoDollars: bada?.promos ?? 0,
      reviews: directCounts.reviews + legacyCounts.reviews,
      rewards: directCounts.rewards + legacyCounts.rewards,
      avatarSeed: staff.code,
    }

    const score = calculateScore(row)
    const promoRate = row.sales > 0 ? row.promoDollars / row.sales : 0

    return {
      ...row,
      score,
      promoRate,
    } satisfies ProfileRankServer
  })
}

function ServerProfileRoute({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const { staffCode } = useParams()
  const navigate = useNavigate()


  const [server, setServer] = useState<any | null>(null)
  const [profileServers, setProfileServers] = useState<ProfileRankServer[]>([])
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
            limit(12)
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

        const currentStoreMeta = localStores.find(
          (store) => store.storeNumber === storeNumber
        )

        const storeNumbersToRank = currentStoreMeta
          ? localStores
              .filter((store) => store.regionId === currentStoreMeta.regionId)
              .map((store) => store.storeNumber)
          : [storeNumber]

        const rankRowsNested = await Promise.all(
          storeNumbersToRank.map((storeNumber) =>
            loadRankServersForStore(storeNumber).catch((error) => {
              console.warn("Failed to load rank rows for store", storeNumber, error)
              return []
            })
          )
        )

        const rankRows = rankRowsNested.flat()

        if (alive) {
          setProfileServers(rankRows)
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
    return <div className="appBg loadingPage">Loading profile...</div>
  }

  if (!server) {
    return <div className="appBg loadingPage">Profile not found</div>
  }

  return (
    <div className="appBg">
      <Navbar
        activeStore={server.storeNumber || ""}
        theme={theme}
        setTheme={setTheme}
      />


      <ServerProfilePage
      server={server}
      servers={profileServers.length > 0 ? profileServers : [server]}
      onBack={() => navigate("/")}
    />
    </div>
  )
}

function ContestRoute({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const activeStore =
    localStorage.getItem("viewedStore") ??
    localStorage.getItem("homeStore") ??
    "6909"

  return (
    <div className="appBg">
      <Navbar activeStore={activeStore} theme={theme} setTheme={setTheme} />
      <ContestPage activeStore={activeStore} />
    </div>
  )
}

function LeaderboardApp({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const navigate = useNavigate()
  const { storeNumber: routeStoreNumber } = useParams()

  const [infoOpen, setInfoOpen] = useState(false)
  const [clicksOpen, setClicksOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedStaffName, setSelectedStaffName] = useState("")
  const [storesList, setStoresList] = useState<StoreOption[]>([])
  const [homeStore, setHomeStore] = useState<string>(() => localStorage.getItem("homeStore") ?? "")
  const [viewedStore, setViewedStore] = useState<string>(() => {
  const routeStore = normalizeStoreNumber(routeStoreNumber)

  if (routeStore) return routeStore

  return localStorage.getItem("homeStore") ?? ""
})
  const [storePickerOpen, setStorePickerOpen] = useState(() => !localStorage.getItem("homeStore"))
  const [storeSearch, setStoreSearch] = useState("")
  const [selectedStore, setSelectedStore] = useState<string>(() => localStorage.getItem("homeStore") ?? "")

  const [leaderboardSearch, setLeaderboardSearch] = useState("")
  const [leaderboardSearchFocused, setLeaderboardSearchFocused] = useState(false)
  const [staffSearchRows, setStaffSearchRows] = useState<
    Array<{
      id: string
      code: string
      name: string
      storeNumber: string
      storeName: string
    }>
  >([])

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
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>("t21")

  const activeStore = viewedStore || homeStore || "6909"
  useEffect(() => {
    if (!activeStore) return
    localStorage.setItem("viewedStore", activeStore)
  }, [activeStore])

  const activeStoreName =
    localStores.find((s) => s.storeNumber === activeStore)?.name ??
    storesList.find((s) => s.storeNumber === activeStore)?.label ??
    `Store ${activeStore}`

  const activeStoreLogo = getStoreLogoUrl(activeStore)

  useEffect(() => {
    const routeStore = normalizeStoreNumber(routeStoreNumber)

    if (!routeStore) return

    setViewedStore(routeStore)
    localStorage.setItem("viewedStore", routeStore)
  }, [routeStoreNumber])

  const isHomeStore = homeStore === activeStore

  const filteredLeaderboardResults = useMemo<LeaderboardSearchResult[]>(() => {
  const queryText = leaderboardSearch.toLowerCase().trim()

  if (!queryText) return []

  const storeResults: LeaderboardSearchResult[] = storesList
    .filter((store) => {
      return (
        store.storeNumber.toLowerCase().includes(queryText) ||
        store.label.toLowerCase().includes(queryText)
      )
    })
    .slice(0, 6)
    .map((store) => ({
      type: "store",
      id: store.id,
      storeNumber: store.storeNumber,
      label: store.label,
      subLabel: `Store #${store.storeNumber}`,
    }))

  const userResults: LeaderboardSearchResult[] = staffSearchRows
    .filter((staff) => {
      return (
        staff.name.toLowerCase().includes(queryText) ||
        staff.code.toLowerCase().includes(queryText) ||
        staff.storeNumber.toLowerCase().includes(queryText) ||
        staff.storeName.toLowerCase().includes(queryText)
      )
    })
    .slice(0, 8)
    .map((staff) => ({
      type: "user",
      id: staff.id,
      code: staff.code,
      name: staff.name,
      storeNumber: staff.storeNumber,
      storeName: staff.storeName,
      subLabel: `${staff.storeName} · #${staff.storeNumber}`,
    }))

  return [...storeResults, ...userResults].slice(0, 12)
}, [leaderboardSearch, storesList, staffSearchRows])

  const handlePrintLeaderboard = () => {
    window.print()
  }

  const handleSaveHomeStore = () => {
    if (!selectedStore) return

    localStorage.setItem("homeStore", selectedStore)
    setHomeStore(selectedStore)
    setViewedStore(selectedStore)
    setLeaderboardSearch("")
    setStorePickerOpen(false)
  }

  const handlePinCurrentStore = () => {
    localStorage.setItem("homeStore", activeStore)
    setHomeStore(activeStore)
  }

  const handleSelectLeaderboardStore = (store: StoreOption) => {
    setViewedStore(store.storeNumber)
    setLeaderboardSearch("")
    setLeaderboardSearchFocused(false)
  }

  const handleSelectLeaderboardUser = (user: Extract<LeaderboardSearchResult, { type: "user" }>) => {
    setLeaderboardSearch("")
    setLeaderboardSearchFocused(false)
    navigate(`/profile/${user.code}`)
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

        badaSnap.docs.forEach((docSnap) => {
          const data = docSnap.data() as {
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

  useEffect(() => {
  let alive = true

  ;(async () => {
    try {
      const snap = await getDocs(collection(db, "staffUsers"))

      const rows = snap.docs
        .map((docSnap) => {
          const data = docSnap.data() as {
            code?: string
            name?: string
            storeNumber?: string
          }

          const code = String(data.code ?? docSnap.id)
          const storeNumber = String(data.storeNumber ?? "")

          const storeName =
            localStores.find((store) => store.storeNumber === storeNumber)?.name ??
            `Store ${storeNumber}`

          return {
            id: docSnap.id,
            code,
            name: data.name ?? "Unnamed",
            storeNumber,
            storeName,
          }
        })
        .filter((row) => row.code && row.storeNumber)

      if (alive) setStaffSearchRows(rows)
    } catch (err) {
      console.error("Failed to load staff search rows:", err)
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
      <Navbar activeStore={activeStore} theme={theme} setTheme={setTheme} />

      <main className="container">
        <div className="hero">
          <h1 className="title" style={{ fontSize: 26 }}>
            Team Leaderboard
          </h1>

          <div
  className="heroStoreName"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  }}
>
  <img
    src={activeStoreLogo}
    alt={activeStoreName}
    style={{
      width: 86,
      height: 86,
      borderRadius: "999px",
      objectFit: "cover",
      border: "2px solid var(--stroke)",
      background: "var(--card)",
      boxShadow: "0 14px 32px rgba(0,0,0,0.18)",
    }}
    onError={(event) => {
      event.currentTarget.src =
        "https://www.daytadna.com/storelogos/Fallback.png"
    }}
  />

  <span>{activeStoreName}</span>
</div>

          <div className="heroViewToggle" role="tablist" aria-label="Leaderboard view">
            <button
              type="button"
              role="tab"
              aria-selected={leaderboardView === "t21"}
              className={`heroViewToggleButton ${leaderboardView === "t21" ? "active" : ""}`}
              onClick={() => setLeaderboardView("t21")}
            >
              Trailing 21 Day
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leaderboardView === "donations"}
              className={`heroViewToggleButton ${leaderboardView === "donations" ? "active" : ""}`}
              onClick={() => setLeaderboardView("donations")}
            >
              No Kid Hungry Donations
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leaderboardView === "league"}
              className={`heroViewToggleButton ${leaderboardView === "league" ? "active" : ""}`}
              onClick={() => setLeaderboardView("league")}
            >
              League Matchup
            </button>
          </div>

          <p className="subtitle">
            {leaderboardView === "t21" ? (
              <>
                Trailing 21 days · Reviews & Rewards near real-time. BADA & Promos weekly · Last BADA refresh:{" "}
                {lastBadaRefresh || "Not published yet"}
              </>
            ) : leaderboardView === "donations" ? (
              "Donation rankings are coming soon."
            ) : (
              "League matchups are coming soon."
            )}
          </p>
        </div>

        <div className={`card ${leaderboardView !== "t21" ? "dashboardViewHidden" : ""}`}>
          <div className="cardHeader leaderboardHeader">
            <div className="leaderboardHeaderActions leaderboardHeaderActionsLeft">
            

            <button
              className={`leaderboardHeaderAction ${isHomeStore ? "homePinnedBtn" : ""}`}
              onClick={handlePinCurrentStore}
              aria-label={
                isHomeStore
                  ? "This leaderboard is your home store"
                  : "Set this leaderboard as home store"
              }
              title={
                isHomeStore
                  ? "This is your home store"
                  : "Set this leaderboard as your home store"
              }
            >
              <span aria-hidden>⌂</span>
              <span>{isHomeStore ? "Home Store" : "Set Home"}</span>
            </button>

            <button
              className="leaderboardHeaderAction bulletinBtn"
              onClick={() => navigate("/bulletin")}
              aria-label="Open bulletin board"
              title="Bulletin board"
            >
              <span aria-hidden>▣</span>
              <span>Bulletin</span>
            </button>
            <button
              className="leaderboardHeaderAction printBtn"
              onClick={handlePrintLeaderboard}
              aria-label="Print leaderboard"
              title="Print leaderboard"
            >
              <span aria-hidden>⎙</span>
              <span>Print</span>
            </button>
          </div>

            <div className="leaderboardStoreSearchWrap">
              <input
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                onFocus={() => setLeaderboardSearchFocused(true)}
                placeholder="Search stores or servers"
                className="leaderboardStoreSearchInput"
              />

              {leaderboardSearchFocused && filteredLeaderboardResults.length > 0 ? (
                <div className="leaderboardStoreSearchResults">
                  {filteredLeaderboardResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()

                        if (result.type === "store") {
                          handleSelectLeaderboardStore({
                            id: result.id,
                            storeNumber: result.storeNumber,
                            label: result.label,
                          })
                        } else {
                          handleSelectLeaderboardUser(result)
                        }
                      }}
                      className="leaderboardStoreSearchResult"
                      style={{
                        borderBottom:
                          idx === filteredLeaderboardResults.length - 1
                            ? "none"
                            : "1px solid var(--stroke)",
                      }}
                    >
                      <span>
                        {result.type === "store" ? result.label : result.name}
                      </span>

                      <small>
                        {result.type === "store" ? result.subLabel : result.subLabel}
                      </small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="leaderboardHeaderActions leaderboardHeaderActionsRight">
              <button
                className="leaderboardHeaderAction"
                onClick={() => setLeaderboardSearchFocused(true)}
                aria-label="Search stores"
                title="Search stores"
              >
                <span aria-hidden>⌕</span>
                <span>Search</span>
              </button>

              <button
                className="leaderboardHeaderAction contestBtn"
                onClick={() => navigate("/contest")}
                aria-label="Open contests"
                title="Contests"
              >
                <span aria-hidden>🏆</span>
                <span>Contests</span>
              </button>

              <button
                className="leaderboardHeaderAction"
                onClick={() => setInfoOpen(true)}
                aria-label="Open scoring info"
                title="Scoring info"
              >
                <span aria-hidden>?</span>
                <span>Help</span>
              </button>
            </div>
          </div>

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
                    const rowClass = top
                      ? "rowTop"
                      : second
                      ? "rowSecond"
                      : third
                      ? "rowThird"
                      : ""

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
                        <td
                          style={{
                            textAlign: "right",
                            color: getPromoPenaltyColor(s.promoRate),
                            fontWeight: 800,
                          }}
                        >
                          ${s.promoDollars.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        </div>

        {leaderboardView !== "t21" && (
          <div className="card dashboardViewPlaceholder">
            <div className="dashboardViewPlaceholderTitle">
              {leaderboardView === "donations" ? "Donations" : "League Matchup"}
            </div>
            <div className="dashboardViewPlaceholderText">
              This view is ready for its data and layout.
            </div>
          </div>
        )}
      </main>

      <ScoringInfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onOpenChangelog={() => setChangelogOpen(true)}
      />

      <ChangelogModal
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
      />

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

function getStoreLogoUrl(storeNumber: string) {
  const store = localStores.find(
    (store) => String(store.storeNumber) === String(storeNumber)
  )

  const storeName = store?.name ?? "Fallback"
  const encodedName = encodeURIComponent(storeName)

  return `https://www.daytadna.com/storelogos/${encodedName}.png`
}

function BulletinBoardRoute({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const activeStore = localStorage.getItem("homeStore") ?? "6909"

  return (
    <div className="appBg">
      <Navbar activeStore={activeStore} theme={theme} setTheme={setTheme} />
      <BulletinBoardPage />
    </div>
  )
}

function ContestLeaderboardRoute({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const activeStore =
    localStorage.getItem("viewedStore") ??
    localStorage.getItem("homeStore") ??
    "6909"

  return (
    <div className="appBg">
      <Navbar activeStore={activeStore} theme={theme} setTheme={setTheme} />
      <ContestLeaderboardPage activeStore={activeStore} />
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("app_theme", theme)
  }, [theme])

  return (
    <Routes>
      <Route
        path="/"
        element={<LeaderboardApp theme={theme} setTheme={setTheme} />}
      />

      <Route
        path="/leaderboard/:storeNumber"
        element={<LeaderboardApp theme={theme} setTheme={setTheme} />}
      />

      <Route
        path="/profile/:staffCode"
        element={<ServerProfileRoute theme={theme} setTheme={setTheme} />}
      />

      <Route
        path="/bulletin"
        element={<BulletinBoardRoute theme={theme} setTheme={setTheme} />}
      />
      <Route
        path="/contest/:contestId"
        element={
          <ContestLeaderboardRoute theme={theme} setTheme={setTheme} />
        }
      />

      <Route
        path="/contest"
        element={<ContestRoute theme={theme} setTheme={setTheme} />}
      />
    </Routes>

  )
}