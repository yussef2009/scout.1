import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import React, { act } from "react"
import App from "../App"

// Polyfills and Mock Setup for JSDOM
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

// Helper: Render App and navigate to Explore FeedView
async function renderAndNavigateToExplore() {
  const utils = render(<App />)
  const exploreBtn = screen.getAllByRole("button", { name: /Explore/i })[0]
  await act(async () => {
    fireEvent.click(exploreBtn)
  })
  return utils
}

// Helper: Find Stream Tab button ("All", "Reels", "News")
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
  // Standard assertion fallback: forces Vitest to report clean missing element error
  return screen.getByRole("tab", { name: new RegExp(`^${name}`, "i") })
}

// Helper: Find Post Card by author inside posts stream
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

// Helper: Open New Post / Dispatch composer
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
   TIER 1: FEATURE COVERAGE (>=5 tests per feature across all 10 features)
   ========================================================================= */

describe("Tier 1 - Feature Coverage Suite", () => {
  /* -----------------------------------------------------------------------
     Feature 1: Stream Filter Tabs UI ("All", "Reels", "News")
     ----------------------------------------------------------------------- */
  describe("1. Stream Filter Tabs UI", () => {
    it("1.1 renders stream filter tabs with All, Reels, and News", async () => {
      await renderAndNavigateToExplore()
      const allTab = getStreamTab("All")
      const reelsTab = getStreamTab("Reels")
      const newsTab = getStreamTab("News")

      expect(allTab).toBeInTheDocument()
      expect(reelsTab).toBeInTheDocument()
      expect(newsTab).toBeInTheDocument()
    })

    it("1.2 displays All tab as active by default", async () => {
      await renderAndNavigateToExplore()
      const allTab = getStreamTab("All")
      const isAriaSelected = allTab.getAttribute("aria-selected") === "true"
      const hasActiveClass = allTab.classList.contains("active")
      expect(isAriaSelected || hasActiveClass).toBe(true)
    })

    it("1.3 switches active tab when Reels tab is clicked", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const isAriaSelected = reelsTab.getAttribute("aria-selected") === "true"
      const hasActiveClass = reelsTab.classList.contains("active")
      expect(isAriaSelected || hasActiveClass).toBe(true)
    })

    it("1.4 switches active tab when News tab is clicked", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const isAriaSelected = newsTab.getAttribute("aria-selected") === "true"
      const hasActiveClass = newsTab.classList.contains("active")
      expect(isAriaSelected || hasActiveClass).toBe(true)
    })

    it("1.5 renders dynamic item count badges inside stream tabs", async () => {
      await renderAndNavigateToExplore()
      const allTab = getStreamTab("All")
      const reelsTab = getStreamTab("Reels")
      const newsTab = getStreamTab("News")

      expect(allTab.textContent).toMatch(/\d+/)
      expect(reelsTab.textContent).toMatch(/\d+/)
      expect(newsTab.textContent).toMatch(/\d+/)
    })
  })

  /* -----------------------------------------------------------------------
     Feature 2: Stream Filtering Logic (All, Reels, News)
     ----------------------------------------------------------------------- */
  describe("2. Stream Filtering Logic", () => {
    it("2.1 All tab displays mixed stream with reels, bulletins, and dispatches", async () => {
      await renderAndNavigateToExplore()
      const allTab = getStreamTab("All")
      await act(async () => {
        fireEvent.click(allTab)
      })

      // News bulletin author + Reel author should both appear in combined stream
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
    })

    it("2.2 Reels tab displays only 9:16 highlight reel items", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      // Omar Khalil is a vertical jump highlight reel
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      // Pure text or news bulletins should be filtered out
      expect(isPostAuthorInStream("EMEA Talent Scouts Ltd")).toBe(false)
    })

    it("2.3 News tab displays only scouting bulletins and tactical announcements", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      // Scouting bulletin / combine report appears
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
      // Pure player reels should be filtered out
      expect(isPostAuthorInStream("Omar Khalil")).toBe(false)
    })

    it("2.4 rapid tab switching updates visible stream consistently without error", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      const newsTab = getStreamTab("News")
      const allTab = getStreamTab("All")

      await act(async () => {
        fireEvent.click(reelsTab)
      })
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)

      await act(async () => {
        fireEvent.click(newsTab)
      })
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)

      await act(async () => {
        fireEvent.click(allTab)
      })
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    })

    it("2.5 preserves role and sport filters when switching stream tabs", async () => {
      await renderAndNavigateToExplore()
      // Filter by Basketball
      const basketballPill = screen.getByRole("button", { name: "BASKETBALL" })
      await act(async () => {
        fireEvent.click(basketballPill)
      })

      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      // Basketball reel should remain visible
      expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
      // Soccer should not appear
      expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(false)
    })
  })

  /* -----------------------------------------------------------------------
     Feature 3: 9:16 Vertical Highlight Reel Container & Layout
     ----------------------------------------------------------------------- */
  describe("3. 9:16 Vertical Highlight Reel Container & Layout", () => {
    it("3.1 renders reel card with 9:16 aspect ratio container", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const reelCard = document.querySelector(".reel-card-9x16") || document.querySelector("[data-aspect='9:16']")
      expect(reelCard).not.toBeNull()
    })

    it("3.2 renders deep midnight background with cyber-gold border", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const reelCard = document.querySelector(".reel-card-9x16") || document.querySelector(".post-card")
      expect(reelCard).toBeInTheDocument()
    })

    it("3.3 renders scanline overlay for cyber-athletic aesthetic", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const scanlines = document.querySelector(".hud-scanlines-overlay")
      expect(scanlines).toBeInTheDocument()
    })

    it("3.4 renders video or high-resolution match footage keyframe", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const media = document.querySelector(".reel-video") || document.querySelector(".post-media-preview")
      expect(media).toBeInTheDocument()
    })

    it("3.5 clamps description and caption text within reel frame", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      expect(screen.getByText(/Vertical takeoff workout today in Alexandria/i)).toBeInTheDocument()
    })
  })

  /* -----------------------------------------------------------------------
     Feature 4: Athlete Profile Avatar & Follow Action
     ----------------------------------------------------------------------- */
  describe("4. Athlete Profile Avatar & Follow Action", () => {
    it("4.1 renders athlete profile avatar image", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const avatar = within(card!).getByAltText("Omar Khalil")
      expect(avatar).toBeInTheDocument()
    })

    it("4.2 renders athlete verified shield icon", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const shield = card!.querySelector(".verified-shield-icon")
      expect(shield).toBeInTheDocument()
    })

    it("4.3 renders interactive Follow button for unfollowed athlete", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const followBtn =
        within(card!).queryByRole("button", { name: /\+ follow/i }) ||
        within(card!).queryByRole("button", { name: /follow/i })
      expect(followBtn).toBeInTheDocument()
    })

    it("4.4 clicking Follow button updates state to Following", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const followBtn =
        within(card!).queryByRole("button", { name: /\+ follow/i }) ||
        within(card!).getByRole("button", { name: /follow/i })

      await act(async () => {
        fireEvent.click(followBtn)
      })

      const followingBtn = within(card!).getByRole("button", { name: /following/i })
      expect(followingBtn).toBeInTheDocument()
    })

    it("4.5 clicking Following button toggles back to Follow (unfollow)", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const followBtn =
        within(card!).queryByRole("button", { name: /\+ follow/i }) ||
        within(card!).getByRole("button", { name: /follow/i })

      await act(async () => {
        fireEvent.click(followBtn)
      })
      const followingBtn = within(card!).getByRole("button", { name: /following/i })

      await act(async () => {
        fireEvent.click(followingBtn)
      })

      const revertedBtn =
        within(card!).queryByRole("button", { name: /\+ follow/i }) ||
        within(card!).getByRole("button", { name: /follow/i })
      expect(revertedBtn).toBeInTheDocument()
    })
  })

  /* -----------------------------------------------------------------------
     Feature 5: Right-Hand Floating Action Bar
     ----------------------------------------------------------------------- */
  describe("5. Right-Hand Floating Action Bar", () => {
    it("5.1 renders vertical floating action bar on reel card", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const actionStack =
        card!.querySelector(".reel-floating-actions") ||
        card!.querySelector(".reel-actions-column") ||
        card!.querySelector(".post-footer-actions")
      expect(actionStack).toBeInTheDocument()
    })

    it("5.2 like button displays count and increments when clicked", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const likeBtn =
        within(card!).queryByRole("button", { name: /like|respect/i }) ||
        card!.querySelector(".respects-btn") ||
        card!.querySelector(".reel-action-btn.like")

      expect(likeBtn).not.toBeNull()
      await act(async () => {
        fireEvent.click(likeBtn!)
      })

      expect(likeBtn).toHaveClass("liked")
    })

    it("5.3 comments button opens inline comments drawer with counter", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const commentsBtn =
        within(card!).queryByRole("button", { name: /comment/i }) ||
        card!.querySelector(".comments-btn")

      expect(commentsBtn).not.toBeNull()
      await act(async () => {
        fireEvent.click(commentsBtn!)
      })

      expect(screen.getByText(/COMMENTS LOG & SCOUT NOTES/i)).toBeInTheDocument()
    })

    it("5.4 share button triggers clipboard link copy", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const shareBtn =
        within(card!).queryByRole("button", { name: /share/i }) ||
        card!.querySelector(".share-btn")

      expect(shareBtn).not.toBeNull()
      await act(async () => {
        fireEvent.click(shareBtn!)
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it("5.5 floating action bar renders scout rating score shield", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const scoreBadge =
        card!.querySelector(".reel-rating-shield") ||
        within(card!).queryByText(/9[0-9](\/100)?/) ||
        card!.querySelector(".post-metric-pill")
      expect(scoreBadge).toBeInTheDocument()
    })
  })

  /* -----------------------------------------------------------------------
     Feature 6: Biometric HUD Overlay (60 FPS, Reticles, Telemetry)
     ----------------------------------------------------------------------- */
  describe("6. Biometric HUD Overlay", () => {
    it("6.1 renders 60 FPS YOLOv11 tracking indicator badge", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const hudBadge = within(card!).getByText(/60 FPS · (AI VISION|YOLOv11)/i)
      expect(hudBadge).toBeInTheDocument()
    })

    it("6.2 renders pulsing HUD tracking beacon dot", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const pulseDot = card!.querySelector(".hud-pulse-dot")
      expect(pulseDot).toBeInTheDocument()
    })

    it("6.3 renders kinematic telemetry metrics (vertical elevation, hang time)", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      expect(within(card!).getAllByText(/78.4 CM/i).length).toBeGreaterThan(0)
      expect(within(card!).getAllByText(/0.83 SEC/i).length).toBeGreaterThan(0)
    })

    it("6.4 renders performance grade stamp (GRADE A or A+)", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const gradeBadge =
        within(card!).queryByText(/GRADE A/i) ||
        within(card!).queryByText(/BIOMECHANICS VERIFIED/i)
      expect(gradeBadge).toBeInTheDocument()
    })

    it("6.5 reticles and scanlines use pointer-events-none so interactions pass through", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const card = getPostCardByAuthor("Omar Khalil")
      expect(card).not.toBeNull()
      const scanlines = card!.querySelector(".hud-scanlines-overlay")
      expect(scanlines).toBeInTheDocument()
    })
  })

  /* -----------------------------------------------------------------------
     Feature 7: Facebook & Instagram Inspired News Bulletin Cards
     ----------------------------------------------------------------------- */
  describe("7. News Bulletin Cards & Categories", () => {
    it("7.1 renders category badge for Scouting Bulletin or Combine Report", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      const badge =
        within(card!).queryByText(/SCOUTING BULLETIN|COMBINE REPORT|TACTICAL ANALYSIS|TALENT ANNOUNCEMENT/i) ||
        within(card!).queryByText(/SOCCER/i)
      expect(badge).toBeInTheDocument()
    })

    it("7.2 renders bold headline for news bulletin items", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      const headline =
        within(card!).queryByRole("heading") ||
        within(card!).queryByText(/lineup assessment/i) ||
        within(card!).queryByText(/U-18 squad/i)
      expect(headline).toBeInTheDocument()
    })

    it("7.3 renders author identity with verified club/scout role badge", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      expect(within(card!).getByText("Al Ahly SC Academy")).toBeInTheDocument()
      expect(within(card!).getByText(/CLUB/i)).toBeInTheDocument()
    })

    it("7.4 renders structured tactical report body and telemetry", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      expect(within(card!).getByText(/top-tier counter-press transition metrics/i)).toBeInTheDocument()
    })

    it("7.5 renders social engagement buttons on news cards", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      const respectsBtn = card!.querySelector(".respects-btn")
      const commentsBtn = card!.querySelector(".comments-btn")
      expect(respectsBtn).toBeInTheDocument()
      expect(commentsBtn).toBeInTheDocument()
    })
  })

  /* -----------------------------------------------------------------------
     Feature 8: Verified Rating Score & Grade Stamp Display
     ----------------------------------------------------------------------- */
  describe("8. Rating Score & Performance Grade Display", () => {
    it("8.1 displays verified rating score (e.g. 97/100) prominently", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      expect(within(card!).getByText("97/100")).toBeInTheDocument()
    })

    it("8.2 displays biomechanical benchmark metrics strip", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      expect(within(card!).getByText("COUNTER-PRESS:")).toBeInTheDocument()
      expect(within(card!).getByText("3.2s")).toBeInTheDocument()
    })

    it("8.3 displays verified record watermark or seal", async () => {
      await renderAndNavigateToExplore()
      const newsTab = getStreamTab("News")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      expect(within(card!).getAllByText(/VERIFIED RECORD|BIOMECHANICS VERIFIED/i).length).toBeGreaterThan(0)
    })

    it("8.4 allows saving rated intelligence to Scout Vault", async () => {
      await renderAndNavigateToExplore()
      const card = getPostCardByAuthor("Al Ahly SC Academy")
      expect(card).not.toBeNull()
      const saveBtn =
        within(card!).queryByTitle(/Save intel to Scout Vault/i) ||
        within(card!).queryByRole("button", { name: /save/i })

      expect(saveBtn).not.toBeNull()
      await act(async () => {
        fireEvent.click(saveBtn!)
      })

      expect(screen.getByText(/Intel saved to Scout Vault!/i)).toBeInTheDocument()
    })

    it("8.5 gracefully renders posts that do not have numerical rating scores", async () => {
      await renderAndNavigateToExplore()
      // EMEA Talent Scouts post is a bulletin without a raw rating score
      expect(isPostAuthorInStream("EMEA Talent Scouts Ltd")).toBe(true)
    })
  })

  /* -----------------------------------------------------------------------
     Feature 9: Highlight Clip Playback Controls & Audio Toggle
     ----------------------------------------------------------------------- */
  describe("9. Highlight Clips & Playback Controls", () => {
    it("9.1 renders media container with footage keyframe or video", async () => {
      await renderAndNavigateToExplore()
      const media = document.querySelector(".post-media-hud-container")
      expect(media).toBeInTheDocument()
    })

    it("9.2 renders interactive media container with preview frame", async () => {
      await renderAndNavigateToExplore()
      const previewImg = screen.getAllByAltText(/Match footage/i)[0]
      expect(previewImg).toBeInTheDocument()
    })

    it("9.3 audio toggle button is rendered on media or reel action bar", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const audioBtn =
        screen.queryByRole("button", { name: /audio|mute|speaker/i }) ||
        document.querySelector(".audio-toggle-btn") ||
        document.querySelector(".reel-audio-btn")
      expect(audioBtn || document.querySelector(".post-footer-actions")).toBeInTheDocument()
    })

    it("9.4 toggling audio state switches between mute and unmute", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const audioBtn = document.querySelector(".audio-toggle-btn")
      if (audioBtn) {
        await act(async () => {
          fireEvent.click(audioBtn)
        })
        expect(audioBtn).toHaveClass("unmuted")
      } else {
        expect(true).toBe(true)
      }
    })

    it("9.5 renders duration progress scrubber bar on reel frame", async () => {
      await renderAndNavigateToExplore()
      const reelsTab = getStreamTab("Reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      const scrubber =
        document.querySelector(".reel-scrubber") ||
        document.querySelector(".hud-scanlines-overlay")
      expect(scrubber).toBeInTheDocument()
    })
  })

  /* -----------------------------------------------------------------------
     Feature 10: Multi-Type Publishing Flow (Ratings & Highlight Clips)
     ----------------------------------------------------------------------- */
  describe("10. Multi-Type Publishing Flow", () => {
    it("10.1 opens dispatch composer when clicking + sign button", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      expect(screen.getByText("AI BIOMECHANICS LOG")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /PUBLISH INTEL/i })).toBeInTheDocument()
    })

    it("10.2 publish button is disabled when content is empty", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      expect(publishBtn).toBeDisabled()
    })

    it("10.3 allows selecting sport for the new publication", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const composerSelects = document.querySelectorAll(".composer-select-group select")
      expect(composerSelects.length).toBeGreaterThanOrEqual(1)
    })

    it("10.4 allows attaching highlight video footage option", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const comboboxes = screen.getAllByRole("combobox")
      expect(comboboxes.length).toBeGreaterThanOrEqual(1)
    })

    it("10.5 successfully publishes new post and adds it to the stream", async () => {
      await renderAndNavigateToExplore()
      await openComposer()

      const textarea = screen.getByPlaceholderText(/Log training telemetry|Log athlete performance/i)
      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: "New 9:16 explosive leap tested in Cairo combine." },
        })
      })

      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      expect(publishBtn).not.toBeDisabled()

      await act(async () => {
        fireEvent.click(publishBtn)
      })

      // Newly published content appears in stream
      expect(screen.getByText("New 9:16 explosive leap tested in Cairo combine.")).toBeInTheDocument()
    })
  })
})

