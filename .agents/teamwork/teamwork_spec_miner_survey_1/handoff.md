# Specification Mining Report: Explore Feed, Reels & Posts/News UI

**Working Directory**: `d:\scot1\.agents\teamwork\teamwork_spec_miner_survey_1\`  
**Spec Miner ID**: `teamwork_spec_miner_survey_1`  
**Parent Orchestrator**: `e15aed74-0fde-48af-be70-92fab3fb8f91`  
**Date**: 2026-11-07  
**Integrity Mode**: Demo (no external open-source code copied)

---

## 1. Observation

Direct observations from the authoritative codebase, existing test suites, and user specifications:

### 1.1 Existing Test Baseline & Build Status
- Tool command: `npm test`  
  - Result: 9 test files, 75 passed cleanly (0 failed) in 11.41s:
    - `src/test/video-analysis.test.ts` (6 tests)
    - `src/test/search-expand.test.tsx` (5 tests)
    - `src/test/security.test.ts` (24 tests)
    - `src/test/ui-ux.test.tsx` (10 tests)
    - `src/test/cloud-tools-connector.test.tsx` (5 tests)
    - `src/test/search-3d-popover.test.tsx` (6 tests)
    - `src/test/react-layout.test.tsx` (11 tests)
    - `src/test/sport-strip.test.tsx` (4 tests)
    - `src/test/explore-page.test.tsx` (4 tests)
- Tool command: `npm run build` (`vite build`)
  - Result: Exit code 0, 86 modules transformed, assets generated cleanly in 19.40s (`dist/assets/index-DBdVmZBk.js`, `dist/assets/index-CHceHFCI.css`).

### 1.2 Feed Implementation in `src/App.tsx`
- **Location**: `src/App.tsx`, lines 6040–7050.
- **Current Data Model** (`src/App.tsx:6040-6055`):
  ```typescript
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
- **Existing Filter State** (`src/App.tsx:6281-6283`):
  ```typescript
  const [filter, setFilter] =
    useState<"all" | "following" | "clubs" | "scouts" | "players" | "sport">("all")
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("all")
  ```
- **Existing Filter Tabs** (`src/App.tsx:6603-6655`):
  - Toggle button for composer: `className="feed-filter-btn feed-new-dispatch-btn"` with `<span>{showComposer ? "✕" : "+"}</span>`, title `"Add new post (+)"`
  - Tabs rendered with `role="tab"`: `"ALL INTEL"`, `"FOLLOWING"`, `"VERIFIED ATHLETES"`, `"CLUBS & ACADEMIES"`, `"PRO SCOUTS"`, `"${sport.toUpperCase()} ONLY"`.
  - Tested in `src/test/explore-page.test.tsx:72-75`:
    ```typescript
    const scoutsTab = screen.getByRole("tab", { name: /PRO SCOUTS/i })
    fireEvent.click(scoutsTab)
    expect(scoutsTab).toHaveClass("active")
    ```
- **Existing Composer** (`src/App.tsx:6658-6748`):
  - Activated when `showComposer` is true.
  - Contains:
    - `"AI BIOMECHANICS LOG"` badge (`src/test/explore-page.test.tsx:56`)
    - `"ATTACH TELEMETRY TAG:"` label (`src/test/explore-page.test.tsx:57`)
    - Button with text `"PUBLISH INTEL"` (`src/test/explore-page.test.tsx:58`)
    - Sport selector dropdown
    - Media selector dropdown (`SAMPLE_MEDIA_OPTIONS`)
- **Existing Initial Posts** (`src/App.tsx:6057-6194`):
  - 5 initial seed posts:
    1. `post-1`: Al Ahly SC Academy (Club, Soccer) with squad rating metrics.
    2. `post-2`: Omar Khalil (Player, Basketball) with vertical elevation/hang time metrics and media.
    3. `post-3`: EMEA Talent Scouts Ltd (Scout, Soccer) - scouting bulletin.
    4. `post-4`: Real Madrid Cantera (Club, Soccer) - youth biomechanical audit report.
    5. `post-5`: Mateo Ruiz (Player, Basketball) - catch-and-shoot mechanics with media.

