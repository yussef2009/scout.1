import React, { useState, useEffect, useRef } from "react"
import { type FeedPost, type PostComment } from "./ReelCard9x16"
import { type AttachedReportData } from "./ScoutReportViewerModal"

export interface ReelsStreamModalProps {
  isOpen: boolean
  onClose: () => void
  initialPostId?: string
  posts: FeedPost[]
  onToggleLike: (postId: string) => void
  onToggleFollow: (authorName: string) => void
  onAddComment: (postId: string, commentText: string) => void
  onShare: (post: FeedPost) => void
  onSaveToVault?: (postId: string) => void
  savedPostIds?: Record<string, boolean>
  followingList?: string[]
  onOpenReport?: (post: FeedPost) => void
  onSelectProfile?: (profileOrName: any) => void
  currentUserName?: string
  currentUserRole?: string
}

export function ReelsStreamModal({
  isOpen,
  onClose,
  initialPostId,
  posts,
  onToggleLike,
  onToggleFollow,
  onAddComment,
  onShare,
  onSaveToVault,
  savedPostIds = {},
  followingList = [],
  onOpenReport,
  onSelectProfile,
  currentUserName = "Verified Scout",
  currentUserRole = "Scout",
}: ReelsStreamModalProps) {
  // Filter for reel-eligible posts
  const reelPosts = posts.filter(
    (p) => p.postType === "reel" || p.streamType === "reel" || !!p.mediaUrl || !!p.videoUrl,
  )

  const effectiveReels = reelPosts.length > 0 ? reelPosts : posts

  // Find initial index
  const initialIndex = initialPostId
    ? Math.max(
        0,
        effectiveReels.findIndex((p) => p.id === initialPostId),
      )
    : 0

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [commentsOpenPostId, setCommentsOpenPostId] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState("")
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({})
  const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // Scroll to initial index on open
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex)
      setTimeout(() => {
        itemRefs.current[initialIndex]?.scrollIntoView({ behavior: "auto" })
      }, 50)
    }
  }, [isOpen, initialIndex])

  // Handle scroll snap detection
  const handleScroll = () => {
    if (!containerRef.current) return
    const container = containerRef.current
    const scrollTop = container.scrollTop
    const clientHeight = container.clientHeight
    const newIndex = Math.round(scrollTop / clientHeight)
    if (newIndex >= 0 && newIndex < effectiveReels.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex)
    }
  }

  // Keyboard navigation (ArrowUp, ArrowDown, Escape, Space)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        if (activeIndex < effectiveReels.length - 1) {
          const next = activeIndex + 1
          setActiveIndex(next)
          itemRefs.current[next]?.scrollIntoView({ behavior: "smooth" })
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        if (activeIndex > 0) {
          const prev = activeIndex - 1
          setActiveIndex(prev)
          itemRefs.current[prev]?.scrollIntoView({ behavior: "smooth" })
        }
      } else if (e.key === " ") {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, activeIndex, effectiveReels.length, onClose])

  if (!isOpen) return null

  // Trigger double tap heart explosion
  const handleDoubleTap = (post: FeedPost) => {
    if (!post.isLiked) {
      onToggleLike(post.id)
    }
    setHeartBurstPostId(post.id)
    setTimeout(() => {
      setHeartBurstPostId(null)
    }, 900)
  }

  const handleSendComment = (postId: string) => {
    const text = commentInput.trim()
    if (!text) return
    onAddComment(postId, text)
    setCommentInput("")
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center overflow-hidden animate-fadeIn"
      role="dialog"
      aria-label="Instagram Style Fullscreen Reels Stream"
    >
      {/* Top Floating App Bar */}
      <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">📹</span>
          <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
            <span>REELS STREAM</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
              LIVE
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-mono font-bold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md"
            aria-label={isAudioMuted ? "Unmute reel audio" : "Mute reel audio"}
          >
            <span>{isAudioMuted ? "🔇 MUTED" : "🔊 AUDIO ON"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-base transition-all cursor-pointer backdrop-blur-md"
            aria-label="Close reels stream"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Vertical Snap Scroll Reels Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar flex flex-col items-center select-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {effectiveReels.map((post, index) => {
          const isActive = index === activeIndex
          const isLiked = !!post.isLiked
          const isFollowing = post.isFollowing ?? followingList.includes(post.authorName)
          const isSaved = !!savedPostIds[post.id]
          const isCaptionExpanded = !!expandedCaptions[post.id]
          const hasReport = (post as any).hasReport || !!(post as any).reportData
          const mediaSource = post.videoUrl || post.mediaUrl || "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80"
          const commentsList: PostComment[] = post.comments || []

          return (
            <div
              key={post.id}
              ref={(el) => (itemRefs.current[index] = el)}
              className="w-full h-screen min-h-screen snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden"
              style={{ height: "100vh" }}
            >
              {/* Central Reel Card Container (Instagram Aspect Ratio) */}
              <div
                className="relative w-full max-w-[440px] h-full sm:h-[94vh] sm:rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border sm:border-white/10"
                onDoubleClick={() => handleDoubleTap(post)}
              >
                {/* Background Video / Media */}
                <img
                  src={mediaSource}
                  alt={post.content || "Reel media"}
                  className="w-full h-full object-cover pointer-events-none"
                  style={{
                    opacity: isActive ? 1 : 0.4,
                    transition: "opacity 0.3s ease",
                  }}
                />

                {/* Cyber Cinematic Scanlines & Vignette */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.85) 85%, #000000 100%)",
                  }}
                />

                {/* Double-Tap Heart Burst Animation */}
                {heartBurstPostId === post.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-ping">
                    <span className="text-8xl drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]">
                      ❤️
                    </span>
                  </div>
                )}

                {/* Top Corner Reticles (Instagram + HUD) */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 border border-amber-400/50 text-[10px] font-mono text-amber-300 font-bold backdrop-blur-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    60 FPS CV
                  </span>
                  {post.rating && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-200 font-bold backdrop-blur-md">
                      GRADE {post.ratingGrade || "A"} ({post.rating}/100)
                    </span>
                  )}
                </div>

                {/* Right Vertical Action Bar (Instagram Layout) */}
                <aside className="absolute right-3 sm:right-4 bottom-20 z-30 flex flex-col items-center gap-4.5">
                  {/* Author Avatar with Gradient Story Ring */}
                  <div className="relative group cursor-pointer" onClick={() => onSelectProfile?.(post.authorName)}>
                    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-emerald-400 shadow-lg">
                      <img
                        src={post.authorImage}
                        alt={post.authorName}
                        className="w-full h-full rounded-full object-cover bg-black"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80"
                        }}
                      />
                    </div>
                    {!isFollowing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFollow(post.authorName)
                        }}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center justify-center border-2 border-black transition-all cursor-pointer shadow"
                        title={`Follow ${post.authorName}`}
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Like Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleLike(post.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl transition-transform active:scale-125 cursor-pointer backdrop-blur-md ${
                        isLiked ? "bg-red-600/20 text-red-500 scale-110" : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                      aria-label={isLiked ? "Unlike reel" : "Like reel"}
                    >
                      {isLiked ? "❤️" : "🤍"}
                    </button>
                    <span className="text-[11px] font-mono font-bold text-white drop-shadow">
                      {post.likes}
                    </span>
                  </div>

                  {/* Comment Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCommentsOpenPostId(commentsOpenPostId === post.id ? null : post.id)}
                      className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-xl transition-transform active:scale-110 cursor-pointer backdrop-blur-md"
                      aria-label="View and add comments"
                    >
                      💬
                    </button>
                    <span className="text-[11px] font-mono font-bold text-white drop-shadow">
                      {commentsList.length || post.commentsCount || 0}
                    </span>
                  </div>

                  {/* Share Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onShare(post)}
                      className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-xl transition-transform active:scale-110 cursor-pointer backdrop-blur-md"
                      aria-label="Share reel"
                    >
                      ↗️
                    </button>
                    <span className="text-[10px] font-mono text-neutral-300 drop-shadow">
                      Share
                    </span>
                  </div>

                  {/* Scout Vault Bookmark Button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSaveToVault?.(post.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-transform active:scale-110 cursor-pointer backdrop-blur-md ${
                        isSaved ? "bg-amber-400 text-black shadow-lg shadow-amber-500/30" : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                      aria-label={isSaved ? "Remove from Scout Vault" : "Save to Scout Vault"}
                    >
                      🏷️
                    </button>
                    <span className="text-[10px] font-mono text-neutral-300 drop-shadow">
                      Vault
                    </span>
                  </div>

                  {/* Attached Report Button (if present) */}
                  {hasReport && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenReport?.(post)}
                        className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-black flex items-center justify-center text-lg shadow-lg shadow-amber-500/30 transition-transform active:scale-110 cursor-pointer animate-pulse"
                        title="View Attached Scout Dossier"
                        aria-label="View Attached Scout Dossier"
                      >
                        📑
                      </button>
                      <span className="text-[9px] font-mono font-bold text-amber-300 drop-shadow">
                        REPORT
                      </span>
                    </div>
                  )}

                  {/* Rotating Music Disc (Instagram Style) */}
                  <div className="mt-1 w-9 h-9 rounded-full border border-amber-400/40 p-1 bg-black/80 flex items-center justify-center animate-spin" style={{ animationDuration: "5s" }}>
                    <div className="w-full h-full rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-400 text-[10px]">
                      🎵
                    </div>
                  </div>
                </aside>

                {/* Bottom Overlay: Author, Caption, Tags & Sound */}
                <div className="absolute bottom-0 inset-x-0 p-4 pb-6 z-20 flex flex-col gap-2 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-auto max-w-[calc(100%-60px)]">
                  {/* Author Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong
                      className="text-sm font-bold text-white hover:text-amber-300 transition-colors cursor-pointer"
                      onClick={() => onSelectProfile?.(post.authorName)}
                    >
                      {post.authorName}
                    </strong>
                    {post.isVerified && (
                      <span className="text-amber-400 text-xs" title="Verified Athletic Identity">
                        ✓
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      {post.authorRole}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleFollow(post.authorName)}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                        isFollowing
                          ? "bg-white/10 text-neutral-300 border border-white/20"
                          : "bg-red-600 text-white border border-red-500 hover:bg-red-500"
                      }`}
                    >
                      {isFollowing ? "FOLLOWING" : "FOLLOW"}
                    </button>
                  </div>

                  {/* Caption with Expandable Toggle */}
                  <div className="text-xs text-neutral-200 leading-snug">
                    <p className={isCaptionExpanded ? "" : "line-clamp-2"}>
                      {post.content}
                    </p>
                    {post.content && post.content.length > 80 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCaptions((prev) => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }))
                        }
                        className="text-[11px] font-bold text-neutral-400 hover:text-white mt-0.5 cursor-pointer"
                      >
                        {isCaptionExpanded ? "less" : "...more"}
                      </button>
                    )}
                  </div>

                  {/* Attached Report Pill (Interactive Click) */}
                  {hasReport && (
                    <button
                      type="button"
                      onClick={() => onOpenReport?.(post)}
                      className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/10"
                    >
                      <span>📑</span>
                      <span>Scout Report Attached ({post.ratingGrade || "A"} - {post.rating || 94}/100)</span>
                      <span className="text-amber-200">→</span>
                    </button>
                  )}

                  {/* Audio Marquee Ticker */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-300 overflow-hidden">
                    <span>♫</span>
                    <span className="truncate">
                      Original Sound · {post.authorName} · 60 FPS Biomechanics Audio
                    </span>
                  </div>
                </div>

                {/* Comments Bottom Drawer (Instagram Style) */}
                {commentsOpenPostId === post.id && (
                  <div
                    className="absolute inset-x-0 bottom-0 max-h-[65%] h-[65%] z-40 bg-[#0c101c]/95 border-t border-amber-500/40 rounded-t-2xl p-4 flex flex-col gap-3 backdrop-blur-xl animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        SCOUT NOTES & COMMENTS ({commentsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCommentsOpenPostId(null)}
                        className="text-neutral-400 hover:text-white text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 no-scrollbar">
                      {commentsList.length === 0 ? (
                        <div className="text-center py-6 text-xs text-neutral-400">
                          No scout comments yet. Be the first to leave an observation!
                        </div>
                      ) : (
                        commentsList.map((comm) => (
                          <div key={comm.id} className="flex items-start gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {comm.authorName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <strong className="text-white text-[11px]">{comm.authorName}</strong>
                                <span className="text-[9px] text-amber-400 font-mono">[{comm.authorRole}]</span>
                                <span className="text-[9px] text-neutral-500">{comm.timestamp}</span>
                              </div>
                              <p className="text-neutral-300 mt-0.5">{comm.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Comment Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendComment(post.id)}
                        placeholder={`Add a note as ${currentUserName}...`}
                        className="flex-1 bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(post.id)}
                        disabled={!commentInput.trim()}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 disabled:opacity-40 cursor-pointer"
                      >
                        POST
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReelsStreamModal

