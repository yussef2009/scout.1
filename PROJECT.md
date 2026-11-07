# Project: Scot AI — Explore Feed Social Architecture, 9:16 Reels & News

## Architecture
Scot AI is a high-performance cyber-athletic intelligence web application built with React 19, Vite 8, Tailwind CSS v4, and TypeScript 5.7.
The Explore module (`FeedView` in `src/App.tsx`) provides scouting intelligence, biometric telemetry, talent radar, and social networking for athletes, clubs, and scouts.
This project extends Explore with:
1. **ExploreStreamTabs**: Small navigation/filter tabs ("All", "Reels", "News") with stream item counters.
2. **ReelCard9x16**: 9:16 vertical athletic highlight reel format inspired by Instagram and Facebook Reels, featuring athlete avatar and follow action, right-hand vertical floating action bar (hearts/likes, comments, share, audio toggle), and biometric HUD overlay (60 FPS YOLOv11 tracking, reticles, telemetry, rating stamp).
3. **NewsBulletinCard & SocialPostCard**: Facebook/Instagram-inspired feed posts and news bulletins (scouting bulletins, combine reports, tactical analysis, talent announcements) with ratings, grade stamps, and highlight clips in the cyber-athletic dark and gold aesthetic.
4. **Publishing Composer**: Multi-type composer enabling users to publish ratings, highlight clips, and bulletins with telemetry into the live feed stream.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stream Tabs UI | Small filter tabs for "All", "Reels", and "News" in FeedView | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Stream Filtering Logic | "All" shows combined stream; "Reels" shows only reels; "News" shows only bulletins/reports | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Stream Counter Badges | Dynamic item counts rendered inside stream tabs | M1 | Survey |
| 4 | FeedPost Data Extensions | Extended schema: `streamType`, `rating`, `ratingGrade`, `newsCategory`, `newsHeadline`, `videoUrl` | M1 | Survey |
| 5 | Initial Seed Data | Pre-populated realistic dispatches, 9:16 highlight reels, and news bulletins | M1 | Survey |
| 6 | 9:16 Vertical Card Container | Vertical 9:16 aspect ratio container with dark gold borders and scanline overlay | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Athlete Avatar & Follow Action | Profile avatar, role glow, athlete name, verified shield, and interactive "+ Follow" / "Following ✓" toggle | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Right Floating Bar: Likes | Floating vertical button with heart/bolt icon, like counter, and reaction toggle | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Right Floating Bar: Comments | Floating vertical button opening inline comments thread with counter | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Right Floating Bar: Share | Floating vertical share button copying link to clipboard with toast notification | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Right Floating Bar: Audio | Floating vertical audio toggle (mute/unmute) with speaker icon and state indicator | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Right Floating Bar: Rating Shield | Floating vertical gold badge showing scout rating score (e.g. 96/100) | M2 | ORIGINAL_REQUEST §R2 |
| 13 | Biometric HUD: 60 FPS Badge | Live computer vision tracking badge ("60 FPS · YOLOv11 VISION") with pulsing beacon | M2 | ORIGINAL_REQUEST §R2 |
| 14 | Biometric HUD: Reticles & Scanlines | High-tech cybernetic gold corner brackets and scanline overlay | M2 | ORIGINAL_REQUEST §R2 |
| 15 | Kinematic Telemetry HUD | Telemetry readouts (vertical elevation, hang time, velocity, release angle) overlaying reel | M2 | ORIGINAL_REQUEST §R2 |
| 16 | Highlight Playback & Scrubber | Interactive playback on reel frame with play/pause state and duration progress scrubber | M2 | ORIGINAL_REQUEST §R2 |
| 17 | Social Post Card | FB/IG inspired social post card layout adapted to cyber-athletic gold & dark palette | M3 | ORIGINAL_REQUEST §R3 |
| 18 | News Bulletin Card | Distinctive card for Scouting Bulletins, Combine Reports, Tactical Analysis, Talent Announcements | M3 | ORIGINAL_REQUEST §R3 |
| 19 | News Category Badges | High-contrast color-coded tags for bulletin categories | M3 | ORIGINAL_REQUEST §R3 |
| 20 | Prominent News Headlines | Bold Space Grotesk headline styling for news items | M3 | ORIGINAL_REQUEST §R3 |
| 21 | Rating Score & Grade Display | Verified athlete/squad rating display (e.g. 97/100) and grade stamp ("GRADE A+") | M3 | ORIGINAL_REQUEST §R3 |
| 22 | Social Engagement Bar | Respects/Likes, Comments, Save to Scout Vault, Share, and Verified Record stamp | M3 | ORIGINAL_REQUEST §R3 |
| 23 | Multi-Type Composer | Composer mode selector for Dispatch, 9:16 Reel, and News Bulletin | M3 | ORIGINAL_REQUEST |
| 24 | Rating Input & Grade Generator | Numeric/slider rating input (0-100) with dynamic live grade computation | M3 | ORIGINAL_REQUEST |
| 25 | Highlight Clip Selector | Selector for video highlight clips / match footage options | M3 | ORIGINAL_REQUEST |
| 26 | News Headline & Category Inputs | Form inputs for headline and category when publishing news bulletins | M3 | ORIGINAL_REQUEST |
| 27 | Stream Injection & Persistence | Prepend published item to stream and persist in localStorage | M3 | ORIGINAL_REQUEST |
| 28 | Baseline Test Preservation | Ensure existing 75 tests under `src/test/` continue to pass cleanly | M4 | ORIGINAL_REQUEST §R4 |
| 29 | Comprehensive E2E Test Suite | Automated test suite in `src/test/explore-reels-news.test.tsx` covering all 4 tiers | M4 | ORIGINAL_REQUEST §R4 |
| 30 | Production Build Verification | Ensure `npm run build` succeeds cleanly with 0 TypeScript/compilation errors | M4 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Design and publish E2E test suite in `src/test/explore-reels-news.test.tsx`, configure `vitest.config.ts`, publish `TEST_READY.md` | none | DONE |
| 1 | Feed Filter Tabs & Models | `src/components/ExploreStreamTabs.tsx`, `FeedPost` extensions, stream filtering state in `FeedView` | none | DONE |
| 2 | 9:16 Vertical Reels UI | `src/components/ReelCard9x16.tsx`, right floating action bar, follow action, biometric HUD overlay, playback scrubber | M1 | DONE |
| 3 | Posts, News & Publishing | `src/components/NewsBulletinCard.tsx`, `src/components/SocialPostCard.tsx`, multi-type publishing flow with ratings & clips | M1, M2 | DONE |
| 4 | Final E2E Test Pass & Audit | Execute full test suite (`npm test`), build check (`npm run build`), resolve any regressions, pass Forensic Integrity Audit | M1, M2, M3, E2E | DONE |

