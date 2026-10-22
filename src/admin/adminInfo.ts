/**
 * SCOT Platform - Administrator Credentials & Configuration File
 *
 * This file defines the administrator sign-in information.
 * When the administrator enters matching credentials in the normal sign-in modal/page,
 * the platform recognizes them as Admin, grants full security clearance, and opens the Admin Page.
 *
 * All admin-related buttons, triggers, badges, and management options across the entire
 * website remain completely HIDDEN until the sign-in information matches this file.
 */

export interface AdminAccount {
  id: string
  email: string
  password: string
  name: string
  role: string
  sport?: string
  country?: string
  city?: string
}

/**
 * ---------------------------------------------------------------------------
 * ADMIN ACCOUNTS CONFIGURATION
 * ---------------------------------------------------------------------------
 * You can change the email and password below anytime.
 * Entering this email and password in the normal Sign In page will grant admin access.
 */
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: "admin-root-01",
    email: "yussef.essamabdallah@gmail.com",
    password: "admin", // Administrator password
    name: "Yussef Essam (Primary Admin)",
    role: "admin",
    sport: "Volleyball",
    country: "Egypt",
    city: "Alexandria",
  },
  {
    id: "admin-root-02",
    email: "yussef2009vollyball@gmail.com",
    password: "admin",
    name: "Yussef Essam",
    role: "admin",
    sport: "Volleyball",
    country: "Egypt",
    city: "Alexandria",
  },
  {
    id: "admin-root-03",
    email: "admin@scot.ai",
    password: "admin", // Secondary admin account
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
 */
export function verifyAdminCredentials(
  email: string,
  password?: string
): AdminAccount | null {
  const cleanEmail = email.trim().toLowerCase()
  const cleanPassword = (password || "").trim()

  for (const admin of ADMIN_ACCOUNTS) {
    if (admin.email.trim().toLowerCase() === cleanEmail) {
      // If a password is set in the file, verify it
      if (admin.password && admin.password.trim() !== "" && admin.password !== cleanPassword) {
        continue
      }
      return admin
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
 */
export function getActiveAdminSession(): AdminAccount | null {
  try {
    const raw =
      sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
      localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminAccount
    // Verify it still exists in ADMIN_ACCOUNTS
    const matched = ADMIN_ACCOUNTS.find(
      (a) => a.email.trim().toLowerCase() === parsed.email.trim().toLowerCase()
    )
    return matched || parsed
  } catch {
    return null
  }
}

/**
 * Saves active admin session to browser storage.
 */
export function saveAdminSession(admin: AdminAccount): void {
  try {
    const data = JSON.stringify(admin)
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
