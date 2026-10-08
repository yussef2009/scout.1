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

// Health check endpoint
app.get("/make-server-72672cc6/health", (c) => {
  return c.json({ status: "ok" });
});

app.get(
  "/make-server-72672cc6/profile",
  withSupabase({ auth: "user" }),
  async (c) => {
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

Deno.serve(app.fetch);