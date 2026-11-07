# Task Assignment: Milestone 2 — 9:16 Vertical Highlight Reels UI & Actions

## Identity
- Archetype: teamwork_worker
- Working directory: d:\scot1\.agents\teamwork\teamwork_worker_m2\
- Parent: Orchestrator (e15aed74-0fde-48af-be70-92fab3fb8f91)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive File Ownership
- `src/components/ReelCard9x16.tsx`
- `src/App.tsx` (Integrating ReelCard9x16 rendering in `posts-stack` for reels)
- `src/test/reels-feed.test.tsx` (New unit & component tests for ReelCard9x16)

## Instructions
1. Read `d:\scot1\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically §R2) and `d:\scot1\PROJECT.md`.
2. Inspect `src/components/SocialHighlightCard9x16.tsx` for cyber-athletic color tokens and HUD patterns.
3. Create `src/components/ReelCard9x16.tsx` implementing:
   - **Vertical 9:16 Container**:
     - `aspectRatio: "9 / 16"` (e.g. `maxWidth: "400px"`, `minHeight: "600px"`, rounded 20px, cyber-gold border `rgba(251, 191, 36, 0.35)`, deep midnight background).
     - Cyber-gold corner brackets (4 `L`-shaped reticles in the corners).
     - Subtle scanline overlay (`className="hud-scanlines-overlay"` with `pointerEvents: "none"`).
   - **Athlete Profile & Follow Action (Bottom-left)**:
     - Athlete avatar with role-colored glow ring, name, verified shield (`className="verified-shield-icon"`).
     - Sport tag (e.g. `BASKETBALL · PG`).
     - Interactive `+ Follow` / `Following ✓` button hooked to `isFollowing` and `onToggleFollow(authorName)`.
     - Reel caption and kinematic telemetry pills (e.g., `78.4 CM`, `0.83 SEC`, `3.84 M/S²`).
   - **Right-Hand Floating Action Bar (FB/IG Reels style)**:
     - Likes / Hearts button with heart icon, like counter, and animated reaction (`className="reel-action-btn like"`, with `liked` class when liked).
     - Comments bubble button with comment count opening comments drawer (`className="reel-action-btn comments"`).
     - Share button (paper plane / arrow) with clipboard link copy and toast notification (`className="reel-action-btn share"`).
     - Audio / Mute toggle button (speaker icon) controlling audio state (`className="audio-toggle-btn"` with `muted` or `unmuted` class).
     - Scout rating shield badge displaying numeric overall score (e.g. `94/100` or `94`) with cyber-gold glow (`className="reel-rating-shield"`).
   - **Biometric HUD Overlay**:
     - Top-left: Live tracking badge (`className="hud-badge"` with `hud-pulse-dot` and text `"60 FPS · YOLOv11 VISION"` or `"60 FPS · AI VISION"`).
     - Top-right: Rating grade stamp (`className="reel-grade-stamp"` e.g. `"GRADE A+"` or `"BIOMECHANICS VERIFIED"`).
   - **Highlight Clip Playback**:
     - Match video or keyframe preview (`className="reel-video"` or `className="post-media-preview"`).
     - Duration progress scrubber at bottom (`className="reel-scrubber"`).
     - Click-to-play/pause toggle with play icon overlay when paused.
4. Update `src/App.tsx`:
   - Import `ReelCard9x16` from `./components/ReelCard9x16`.
   - In `FeedView`, inside `posts-stack`, check `post.postType === "reel" || post.streamType === "reel"`.
   - If reel, render `<ReelCard9x16 ... />` with all required callbacks (`isFollowing`, `onToggleFollow`, `onToggleLike`, `onToggleComments`, `onShare`, `onSelectProfile`).
   - If not reel, render existing card layout (or post card).
5. Author dedicated tests in `src/test/reels-feed.test.tsx` verifying all features of ReelCard9x16.
6. Verify `npm run build` and `npx vitest run src/test/explore-page.test.tsx src/test/explore-stream-tabs.test.tsx src/test/reels-feed.test.tsx` pass 100%.
7. Write your handoff report to `d:\scot1\.agents\teamwork\teamwork_worker_m2\handoff.md`.
8. Send a message to the orchestrator with your report.


## 2026-11-07T13:41:26Z
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are the Worker for Milestone 2: 9:16 Vertical Highlight Reels UI & Actions.
Your working directory is d:\scot1\.agents\teamwork\teamwork_worker_m2\
Read d:\scot1\.agents\teamwork\ORIGINAL_REQUEST.md, d:\scot1\PROJECT.md, and d:\scot1\.agents\teamwork\teamwork_worker_m2\DISPATCH.md.
You exclusively own:
- src/components/ReelCard9x16.tsx
- src/App.tsx (wiring ReelCard9x16 into posts-stack for reels)
- src/test/reels-feed.test.tsx
Implement ReelCard9x16 and integrate into FeedView. Ensure all verification tests and npm run build pass cleanly.
Write your handoff report to d:\scot1\.agents\teamwork\teamwork_worker_m2\handoff.md and notify the orchestrator (e15aed74-0fde-48af-be70-92fab3fb8f91) when complete.
