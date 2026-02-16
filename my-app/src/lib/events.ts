// src/lib/events.ts
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore"
import { db } from "./firebase"

type EventName = "click_review" | "click_rewards"

type StoreEventDoc = {
  createdAt: Timestamp
  event: EventName
  staffId: string
}

export type StaffCounts = Record<string, { reviews: number; rewards: number }>

export type StaffEvent = {
  createdAt: Timestamp
  event: EventName
  staffId: string
}

export type StaffEventsByStaff = Record<string, StaffEvent[]>

export async function fetchStaffCountsLast21Days(storeNumber: string): Promise<StaffCounts> {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000))
  const eventsRef = collection(db, "stores", storeNumber, "events")

  // Only filter by createdAt (avoids needing a composite index)
  const q = query(eventsRef, where("createdAt", ">=", cutoff))
  const snap = await getDocs(q)

  const counts: StaffCounts = {}

  snap.forEach((docSnap) => {
    const data = docSnap.data() as Partial<StoreEventDoc>
    const staffId = data.staffId
    const event = data.event

    if (!staffId || !event) return
    if (event !== "click_review" && event !== "click_rewards") return

    if (!counts[staffId]) counts[staffId] = { reviews: 0, rewards: 0 }

    if (event === "click_review") counts[staffId].reviews += 1
    if (event === "click_rewards") counts[staffId].rewards += 1
  })

  return counts
}

export async function fetchStaffEventsLast21Days(storeNumber: string): Promise<StaffEventsByStaff> {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000))
  const eventsRef = collection(db, "stores", storeNumber, "events")

  // Only filter by createdAt (avoids needing a composite index)
  const q = query(eventsRef, where("createdAt", ">=", cutoff))
  const snap = await getDocs(q)

  const grouped: StaffEventsByStaff = {}

  snap.forEach((docSnap) => {
    const data = docSnap.data() as Partial<StoreEventDoc>
    const staffId = data.staffId
    const event = data.event
    const createdAt = data.createdAt

    if (!staffId || !event || !createdAt) return
    if (event !== "click_review" && event !== "click_rewards") return

    if (!grouped[staffId]) grouped[staffId] = []
    grouped[staffId].push({ staffId, event, createdAt })
  })

  // Sort newest first per staff
  Object.keys(grouped).forEach((k) => {
    grouped[k].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
  })

  return grouped
}
