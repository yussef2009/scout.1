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

export interface NewsBulletinCardProps {
  post: FeedPost
  onToggleLike: (postId: string) => void
  onToggleComments: (postId: string) => void
  onShare: (post: FeedPost) => void
  onSaveToVault?: (postId: string) => void
  onSelectProfile?: (profile: any) => void
  isCommentsOpen?: boolean
  comments?: PostComment[]
  commentDraft?: string
  onCommentDraftChange?: (value: string) => void
  onAddComment?: (postId: string) => void
  currentUserName?: string
  currentUserRole?: string
  isSaved?: boolean
}

export function calculateGrade(rating: number): string {
  if (rating >= 96) return "A+"
  if (rating >= 93) return "A"
  if (rating >= 90) return "A-"
  if (rating >= 85) return "B+"
  if (rating >= 80) return "B"
  if (rating >= 75) return "B-"
  if (rating >= 70) return "C+"
  if (rating >= 65) return "C"
  if (rating >= 60) return "C-"
  return "D"
}

export function NewsBulletinCard({
  post,
  onToggleLike,
  onToggleComments,
  onShare,
  onSaveToVault,
  onSelectProfile,
  isCommentsOpen: controlledCommentsOpen,
  comments: controlledComments,
  commentDraft: controlledCommentDraft,
  onCommentDraftChange,
  onAddComment,
  currentUserName = "Observer",
  currentUserRole = "Scout",
  isSaved = false,
}: NewsBulletinCardProps) {
  const [internalCommentsOpen, setInternalCommentsOpen] = useState(false)
  const [internalCommentDraft, setInternalCommentDraft] = useState("")
  const [localComments, setLocalComments] = useState<PostComment[]>(
    post.comments || [],
  )

  const isCommentsOpen =
    controlledCommentsOpen !== undefined
      ? controlledCommentsOpen
      : internalCommentsOpen

  const commentsList = controlledComments ?? (post.comments || localComments)
  const commentDraft =
    controlledCommentDraft !== undefined
      ? controlledCommentDraft
      : internalCommentDraft

  const handleCommentsToggle = () => {
    if (controlledCommentsOpen === undefined) {
      setInternalCommentsOpen(!internalCommentsOpen)
    }
    onToggleComments(post.id)
  }

  const handleDraftChange = (val: string) => {
    if (onCommentDraftChange) {
      onCommentDraftChange(val)
    } else {
      setInternalCommentDraft(val)
    }
  }

  const handlePostComment = () => {
    const draft = commentDraft.trim()
    if (!draft) return

    if (onAddComment) {
      onAddComment(post.id)
    } else {
      const newComment: PostComment = {
        id: `comm-${Date.now()}`,
        authorName: currentUserName || "Athletic Scout",
        authorRole: currentUserRole,
        content: draft,
        timestamp: "Just now",
      }
      setLocalComments([...commentsList, newComment])
      setInternalCommentDraft("")
    }
  }

  const rawCategory = post.newsCategory || "Scouting Bulletin"
  const categoryUpper = rawCategory.toUpperCase()

  // Distinct category styling based on tactical category
  let categoryBadgeClass =
    "border-amber-500/40 bg-amber-500/15 text-amber-300"
  if (categoryUpper.includes("COMBINE")) {
    categoryBadgeClass = "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
  } else if (categoryUpper.includes("TACTICAL")) {
    categoryBadgeClass =
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
  } else if (categoryUpper.includes("ANNOUNCEMENT")) {
    categoryBadgeClass =
      "border-yellow-400/50 bg-yellow-400/20 text-yellow-300 font-bold"
  }

  const effectiveGrade =
    post.ratingGrade || (post.rating ? calculateGrade(post.rating) : undefined)

  const isDuplicateHeadline =
    post.newsHeadline &&
    post.content &&
    post.content.toLowerCase().startsWith(post.newsHeadline.toLowerCase())

  const displayContent =
    isDuplicateHeadline && post.newsHeadline
      ? post.content
          .slice(post.newsHeadline.length)
          .replace(/^[:\s\-—]+/, "")
          .trim()
      : post.content

  // Avoid duplicate rating readouts if post.metrics also contains a rating entry
  const displayMetrics = (post.metrics || []).filter(
    (m) =>
      post.rating === undefined ||
      (!m.label.toUpperCase().includes("RATING") && !m.value.includes("/100")),
  )

  return (
    <article
      className="post-card news-bulletin-card cyber-bulletin"
      data-testid={`news-card-${post.id}`}
    >
      {/* Category Indicator Accent Strip */}
      <div className="bulletin-accent-bar flex items-center justify-between gap-2 px-1 pb-2 border-b border-white/5 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`bulletin-category-tag inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${categoryBadgeClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {categoryUpper}
          </span>
          <span className="sport-indicator-chip text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10">
            {post.sport}
          </span>
        </div>

        {post.rating !== undefined && (
          <div className="bulletin-rating-badge flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span className="text-[10px] font-mono tracking-wider text-neutral-400">
              SCOT AI RATING:
            </span>
            <strong className="text-xs font-mono font-bold text-amber-300">
              {post.rating}/100
            </strong>
            {effectiveGrade && (
              <span className="bulletin-grade-stamp text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
                GRADE {effectiveGrade}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Post Header */}
      <div className="post-header">
        <div
          className={`post-avatar-wrap role-${post.authorRole.toLowerCase()}`}
        >
          <img
            src={post.authorImage}
            alt={post.authorName}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80"
            }}
            onClick={() => onSelectProfile?.(post.authorName)}
          />
        </div>

        <div className="post-header-info">
          <div className="post-author-row flex items-center gap-1.5">
            <strong
              className="cursor-pointer hover:text-amber-300 transition-colors"
              onClick={() => onSelectProfile?.(post.authorName)}
            >
              {post.authorName}
            </strong>
            {post.isVerified && (
              <span
                className="verified-shield-icon text-amber-400 inline-flex items-center"
                title="SCOT Verified Athletic Identity"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
            )}
            <span
              className={`post-role-badge badge-${post.authorRole.toLowerCase()}`}
            >
              {post.authorRole.toUpperCase()}
            </span>
          </div>

          <div className="post-meta-sub flex items-center gap-1 text-[11px] text-neutral-400">
            <span className="post-time">{post.timestamp}</span>
            <span className="meta-separator">·</span>
            <span className="text-amber-500/80 font-mono text-[10px]">
              INTEL DISPATCH
            </span>
          </div>
        </div>

        <button
          type="button"
          className="outline-button post-view-btn"
          onClick={() => onSelectProfile?.(post.authorName)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            minHeight: "28px",
            padding: "0 10px",
            fontSize: "10px",
            fontWeight: 700,
            borderColor: "rgba(245, 158, 11, 0.35)",
            color: "var(--gold-bright, #fbbf24)",
            borderRadius: "6px",
          }}
        >
          <span>VIEW PROFILE</span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Prominent News Headline */}
      {post.newsHeadline && (
        <h3 className="news-headline text-base sm:text-lg font-bold text-amber-200 tracking-tight leading-snug my-2">
          {post.newsHeadline}
        </h3>
      )}

      {/* Content */}
      <p className="post-content text-sm text-neutral-200 leading-relaxed my-2">
        {displayContent}
      </p>

      {/* Biomechanical Benchmark Metrics Strip */}
      {displayMetrics.length > 0 && (
        <div className="post-telemetry-strip flex flex-wrap gap-2 my-2.5">
          {displayMetrics.map((m, i) => {
            const labelText = m.label.endsWith(":") ? m.label : `${m.label}:`
            return (
              <div
                key={i}
                className="post-metric-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-amber-500/20 text-[11px]"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  className="text-amber-400"
                >
                  <path
                    d="M13 2 4.8 13h6.4L10 22l8.2-11h-6.4L13 2Z"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-neutral-400 font-mono text-[10px]">
                  {labelText}
                </span>
                <strong className="text-amber-300 font-mono font-bold">
                  {m.value}
                </strong>
              </div>
            )
          })}
        </div>
      )}

      {/* 16:9 Media Container with HUD Overlay */}
      {post.mediaUrl && (
        <div className="post-media-hud-container relative w-full aspect-video overflow-hidden rounded-lg border border-amber-500/20 my-3 bg-black">
          <img
            src={post.mediaUrl}
            alt="Match footage"
            className="post-media-preview w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <div className="hud-badge top-left">
            <i className="hud-pulse-dot" />
            <span>60 FPS · AI VISION TRACKING</span>
          </div>
          <div className="hud-badge top-right">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>BIOMECHANICS VERIFIED</span>
          </div>
          <div className="hud-scanlines-overlay pointer-events-none" />
        </div>
      )}

      {/* Social Engagement Footer Actions */}
      <div className="post-footer-actions flex items-center gap-2 pt-2 border-t border-white/5 mt-3 flex-wrap">
        <button
          type="button"
          className={`post-action-btn respects-btn ${post.isLiked ? "liked" : ""}`}
          onClick={() => onToggleLike(post.id)}
          title="Give respects / kudos"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
          >
            <path
              d="M13 2 4.8 13h6.4L10 22l8.2-11h-6.4L13 2Z"
              strokeLinejoin="round"
            />
          </svg>
          <span>{post.likes}</span>
          <small>{post.isLiked ? "RESPECTED" : "RESPECTS"}</small>
        </button>

        <button
          type="button"
          className={`post-action-btn comments-btn ${isCommentsOpen ? "active" : ""}`}
          onClick={handleCommentsToggle}
          title="View and post comments"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{commentsList.length || post.commentsCount || 0}</span>
          <small>COMMENTS</small>
        </button>

        <button
          type="button"
          className={`post-action-btn ${isSaved ? "liked" : ""}`}
          onClick={() => onSaveToVault?.(post.id)}
          title={isSaved ? "Saved to Scout Vault" : "Save intel to Scout Vault"}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <small>{isSaved ? "SAVED" : "SAVE INTEL"}</small>
        </button>

        <button
          type="button"
          className="post-action-btn share-btn"
          onClick={() => onShare(post)}
          title="Share post"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m3 17 6-6 4 4 8-9" />
            <path d="M15 6h6v6" />
          </svg>
          <small>SHARE</small>
        </button>

        <span className="post-verified-stamp inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 ml-auto">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>VERIFIED RECORD</span>
        </span>
      </div>

      {/* Expandable Comments Drawer */}
      {isCommentsOpen && (
        <div className="post-comments-drawer mt-3 pt-3 border-t border-white/5">
          <div className="comments-header flex items-center justify-between text-xs font-mono text-neutral-300 pb-2 mb-2 border-b border-white/5">
            <span>COMMENTS LOG & SCOUT NOTES ({commentsList.length})</span>
          </div>

          {commentsList.length > 0 ? (
            <div className="comments-list space-y-2 mb-3">
              {commentsList.map((comm) => (
                <div key={comm.id} className="comment-item flex gap-2 text-xs">
                  <div className="comment-avatar w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                    <span>
                      {(comm.authorName || "User").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="comment-content-box flex-1 bg-white/5 rounded p-2">
                    <div className="comment-author-bar flex items-center gap-2 mb-1">
                      <strong className="text-white text-xs">
                        {comm.authorName}
                      </strong>
                      <span
                        className={`comment-role-pill role-${(comm.authorRole || "Player").toLowerCase()} text-[9px] font-mono px-1.5 rounded bg-black/40 text-amber-300 border border-amber-500/30`}
                      >
                        {comm.authorRole}
                      </span>
                      <small className="text-neutral-400 text-[10px] ml-auto">
                        {comm.timestamp}
                      </small>
                    </div>
                    <p className="comment-text text-neutral-200 text-xs">
                      {comm.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="comments-empty text-xs text-neutral-400 py-2">
              <span>
                No comments recorded yet. Be the first scout or athlete to
                contribute!
              </span>
            </div>
          )}

          {/* New Comment Input */}
          <div className="comment-composer flex items-center gap-2">
            <input
              type="text"
              placeholder={`Add scout note as ${currentUserName || "Observer"}...`}
              value={commentDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handlePostComment()
                }
              }}
              className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              className="primary-button"
              style={{
                minHeight: 32,
                padding: "0 12px",
                fontSize: 9,
              }}
              disabled={!commentDraft.trim()}
              onClick={handlePostComment}
            >
              POST NOTE
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default NewsBulletinCard
