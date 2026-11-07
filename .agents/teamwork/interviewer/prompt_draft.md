Add small tabs in Explore for (All, Reels, News) and inspire the design from Facebook and Instagram for reels and posts, enabling users to publish and view ratings and highlight clips within the cyber-athletic dark and gold aesthetic.

Working directory: d:\scot1
Integrity mode: demo
The team must NOT: copy code from existing open-source projects for core logic

## Requirements

### R1. Explore Feed Filter Tabs
Add small navigation/filter tabs in the Explore feed view (`FeedView` in `src/App.tsx`) for "All", "Reels", and "News" to filter displayed items by stream type.

### R2. Facebook & Instagram Inspired Reels UI
Provide a vertical 9:16 athletic highlight reel format inspired by Instagram and Facebook Reels, featuring athlete avatar and follow action, right-hand vertical floating action bar (hearts/likes, comments, share, audio toggle), and biometric HUD overlay, with functionality to view and publish highlight clips.

### R3. Facebook & Instagram Inspired Posts and News UI
Format feed posts and news bulletins (scouting bulletins, combine reports, tactical analysis, and talent announcements) with card layouts inspired by Facebook and Instagram feeds, supporting ratings and highlights while preserving Scot AI's cyber-athletic gold and dark theme.

### R4. Test Suite and Build Integrity
Ensure the existing test suite continues to pass cleanly (`npm test`) and the project builds without errors.

## Acceptance Criteria

### Feed Filter Tabs
- [ ] Small filter tabs for "All", "Reels", and "News" appear in the Explore feed view.
- [ ] Selecting "All" displays a combined stream of dispatches, reels, and news.
- [ ] Selecting "Reels" displays only vertical 9:16 athletic highlight reel cards.
- [ ] Selecting "News" displays only scouting bulletins, reports, and tactical announcements.

### Visual Design & Interaction
- [ ] Reels cards render in a vertical 9:16 aspect ratio with athlete profile avatar, follow action, floating vertical action bar (likes, comments, share, audio toggle), and biometric HUD overlay.
- [ ] Post and news cards feature Facebook/Instagram inspired social feed styling adapted to Scot AI's cyber-athletic dark/gold palette.
- [ ] UI supports publishing ratings and highlight clips into the feed stream.

### Verification
- [ ] `npm test` passes with zero failures.
- [ ] `npm run build` completes cleanly without compilation or TypeScript errors.