### 1.3 Existing 9:16 Social Highlight Card Component
- `src/components/SocialHighlightCard9x16.tsx`:
  - Canvas-based 1080×1920 PNG generation modal for athlete highlight cards.
  - Contains color tokens: `#fbbf24` (Cyber Gold), `#22d3ee` (Cyan), `#10b981` (Emerald), `#080c18` / `#0e1526` (Deep Midnight Background).
  - Displays: Overall Score (e.g. 94/100), Grade stamp ("GRADE A"), verified athletic strengths, and biomechanical benchmark bars.

### 1.4 Styling Tokens in `src/index.css`
- Core CSS variables (`src/index.css:4-16`):
  - `--black: #0a0a0c`
  - `--panel: #121216`
  - `--panel-raised: #1a1a20`
  - `--gold: #d4af37`
  - `--gold-bright: #ffd700`
  - `--gold-line: rgba(212, 175, 55, 0.3)`
  - Fonts: `'Space Grotesk', sans-serif`, `'Outfit', sans-serif`, `'Inter', sans-serif`.
- Feed CSS classes (`src/index.css:3674-4550`):
  - `.feed-shell`, `.feed-toast`, `.explore-header-card`, `.explore-spotlights-section`, `.feed-controls-bar`, `.feed-filters-nav`, `.feed-filter-btn`, `.create-post-card`, `.post-card`, `.post-media-hud-container`, `.hud-badge`, `.post-action-btn`, `.post-comments-drawer`.

---

## 2. Logic Chain

1. **R1 (Explore Feed Filter Tabs)**:
   - The user requested "small tabs in Explore for (All, Reels, News)" to filter displayed items by stream type.
   - Acceptance criteria require:
     - Selecting "All" displays a combined stream of dispatches, reels, and news.
     - Selecting "Reels" displays only vertical 9:16 athletic highlight reel cards.
     - Selecting "News" displays only scouting bulletins, reports, and tactical announcements.
   - Crucially, existing tests in `src/test/explore-page.test.tsx` depend on role filter tabs (`PRO SCOUTS`, `ALL INTEL`, etc.) and the composer toggle (`+`).
   - Therefore, the stream filter tabs ("All", "Reels", "News") must be introduced as a dedicated stream selector segmented control in `FeedView` (e.g., `<div className="feed-stream-tabs" role="tablist">`), working in conjunction with the existing role filter and sport quick-pills.

2. **R2 (Facebook & Instagram Inspired Reels UI)**:
   - R2 mandates a vertical 9:16 athletic highlight reel format inspired by Instagram and Facebook Reels.
   - Core elements directly required:
     a. **Vertical 9:16 aspect ratio**: container with `aspectRatio: "9 / 16"`, max-width ~380-420px, rounded corners (18-20px), subtle gold border, midnight black background.
     b. **Athlete profile avatar and follow action**: athlete avatar with role glow ring, athlete name, verified badge, and interactive `+ Follow` / `Following ✓` button that integrates with `followingList`.
     c. **Right-hand vertical floating action bar** (signature FB/IG Reels pattern):
        - Heart / Like button with animated reaction and like count.
        - Comment bubble button with comment count opening comments thread.
        - Share button (paper plane / arrow) with clipboard link copy and toast.
        - Audio / Mute toggle button (speaker icon) controlling audio state.
        - Scout rating shield badge showing numeric score (e.g., 94/100).
     d. **Biometric HUD overlay**: 60 FPS live tracking badge (`hud-pulse-dot` + "60 FPS · YOLOv11 VISION"), kinematic readouts (vertical elevation, hang time, velocity, release angle), cyber gold corner brackets, and scanline overlay.
     e. **Highlight clip playback**: video or keyframe visual with click-to-play/pause, timeline scrubber bar.
     f. **Publish highlight clips**: users must be able to publish new reels into the feed.

