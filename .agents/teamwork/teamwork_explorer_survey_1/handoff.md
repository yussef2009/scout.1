# Codebase Architecture Survey Report: Explore Feed, Reels & News

**Working Directory**: `d:\scot1\.agents\teamwork\teamwork_explorer_survey_1\`  
**Date**: 2026-11-07  
**Archetype**: teamwork_explorer  
**Status**: Completed  

---

## 1. Observation

### 1.1 Project Structure & Environment
- **Framework & Bundler**: React 19 (`^19.0.0`), Vite 8 (`^8.0.5`), Tailwind CSS v4 (`^4.0.0` via `@tailwindcss/vite`), TypeScript 5.7.
- **Testing Setup**: Vitest 5.1.0 (`vitest run`), `@testing-library/react` 16.3.3, `@testing-library/jest-dom` 7.0.1, `jsdom` 31.0.0.
- **Test Baseline**: Running `npm test` executes 9 test files with **75 tests passing (0 failures)**:
  - `src/test/security.test.ts` (24 passed)
  - `src/test/search-expand.test.tsx` (5 passed)
  - `src/test/video-analysis.test.ts` (6 passed)
  - `src/test/ui-ux.test.tsx` (10 passed)
  - `src/test/search-3d-popover.test.tsx` (6 passed)
  - `src/test/cloud-tools-connector.test.tsx` (5 passed)
  - `src/test/react-layout.test.tsx` (11 passed)
  - `src/test/sport-strip.test.tsx` (4 passed)
  - `src/test/explore-page.test.tsx` (4 passed)
- **Build Baseline**: Running `npm run build` succeeds cleanly in ~3.1 seconds with 0 TypeScript or bundling errors.

### 1.2 `src/App.tsx` & View Routing Architecture
- `src/App.tsx` is 10,898 lines and manages the primary application state:
  - Navigation state: `const [view, setView] = useState("Dashboard")` (`src/App.tsx:8575`).
  - Navigation bar (`src/App.tsx:9474-9495`):
    - `Dashboard`
    - `Explore` (`view === "Explore"`)
    - `Wearable`
    - `Profile`
  - When `view === "Explore" || view === "Home"` (`src/App.tsx:10191-10199`), it mounts:
    ```tsx
    <FeedView
      sport={sport}
      onSelectProfile={setViewingProfile}
      currentUserName={userName}
      currentUserRole={role}
      followingList={followingList}
    />
    ```
  - Follow state management (`src/App.tsx:8853-8871`):
    - `const [followingList, setFollowingList] = useState<string[]>(...)` persisted to `localStorage.getItem("scot_following")`.
    - `handleToggleFollow(targetName: string)` toggles athlete follow status.

### 1.3 `FeedView` Component Deep Dive (`src/App.tsx:6268-7053`)
The current `FeedView` layout consists of:
1. **Explore Header Hero (`src/App.tsx:6451-6521`)**:
   - Status kicker: `LIVE TALENT RADAR · 60 FPS COMPUTER VISION` with green beacon.
   - Title: `EXPLORE ATHLETIC INTEL & SCOUT NETWORK`.
   - Tagline and quick sport pills (`ALL SPORTS`, `BASKETBALL`, `SOCCER`, etc.).
   - High-tech stat badges (`12.8K+ INDEXED RECRUITS`, `1,420+ NETWORK SCOUTS`, `60 FPS COMPUTER VISION`, `99.2% DATA INTEGRITY`).
2. **Weekly Talent Spotlights Carousel (`src/App.tsx:6524-6579`)**:
   - Spotlights 4 athletes: Elena Rostova (Volleyball, 96/100), Omar Khalil (Basketball, 94/100), Tariq Mansour (Soccer, 91/100), Maya Lin (Combat Sports, 93/100).
   - Clicking an athlete executes `onSelectProfile(match)`.
3. **Feed Controls Bar (`src/App.tsx:6582-6655`)**:
   - Search input for athlete name, club, sport, or keyword.
   - Composer toggle button: `<button className="feed-new-dispatch-btn" title="Add new post (+)" aria-label="Add new post (+)">` displaying `+` or `✕`.
   - Role filter tabs (`ALL INTEL`, `FOLLOWING`, `VERIFIED ATHLETES`, `CLUBS & ACADEMIES`, `PRO SCOUTS`, `${sport.toUpperCase()} ONLY`).
4. **Performance Intel Composer (`src/App.tsx:6658-6748`)**:
   - Header with author avatar and `AI BIOMECHANICS LOG` badge.
   - Content textarea.
   - Telemetry tags picker: `ATTACH TELEMETRY TAG:` with pills (`VERTICAL JUMP`, `SPRINT SPEED`, `HANG TIME`, `ACCELERATION`, `GROUND CONTACT`, `RELEASE ANGLE`).
   - Selectors for `SPORT` and `FOOTAGE`.
   - Button: `PUBLISH INTEL`.
5. **Posts Stack (`src/App.tsx:6751-7050`)**:
   - Renders `FeedPost` cards with author avatar, role badge, telemetry strip, content, 16:9 media preview with HUD overlay (`60 FPS · AI VISION TRACKING`, `BIOMECHANICS VERIFIED`), and footer action buttons (Respects/Likes, Comments, Save to Vault, Share).
   - Expandable comments drawer with inline comment authoring.

### 1.4 Data Structures & Mock Data (`src/App.tsx:6032-6194`)
- Current `FeedPost` definition:
  ```ts
  export type PostComment = {
    id: string
    authorName: string
    authorRole: string
    content: string
    timestamp: string
  }

  export type FeedPost = {
    id: string
    authorName: string
    authorRole: "Player" | "Club" | "Scout"
    authorImage: string
    sport: string
    timestamp: string
    content: string
    mediaUrl?: string
    likes: number
    isLiked?: boolean
    commentsCount: number
    comments?: PostComment[]
    metrics?: { label: string; value: string }[]
    isVerified?: boolean
  }
  ```
- Missing attributes on `FeedPost` for R1-R3:
  - `streamType?: "post" | "reel" | "news"` (or `type?: "dispatch" | "reel" | "news"`).
  - Rating fields: `rating?: number` (e.g., 94/100), `ratingGrade?: string` (e.g., "A+"), `ratingCategory?: string`.
  - Reels-specific fields: `isReel?: boolean`, `videoUrl?: string`, `duration?: string`, `isAudioMuted?: boolean`, `isFollowing?: boolean`, `biometricHud?: { fps: number; metric: string; metricVal: string }`.
  - News-specific fields: `newsCategory?: "SCOUTING BULLETIN" | "COMBINE REPORT" | "TACTICAL ANALYSIS" | "TALENT ANNOUNCEMENT"`, `headline?: string`, `urgency?: "HIGH" | "VERIFIED" | "OFFICIAL"`.

### 1.5 Existing Explore Page Test Expectations (`src/test/explore-page.test.tsx`)
The existing test suite expects:
1. `screen.getAllByRole("button", { name: "Explore" })[0]` opens Explore view.
2. Text `LIVE TALENT RADAR · 60 FPS COMPUTER VISION` and `EXPLORE ATHLETIC INTEL & SCOUT NETWORK` present.
3. Stat badges `12.8K+`, `1,420+`, `60 FPS`, `99.2%`.
4. Spotlights section `SCOUT RADAR · TOP RECRUITS OF THE WEEK` with Elena Rostova, Omar Khalil, Tariq Mansour, Maya Lin.
5. Hero sport pill `BASKETBALL` filtering dispatches.
6. Dispatch button `screen.getByRole("button", { name: /Add new post/i })` opening composer with `AI BIOMECHANICS LOG`, `ATTACH TELEMETRY TAG:`, and `PUBLISH INTEL`.
7. Role filter tab `screen.getByRole("tab", { name: /PRO SCOUTS/i })` becoming `.active`.

---

## 2. Logic Chain

```
Observation 1.1 & 1.5:
Existing test suite has 75 passing tests and specific DOM selector expectations in explore-page.test.tsx.
   ↓
