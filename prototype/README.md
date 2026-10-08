# Prototype Archive (Historical Reference)

This directory contains legacy interface components, earlier mockups, and client-side proof-of-concept scripts from earlier iterations of ScoutAI.

## Archived Files
- `index.html`: Legacy single-page interface with Chart.js and manual DOM manipulation.
- `app.js`: Legacy vanilla JavaScript application logic, dynamic Gemini API resolution fallback chains, and player detection prototypes.
- `style.css`: Legacy stylesheet for the prototype interface.

## Isolation Notice
- **Decoupled from Build**: These files are strictly historical references and are not bundled or linked by the active production Vite / React / TypeScript build system (`src/`).
- **Watch Ignored**: Vite development server file watcher ignores `**/prototype/**`.
- **TypeScript Excluded**: `tsconfig.json` includes only `src` and `vite.config.ts`.