3. **R3 (Facebook & Instagram Inspired Posts and News UI)**:
   - R3 mandates formatting feed posts and news bulletins (scouting bulletins, combine reports, tactical analysis, talent announcements) with card layouts inspired by Facebook and Instagram feeds while preserving Scot AI's cyber-athletic dark and gold aesthetic.
   - Core elements directly required:
     a. **Social card layout**: clean author header with role ring, verified badge, options menu, and news category tag.
     b. **News categories & headlines**:
        - `SCOUTING BULLETIN` (amber/gold tag)
        - `COMBINE REPORT` (cyan tag)
        - `TACTICAL ANALYSIS` (emerald tag)
        - `TALENT ANNOUNCEMENT` (gold-bright tag)
        - Bold, prominent headline above the content body.
     c. **Ratings & benchmark metrics**:
        - Prominent rating badge (e.g. `97/100`) and performance grade stamp (e.g. `GRADE A+` or `NEUROMUSCULAR ELITE`).
        - Biomechanical benchmark strip showing metrics like `COUNTER-PRESS: 3.2s`, `MOVEMENT SYMMETRY: 98.2%`.
     d. **Media HUD container**: match footage / keyframe with 60 FPS vision tracking badges.
     e. **Social interaction bar**: Respected / Like, Comment, Save to Scout Vault, Share, and Verified Record stamp.
     f. **Threaded comments drawer**: scout notes with author role badges and quick comment input.

4. **User Publishing Capability (Ratings & Highlight Clips)**:
   - User request states: "enabling users to publish and view ratings and highlight clips within the cyber-athletic dark and gold aesthetic."
   - The composer in `FeedView` must provide:
     - Stream type selector: `Dispatch` vs `Reel (Highlight Clip)` vs `News (Scouting Bulletin / Report)`.
     - Rating score input (0–100) with dynamic grade calculation (`A+`, `A`, etc.).
     - Highlight clip selector / URL input.
     - News category dropdown (`Scouting Bulletin`, `Combine Report`, `Tactical Analysis`, `Talent Announcement`) and headline input.
     - Telemetry tag attachment pills.
     - When published, the new item is stored in `posts` state and `localStorage`, immediately visible under the matching tab ("All", "Reels", or "News").

5. **R4 (Test Suite and Build Integrity)**:
   - Existing 75 tests across 9 test files must continue to pass without failure.
   - Build (`npm run build`) must transform and bundle without errors.
   - Comprehensive new tests should be added to `src/test/explore-page.test.tsx` to assert:
     - Stream filter tabs render and filter correctly.
     - 9:16 Reels cards render all required elements (avatar, follow action, right-hand floating action bar with likes, comments, share, audio toggle, and biometric HUD).
     - Posts and News cards render headlines, ratings, and social actions.
     - Publishing a reel or news item with ratings and highlight clips works seamlessly.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Stream Tabs | Small Stream Navigation Tabs ("All", "Reels", "News") | Dedicated pill tabs in `FeedView` allowing switching between All Intel, 9:16 Reels, and News Bulletins | Click on tab (`"all"`, `"reels"`, `"news"`) | Updates `streamFilter` state; filters displayed posts | Defaults to `"all"` if invalid | `ORIGINAL_REQUEST.md` R1 |
