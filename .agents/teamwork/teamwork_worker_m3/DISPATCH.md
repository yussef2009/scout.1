# Task Assignment: Milestone 3 — Posts & News Social UI + Multi-Type Publishing

## Identity
- Archetype: teamwork_worker
- Working directory: d:\scot1\.agents\teamwork\teamwork_worker_m3\
- Parent: Orchestrator (e15aed74-0fde-48af-be70-92fab3fb8f91)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive File Ownership
- `src/components/NewsBulletinCard.tsx`
- `src/components/SocialPostCard.tsx`
- `src/App.tsx` (Milestone 3: rendering NewsBulletinCard / SocialPostCard in FeedView, and multi-type publishing composer for ratings & highlight clips)
- `src/test/posts-news-publishing.test.tsx` (New unit & integration tests)

## Instructions
1. Read `d:\scot1\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically §R3 and user publishing requirements) and `d:\scot1\PROJECT.md`.
2. Create `src/components/NewsBulletinCard.tsx`:
   - Facebook/Instagram inspired news bulletin card layout for scouting bulletins, combine reports, tactical analysis, and talent announcements.
   - Header with author avatar, verified shield, role badge, timestamp, and colored category badge:
     - `SCOUTING BULLETIN` (amber/gold tag)
     - `COMBINE REPORT` (cyan tag)
     - `TACTICAL ANALYSIS` (emerald tag)
     - `TALENT ANNOUNCEMENT` (gold-bright tag)
   - Prominent bold news headline (`newsHeadline`).
   - Content description body.
   - Scot AI verified rating score display (e.g. `97/100`) and grade stamp (`GRADE A+`).
   - Biomechanical benchmark metrics strip (e.g. `COUNTER-PRESS: 3.2s`, `MOVEMENT SYMMETRY: 98.2%`).
   - 16:9 media container with 60 FPS vision tracking badges.
   - Social engagement action bar: Respects/Likes, Comments, Save to Scout Vault, Share, and Verified Record stamp.
   - Expandable comments drawer.
3. Create `src/components/SocialPostCard.tsx`:
   - Facebook/Instagram inspired athletic post card with cyber-gold theme.
   - Clean author header, verified badge, rating badge, media container, engagement bar.
4. Update `src/App.tsx`:
   - In `posts-stack`, render:
     - If `isReel`: `<ReelCard9x16 ... />` (already implemented)
     - If `isNews`: `<NewsBulletinCard ... />`
     - Otherwise: `<SocialPostCard ... />` (or styled dispatch post)
   - Upgrade the dispatch composer (`create-post-card`):
     - Keep existing test hooks intact: `AI BIOMECHANICS LOG` badge, `ATTACH TELEMETRY TAG:`, `PUBLISH INTEL` button.
     - Add stream type selector buttons: `DISPATCH`, `REEL (9:16 HIGHLIGHT)`, and `NEWS BULLETIN`.
     - When `NEWS BULLETIN` is selected: inputs for `newsCategory` (Scouting Bulletin, Combine Report, Tactical Analysis, Talent Announcement) and `newsHeadline`.
     - When `REEL` is selected: highlight clip selector and duration.
     - Add Scot AI Rating input (slider or number 50-100) with dynamic live grade display (`A+`, `A`, `B+`, etc.).
     - Highlight clip footage selector from options.
     - Telemetry tag attachment pills.
     - On "PUBLISH INTEL", create the new post with appropriate `postType`/`streamType`, `rating`, `ratingGrade`, `newsHeadline`, `newsCategory`, `videoUrl`, prepend to `posts`, and save to `localStorage`.
5. Create comprehensive tests in `src/test/posts-news-publishing.test.tsx` verifying:
   - NewsBulletinCard rendering with headlines, category badges, rating displays, and benchmarks.
   - SocialPostCard rendering with rating badges.
   - Publishing dispatches, reels, and news bulletins with ratings and highlight clips into the feed stream.
   - Stream filtering correctly reflects newly published items.
6. Verify `npm test` and `npm run build` pass with zero errors.
7. Write your handoff report to `d:\scot1\.agents\teamwork\teamwork_worker_m3\handoff.md`.
8. Send a message to the orchestrator with your report and verification results.


## 2026-11-07T14:05:02Z
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are the Worker for Milestone 3: Posts & News Social UI + Multi-Type Publishing.
Your working directory is d:\scot1\.agents\teamwork\teamwork_worker_m3\
Read d:\scot1\.agents\teamwork\ORIGINAL_REQUEST.md, d:\scot1\PROJECT.md, and d:\scot1\.agents\teamwork\teamwork_worker_m3\DISPATCH.md.
You exclusively own:
- src/components/NewsBulletinCard.tsx
- src/components/SocialPostCard.tsx
- src/App.tsx (Milestone 3: NewsBulletinCard & SocialPostCard rendering in FeedView, multi-type publishing composer for ratings & highlight clips)
- src/test/posts-news-publishing.test.tsx
Implement the components and composer enhancements. Ensure npm run build and npm test continue to pass cleanly.
Write your handoff report to d:\scot1\.agents\teamwork\teamwork_worker_m3\handoff.md and notify the orchestrator (e15aed74-0fde-48af-be70-92fab3fb8f91) when complete.
