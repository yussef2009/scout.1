import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within, act } from "@testing-library/react"
import React from "react"
import NewsBulletinCard, {
  calculateGrade,
  type FeedPost,
} from "../components/NewsBulletinCard"
import SocialPostCard from "../components/SocialPostCard"
import App from "../App"

describe("Posts & News Social UI + Multi-Type Publishing Suite", () => {
  const sampleNewsPost: FeedPost = {
    id: "post-news-sample-1",
    authorName: "Al Ahly SC Academy",
    authorRole: "Club",
    authorImage:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Soccer",
    timestamp: "18m ago",
    content:
      "Official lineup assessment for our U-18 squad completed ahead of the Cairo youth cup. Scot AI registered a 97 squad rating with top-tier counter-press transition metrics!",
    mediaUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    likes: 42,
    commentsCount: 2,
    isVerified: true,
    postType: "news",
    streamType: "news",
    newsCategory: "Scouting Bulletin",
    newsHeadline: "U-18 Cairo Youth Cup Squad Assessment",
    rating: 97,
    ratingGrade: "A+",
    metrics: [
      { label: "COUNTER-PRESS", value: "3.2s" },
      { label: "TRANSITION SPEED", value: "+14.8%" },
    ],
    comments: [
      {
        id: "c1",
        authorName: "EMEA Talent Scouts Ltd",
        authorRole: "Scout",
        content:
          "Outstanding defensive transition phase. We have indexed three players from this keyframe audit.",
        timestamp: "12m ago",
      },
    ],
  }

  const sampleSocialPost: FeedPost = {
    id: "post-dispatch-sample-1",
    authorName: "Kareem Tarek",
    authorRole: "Player",
    authorImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Basketball",
    timestamp: "2h ago",
    content:
      "Intense shooting session at the national training center. Recorded 18 straight three-pointers with high arc telemetry.",
    mediaUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
    likes: 35,
    commentsCount: 0,
    isVerified: true,
    postType: "dispatch",
    streamType: "dispatch",
    rating: 92,
    ratingGrade: "A-",
    metrics: [
      { label: "ARC ANGLE", value: "51.4°" },
      { label: "RELEASE VELOCITY", value: "8.1 M/S" },
    ],
    comments: [],
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })
  })

  /* -----------------------------------------------------------------------
     1. NewsBulletinCard Component Unit Tests
     ----------------------------------------------------------------------- */
  describe("1. NewsBulletinCard Component", () => {
    it("renders news bulletin card with category badge, headline, and author info", () => {
      const handleToggleLike = vi.fn()
      const handleToggleComments = vi.fn()
      const handleShare = vi.fn()

      render(
        <NewsBulletinCard
          post={sampleNewsPost}
          onToggleLike={handleToggleLike}
          onToggleComments={handleToggleComments}
          onShare={handleShare}
        />,
      )

      expect(screen.getByText("SCOUTING BULLETIN")).toBeInTheDocument()
      expect(screen.getByText("U-18 Cairo Youth Cup Squad Assessment")).toBeInTheDocument()
      expect(screen.getByText("Al Ahly SC Academy")).toBeInTheDocument()
      expect(screen.getByText("CLUB")).toBeInTheDocument()
      expect(screen.getByText("Soccer")).toBeInTheDocument()
    })

    it("renders verified rating score display and grade stamp", () => {
      render(
        <NewsBulletinCard
          post={sampleNewsPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText("97/100")).toBeInTheDocument()
      expect(screen.getByText("GRADE A+")).toBeInTheDocument()
    })

    it("renders biomechanical benchmark metrics strip with label and value", () => {
      render(
        <NewsBulletinCard
          post={sampleNewsPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText("COUNTER-PRESS:")).toBeInTheDocument()
      expect(screen.getByText("3.2s")).toBeInTheDocument()
      expect(screen.getByText("TRANSITION SPEED:")).toBeInTheDocument()
      expect(screen.getByText("+14.8%")).toBeInTheDocument()
    })

    it("renders 16:9 media container with 60 FPS vision tracking badges", () => {
      const { container } = render(
        <NewsBulletinCard
          post={sampleNewsPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByAltText("Match footage")).toBeInTheDocument()
      expect(screen.getByText("60 FPS · AI VISION TRACKING")).toBeInTheDocument()
      expect(screen.getByText("BIOMECHANICS VERIFIED")).toBeInTheDocument()
      expect(container.querySelector(".hud-scanlines-overlay")).toBeInTheDocument()
    })

    it("handles social engagement bar buttons (respects, comments, vault, share)", () => {
      const handleToggleLike = vi.fn()
      const handleToggleComments = vi.fn()
      const handleSaveToVault = vi.fn()
      const handleShare = vi.fn()

      const { container } = render(
        <NewsBulletinCard
          post={sampleNewsPost}
          onToggleLike={handleToggleLike}
          onToggleComments={handleToggleComments}
          onShare={handleShare}
          onSaveToVault={handleSaveToVault}
        />,
      )

      const respectsBtn = container.querySelector(".respects-btn")
      expect(respectsBtn).toBeInTheDocument()
      fireEvent.click(respectsBtn!)
      expect(handleToggleLike).toHaveBeenCalledWith(sampleNewsPost.id)

      const commentsBtn = container.querySelector(".comments-btn")
      expect(commentsBtn).toBeInTheDocument()
      fireEvent.click(commentsBtn!)
      expect(handleToggleComments).toHaveBeenCalledWith(sampleNewsPost.id)

      const vaultBtn = screen.getByTitle(/Save intel to Scout Vault/i)
      fireEvent.click(vaultBtn)
      expect(handleSaveToVault).toHaveBeenCalledWith(sampleNewsPost.id)

      const shareBtn = container.querySelector(".share-btn")
      expect(shareBtn).toBeInTheDocument()
      fireEvent.click(shareBtn!)
      expect(handleShare).toHaveBeenCalledWith(sampleNewsPost)
    })

    it("renders expandable comments drawer and handles posting scout notes", () => {
      const handleAddComment = vi.fn()

      render(
        <NewsBulletinCard
          post={sampleNewsPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
          isCommentsOpen={true}
          onAddComment={handleAddComment}
        />,
      )

      expect(screen.getByText(/COMMENTS LOG & SCOUT NOTES/i)).toBeInTheDocument()
      expect(screen.getByText(/Outstanding defensive transition phase/i)).toBeInTheDocument()

      const commentInput = screen.getByPlaceholderText(/Add scout note/i)
      fireEvent.change(commentInput, { target: { value: "Key player scouted." } })
      const postBtn = screen.getByRole("button", { name: /POST NOTE/i })
      fireEvent.click(postBtn)

      expect(handleAddComment).toHaveBeenCalledWith(sampleNewsPost.id)
    })

    it("correctly computes letter grades for various numerical ratings", () => {
      expect(calculateGrade(99)).toBe("A+")
      expect(calculateGrade(96)).toBe("A+")
      expect(calculateGrade(94)).toBe("A")
      expect(calculateGrade(91)).toBe("A-")
      expect(calculateGrade(87)).toBe("B+")
      expect(calculateGrade(82)).toBe("B")
      expect(calculateGrade(77)).toBe("B-")
      expect(calculateGrade(72)).toBe("C+")
      expect(calculateGrade(66)).toBe("C")
      expect(calculateGrade(61)).toBe("C-")
      expect(calculateGrade(55)).toBe("D")
    })
  })

  /* -----------------------------------------------------------------------
     2. SocialPostCard Component Unit Tests
     ----------------------------------------------------------------------- */
  describe("2. SocialPostCard Component", () => {
    it("renders social post card with author, verified badge, sport chip, and rating badge", () => {
      render(
        <SocialPostCard
          post={sampleSocialPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText("Kareem Tarek")).toBeInTheDocument()
      expect(screen.getByText("PLAYER")).toBeInTheDocument()
      expect(screen.getByText("Basketball")).toBeInTheDocument()
      expect(screen.getByText("92/100")).toBeInTheDocument()
      expect(screen.getByText("A-")).toBeInTheDocument()
    })

    it("renders telemetry metric pills and match footage preview with HUD", () => {
      const { container } = render(
        <SocialPostCard
          post={sampleSocialPost}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText("ARC ANGLE:")).toBeInTheDocument()
      expect(screen.getByText("51.4°")).toBeInTheDocument()
      expect(screen.getByAltText("Match footage")).toBeInTheDocument()
      expect(screen.getByText("60 FPS · AI VISION TRACKING")).toBeInTheDocument()
      expect(screen.getByText("BIOMECHANICS VERIFIED")).toBeInTheDocument()
      expect(container.querySelector(".hud-scanlines-overlay")).toBeInTheDocument()
    })

    it("triggers callbacks for likes, comments, and profile selection", () => {
      const handleToggleLike = vi.fn()
      const handleToggleComments = vi.fn()
      const handleSelectProfile = vi.fn()

      const { container } = render(
        <SocialPostCard
          post={sampleSocialPost}
          onToggleLike={handleToggleLike}
          onToggleComments={handleToggleComments}
          onShare={vi.fn()}
          onSelectProfile={handleSelectProfile}
        />,
      )

      const respectsBtn = container.querySelector(".respects-btn")
      fireEvent.click(respectsBtn!)
      expect(handleToggleLike).toHaveBeenCalledWith(sampleSocialPost.id)

      const commentsBtn = container.querySelector(".comments-btn")
      fireEvent.click(commentsBtn!)
      expect(handleToggleComments).toHaveBeenCalledWith(sampleSocialPost.id)

      const viewProfileBtn = screen.getByRole("button", { name: /VIEW PROFILE/i })
      fireEvent.click(viewProfileBtn)
      expect(handleSelectProfile).toHaveBeenCalledWith("Kareem Tarek")
    })
  })

  /* -----------------------------------------------------------------------
     3. Multi-Type Publishing & Stream Integration Tests
     ----------------------------------------------------------------------- */
  describe("3. Multi-Type Publishing & Stream Integration", () => {
    async function navigateToExploreAndOpenComposer() {
      render(<App />)
      const exploreBtn = screen.getAllByRole("button", { name: "Explore" })[0]
      await act(async () => {
        fireEvent.click(exploreBtn)
      })

      const addBtn =
        screen.queryByRole("button", { name: /Add new post/i }) ||
        screen.queryByTitle(/Add new post/i) ||
        screen.getByRole("button", { name: /\+/i })
      await act(async () => {
        fireEvent.click(addBtn)
      })
    }

    it("renders stream type selector buttons inside composer", async () => {
      await navigateToExploreAndOpenComposer()

      expect(screen.getByRole("button", { name: /^DISPATCH$/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /REEL \(9:16 HIGHLIGHT\)/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /NEWS BULLETIN/i })).toBeInTheDocument()
    })

    it("renders news-specific inputs when switching to NEWS BULLETIN", async () => {
      await navigateToExploreAndOpenComposer()

      const newsTypeBtn = screen.getByRole("button", { name: /NEWS BULLETIN/i })
      await act(async () => {
        fireEvent.click(newsTypeBtn)
      })

      expect(screen.getByPlaceholderText(/e\.g\. U-18 Cairo Youth Cup Squad Assessment/i)).toBeInTheDocument()
      expect(screen.getByText("INTELLIGENCE CATEGORY:")).toBeInTheDocument()
    })

    it("renders reel-specific inputs when switching to REEL", async () => {
      await navigateToExploreAndOpenComposer()

      const reelTypeBtn = screen.getByRole("button", { name: /REEL \(9:16 HIGHLIGHT\)/i })
      await act(async () => {
        fireEvent.click(reelTypeBtn)
      })

      expect(screen.getByText("DURATION:")).toBeInTheDocument()
      expect(screen.getByText(/9:16 VERTICAL HUD ENABLED/i)).toBeInTheDocument()
    })

    it("allows adjusting rating score and dynamically reflects grade update", async () => {
      await navigateToExploreAndOpenComposer()

      const ratingSlider = screen.getByLabelText(/Scot AI Rating/i)
      await act(async () => {
        fireEvent.change(ratingSlider, { target: { value: "88" } })
      })

      expect(screen.getByText("88/100")).toBeInTheDocument()
      expect(screen.getByText("GRADE B+")).toBeInTheDocument()
    })

    it("publishes a new News Bulletin and adds it to the live stream", async () => {
      await navigateToExploreAndOpenComposer()

      // 1. Switch to News Bulletin
      const newsTypeBtn = screen.getByRole("button", { name: /NEWS BULLETIN/i })
      await act(async () => {
        fireEvent.click(newsTypeBtn)
      })

      // 2. Set headline
      const headlineInput = screen.getByPlaceholderText(/e\.g\. U-18 Cairo Youth Cup/i)
      await act(async () => {
        fireEvent.change(headlineInput, {
          target: { value: "Alexandria Combine Speed Benchmarks" },
        })
      })

      // 3. Set content
      const textarea = screen.getByPlaceholderText(/Log training telemetry/i)
      await act(async () => {
        fireEvent.change(textarea, {
          target: {
            value: "Comprehensive sprint velocity audit for top 20 youth prospects completed.",
          },
        })
      })

      // 4. Publish
      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      await act(async () => {
        fireEvent.click(publishBtn)
      })

      // 5. Verify published bulletin appears in stream
      expect(screen.getByText("Alexandria Combine Speed Benchmarks")).toBeInTheDocument()
      expect(
        screen.getByText("Comprehensive sprint velocity audit for top 20 youth prospects completed."),
      ).toBeInTheDocument()

      // 6. Switch to News tab to ensure it is indexed under News
      const newsTab = screen.getByTestId("stream-tab-news")
      await act(async () => {
        fireEvent.click(newsTab)
      })

      expect(screen.getByText("Alexandria Combine Speed Benchmarks")).toBeInTheDocument()
    })

    it("publishes a new 9:16 Reel and renders it under Reels tab", async () => {
      await navigateToExploreAndOpenComposer()

      // 1. Switch to Reel
      const reelTypeBtn = screen.getByRole("button", { name: /REEL \(9:16 HIGHLIGHT\)/i })
      await act(async () => {
        fireEvent.click(reelTypeBtn)
      })

      // 2. Set content
      const textarea = screen.getByPlaceholderText(/Log training telemetry/i)
      await act(async () => {
        fireEvent.change(textarea, {
          target: {
            value: "Breakaway transition dunk keyframe analysis with 85 cm vertical pop.",
          },
        })
      })

      // 3. Publish
      const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
      await act(async () => {
        fireEvent.click(publishBtn)
      })

      // 4. Verify post in stream
      expect(
        screen.getByText("Breakaway transition dunk keyframe analysis with 85 cm vertical pop."),
      ).toBeInTheDocument()

      // 5. Switch to Reels tab
      const reelsTab = screen.getByTestId("stream-tab-reels")
      await act(async () => {
        fireEvent.click(reelsTab)
      })

      expect(
        screen.getByText("Breakaway transition dunk keyframe analysis with 85 cm vertical pop."),
      ).toBeInTheDocument()
    })
  })
})
