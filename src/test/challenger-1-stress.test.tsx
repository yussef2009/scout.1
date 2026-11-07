import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import React, { act } from "react"
import App from "../App"
import { NewsBulletinCard, calculateGrade as calculateNewsGrade } from "../components/NewsBulletinCard"
import { ReelCard9x16 } from "../components/ReelCard9x16"
import { SocialPostCard, calculateGrade as calculateSocialGrade } from "../components/SocialPostCard"
import type { FeedPost } from "../components/ReelCard9x16"

const originalClipboard = navigator.clipboard

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    writable: true,
    configurable: true,
  })
  window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve())
  window.HTMLMediaElement.prototype.pause = vi.fn()
})

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    writable: true,
    configurable: true,
  })
  vi.restoreAllMocks()
})

async function renderAndNavigateToExplore() {
  const utils = render(<App />)
  const exploreBtn = screen.getAllByRole("button", { name: /Explore/i })[0]
  await act(async () => {
    fireEvent.click(exploreBtn)
  })
  return utils
}

function getStreamTab(name: "All" | "Reels" | "News") {
  const streamContainer = document.querySelector(".feed-stream-tabs")
  if (streamContainer) {
    const btn = within(streamContainer as HTMLElement).queryByRole("tab", { name: new RegExp(name, "i") })
    if (btn) return btn
  }
  const tabs = screen.getAllByRole("tab")
  const target = tabs.find((tab) => {
    const text = (tab.textContent || "").trim()
    if (name === "All") {
      return (/^all(\s*\d+)?$/i.test(text) || text.startsWith("All")) && !text.includes("ALL INTEL")
    }
    return new RegExp(`^${name}`, "i").test(text)
  })
  if (target) return target
  return screen.getByRole("tab", { name: new RegExp(`^${name}`, "i") })
}

function getPostCardByAuthor(authorName: string): HTMLElement | null {
  const postsStack = document.querySelector(".posts-stack")
  if (!postsStack) return null
  const authors = within(postsStack as HTMLElement).queryAllByText(authorName)
  if (authors.length === 0) return null
  return authors[0].closest(".post-card, .reel-card-9x16, article") as HTMLElement | null
}

function isPostAuthorInStream(authorName: string): boolean {
  const postsStack = document.querySelector(".posts-stack")
  if (!postsStack) return false
  return within(postsStack as HTMLElement).queryAllByText(authorName).length > 0
}

async function openComposer() {
  const dispatchBtn =
    screen.queryByRole("button", { name: /Add new post/i }) ||
    screen.queryByTitle(/Add new post/i) ||
    screen.getByRole("button", { name: /\+/i })
  await act(async () => {
    fireEvent.click(dispatchBtn)
  })
}

/* =========================================================================
   CHALLENGER 1 ADVERSARIAL STRESS TEST SUITE
   Milestone 4: Boundary & Adversarial Correctness
   ========================================================================= */

