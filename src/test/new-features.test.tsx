import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import React from "react"
import MediaEditorModal from "../components/MediaEditorModal"
import ScoutReportViewerModal, { type AttachedReportData } from "../components/ScoutReportViewerModal"
import ReelsStreamModal from "../components/ReelsStreamModal"
import LiveMatchStreamView from "../components/LiveMatchStreamView"
import Search3DPopover from "../components/Search3DPopover"
import { type FeedPost } from "../components/ReelCard9x16"
import { type DirectoryProfile } from "../App"

describe("New Features Suite: Reels Stream, Media Editor, Live Stream Analysis & Search", () => {
  const sampleReels: FeedPost[] = [
    {
      id: "reel-test-1",
      authorName: "Marcus Vance",
      authorRole: "Player",
      authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      sport: "Basketball",
      timestamp: "10m ago",
      content: "Explosive vertical combine workout with 78cm takeoff.",
      mediaUrl: "https://images.unsplash.com/photo-1762025884013-8a42741468e2",
      videoUrl: "https://images.unsplash.com/photo-1762025884013-8a42741468e2",
      likes: 85,
      commentsCount: 2,
      isVerified: true,
      postType: "reel",
      streamType: "reel",
      rating: 95,
      ratingGrade: "A",
      hasReport: true,
      reportData: {
        title: "Marcus Vance · Biomechanics Dossier",
        overallScore: 95,
        overallGrade: "A",
        athleteName: "Marcus Vance",
        sport: "Basketball",
        fileName: "marcus_vance_combine.pdf",
        tacticalNotes: "Superior vertical kinematics and second-jump recovery.",
        strengths: ["Vertical leap 78cm", "Fast twitch burst"],
        weaknesses: ["Post contact stability"],
      },
      comments: [
        {
          id: "c-1",
          authorName: "Coach Alex",
          authorRole: "Scout",
          content: "Elite takeoff speed.",
          timestamp: "5m ago",
        },
      ],
    },
    {
      id: "reel-test-2",
      authorName: "Ziad El-Sayed",
      authorRole: "Player",
      authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      sport: "Soccer",
      timestamp: "1h ago",
      content: "Matchday acceleration keyframes at 33.8 km/h.",
      mediaUrl: "https://images.unsplash.com/photo-1762025753986-b6227fe6debb",
      videoUrl: "https://images.unsplash.com/photo-1762025753986-b6227fe6debb",
      likes: 120,
      commentsCount: 4,
      isVerified: true,
      postType: "reel",
      streamType: "reel",
      rating: 96,
      ratingGrade: "A+",
    },
  ]

  const sampleProfiles: DirectoryProfile[] = [
    {
      id: "p-1",
      name: "Marcus Vance",
      role: "Player",
      town: "Athens",
      country: "Greece",
      flag: "🇬🇷",
      sport: "Basketball",
      score: 95,
      meta: "Guard · 188cm · Verified Recruit",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      followers: 450,
      following: 120,
    },
  ]

  describe("1. MediaEditorModal Component", () => {
    it("renders editor modal with aspect ratio, filter, and overlay controls", () => {
      const handlePublish = vi.fn()
      const handleClose = vi.fn()

      render(
        <MediaEditorModal
          isOpen={true}
          onClose={handleClose}
          onPublish={handlePublish}
          currentUserName="Omar Khalil"
        />,
      )

      expect(screen.getByRole("dialog", { name: /Highlight Reel Media Editor/i })).toBeInTheDocument()
      expect(screen.getByText(/HIGHLIGHT REEL & POST MEDIA EDITOR/i)).toBeInTheDocument()
      expect(screen.getByText(/9:16 Reel/i)).toBeInTheDocument()
      expect(screen.getByText(/Cyber Gold/i)).toBeInTheDocument()
      expect(screen.getByText(/ATTACH SCOUTING \/ MATCH REPORT \(OPTIONAL\)/i)).toBeInTheDocument()
    })

    it("publishes edited reel with optional report when publish button clicked", () => {
      const handlePublish = vi.fn()
      const handleClose = vi.fn()

      render(
        <MediaEditorModal
          isOpen={true}
          onClose={handleClose}
          onPublish={handlePublish}
          currentUserName="Marcus Vance"
          defaultSport="Basketball"
        />,
      )

      // Enter caption
      const captionInput = screen.getByPlaceholderText(/Describe the play/i)
      fireEvent.change(captionInput, { target: { value: "Insane dunk from baseline!" } })

      // Toggle optional report
      const reportCheckbox = screen.getByLabelText(/ATTACH SCOUTING \/ MATCH REPORT \(OPTIONAL\)/i)
      fireEvent.click(reportCheckbox)

      // Click Publish
      const publishBtn = screen.getByRole("button", { name: /PUBLISH HIGHLIGHT REEL/i })
      fireEvent.click(publishBtn)

      expect(handlePublish).toHaveBeenCalledTimes(1)
      const callData = handlePublish.mock.calls[0][0]
      expect(callData.content).toBe("Insane dunk from baseline!")
      expect(callData.hasReport).toBe(true)
      expect(callData.sport).toBe("Basketball")
      expect(callData.postType).toBe("reel")
    })
  })

  describe("2. ScoutReportViewerModal Component", () => {
    it("renders scouting dossier with grade, kinematics, and download button", () => {
      const handleClose = vi.fn()
      const reportData: AttachedReportData = {
        title: "Marcus Vance Combine Dossier",
        overallScore: 96,
        overallGrade: "A+",
        athleteName: "Marcus Vance",
        sport: "Basketball",
        fileName: "marcus_report.pdf",
        tacticalNotes: "Elite transition playmaker with 60 FPS verification.",
      }

      render(
        <ScoutReportViewerModal
          isOpen={true}
          onClose={handleClose}
          report={reportData}
          athleteName="Marcus Vance"
        />,
      )

      expect(screen.getByRole("dialog", { name: /Scouting Report Dossier/i })).toBeInTheDocument()
      expect(screen.getByText(/Marcus Vance Combine Dossier/i)).toBeInTheDocument()
      expect(screen.getByText("A+")).toBeInTheDocument()
      expect(screen.getByText(/Download Dossier/i)).toBeInTheDocument()

      const closeBtn = screen.getByRole("button", { name: /Close report modal/i })
      fireEvent.click(closeBtn)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("3. ReelsStreamModal Component (Instagram Style Vertical Snap Stream)", () => {
    it("renders fullscreen reels stream with right action column and bottom overlay", () => {
      const handleLike = vi.fn()
      const handleFollow = vi.fn()
      const handleComment = vi.fn()
      const handleShare = vi.fn()
      const handleClose = vi.fn()

      render(
        <ReelsStreamModal
          isOpen={true}
          onClose={handleClose}
          initialPostId="reel-test-1"
          posts={sampleReels}
          onToggleLike={handleLike}
          onToggleFollow={handleFollow}
          onAddComment={handleComment}
          onShare={handleShare}
        />,
      )

      expect(screen.getByRole("dialog", { name: /Instagram Style Fullscreen Reels Stream/i })).toBeInTheDocument()
      expect(screen.getByText(/REELS STREAM/i)).toBeInTheDocument()
      expect(screen.getByText("Marcus Vance")).toBeInTheDocument()

      // Like button
      const likeBtn = screen.getAllByRole("button", { name: /Like reel/i })[0]
      fireEvent.click(likeBtn)
      expect(handleLike).toHaveBeenCalledWith("reel-test-1")

      // Close button
      const closeBtn = screen.getByRole("button", { name: /Close reels stream/i })
      fireEvent.click(closeBtn)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("4. LiveMatchStreamView Component", () => {
    it("renders live match stream with scoreboard, live clock, and live analysis logging", () => {
      const handleClose = vi.fn()

      render(
        <LiveMatchStreamView
          onClose={handleClose}
          currentUserName="Chief Scout"
          currentUserRole="Scout"
        />,
      )

      expect(screen.getByText(/LIVE SCOUTING BROADCAST/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Ajax U19/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Benfica U19/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/2D TACTICAL PITCH ZONES/i)).toBeInTheDocument()

      // Open Add Analysis modal
      const addAnalysisBtn = screen.getByRole("button", { name: /\+ ADD LIVE MATCH ANALYSIS/i })
      fireEvent.click(addAnalysisBtn)

      expect(screen.getByText(/LOG LIVE MATCH ANALYSIS EVENT/i)).toBeInTheDocument()

      // Enter observation
      const noteInput = screen.getByPlaceholderText(/e\.g\. Excellent first-touch/i)
      fireEvent.change(noteInput, { target: { value: "Superb interception in defensive third." } })

      // Submit
      const submitBtn = screen.getByRole("button", { name: /LOG ANALYSIS POINT/i })
      fireEvent.click(submitBtn)

      expect(screen.getAllByText(/Superb interception in defensive third\./i).length).toBeGreaterThan(0)
    })
  })

  describe("5. Search3DPopover Component (Linking Accounts, Dashboard, & Live Streams)", () => {
    it("displays accounts with Dashboard quick actions and navigates to Dashboard", () => {
      const handleSelectProfile = vi.fn()
      const handleNavigate = vi.fn()
      const handleClose = vi.fn()

      render(
        <Search3DPopover
          isOpen={true}
          onClose={handleClose}
          profiles={sampleProfiles}
          onSelectProfile={handleSelectProfile}
          onNavigateView={handleNavigate}
        />,
      )

      expect(screen.getByRole("dialog", { name: /Search Discovery Screen/i })).toBeInTheDocument()
      expect(screen.getByText("Marcus Vance")).toBeInTheDocument()

      // Click Dashboard button next to Marcus Vance
      const dashBtn = screen.getByRole("button", { name: /View Marcus Vance's biometric dashboard/i })
      fireEvent.click(dashBtn)

      expect(handleNavigate).toHaveBeenCalledWith("Dashboard", expect.objectContaining({ athlete: sampleProfiles[0] }))
    })

    it("displays dashboard modules and navigates on click", () => {
      const handleSelectProfile = vi.fn()
      const handleNavigate = vi.fn()
      const handleClose = vi.fn()

      render(
        <Search3DPopover
          isOpen={true}
          onClose={handleClose}
          profiles={sampleProfiles}
          onSelectProfile={handleSelectProfile}
          onNavigateView={handleNavigate}
        />,
      )

      expect(screen.getByText(/Full Biomechanics Dashboard/i)).toBeInTheDocument()
      expect(screen.getByText(/Wearable Sensor Telemetry/i)).toBeInTheDocument()

      // Click Wearable module
      const wearableRow = screen.getByText(/Wearable Sensor Telemetry/i)
      fireEvent.click(wearableRow)

      expect(handleNavigate).toHaveBeenCalledWith("Wearable")
    })
  })
})