Deduction: Any changes to FeedView must strictly preserve existing headings, stat badges, role filter tabs,
composer toggle labels, and spotlight names.

Observation 1.3 & Requirement R1:
Currently, FeedView only has role filters (All Intel, Following, Verified Athletes, Clubs, Scouts, Sport Only).
The user requested small tabs in Explore for (All, Reels, News).
   ↓
Deduction: We need a dedicated primary stream switcher tab bar with ("All", "Reels", "News") located prominently
in FeedView (e.g., above or integrated with feed controls). When "All" is active, all items show;
when "Reels" is active, only 9:16 vertical highlight reel cards show; when "News" is active, only scouting
bulletins, reports, and tactical announcements show.

Observation 1.3 & Requirement R2:
The current FeedPost card only renders standard horizontal/16:9 cards without Reels ergonomics.
Instagram & Facebook Reels have a vertical 9:16 aspect ratio, athlete profile with follow action, a floating
right-hand vertical action bar (Like/Heart, Comment, Share, Sound/Audio toggle), and biometric HUD overlay.
   ↓
Deduction: A dedicated Reels component (`SocialHighlightCard9x16` or `ReelCard9x16`) should render inside the feed stream:
1. 9:16 vertical aspect ratio container with dark gradient and subtle scanlines overlay.
2. Bottom-left creator row: Avatar, athlete name, verified shield, and "+ Follow" / "Following" button linked to followingList.
3. Floating vertical action bar on the right edge: Like/Heart with counter, Comment icon with counter, Share button (clipboard toast), Audio mute/unmute button with volume icon.
4. Top/floating HUD overlay: Biometric rating badge (e.g. 96/100), 60 FPS computer vision indicator, and real-time telemetry metrics.
5. Interactive playback controls: Tap to pause/play and bottom progress scrubber.

