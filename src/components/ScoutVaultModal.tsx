import React, { useEffect, useState, useRef } from "react"
import { Icon } from "../App"
import type { VideoAnalysisReport } from "../video-analysis"

export interface SavedScoutReport {
  id: string
  athleteName: string
  sport: string
  position: string
  date: string
  score: number
  grade: string
  report: VideoAnalysisReport
}

interface ScoutVaultModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectReport: (report: SavedScoutReport) => void
  onCompareReport?: (report: SavedScoutReport) => void
}

export const ScoutVaultModal: React.FC<ScoutVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
  onCompareReport,
}) => {
  const [reports, setReports] = useState<SavedScoutReport[]>([])
  const [searchFilter, setSearchFilter] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    try {
      const stored = localStorage.getItem("scot_player_vault")
      if (stored) {
        setReports(JSON.parse(stored))
      } else {
        // Default seed reports if empty
        const defaultReports: SavedScoutReport[] = [
          {
            id: "vault-1",
            athleteName: "Omar Khalil",
            sport: "Basketball",
            position: "Point Guard",
            date: "Oct 18, 2026",
            score: 94,
            grade: "A+",
            report: {
              overallScore: 94,
              overallGrade: "A+",
              playerSummary: "Division-1 athletic caliber with standout vertical acceleration.",
              oneLiner: "Elite perimeter quickness and first-step kinetic chain transfer.",
              position: "Point Guard",
              metrics: [
                { name: "Vertical Jump", score: 95, note: "Peak rim clearance" },
                { name: "Hang Time", score: 94, note: "0.83s flight" },
                { name: "Kinetic Chain", score: 92, note: "Optimal extension" },
                { name: "Ground Contact", score: 88, note: "Sub-190ms" },
                { name: "Lateral Quickness", score: 91, note: "Elite change of direction" },
                { name: "Shooting Mechanics", score: 89, note: "High release point" },
              ],
              strengths: [
                "Elite rapid force development in vertical takeoff phase.",
                "Optimal kinetic chain transfer from hip extension into explosive elevation.",
                "Bilateral landing symmetry within 2.8% variance.",
              ],
              areasToImprove: [
                "Slight right-side valgus drift on rapid emergency decelerations.",
                "Initial approach step length can be lengthened by 4-6cm.",
              ],
              recommendations: [
                "Implement isometric depth drops 2x weekly.",
                "Target single-leg Bulgarian split squats with velocity-based barbell tracking.",
              ],
              narrative: "Omar demonstrates division-one athleticism with standout vertical displacement and exceptional hang time.",
            },
          },
          {
            id: "vault-2",
            athleteName: "Tariq Mansour",
            sport: "Football",
            position: "Winger",
            date: "Oct 12, 2026",
            score: 91,
            grade: "A",
            report: {
              overallScore: 91,
              overallGrade: "A",
              playerSummary: "Dynamic flank runner with explosive acceleration and crossing accuracy.",
              oneLiner: "Exceptional 1v1 carry velocity and low center-of-gravity recovery.",
              position: "Winger",
              metrics: [
                { name: "Sprint Speed", score: 96, note: "34.2 km/h top speed" },
                { name: "Acceleration", score: 94, note: "3.92 m/s² burst" },
                { name: "Ball Control", score: 90, note: "Close touch cadence" },
                { name: "Crossing", score: 88, note: "Pinpoint delivery" },
                { name: "Dribble Win %", score: 89, note: "68% success" },
                { name: "Recovery Pace", score: 87, note: "High-workload tracking" },
              ],
              strengths: ["Explosive first 10m sprint burst", "Relentless transition counter-pressing"],
              areasToImprove: ["Weak-foot finishing in 18-yard box"],
              recommendations: ["Plyometric bounding drills to maximize sprint cadence"],
              narrative: "Tariq displays elite European academy standard sprint velocity and transition play.",
            },
          },
        ]
        setReports(defaultReports)
        localStorage.setItem("scot_player_vault", JSON.stringify(defaultReports))
      }
    } catch {}
  }, [isOpen])

  // Handle Escape key
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

  const filteredReports = reports.filter((r) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return (
      r.athleteName.toLowerCase().includes(q) ||
      r.sport.toLowerCase().includes(q) ||
      r.position.toLowerCase().includes(q)
    )
  })

  return (
    <>
      {/* Backdrop to dismiss popover when clicking outside */}
      <div
        className="vault-3d-backdrop"
        onClick={onClose}
        data-testid="vault-3d-backdrop"
      />

      {/* 3D Floating Small Screen under Scot Vault button */}
      <div
        ref={containerRef}
        className="vault-3d-popover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Scout Vault Repository Screen"
        data-testid="vault-3d-popover"
      >
        {/* 3D Pointer Diamond */}
        <div className="vault-3d-pointer" />

        {/* 3D Header */}
        <div className="vault-3d-header">
          <div>
            <div className="vault-3d-eyebrow">
              <span className="vault-3d-pulse-dot" />
              <span>ACCOUNT STORAGE &amp; HISTORY</span>
              <span
                style={{
                  background: "rgba(251, 191, 36, 0.16)",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontSize: "9px",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                }}
              >
                {filteredReports.length} DOSSIERS
              </span>
            </div>
            <h3 className="vault-3d-title">
              Scout Vault · Saved Player Reports
            </h3>
          </div>

          <button
            type="button"
            className="vault-3d-close-btn"
            onClick={onClose}
            aria-label="Close Scout Vault"
            title="Close"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        {/* Quick Filter Input */}
        <div className="vault-3d-search-wrap">
          <Icon name="search" size={14} />
          <input
            ref={inputRef}
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter saved dossiers by name, sport..."
            aria-label="Filter saved dossiers"
          />
          {searchFilter && (
            <button
              type="button"
              className="vault-3d-clear-btn"
              onClick={() => {
                setSearchFilter("")
                inputRef.current?.focus()
              }}
            >
              CLEAR
            </button>
          )}
        </div>

        {/* 3D Saved Reports List */}
        <div className="vault-3d-results-list">
          {filteredReports.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 12px",
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: "12px",
              }}
            >
              <div style={{ marginBottom: "6px" }}>🛡️</div>
              <strong style={{ color: "rgba(255, 255, 255, 0.8)", display: "block" }}>
                NO SAVED REPORTS FOUND
              </strong>
              <small>No scouting dossiers match your current filter query.</small>
            </div>
          ) : (
            filteredReports.map((r) => (
              <div
                key={r.id}
                className="vault-3d-row"
                onClick={() => {
                  onSelectReport(r)
                  onClose()
                }}
                data-testid={`vault-row-${r.id}`}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <strong className="vault-3d-athlete-name">{r.athleteName}</strong>
                    <span className="vault-3d-sport-tag">{r.sport}</span>
                    <span className="vault-3d-position-tag">{r.position}</span>
                  </div>
                  <div className="vault-3d-date-meta">
                    Session Date: {r.date}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>
                      {r.score}
                    </div>
                    <small style={{ fontSize: "9px", color: "#10b981", fontWeight: 800 }}>
                      GRADE {r.grade}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="vault-3d-open-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectReport(r)
                      onClose()
                    }}
                  >
                    Open Report
                  </button>

                  {onCompareReport && (
                    <button
                      type="button"
                      className="vault-3d-compare-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCompareReport(r)
                        onClose()
                      }}
                    >
                      Compare Dual
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default ScoutVaultModal
