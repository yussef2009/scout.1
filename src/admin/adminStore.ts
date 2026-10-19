// Admin store for Club & Scout registrations, special codes, and audit logs
export interface AdminRegistration {
  id: string
  role: "Club" | "Scout"
  name: string
  email: string
  country: string
  city: string
  sport: string
  organizationType?: string
  licenseNumber?: string
  phone?: string
  benchmark?: string
  submittedAt: string
  status: "pending" | "verified" | "rejected"
  specialCode?: string
  verifiedAt?: string
  notes?: string
}

export interface SpecialCodeEntry {
  code: string
  role: "Club" | "Scout"
  issuedTo: string
  issuedAt: string
  status: "active" | "revoked"
  registrationId?: string
}

const STORAGE_KEY_REGISTRATIONS = "scot_admin_registrations"
const STORAGE_KEY_CODES = "scot_admin_special_codes"

// Initial preloaded data so the admin portal is immediately functional and demonstrative
export const INITIAL_REGISTRATIONS: AdminRegistration[] = [
  {
    id: "REG-2026-CLUB-881",
    role: "Club",
    name: "Al Ahly SC Youth Academy",
    email: "academy@alahlyegypt.com",
    country: "Egypt",
    city: "Cairo",
    sport: "Soccer",
    organizationType: "Premier Youth Academy",
    licenseNumber: "EFA-YTH-2026-89",
    phone: "+20 100 555 8891",
    benchmark: "Sub-3.2s counter-press transition, 95% passing accuracy in final third",
    submittedAt: "Today, 14:20",
    status: "pending",
  },
  {
    id: "REG-2026-SCOUT-412",
    role: "Scout",
    name: "EMEA Pro Talent Network",
    email: "recruitment@emeascouts.eu",
    country: "Spain",
    city: "Madrid",
    sport: "Basketball",
    organizationType: "FIBA Licensed Agency",
    licenseNumber: "FIBA-EU-94812",
    phone: "+34 912 400 112",
    benchmark: "Evaluating wingers with 75+ cm vertical jump and high reactive agility",
    submittedAt: "Yesterday, 18:45",
    status: "pending",
  },
  {
    id: "REG-2026-CLUB-104",
    role: "Club",
    name: "Alexandria Falcons Sports Club",
    email: "contact@alexfalcons.org",
    country: "Egypt",
    city: "Alexandria",
    sport: "Basketball",
    organizationType: "Regional League Club",
    licenseNumber: "EBBF-ALX-441",
    phone: "+20 122 770 3341",
    benchmark: "High-cadence transition offense and shot release under 0.40s",
    submittedAt: "2 days ago",
    status: "verified",
    specialCode: "SCOT-CLUB-VIP",
    verifiedAt: "2 days ago",
    notes: "Official verification passed via Egyptian Basketball Federation credentials.",
  },
]

export const BASE_CLUB_CODES = [
  "SCOT-CLUB-VIP",
  "FIFA-ACAD-2026",
  "ELITE-CLUB-77",
]

export const BASE_SCOUT_CODES = [
  "SCOT-PRO-SCOUT",
  "UEFA-SCT-88",
  "FIBA-TALENT-99",
]

export function getAdminRegistrations(): AdminRegistration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRATIONS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(INITIAL_REGISTRATIONS))
      return INITIAL_REGISTRATIONS
    }
    return JSON.parse(raw) as AdminRegistration[]
  } catch {
    return INITIAL_REGISTRATIONS
  }
}

export function saveAdminRegistrations(regs: AdminRegistration[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(regs))
  } catch {}
}

export function submitClubOrScoutRegistration(app: Omit<AdminRegistration, "id" | "submittedAt" | "status">): AdminRegistration {
  const all = getAdminRegistrations()
  const randomNum = Math.floor(100 + Math.random() * 900)
  const id = `REG-2026-${app.role.toUpperCase()}-${randomNum}`
  const newReg: AdminRegistration = {
    ...app,
    id,
    submittedAt: "Just now",
    status: "pending",
  }
  const updated = [newReg, ...all]
  saveAdminRegistrations(updated)
  return newReg
}

export function generateSpecialCode(role: "Club" | "Scout", entityName?: string): string {
  const prefix = role === "Club" ? "SCOT-CLUB" : "SCOT-SCOUT"
  const randNum = Math.floor(1000 + Math.random() * 9000)
  const letters = ["VIP", "PRO", "ELITE", "ACAD", "NET"][Math.floor(Math.random() * 5)]
  return `${prefix}-${randNum}-${letters}`
}