Observation 1.3 & Requirement R3:
Current posts are generic dispatches without clear distinction for official news bulletins, combine reports,
or rating scorecards inspired by Facebook & Instagram card design.
   ↓
Deduction: Posts and News cards need distinctive Facebook & Instagram feed layouts adapted to Scot AI's cyber-athletic gold palette:
1. Social Post Card: Clean card header with avatar, verified badge, author name, timestamp with public globe icon, Scot AI rating pill (e.g., "SCOT RATING 94/100 · GRADE A+"), high-definition highlight clip/media, and interactive engagement bar (Respects, Comments, Share, Vault).
2. News & Scouting Bulletin Card: Facebook-inspired official news post with category badge (e.g., "SCOUTING BULLETIN", "COMBINE REPORT", "TACTICAL ANALYSIS", "TALENT ANNOUNCEMENT"), gold accent banner, consensus scout rating, high-impact typography, and tactical telemetry.

Observation 1.3 & User Request:
"enabling users to publish and view ratings and highlight clips within the cyber-athletic dark and gold aesthetic"
   ↓
Deduction: The dispatch composer (`showComposer`) must be upgraded so users can:
1. Select publish type: "Post", "Reel (9:16 Highlight)", or "News Bulletin".
2. Set a Scot AI Rating (e.g., numeric input 0-100 or rating grade).
3. Select or attach a highlight clip (from preset 60 FPS highlight clips or custom media).
4. Save the new post/reel/news to state and `localStorage` so it immediately appears in the filtered stream.
```

---

## 3. Caveats & Assumptions

1. **JSDOM Audio & Video Mocking**:
   - `vitest` runs in `jsdom`, which does not implement native HTMLMediaElement `play()`, `pause()`, or audio codecs.
   - *Mitigation*: Reels and highlight clips should use `<video>` tags with poster fallback images or interactive simulated video players that do not throw unhandled promise rejections in JSDOM tests.
2. **Backward Compatibility with `localStorage`**:
   - `FeedView` reads `localStorage.getItem("scot_feed_posts")`.
   - Existing saved items in users' browsers may not have `streamType` or `rating`.
   - *Mitigation*: Fallback logic: if `streamType` is undefined, infer from `isReel ? "reels" : (post.authorRole === "Scout" && post.content.includes("bulletin") ? "news" : "post")`, or default to `"post"` / visible under `"all"`.
3. **Preserving Existing Test DOM Contracts**:
   - In `src/test/explore-page.test.tsx`, tests target role filter tabs (`getByRole("tab", { name: /PRO SCOUTS/i })`) and composer button (`getByRole("button", { name: /Add new post/i })`).
   - The new stream tabs ("All", "Reels", "News") must coexist harmoniously without overriding the role tabs or breaking accessible names.

---

## 4. Conclusion & Recommended Architecture

To satisfy all requirements (R1–R4) cleanly while maintaining the cyber-athletic dark and gold aesthetic and 100% test integrity, we recommend the following modular architecture:

```
src/
├── components/
│   ├── ExploreStreamTabs.tsx      # Small tabs: [All (Count), Reels (Count), News (Count)]
│   ├── ReelCard9x16.tsx           # Vertical 9:16 Instagram/Facebook Reels card with right floating bar
│   ├── NewsBulletinCard.tsx       # Facebook-inspired scouting bulletin & tactical news card
│   └── SocialPostCard.tsx         # Facebook/Instagram inspired athletic post with rating badge
├── App.tsx                        # FeedView integration, updated FeedPost type & enhanced composer
└── test/
    ├── explore-page.test.tsx      # Existing 4 tests preserved
    └── explore-reels-news.test.tsx # New comprehensive test suite for R1, R2, R3
```

### 4.1 Data Model Extensions (`FeedPost`)
```ts
export type StreamType = "post" | "reel" | "news"

