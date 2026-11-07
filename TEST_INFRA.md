# E2E Test Infra: Scot AI Explore Feed Social Architecture

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md` and user specifications, not internal implementation details.
- Framework: Vitest v5.1.0 with `@testing-library/react` and `jsdom`.
- Execution command: `npm test` (`vitest run`).
- Design Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing across 4 distinct tiers.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|--------|:------:|:------:|:------:|:------:|
| 1 | Stream Filter Tabs ("All", "Reels", "News") | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Stream Filtering (All/Reels/News) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | 9:16 Reels Container & Layout | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 4 | Athlete Profile & Follow Action | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 5 | Right Floating Action Bar (Likes, Comments, Share, Audio) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | Biometric HUD Overlay (60 FPS, Reticles, Telemetry) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | FB/IG Inspired Social Post Cards | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 8 | News Bulletin Cards & Categories | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 9 | Rating Score & Grade Stamp Display | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 10 | Publishing Flow (Ratings & Highlight Clips) | ORIGINAL_REQUEST §R2, R3 | 5 | 5 | ✓ | ✓ |
| 11 | Build and Baseline Integrity | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Suite Location: `src/test/explore-reels-news.test.tsx` and existing `src/test/explore-page.test.tsx`.
- Test Runner: `vitest run` invoked via `npm test`.
- Configuration: `vitest.config.ts` configured with `testTimeout: 15000` to prevent JSDOM timeout during concurrent thread runs.
- Pass/Fail semantics: All tests must assert DOM presence, accessible roles, state transitions, and interactive events. Exit code 0 required.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Talent Scout Combines: Scout filters to Reels, inspects 9:16 vertical video with 60 FPS HUD, toggles audio, and follows player | F1, F2, F3, F4, F5, F6 | High |
| 2 | Official Announcement: Scout switches to News, inspects Combine Report with consensus rating and biometric benchmarks | F1, F2, F8, F9 | High |
| 3 | Athlete Highlight Publishing: User opens composer, selects 9:16 Reel, sets Scot Rating (95/100), attaches 60 FPS clip, publishes to feed, verifies under Reels and All tabs | F1, F2, F3, F6, F9, F10 | High |
| 4 | Multi-Filter Interaction: Combining Stream Tab (Reels), Sport Filter (Basketball), and Search Query | F1, F2, F3, F7, F8 | High |
| 5 | Social Interaction Cycle: Like reel, open comments thread, share link to clipboard, toggle audio state | F4, F5, F7, F8 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 test cases per core feature area.
- Tier 2: Boundary conditions, empty state fallbacks, missing media fallbacks, permission handling.
- Tier 3: Pairwise feature interactions (Stream tabs × Sport filter, Stream tabs × Search, Composer × Stream injection).
- Tier 4: Comprehensive real-world multi-step user scenarios.
- Baseline: 100% pass on all 75 existing tests.
