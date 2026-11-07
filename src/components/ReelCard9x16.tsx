import React, { useState } from "react"

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
  postType?: "dispatch" | "reel" | "news"
  streamType?: "dispatch" | "reel" | "news"
  rating?: number
  ratingGrade?: string
  newsCategory?: string
  newsHeadline?: string
  videoUrl?: string
  isFollowing?: boolean
  isAudioMuted?: boolean
  isMuted?: boolean
  sharesCount?: number
}

export interface ReelCard9x16Props {
  post: FeedPost
  isFollowing: boolean
  onToggleFollow: (authorName: string) => void
  onToggleLike: (postId: string) => void
  onToggleComments: (postId: string) => void
  onShare: (post: FeedPost) => void
  onSelectProfile?: (profile: any) => void
  isCommentsOpen?: boolean
  comments?: PostComment[]
  commentDraft?: string
  onCommentDraftChange?: (value: string) => void
  onAddComment?: (postId: string) => void
  currentUserName?: string
  currentUserRole?: string
  onSaveToVault?: (postId: string) => void
  isSaved?: boolean
  onOpenReport?: (post: FeedPost) => void
  onOpenStream?: (postId: string) => void
}

export function ReelCard9x16({
  post,
  isFollowing,
  onToggleFollow,
  onToggleLike,
  onToggleComments,
  onShare,
  onSelectProfile,
  isCommentsOpen: controlledCommentsOpen,
  comments: controlledComments,
  commentDraft: controlledCommentDraft,
  onCommentDraftChange,
  onAddComment,
  currentUserName = "Observer",
  currentUserRole = "Scout",
  onSaveToVault,
  isSaved = false,
  onOpenReport,
  onOpenStream,
}: ReelCard9x16Props) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(post.isAudioMuted ?? true)
  const [internalCommentsOpen, setInternalCommentsOpen] = useState(false)
  const [internalCommentDraft, setInternalCommentDraft] = useState("")
  const [localComments, setLocalComments] = useState<PostComment[]>(
    post.comments || [],
  )

  const isCommentsOpen =
    controlledCommentsOpen !== undefined
      ? controlledCommentsOpen
      : internalCommentsOpen

  const commentsList = controlledComments ?? localComments
  const commentDraft =
    controlledCommentDraft !== undefined
      ? controlledCommentDraft
      : internalCommentDraft

  const handleTogglePlay = (e: React.MouseEvent) => {
    // Only toggle if clicked directly on media wrapper or overlay
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest(".reel-floating-actions") || target.closest(".reel-bottom-overlay") || target.closest(".post-comments-drawer")) {
      return
    }
    setIsPlaying((prev) => !prev)
  }

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMuted((prev) => !prev)
  }

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleComments) {
      onToggleComments(post.id)
    }
    setInternalCommentsOpen((prev) => !prev)
  }

  const handleDraftChange = (value: string) => {
    if (onCommentDraftChange) {
      onCommentDraftChange(value)
    } else {
      setInternalCommentDraft(value)
    }
  }

  const handleCommentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const text = commentDraft.trim()
    if (!text) return

    if (onAddComment) {
      onAddComment(post.id)
    } else {
      const newComment: PostComment = {
        id: `comm-${Date.now()}`,
        authorName: currentUserName,
        authorRole: currentUserRole,
        content: text,
        timestamp: "Just now",
      }
      setLocalComments((prev) => [...prev, newComment])
      setInternalCommentDraft("")
    }
  }

  const mediaSource =
    post.videoUrl ||
    post.mediaUrl ||
    "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80"

  const displayRating = post.rating ?? 94
  const displayGrade = post.ratingGrade ? `GRADE ${post.ratingGrade}` : "GRADE A"

  return (
    <article
      className="reel-card-9x16 post-card"
      data-aspect="9:16"
      data-testid={`reel-card-${post.id}`}
      style={{
        position: "relative",
        aspectRatio: "9 / 16",
        width: "100%",
        maxWidth: "420px",
        minHeight: "640px",
        margin: "0 auto 28px auto",
        borderRadius: "20px",
        background: "linear-gradient(180deg, #090e1a 0%, #060913 50%, #030408 100%)",
        border: "1px solid rgba(251, 191, 36, 0.35)",
        boxShadow:
          "0 20px 50px rgba(0, 0, 0, 0.75), 0 0 24px rgba(251, 191, 36, 0.14)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#f8fafc",
      }}
    >
      {/* 4 L-shaped Cybernetic Gold Corner Brackets (HUD Reticles) */}
      <div
        className="hud-reticle top-left"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          width: 16,
          height: 16,
          borderTop: "2px solid #fbbf24",
          borderLeft: "2px solid #fbbf24",
          pointerEvents: "none",
          zIndex: 15,
        }}
      />
      <div
        className="hud-reticle top-right"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 16,
          height: 16,
          borderTop: "2px solid #fbbf24",
          borderRight: "2px solid #fbbf24",
          pointerEvents: "none",
          zIndex: 15,
        }}
      />
      <div
        className="hud-reticle bottom-left"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          width: 16,
          height: 16,
          borderBottom: "2px solid #fbbf24",
          borderLeft: "2px solid #fbbf24",
          pointerEvents: "none",
          zIndex: 15,
        }}
      />
      <div
        className="hud-reticle bottom-right"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: 16,
          height: 16,
          borderBottom: "2px solid #fbbf24",
          borderRight: "2px solid #fbbf24",
          pointerEvents: "none",
          zIndex: 15,
        }}
      />

      {/* Cybernetic Scanline Overlay */}
      <div
        className="hud-scanlines-overlay"
        aria-hidden="true"
        style={{ pointerEvents: "none", zIndex: 14 }}
      />

      {/* Media / Video Container with Click-to-Play/Pause */}
      <div
        className="reel-media-wrapper post-media-hud-container"
        onClick={handleTogglePlay}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070f",
          zIndex: 1,
        }}
      >
        <img
          src={mediaSource}
          alt="Match footage"
          className="post-media-preview reel-video"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isPlaying ? 0.94 : 0.65,
            transition: "opacity 0.25s ease",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />

        {/* Play Icon Overlay when Paused */}
        {!isPlaying && (
          <div
            className="reel-play-overlay"
            style={{
              position: "absolute",
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "rgba(5, 7, 15, 0.75)",
              border: "2px solid #fbbf24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fbbf24",
              boxShadow: "0 0 24px rgba(251, 191, 36, 0.45)",
              pointerEvents: "none",
              zIndex: 12,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginLeft: 3 }}
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}

        {/* Cinematic Vignette Gradient for Text & Actions Contrast */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,7,15,0.72) 0%, rgba(5,7,15,0.05) 25%, rgba(5,7,15,0.2) 60%, rgba(3,4,8,0.92) 85%, #030408 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Top HUD Overlay (60 FPS Tracking & Performance Grade Stamp) */}
      <div
        className="reel-top-hud"
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 16px 8px 16px",
          width: "100%",
        }}
      >
        {/* Top-Left: 60 FPS YOLOv11 VISION tracking beacon */}
        <div
          className="hud-badge top-left"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "5px 11px",
            background: "rgba(9, 14, 26, 0.8)",
            border: "1px solid rgba(251, 191, 36, 0.45)",
            borderRadius: "999px",
            fontSize: "9.5px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#fbbf24",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
          }}
        >
          <i className="hud-pulse-dot" />
          <span>60 FPS · YOLOv11 VISION</span>
        </div>

        {/* Top-Right: Grade Stamp & Stream Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {onOpenStream && (
            <button
              type="button"
              className="reel-stream-open-btn"
              onClick={(e) => {
                e.stopPropagation()
                onOpenStream(post.id)
              }}
              title="Open Fullscreen Reels Stream (Scroll like Instagram)"
              aria-label="Open Fullscreen Reels Stream"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                background: "rgba(0, 0, 0, 0.75)",
                border: "1px solid rgba(251, 191, 36, 0.5)",
                borderRadius: "999px",
                fontSize: "9.5px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "#ffffff",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
              }}
            >
              <span>📹</span>
              <span>REELS STREAM</span>
            </button>
          )}

          <div
            className="hud-badge top-right reel-grade-stamp"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 11px",
              background: "rgba(9, 14, 26, 0.8)",
              border: "1px solid rgba(251, 191, 36, 0.45)",
              borderRadius: "999px",
              fontSize: "9.5px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#fbbf24",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M12 3 5 6v5c0 4.7 3 8.2 7 10 4-1.8 7-5.3 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>{displayGrade}</span>
          </div>
        </div>
      </div>

      {/* Right-Hand Floating Action Bar (FB/IG Reels Style) */}
      <div
        className="reel-floating-actions reel-actions-column"
        style={{
          position: "absolute",
          right: 12,
          bottom: isCommentsOpen ? 270 : 88,
          zIndex: 25,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          transition: "bottom 0.25s ease",
        }}
      >
        {/* Scout Rating Shield Badge */}
        <div
          className="reel-rating-shield"
          title="Verified Scout Rating"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 46,
            height: 48,
            background:
              "linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(12, 17, 30, 0.92) 100%)",
            border: "1.5px solid #fbbf24",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(251, 191, 36, 0.32)",
            color: "#fbbf24",
            fontWeight: 800,
            fontSize: "12px",
            lineHeight: 1.1,
            textAlign: "center",
            cursor: "default",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 900 }}>
            {displayRating}
          </span>
          <span
            style={{
              fontSize: "8.5px",
              opacity: 0.85,
              letterSpacing: "0.05em",
            }}
          >
            /100
          </span>
        </div>

        {/* Likes / Respects Button */}
        <button
          type="button"
          className={`reel-action-btn like respects-btn ${
            post.isLiked ? "liked" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLike(post.id)
          }}
          title="Give respects / kudos"
          aria-label="Like or give respects"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: post.isLiked
              ? "rgba(251, 191, 36, 0.26)"
              : "rgba(12, 17, 30, 0.8)",
            border: post.isLiked
              ? "1.5px solid #fbbf24"
              : "1px solid rgba(255, 255, 255, 0.22)",
            color: post.isLiked ? "#fbbf24" : "#f1f5f9",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.18s ease",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={post.isLiked ? "#fbbf24" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path
              d="M13 2 4.8 13h6.4L10 22l8.2-11h-6.4L13 2Z"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: "10px", fontWeight: 700, marginTop: 1 }}>
            {post.likes}
          </span>
        </button>

        {/* Comments Button */}
        <button
          type="button"
          className={`reel-action-btn comments comments-btn ${
            isCommentsOpen ? "active" : ""
          }`}
          onClick={handleCommentsClick}
          title="View and post comments"
          aria-label="Comments"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: isCommentsOpen
              ? "rgba(251, 191, 36, 0.26)"
              : "rgba(12, 17, 30, 0.8)",
            border: isCommentsOpen
              ? "1.5px solid #fbbf24"
              : "1px solid rgba(255, 255, 255, 0.22)",
            color: isCommentsOpen ? "#fbbf24" : "#f1f5f9",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.18s ease",
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontSize: "10px", fontWeight: 700, marginTop: 1 }}>
            {commentsList.length}
          </span>
        </button>

        {/* Audio / Mute Toggle Button */}
        <button
          type="button"
          className={`reel-action-btn audio-toggle-btn reel-audio-btn ${
            isMuted ? "muted" : "unmuted"
          }`}
          onClick={handleToggleAudio}
          title={isMuted ? "Sound: Off (click to enable)" : "Sound: On (click to mute)"}
          aria-label={isMuted ? "Sound: Off" : "Sound: On"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: !isMuted
              ? "rgba(34, 197, 94, 0.22)"
              : "rgba(12, 17, 30, 0.8)",
            border: !isMuted
              ? "1.5px solid #22c55e"
              : "1px solid rgba(255, 255, 255, 0.22)",
            color: !isMuted ? "#4ade80" : "#94a3b8",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.18s ease",
          }}
        >
          {isMuted ? (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
          <span style={{ fontSize: "8px", fontWeight: 700, marginTop: 1 }}>
            {isMuted ? "OFF" : "ON"}
          </span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          className="reel-action-btn share share-btn"
          onClick={(e) => {
            e.stopPropagation()
            onShare(post)
          }}
          title="Share post"
          aria-label="Share reel"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(12, 17, 30, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            color: "#f1f5f9",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.18s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span style={{ fontSize: "8px", fontWeight: 700, marginTop: 1 }}>
            SHARE
          </span>
        </button>

        {/* Save to Scout Vault */}
        {onSaveToVault && (
          <button
            type="button"
            className={`reel-action-btn ${isSaved ? "liked" : ""}`}
            onClick={(e) => {
              e.stopPropagation()
              onSaveToVault(post.id)
            }}
            title={
              isSaved
                ? "Saved to Scout Vault"
                : "Save intel to Scout Vault"
            }
            aria-label="Save to Scout Vault"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: isSaved
                ? "rgba(251, 191, 36, 0.26)"
                : "rgba(12, 17, 30, 0.8)",
              border: isSaved
                ? "1.5px solid #fbbf24"
                : "1px solid rgba(255, 255, 255, 0.22)",
              color: isSaved ? "#fbbf24" : "#f1f5f9",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.18s ease",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={isSaved ? "#fbbf24" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M12 3 5 6v5c0 4.7 3 8.2 7 10 4-1.8 7-5.3 7-10V6l-7-3Z" />
            </svg>
            <span style={{ fontSize: "7.5px", fontWeight: 700, marginTop: 1 }}>
              {isSaved ? "SAVED" : "VAULT"}
            </span>
          </button>
        )}

        {/* Attached Scout Report Action Button */}
        {((post as any).hasReport || !!(post as any).reportData) && (
          <button
            type="button"
            className="reel-action-btn report-btn"
            onClick={(e) => {
              e.stopPropagation()
              onOpenReport?.(post)
            }}
            title="View Attached Scout Dossier"
            aria-label="View Attached Scout Dossier"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(217, 119, 6, 0.4))",
              border: "1.5px solid #fbbf24",
              color: "#fbbf24",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.18s ease",
            }}
          >
            <span style={{ fontSize: "16px" }}>📑</span>
            <span style={{ fontSize: "7px", fontWeight: 800, marginTop: 1 }}>REPORT</span>
          </button>
        )}
      </div>

      {/* Bottom Area: Athlete Profile, Caption, Telemetry */}
      <div
        className="reel-bottom-overlay"
        style={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          padding: "0 68px 12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "auto",
        }}
      >
        {/* Athlete Avatar, Name, Verified Shield, Follow Button */}
        <div
          className="reel-author-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar with role ring */}
          <div
            className={`post-avatar-wrap role-${(
              post.authorRole || "Player"
            ).toLowerCase()}`}
            onClick={(e) => {
              e.stopPropagation()
              if (onSelectProfile) onSelectProfile(post.authorName)
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #fbbf24",
              cursor: onSelectProfile ? "pointer" : "default",
              boxShadow: "0 0 12px rgba(251, 191, 36, 0.4)",
              flexShrink: 0,
            }}
          >
            <img
              src={post.authorImage}
              alt={post.authorName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80"
              }}
            />
          </div>

          {/* Name & Verified Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              minWidth: 0,
            }}
          >
            <strong
              className="reel-author-name"
              onClick={(e) => {
                e.stopPropagation()
                if (onSelectProfile) onSelectProfile(post.authorName)
              }}
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#f8fafc",
                cursor: onSelectProfile ? "pointer" : "default",
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {post.authorName}
            </strong>
            {post.isVerified && (
              <span
                className="verified-shield-icon"
                title="SCOT Verified Athletic Identity"
                style={{ color: "#fbbf24", display: "inline-flex" }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 3 5 6v5c0 4.7 3 8.2 7 10 4-1.8 7-5.3 7-10V6l-7-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
            )}
          </div>

          {/* Interactive Follow / Following Toggle Button */}
          <button
            type="button"
            className={`reel-follow-btn ${isFollowing ? "following" : ""}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFollow(post.authorName)
            }}
            style={{
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "all 0.18s ease",
              background: isFollowing
                ? "rgba(255, 255, 255, 0.12)"
                : "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
              border: isFollowing
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "1px solid #f59e0b",
              color: isFollowing ? "#f1f5f9" : "#0f172a",
              boxShadow: isFollowing
                ? "none"
                : "0 2px 10px rgba(251, 191, 36, 0.3)",
            }}
          >
            {isFollowing ? "Following ✓" : "+ Follow"}
          </button>
        </div>

        {/* Sport Tag Chip */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            className="sport-indicator-chip"
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(251, 191, 36, 0.16)",
              border: "1px solid rgba(251, 191, 36, 0.35)",
              color: "#fbbf24",
            }}
          >
            {post.sport.toUpperCase()}
          </span>
          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
            {post.timestamp}
          </span>
        </div>

        {/* Reel Description / Caption */}
        <p
          className="post-content reel-caption"
          style={{
            fontSize: "12px",
            lineHeight: 1.4,
            color: "#e2e8f0",
            margin: "2px 0 2px 0",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          {post.content}
        </p>

        {/* Kinematic Telemetry HUD Strip */}
        {post.metrics && post.metrics.length > 0 && (
          <div
            className="post-telemetry-strip reel-telemetry"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "2px",
            }}
          >
            {post.metrics.map((m, i) => (
              <div
                key={i}
                className="post-metric-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  background: "rgba(9, 14, 26, 0.85)",
                  border: "1px solid rgba(251, 191, 36, 0.38)",
                  borderRadius: "6px",
                  fontSize: "9.5px",
                  color: "#cbd5e1",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="#fbbf24"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                >
                  <path d="M13 2 4.8 13h6.4L10 22l8.2-11h-6.4L13 2Z" />
                </svg>
                <span style={{ opacity: 0.8 }}>{m.label}:</span>
                <strong style={{ color: "#fbbf24", fontWeight: 800 }}>
                  {m.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/* Attached Scout Report Pill */}
        {((post as any).hasReport || !!(post as any).reportData) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenReport?.(post)
            }}
            className="reel-report-pill"
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(251, 191, 36, 0.18)",
              border: "1px solid rgba(251, 191, 36, 0.5)",
              color: "#fbbf24",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              marginTop: "4px",
            }}
          >
            <span>📑</span>
            <span>Scout Report Attached ({post.ratingGrade || "A"} · {post.rating || 94}/100)</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Expandable Comments Drawer Overlay */}
      {isCommentsOpen && (
        <div
          className="post-comments-drawer reel-comments-drawer"
          style={{
            position: "relative",
            zIndex: 30,
            width: "100%",
            background: "rgba(9, 13, 24, 0.96)",
            borderTop: "1px solid rgba(251, 191, 36, 0.35)",
            padding: "12px 14px",
            backdropFilter: "blur(14px)",
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            className="comments-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              fontSize: "10.5px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "#fbbf24",
            }}
          >
            <span>COMMENTS LOG & SCOUT NOTES ({commentsList.length})</span>
            <button
              type="button"
              className="comments-close-btn"
              onClick={handleCommentsClick}
              aria-label="Close comments"
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "13px",
                padding: "2px 6px",
              }}
            >
              ✕
            </button>
          </div>

          {commentsList.length > 0 ? (
            <div
              className="comments-list"
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {commentsList.map((comm) => (
                <div
                  key={comm.id}
                  className="comment-item"
                  style={{
                    display: "flex",
                    gap: "8px",
                    padding: "6px 8px",
                    background: "rgba(20, 26, 42, 0.7)",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div
                    className="comment-avatar"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "rgba(251, 191, 36, 0.22)",
                      border: "1px solid #fbbf24",
                      color: "#fbbf24",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    <span>
                      {(comm.authorName || "User").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div
                    className="comment-content-box"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <div
                      className="comment-author-bar"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "10px",
                      }}
                    >
                      <strong style={{ color: "#f1f5f9" }}>
                        {comm.authorName}
                      </strong>
                      <span
                        className={`comment-role-pill role-${(
                          comm.authorRole || "Player"
                        ).toLowerCase()}`}
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: "rgba(251, 191, 36, 0.16)",
                          color: "#fbbf24",
                        }}
                      >
                        {comm.authorRole}
                      </span>
                      <small
                        style={{
                          color: "#64748b",
                          marginLeft: "auto",
                          fontSize: "8.5px",
                        }}
                      >
                        {comm.timestamp}
                      </small>
                    </div>
                    <p
                      className="comment-text"
                      style={{
                        fontSize: "11px",
                        color: "#cbd5e1",
                        marginTop: "2px",
                        lineHeight: 1.3,
                      }}
                    >
                      {comm.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="comments-empty"
              style={{
                padding: "12px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "10px",
              }}
            >
              <span>
                No comments recorded yet. Be the first scout or athlete to
                contribute!
              </span>
            </div>
          )}

          {/* New Comment Input */}
          <div
            className="comment-composer"
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "10px",
            }}
          >
            <input
              type="text"
              placeholder={`Add scout note as ${currentUserName}...`}
              value={commentDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleCommentSubmit()
                }
              }}
              style={{
                flex: 1,
                background: "rgba(12, 17, 30, 0.85)",
                border: "1px solid rgba(251, 191, 36, 0.35)",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                color: "#f8fafc",
                outline: "none",
              }}
            />
            <button
              type="button"
              className="primary-button"
              disabled={!commentDraft.trim()}
              onClick={() => handleCommentSubmit()}
              style={{
                minHeight: 28,
                padding: "0 10px",
                fontSize: "9px",
                fontWeight: 800,
                background: commentDraft.trim()
                  ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
                  : "rgba(255, 255, 255, 0.1)",
                color: commentDraft.trim() ? "#0f172a" : "#64748b",
                border: "none",
                borderRadius: "6px",
                cursor: commentDraft.trim() ? "pointer" : "not-allowed",
              }}
            >
              POST NOTE
            </button>
          </div>
        </div>
      )}

      {/* Playback Duration Progress Scrubber */}
      <div
        className="reel-scrubber"
        style={{
          position: "relative",
          zIndex: 22,
          width: "100%",
          height: "4px",
          background: "rgba(255, 255, 255, 0.15)",
        }}
      >
        <div
          className="reel-scrubber-fill"
          style={{
            height: "100%",
            width: isPlaying ? "68%" : "32%",
            background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
            boxShadow: "0 0 8px #fbbf24",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </article>
  )
}

export default ReelCard9x16