export type FeedPost = {
  id: string
  streamType?: StreamType          // "post" | "reel" | "news"
  authorName: string
  authorRole: "Player" | "Club" | "Scout"
  authorImage: string
  sport: string
  timestamp: string
  content: string
  mediaUrl?: string
  videoUrl?: string                // For reels & highlight clips
  aspectRatio?: "9:16" | "16:9"   // Vertical 9:16 for Reels
  likes: number
  isLiked?: boolean
  commentsCount: number
  comments?: PostComment[]
  metrics?: { label: string; value: string }[]
  isVerified?: boolean
  rating?: number                  // E.g. 96 (/100)
  ratingGrade?: string             // E.g. "A+", "Elite"
  newsCategory?: "SCOUTING BULLETIN" | "COMBINE REPORT" | "TACTICAL ANALYSIS" | "TALENT ANNOUNCEMENT"
  isAudioMuted?: boolean           // Reels sound toggle
}
```

### 4.2 Stream Filter Tabs Component (`ExploreStreamTabs.tsx`)
- Placed directly at the top of the feed controls in `FeedView`.
- Renders small, cyber-gold pills:
  - `ALL` (shows posts, reels, and news)
  - `REELS` (filters to only vertical 9:16 reels)
  - `NEWS` (filters to only bulletins & tactical reports)
- Includes count badges for each stream type.

### 4.3 Vertical 9:16 Reels Component (`ReelCard9x16.tsx`)
- **Aspect Ratio**: Exact `9:16` aspect ratio (`aspect-[9/16]` or `height: 620px; width: 348px; margin: 0 auto;`).
- **Athlete Profile & Follow Action**:
  - Avatar with cybernetic border.
  - Athlete name and sport badge.
  - `+ Follow` / `Following ✓` button directly hooked into `followingList` state.
- **Right-Hand Floating Action Bar**:
  - Heart / Respect button with like count.
  - Comments button with bubble icon and comments count.
  - Share button with quick clipboard link copy and feedback toast.
  - Audio toggle button (Mute / Unmute speaker icon) with audio state indicator.
- **Biometric HUD Overlay**:
  - Top header: `60 FPS AI KINEMATICS` + pulsating red sensor dot.
  - Rating badge: e.g. `96/100 · FIVB ELITE`.
  - Bottom telemetry HUD strip: Live speed, elevation, release angle.
  - Bottom video timeline scrubber.

### 4.4 Facebook & Instagram Inspired Posts and News Cards
- **SocialPostCard**:
  - Social card header: rounded avatar, verified badge, author name, handle, timestamp with globe icon.
  - Prominent Scot AI rating badge (e.g., `SCOT RATING 94/100 · GRADE A`).
  - Highlight media container with 60 FPS HUD overlay.
  - Engagement footer: Like (heart/bolt), Comment, Share, Vault save.
- **NewsBulletinCard**:
  - Distinctive official news header with category banner (`SCOUTING BULLETIN`, `COMBINE REPORT`, etc.).
  - High-impact headline and analytical text.
  - Scout consensus rating and biometric benchmarks.
  - Official Scot AI verification seal.

### 4.5 Enhanced Intel & Highlight Clip Composer
- Toggle between `Dispatch Post`, `9:16 Highlight Reel`, and `Scouting News`.
- Input for **Scot AI Rating** (slider or numeric 0-100).
- Highlight clip selector offering pre-configured 60 FPS athletic footage (e.g. rim elevation, sprint acceleration, lateral change) or custom video URL.
- Telemetry tags attachment.
- Immediate publication into feed stream and `localStorage`.

---

## 5. Verification Method

### 5.1 Automated Command Verification
1. **Vitest Unit & Integration Tests**:
   ```pwsh
   npm test
   ```
   *Expected Result*: All 75 existing tests pass cleanly; all new tests for tabs, reels, news, and publishing pass with 0 failures.
2. **Production Build**:
   ```pwsh
   npm run build
   ```
   *Expected Result*: Builds `dist/` cleanly with 0 TypeScript and 0 Vite compilation errors.

### 5.2 Specific Files to Inspect
- `src/App.tsx`: `FeedView`, `FeedPost`, `INITIAL_POSTS`, composer handlers.
- `src/components/ReelCard9x16.tsx`: 9:16 vertical layout, right floating action bar, follow action, biometric HUD.
- `src/components/NewsBulletinCard.tsx`: Facebook/Instagram inspired news styling with category badges and ratings.
- `src/components/ExploreStreamTabs.tsx`: Small filter tabs for "All", "Reels", "News".
- `src/test/explore-page.test.tsx`: Verify existing tests remain unmodified and passing.
- `src/test/explore-reels-news.test.tsx`: Verify dedicated new tests for R1-R4.

### 5.3 Invalidation Conditions
- Any failure in existing test files (`npm test` != 0 failures).
- Any TypeScript error during `npm run build`.
- Inability to filter to Reels only (showing non-reels when "Reels" is selected).
- Inability to filter to News only (showing non-news when "News" is selected).
- Reels cards lacking 9:16 aspect ratio or right-hand vertical floating actions.