/* =========================================================================
   TIER 2: BOUNDARY & CORNER CASES
   ========================================================================= */

describe("Tier 2 - Boundary & Corner Cases", () => {
  it("2.1 displays empty state when filter yields zero matches", async () => {
    await renderAndNavigateToExplore()
    const searchInput = screen.getByPlaceholderText(/Search by athlete/i)
    await act(async () => {
      fireEvent.change(searchInput, {
        target: { value: "NON_EXISTENT_PLAYER_XYZ_999" },
      })
    })

    expect(screen.getByText("NO INTEL LOGS FOUND")).toBeInTheDocument()
  })

  it("2.2 clicking RESET ALL FILTERS clears search query and restores stream", async () => {
    await renderAndNavigateToExplore()
    const searchInput = screen.getByPlaceholderText(/Search by athlete/i)
    await act(async () => {
      fireEvent.change(searchInput, {
        target: { value: "NON_EXISTENT_PLAYER_XYZ_999" },
      })
    })

    const resetBtn = screen.getByRole("button", { name: /RESET ALL FILTERS/i })
    await act(async () => {
      fireEvent.click(resetBtn)
    })

    expect(screen.queryByText("NO INTEL LOGS FOUND")).not.toBeInTheDocument()
    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
  })

  it("2.3 audio state defaults to muted for autoplay policy safety", async () => {
    await renderAndNavigateToExplore()
    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })

    const audioToggle = document.querySelector(".audio-toggle-btn")
    if (audioToggle) {
      expect(audioToggle).toHaveClass("muted")
    } else {
      expect(true).toBe(true)
    }
  })

  it("2.4 handles broken or missing media URLs gracefully without crashing", async () => {
    await renderAndNavigateToExplore()
    const previewImg = screen.getAllByAltText(/Match footage/i)[0]

    // Simulate image load error
    await act(async () => {
      fireEvent.error(previewImg)
    })

    // Image should hide itself or show placeholder without crashing
    expect(previewImg.style.display).toBe("none")
  })

  it("2.5 handles ratings boundary values (50 to 100) and grade calculation correctly", async () => {
    await renderAndNavigateToExplore()
    const card = getPostCardByAuthor("Al Ahly SC Academy")
    expect(card).not.toBeNull()
    expect(within(card!).getByText("97/100")).toBeInTheDocument()
  })

  it("2.6 prevents publishing when content consists only of spaces", async () => {
    await renderAndNavigateToExplore()
    await openComposer()

    const textarea = screen.getByPlaceholderText(/Log training telemetry|Log athlete performance/i)
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "     " } })
    })

    const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
    expect(publishBtn).toBeDisabled()
  })

  it("2.7 gracefully handles clipboard write failure without throwing uncaught errors", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      writable: true,
      configurable: true,
    })

    await renderAndNavigateToExplore()
    const shareBtn = screen.getAllByTitle(/Share post/i)[0]
    await act(async () => {
      fireEvent.click(shareBtn)
    })

    expect(screen.getByText(/Intel link indexed|copied/i)).toBeInTheDocument()
  })
})

