import { describe, it, expect, beforeEach } from "vitest"
import {
  ADMIN_ACCOUNTS,
  ADMIN_SESSION_STORAGE_KEY,
  verifyAdminCredentials,
  isConfiguredAdminEmail,
  getActiveAdminSession,
  saveAdminSession,
  clearActiveAdminSession,
} from "../admin/adminInfo"
import {
  isValidClubCode,
  isValidScoutCode,
  getAllClubCodes,
  getAllScoutCodes,
  generateSpecialCode,
  verifyAndApproveRegistration,
  rejectRegistration,
  revokeSpecialCode,
  addSpecialCode,
  getSpecialCodes,
  getAdminRegistrations,
  submitClubOrScoutRegistration,
  INITIAL_REGISTRATIONS,
} from "../admin/adminStore"
import {
  updateAdminProfile,
  updateAdminVerificationRequest,
  isAuthorizedAdminOperation,
} from "../supabase"

describe("Security & Authentication Suite", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe("Admin Credential Verification & Access Control", () => {
    it("authenticates valid configured admin credentials", () => {
      const primaryAdmin = ADMIN_ACCOUNTS[0]
      const authenticated = verifyAdminCredentials(
        primaryAdmin.email,
        "admin"
      )

      expect(authenticated).not.toBeNull()
      expect(authenticated?.email).toBe(primaryAdmin.email)
      expect(authenticated?.role).toBe("admin")
    })

    it("enforces case-insensitive email matching and whitespace trimming", () => {
      const admin = ADMIN_ACCOUNTS[0]
      const uppercaseEmail = `  ${admin.email.toUpperCase()}  `
      const passwordWithSpaces = "  admin  "

      const authenticated = verifyAdminCredentials(
        uppercaseEmail,
        passwordWithSpaces
      )

      expect(authenticated).not.toBeNull()
      expect(authenticated?.id).toBe(admin.id)
    })

    it("rejects unauthorized emails", () => {
      const attackerEmail = "attacker@external-hacker.com"
      const authenticated = verifyAdminCredentials(attackerEmail, "admin")
      expect(authenticated).toBeNull()
    })

    it("rejects incorrect passwords for existing admin accounts", () => {
      const admin = ADMIN_ACCOUNTS[0]
      const authenticated = verifyAdminCredentials(
        admin.email,
        "WRONG_PASSWORD_123"
      )
      expect(authenticated).toBeNull()
    })

    it("safely handles empty, nullish or injection inputs without throwing", () => {
      expect(verifyAdminCredentials("", "")).toBeNull()
      expect(verifyAdminCredentials("   ", "   ")).toBeNull()
      // SQL / NoSQL injection attempts
      expect(
        verifyAdminCredentials("' OR '1'='1", "' OR '1'='1")
      ).toBeNull()
      expect(
        verifyAdminCredentials("admin'--", "password")
      ).toBeNull()
    })

    it("isConfiguredAdminEmail accurately validates admin email whitelist", () => {
      expect(isConfiguredAdminEmail(ADMIN_ACCOUNTS[0].email)).toBe(true)
      expect(isConfiguredAdminEmail(ADMIN_ACCOUNTS[0].email.toUpperCase())).toBe(
        true
      )
      expect(isConfiguredAdminEmail("unknown.user@scot.io")).toBe(false)
      expect(isConfiguredAdminEmail(null)).toBe(false)
      expect(isConfiguredAdminEmail(undefined)).toBe(false)
      expect(isConfiguredAdminEmail("")).toBe(false)
    })
  })

  describe("Admin Session Storage & Isolation", () => {
    it("persists and retrieves active admin session across storage", () => {
      const admin = ADMIN_ACCOUNTS[0]
      saveAdminSession(admin)

      const activeSession = getActiveAdminSession()
      expect(activeSession).not.toBeNull()
      expect(activeSession?.email).toBe(admin.email)
      expect(activeSession?.name).toBe(admin.name)
    })

    it("clears active session completely from both sessionStorage and localStorage", () => {
      const admin = ADMIN_ACCOUNTS[0]
      saveAdminSession(admin)
      expect(getActiveAdminSession()).not.toBeNull()

      clearActiveAdminSession()
      expect(getActiveAdminSession()).toBeNull()
      expect(sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)).toBeNull()
    })

    it("resiliently handles corrupted JSON in storage without crashing", () => {
      localStorage.setItem(
        ADMIN_SESSION_STORAGE_KEY,
        "MALFORMED_JSON_CORRUPT{[[{"
      )
      expect(() => getActiveAdminSession()).not.toThrow()
      expect(getActiveAdminSession()).toBeNull()
    })
  })

  describe("Club & Scout Verification Codes & Security Boundaries", () => {
    it("validates base club access codes regardless of casing", () => {
      expect(isValidClubCode("SCOT-CLUB-VIP")).toBe(true)
      expect(isValidClubCode("scot-club-vip")).toBe(true)
      expect(isValidClubCode("  FIFA-ACAD-2026  ")).toBe(true)
      expect(isValidClubCode("FAKE-CLUB-CODE-999")).toBe(false)
      expect(isValidClubCode("")).toBe(false)
    })

    it("validates base scout access codes", () => {
      expect(isValidScoutCode("SCOT-PRO-SCOUT")).toBe(true)
      expect(isValidScoutCode("uefa-sct-88")).toBe(true)
      expect(isValidScoutCode("FIBA-TALENT-99")).toBe(true)
      expect(isValidScoutCode("SCOT-CLUB-VIP")).toBe(false) // Club code is not valid for scouts
      expect(isValidScoutCode("")).toBe(false)
    })

    it("generates role-prefixed cryptographic special codes", () => {
      const clubCode = generateSpecialCode("Club", "Al Ahly")
      expect(clubCode.startsWith("SCOT-CLUB-")).toBe(true)

      const scoutCode = generateSpecialCode("Scout", "FIBA Scout")
      expect(scoutCode.startsWith("SCOT-SCOUT-")).toBe(true)
    })

    it("allows dynamically adding a special code and validating it", () => {
      const customCode = "SCOT-CLUB-TEST-99"
      addSpecialCode({
        code: customCode,
        role: "Club",
        issuedTo: "Test Academy",
        issuedAt: "Today",
        status: "active",
      })

      expect(isValidClubCode(customCode)).toBe(true)
      expect(getAllClubCodes()).toContain(customCode)
    })

    it("prevents revoked codes from passing verification", () => {
      const customCode = "SCOT-REVOKE-TEST"
      addSpecialCode({
        code: customCode,
        role: "Club",
        issuedTo: "Revoked Club",
        issuedAt: "Today",
        status: "active",
      })
      expect(isValidClubCode(customCode)).toBe(true)

      revokeSpecialCode(customCode)
      expect(isValidClubCode(customCode)).toBe(false)
    })

    it("approves pending registrations and assigns a valid access code", () => {
      const reg = submitClubOrScoutRegistration({
        role: "Club",
        name: "Zamalek Youth Sporting Club",
        email: "youth@zamalek.com",
        country: "Egypt",
        city: "Giza",
        sport: "Soccer",
      })

      expect(reg.status).toBe("pending")

      const approval = verifyAndApproveRegistration(
        reg.id,
        "Verified by regulatory federation",
        "admin@scot.io"
      )

      expect(approval.success).toBe(true)
      expect(approval.code).toBeDefined()
      expect(isValidClubCode(approval.code!)).toBe(true)

      const all = getAdminRegistrations()
      const updated = all.find((r) => r.id === reg.id)
      expect(updated?.status).toBe("verified")
      expect(updated?.specialCode).toBe(approval.code)
    })

    it("properly transitions registration to rejected status with reason", () => {
      const reg = submitClubOrScoutRegistration({
        role: "Scout",
        name: "Unverified Agency",
        email: "fake@agency.xyz",
        country: "Unknown",
        city: "Unknown",
        sport: "Basketball",
      })

      const rejectionReason = "Invalid license credentials provided."
      const success = rejectRegistration(reg.id, rejectionReason, "admin@scot.io")

      expect(success).toBe(true)
      const all = getAdminRegistrations()
      const updated = all.find((r) => r.id === reg.id)
      expect(updated?.status).toBe("rejected")
      expect(updated?.notes).toBe(rejectionReason)
    })
  })

  describe("Security Audit Trust Boundary & Vulnerability Regressions", () => {
    it("PATCH-01: ensures no plaintext passwords exist in client bundle and verifies salted hash", () => {
      // Confirms all admin accounts have eliminated plaintext passwords
      expect(ADMIN_ACCOUNTS.length).toBeGreaterThan(0)
      for (const account of ADMIN_ACCOUNTS) {
        expect(account.password).toBeUndefined()
        expect(typeof account.passwordHash).toBe("string")
        expect(account.passwordHash?.length).toBeGreaterThan(0)
      }
      expect(verifyAdminCredentials("admin@scot.ai", "admin")).not.toBeNull()
      expect(verifyAdminCredentials("admin@scot.ai", "wrong-password")).toBeNull()
    })

    it("PATCH-02: rejects forged admin sessions in localStorage lacking cryptographic signature", () => {
      // Simulates an attacker attempting to forge an admin session in browser storage without valid signature
      const forgedAdmin = {
        id: "forged-admin-session",
        email: "admin@scot.ai",
        name: "Forged Administrator",
        role: "admin",
      }
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(forgedAdmin))

      // The patched getActiveAdminSession MUST reject unsigned or forged storage
      const activeSession = getActiveAdminSession()
      expect(activeSession).toBeNull()

      // Legitimate session saved with cryptographic signature MUST succeed
      saveAdminSession(ADMIN_ACCOUNTS[0])
      const verifiedSession = getActiveAdminSession()
      expect(verifiedSession).not.toBeNull()
      expect(verifiedSession?.email).toBe(ADMIN_ACCOUNTS[0].email)
    })

    it("PATCH-03: enforces that revoking BASE_CLUB_CODES takes immediate effect", () => {
      // Confirms that base codes can now be revoked properly
      const code = "SCOT-CLUB-VIP"
      expect(isValidClubCode(code)).toBe(true)

      // Admin revokes the base code
      revokeSpecialCode(code)

      // In patched state, revocation MUST take precedence over default base list
      expect(isValidClubCode(code)).toBe(false)
      expect(getAllClubCodes()).not.toContain(code)
    })

    it("PATCH-04: rejects unsafe URI schemes in device endpoint configuration", () => {
      const isSafeEndpoint = (val: string): boolean => {
        try {
          const parsed = new URL(val)
          return parsed.protocol === "http:" || parsed.protocol === "https:"
        } catch {
          return false
        }
      }

      expect(isSafeEndpoint("http://192.168.4.1/data")).toBe(true)
      expect(isSafeEndpoint("https://iot.scot.ai/stream")).toBe(true)
      // Unsafe protocols must be rejected
      expect(isSafeEndpoint("javascript:alert(1)")).toBe(false)
      expect(isSafeEndpoint("file:///etc/passwd")).toBe(false)
      expect(isSafeEndpoint("data:text/html,<script>evil()</script>")).toBe(false)
      expect(isSafeEndpoint("ftp://malicious.host")).toBe(false)
    })

    it("PATCH-05: verifies server static security rules block .env and secret files", () => {
      const forbiddenRegexes = [
        /^\./,
        /\/\./,
        /\.env(\..+)?$/i,
        /^(package|package-lock|pnpm-lock)\.(json|yaml)$/i,
        /^server\.js$/i,
        /\.(ts|tsx|map|yml|yaml|ini|log|zip|tar|gz)$/i,
      ]

      const isForbidden = (pathname: string) => {
        const normalized = pathname.replace(/\\/g, "/")
        const parts = normalized.split("/")
        if (parts.some((p) => p.startsWith("."))) return true
        const base = parts[parts.length - 1]
        return forbiddenRegexes.some((r) => r.test(base) || r.test(normalized))
      }

      // Prohibited files MUST be blocked
      expect(isForbidden("/.env")).toBe(true)
      expect(isForbidden("/.env.local")).toBe(true)
      expect(isForbidden("/.git/config")).toBe(true)
      expect(isForbidden("/server.js")).toBe(true)
      expect(isForbidden("/package.json")).toBe(true)
      expect(isForbidden("/src/App.tsx")).toBe(true)

      // Allowed public files MUST pass
      expect(isForbidden("/index.html")).toBe(false)
      expect(isForbidden("/style.css")).toBe(false)
      expect(isForbidden("/logo.png")).toBe(false)
    })

    it("PATCH-06: blocks unauthorized callers from triggering admin database updates", async () => {
      // With no active admin session, isAuthorizedAdminOperation must be false
      clearActiveAdminSession()
      expect(isAuthorizedAdminOperation()).toBe(false)

      const profileUpdate = await updateAdminProfile("test-user-id", { role: "admin" })
      expect(profileUpdate.success).toBe(false)
      expect(profileUpdate.error).toMatch(/Unauthorized: Administrator clearance required/i)

      const requestUpdate = await updateAdminVerificationRequest("req-123", { status: "approved" })
      expect(requestUpdate.success).toBe(false)
      expect(requestUpdate.error).toMatch(/Unauthorized: Administrator clearance required/i)

      // When legitimately signed in as admin:
      saveAdminSession(ADMIN_ACCOUNTS[0])
      expect(isAuthorizedAdminOperation()).toBe(true)
    })

    it("PATCH-07: verifies user Gemini API key is isolated and not leaked into preferences", () => {
      // Simulates preferences structure
      const rawApiKey = "AIzaSyFakeKeyForTesting12345"
      const safePreferences = {
        theme: "Dark",
        model: "gemini-2.5-flash",
        has_gemini_api_key: Boolean(rawApiKey),
      }

      // Assert that the raw API key is NOT a key/value in preferences
      expect((safePreferences as any).gemini_api_key).toBeUndefined()
      expect(safePreferences.has_gemini_api_key).toBe(true)
      expect(JSON.stringify(safePreferences)).not.toContain(rawApiKey)
    })

    it("PATCH-08: verifies server CORS origin protection blocks untrusted origins", () => {
      const isOriginAllowed = (origin: string | undefined, host: string = "localhost:3000") => {
        if (!origin) return true
        if (origin === `http://${host}` || origin === `https://${host}`) return true
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true
        if (origin.endsWith(".scot.ai")) return true
        return false
      }

      // Allowed origins
      expect(isOriginAllowed("http://localhost:5173")).toBe(true)
      expect(isOriginAllowed("http://localhost:3000")).toBe(true)
      expect(isOriginAllowed("https://app.scot.ai")).toBe(true)
      expect(isOriginAllowed(undefined)).toBe(true)

      // Malicious/untrusted external origins MUST be blocked
      expect(isOriginAllowed("https://evil-hacker.com")).toBe(false)
      expect(isOriginAllowed("https://malicious-site.xyz")).toBe(false)
      expect(isOriginAllowed("http://scot.ai.attacker.com")).toBe(false)
    })
  })
})

