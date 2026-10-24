import React, { useState, useMemo, useRef } from "react"
import { Icon } from "../App"

export interface MediaClip {
  id: string
  session: string
  title: string
  value: string
  label: string
  image: string
  videoUrl?: string
  date: string
  sport: string
  duration?: string
  overallScore?: number
  grade?: string
  verified?: boolean
}

export const initialDemoClips: MediaClip[] = [
  {
    id: "clip-demo-18",
    session: "SESSION 18",
    title: "Vertical Jump & Rim Elevation",
    value: "0.83s",
    label: "Hang time",
    image:
      "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80",
    date: "Oct 18, 2026",
    sport: "Basketball",
    duration: "0:18",
    overallScore: 94,
    grade: "A+",
    verified: true,
  },
  {
    id: "clip-demo-17",
    session: "SESSION 17",
    title: "Baseline Drive & Takeoff Mechanics",
    value: "78.4cm",
    label: "Vertical",
    image:
      "https://images.unsplash.com/photo-1762025753986-b6227fe6debb?auto=format&fit=crop&w=800&q=80",
    date: "Oct 16, 2026",
    sport: "Basketball",
    duration: "0:22",
    overallScore: 92,
    grade: "A",
    verified: true,
  },
  {
    id: "clip-demo-16",
    session: "SESSION 16",
    title: "Fastbreak Transition & Deceleration",
    value: "186ms",
    label: "Contact",
    image:
      "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?auto=format&fit=crop&w=800&q=80",
    date: "Oct 14, 2026",
    sport: "Basketball",
    duration: "0:29",
    overallScore: 90,
    grade: "A",
    verified: true,
  },
  {
    id: "clip-demo-15",
    session: "SESSION 15",
    title: "Perimeter Cut & Plant Acceleration",
    value: "8.42m/s",
    label: "Top Speed",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80",
    date: "Oct 11, 2026",
    sport: "Basketball",
    duration: "0:15",
    overallScore: 89,
    grade: "A-",
    verified: true,
  },
  {
    id: "clip-demo-14",
    session: "SESSION 14",
    title: "Defensive Slide & Lateral Change",
    value: "1.42s",
    label: "Reaction",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    date: "Oct 08, 2026",
    sport: "Basketball",
    duration: "0:26",
    overallScore: 91,
    grade: "A",
    verified: true,
  },
  {
    id: "clip-demo-13",
    session: "SESSION 13",
    title: "Catch & Shoot Kinetic Chain",
    value: "0.68s",
    label: "Release Time",
    image:
      "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80",
    date: "Oct 04, 2026",
    sport: "Basketball",
    duration: "0:14",
    overallScore: 95,
    grade: "A+",
    verified: true,
  },
  {
    id: "clip-demo-12",
    session: "SESSION 12",
    title: "Eurostep Footwork & Landing Flexion",
    value: "42.6°",
    label: "Knee Flexion",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    date: "Sep 29, 2026",
    sport: "Basketball",
    duration: "0:31",
    overallScore: 88,
    grade: "B+",
    verified: true,
  },
  {
    id: "clip-demo-11",
    session: "SESSION 11",
    title: "Pick & Roll Read Biomechanics",
    value: "96%",
    label: "Symmetry",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    date: "Sep 25, 2026",
    sport: "Basketball",
    duration: "0:35",
    overallScore: 93,
    grade: "A",
    verified: true,
  },
  {
    id: "clip-demo-10",
    session: "SESSION 10",
    title: "Post Entry Pivot & Up-and-Under",
    value: "74.2cm",
    label: "Vertical",
    image:
      "https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=800&q=80",
    date: "Sep 20, 2026",
    sport: "Basketball",
    duration: "0:20",
    overallScore: 87,
    grade: "B+",
    verified: true,
  },
  {
    id: "clip-demo-09",
    session: "SESSION 9",
    title: "Full Court Press Breakout Sprint",
    value: "3.92m/s²",
    label: "Acceleration",
    image:
      "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=800&q=80",
    date: "Sep 15, 2026",
    sport: "Basketball",
    duration: "0:28",
    overallScore: 94,
    grade: "A+",
    verified: true,
  },
  {
    id: "clip-demo-08",
    session: "SESSION 8",
    title: "Isolation Crossover & Burst",
    value: "192ms",
    label: "Step Cadence",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    date: "Sep 10, 2026",
    sport: "Basketball",
    duration: "0:19",
    overallScore: 91,
    grade: "A",
    verified: true,
  },
  {
    id: "clip-demo-07",
    session: "SESSION 7",
    title: "Chasedown Block Approach Velocity",
    value: "0.81s",
    label: "Air Time",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    date: "Sep 05, 2026",
    sport: "Basketball",
    duration: "0:23",
    overallScore: 96,
    grade: "A+",
    verified: true,
  },
]