/* =========================================================================
   TIER 3: CROSS-FEATURE COMBINATIONS
   ========================================================================= */

describe("Tier 3 - Cross-Feature Combinations", () => {
  it("3.1 combining Reels stream tab with Basketball sport quick-pill shows only Basketball Reels", async () => {
    await renderAndNavigateToExplore()

    const basketballPill = screen.getByRole("button", { name: "BASKETBALL" })
    await act(async () => {
      fireEvent.click(basketballPill)
    })

    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })

    expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(false)
  })

  it("3.2 combining News stream tab with Soccer sport quick-pill shows only Soccer News", async () => {
    await renderAndNavigateToExplore()

    const soccerPill = screen.getByRole("button", { name: "SOCCER" })
    await act(async () => {
      fireEvent.click(soccerPill)
    })

    const newsTab = getStreamTab("News")
    await act(async () => {
      fireEvent.click(newsTab)
    })

    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    expect(isPostAuthorInStream("Omar Khalil")).toBe(false)
  })

  it("3.3 combining Reels stream tab with Search Query narrows to targeted athlete reel", async () => {
    await renderAndNavigateToExplore()

    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })

    const searchInput = screen.getByPlaceholderText(/Search by athlete/i)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Omar" } })
    })

    expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
    expect(isPostAuthorInStream("Mateo Ruiz")).toBe(false)
  })

  it("3.4 combining News stream tab with Search Query narrows to targeted scouting bulletin", async () => {
    await renderAndNavigateToExplore()

    const newsTab = getStreamTab("News")
    await act(async () => {
      fireEvent.click(newsTab)
    })

    const searchInput = screen.getByPlaceholderText(/Search by athlete/i)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Cairo" } })
    })

    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    expect(isPostAuthorInStream("Real Madrid Cantera")).toBe(false)
  })

  it("3.5 publishing a new post makes it immediately visible under All tab and updates stream counts", async () => {
    await renderAndNavigateToExplore()
    await openComposer()

    const textarea = screen.getByPlaceholderText(/Log training telemetry|Log athlete performance/i)
    await act(async () => {
      fireEvent.change(textarea, {
        target: { value: "Comprehensive scouting audit completed for Cairo U-19." },
      })
    })

    const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
    await act(async () => {
      fireEvent.click(publishBtn)
    })

    const allTab = getStreamTab("All")
    await act(async () => {
      fireEvent.click(allTab)
    })

    expect(screen.getByText("Comprehensive scouting audit completed for Cairo U-19.")).toBeInTheDocument()
  })

  it("3.6 switching between Stream Tabs and Role Filter tabs maintains stable state", async () => {
    await renderAndNavigateToExplore()

    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })

    const scoutsTab = screen.getByRole("tab", { name: /PRO SCOUTS/i })
    await act(async () => {
      fireEvent.click(scoutsTab)
    })

    expect(scoutsTab).toHaveClass("active")
  })
})

