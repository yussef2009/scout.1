/// <reference path="./deno.d.ts" />
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { withSupabase } from "npm:@supabase/server@1/adapters/hono";
import type { SupabaseContext } from "npm:@supabase/server@1";
import * as kv from "./kv_store.tsx";

type AppEnv = { Variables: { supabaseContext: SupabaseContext } };
const app = new Hono<AppEnv>();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check — includes timestamp and version
app.get("/make-server-72672cc6/health", (c: any) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.2.0" });
});

// Get authenticated user's own full profile
app.get(
  "/make-server-72672cc6/profile",
  withSupabase({ auth: "user" }),
  async (c: any) => {
    const { supabase, userClaims } = c.var.supabaseContext;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userClaims.id)
      .maybeSingle();
    if (error) {
      console.error("Could not load the authenticated user's profile:", error);
      return c.json({ error: "Could not load the authenticated user's profile." }, 500);
    }
    if (!data) return c.json({ error: "Profile not found." }, 404);
    return c.json({ profile: data });
  },
);

// Get a public profile by userId — filters out preference keys the owner marked private
app.get(
  "/make-server-72672cc6/profile/:userId",
  withSupabase({ auth: "user" }),
  async (c: any) => {
    const { supabase } = c.var.supabaseContext;
    const userId = c.req.param("userId");
    if (!userId) return c.json({ error: "User ID is required." }, 400);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, sport, country, city, preferences, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Could not load public profile:", error);
      return c.json({ error: "Could not load profile." }, 500);
    }
    if (!data) return c.json({ error: "Profile not found." }, 404);

    // Strip fields the profile owner marked private
    const prefs = data.preferences as Record<string, unknown> | null;
    const privateFields: string[] = Array.isArray(prefs?.privateFields) ? prefs.privateFields as string[] : [];
    const publicPrefs: Record<string, unknown> = {};
    if (prefs) {
      for (const [key, value] of Object.entries(prefs)) {
        if (!privateFields.includes(key) && key !== "privateFields") {
          publicPrefs[key] = value;
        }
      }
    }

    // Explicitly redact top-level columns if flagged private
    const sanitizedProfile = {
      ...data,
      city: privateFields.includes("city") ? "[HIDDEN]" : data.city,
      country: privateFields.includes("country") ? "[HIDDEN]" : data.country,
      sport: privateFields.includes("sport") ? "[HIDDEN]" : data.sport,
      created_at: privateFields.includes("joinDate") ? null : data.created_at,
      preferences: publicPrefs,
    };

    return c.json({ profile: sanitizedProfile });
  },
);

// Search profiles — paginated, filterable
app.get(
  "/make-server-72672cc6/profiles/search",
  withSupabase({ auth: "user" }),
  async (c: any) => {
    const { supabase } = c.var.supabaseContext;
    const q = (c.req.query("q") ?? "").trim().slice(0, 100);
    const role = (c.req.query("role") ?? "").trim().slice(0, 50);
    const sport = (c.req.query("sport") ?? "").trim().slice(0, 50);
    const rawLimit = parseInt(c.req.query("limit") ?? "20", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 50);

    let query = supabase
      .from("profiles")
      .select("id, full_name, role, sport, country, city, created_at")
      .limit(limit);

    if (q) {
      // Escape PostgREST wildcard characters to prevent pattern injection
      const sanitizedQ = q.replace(/[%_]/g, "\\$&");
      query = query.ilike("full_name", `%${sanitizedQ}%`);
    }
    if (role) query = query.eq("role", role);
    if (sport) query = query.eq("sport", sport);

    const { data, error } = await query;
    if (error) return c.json({ error: "Search failed." }, 500);
    return c.json({ profiles: data ?? [] });
  },
);

// Partial-update own profile
app.put(
  "/make-server-72672cc6/profile",
  withSupabase({ auth: "user" }),
  async (c: any) => {
    const { supabase, userClaims } = c.var.supabaseContext;
    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON body." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return c.json({ error: "Body must be a JSON object." }, 400);
    }
    const update = body as Record<string, unknown>;
    const allowed = ["full_name", "sport", "country", "city", "preferences"];
    const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in update) sanitized[key] = update[key];
    }
    const { data, error } = await supabase
      .from("profiles")
      .update(sanitized)
      .eq("id", userClaims.id)
      .select()
      .single();
    if (error) return c.json({ error: `Could not update profile: ${error.message}` }, 500);
    return c.json({ profile: data });
  },
);

Deno.serve(app.fetch);