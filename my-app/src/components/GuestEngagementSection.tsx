import type { Timestamp } from "firebase/firestore"

export type GuestActivityRow = {
  id: string
  type: "Review" | "Rewards"
  label: string
  createdAt: Timestamp | null
  weekKey?: string
  weekOfYear?: number
}

type GuestEngagementSectionProps = {
  reviews: number
  rewards: number
  activityFilter: "all" | "review" | "rewards"
  setActivityFilter: React.Dispatch<
    React.SetStateAction<"all" | "review" | "rewards">
  >
  filteredActivity: GuestActivityRow[]
  activityLoading: boolean
}

function formatActivityTime(ts: Timestamp | null) {
  if (!ts) return "Unknown"

  try {
    return ts.toDate().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return "Unknown"
  }
}

export default function GuestEngagementSection({
  reviews,
  rewards,
  activityFilter,
  setActivityFilter,
  filteredActivity,
  activityLoading,
}: GuestEngagementSectionProps) {
  return (
    <section
      className="card profileGuestEngagement"
      style={{
        marginTop: 0,
        gridColumn: "1 / -1",
      }}
    >
      <div className="cardHeader">
        <div>
          <div className="cardTitle">Guest Engagement</div>
          <div className="cardSub">Review and Rewards activity</div>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div
          className="profileEngagementGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setActivityFilter((prev) =>
                prev === "review" ? "all" : "review"
              )
            }
            style={{
              border: "1px solid var(--stroke)",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: 18,
              background:
                activityFilter === "review"
                  ? "linear-gradient(180deg, rgba(103,232,249,0.16), rgba(255,255,255,0.03))"
                  : "color-mix(in srgb, var(--card2) 42%, transparent)",
              boxShadow:
                activityFilter === "review"
                  ? "0 14px 34px rgba(103,232,249,0.12)"
                  : "0 14px 34px rgba(0,0,0,0.10)",
              padding: 16,
              color: "var(--text)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 900,
                letterSpacing: 0.3,
              }}
            >
              Reviews
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 30,
                fontWeight: 950,
                color: "#67e8f9",
                lineHeight: 1.05,
              }}
            >
              {reviews}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--muted)",
                fontWeight: 900,
              }}
            >
              {activityFilter === "review" ? "Showing reviews" : "Click to filter"}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setActivityFilter((prev) =>
                prev === "rewards" ? "all" : "rewards"
              )
            }
            style={{
              border: "1px solid var(--stroke)",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: 18,
              background:
                activityFilter === "rewards"
                  ? "linear-gradient(180deg, rgba(192,132,252,0.16), rgba(255,255,255,0.03))"
                  : "color-mix(in srgb, var(--card2) 42%, transparent)",
              boxShadow:
                activityFilter === "rewards"
                  ? "0 14px 34px rgba(192,132,252,0.12)"
                  : "0 14px 34px rgba(0,0,0,0.10)",
              padding: 16,
              color: "var(--text)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 900,
                letterSpacing: 0.3,
              }}
            >
              Rewards
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 30,
                fontWeight: 950,
                color: "#c084fc",
                lineHeight: 1.05,
              }}
            >
              {rewards}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--muted)",
                fontWeight: 900,
              }}
            >
              {activityFilter === "rewards" ? "Showing rewards" : "Click to filter"}
            </div>
          </button>
        </div>

        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid var(--stroke)",
            background: "color-mix(in srgb, var(--card2) 34%, transparent)",
          }}
        >
          <div
            className="profileActivityHeader"
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 190px 110px 100px",
              padding: "12px 14px",
              borderBottom: "1px solid var(--stroke)",
              fontSize: 12,
              fontWeight: 950,
              color: "var(--muted)",
              letterSpacing: 0.3,
            }}
          >
            <div>Type</div>
            <div>Description</div>
            <div>Timestamp</div>
            <div>Week</div>
            <div style={{ textAlign: "right" }}>Status</div>
          </div>

          {activityLoading ? (
            <div
              style={{
                padding: 18,
                color: "var(--muted)",
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              Loading guest activity...
            </div>
          ) : filteredActivity.length > 0 ? (
            filteredActivity.map((row, index) => (
              <div
                key={row.id}
                className="profileActivityRow"
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr 190px 110px 100px",
                  padding: "14px",
                  borderBottom:
                    index === filteredActivity.length - 1
                      ? "none"
                      : "1px solid var(--stroke)",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 950,
                    color: row.type === "Review" ? "#67e8f9" : "#c084fc",
                  }}
                >
                  {row.type}
                </div>

                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {row.label}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text)",
                    fontWeight: 800,
                  }}
                >
                  {formatActivityTime(row.createdAt)}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    fontWeight: 900,
                  }}
                >
                  {row.weekOfYear
                    ? `Week ${row.weekOfYear}`
                    : row.weekKey || "Unknown"}
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 950,
                      color: "var(--text)",
                      background:
                        "color-mix(in srgb, var(--card2) 42%, transparent)",
                      border: "1px solid var(--stroke)",
                    }}
                  >
                    Counted
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: 18,
                color: "var(--muted)",
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              No guest activity found for this server yet.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}