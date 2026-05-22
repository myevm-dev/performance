import { useState } from "react"

export default function LeagueComingSoon() {
  const [leagueView, setLeagueView] = useState<
    "standings" | "week1" | "week2" | "week3" | "week4"
  >("standings")

  const waitingStores = [
    { storeNumber: "0000", name: "TestStore", joined: "3/24/2026, 8:11:45 PM" },
    { storeNumber: "6909", name: "El Paso - Dyer", joined: "3/24/2026, 8:17:56 PM" },
    { storeNumber: "7256", name: "Ruidoso Downs - Hwy 70", joined: "4/28/2026, 11:37:51 AM" },
  ]

  const matchups = [
    ["Store 9261 · Palm Springs - 20th", "Store 6177 · Corpus Christi - I-37", 32, 27],
    ["Store 6179 · Corpus Christi - S Padre Island", "Store 6224 · Victoria - Navarro", 29, 27],
    ["Store 6226 · San Antonio - Loop 410", "Store 6759 · Corpus Christi - Hwy 77", 29, 27],
    ["Store 8633 · Edinburg - Monte Cristo", "Store 9334 · Portland - Hwy 181", 36, 33],
  ]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    border: active ? "1px solid rgba(255,255,255,0.75)" : "1px solid transparent",
    borderRadius: 9,
    background: active ? "rgba(255,255,255,0.13)" : "transparent",
    color: "rgba(255,255,255,0.82)",
    padding: "10px 14px",
    fontWeight: 850,
    fontSize: 16,
    cursor: "pointer",
  })

  return (
    <div style={{ margin: "-16px", color: "white" }}>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: 4,
          marginBottom: 20,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.13)",
          background: "linear-gradient(90deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
        }}
      >
        {[
          ["standings", "Standings"],
          ["week1", "Week 1"],
          ["week2", "Week 2"],
          ["week3", "Week 3"],
          ["week4", "Week 4"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setLeagueView(value as typeof leagueView)}
            style={tabStyle(leagueView === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {leagueView === "standings" ? (
        <>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 950, margin: "28px 0 22px" }}>
            WKS League Standings
          </h2>

          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(232,121,249,0.28)",
              background: "linear-gradient(90deg, rgba(168,85,247,0.09), rgba(255,255,255,0.02))",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ fontSize: 28, margin: 0, fontWeight: 950 }}>
                Stores Waiting for Competitors
              </h3>

              <div
                style={{
                  height: 30,
                  borderRadius: 999,
                  padding: "5px 16px",
                  border: "1px solid rgba(232,121,249,0.35)",
                  background: "rgba(232,121,249,0.12)",
                  color: "rgba(244,186,255,0.85)",
                  fontSize: 13,
                  fontWeight: 950,
                  letterSpacing: 5,
                }}
              >
                MORE STORES NEEDED
              </div>
            </div>

            <table style={{ width: "100%", marginTop: 32, borderCollapse: "separate", borderSpacing: "0 15px" }}>
              <thead>
                <tr style={{ color: "#9fc3f7", fontSize: 14, letterSpacing: 5 }}>
                  <th style={{ textAlign: "left", padding: "0 30px" }}>STORE #</th>
                  <th style={{ textAlign: "left", padding: "0 30px" }}>STORE NAME</th>
                  <th style={{ textAlign: "right", padding: "0 30px" }}>JOINED</th>
                </tr>
              </thead>

              <tbody>
                {waitingStores.map((s) => (
                  <tr key={s.storeNumber} style={{ background: "rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "22px 30px", color: "cyan", fontWeight: 950 }}>
                      #{s.storeNumber}
                    </td>
                    <td style={{ padding: "22px 30px", fontWeight: 850 }}>{s.name}</td>
                    <td style={{ padding: "22px 30px", textAlign: "right" }}>{s.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ textAlign: "center", fontSize: 44, fontWeight: 950, margin: "28px 0" }}>
            {leagueView.replace("week", "Week ")} Matchups Demo
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 20,
            }}
          >
            {matchups.map(([left, right, leftScore, rightScore], index) => (
              <div
                key={index}
                style={{
                  height: 110,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.13)",
                  background: "linear-gradient(90deg, rgba(168,85,247,0.09), rgba(255,255,255,0.025))",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 170px minmax(0, 1fr)",
                  alignItems: "center",
                  padding: "0 34px",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    lineHeight: 1.25,
                    paddingRight: 12,
                    overflowWrap: "break-word",
                  }}
                >
                  {left}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "end", gap: 16 }}>
                    <span style={{ fontSize: 30, fontWeight: 950 }}>{leftScore}</span>
                    <span style={{ fontSize: 14, fontWeight: 950, marginBottom: 9 }}>
                      VS
                    </span>
                    <span style={{ fontSize: 30, fontWeight: 950 }}>{rightScore}</span>
                  </div>
                  <div
                    style={{
                      width: 20,
                      height: 5,
                      borderRadius: 999,
                      background: "#42627f",
                      margin: "3px auto 0",
                    }}
                  />
                </div>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    lineHeight: 1.25,
                    paddingLeft: 12,
                    overflowWrap: "break-word",
                  }}
                >
                  {right}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}