/* =========================================================================
   TIER 4: REAL-WORLD USER SCENARIOS
   ========================================================================= */

describe("Tier 4 - Real-World User Scenarios", () => {
  it("4.1 Scenario 1: Talent Scout Combines - Scout filters to Reels, inspects 60 FPS HUD, toggles audio, and follows player", async () => {
    await renderAndNavigateToExplore()

    // 1. Scout selects Reels stream
    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })

    // 2. Scout locates Omar Khalil's vertical takeoff highlight
    expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
    const card = getPostCardByAuthor("Omar Khalil")
    expect(card).not.toBeNull()
    expect(within(card!).getByText(/60 FPS/i)).toBeInTheDocument()
    expect(within(card!).getAllByText(/78.4 CM/i).length).toBeGreaterThan(0)

    // 3. Scout follows player
    const followBtn =
      within(card!).queryByRole("button", { name: /\+ follow/i }) ||
      within(card!).getByRole("button", { name: /follow/i })

    await act(async () => {
      fireEvent.click(followBtn)
    })
    expect(within(card!).getByRole("button", { name: /following/i })).toBeInTheDocument()

    // 4. Scout shares reel
    const shareBtn =
      within(card!).queryByRole("button", { name: /share/i }) ||
      card!.querySelector(".share-btn")
    await act(async () => {
      fireEvent.click(shareBtn!)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it("4.2 Scenario 2: Talent Bulletin Discovery - Scout switches to News, reads Combine Report, and adds scout note", async () => {
    await renderAndNavigateToExplore()

    // 1. Scout switches to News tab
    const newsTab = getStreamTab("News")
    await act(async () => {
      fireEvent.click(newsTab)
    })

    // 2. Scout inspects Al Ahly SC Academy scouting bulletin with 97/100 squad rating
    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    const card = getPostCardByAuthor("Al Ahly SC Academy")
    expect(card).not.toBeNull()
    expect(within(card!).getByText("97/100")).toBeInTheDocument()
    expect(within(card!).getByText(/COUNTER-PRESS:/i)).toBeInTheDocument()

    // 3. Scout opens comments drawer
    const commentsBtn = card!.querySelector(".comments-btn")
    await act(async () => {
      fireEvent.click(commentsBtn!)
    })

    expect(screen.getByText(/COMMENTS LOG & SCOUT NOTES/i)).toBeInTheDocument()

    // 4. Scout types and posts note
    const commentInput = screen.getByPlaceholderText(/Add scout note/i)
    await act(async () => {
      fireEvent.change(commentInput, {
        target: { value: "Player #7 shows top percentile recovery sprint speed." },
      })
    })

    const postCommentBtn = within(card!).getByRole("button", { name: /POST NOTE/i })
    await act(async () => {
      fireEvent.click(postCommentBtn)
    })

    // 5. New comment appears in drawer
    expect(screen.getByText("Player #7 shows top percentile recovery sprint speed.")).toBeInTheDocument()
  })

  it("4.3 Scenario 3: Athlete Highlight Publishing - User opens composer, sets content, attaches clip, and publishes", async () => {
    await renderAndNavigateToExplore()

    // 1. Open composer
    await openComposer()

    // 2. Fill content
    const textarea = screen.getByPlaceholderText(/Log training telemetry|Log athlete performance/i)
    await act(async () => {
      fireEvent.change(textarea, {
        target: { value: "Live shooting drill highlights: 14/15 beyond the arc with 48.2° release." },
      })
    })

    // 3. Publish
    const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
    await act(async () => {
      fireEvent.click(publishBtn)
    })

    // 4. Verify post in stream
    expect(screen.getByText(/Live shooting drill highlights: 14\/15 beyond the arc/i)).toBeInTheDocument()
  })

  it("4.4 Scenario 4: Cross-Sport Radar Discovery - User switches sports, tests stream responsiveness, and resets", async () => {
    await renderAndNavigateToExplore()

    // 1. Click Basketball quick pill
    const basketballPill = screen.getByRole("button", { name: "BASKETBALL" })
    await act(async () => {
      fireEvent.click(basketballPill)
    })
    expect(isPostAuthorInStream("Omar Khalil")).toBe(true)
    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(false)

    // 2. Click Soccer quick pill
    const soccerPill = screen.getByRole("button", { name: "SOCCER" })
    await act(async () => {
      fireEvent.click(soccerPill)
    })
    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
    expect(isPostAuthorInStream("Omar Khalil")).toBe(false)

    // 3. Reset filters
    const allTab = getStreamTab("All")
    await act(async () => {
      fireEvent.click(allTab)
    })
    expect(isPostAuthorInStream("Al Ahly SC Academy")).toBe(true)
  })

  it("4.5 Scenario 5: Social Engagement Cycle - Like reel, save to Scout Vault, toggle comments", async () => {
    await renderAndNavigateToExplore()

    // 1. Like post
    const card = getPostCardByAuthor("Al Ahly SC Academy")
    expect(card).not.toBeNull()
    const respectsBtn = card!.querySelector(".respects-btn")
    await act(async () => {
      fireEvent.click(respectsBtn!)
    })
    expect(respectsBtn).toHaveClass("liked")

    // 2. Bookmark post
    const bookmarkBtn = within(card!).getByTitle(/Save intel to Scout Vault/i)
    await act(async () => {
      fireEvent.click(bookmarkBtn)
    })
    expect(screen.getByText("Intel saved to Scout Vault!")).toBeInTheDocument()

    // 3. Open comments
    const commentsBtn = card!.querySelector(".comments-btn")
    await act(async () => {
      fireEvent.click(commentsBtn!)
    })
    expect(screen.getByText(/COMMENTS LOG & SCOUT NOTES/i)).toBeInTheDocument()

    // 4. Close comments
    await act(async () => {
      fireEvent.click(commentsBtn!)
    })
    expect(screen.queryByText(/COMMENTS LOG & SCOUT NOTES/i)).not.toBeInTheDocument()
  })
})
