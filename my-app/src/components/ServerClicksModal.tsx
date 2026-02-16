// src/components/ServerClicksModal.tsx
import { useEffect, useMemo, useState } from "react"
import { Timestamp } from "firebase/firestore"
import { fetchStaffEventsLast21Days, type StaffEvent, type StaffEventsByStaff } from "../lib/events"

type Props = {
  open: boolean
  onClose: () => void
  storeNumber: string
  staffId: string | null
  staffName: string
}

function formatTs(ts: Timestamp) {
  try {
    return ts.toDate().toLocaleString()
  } catch {
    return ""
  }
}

function eventLabel(e: StaffEvent["event"]) {
  if (e === "click_review") return "Review"
  if (e === "click_rewards") return "Rewards"
  return e
}

export default function ServerClicksModal({ open, onClose, storeNumber, staffId, staffName }: Props) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [eventsByStaff, setEventsByStaff] = useState<StaffEventsByStaff>({})
  const [filter, setFilter] = useState<"all" | "review" | "rewards">("all")


  useEffect(() => {
    if (!open) return

    let alive = true
    setLoading(true)
    setErr(null)

    ;(async () => {
      try {
        const grouped = await fetchStaffEventsLast21Days(storeNumber)
        if (!alive) return
        setEventsByStaff(grouped)
      } catch (e) {
        console.error(e)
        if (!alive) return
        setErr("Failed to load staff clicks.")
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [open, storeNumber])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const selectedEvents = useMemo(() => {
    if (!staffId) return []
    const list = eventsByStaff[staffId] ?? []

    if (filter === "review") return list.filter((x) => x.event === "click_review")
    if (filter === "rewards") return list.filter((x) => x.event === "click_rewards")
    return list
  }, [eventsByStaff, filter, staffId])



  if (!open) return null

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.62)",
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "min(860px, 96vw)",
          maxHeight: "min(760px, 92vh)",
          overflow: "hidden",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10,10,10,0.92)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, fontWeight: 950, opacity: 0.92 }}>{staffName}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Store {storeNumber}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {loading ? "Loading..." : err ? "Error" : "Ready"}
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                border: "none",
                cursor: "pointer",
                width: 34,
                height: 34,
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                color: "inherit",
                fontWeight: 900,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {staffId ? "Click timestamps" : "No server selected"}
          </div>

          <div
            style={{
              display: "inline-flex",
              padding: 4,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.18)",
              gap: 4,
            }}
          >
            {[
              { key: "all" as const, label: "All" },
              { key: "review" as const, label: "Reviews" },
              { key: "rewards" as const, label: "Rewards" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontWeight: 900,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  color: "inherit",
                  background: filter === t.key ? "rgba(255,255,255,0.10)" : "transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
          {err ? (
            <div style={{ opacity: 0.75, fontSize: 12 }}>{err}</div>
          ) : !staffId ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>No server selected.</div>
          ) : selectedEvents.length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>No events found in the last 21 days.</div>
          ) : (
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.14)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 900,
                  opacity: 0.85,
                  letterSpacing: 0.3,
                }}
              >
                <div>Type</div>
                <div>Time</div>
              </div>

              {selectedEvents.map((ev, i) => (
                <div
                  key={`${ev.staffId}_${ev.createdAt.seconds}_${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    padding: "10px 12px",
                    borderBottom:
                      i === selectedEvents.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 900, opacity: 0.85 }}>{eventLabel(ev.event)}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{formatTs(ev.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            opacity: 0.7,
            fontSize: 12,
          }}
        >
          Filtered to trailing 21 days
        </div>
      </div>
    </div>
  )
}
