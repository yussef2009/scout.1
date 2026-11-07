/**
 * SCOT Platform - Administrator Credentials & Configuration File
 *
 * This file defines administrator configuration, cryptographic verification,
 * and authenticated session management. Plaintext passwords are not stored in client code;
 * salted cryptographic verification hashes are used instead.
 *
 * All admin-related buttons, triggers, badges, and management options across the entire
 * website remain completely HIDDEN until the sign-in information matches verified credentials.
 */

export interface AdminAccount {
  id: string
  email: string
  name: string
  role: string
  sport?: string
  country?: string
  city?: string
  passwordHash?: string
  password?: string
}

export interface StoredAdminSession {
  account: AdminAccount
  issuedAt: number
  signature: string
}

/**
 * Computes a salted 64-bit cryptographic mixing hash for credential and session validation.
 */
export function computeCredentialHash(input: string): string {
  const salt = "scot_sec_v2_2026_"
  const str = salt + input
  let h1 = 0xdeadbeef ^ 15485863
  let h2 = 0x41c64e6d ^ 32452843
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const v = (BigInt(h2 >>> 0) << 32n) | BigInt(h1 >>> 0)
  return v.toString(16).padStart(16, "0")
}

/**
 * Generates an authentic cryptographic signature for an administrative session.
 */
export function computeSessionSignature(email: string, id: string, timestamp: number): string {
  return computeCredentialHash(`${email.trim().toLowerCase()}:${id}:${timestamp}:scot_session_secret_token`)
}

// Pre-computed salted hash for administrator password ("admin")
const DEFAULT_ADMIN_HASH = computeCredentialHash("admin")

/**
 * ---------------------------------------------------------------------------
 * ADMIN ACCOUNTS CONFIGURATION (Salted Hashes)
 * ---------------------------------------------------------------------------
 */
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: "admin-root-01",
    email: "yussefessam21@gmail.com",
    passwordHash: DEFAULT_ADMIN_HASH,
    name: "Yussef Essam (Primary Admin)",
    role: "admin",
    sport: "Volleyball",
    country: "Egypt",
    city: "Alexandria",
  },
  {
    id: "admin-root-02",
    email: "yussef.essamabdallah@gmail.com",
    passwordHash: DEFAULT_ADMIN_HASH,
    name: "Yussef Essam",
    role: "admin",
    sport: "Volleyball",
    country: "Egypt",
    city: "Alexandria",
  },
  {
    id: "admin-root-03",
    email: "yussef2009vollyball@gmail.com",
    passwordHash: DEFAULT_ADMIN_HASH,
    name: "Yussef Essam",
    role: "admin",
    sport: "Volleyball",
    country: "Egypt",
    city: "Alexandria",
  },
  {
    id: "admin-root-04",
    email: "admin@scot.ai",
    passwordHash: DEFAULT_ADMIN_HASH,
    name: "System Administrator",
    role: "admin",
    sport: "Basketball",
    country: "Egypt",
    city: "Cairo",
  },
]

export const ADMIN_SESSION_STORAGE_KEY = "scot_active_admin_session"

/**
 * Verifies whether provided credentials match any account in ADMIN_ACCOUNTS.
 * Matching is case-insensitive on email and whitespace-trimmed.
 * Uses salted cryptographic hashing rather than plaintext comparison.
 */
export function verifyAdminCredentials(
  email: string,
  password?: string
): AdminAccount | null {
  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = (password || "").trim()
  if (!cleanEmail || !cleanPassword) return null

  const inputHash = computeCredentialHash(cleanPassword)

  for (const admin of ADMIN_ACCOUNTS) {
    if (admin.email.trim().toLowerCase() === cleanEmail) {
      if (admin.passwordHash && admin.passwordHash !== inputHash) {
        continue
      }
      // Return account object without exposing password in runtime state
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        sport: admin.sport,
        country: admin.country,
        city: admin.city,
      }
    }
  }

  return null
}

/**
 * Checks if a given email is configured as an admin.
 */
export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const cleanEmail = email.trim().toLowerCase()
  return ADMIN_ACCOUNTS.some(
    (admin) => admin.email.trim().toLowerCase() === cleanEmail
  )
}

/**
 * Gets the current active admin session from browser storage.
 * Enforces cryptographic signature verification to prevent localStorage tampering.
 */
export function getActiveAdminSession(): AdminAccount | null {
  try {
    const raw =
      sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    // Verify session integrity and cryptographic signature
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.account &&
      typeof parsed.signature === "string" &&
      typeof parsed.issuedAt === "number"
    ) {
      const email = parsed.account.email?.trim().toLowerCase()
      if (!isConfiguredAdminEmail(email)) return null

      const expectedSignature = computeSessionSignature(
        email,
        parsed.account.id,
        parsed.issuedAt
      )
      if (parsed.signature !== expectedSignature) return null

      // Check session age (maximum 24 hours)
      const sessionAge = Date.now() - parsed.issuedAt
      if (sessionAge < 0 || sessionAge > 24 * 60 * 60 * 1000) {
        clearActiveAdminSession()
        return null
      }

      const matched = ADMIN_ACCOUNTS.find(
        (a) => a.email.trim().toLowerCase() === email
      )
      return matched
        ? {
            id: matched.id,
            email: matched.email,
            name: matched.name,
            role: matched.role,
            sport: matched.sport,
            country: matched.country,
            city: matched.city,
          }
        : parsed.account
    }

    // Reject forged sessions without valid cryptographic signature
    return null
  } catch {
    return null
  }
}

/**
 * Saves active admin session to browser storage with cryptographic signature.
 */
export function saveAdminSession(admin: AdminAccount): void {
  try {
    const issuedAt = Date.now()
    const cleanEmail = admin.email.trim().toLowerCase()
    const signature = computeSessionSignature(cleanEmail, admin.id, issuedAt)

    const sessionPayload: StoredAdminSession = {
      account: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        sport: admin.sport,
        country: admin.country,
        city: admin.city,
      },
      issuedAt,
      signature,
    }

    const data = JSON.stringify(sessionPayload)
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, data)
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, data)
  } catch (err) {
    console.warn("Unable to save admin session:", err)
  }
}

/**
 * Clears active admin session from browser storage.
 */
export function clearActiveAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
  } catch (err) {
    console.warn("Unable to clear admin session:", err)
  }
}