describe("Milestone 4 Challenger 1: Adversarial Stress Testing", () => {
  /* -----------------------------------------------------------------------
     1. CONCURRENT FILTERING & STREAM TAB SWITCHING
     ----------------------------------------------------------------------- */
  describe("1. Stream Filter Tab Switching & Concurrent Filtering", () => {
    it("1.1 rapid stream tab switching under active search maintains strict filtering", async () => {
      await renderAndNavigateToExplore()

      // Set search query for Cairo (matches post-1: Al Ahly SC Academy news)
      const searchInput = screen.getByPlaceholderText(/Search by athlete name/i)
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Cairo" } })
      })

      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(false)

      // Rapidly switch tabs: Reels -> News -> All -> Reels -> News
      const reelsTab = getStreamTab("Reels")
      const newsTab = getStreamTab("News")
      const allTab = getStreamTab("All")

      await act(async () => {
        fireEvent.click(reelsTab)
      })
      // "Cairo" does not match any reels -> should show empty state
      expect(screen.getByText("NO INTEL LOGS FOUND")).toBeInTheDocument()
      expect(isPostAuthorInStream("Omar Khalil")).toBe(false)
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(false)

      await act(async () => {
        fireEvent.click(newsTab)
      })
      // "Cairo" matches Al Ahly SC Academy in News
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(false)

      await act(async () => {
        fireEvent.click(allTab)
      })
      // In All tab, Al Ahly matches
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(false)

      await act(async () => {
        fireEvent.click(newsTab)
      })
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    })

    it("1.2 mutually exclusive filter combination (Basketball + News) displays empty state and RESET restores stream", async () => {
      await renderAndNavigateToExplore()

      // Select Basketball pill
      const basketballPill = screen.getByRole("button", { name: "BASKETBALL" })
      await act(async () => {
        fireEvent.click(basketballPill)
      })

      // Select News tab (No initial posts have both Basketball AND News)
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      expect(screen.getByText("NO INTEL LOGS FOUND")).toBeInTheDocument()

      // Click RESET ALL FILTERS button
      const resetBtn = screen.getByRole("button", { name: "RESET ALL FILTERS" })
      await act(async () => {
        fireEvent.click(resetBtn)
      })

      // All 5 posts should now be restored
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      expect(isPostAuthorInStream("EMEA Talent Scouts Ltd")).toBe(true)
      expect(isPostAuthorInStream("Real Madrid Cantera")).toBe(true)
      expect(isPostAuthorInStream("Mateo Ruiz")).toBe(true)
    })

    it("1.3 concurrent Role filter + Stream Tab + Search query behaves strictly", async () => {
      await renderAndNavigateToExplore()

      // Select CLUBS role filter
      const clubsRoleTab = screen.getByRole("tab", { name: /CLUBS/i })
      await act(async () => {
        fireEvent.click(clubsRoleTab)
      })

      // Switch to News tab
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      // Both Al Ahly and Real Madrid are Clubs with News
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Real Madrid Cantera")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(false)

      // Enter search query "Madrid"
      const searchInput = screen.getByPlaceholderText(/Search by athlete name/i)
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Madrid" } })
      })

      expect(isPostAuthorInStream("Real Madrid Cantera")).toBe(true)
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(false)

      // Switch to Reels tab: Clubs have 0 reels -> should display empty state
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })
      expect(screen.getByText("NO INTEL LOGS FOUND")).toBeInTheDocument()
    })

    it("1.4 stream count badges remain stable and reflect total post inventory", async () => {
      await renderAndNavigateToExplore()

      const allTab = getStreamTab("All")
      const reelsTab = getStreamTab("Reels")
      const newsTab = getStreamTab("News")

      // Stream tabs should display accurate counts: 5 total, 2 reels, 3 news
      expect(allTab.textContent).toContain("5")
      expect(reelsTab.textContent).toContain("2")
      expect(newsTab.textContent).toContain("3")

      // Even when filtering by sport, the stream tab badges reflect total available counts
      const soccerPill = screen.getByRole("button", { name: "SOCCER" })
      await act(async () => {
        fireEvent.click(soccerPill)
      })

      expect(allTab.textContent).toContain("5")
      expect(reelsTab.textContent).toContain("2")
      expect(newsTab.textContent).toContain("3")
    })

    it("1.5 search handles adversarial inputs (special chars, metric numbers, whitespace) gracefully", async () => {
      await renderAndNavigateToExplore()
      const searchInput = screen.getByPlaceholderText(/Search by athlete name/i)

      // Test searching by metric value ("78.4") -> matches Omar Khalil's vertical elevation
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "78.4" } })
      })
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(false)

      // Test searching by special characters that match nothing
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "!@#$%^&*()" } })
      })
      expect(screen.getByText("NO INTEL LOGS FOUND")).toBeInTheDocument()

      // Test search with only spaces -> should treat as empty and show all
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "     " } })
      })
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    })

    it("1.6 rapid 20x tab switching cycle does not corrupt state or crash DOM", async () => {
      await renderAndNavigateToExplore()

      const allTab = getStreamTab("All")
      const reelsTab = getStreamTab("Reels")
      const newsTab = getStreamTab("News")

      const tabSequence = [reelsTab, newsTab, allTab]

      for (let i = 0; i < 20; i++) {
        const nextTab = tabSequence[i % tabSequence.length]
        await act(async () => {
          fireEvent.click(nextTab)
        })
      }

      // End on All tab
      await act(async () => {
        fireEvent.click(allTab)
      })

      // Stream should render all 5 original posts without duplicate keys or DOM errors
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      expect(isPostAuthorInStream("EMEA Talent Scouts Ltd")).toBe(true)
      expect(isPostAuthorInStream("Real Madrid Cantera")).toBe(true)
      expect(isPostAuthorInStream("Mateo Ruiz")).toBe(true)
    })
  })

  /* -----------------------------------------------------------------------
     2. 9:16 REELS PLAYBACK & INTERACTIONS
     ----------------------------------------------------------------------- */
  describe("2. 9:16 Reels Playback and Interactions", () => {
    it("2.1 rapid like clicking does not desynchronize or produce negative counters", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const likeBtn = within(card!).getByRole("button", { name: /Like or give respects/i })

      // Initial count for Omar Khalil is 67
      expect(likeBtn.textContent).toContain("67")

      // Click like 10 times in rapid succession
      for (let i = 1; i <= 10; i++) {
        await act(async () => {
          fireEvent.click(likeBtn)
        })
        const expected = i % 2 === 1 ? "68" : "67"
        expect(likeBtn.textContent).toContain(expected)
      }

      // Parity check: after 10 clicks, it returns to original 67
      expect(likeBtn.textContent).toContain("67")
    })

    it("2.2 audio toggle switches between mute and unmute with correct accessibility attributes", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const audioBtn = within(card!).getByRole("button", { name: /Sound: (Off|On)/i })

      // Initial state is muted
      expect(audioBtn).toHaveAttribute("aria-label", "Sound: Off")
      expect(audioBtn.textContent).toContain("OFF")

      // Click to unmute
      await act(async () => {
        fireEvent.click(audioBtn)
      })
      expect(audioBtn).toHaveAttribute("aria-label", "Sound: On")
      expect(audioBtn.textContent).toContain("ON")

      // Click to mute again
      await act(async () => {
        fireEvent.click(audioBtn)
      })
      expect(audioBtn).toHaveAttribute("aria-label", "Sound: Off")
      expect(audioBtn.textContent).toContain("OFF")
    })

    it("2.3 follow/unfollow updates interactive label and persists across stream navigation", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()

      // Follow Omar Khalil
      const followBtn = within(card!).getByRole("button", { name: /\+ Follow|Following ✓/i })
      expect(followBtn.textContent).toContain("+ Follow")

      await act(async () => {
        fireEvent.click(followBtn)
      })

      // Button updates to Following ✓
      expect(within(card!).getByRole("button", { name: /Following ✓/i })).toBeInTheDocument()

      // Switch to All tab and back to Reels tab: verify follow state is preserved
      const allTab = getStreamTab("All")
      await act(async () => {
        fireEvent.click(allTab)
      })
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const cardAfter = getPostCardByAuthor("Omar Khalil")
      expect(within(cardAfter!).getByRole("button", { name: /Following ✓/i })).toBeInTheDocument()

      // Unfollow
      const unfollowBtn = within(cardAfter!).getByRole("button", { name: /Following ✓/i })
      await act(async () => {
        fireEvent.click(unfollowBtn)
      })
      expect(within(cardAfter!).getByRole("button", { name: /\+ Follow/i })).toBeInTheDocument()
    })

    it("2.4 play/pause scrubber operates safely and image error handler conceals broken media", () => {
      const brokenPost: FeedPost = {
        id: "reel-broken",
        authorName: "Adversarial Athlete",
        authorRole: "Player",
        authorImage: "https://example.com/broken-avatar.jpg",
        sport: "Basketball",
        timestamp: "Just now",
        content: "Testing broken media URL resiliency under cyber-athletic HUD",
        mediaUrl: "https://invalid.url.xyz/broken-keyframe.jpg",
        videoUrl: "https://invalid.url.xyz/broken-video.mp4",
        likes: 12,
        commentsCount: 0,
        isVerified: true,
        postType: "reel",
        streamType: "reel",
        rating: 91,
        ratingGrade: "A-",
      }

      const { container } = render(
        <ReelCard9x16
          post={brokenPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      // Verify aspect ratio container
      const article = container.querySelector(".reel-card-9x16")
      expect(article).not.toBeNull()
      expect(article).toHaveAttribute("data-aspect", "9:16")

      // Verify scrubber element is rendered
      const scrubber = container.querySelector(".reel-scrubber")
      expect(scrubber).not.toBeNull()
      const scrubberFill = container.querySelector(".reel-scrubber-fill") as HTMLElement
      expect(scrubberFill).not.toBeNull()
      expect(scrubberFill.style.width).toBe("68%") // isPlaying defaults to true

      // Trigger image onError event
      const img = container.querySelector("img.post-media-preview") as HTMLImageElement
      expect(img).not.toBeNull()
      fireEvent.error(img)
      expect(img.style.display).toBe("none")

      // Toggle play/pause by clicking media wrapper
      const mediaWrapper = container.querySelector(".reel-media-wrapper") as HTMLElement
      fireEvent.click(mediaWrapper)

      // When paused, scrubber width switches to 32% and play overlay appears
      expect(scrubberFill.style.width).toBe("32%")
      const playOverlay = container.querySelector(".reel-play-overlay")
      expect(playOverlay).not.toBeNull()
    })

    it("2.5 adding notes in comments drawer updates comments list and handles empty note prevention", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()

      // Open comments drawer
      const commentsBtn = within(card!).getByRole("button", { name: /Comments/i })
      await act(async () => {
        fireEvent.click(commentsBtn)
      })

      const drawer = card!.querySelector(".reel-comments-drawer")
      expect(drawer).not.toBeNull()

      // Post Note button is disabled initially when input is empty
      const postNoteBtn = within(drawer as HTMLElement).getByRole("button", { name: "POST NOTE" })
      expect(postNoteBtn).toBeDisabled()

      // Type note with whitespace only -> should remain disabled
      const commentInput = within(drawer as HTMLElement).getByPlaceholderText(/Add scout note/i)
      await act(async () => {
        fireEvent.change(commentInput, { target: { value: "     " } })
      })
      expect(postNoteBtn).toBeDisabled()

      // Type valid note and submit
      await act(async () => {
        fireEvent.change(commentInput, {
          target: { value: "Stress testing comments drawer: explosive acceleration!" },
        })
      })
      expect(postNoteBtn).not.toBeDisabled()

      await act(async () => {
        fireEvent.click(postNoteBtn)
      })

      // Comment should be displayed in the list
      expect(within(drawer as HTMLElement).getByText(/Stress testing comments drawer/i)).toBeInTheDocument()
    })

    it("2.6 independent actions between multiple reel cards (isolation stress)", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      // Both Omar Khalil (post-2, likes=67) and Mateo Ruiz (post-5, likes=29) are reels
      const omarCard = getPostCardByAuthor("Omar Khalil")
      const mateoCard = getPostCardByAuthor("Mateo Ruiz")
      expect(omarCard).not.toBeNull()
      expect(mateoCard).not.toBeNull()

      const omarLikeBtn = within(omarCard!).getByRole("button", { name: /Like or give respects/i })
      const mateoLikeBtn = within(mateoCard!).getByRole("button", { name: /Like or give respects/i })

      expect(omarLikeBtn.textContent).toContain("67")
      expect(mateoLikeBtn.textContent).toContain("29")

      // Like Omar Khalil
      await act(async () => {
        fireEvent.click(omarLikeBtn)
      })

      // Omar incremented, Mateo unchanged
      expect(omarLikeBtn.textContent).toContain("68")
      expect(mateoLikeBtn.textContent).toContain("29")

      // Like Mateo Ruiz
      await act(async () => {
        fireEvent.click(mateoLikeBtn)
      })

      expect(omarLikeBtn.textContent).toContain("68")
      expect(mateoLikeBtn.textContent).toContain("30")
    })
  })

  /* -----------------------------------------------------------------------
     3. NEWS BULLETINS & RATING GRADE STRESS TESTS
     ----------------------------------------------------------------------- */
  describe("3. News Bulletins & Rating Grade Stress Testing", () => {
    it("3.1 grade calculation strictly covers all boundaries (50, 60, 65, 70, 75, 80, 85, 90, 93, 96, 100)", () => {
      // Test boundaries across News and Social grade calculators
      const boundaryCases: [number, string][] = [
        [0, "D"],
        [49, "D"],
        [50, "D"],
        [59, "D"],
        [59.9, "D"],
        [60, "C-"],
        [64, "C-"],
        [64.9, "C-"],
        [65, "C"],
        [69, "C"],
        [70, "C+"],
        [74, "C+"],
        [75, "B-"],
        [79, "B-"],
        [80, "B"],
        [84, "B"],
        [85, "B+"],
        [89, "B+"],
        [90, "A-"],
        [92, "A-"],
        [93, "A"],
        [95, "A"],
        [95.9, "A"],
        [96, "A+"],
        [97, "A+"],
        [100, "A+"],
        [110, "A+"],
      ]

      for (const [rating, expectedGrade] of boundaryCases) {
        expect(calculateNewsGrade(rating)).toBe(expectedGrade)
        expect(calculateSocialGrade(rating)).toBe(expectedGrade)
      }
    })

    it("3.2 category badge variations render distinct styling classes", () => {
      const categories = [
        { cat: "Scouting Bulletin", expectedClass: "text-amber-300" },
        { cat: "Combine Report", expectedClass: "text-cyan-300" },
        { cat: "Tactical Analysis", expectedClass: "text-emerald-300" },
        { cat: "Talent Announcement", expectedClass: "text-yellow-300" },
      ]

      for (const { cat, expectedClass } of categories) {
        const dummyPost: FeedPost = {
          id: `news-${cat}`,
          authorName: "Tactical Scout",
          authorRole: "Scout",
          authorImage: "https://example.com/avatar.jpg",
          sport: "Soccer",
          timestamp: "Just now",
          content: `${cat} report content body detailing athlete speed and agility.`,
          likes: 5,
          commentsCount: 0,
          isVerified: true,
          postType: "news",
          newsCategory: cat,
          newsHeadline: `${cat} Headline`,
          rating: 88,
        }

        const { container } = render(
          <NewsBulletinCard
            post={dummyPost}
            onToggleLike={vi.fn()}
            onToggleComments={vi.fn()}
            onShare={vi.fn()}
          />,
        )

        const badge = container.querySelector(".bulletin-category-tag")
        expect(badge).not.toBeNull()
        expect(badge?.className).toContain(expectedClass)
        expect(badge?.textContent).toContain(cat.toUpperCase())
      }
    })

    it("3.3 deduplicates headline when content starts with identical headline text", () => {
      const duplicatePost: FeedPost = {
        id: "news-dup",
        authorName: "Cairo Scout",
        authorRole: "Scout",
        authorImage: "https://example.com/avatar.jpg",
        sport: "Soccer",
        timestamp: "10m ago",
        content: "Cairo Youth Cup Assessment: Top percentile recovery sprint speed recorded across 12 matches.",
        likes: 15,
        commentsCount: 0,
        postType: "news",
        newsHeadline: "Cairo Youth Cup Assessment",
        newsCategory: "Combine Report",
        rating: 94,
      }

      const { container } = render(
        <NewsBulletinCard
          post={duplicatePost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      // The headline should appear in the headline slot
      const headline = container.querySelector(".news-headline")
      expect(headline?.textContent).toBe("Cairo Youth Cup Assessment")

      // The body content should not repeat the headline prefix
      const body = container.querySelector(".post-content")
      expect(body?.textContent).toBe("Top percentile recovery sprint speed recorded across 12 matches.")
    })

    it("3.4 news post without numerical rating renders gracefully without undefined stamps", () => {
      const unratedPost: FeedPost = {
        id: "news-unrated",
        authorName: "Talent Scout",
        authorRole: "Scout",
        authorImage: "https://example.com/avatar.jpg",
        sport: "Soccer",
        timestamp: "1h ago",
        content: "General scouting observations without quantitative rating metrics.",
        likes: 2,
        commentsCount: 0,
        postType: "news",
        newsHeadline: "General Observations",
      }

      const { container } = render(
        <NewsBulletinCard
          post={unratedPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(container.querySelector(".bulletin-rating-badge")).toBeNull()
      expect(container.querySelector(".bulletin-grade-stamp")).toBeNull()
      expect(container.querySelector(".news-headline")?.textContent).toBe("General Observations")
    })

    it("3.5 SocialPostCard with ratings renders grade badge and avoids duplicate rating in metrics", () => {
      const ratedSocialPost: FeedPost = {
        id: "social-rated",
        authorName: "Verified Scout",
        authorRole: "Scout",
        authorImage: "https://example.com/avatar.jpg",
        sport: "Basketball",
        timestamp: "2h ago",
        content: "Shooting mechanics analysis complete.",
        likes: 10,
        commentsCount: 0,
        rating: 96,
        ratingGrade: "A+",
        metrics: [
          { label: "RATING", value: "96/100" },
          { label: "RELEASE ANGLE", value: "48.2°" },
        ],
      }

      const { container } = render(
        <SocialPostCard
          post={ratedSocialPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      // Rating badge should render
      const ratingBadge = container.querySelector(".post-rating-badge")
      expect(ratingBadge).not.toBeNull()
      expect(ratingBadge?.textContent).toContain("96/100")
      expect(ratingBadge?.textContent).toContain("A+")

      // Metrics strip should filter out the duplicate RATING label
      const metricChips = container.querySelectorAll(".post-metric-pill")
      expect(metricChips.length).toBe(1)
      expect(metricChips[0].textContent).toContain("RELEASE ANGLE:48.2°")
    })
  })

  /* -----------------------------------------------------------------------
     4. PUBLISHING COMPOSER BOUNDARY & PERSISTENCE STRESS TESTS
     ----------------------------------------------------------------------- */
  describe("4. Publishing Flow Boundary & Persistence Stress Testing", () => {
    it("4.1 composer prevents publishing on empty or whitespace inputs", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      expect(publishBtn).toBeDisabled()

      const textarea = screen.getByPlaceholderText(/Log training telemetry/i)
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "   \n\t   " } })
      })
      expect(publishBtn).toBeDisabled()
    })

    it("4.2 rating slider extremes dynamically generate correct grade badge", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const slider = screen.getByLabelText("Scot AI Rating")
      const gradeStamp = document.querySelector(".composer-grade-stamp")
      const ratingVal = document.querySelector(".composer-rating-val")

      // Minimum slider extreme: 50 -> GRADE D
      await act(async () => {
        fireEvent.change(slider, { target: { value: "50" } })
      })
      expect(ratingVal?.textContent).toContain("50/100")
      expect(gradeStamp?.textContent).toContain("GRADE D")

      // Boundary: 75 -> GRADE B-
      await act(async () => {
        fireEvent.change(slider, { target: { value: "75" } })
      })
      expect(ratingVal?.textContent).toContain("75/100")
      expect(gradeStamp?.textContent).toContain("GRADE B-")

      // Boundary: 90 -> GRADE A-
      await act(async () => {
        fireEvent.change(slider, { target: { value: "90" } })
      })
      expect(ratingVal?.textContent).toContain("90/100")
      expect(gradeStamp?.textContent).toContain("GRADE A-")

      // Boundary: 96 -> GRADE A+
      await act(async () => {
        fireEvent.change(slider, { target: { value: "96" } })
      })
      expect(ratingVal?.textContent).toContain("96/100")
      expect(gradeStamp?.textContent).toContain("GRADE A+")

      // Maximum slider extreme: 100 -> GRADE A+
      await act(async () => {
        fireEvent.change(slider, { target: { value: "100" } })
      })
      expect(ratingVal?.textContent).toContain("100/100")
      expect(gradeStamp?.textContent).toContain("GRADE A+")
    })

    it("4.3 publishing 9:16 Reel injects into stream, updates counters, and renders 9:16 HUD", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      // Switch to REEL (9:16 HIGHLIGHT)
      const reelTypeBtn = screen.getByRole("button", { name: "REEL (9:16 HIGHLIGHT)" })
      await act(async () => {
        fireEvent.click(reelTypeBtn)
      })

      // Verify reel specific indicator
      expect(screen.getByText("9:16 VERTICAL HUD ENABLED (YOLOv11 VISION)")).toBeInTheDocument()

      // Fill content
      const textarea = screen.getByPlaceholderText(/Log training telemetry/i)
      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: "Combine 2026: 82.5 cm vertical leap logged with 60 FPS YOLOv11 tracker." },
        })
      })

      // Set rating slider to 98 (GRADE A+)
      const slider = screen.getByLabelText("Scot AI Rating")
      await act(async () => {
        fireEvent.change(slider, { target: { value: "98" } })
      })

      // Publish
      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      await act(async () => {
        fireEvent.click(publishBtn)
      })

      // Stream counters should increment: All from 5 to 6, Reels from 2 to 3
      const allTab = getStreamTab("All")
      const reelsTab = getStreamTab("Reels")
      expect(allTab.textContent).toContain("6")
      expect(reelsTab.textContent).toContain("3")

      // Switch to Reels tab: verify newly published reel appears with 9:16 aspect ratio
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const newPostContent = screen.getByText(/Combine 2026: 82.5 cm vertical leap/i)
      expect(newPostContent).toBeInTheDocument()

      const reelCard = newPostContent.closest(".reel-card-9x16")
      expect(reelCard).not.toBeNull()
      expect(reelCard).toHaveAttribute("data-aspect", "9:16")
      expect(within(reelCard as HTMLElement).getByText("98")).toBeInTheDocument()
      expect(within(reelCard as HTMLElement).getByText(/GRADE A\+/i)).toBeInTheDocument()
    })

    it("4.4 publishing News Bulletin with custom headline and category updates stream and localStorage", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      // Switch to NEWS BULLETIN
      const newsTypeBtn = screen.getByRole("button", { name: "NEWS BULLETIN" })
      await act(async () => {
        fireEvent.click(newsTypeBtn)
      })

      // Fill news specific inputs
      const headlineInput = screen.getByPlaceholderText(/e\.g\. U-18 Cairo Youth Cup/i)
      await act(async () => {
        fireEvent.change(headlineInput, { target: { value: "International Combine Scouting Bulletin" } })
      })

      const categorySelect = screen.getByDisplayValue("Scouting Bulletin")
      await act(async () => {
        fireEvent.change(categorySelect, { target: { value: "Combine Report" } })
      })

      const textarea = screen.getByPlaceholderText(/Log training telemetry/i)
      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: "Comprehensive multi-match tactical breakdown and speed audit across 16 teams." },
        })
      })

      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      await act(async () => {
        fireEvent.click(publishBtn)
      })

      // Check stream counts: News from 3 to 4
      const newsTab = getStreamTab("News")
      expect(newsTab.textContent).toContain("4")

      // Switch to News tab
      await act(async () => {
        fireEvent.click(newsTab)
      })

      expect(screen.getByText("International Combine Scouting Bulletin")).toBeInTheDocument()

      // Check localStorage persistence
      const stored = localStorage.getItem("scot_feed_posts")
      expect(stored).not.toBeNull()
      const parsedPosts = JSON.parse(stored!)
      expect(parsedPosts.some((p: any) => p.newsHeadline === "International Combine Scouting Bulletin")).toBe(true)
    })

    it("4.5 resilience to corrupted or malformed localStorage payload", async () => {
      // Intentionally poison localStorage with invalid non-JSON data
      localStorage.setItem("scot_feed_posts", "CORRUPTED_NON_JSON_DATA_{{{{")

      // FeedView should catch this error without crashing and recover to INITIAL_POSTS
      await renderAndNavigateToExplore()

      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)

      const allTab = getStreamTab("All")
      expect(allTab.textContent).toContain("5")
    })

    it("4.6 safely handles HTML and special characters in published content (XSS safety)", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const dangerousPayload = "<script>window.__pwned = true</script><b>Bold Telemetry</b> & 'quotes' \"double\""

      const textarea = screen.getByPlaceholderText(/Log training telemetry/i)
      await act(async () => {
        fireEvent.change(textarea, { target: { value: dangerousPayload } })
      })

      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      await act(async () => {
        fireEvent.click(publishBtn)
      })

      // Script should NOT have executed
      expect((window as any).__pwned).toBeUndefined()

      // The literal string should be safely rendered in the DOM as text
      expect(screen.getByText(dangerousPayload)).toBeInTheDocument()
    })
  })
})
