# BRIEFING — 2026-11-07T13:17:00Z

## Mission
Mine, probe, and document exhaustive specifications for Explore Feed tabs (All, Reels, News), Instagram/Facebook-inspired Reels UI, Posts/News UI, and rating/highlight clip publishing for Scot AI.

## 🔒 My Identity
- Archetype: teamwork_spec_miner
- Roles: Specification Miner, Domain & Feature Analyst
- Working directory: d:\scot1\.agents\teamwork\teamwork_spec_miner_survey_1\
- Original parent: e15aed74-0fde-48af-be70-92fab3fb8f91
- Milestone: Requirements & UI Specification Mining

## 🔒 Key Constraints
- Extract precise requirements and social UI specifications for Explore feed, Reels, and Posts/News
- Map out all features for R1, R2, R3, R4, including data models, interaction models, FB/IG design patterns adapted to Scot AI's cyber-athletic dark and gold aesthetic
- Do NOT implement anything — read-only specification discovery
- Respect integrity mode: demo, do NOT copy core logic from existing open-source projects
- Write only to working directory d:\scot1\.agents\teamwork\teamwork_spec_miner_survey_1\
- Write handoff.md with 5 components: Observation, Logic Chain, Caveats, Conclusion, Verification Method

## Current Parent
- Conversation ID: e15aed74-0fde-48af-be70-92fab3fb8f91
- Updated: 2026-11-07T13:17:00Z

## Task Summary
- **What to build**: Specification report for Explore feed filter tabs (All, Reels, News), FB/IG-inspired Reels UI, FB/IG-inspired Posts and News UI, and user publishing of ratings & highlight clips in Scot AI cyber-athletic dark & gold theme.
- **Success criteria**: Exhaustive feature inventory (30 features discovered), edge cases (15 edge cases analyzed), data models, interaction models, visual styling specs, and verification plan.
- **Interface contracts**: ORIGINAL_REQUEST.md, DISPATCH.md
- **Code layout**: Existing Scot AI React + Vite codebase in `src/`

## Key Decisions Made
- Confirmed baseline test suite status (9 files, 75 passing tests) and build cleanliness (`npm run build`).
- Identified that existing tests in `src/test/explore-page.test.tsx` depend on role filter tabs and composer toggle (`+`), requiring the new stream filter tabs ("All", "Reels", "News") to co-exist cleanly.
- Mapped R2 9:16 vertical reels layout with signature Instagram/Facebook right-hand floating action bar (hearts/likes, comments, share, audio toggle, scout rating badge) and Scot AI biometric HUD overlay (60 FPS YOLOv11 tracker, cyber brackets, rating stamp).
- Mapped R3 Facebook/Instagram posts & news UI with prominent headlines, news category tagging (bulletin, combine report, tactical analysis, talent announcement), and verified rating badges.
- Formulated multi-type composer workflow enabling publishing of ratings (0-100 with dynamic grade), 9:16 highlight clips, and news bulletins.

## Artifact Index
- DISPATCH.md — Dispatch instructions and prompt
- progress.md — Liveness heartbeat and milestone tracker
- handoff.md — Comprehensive 5-component handoff specification report
