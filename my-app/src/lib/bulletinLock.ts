// src/lib/bulletinLock.ts (shared by daytadna admin and the staff portal — keep in sync)
//
// Optional 4-digit PIN on a bulletin. Bulletins are publicly readable, so a
// locked post never stores its text in plain form: the body is encrypted
// (AES-GCM, key from PBKDF2 of the PIN) and saved as `lock`, with `body` left
// empty. The PIN itself lives in the admin-only
// stores/{n}/bulletinSecrets/{id} doc so managers can see, edit and print it.

export type BulletinLock = {
  v: 1
  salt: string // base64
  iv: string // base64
  data: string // base64 ciphertext
  iterations: number
}

const ITERATIONS = 250_000

export const BULLETIN_PIN_PATTERN = /^\d{4}$/

export function isValidBulletinPin(pin: string) {
  return BULLETIN_PIN_PATTERN.test(pin)
}

export function isBulletinLock(value: unknown): value is BulletinLock {
  const v = value as Partial<BulletinLock> | null
  return Boolean(
    v &&
      typeof v.salt === "string" &&
      typeof v.iv === "string" &&
      typeof v.data === "string" &&
      typeof v.iterations === "number"
  )
}

function toBase64(bytes: Uint8Array) {
  let binary = ""
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(pin: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function lockBulletinBody(body: string, pin: string): Promise<BulletinLock> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(pin, salt, ITERATIONS)
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(body)
  )

  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(data)),
    iterations: ITERATIONS,
  }
}

// Returns the text, or null if the PIN is wrong.
export async function unlockBulletinBody(lock: BulletinLock, pin: string): Promise<string | null> {
  try {
    const key = await deriveKey(pin, fromBase64(lock.salt), lock.iterations)
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(lock.iv) as BufferSource },
      key,
      fromBase64(lock.data) as BufferSource
    )
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}

export const BULLETIN_PORTAL_ORIGIN = "https://portal.daytadna.com"

export function getBulletinUrl(storeNumber: string, bulletinId: string) {
  return `${BULLETIN_PORTAL_ORIGIN}/bulletin/${encodeURIComponent(storeNumber)}/${encodeURIComponent(bulletinId)}`
}