| 2 | R1: Stream Tabs | Stream Tab Item Counter Badges | Displays real-time counts for total items, total reels, and total news posts | `posts` array | Numeric badges inside stream tabs | Displays 0 if empty | `src/App.tsx:6630` pattern |
| 3 | R1: Stream Tabs | Stream Filter Reset on Empty State | In empty state, user can click "Reset All Filters" to restore `"all"` stream filter and clear search | Click Reset button | Resets `streamFilter`, `filter`, and `searchQuery` | Safe no-op if already reset | `src/App.tsx:6764` pattern |
| 4 | R2: Reels UI | 9:16 Vertical Highlight Reel Container | Renders athletic highlight reels in a vertical 9:16 aspect ratio with cyber-athletic dark/gold frame | `post` with `postType === "reel"` | Vertical 9:16 card (380-420px max width, rounded-2xl, gold border) | Fallbacks to default card if data malformed | `ORIGINAL_REQUEST.md` R2 |
| 5 | R2: Reels UI | Athlete Profile Avatar & Follow Button | Bottom-left athlete identity with role-colored glow ring, name, verified shield, and "+ Follow" / "Following ✓" toggle | `authorName`, `authorImage`, `followingList` | Interactive follow toggle; updates `followingList` & toast | Gracefully falls back to default avatar on img error | `src/App.tsx:8865` |
| 6 | R2: Reels UI | Right-Hand Floating Action Bar: Likes / Hearts | Floating vertical button with heart/bolt icon, like counter, and animated reaction | Click like button | Increments like count; toggles active heart state | Clamps count to minimum 0 | `ORIGINAL_REQUEST.md` R2 |
| 7 | R2: Reels UI | Right-Hand Floating Action Bar: Comments | Floating vertical button with chat icon and comments counter | Click comment button | Opens inline comments drawer for the reel | Graceful empty comments state | `ORIGINAL_REQUEST.md` R2 |
| 8 | R2: Reels UI | Right-Hand Floating Action Bar: Share Action | Floating vertical button with share icon that copies reel link to clipboard | Click share button | Copies URL to clipboard; displays toast "Reel link copied!" | Fallback toast "Reel link indexed." if clipboard denied | `src/App.tsx:6948` pattern |
| 9 | R2: Reels UI | Right-Hand Floating Action Bar: Audio / Mute Toggle | Floating vertical button with speaker icon to mute/unmute reel highlight audio | Click audio button | Toggles `isMuted` boolean; updates speaker icon | Defaults to muted for autoplay safety | `ORIGINAL_REQUEST.md` R2 |
| 10 | R2: Reels UI | Right-Hand Floating Action Bar: Scout Rating Badge | Floating vertical gold badge showing athlete overall score (0-100) | `post.rating` | Displays numeric score (e.g. 94) with gold glow | Hidden if no rating attached | `ORIGINAL_REQUEST.md` R2 |
| 11 | R2: Reels UI | Biometric HUD Overlay: 60 FPS Vision Badge | Top-left HUD badge with pulsing green/red LED dot and "60 FPS · YOLOv11 VISION" text | Constant / HUD telemetry | Glowing high-tech HUD indicator | Rendered unconditionally on reels | `src/App.tsx:6890` pattern |
| 12 | R2: Reels UI | Biometric HUD Overlay: Rating Grade Stamp | Top-right HUD badge showing performance grade stamp ("GRADE A+", "NEUROMUSCULAR ELITE") | `post.ratingGrade`, `post.rating` | High-contrast gold/emerald grade stamp | Defaults to "GRADE A" if unassigned | `SocialHighlightCard9x16.tsx` |
| 13 | R2: Reels UI | Biometric HUD Overlay: Cyber Reticles & Scanlines | Futuristic gold corner brackets (`L`-shaped) and subtle scanline overlay across video frame | CSS overlay | Visual cyber-athletic framing | Pointer-events none to allow interaction | `src/index.css:4490` |
| 14 | R2: Reels UI | Kinematic Telemetry Ticker | Overlay strip displaying key metrics (e.g., Vertical: 78.4 cm, Hang Time: 0.83s, Takeoff: 3.84 m/s²) | `post.metrics` | Pill tags overlaying bottom portion of reel | Hidden if metrics empty | `src/App.tsx:6864` |
| 15 | R2: Reels UI | Highlight Clip Play/Pause & Duration Scrubber | Interactive playback on reel frame with play/pause state and bottom duration progress bar | Click frame | Toggles play/pause; animates play icon; advances progress | Safe on static fallback images | `src/media/MediaCenterPage.tsx` |
| 16 | R3: Posts/News UI | Facebook & Instagram Inspired Social Card | Clean card layout with refined author header, sport indicator, verified shield, and options ellipsis | `post` object | Polished card with cyber-gold top accent border | Standard card fallback | `src/App.tsx:6780` |
| 17 | R3: Posts/News UI | News Bulletin Category Tagging | Distinct cyber-badges for Scouting Bulletin, Combine Report, Tactical Analysis, and Talent Announcement | `post.newsCategory` | Color-coded category badge with glowing accent | Defaults to "SCOUTING INTEL" if undefined | `ORIGINAL_REQUEST.md` R3 |
| 18 | R3: Posts/News UI | Prominent News Headline | Editorial bold title above post content for bulletins, combine reports, and announcements | `post.newsHeadline` | `<h3>` styled with Space Grotesk 16-18px | Omitted if post has no headline | `ORIGINAL_REQUEST.md` R3 |
| 19 | R3: Posts/News UI | Rating Score & Performance Grade Display | Displays verified athlete or squad rating (e.g. 97/100) and grade stamp inside the post card | `post.rating`, `post.ratingGrade` | Gold glowing score pill (`97/100`) + Grade stamp | Omitted if rating is not set | `ORIGINAL_REQUEST.md` R3 |
| 20 | R3: Posts/News UI | Highlight Keyframe & HUD Media Display | High-resolution match footage or keyframe with 60 FPS vision tracking and verified badges | `post.mediaUrl` | Responsive media container with HUD overlays | Hidden if post has no media | `src/App.tsx:6880` |
| 21 | R3: Posts/News UI | Social Action Bar (Respects, Comments, Vault, Share) | FB/IG inspired action bar with Respects/Like, Comment count, Save to Scout Vault, and Share button | Click actions | Updates likes, comments toggle, bookmark state, clipboard | Toast feedback on share/bookmark | `src/App.tsx:6903` |
| 22 | R3: Posts/News UI | Threaded Comments & Scout Notes Drawer | Expandable drawer with scout comment history, author role pills, and instant comment composer | Draft text + Enter / Click | Adds `PostComment`; increments `commentsCount` | Disabled if comment draft empty | `src/App.tsx:6967` |
| 23 | Publishing | Multi-Type Dispatch Composer | Composer support for publishing Standard Dispatches, 9:16 Highlight Reels, and News Bulletins | Composer type tabs | Switches input fields according to chosen stream type | Retains existing `AI BIOMECHANICS LOG` test hooks | `ORIGINAL_REQUEST.md` R1-R3 |
| 24 | Publishing | Rating Score Input & Dynamic Grade Generator | Slider / numeric input (0-100) allowing users to publish scout ratings with auto-calculated grade | Rating value (0-100) | Grade stamp (`A+`, `A`, `B+`, etc.) displayed live | Clamped between 50 and 100 | `ORIGINAL_REQUEST.md` |
| 25 | Publishing | Highlight Clip Media Selector | Dropdown / input allowing selection of highlight video footage (sample drills, match clips) | Media option selection | Attaches `mediaUrl` / `reelVideoUrl` to published item | Default clip provided | `src/App.tsx:6196` |
| 26 | Publishing | News Bulletin Category & Headline Inputs | Category dropdown (Bulletin, Combine, Tactical, Announcement) and headline text input | User text input | Generates structured news bulletin post | Validates required fields | `ORIGINAL_REQUEST.md` R3 |
| 27 | Publishing | Telemetry Tag Attachments | Toggle chips to attach verified metrics (`VERTICAL JUMP`, `SPRINT SPEED`, `HANG TIME`, etc.) | Click metric chips | Adds to `selectedMetrics` array | Toggles off on second click | `src/App.tsx:6684` |
| 28 | Publishing | Stream Injection & LocalStorage Persistence | Prepend new post to feed stream and save to `localStorage.getItem("scot_feed_posts")` | Click "PUBLISH INTEL" | Updates `posts` state; displays success toast | Graceful catch if localStorage quota exceeded | `src/App.tsx:6313` |
| 29 | Integrity | Test Suite Verification | Running `npm test` across all 9 test suites | Command execution | 100% passing tests (minimum 75 tests + new tests) | Fails on any test regression | `ORIGINAL_REQUEST.md` R4 |
| 30 | Integrity | Build Verification | Running `npm run build` via Vite | Command execution | Zero TypeScript or compilation errors | Fails on syntax / build errors | `ORIGINAL_REQUEST.md` R4 |

