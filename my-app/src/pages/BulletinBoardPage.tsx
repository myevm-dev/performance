// src/pages/BulletinBoardPage.tsx

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore"
import type { Timestamp } from "firebase/firestore"
import { db } from "../lib/firebase"
import { getStaffDisplayName } from "../lib/staffName"
import {
  isBulletinLock,
  isValidBulletinPin,
  unlockBulletinBody,
  type BulletinLock,
} from "../lib/bulletinLock"

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
  lock?: BulletinLock | null
  // Readers type their name before the post opens (logged in /reads).
  requireSignature?: boolean
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
  pinProtected?: boolean
  lock?: unknown
  requireSignature?: boolean
}

const READER_NAME_KEY = "bulletin_reader_name"
const SIGNED_PREFIX = "bulletin_signed_"
const DEVICE_KEY = "bulletin_device_id"

function readLocal(key: string) {
  try {
    return localStorage.getItem(key) ?? ""
  } catch {
    return ""
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage blocked
  }
}

function getDeviceId() {
  let id = readLocal(DEVICE_KEY)
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    writeLocal(DEVICE_KEY, id)
  }
  return id
}

function cleanReaderName(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function isValidReaderName(value: string) {
  const name = cleanReaderName(value)
  return name.length >= 2 && name.length <= 60 && /\p{L}/u.test(name)
}

const PIN_MEMORY_PREFIX = "bulletin_pin_"

function rememberPin(key: string, pin: string) {
  try {
    sessionStorage.setItem(PIN_MEMORY_PREFIX + key, pin)
  } catch {
    // private mode etc.
  }
}

function recallPin(key: string) {
  try {
    return sessionStorage.getItem(PIN_MEMORY_PREFIX + key) ?? ""
  } catch {
    return ""
  }
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

function toBulletinPost(id: string, data: BulletinDocData): BulletinPost {
  const postBase = {
    id,
    title: data.title ?? "Untitled Post",
    category: data.category ?? "Announcement",
    importance: data.importance ?? "Medium",
    status: data.status ?? "Draft",
    body: data.body ?? "",
    edited: Boolean(data.edited),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    editedAt: data.editedAt,
    lock: data.pinProtected && isBulletinLock(data.lock) ? data.lock : null,
    requireSignature: Boolean(data.requireSignature),
  }

  return {
    ...postBase,
    dateLabel: getDateLabel(postBase),
  }
}

function isPublic(post: BulletinPost) {
  return post.status === "Active" || post.status === "Pinned"
}

export default function BulletinBoardPage({
  storeNumber: activeStore,
  postId,
}: {
  storeNumber: string
  postId?: string
}) {
  const navigate = useNavigate()

  const [posts, setPosts] = useState<BulletinPost[]>([])
  // Post opened by a direct link that isn't in the list (or doesn't exist).
  const [linkedPost, setLinkedPost] = useState<BulletinPost | "missing" | null>(null)
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
          .map((docSnap) => toBulletinPost(docSnap.id, docSnap.data() as BulletinDocData))
          .filter(isPublic)

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

  // Direct link to a post that isn't on the public list.
  useEffect(() => {
    setLinkedPost(null)
    if (!postId || loading) return
    if (posts.some((post) => post.id === postId)) return

    let alive = true

    getDoc(doc(db, "stores", activeStore, "bulletins", postId))
      .then((snap) => {
        if (!alive) return
        if (!snap.exists()) {
          setLinkedPost("missing")
          return
        }
        const post = toBulletinPost(snap.id, snap.data() as BulletinDocData)
        setLinkedPost(isPublic(post) ? post : "missing")
      })
      .catch(() => {
        if (alive) setLinkedPost("missing")
      })

    return () => {
      alive = false
    }
  }, [postId, posts, loading, activeStore])

  const selectedPost: BulletinPost | "missing" | null = !postId
    ? null
    : posts.find((post) => post.id === postId) ?? linkedPost

  const openPost = (post: BulletinPost) => {
    navigate(`/bulletin/${encodeURIComponent(activeStore)}/${encodeURIComponent(post.id)}`)
  }

  const closePost = () => {
    navigate(`/bulletin/${encodeURIComponent(activeStore)}`)
  }

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

  // A single bulletin opens as its own page.
  if (postId) {
    return (
      <main className="container bulletinPostMain">
        {selectedPost ? (
          <BulletinPostView
            key={selectedPost === "missing" ? "missing" : selectedPost.id}
            post={selectedPost}
            storeNumber={activeStore}
            onBack={closePost}
          />
        ) : (
          <div className="card bulletinPostLoading">Loading bulletin...</div>
        )}
      </main>
    )
  }

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
                    onClick={() => openPost(post)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openPost(post)
                      }
                    }}
                  >
                    <td>
                      <div className="nameCell">
                        <div className="clickableName">
                          {post.lock ? (
                            <span aria-label="PIN protected" title="PIN protected">🔒 </span>
                          ) : null}
                          {post.title}
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

        {/* Phones: cards instead of the table */}
        <div className="bulletinCardList">
          {loading ? (
            <div className="bulletinCardEmpty">
              <strong>Loading bulletin posts...</strong>
              <span>Checking Store {activeStore}.</span>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                className={`bulletinCard ${post.status === "Pinned" ? "bulletinCardPinned" : ""}`}
                onClick={() => openPost(post)}
              >
                <span className="bulletinCardBadges">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] ${getCategoryBadge(
                      post.category
                    )}`}
                  >
                    {post.category}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] ${getImportanceBadge(
                      post.importance
                    )}`}
                  >
                    {post.importance}
                  </span>
                  {post.status === "Pinned" ? <span className="bulletinCardTag">📌 Pinned</span> : null}
                  {post.lock ? <span className="bulletinCardTag">🔒 PIN</span> : null}
                </span>

                <span className="bulletinCardTitle">{post.title}</span>

                <span className="bulletinCardMeta">
                  {post.dateLabel}
                  {post.edited ? " · Updated" : ""}
                </span>

                <span className="bulletinCardChevron" aria-hidden>
                  ›
                </span>
              </button>
            ))
          ) : (
            <div className="bulletinCardEmpty">
              <strong>No posts yet.</strong>
              <span>
                Updates, reminders, recognition, and contest notices will appear here once posted
                for Store {activeStore}.
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
function BulletinPostView({
  post,
  storeNumber,
  onBack,
}: {
  post: BulletinPost | "missing"
  storeNumber: string
  onBack: () => void
}) {
  const missing = post === "missing"
  const locked = !missing && Boolean(post.lock)
  const memoryKey = missing ? "" : `${storeNumber}_${post.id}`

  const [unlockedBody, setUnlockedBody] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  // True while a PIN remembered from earlier in this session is re-checked.
  const [checking, setChecking] = useState(
    () => !missing && Boolean(post.lock) && Boolean(recallPin(memoryKey))
  )
  const [pinError, setPinError] = useState<string | null>(null)

  // Sign-off: who read it. Remembered per post on this device.
  const needsSignature = !missing && Boolean(post.requireSignature)
  const signedKey = SIGNED_PREFIX + memoryKey
  const [signedName, setSignedName] = useState(() =>
    needsSignature ? readLocal(signedKey) : ""
  )
  const [readerName, setReaderName] = useState(() => readLocal(READER_NAME_KEY))
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [staffNames, setStaffNames] = useState<string[]>([])

  const showSignForm = needsSignature && !signedName

  // Suggest this store's staff names while typing.
  useEffect(() => {
    if (!showSignForm) return
    let alive = true
    getDocs(query(collection(db, "staffUsers"), where("storeNumber", "==", storeNumber)))
      .then((snap) => {
        if (!alive) return
        const names = snap.docs
          .map((d) => getStaffDisplayName(d.data() as { name?: string; preferredName?: string }, ""))
          .filter(Boolean)
        setStaffNames(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [showSignForm, storeNumber])

  const submitSignature = async () => {
    if (missing || signing) return
    const name = cleanReaderName(readerName)
    if (!isValidReaderName(name)) {
      setSignError("Type your first and last name.")
      return
    }

    setSigning(true)
    setSignError(null)
    try {
      await addDoc(collection(db, "stores", storeNumber, "bulletins", post.id, "reads"), {
        name,
        signedAt: serverTimestamp(),
        deviceId: getDeviceId(),
      })
      writeLocal(READER_NAME_KEY, name)
      writeLocal(signedKey, name)
      setSignedName(name)
    } catch (error) {
      console.error("Failed to sign bulletin:", error)
      setSignError("Couldn't save your name. Check your connection and try again.")
    } finally {
      setSigning(false)
    }
  }

  const signAsSomeoneElse = () => {
    writeLocal(signedKey, null)
    setSignedName("")
    setReaderName("")
  }

  // Re-open without asking again if the PIN was entered this session.
  useEffect(() => {
    if (missing || !post.lock) return
    const saved = recallPin(memoryKey)
    if (!saved) return

    let alive = true
    unlockBulletinBody(post.lock, saved).then((text) => {
      if (!alive) return
      if (text !== null) setUnlockedBody(text)
      setChecking(false)
    })

    return () => {
      alive = false
    }
  }, [missing, post, memoryKey])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const submitPin = async () => {
    if (missing || !post.lock || checking) return
    if (!isValidBulletinPin(pin)) {
      setPinError("Enter the 4-digit PIN.")
      return
    }

    setChecking(true)
    setPinError(null)
    const text = await unlockBulletinBody(post.lock, pin)
    setChecking(false)

    if (text === null) {
      setPinError("That PIN isn't right. Check the posted sheet.")
      setPin("")
      return
    }

    rememberPin(memoryKey, pin)
    setUnlockedBody(text)
  }

  const showPinForm = locked && unlockedBody === null
  const bodyText = locked ? unlockedBody ?? "" : missing ? "" : post.body

  return (
    <article className="bulletinPostPage" aria-label="Bulletin post">
      <button type="button" className="bulletinBackLink" onClick={onBack}>
        ← All bulletins
      </button>

      <div className="overflow-hidden rounded-3xl border border-[var(--stroke)] bg-[var(--card)] text-[var(--text)] shadow-xl">
        <div className="border-b border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_82%,transparent)] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {missing ? (
                <h1 className="text-2xl font-black tracking-tight">Post not available</h1>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getCategoryBadge(
                        post.category
                      )}`}
                    >
                      {post.category}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getImportanceBadge(
                        post.importance
                      )}`}
                    >
                      {post.importance}
                    </span>

                    {locked ? (
                      <span className="inline-flex rounded-full border border-[var(--stroke)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
                        🔒 PIN
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-4 text-2xl font-black tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
                    {post.title}
                  </h1>

                  <div className="mt-2 text-sm font-semibold text-[var(--muted2)]">
                    {post.dateLabel}
                    {post.edited ? " · Updated after posting" : ""}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        <div className="px-5 py-6 sm:px-7">
          {missing ? (
            <p className="text-base font-semibold leading-8">
              This bulletin was removed or is no longer posted for Store {storeNumber}.
            </p>
          ) : showPinForm ? (
            <form
              className="flex flex-col items-center gap-3 py-4 text-center"
              onSubmit={(event) => {
                event.preventDefault()
                void submitPin()
              }}
            >
              <div className="text-base font-black">Enter the PIN to read this post</div>
              <div className="text-sm font-semibold text-[var(--muted2)]">It's printed on the sheet posted at work.</div>

              <input
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                  setPinError(null)
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={4}
                aria-label="4-digit PIN"
                placeholder="••••"
                className="mt-2 h-14 w-44 rounded-2xl border border-[var(--stroke)] bg-[var(--card2)] text-center text-3xl font-black tracking-[0.4em] text-[var(--text)] outline-none focus:border-[var(--accent,#3b82f6)]"
              />

              {pinError ? (
                <div className="text-sm font-bold text-red-500" role="alert">
                  {pinError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={checking || pin.length !== 4}
                className="mt-1 rounded-xl border border-[var(--stroke)] bg-[var(--card)] px-6 py-2.5 text-sm font-black text-[var(--text)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? "Checking..." : "Unlock"}
              </button>
            </form>
          ) : showSignForm ? (
            <form
              className="flex flex-col items-center gap-3 py-4 text-center"
              onSubmit={(event) => {
                event.preventDefault()
                void submitSignature()
              }}
            >
              <div className="text-base font-black">Sign in to read this post</div>
              <div className="text-sm font-semibold text-[var(--muted2)]">
                Type your name so your manager knows you've read it.
              </div>

              <input
                value={readerName}
                onChange={(event) => {
                  setReaderName(event.target.value)
                  setSignError(null)
                }}
                list="bulletin-staff-names"
                autoComplete="name"
                autoFocus
                maxLength={60}
                aria-label="Your name"
                placeholder="First and last name"
                className="mt-2 h-12 w-full max-w-xs rounded-2xl border border-[var(--stroke)] bg-[var(--card2)] px-4 text-center text-lg font-bold text-[var(--text)] outline-none focus:border-[var(--accent,#3b82f6)]"
              />
              <datalist id="bulletin-staff-names">
                {staffNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              {signError ? (
                <div className="text-sm font-bold text-red-500" role="alert">
                  {signError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={signing || !isValidReaderName(readerName)}
                className="mt-1 rounded-xl border border-[var(--stroke)] bg-[var(--card)] px-6 py-2.5 text-sm font-black text-[var(--text)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signing ? "Signing..." : "Sign & read"}
              </button>
            </form>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-base font-semibold leading-8 text-[var(--text)]">
                {bodyText || "No message body was added."}
              </p>

              {needsSignature && signedName ? (
                <div className="mt-4 text-sm font-semibold text-[var(--muted2)]">
                  ✍️ Signed by {signedName} ·{" "}
                  <button
                    type="button"
                    onClick={signAsSomeoneElse}
                    className="font-black text-[var(--text)] underline underline-offset-2"
                  >
                    Not you?
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_58%,transparent)] px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[var(--stroke)] bg-[var(--card)] px-5 py-2.5 text-sm font-black text-[var(--text)] transition hover:-translate-y-px"
          >
            Back to bulletins
          </button>
        </div>
      </div>
    </article>
  )
}
