import React, { useEffect, useState } from "react"
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

  if (!isOpen) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(3, 6, 15, 0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0a0e1c",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          maxWidth: "680px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "var(--gold-bright, #fbbf24)",
                letterSpacing: "1px",
              }}
            >
              ACCOUNT STORAGE &amp; HISTORY
            </span>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: "#ffffff",
                margin: "2px 0 0",
              }}
            >
              Scout Vault · Saved Player Reports
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
          {reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>
              No scouting reports saved in your vault yet.
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <strong style={{ fontSize: "16px", color: "#ffffff" }}>{r.athleteName}</strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "rgba(34, 211, 238, 0.15)",
                        color: "#22d3ee",
                      }}
                    >
                      {r.sport}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                      {r.position}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                    Session Date: {r.date}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ textAlign: "right", marginRight: "6px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#fbbf24" }}>
                      {r.score}
                    </div>
                    <small style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>
                      GRADE {r.grade}
                    </small>
                  </div>

                  <button
                    onClick={() => {
                      onSelectReport(r)
                      onClose()
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Open Report
                  </button>

                  {onCompareReport && (
                    <button
                      onClick={() => {
                        onCompareReport(r)
                        onClose()
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #fbbf24, #d97706)",
                        border: "none",
                        color: "#000000",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
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
    </div>
  )
}
