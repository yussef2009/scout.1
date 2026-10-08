# SCOT

SCOT is a browser-native athletic performance platform for players, clubs, and scouts. The active application is a React + Vite workspace that turns on-device video analysis into sport-specific dashboards, role profiles, and verified reports.

The original ScoutAI HTML/CSS/JavaScript mockup is preserved as a reference under `prototype/` and is not part of the production build.

## Overview

- Sign in or register as a Player, Club / Academy, or Scout / Agent
- Open a sport-specific dashboard with filtered biomechanical metrics
- Manage account, theme, sport defaults, and local WebGPU vision settings

## Tech stack

- React 19
- Vite 8
- TypeScript
- Tailwind CSS v4

## Getting started

```bash
pnpm install
pnpm dev
```

Then open the printed local URL (default `http://127.0.0.1:5173`).

```bash
pnpm build
pnpm preview
```

## Supabase setup

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project URL and publishable/anon key from the Supabase dashboard. Never put a service-role key in browser environment variables.
2. Run [`supabase/migrations/20261008140000_create_profiles.sql`](./supabase/migrations/20261008140000_create_profiles.sql) in the Supabase SQL Editor (or apply it with the Supabase CLI).
3. In Supabase Authentication, enable Email and any OAuth providers used by the sign-in dialog. Add the local app URL and production URL to the allowed redirect URLs, and configure Google/Facebook provider credentials in Supabase.
4. The Supabase-hosted Edge Function receives `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, and `SUPABASE_JWKS` automatically. For a non-Supabase runtime, provide the server variables documented by [`@supabase/server`](https://github.com/supabase/server/blob/main/docs/environment-variables.md), including a secret key and `SUPABASE_JWKS_URL` for user-token verification. Never put a secret key in a `VITE_` variable or commit it.
5. Restart the Vite server after changing environment variables.

Email/password and Google/Facebook sign-in use Supabase Auth. Each authenticated user can read and update only their own profile row; role, sport, location, and interface/dashboard preferences are synchronized to that row. The Gemini API key remains in this browser's local storage and is not uploaded to Supabase.

The Edge Function exposes `GET /make-server-72672cc6/profile`, protected by `@supabase/server` user-JWT verification and profile-table RLS. The health endpoint remains public.

## Project structure

```text
.
├── index.html          # Vite entry
├── src/                # Active SCOT interface
├── prototype/          # Legacy ScoutAI mockup (unlinked)
├── supabase/           # Profile migration and optional edge functions
└── package.json
```
