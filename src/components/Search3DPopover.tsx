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
}: Search3DPopoverProps) {
  const [searchTerm, setSearchTerm] = useState(initialTerm)
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

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.town.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sport.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "All" || p.role === roleFilter
    const matchesSport = sportFilter === "All" || p.sport === sportFilter
    return matchesSearch && matchesRole && matchesSport
  })

  return (
    <>
      {/* Invisible backdrop to close popover when clicking anywhere outside */}
      <div
        className="search-3d-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          background: "transparent",
        }}
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
                {filtered.length} FOUND
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

        {/* 3D Filter Pills */}
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

        {/* 3D Results List */}
        <div className="search-3d-results-list">
          {filtered.length === 0 ? (
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
            filtered.map((p) => (
              <div
                key={p.id}
                className="search-3d-row"
                onClick={() => onSelectProfile(p)}
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

                <button
                  type="button"
                  className="search-3d-view-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectProfile(p)
                  }}
                >
                  VIEW <Icon name="arrow" size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default Search3DPopover