## Interface Contracts

### ExploreStreamTabs ↔ FeedView
```ts
export type StreamTab = "all" | "reels" | "news"

export interface ExploreStreamTabsProps {
  activeTab: StreamTab
  onSelectTab: (tab: StreamTab) => void
  counts: {
    all: number
    reels: number
    news: number
  }
}
```

### ReelCard9x16 ↔ FeedView
```ts
export interface ReelCard9x16Props {
  post: FeedPost
  isFollowing: boolean
  onToggleFollow: (authorName: string) => void
  onToggleLike: (postId: string) => void
  onToggleComments: (postId: string) => void
  onShare: (post: FeedPost) => void
  onSelectProfile?: (profile: any) => void
}
```

### NewsBulletinCard & SocialPostCard ↔ FeedView
```ts
export interface NewsBulletinCardProps {
  post: FeedPost
  onToggleLike: (postId: string) => void
  onToggleComments: (postId: string) => void
  onShare: (post: FeedPost) => void
  onSaveToVault?: (postId: string) => void
  onSelectProfile?: (profile: any) => void
}

export interface SocialPostCardProps {
  post: FeedPost
  onToggleLike: (postId: string) => void
  onToggleComments: (postId: string) => void
  onShare: (post: FeedPost) => void
  onSaveToVault?: (postId: string) => void
  onSelectProfile?: (profile: any) => void
}
```

## Code Layout
- `src/components/ExploreStreamTabs.tsx` — Small stream navigation tabs for "All", "Reels", "News"
- `src/components/ReelCard9x16.tsx` — 9:16 vertical athletic highlight reel card with HUD and floating action bar
- `src/components/NewsBulletinCard.tsx` — Facebook/Instagram inspired news bulletin card
- `src/components/SocialPostCard.tsx` — Facebook/Instagram inspired social post card with ratings
- `src/App.tsx` — `FeedView` integration, state management, composer, and data types
- `src/index.css` — Cyber-athletic dark and gold CSS utility styling
- `src/test/explore-reels-news.test.tsx` — Comprehensive E2E test suite (Tiers 1-4)
- `vitest.config.ts` — Test runner configuration with `testTimeout: 15000`
