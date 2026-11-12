import React, { useState, useEffect, useRef } from "react"
import { Icon } from "../App"
import type { DirectoryProfile } from "../App"

export interface Search3DPopoverProps {
  isOpen: boolean
  onClose: () => void
  profiles: DirectoryProfile[]
  onSelectProfile: (profile: DirectoryProfile) => void
  initialTerm?: string
  sports?: string[]
  lang?: "en" | "ar"
  onNavigateView?: (view: string, detail?: any) => void
  onOpenLiveStream?: () => void
  onOpenReel?: (reelId: string) => void
}

export function Search3DPopover({
  isOpen,
  onClose,
  profiles,
  onSelectProfile,
  initialTerm = "",
  sports = [
    "Soccer",
    "Basketball",
    "Tennis",
    "Volleyball",
    "Track & Field",
    "Combat Sports",
    "Swimming",
  ],
  lang = "en",
  onNavigateView,
  onOpenLiveStream,
  onOpenReel,
}: Search3DPopoverProps) {
  const [searchTerm, setSearchTerm] = useState(initialTerm)
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Accounts" | "Dashboard" | "Live">("All")
  const [roleFilter, setRoleFilter] = useState<"All" | "Player" | "Club" | "Scout">("All")
  const [sportFilter, setSportFilter] = useState("All")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchTerm(initialTerm)
  }, [initialTerm])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // System Dashboard items
  const DASHBOARD_ITEMS = [
    {
      id: "dash-full",
      title: "Full Biomechanics Dashboard",
      view: "FullDashboard",
      category: "Dashboard",
      sport: "All",
      desc: "Complete 60 FPS kinematics, combine radar charts & telemetry history.",
      icon: "chart" as const,
    },
    {
      id: "dash-scot",
      title: "Scot AI Video Analysis & Cam",
      view: "Dashboard",
      category: "Dashboard",
      sport: "Soccer",
      desc: "Live camera touch point detection and automated scouting reports.",
      icon: "video" as const,
    },
    {
      id: "dash-wearable",
      title: "Wearable Sensor Telemetry (MPU6050)",
      view: "Wearable",
      category: "Dashboard",
      sport: "Basketball",
      desc: "ESP32 real-time 3-axis acceleration, vertical metrics & BLE stream.",
      icon: "activity" as const,
    },
    {
      id: "dash-media",
      title: "Media Center & Analyzed Clips",
      view: "MediaCenter",
      category: "Dashboard",
      sport: "All",
      desc: "High-definition video vault, keyframe export & scouting reel archive.",
      icon: "play" as const,
    },
    {
      id: "dash-plans",
      title: "Scouting Subscription & Plans",
      view: "Plans",
      category: "Dashboard",
      sport: "All",
      desc: "Pro Scout pass, Academy tiers & institutional combine access.",
      icon: "shield" as const,
    },
  ]

  // Live match items
  const LIVE_ITEMS = [
    {
      id: "live-match-1",
      title: "Live Match: Ajax U19 vs Benfica U19",
      category: "Live",
      sport: "Soccer",
      desc: "68' (2-1) · Real-time 60 FPS CV analysis, tactical pitch & scout notes.",
    },
  ]

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.town.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sport.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "All" || p.role === roleFilter
    const matchesSport = sportFilter === "All" || p.sport === sportFilter
    return matchesSearch && matchesRole && matchesSport
  })

  // Filter dashboard items
  const filteredDashboards = DASHBOARD_ITEMS.filter((d) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)
  })

  // Filter live items
  const filteredLive = LIVE_ITEMS.filter((l) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return l.title.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q)
  })

  const totalResults =
    (categoryFilter === "All" || categoryFilter === "Accounts" ? filteredProfiles.length : 0) +
    (categoryFilter === "All" || categoryFilter === "Dashboard" ? filteredDashboards.length : 0) +
    (categoryFilter === "All" || categoryFilter === "Live" ? filteredLive.length : 0)

  const handleSelectDashboardItem = (viewName: string) => {
    onClose()
    if (onNavigateView) {
      onNavigateView(viewName)
    }
  }

  const handleSelectLiveStream = () => {
    onClose()
    if (onOpenLiveStream) {
      onOpenLiveStream()
    } else if (onNavigateView) {
      onNavigateView("LiveStream")
    }
  }

  return (
    <>
      {/* Backdrop to close popover when clicking anywhere outside */}
      <div
        className="search-3d-backdrop"
        onClick={onClose}
        data-testid="search-3d-backdrop"
      />

      {/* Floating 3D Small Screen under search bar */}
      <div
        ref={containerRef}
        className="search-3d-popover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search Discovery Screen"
        data-testid="search-3d-popover"
      >
        {/* 3D Pointer Diamond */}
        <div className="search-3d-pointer" />

        {/* 3D Header */}
        <div className="search-3d-header">
          <div>
            <div className="search-3d-eyebrow">
              <span className="search-3d-pulse-dot" />
              <span>DISCOVERY ENGINE</span>
              <span
                style={{
                  background: "rgba(251, 191, 36, 0.16)",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontSize: "9px",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                }}
              >
                {totalResults} FOUND
              </span>
            </div>
            <h3 className="search-3d-title">
              {lang === "ar" ? "استكشاف اللاعبين والأندية" : "FIND CLUBS & PLAYERS"}
            </h3>
          </div>

          <button
            type="button"
            className="search-3d-close-btn"
            onClick={onClose}
            aria-label="Close search popover"
            title="Close"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        {/* Real-time 3D Input Box */}
        <div className="search-3d-input-wrap">
          <Icon name="search" size={15} />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === "ar"
                ? "ابحث بالاسم، النادي، الرياضة، أو المدينة..."
                : "Search by name, club, sport, or city..."
            }
            aria-label="Search discovery input"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-3d-clear-btn"
              onClick={() => {
                setSearchTerm("")
                inputRef.current?.focus()
              }}
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Category Tabs: All / Accounts / Dashboard / Live */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/10 mb-2 overflow-x-auto no-scrollbar">
          {(["All", "Accounts", "Dashboard", "Live"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-amber-400 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {cat === "All" ? "ALL RESULTS" : cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Secondary Filter Pills (Role & Sport) for Accounts */}
        {(categoryFilter === "All" || categoryFilter === "Accounts") && (
          <div className="search-3d-filter-pills">
            {(["All", "Player", "Club", "Scout"] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`search-3d-pill ${roleFilter === r ? "active" : ""}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === "All"
                  ? "ALL ROLES"
                  : r === "Player"
                    ? "ATHLETES"
                    : `${r.toUpperCase()}S`}
              </button>
            ))}

            <select
              className="search-3d-select"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              aria-label="Filter by sport"
            >
              <option value="All">ALL SPORTS</option>
              {sports.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3D Results List */}
        <div className="search-3d-results-list max-h-[380px] overflow-y-auto no-scrollbar">
          {totalResults === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 12px",
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: "12px",
              }}
            >
              <div style={{ marginBottom: "6px" }}>🔍</div>
              <strong style={{ color: "rgba(255, 255, 255, 0.8)", display: "block" }}>
                NO PROFILES MATCH
              </strong>
              <small>Try typing a different name, club, or sport filter.</small>
            </div>
          ) : (
            <>
              {/* Dashboard Views Section */}
              {(categoryFilter === "All" || categoryFilter === "Dashboard") &&
                filteredDashboards.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 block tracking-wider">
                      DASHBOARD & TELEMETRY MODULES:
                    </span>
                    {filteredDashboards.map((dash) => (
                      <div
                        key={dash.id}
                        className="search-3d-row cursor-pointer"
                        onClick={() => handleSelectDashboardItem(dash.view)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <Icon name={dash.icon} size={15} />
                          </div>
                          <div className="search-3d-profile-info">
                            <div className="search-3d-name-row">
                              <strong className="search-3d-name">{dash.title}</strong>
                              <span className="search-3d-role-tag" style={{ background: "rgba(34, 211, 238, 0.15)", color: "#22d3ee" }}>
                                DASHBOARD
                              </span>
                            </div>
                            <div className="search-3d-meta">{dash.desc}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="search-3d-view-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectDashboardItem(dash.view)
                          }}
                        >
                          OPEN <Icon name="arrow" size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              {/* Live Match Broadcast Section */}
              {(categoryFilter === "All" || categoryFilter === "Live") &&
                filteredLive.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[10px] font-mono text-red-400 font-bold px-2 py-0.5 block tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE SCOUTING MATCH STREAMS:
                    </span>
                    {filteredLive.map((live) => (
                      <div
                        key={live.id}
                        className="search-3d-row cursor-pointer border-red-500/30 bg-red-950/20"
                        onClick={handleSelectLiveStream}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center shrink-0 animate-pulse text-xs">
                            🔴
                          </div>
                          <div className="search-3d-profile-info">
                            <div className="search-3d-name-row">
                              <strong className="search-3d-name">{live.title}</strong>
                              <span className="search-3d-role-tag" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                                LIVE NOW
                              </span>
                            </div>
                            <div className="search-3d-meta">{live.desc}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="search-3d-view-btn bg-red-600 text-white hover:bg-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectLiveStream()
                          }}
                        >
                          WATCH <Icon name="play" size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              {/* Athlete, Scout & Club Accounts Section */}
              {(categoryFilter === "All" || categoryFilter === "Accounts") &&
                filteredProfiles.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 block tracking-wider">
                      ATHLETE, CLUB & SCOUT ACCOUNTS:
                    </span>
                    {filteredProfiles.map((p) => (
                      <div
                        key={p.id}
                        className="search-3d-row"
                        onClick={() => { onClose(); onSelectProfile(p); }}
                        data-testid={`search-result-${p.id}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <img src={p.image} alt={p.name} className="search-3d-avatar" />
                          <div className="search-3d-profile-info">
                            <div className="search-3d-name-row">
                              <strong className="search-3d-name">{p.name}</strong>
                              <span className="search-3d-role-tag">{p.role}</span>
                            </div>
                            <div className="search-3d-meta">
                              {p.sport} · {p.town}, {p.country} · Rating {p.score}/100
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            className="search-3d-view-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onClose()
                              onSelectProfile(p)
                            }}
                          >
                            PROFILE <Icon name="arrow" size={10} />
                          </button>
                          {onNavigateView && (
                            <button
                              type="button"
                              className="px-2 py-1 rounded bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer"
                              title={`View ${p.name}'s biometric dashboard`}
                              aria-label={`View ${p.name}'s biometric dashboard`}
                              onClick={(e) => {
                                e.stopPropagation()
                                onClose()
                                onNavigateView("Dashboard", { athlete: p })
                              }}
                            >
                              DASHBOARD
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Search3DPopover