interface MediaCenterPageProps {
  onBack: () => void
  sport: string
  name: string
  role: string
  mediaClips: MediaClip[]
  onDeleteClip?: (id: string) => void
  onAddClip?: (clip: MediaClip) => void
  onOpenReport?: () => void
}

export function MediaCenterPage({
  onBack,
  sport,
  name,
  role,
  mediaClips,
  onDeleteClip,
  onAddClip,
  onOpenReport,
}: MediaCenterPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")
  const [activeClipModal, setActiveClipModal] = useState<MediaClip | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tags = ["All", "Hang time", "Vertical", "Contact", "Top Speed", "Release Time"]

  const filteredClips = useMemo(() => {
    return mediaClips.filter((clip) => {
      const matchesSearch =
        clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.sport.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTag =
        selectedTag === "All" ||
        clip.label.toLowerCase().includes(selectedTag.toLowerCase())
      return matchesSearch && matchesTag
    })
  }, [mediaClips, searchQuery, selectedTag])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAddClip) return
    const newClip: MediaClip = {
      id: `clip-${Date.now()}`,
      session: `SESSION ${mediaClips.length + 1}`,
      title: file.name.replace(/\.[^/.]+$/, "") || `Session ${mediaClips.length + 1}`,
      value: "Ready",
      label: "Uploaded Motion",
      image:
        "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80",
      videoUrl: URL.createObjectURL(file),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      sport,
      duration: "0:24",
      overallScore: 92,
      grade: "A",
      verified: true,
    }
    onAddClip(newClip)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="media-center-page">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="media-center-header">
        <div className="media-center-breadcrumbs">
          <button className="back-link-btn" onClick={onBack}>
            <Icon name="arrow" size={14} /> Back to Profile
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Media Center</span>
        </div>

        <div className="media-center-actions">
          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="bolt" size={14} /> Upload Video to Center
          </button>
          {onOpenReport && (
            <button className="primary-button" onClick={onOpenReport}>
              <Icon name="shield" size={14} /> Verified Report
            </button>
          )}
        </div>
      </div>

      {/* Hero Overview */}
      <div className="media-center-hero">
        <div className="media-hero-left">
          <span className="section-kicker">ATHLETE FOOTAGE VAULT</span>
          <h1 className="media-hero-title">ANALYZED MOTION & CLIPS</h1>
          <p className="media-hero-sub">
            Verified keyframe extractions, kinematic telemetry, and AI scouting
            captures for <strong>{name}</strong> ({sport} · {role}).
          </p>
        </div>

        <div className="media-hero-kpis">
          <div className="media-kpi-card">
            <strong>{mediaClips.length}</strong>
            <span>TOTAL CLIPS</span>
          </div>
          <div className="media-kpi-card">
            <strong>0.83s</strong>
            <span>PEAK HANG TIME</span>
          </div>
          <div className="media-kpi-card">
            <strong>78.4cm</strong>
            <span>PEAK VERTICAL</span>
          </div>
          <div className="media-kpi-card">
            <strong style={{ color: "var(--gold-bright)" }}>100%</strong>
            <span>AI VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="media-controls-deck">
        <div className="media-search-wrap">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Search sessions, biomechanics, or tags…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        <div className="media-tags-strip">
          {tags.map((tag) => (
            <button
              key={tag}
              className={`media-tag-chip ${selectedTag === tag ? "active" : ""}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Clips */}
      {filteredClips.length > 0 ? (
        <div className="media-clips-grid">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              className="media-clip-tile"
              onClick={() => setActiveClipModal(clip)}
            >
              <div className="clip-thumb-wrap">
                <img src={clip.image} alt={clip.title} />
                <div className="clip-play-badge">
                  <Icon name="play" size={16} />
                </div>
                <div className="clip-top-badges">
                  <span className="clip-session-pill">{clip.session}</span>
                  {clip.duration && (
                    <span className="clip-duration-pill">{clip.duration}</span>
                  )}
                </div>
                {clip.verified && (
                  <span className="clip-verified-pill">
                    <Icon name="shield" size={10} /> VERIFIED
                  </span>
                )}
              </div>

              <div className="clip-tile-info">
                <div className="clip-tile-kicker">
                  <span>{clip.date}</span>
                  <span className="clip-sport-label">{clip.sport}</span>
                </div>
                <h3 className="clip-tile-title">{clip.title}</h3>
                <div className="clip-tile-footer">
                  <div className="clip-metric-badge">
                    <strong>{clip.value}</strong>
                    <span>{clip.label}</span>
                  </div>
                  {clip.overallScore && (
                    <div className="clip-score-pill">
                      <span>RATING</span>
                      <strong>{clip.overallScore}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="media-empty-state">
          <Icon name="play" size={36} />
          <h3>No Analyzed Clips Found</h3>
          <p>
            No clips matched &quot;{searchQuery}&quot;. Try adjusting your search query
            or tag filter.
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setSearchQuery("")
              setSelectedTag("All")
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Interactive Video / Telemetry Preview Modal */}
      {activeClipModal && (
        <div
          className="media-modal-backdrop"
          onClick={() => setActiveClipModal(null)}
        >
          <div
            className="media-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="media-modal-header">
              <div>
                <span className="section-kicker">
                  {activeClipModal.session} · {activeClipModal.sport}
                </span>
                <h2>{activeClipModal.title}</h2>
              </div>
              <button
                className="modal-close-icon"
                onClick={() => setActiveClipModal(null)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="media-modal-player-area">
              {activeClipModal.videoUrl ? (
                <video
                  src={activeClipModal.videoUrl}
                  controls
                  autoPlay
                  className="media-modal-video"
                />
              ) : (
                <div className="media-modal-freezeframe">
                  <img src={activeClipModal.image} alt={activeClipModal.title} />
                  <div className="freezeframe-overlay">
                    <span className="ai-overlay-tag">
                      <Icon name="shield" size={12} /> BIOMECHANICAL MOTION TRACKING
                    </span>
                    <div className="freezeframe-coords">
                      <span>X: 184px | Y: 292px</span>
                      <span>KINETIC SYMMETRY: 96%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="media-modal-telemetry">
              <div className="telemetry-item">
                <span>MEASURED METRIC</span>
                <strong>{activeClipModal.value}</strong>
                <small>{activeClipModal.label}</small>
              </div>
              <div className="telemetry-item">
                <span>SCOT AI RATING</span>
                <strong style={{ color: "var(--gold-bright)" }}>
                  {activeClipModal.overallScore ?? 92}/100
                </strong>
                <small>Grade {activeClipModal.grade ?? "A"}</small>
              </div>
              <div className="telemetry-item">
                <span>SESSION TIMESTAMP</span>
                <strong>{activeClipModal.date}</strong>
                <small>Hardware Timestamped</small>
              </div>
              <div className="telemetry-item">
                <span>CERTIFICATION</span>
                <strong style={{ color: "var(--green)" }}>VERIFIED</strong>
                <small>Cryptographic Hash</small>
              </div>
            </div>

            <div className="media-modal-actions">
              {onDeleteClip && (
                <button
                  className="danger-button"
                  onClick={() => {
                    onDeleteClip(activeClipModal.id)
                    setActiveClipModal(null)
                  }}
                >
                  Delete Clip
                </button>
              )}
              {onOpenReport && (
                <button
                  className="primary-button"
                  onClick={() => {
                    setActiveClipModal(null)
                    onOpenReport()
                  }}
                >
                  <Icon name="shield" size={14} /> Open Verified Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
