import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import React from "react"
import ReelCard9x16, { type FeedPost } from "../components/ReelCard9x16"
import App from "../App"

describe("ReelCard9x16 Component & Reels Feed Suite", () => {
  const sampleReelPost: FeedPost = {
    id: "post-reel-1",
    authorName: "Omar Khalil",
    authorRole: "Player",
    authorImage:
      "https://images.unsplash.com/photo-1772480476707-cc5170235189?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Basketball",
    timestamp: "1h ago",
    content:
      "Vertical takeoff workout today in Alexandria. Hit 78.4 cm with 0.83 sec hang time. Verified directly with Scot AI Vision Engine keyframe analysis!",
    mediaUrl:
      "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80",
    videoUrl:
      "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80",
    likes: 67,
    commentsCount: 1,
    isVerified: true,
    postType: "reel",
    streamType: "reel",
    rating: 94,
    ratingGrade: "A",
    isFollowing: false,
    isAudioMuted: true,
    metrics: [
      { label: "VERTICAL ELEVATION", value: "78.4 CM" },
      { label: "HANG TIME", value: "0.83 SEC" },
      { label: "TAKEOFF ACCEL", value: "3.84 M/S²" },
    ],
    comments: [
      {
        id: "c-101",
        authorName: "Mateo Ruiz",
        authorRole: "Player",
        content: "Insane elevation Omar! The hip flexion on takeoff is text-book.",
        timestamp: "45m ago",
      },
    ],
  }

  describe("1. 9:16 Vertical Highlight Reel Container & HUD Reticles", () => {
    it("renders card with 9:16 aspect ratio container and data-aspect attribute", () => {
      const handleToggleFollow = vi.fn()
      const handleToggleLike = vi.fn()
      const handleToggleComments = vi.fn()
      const handleShare = vi.fn()

      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={handleToggleFollow}
          onToggleLike={handleToggleLike}
          onToggleComments={handleToggleComments}
          onShare={handleShare}
        />,
      )

      const card = document.querySelector(".reel-card-9x16")
      expect(card).toBeInTheDocument()
      expect(card?.getAttribute("data-aspect")).toBe("9:16")
      expect(card?.getAttribute("data-testid")).toBe("reel-card-post-reel-1")
    })

    it("renders four cybernetic gold corner reticles", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(document.querySelector(".hud-reticle.top-left")).toBeInTheDocument()
      expect(document.querySelector(".hud-reticle.top-right")).toBeInTheDocument()
      expect(document.querySelector(".hud-reticle.bottom-left")).toBeInTheDocument()
      expect(document.querySelector(".hud-reticle.bottom-right")).toBeInTheDocument()
    })

    it("renders cybernetic scanline overlay with pointer-events pass-through", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const scanlines = document.querySelector(".hud-scanlines-overlay")
      expect(scanlines).toBeInTheDocument()
    })

    it("renders 60 FPS YOLOv11 VISION badge with pulsing beacon dot", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText(/60 FPS · YOLOv11 VISION/i)).toBeInTheDocument()
      expect(document.querySelector(".hud-pulse-dot")).toBeInTheDocument()
    })

    it("renders performance grade stamp (GRADE A)", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText("GRADE A")).toBeInTheDocument()
      expect(document.querySelector(".reel-grade-stamp")).toBeInTheDocument()
    })

    it("renders verified scout rating score shield (94/100)", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const shield = document.querySelector(".reel-rating-shield")
      expect(shield).toBeInTheDocument()
      expect(within(shield as HTMLElement).getByText("94")).toBeInTheDocument()
      expect(within(shield as HTMLElement).getByText("/100")).toBeInTheDocument()
    })
  })

  describe("2. Athlete Profile & Follow Action", () => {
    it("renders athlete avatar, verified shield, name, and sport tag", () => {
      const handleSelectProfile = vi.fn()
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
          onSelectProfile={handleSelectProfile}
        />,
      )

      const avatar = screen.getByAltText("Omar Khalil")
      expect(avatar).toBeInTheDocument()
      expect(avatar.getAttribute("src")).toBe(sampleReelPost.authorImage)

      expect(screen.getByText("Omar Khalil")).toBeInTheDocument()
      expect(document.querySelector(".verified-shield-icon")).toBeInTheDocument()
      expect(screen.getByText("BASKETBALL")).toBeInTheDocument()
      expect(screen.getByText("1h ago")).toBeInTheDocument()

      // Invokes profile selection callback when clicked
      fireEvent.click(screen.getByText("Omar Khalil"))
      expect(handleSelectProfile).toHaveBeenCalledWith("Omar Khalil")
    })

    it("renders '+ Follow' button when unfollowed and calls onToggleFollow", () => {
      const handleToggleFollow = vi.fn()
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={handleToggleFollow}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const followBtn = screen.getByRole("button", { name: /\+ follow/i })
      expect(followBtn).toBeInTheDocument()

      fireEvent.click(followBtn)
      expect(handleToggleFollow).toHaveBeenCalledWith("Omar Khalil")
    })

    it("renders 'Following ✓' button when athlete is already followed", () => {
      const handleToggleFollow = vi.fn()
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={true}
          onToggleFollow={handleToggleFollow}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const followingBtn = screen.getByRole("button", { name: /following ✓/i })
      expect(followingBtn).toBeInTheDocument()
      expect(followingBtn).toHaveClass("following")

      fireEvent.click(followingBtn)
      expect(handleToggleFollow).toHaveBeenCalledWith("Omar Khalil")
    })

    it("renders reel caption and kinematic telemetry pills", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(
        screen.getByText(/Vertical takeoff workout today in Alexandria/i),
      ).toBeInTheDocument()

      expect(screen.getByText("78.4 CM")).toBeInTheDocument()
      expect(screen.getByText("0.83 SEC")).toBeInTheDocument()
      expect(screen.getByText("3.84 M/S²")).toBeInTheDocument()
    })
  })

  describe("3. Right-Hand Floating Action Bar", () => {
    it("renders vertical floating action bar", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const actionBar = document.querySelector(".reel-floating-actions")
      expect(actionBar).toBeInTheDocument()
    })

    it("like button displays count and calls onToggleLike when clicked", () => {
      const handleToggleLike = vi.fn()
      const { rerender } = render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={handleToggleLike}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const likeBtn = document.querySelector(".reel-action-btn.like")
      expect(likeBtn).toBeInTheDocument()
      expect(within(likeBtn as HTMLElement).getByText("67")).toBeInTheDocument()

      fireEvent.click(likeBtn as HTMLElement)
      expect(handleToggleLike).toHaveBeenCalledWith("post-reel-1")

      // Rerender with isLiked = true
      rerender(
        <ReelCard9x16
          post={{ ...sampleReelPost, isLiked: true, likes: 68 }}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={handleToggleLike}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )
      expect(document.querySelector(".reel-action-btn.like")).toHaveClass("liked")
      expect(screen.getByText("68")).toBeInTheDocument()
    })

    it("audio button defaults to muted and toggles between muted and unmuted", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const audioBtn = document.querySelector(".audio-toggle-btn")
      expect(audioBtn).toBeInTheDocument()
      expect(audioBtn).toHaveClass("muted")
      expect(screen.getByText("OFF")).toBeInTheDocument()

      fireEvent.click(audioBtn as HTMLElement)
      expect(audioBtn).toHaveClass("unmuted")
      expect(screen.getByText("ON")).toBeInTheDocument()

      fireEvent.click(audioBtn as HTMLElement)
      expect(audioBtn).toHaveClass("muted")
      expect(screen.getByText("OFF")).toBeInTheDocument()
    })

    it("share button triggers onShare callback", () => {
      const handleShare = vi.fn()
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={handleShare}
        />,
      )

      const shareBtn = document.querySelector(".reel-action-btn.share")
      expect(shareBtn).toBeInTheDocument()

      fireEvent.click(shareBtn as HTMLElement)
      expect(handleShare).toHaveBeenCalledWith(sampleReelPost)
    })

    it("save to vault button renders and calls onSaveToVault when provided", () => {
      const handleSave = vi.fn()
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
          onSaveToVault={handleSave}
          isSaved={false}
        />,
      )

      const vaultBtn = screen.getByRole("button", { name: /save to scout vault/i })
      expect(vaultBtn).toBeInTheDocument()

      fireEvent.click(vaultBtn)
      expect(handleSave).toHaveBeenCalledWith("post-reel-1")
    })
  })

  describe("4. Comments Drawer & Note Publishing", () => {
    it("comments button displays counter and toggles comments drawer", () => {
      const handleToggleComments = vi.fn()
      const { rerender } = render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={handleToggleComments}
          onShare={vi.fn()}
          isCommentsOpen={false}
        />,
      )

      const commentsBtn = document.querySelector(".reel-action-btn.comments")
      expect(commentsBtn).toBeInTheDocument()
      expect(within(commentsBtn as HTMLElement).getByText("1")).toBeInTheDocument()

      fireEvent.click(commentsBtn as HTMLElement)
      expect(handleToggleComments).toHaveBeenCalledWith("post-reel-1")

      // Open drawer
      rerender(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={handleToggleComments}
          onShare={vi.fn()}
          isCommentsOpen={true}
        />,
      )

      const drawer = document.querySelector(".post-comments-drawer")
      expect(drawer).toBeInTheDocument()
      expect(screen.getByText(/COMMENTS LOG & SCOUT NOTES \(1\)/i)).toBeInTheDocument()
      expect(screen.getByText("Mateo Ruiz")).toBeInTheDocument()
      expect(
        screen.getByText(/Insane elevation Omar! The hip flexion on takeoff is text-book./i),
      ).toBeInTheDocument()
    })

    it("allows drafting and submitting a new scout comment", () => {
      const handleAddComment = vi.fn()
      const handleDraftChange = vi.fn()

      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
          isCommentsOpen={true}
          commentDraft="Excellent kinematic extension on release."
          onCommentDraftChange={handleDraftChange}
          onAddComment={handleAddComment}
        />,
      )

      const input = screen.getByPlaceholderText(/Add scout note as/i)
      expect(input).toHaveValue("Excellent kinematic extension on release.")

      fireEvent.change(input, { target: { value: "Updated test note" } })
      expect(handleDraftChange).toHaveBeenCalledWith("Updated test note")

      const postNoteBtn = screen.getByRole("button", { name: /POST NOTE/i })
      expect(postNoteBtn).not.toBeDisabled()

      fireEvent.click(postNoteBtn)
      expect(handleAddComment).toHaveBeenCalledWith("post-reel-1")
    })

    it("submits comment via Enter keypress", () => {
      const handleAddComment = vi.fn()

      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
          isCommentsOpen={true}
          commentDraft="Fast break acceleration noted."
          onAddComment={handleAddComment}
        />,
      )

      const input = screen.getByPlaceholderText(/Add scout note as/i)
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false })
      expect(handleAddComment).toHaveBeenCalledWith("post-reel-1")
    })
  })

  describe("5. Highlight Media Playback & Progress Scrubber", () => {
    it("renders video or keyframe preview with alt text 'Match footage'", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const media = document.querySelector(".reel-video")
      expect(media).toBeInTheDocument()
      expect(media?.getAttribute("alt")).toBe("Match footage")
    })

    it("renders duration progress scrubber bar with fill indicator", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const scrubber = document.querySelector(".reel-scrubber")
      expect(scrubber).toBeInTheDocument()
      expect(document.querySelector(".reel-scrubber-fill")).toBeInTheDocument()
    })

    it("clicking media container toggles play and pause state", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const mediaContainer = document.querySelector(".reel-media-wrapper")
      expect(mediaContainer).toBeInTheDocument()

      // Initially playing, so play overlay is not present
      expect(document.querySelector(".reel-play-overlay")).toBeNull()

      // Click to pause
      fireEvent.click(mediaContainer as HTMLElement)
      expect(document.querySelector(".reel-play-overlay")).toBeInTheDocument()

      // Click again to resume play
      fireEvent.click(mediaContainer as HTMLElement)
      expect(document.querySelector(".reel-play-overlay")).toBeNull()
    })

    it("handles image error gracefully by hiding broken media", () => {
      render(
        <ReelCard9x16
          post={sampleReelPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      const img = screen.getByAltText("Match footage")
      fireEvent.error(img)
      expect(img.style.display).toBe("none")
    })
  })

  describe("6. Edge Cases & Robustness", () => {
    it("handles post with missing metrics or comments without crashing", () => {
      const minimalPost: FeedPost = {
        id: "post-min-1",
        authorName: "Sarah Connor",
        authorRole: "Player",
        authorImage: "https://example.com/avatar.jpg",
        sport: "Tennis",
        timestamp: "5m ago",
        content: "Serve practice session keyframe.",
        likes: 0,
        commentsCount: 0,
      }

      render(
        <ReelCard9x16
          post={minimalPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
          isCommentsOpen={true}
        />,
      )

      expect(screen.getByText("Sarah Connor")).toBeInTheDocument()
      expect(screen.getByText("TENNIS")).toBeInTheDocument()
      expect(
        screen.getByText(/No comments recorded yet/i),
      ).toBeInTheDocument()
    })

    it("handles post with custom grade stamp and high score", () => {
      const highRatedPost: FeedPost = {
        ...sampleReelPost,
        rating: 99,
        ratingGrade: "A+",
      }

      render(
        <ReelCard9x16
          post={highRatedPost}
          isFollowing={false}
          onToggleFollow={vi.fn()}
          onToggleLike={vi.fn()}
          onToggleComments={vi.fn()}
          onShare={vi.fn()}
        />,
      )

      expect(screen.getByText("GRADE A+")).toBeInTheDocument()
      expect(screen.getByText("99")).toBeInTheDocument()
    })
  })
})
