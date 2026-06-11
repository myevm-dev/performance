// src/pages/BulletinBoardPage.tsx

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import type { Timestamp } from "firebase/firestore"
import { db } from "../lib/firebase"

type BulletinImportance = "High" | "Medium" | "Low"
type BulletinStatus = "Pinned" | "Active" | "Draft" | "Archived"
type BulletinCategory = "Contest" | "Announcement" | "Reminder" | "Recognition"

type BulletinPost = {
  id: string
  title: string
  category: BulletinCategory
  importance: BulletinImportance
  dateLabel: string
  status: BulletinStatus
  body: string
  edited?: boolean
  createdAt?: unknown
  updatedAt?: unknown
  editedAt?: unknown
}

type BulletinDocData = {
  title?: string
  category?: BulletinCategory
  importance?: BulletinImportance
  status?: BulletinStatus
  body?: string
  edited?: boolean
  createdAt?: unknown
  updatedAt?: unknown
  editedAt?: unknown
}

function getActiveStore() {
  return (
    localStorage.getItem("viewedStore") ??
    localStorage.getItem("homeStore") ??
    "6909"
  )
}

function formatBulletinTimestamp(value: unknown) {
  if (!value) return ""

  try {
    const timestamp = value as Timestamp
    const date = timestamp.toDate()

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function getDateLabel(post: {
  createdAt?: unknown
  updatedAt?: unknown
  editedAt?: unknown
  edited?: boolean
}) {
  if (post.edited) {
    const editedDate = formatBulletinTimestamp(post.editedAt ?? post.updatedAt)

    if (editedDate) return `Edited ${editedDate}`
  }

  const postedDate = formatBulletinTimestamp(post.createdAt)

  if (postedDate) return `Posted ${postedDate}`

  return "Posted recently"
}

function getCategoryBadge(category: BulletinCategory) {
  if (category === "Contest") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600"
  }

  if (category === "Announcement") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-600"
  }

  if (category === "Recognition") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600"
  }

  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
}

