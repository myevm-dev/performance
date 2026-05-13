import { useState } from "react"

export type StaffBadge = {
  id: string
  label: string
  image: string
  unlocked: boolean
}

type StaffBadgesProps = {
  badges: StaffBadge[]
  visibleCount?: number
  showDemoBadge?: boolean
}

export default function StaffBadges({
  badges,
  visibleCount = 5,
  showDemoBadge = true,
}: StaffBadgesProps) {
  const [badgeStart, setBadgeStart] = useState(0)

  const maxBadgeStart = Math.max(0, badges.length - visibleCount)
  const visibleBadges = badges.slice(badgeStart, badgeStart + visibleCount)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flex: 1,
        minWidth: 0,
      }}
    >
      <button
        type="button"
        onClick={() => setBadgeStart((prev) => Math.max(0, prev - 1))}
        disabled={badgeStart === 0}
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            badgeStart === 0
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.06)",
          color: "white",
          cursor: badgeStart === 0 ? "not-allowed" : "pointer",
          opacity: badgeStart === 0 ? 0.45 : 1,
          fontWeight: 900,
          flexShrink: 0,
        }}
        aria-label="Previous badges"
        title="Previous badges"
      >
        ‹
      </button>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
          gap: 8,
          alignItems: "start",
        }}
      >
        {visibleBadges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            title={badge.label}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              width: "100%",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 72,
                aspectRatio: "1 / 1",
                borderRadius: 16,
                overflow: "hidden",
                border: badge.unlocked
                  ? "1px solid rgba(255,255,255,0.14)"
                  : "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.04)",
                boxShadow: badge.unlocked
                  ? "0 8px 20px rgba(0,0,0,0.22)"
                  : "none",
                opacity: badge.unlocked ? 1 : 0.35,
                filter: badge.unlocked ? "none" : "grayscale(1)",
              }}
            >
              <img
                src={badge.image}
                alt={badge.label}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                opacity: badge.unlocked ? 0.85 : 0.45,
                textAlign: "center",
                lineHeight: 1.2,
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {badge.label}
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setBadgeStart((prev) => Math.min(maxBadgeStart, prev + 1))}
        disabled={badgeStart >= maxBadgeStart}
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            badgeStart >= maxBadgeStart
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.06)",
          color: "white",
          cursor: badgeStart >= maxBadgeStart ? "not-allowed" : "pointer",
          opacity: badgeStart >= maxBadgeStart ? 0.45 : 1,
          fontWeight: 900,
          flexShrink: 0,
        }}
        aria-label="Next badges"
        title="Next badges"
      >
        ›
      </button>

      {showDemoBadge ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            fontSize: 12,
            fontWeight: 800,
            opacity: 0.88,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "rgba(222, 18, 18, 0.92)",
              display: "inline-block",
            }}
          />
          Demo WIP
        </div>
      ) : null}
    </div>
  )
}