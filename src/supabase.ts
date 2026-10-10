import { createClient, type User } from "@supabase/supabase-js";
import { projectId, publicAnonKey as legacyAnonKey } from "../utils/supabase/info";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  sport: string;
  country: string;
  city: string;
  preferences: Json;
  created_at: string;
  updated_at: string;
};

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string;
          role?: string;
          sport?: string;
          country?: string;
          city?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string;
          role?: string;
          sport?: string;
          country?: string;
          city?: string;
          preferences?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
