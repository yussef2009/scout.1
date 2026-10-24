// Admin store for Club & Scout registrations, special codes, and audit logs
import { supabase, type VerificationRequestRow, recordAdminAuditLog } from "../supabase"

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
  profileId?: string
  documentType?: string
  documentUrl?: string
  proofFileName?: string
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
    documentType: "National Federation Club License",
    proofFileName: "al_ahly_academy_accreditation.pdf",
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
    documentType: "FIBA Licensed Evaluator Badge",
    proofFileName: "fiba_talent_evaluator_94812.png",
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
    documentType: "National Club Registration License",
    proofFileName: "alex_falcons_cert.pdf",
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

export async function syncRegistrationsFromSupabase(): Promise<AdminRegistration[]> {
  try {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) {
      return getAdminRegistrations()
    }

    const localList = getAdminRegistrations()
    const converted: AdminRegistration[] = data.map((row: any) => {
      const p = row.profiles || {}
      const timeStr = row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
      return {
        id: row.id,
        role: (row.role === "Club" || row.role === "Scout") ? row.role : (row.role?.toLowerCase() === "club" ? "Club" : "Scout"),
        name: row.organization_name || p.full_name || "Applicant Organization",
        email: p.email || "No email",
        country: p.country || "Egypt",
        city: p.city || "Alexandria",
        sport: p.sport || "Basketball",
        licenseNumber: row.license_number || p.license_number || undefined,
        phone: row.phone || p.phone || undefined,
        benchmark: row.notes || undefined,
        submittedAt: timeStr,
        status: row.status === "approved" ? "verified" : row.status === "rejected" ? "rejected" : "pending",
        notes: row.admin_feedback || undefined,
        profileId: row.profile_id,
        documentType: row.document_type || "Accreditation Badge & License",
        documentUrl: row.document_url || undefined,
        proofFileName: row.proof_file_name || undefined,
      }
    })

    // Merge supabase items with local fallback items (prevent duplicate by id or email)
    const merged = [...converted]
    for (const local of localList) {
      if (!merged.some(m => m.id === local.id || (m.email && m.email === local.email))) {
        merged.push(local)
      }
    }

    saveAdminRegistrations(merged)
    return merged
  } catch (err) {
    console.warn("syncRegistrationsFromSupabase fallback to local:", err)
    return getAdminRegistrations()
  }
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
  saveAdminRegistrations(updated);

  // Asynchronously push to Supabase verification_requests
  (async () => {
    try {
      // Find matching profile if available
      let profileId = app.profileId
      if (!profileId && app.email) {
        const { data } = await supabase.from("profiles").select("id").eq("email", app.email).maybeSingle()
        if (data?.id) profileId = data.id
      }

      if (profileId) {
        await supabase.from("verification_requests").insert({
          profile_id: profileId,
          role: app.role,
          organization_name: app.name,
          license_number: app.licenseNumber,
          phone: app.phone,
          document_type: app.documentType || "Accreditation Badge & License",
          proof_file_name: app.proofFileName || "credential_proof.pdf",
          notes: app.benchmark,
          status: "pending",
        })
      }
    } catch (e) {
      console.warn("Async Supabase request dispatch ignored:", e)
    }
  })()

  return newReg
}

export function generateSpecialCode(role: "Club" | "Scout", entityName?: string): string {
  const prefix = role === "Club" ? "SCOT-CLUB" : "SCOT-SCOUT"
  const randNum = Math.floor(1000 + Math.random() * 9000)
  const letters = ["VIP", "PRO", "ELITE", "ACAD", "NET"][Math.floor(Math.random() * 5)]
  return `${prefix}-${randNum}-${letters}`
}

export function verifyAndApproveRegistration(
  id: string,
  notes?: string,
  adminEmail?: string
): { success: boolean; code?: string; reg?: AdminRegistration } {
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
  });

  // Sync to Supabase in background
  (async () => {
    try {
      // If id is UUID, update verification_requests
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase
          .from("verification_requests")
          .update({
            status: "approved",
            admin_feedback: notes || "Approved by Scot Admin",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", id)
      }

      // If target has profileId or we find profile by email, mark is_verified = true
      let targetProfileId = target.profileId
      if (!targetProfileId && target.email) {
        const { data } = await supabase.from("profiles").select("id").eq("email", target.email).maybeSingle()
        if (data?.id) targetProfileId = data.id
      }

      if (targetProfileId) {
        await supabase
          .from("profiles")
          .update({
            is_verified: true,
            status: "active",
            role: target.role === "Club" ? "Club" : "Scout",
          })
          .eq("id", targetProfileId)
      }

      await recordAdminAuditLog({
        action: "APPROVE_ACCREDITATION",
        target_type: "verification_request",
        target_id: id,
        admin_email: adminEmail || "admin@scot.io",
        details: {
          organization: target.name,
          role: target.role,
          issuedCode,
          notes,
        },
      })
    } catch (e) {
      console.warn("Async Supabase approval sync exception:", e)
    }
  })()

  return { success: true, code: issuedCode, reg: updated.find((r) => r.id === id) }
}

export function rejectRegistration(id: string, reason?: string, adminEmail?: string): boolean {
  const all = getAdminRegistrations()
  const target = all.find((r) => r.id === id)
  const updated = all.map((r) => {
    if (r.id !== id) return r
    return {
      ...r,
      status: "rejected" as const,
      notes: reason || "Credentials could not be verified with sporting regulatory body.",
    }
  })
  saveAdminRegistrations(updated);

  // Sync to Supabase in background
  (async () => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      if (isUuid) {
        await supabase
          .from("verification_requests")
          .update({
            status: "rejected",
            admin_feedback: reason || "Credentials could not be verified",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", id)
      }

      await recordAdminAuditLog({
        action: "REJECT_ACCREDITATION",
        target_type: "verification_request",
        target_id: id,
        admin_email: adminEmail || "admin@scot.io",
        details: {
          organization: target?.name,
          role: target?.role,
          reason,
        },
      })
    } catch (e) {
      console.warn("Async Supabase rejection sync exception:", e)
    }
  })()

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