export function verifyAndApproveRegistration(id: string, notes?: string): { success: boolean; code?: string; reg?: AdminRegistration } {
  const all = getAdminRegistrations()
  const target = all.find((r) => r.id === id)
  if (!target) return { success: false }

  const issuedCode = target.specialCode || generateSpecialCode(target.role, target.name)
  const updated: AdminRegistration[] = all.map((r) => {
    if (r.id !== id) return r
    return {
      ...r,
      status: "verified",
      specialCode: issuedCode,
      verifiedAt: "Just now",
      notes: notes || "Verified and issued cryptographic access credentials by Scot Administration.",
    }
  })
  saveAdminRegistrations(updated)

  // Store in special code registry
  addSpecialCode({
    code: issuedCode,
    role: target.role,
    issuedTo: target.name,
    issuedAt: "Just now",
    status: "active",
    registrationId: id,
  })

  return { success: true, code: issuedCode, reg: updated.find((r) => r.id === id) }
}

export function rejectRegistration(id: string, reason?: string): boolean {
  const all = getAdminRegistrations()
  const updated = all.map((r) => {
    if (r.id !== id) return r
    return {
      ...r,
      status: "rejected" as const,
      notes: reason || "Credentials could not be verified with sporting regulatory body.",
    }
  })
  saveAdminRegistrations(updated)
  return true
}

export function getSpecialCodes(): SpecialCodeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CODES)
    if (!raw) {
      const initial: SpecialCodeEntry[] = [
        { code: "SCOT-CLUB-VIP", role: "Club", issuedTo: "Alexandria Falcons Sports Club", issuedAt: "2 days ago", status: "active" },
        { code: "FIFA-ACAD-2026", role: "Club", issuedTo: "FIFA Regional Talent Academy", issuedAt: "5 days ago", status: "active" },
        { code: "ELITE-CLUB-77", role: "Club", issuedTo: "Elite Development Center", issuedAt: "1 week ago", status: "active" },
        { code: "SCOT-PRO-SCOUT", role: "Scout", issuedTo: "European Scouting Bureau", issuedAt: "3 days ago", status: "active" },
        { code: "UEFA-SCT-88", role: "Scout", issuedTo: "UEFA Talent Evaluation Group", issuedAt: "1 week ago", status: "active" },
        { code: "FIBA-TALENT-99", role: "Scout", issuedTo: "FIBA Certified Evaluators", issuedAt: "2 weeks ago", status: "active" },
      ]
      localStorage.setItem(STORAGE_KEY_CODES, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw) as SpecialCodeEntry[]
  } catch {
    return []
  }
}

export function addSpecialCode(entry: SpecialCodeEntry): void {
  try {
    const all = getSpecialCodes()
    const filtered = all.filter((c) => c.code.toUpperCase() !== entry.code.toUpperCase())
    localStorage.setItem(STORAGE_KEY_CODES, JSON.stringify([entry, ...filtered]))
  } catch {}
}

export function revokeSpecialCode(code: string): void {
  try {
    const all = getSpecialCodes()
    const updated = all.map((c) => c.code.toUpperCase() === code.toUpperCase() ? { ...c, status: "revoked" as const } : c)
    localStorage.setItem(STORAGE_KEY_CODES, JSON.stringify(updated))
  } catch {}
}

// Check if a code is valid for a given role (combining base codes and admin verified codes)
export function isValidClubCode(code: string): boolean {
  const clean = code.trim().toUpperCase()
  if (!clean) return false
  if (BASE_CLUB_CODES.includes(clean)) return true
  const custom = getSpecialCodes()
  return custom.some((c) => c.role === "Club" && c.status === "active" && c.code.toUpperCase() === clean)
}

export function isValidScoutCode(code: string): boolean {
  const clean = code.trim().toUpperCase()
  if (!clean) return false
  if (BASE_SCOUT_CODES.includes(clean)) return true
  const custom = getSpecialCodes()
  return custom.some((c) => c.role === "Scout" && c.status === "active" && c.code.toUpperCase() === clean)
}

export function getAllClubCodes(): string[] {
  const activeCustom = getSpecialCodes()
    .filter((c) => c.role === "Club" && c.status === "active")
    .map((c) => c.code.toUpperCase())
  return Array.from(new Set([...BASE_CLUB_CODES, ...activeCustom]))
}

export function getAllScoutCodes(): string[] {
  const activeCustom = getSpecialCodes()
    .filter((c) => c.role === "Scout" && c.status === "active")
    .map((c) => c.code.toUpperCase())
  return Array.from(new Set([...BASE_SCOUT_CODES, ...activeCustom]))
}
