# Task Assignment: Milestone 1 — Feed Filter Tabs & Extended Data Models

## Identity
- Archetype: teamwork_worker
- Working directory: d:\scot1\.agents\teamwork\teamwork_worker_m1\
- Parent: Orchestrator (e15aed74-0fde-48af-be70-92fab3fb8f91)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive File Ownership
- `src/components/ExploreStreamTabs.tsx`
- `src/App.tsx` (Milestone 1 changes: types, stream filter state, tab integration, initial posts seed data)

## Instructions
1. Read `d:\scot1\.agents\teamwork\ORIGINAL_REQUEST.md` and `d:\scot1\PROJECT.md`.
2. Inspect `src/App.tsx`, specifically lines 6030-7050 (`FeedPost`, `INITIAL_POSTS`, `FeedView`).
3. Create `src/components/ExploreStreamTabs.tsx`:
   - Small navigation/filter tabs for "All", "Reels", and "News".
   - Accessible with `role="tablist"` and `role="tab"` buttons with `aria-selected`.
   - Small cyber-gold pill aesthetic matching Scot AI dark theme (`#fbbf24`, `--panel`, etc.).
   - Count badges for each stream type (`counts.all`, `counts.reels`, `counts.news`).
4. Update `src/App.tsx`:
   - Extend `FeedPost` type with `postType?: "dispatch" | "reel" | "news"` (and optional `streamType`), `rating?: number`, `ratingGrade?: string`, `newsCategory?: string`, `newsHeadline?: string`, `videoUrl?: string`, `isFollowing?: boolean`, `isAudioMuted?: boolean`.
   - In `FeedView`, add state: `const [streamFilter, setStreamFilter] = useState<"all" | "reels" | "news">("all")`.
   - Mount `<ExploreStreamTabs ... />` at the top of the feed view or directly above `feed-filters-nav`.
   - Compute counts for all, reels, and news based on `posts`.
   - Apply `streamFilter` to filter displayed posts:
     - `"all"`: all posts.
     - `"reels"`: only posts where `postType === "reel"` or `streamType === "reel"`.
     - `"news"`: only posts where `postType === "news"` or `streamType === "news"`.
   - Update `INITIAL_POSTS` in `src/App.tsx` to tag existing items with `postType` (e.g. `post-1` as `"news"` / scouting bulletin, `post-2` as `"reel"` / 9:16 vertical jump, `post-3` as `"news"` / scouting bulletin, `post-4` as `"news"` / youth audit report, `post-5` as `"reel"` / basketball shooting mechanics) and add realistic ratings/headlines.
   - Ensure existing tests in `src/test/explore-page.test.tsx` continue to pass 100%!
5. Run `npx vitest run src/test/explore-page.test.tsx` and `npm run build` to verify nothing is broken.
6. Write your handoff report to `d:\scot1\.agents\teamwork\teamwork_worker_m1\handoff.md`.
7. Send a message to the orchestrator with your report and verification results.


## 2026-11-07T13:19:49Z
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are the Worker for Milestone 1: Feed Filter Tabs & Extended Data Models.
Your working directory is d:\scot1\.agents\teamwork\teamwork_worker_m1\
Read d:\scot1\.agents\teamwork\ORIGINAL_REQUEST.md, d:\scot1\PROJECT.md, and d:\scot1\.agents\teamwork\teamwork_worker_m1\DISPATCH.md.
You exclusively own:
- src/components/ExploreStreamTabs.tsx
- src/App.tsx (Milestone 1 integration: types, state, stream filter logic, seed posts)
Implement the components and integrations as specified.
Ensure npm run build and existing tests in src/test/explore-page.test.tsx continue to pass cleanly.
Write your handoff report to d:\scot1\.agents\teamwork\teamwork_worker_m1\handoff.md.
Notify the orchestrator (e15aed74-0fde-48af-be70-92fab3fb8f91) when done.


## 2026-11-07T13:37:08Z
**Context**: Milestone 1 Implementation (Feed Filter Tabs & Data Models)
**Content**: Checking on your progress. Code changes in `src/components/ExploreStreamTabs.tsx` and `src/App.tsx` look great. Have you run `npx vitest run src/test/explore-page.test.tsx` and `npm run build`?
**Action**: Please run verification, complete your handoff report at `d:\scot1\.agents\teamwork\teamwork_worker_m1\handoff.md`, and notify me.
