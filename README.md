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

## Project structure

```text
.
├── index.html          # Vite entry
├── src/                # Active SCOT interface
├── prototype/          # Legacy ScoutAI mockup (unlinked)
├── supabase/           # Optional edge-function stubs
└── package.json
```