function getImportanceBadge(importance: BulletinImportance) {
  if (importance === "High") {
    return "border-red-500/30 bg-red-500/10 text-red-600"
  }

  if (importance === "Medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600"
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-600"
}

export default function BulletinBoardPage() {
  const activeStore = getActiveStore()

  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [selectedPost, setSelectedPost] = useState<BulletinPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [importanceFilter, setImportanceFilter] = useState<
    "all" | "High" | "Medium" | "Low"
  >("all")

  useEffect(() => {
    let alive = true

    async function loadBulletins() {
      setLoading(true)

      try {
        const bulletinsQuery = query(
          collection(db, "stores", activeStore, "bulletins"),
          orderBy("createdAt", "desc")
        )

        const snap = await getDocs(bulletinsQuery)

        if (!alive) return

        const rows: BulletinPost[] = snap.docs
          .map((docSnap) => {
            const data = docSnap.data() as BulletinDocData

            const postBase = {
              id: docSnap.id,
              title: data.title ?? "Untitled Post",
              category: data.category ?? "Announcement",
              importance: data.importance ?? "Medium",
              status: data.status ?? "Draft",
              body: data.body ?? "",
              edited: Boolean(data.edited),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              editedAt: data.editedAt,
            }

            return {
              ...postBase,
              dateLabel: getDateLabel(postBase),
            }
          })
          .filter((post) => post.status === "Active" || post.status === "Pinned")

        rows.sort((a, b) => {
          if (a.status === "Pinned" && b.status !== "Pinned") return -1
          if (a.status !== "Pinned" && b.status === "Pinned") return 1
          if (a.importance === "High" && b.importance !== "High") return -1
          if (a.importance !== "High" && b.importance === "High") return 1

          return a.title.localeCompare(b.title)
        })

        setPosts(rows)
      } catch (error) {
        console.error("Failed to load bulletin posts:", error)

        if (!alive) return
        setPosts([])
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadBulletins()

    return () => {
      alive = false
    }
  }, [activeStore])

  const filteredPosts = useMemo(() => {
    const queryText = search.toLowerCase().trim()

    return posts.filter((post) => {
      const matchesImportance =
        importanceFilter === "all" || post.importance === importanceFilter

      const matchesSearch =
        !queryText ||
        post.title.toLowerCase().includes(queryText) ||
        post.body.toLowerCase().includes(queryText) ||
        post.category.toLowerCase().includes(queryText) ||
        post.status.toLowerCase().includes(queryText) ||
        post.dateLabel.toLowerCase().includes(queryText)

      return matchesImportance && matchesSearch
    })
  }, [posts, search, importanceFilter])

  return (
    <main className="container">
      <div className="card bulletinBoardCard">
        <div className="cardHeader leaderboardHeader">
          <div className="leaderboardHeaderActions leaderboardHeaderActionsLeft">
            <select
              className="leaderboardHeaderAction bulletinSelect"
              value={importanceFilter}
              onChange={(event) =>
                setImportanceFilter(
                  event.target.value as "all" | "High" | "Medium" | "Low"
                )
              }
              aria-label="Filter by importance"
              style={{ colorScheme: "dark" }}
            >
              <option value="all">All Importance</option>
              <option value="High">High Importance</option>
              <option value="Medium">Medium Importance</option>
              <option value="Low">Low Importance</option>
            </select>
          </div>

          <div className="leaderboardStoreSearchWrap">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bulletin posts"
              className="leaderboardStoreSearchInput"
            />
          </div>

          <div className="leaderboardHeaderActions leaderboardHeaderActionsRight">
            <button type="button" className="leaderboardHeaderAction">
              <span aria-hidden>⌕</span>
              <span>Search</span>
            </button>
          </div>
        </div>

        <div className="tableWrap" aria-label="Bulletin board table scroll area">
          <table className="table bulletinTable">
            <thead>
              <tr>
                <th>Post</th>
                <th>Category</th>
                <th>Importance</th>
                <th style={{ textAlign: "right" }}>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 56 }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>
                      Loading bulletin posts...
                    </div>

                    <div className="meta" style={{ marginTop: 8 }}>
                      Checking Store {activeStore}.
                    </div>
                  </td>
                </tr>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="bulletinClickableRow"
                    onClick={() => setSelectedPost(post)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedPost(post)
                      }
                    }}
                  >
                    <td>
                      <div className="nameCell">
                        <div className="clickableName">{post.title}</div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getCategoryBadge(
                          post.category
                        )}`}
                      >
                        {post.category}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getImportanceBadge(
                          post.importance
                        )}`}
                      >
                        {post.importance}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800 }}>{post.dateLabel}</div>

                      {post.edited ? (
                        <div className="meta" style={{ marginTop: 4 }}>
                          Updated after posting
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 56 }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>
                      No posts yet.
                    </div>

                    <div className="meta" style={{ marginTop: 8 }}>
                      Updates, reminders, recognition, and contest notices will appear here
                      once posted for Store {activeStore}.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPost ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Bulletin post"
        >
          <button
            type="button"
            aria-label="Close bulletin post"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          />

          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--stroke)] bg-[var(--card)] text-[var(--text)] shadow-2xl">
            <div className="border-b border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_82%,transparent)] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getCategoryBadge(
                        selectedPost.category
                      )}`}
                    >
                      {selectedPost.category}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getImportanceBadge(
                        selectedPost.importance
                      )}`}
                    >
                      {selectedPost.importance}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black tracking-tight">
                    {selectedPost.title}
                  </h2>

                  <div className="meta mt-2">
                    {selectedPost.dateLabel}
                    {selectedPost.edited ? " · Updated after posting" : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_70%,transparent)] text-xl font-black transition hover:-translate-y-px"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-5 py-5">
              <p className="whitespace-pre-wrap text-base font-semibold leading-8 text-[var(--text)]">
                {selectedPost.body || "No message body was added."}
              </p>
            </div>

            <div className="flex justify-end border-t border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_58%,transparent)] px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-xl border border-[var(--stroke)] bg-[var(--card)] px-5 py-2.5 text-sm font-black text-[var(--text)] transition hover:-translate-y-px"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}