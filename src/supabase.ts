import { createClient, type User } from "@supabase/supabase-js";
import { projectId, publicAnonKey as legacyAnonKey } from "../utils/supabase/info";
import { getActiveAdminSession } from "./admin/adminInfo";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  sport: string;
  country: string;
  city: string;
  preferences: Json;
  is_verified?: boolean;
  status?: "active" | "suspended" | "banned" | string;
  ban_reason?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  organization_type?: string | null;
  license_number?: string | null;
  created_at: string;
  updated_at: string;
};

export type VerificationRequestRow = {
  id: string;
  profile_id: string;
  role: "Club" | "Scout" | string;
  organization_name: string;
  license_number?: string | null;
  phone?: string | null;
  document_url?: string | null;
  document_type: string;
  proof_file_name?: string | null;
  notes?: string | null;
  status: "pending" | "approved" | "rejected";
  admin_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: ProfileRow | null;
};

export interface SportMetricDefinition {
  key: string;
  label: string;
  unit: string;
  defaultValue: number | string;
  minThreshold: number;
  maxThreshold: number;
  isVisible: boolean;
  isHighlighted?: boolean;
  category: "Kinematics" | "Dynamics" | "Neuromuscular" | "Safety" | "Speed" | "Agility" | "Skill" | "Reach" | "Approach" | "Power" | "Mechanics" | string;
}

export type SportSchemaRow = {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
  metrics: SportMetricDefinition[];
  created_at: string;
  updated_at: string;
};

export type AdminAuditLogRow = {
  id: string;
  admin_id?: string | null;
  admin_email?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      verification_requests: {
        Row: VerificationRequestRow;
        Insert: Partial<VerificationRequestRow> & { profile_id: string; role: string; organization_name: string };
        Update: Partial<VerificationRequestRow>;
        Relationships: [];
      };
      sport_schemas: {
        Row: SportSchemaRow;
        Insert: Partial<SportSchemaRow> & { id: string; name: string };
        Update: Partial<SportSchemaRow>;
        Relationships: [];
      };
      admin_audit_logs: {
        Row: AdminAuditLogRow;
        Insert: Partial<AdminAuditLogRow> & { action: string; target_type: string; target_id: string };
        Update: Partial<AdminAuditLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Connected Supabase project configuration (siolmrynjrusybcrwixb)
const DEFAULT_SUPABASE_URL = "https://siolmrynjrusybcrwixb.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_B84Adhf0eTk3hLGcOI0oAw_q9uH8Tng";

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const supabaseUrl = envUrl || (projectId ? `https://${projectId}.supabase.co` : "") || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = envKey || legacyAnonKey || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

export const isSupabaseConfigured = true;

export type SupabaseUser = User;

// ==========================================
// Admin Supabase Service Helpers
// ==========================================

export async function checkAdminClearance(userOrId: SupabaseUser | string | null): Promise<boolean> {
  if (!userOrId) return false;
  const uid = typeof userOrId === "string" ? userOrId : userOrId.id;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_verified, status")
      .eq("id", uid)
      .maybeSingle();

    if (error || !data) return false;
    const roleLower = (data.role || "").toLowerCase();
    return roleLower === "admin" && data.status !== "banned" && data.status !== "suspended";
  } catch {
    return false;
  }
}

export async function fetchAdminProfiles(): Promise<ProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch profiles via Supabase, checking fallback:", error.message);
      return [];
    }
    return (data || []) as ProfileRow[];
  } catch (err) {
    console.error("fetchAdminProfiles exception:", err);
    return [];
  }
}

export function isAuthorizedAdminOperation(): boolean {
  const activeSession = getActiveAdminSession();
  return Boolean(activeSession && activeSession.role === "admin");
}

export async function updateAdminProfile(id: string, updates: Partial<ProfileRow>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isAuthorizedAdminOperation()) {
      return { success: false, error: "Unauthorized: Administrator clearance required." };
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update profile" };
  }
}

export async function fetchAdminVerificationRequests(): Promise<VerificationRequestRow[]> {
  try {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchAdminVerificationRequests warning:", error.message);
      return [];
    }
    return (data || []) as VerificationRequestRow[];
  } catch (err) {
    console.error("fetchAdminVerificationRequests exception:", err);
    return [];
  }
}

export async function updateAdminVerificationRequest(
  id: string,
  updates: Partial<VerificationRequestRow>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isAuthorizedAdminOperation()) {
      return { success: false, error: "Unauthorized: Administrator clearance required." };
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("verification_requests")
      .update(payload)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update verification request" };
  }
}

export async function fetchAdminSportSchemas(): Promise<SportSchemaRow[]> {
  try {
    const { data, error } = await supabase
      .from("sport_schemas")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.warn("fetchAdminSportSchemas warning:", error.message);
      return [];
    }
    return (data || []) as SportSchemaRow[];
  } catch (err) {
    console.error("fetchAdminSportSchemas exception:", err);
    return [];
  }
}

export async function upsertAdminSportSchema(
  schema: Omit<SportSchemaRow, "created_at" | "updated_at">
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isAuthorizedAdminOperation()) {
      return { success: false, error: "Unauthorized: Administrator clearance required." };
    }

    const payload = {
      ...schema,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("sport_schemas")
      .upsert(payload, { onConflict: "id" });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save sport schema" };
  }
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLogRow[]> {
  try {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("fetchAdminAuditLogs warning:", error.message);
      return [];
    }
    return (data || []) as AdminAuditLogRow[];
  } catch (err) {
    console.error("fetchAdminAuditLogs exception:", err);
    return [];
  }
}

export async function recordAdminAuditLog(entry: {
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, any>;
  admin_id?: string;
  admin_email?: string;
}): Promise<void> {
  try {
    await supabase.from("admin_audit_logs").insert({
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      details: entry.details || {},
      admin_id: entry.admin_id,
      admin_email: entry.admin_email,
    });
  } catch (err) {
    console.error("recordAdminAuditLog error:", err);
  }
}