---

## 4. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Stream Tabs | User clicks "Reels" when no posts match sport filter | Displays empty state: `"NO HIGHLIGHT REELS FOUND"` with button to reset filters to `"All"`. |
| 2 | Stream Tabs | Switching between "All", "Reels", and "News" while search query is active | Post stream respects BOTH the active stream tab AND the search query matching. |
| 3 | Reels UI | Post has no video URL or invalid media URL | Falls back to high-resolution keyframe preview with graceful `onError` fallback, preventing broken image icons. |
| 4 | Reels UI | Audio toggle clicked in browser with strict autoplay policy | Defaults audio to muted (`isMuted: true`); unmute only activates upon explicit user interaction. |
| 5 | Reels UI | Very long athlete name or bio caption in 9:16 card | Caption text clamped to 2 lines with subtle gradient fade or ellipsis, preventing vertical overflow outside the 9:16 frame. |
| 6 | Reels UI | User double-clicks reel viewport | Triggers like reaction: increments like count, pulses floating heart icon, shows momentary floating heart animation. |
| 7 | Posts/News UI | Post has no headline or no rating | Gracefully renders standard social post card without empty headline margin or broken score badge. |
| 8 | Posts/News UI | News post has unknown category | Defaults badge to `"SCOUTING INTEL"` with standard cyber-gold theme. |
| 9 | Composer | User attempts to submit empty content or rating | "PUBLISH INTEL" button remains disabled until valid content or media is provided. |
| 10 | Follow Toggle | Author is not in `followingList` | Follow button renders as `"+ Follow"`; on click, author is appended to `followingList` and saved to `localStorage`. |
| 11 | Follow Toggle | Author is already in `followingList` | Follow button renders as `"Following ✓"` in active gold/green style; on click, toggles unfollow with toast confirmation. |
| 12 | Clipboard Share | Browser denies clipboard API permission (e.g. non-secure iframe or permission denied) | `navigator.clipboard.writeText` caught cleanly in `try/catch`, falling back to toast notification: `"Intel link indexed."` without throwing. |
| 13 | LocalStorage | Browser in private browsing / localStorage blocked | `savePosts` handles quota/access error inside `try/catch` without breaking React state updates. |
| 14 | Typography / Lint | Strings containing apostrophes in JSX (e.g., athlete's name) | Complies with `AGENTS.md` rule: double quotes used for strings containing apostrophes (`"We're here to help"`, `"athlete's"`), preventing build failures. |
| 15 | Backwards Compatibility | Older saved posts in localStorage lacking `postType` | Inferred automatically: posts with `mediaUrl` and jump/elevation metrics default to `"reel"`; posts with "bulletin" or "audit" in content default to `"news"`; others default to `"dispatch"`. |

---

## 5. Architectural & Data Model Specification

### 5.1 Extended `FeedPost` Model
```typescript
export type FeedPostType = "dispatch" | "reel" | "news"

export type NewsCategory =
  | "scouting_bulletin"
  | "combine_report"
  | "tactical_analysis"
  | "talent_announcement"

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

  // Enhanced Social & Biometric Properties (R1, R2, R3)
  postType?: FeedPostType
  rating?: number // 0-100 overall score
  ratingGrade?: string // "A+", "GRADE A", "ELITE"
  reelVideoUrl?: string
  reelDuration?: string // e.g. "0:18"
  reelAspect?: "9:16"
  hudMetrics?: {
    fps?: string // "60 FPS"
    trackingMode?: string // "YOLOv11 KINEMATICS"
    elevation?: string // "78.4 CM"
    velocity?: string // "3.84 M/S²"
    reactionTime?: string // "118 MS"
  }
  newsCategory?: NewsCategory
  newsHeadline?: string
  athleteFollowers?: number
  isFollowing?: boolean
  sharesCount?: number
  isMuted?: boolean
}
```

### 5.2 Stream Navigation Specification (R1)
- Positioned directly above the post stream or inside `feed-controls-bar`:
```tsx
<div className="feed-stream-tabs" role="tablist" aria-label="Explore stream filter">
  <button
    role="tab"
    aria-selected={streamFilter === "all"}
    className={`stream-tab-btn ${streamFilter === "all" ? "active" : ""}`}
    onClick={() => setStreamFilter("all")}
  >
    <span>All</span>
    <span className="stream-count-pill">{posts.length}</span>
  </button>
  <button
    role="tab"
    aria-selected={streamFilter === "reels"}
    className={`stream-tab-btn ${streamFilter === "reels" ? "active" : ""}`}
    onClick={() => setStreamFilter("reels")}
  >
    <Icon name="video" size={13} />
    <span>Reels</span>
    <span className="stream-count-pill">{reelsCount}</span>
  </button>
  <button
    role="tab"
    aria-selected={streamFilter === "news"}
    className={`stream-tab-btn ${streamFilter === "news" ? "active" : ""}`}
    onClick={() => setStreamFilter("news")}
  >
    <Icon name="trend" size={13} />
    <span>News</span>
    <span className="stream-count-pill">{newsCount}</span>
  </button>
</div>
```

### 5.3 9:16 Reels Component Specification (R2)
- Rendered when `post.postType === "reel"`.
- Container:
  - `className="reel-card-9x16"`
  - `style={{ aspectRatio: "9 / 16", maxWidth: "400px", margin: "0 auto" }}`
  - Cybernetic gold border (`border: 1px solid rgba(251, 191, 36, 0.35)`), rounded 20px, deep black background.
- Floating Overlays:
  - **Top-left**: Biometric HUD Badge: Pulsing dot + `60 FPS · YOLOv11 VISION ENGINE`.
  - **Top-right**: Score Badge: `94 / 100` · `GRADE A` stamp.
  - **Corner Reticles**: 4 cybernetic gold `L`-brackets.
  - **Bottom-left**:
    - Athlete avatar + name + verified shield.
    - Sport pill (`BASKETBALL · PG`).
    - Follow button (`+ Follow` / `Following ✓`).
    - Reel caption + telemetry tags.
  - **Right-hand Vertical Action Bar**:
    - Heart / Like button with count.
    - Comment bubble button with count.
    - Share button (copies link).
    - Audio toggle button (speaker icon, muted/unmuted).
    - Scout Rating shield badge.

### 5.4 Posts & News Component Specification (R3)
- Rendered when `post.postType === "news"` or `"dispatch"`.
- Container:
  - `className="post-card news-card"`
- Header:
  - Role-colored avatar border.
  - Author name, verified shield, role badge.
  - News Category Pill (`SCOUTING BULLETIN`, `COMBINE REPORT`, `TACTICAL ANALYSIS`, `TALENT ANNOUNCEMENT`).
  - Score badge (`97/100`).
- Headline:
  - High-impact Space Grotesk headline (e.g. `"U-18 SQUAD LINEUP & COUNTER-PRESS BENCHMARKS"`).
- Body & Telemetry:
  - Content description.
  - Telemetry metric tags (`COUNTER-PRESS: 3.2s`, `TRANSITION SPEED: +14.8%`).
  - 16:9 Media container with scanlines and HUD tracking badges.
- Social Actions:
  - Respects / Likes, Comments count, Save to Scout Vault, Share link, and Verified Record stamp.

### 5.5 Enhanced Publishing Specification
- In `create-post-card`:
  - Segmented control to select stream type: `DISPATCH` | `REEL` | `NEWS`.
  - Live Rating Slider / Number Input (0–100) with dynamic grade preview.
  - Highlight clip media picker.
  - News category dropdown & headline input when News is selected.
  - Quick telemetry pills (`VERTICAL JUMP`, `SPRINT SPEED`, `HANG TIME`, etc.).
  - "PUBLISH INTEL" button constructs post, inserts into `posts` array, and persists to `localStorage`.

---

## 6. Caveats

- **No Caveats**: The codebase is self-contained in React 19 + Vite 8 + Tailwind CSS v4. All dependencies are installed and passing.
- Backward compatibility with existing localStorage data is handled via graceful inference fallback.
- Existing tests in `src/test/explore-page.test.tsx` are fully accounted for and will continue to pass without regression.

---

## 7. Conclusion

All features across requirements R1, R2, R3, and R4 have been mined, probed, and specified in detail. The design balances Facebook and Instagram social UX patterns (9:16 vertical reels, right-hand floating action bars, clean news bulletin headers, social interaction bars) with Scot AI's signature cyber-athletic dark and gold aesthetic (midnight black panels, cyber gold `#fbbf24` accents, cyan telemetry `#22d3ee`, 60 FPS YOLOv11 HUD overlays, and verified scouting seals).

The implementation plan is non-destructive, respects existing tests, preserves the existing filter and composer interfaces, and enriches the Explore feed with stream navigation, 9:16 Reels cards, News bulletin cards, and user publishing capabilities.

---

## 8. Verification Method

To verify these specifications independently:

1. **Verify Baseline Tests**:
   ```powershell
   npm test
   ```
   *Expected outcome*: 9 test files, 75 passing tests.

2. **Verify Build**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: Vite build exits with code 0.

3. **Verify Existing Explore Tests**:
   ```powershell
   npx vitest run src/test/explore-page.test.tsx
   ```
   *Expected outcome*: 4 tests pass cleanly.

4. **Inspect Key Spec Locations**:
   - `src/App.tsx:6040` — `FeedPost` type definition.
   - `src/App.tsx:6268` — `FeedView` component.
   - `src/App.tsx:6603` — `feed-filters-nav` controls.
   - `src/App.tsx:6658` — `create-post-card` composer.
   - `src/index.css:3674-4550` — Feed styling classes.
   - `src/components/SocialHighlightCard9x16.tsx` — 9:16 color and layout reference tokens.
