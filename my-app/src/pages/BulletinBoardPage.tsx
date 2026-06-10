// src/pages/BulletinBoardPage.tsx

import { useMemo, useState } from "react"

type BulletinImportance = "High" | "Medium" | "Low"

type BulletinPost = {
  id: string
  title: string
  category: "Contest" | "Announcement" | "Reminder" | "Recognition"
  importance: BulletinImportance
  dateLabel: string
  audience: string
  status: "Pinned" | "Active" | "Draft" | "Archived"
  body: string
}

const mockPosts: BulletinPost[] = []

function getCategoryBadge(category: BulletinPost["category"]) {
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

function getStatusBadge(status: BulletinPost["status"]) {
  if (status === "Pinned") {
    return "border-pink-500/30 bg-pink-500/10 text-pink-600"
  }

  if (status === "Active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
  }

  if (status === "Draft") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600"
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-600"
}

export default function BulletinBoardPage() {
  const [search, setSearch] = useState("")
  const [importanceFilter, setImportanceFilter] = useState<
    "all" | "High" | "Medium" | "Low"
  >("all")

  const filteredPosts = useMemo(() => {
    const query = search.toLowerCase().trim()

    return mockPosts.filter((post) => {
      const matchesImportance =
        importanceFilter === "all" || post.importance === importanceFilter

      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.body.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query) ||
        post.audience.toLowerCase().includes(query) ||
        post.status.toLowerCase().includes(query)

      return matchesImportance && matchesSearch
    })
  }, [search, importanceFilter])

  return (
    <main className="container">
      <div className="card">
        <div className="cardHeader leaderboardHeader">
          <div className="leaderboardHeaderActions leaderboardHeaderActionsLeft">
            <select
              className="leaderboardHeaderAction"
              value={importanceFilter}
              onChange={(event) =>
                setImportanceFilter(
                  event.target.value as "all" | "High" | "Medium" | "Low"
                )
              }
              aria-label="Filter by importance"
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
          <table className="table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Category</th>
                <th>Importance</th>
                <th>Date</th>
                <th>Audience</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="nameCell">
                        <div>
                          <div className="clickableName">{post.title}</div>
                          <div className="meta">{post.body}</div>
                        </div>
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

                    <td>{post.dateLabel}</td>

                    <td>{post.audience}</td>

                    <td style={{ textAlign: "right" }}>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getStatusBadge(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 56 }}>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>
                      No posts yet.
                    </div>

                    <div className="meta" style={{ marginTop: 8 }}>
                      Updates, reminders, recognition, and contest notices will
                      appear here once posted.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}