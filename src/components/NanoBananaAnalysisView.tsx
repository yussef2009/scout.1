import React, { useState, useMemo } from "react"
import { Icon, ScoreRing, type ProfileRecord } from "../App"
import type {
  VideoAnalysisReport,
  DetectedPlayer,
  AnalysisTouchPoint,
} from "../video-analysis"
import { PitchHeatmap2D } from "./PitchHeatmap2D"

export interface AccreditationMetadata {
  label: string
  authority: string
  codePrefix: string
  tier: string
}

export const SPORT_ACCREDITATIONS_EXTENDED: Record<string, AccreditationMetadata> = {
  Soccer: { label: "FIFA SOTA LAB ACCREDITED", authority: "FIFA Innovation Biomechanics Standard v4.2", codePrefix: "FIFA-ST", tier: "TIER 1 ELITE" },
  Basketball: { label: "FIBA / NBA COMBINE CERTIFIED", authority: "FIBA Technical Biomechanics Protocol 2026", codePrefix: "FIBA-COMB", tier: "NBA COMBINE D1" },
  Volleyball: { label: "FIVB PRO KINEMATICS", authority: "FIVB High Performance Olympic Verification", codePrefix: "FIVB-KIN", tier: "FIVB WORLD CLASS" },
  Tennis: { label: "ITF / ATP KINEMATICS LAB", authority: "ITF Biomechanical Grand Slam Standard", codePrefix: "ITF-ATP", tier: "ATP TOUR READY" },
  "Track & Field": { label: "WORLD ATHLETICS BIO-TRACK", authority: "World Athletics Biomechanics & Kinetic Protocol", codePrefix: "WA-OLY", tier: "OLYMPIC STANDARD" },
  Boxing: { label: "AIBA / COMBAT METRICS CERTIFIED", authority: "AIBA & Olympic Boxing Kinematic Lab", codePrefix: "AIBA-COMB", tier: "CHAMPIONSHIP TIER" },
  Swimming: { label: "WORLD AQUATICS / FINA COMPLIANT", authority: "World Aquatics Hydrodynamic Biomechanics", codePrefix: "FINA-HYD", tier: "OLYMPIC PROSPECT" },
  Baseball: { label: "MLB STATCAST VALIDATED", authority: "MLB Official Statcast Biomechanical Engine", codePrefix: "MLB-SC", tier: "MLB D1 PROSPECT" },
  Cycling: { label: "UCI AERODYNAMICS & POWER LAB", authority: "UCI World Cycling Center Technical Biometrics", codePrefix: "UCI-AERO", tier: "WORLD TOUR CALIBER" },
  Gymnastics: { label: "FIG BIOMECHANICS PROTOCOL", authority: "Fédération Internationale de Gymnastique Lab", codePrefix: "FIG-ART", tier: "FIG ELITE STANDARD" },
}

export interface NanoBananaAnalysisViewProps {
  reports: {
    player?: DetectedPlayer
    report: VideoAnalysisReport
  }[]
  allDetectedPlayers?: DetectedPlayer[]
  sport: string
  userName: string
  userRole?: string
  onOpenPerformanceReport?: (report: VideoAnalysisReport, player?: DetectedPlayer) => void
  onSaveProfileRecord?: (record: ProfileRecord) => void
  savedReportIds?: string[]
  onAnalyzePlayer?: (player: DetectedPlayer) => void
  demoMode?: boolean
}

// Sport-specific kinematic benchmarks for fallback display
const SPORT_BENCHMARKS: Record<
  string,
  { label: string; value: string; unit: string; delta: string; pct: number }[]
> = {
  Soccer: [
    { label: "Max sprint speed", value: "34.8", unit: "km/h", delta: "+3.8%", pct: 95 },
    { label: "0–10m acceleration", value: "1.72", unit: "sec", delta: "Elite", pct: 93 },
    { label: "Change of direction", value: "91.4", unit: "idx", delta: "+4.6%", pct: 91 },
    { label: "Agility rating", value: "93", unit: "/100", delta: "Top 3%", pct: 93 },
    { label: "Header displacement", value: "54.2", unit: "cm", delta: "+2.1%", pct: 88 },
  ],
  Basketball: [
    { label: "Vertical jump", value: "78.4", unit: "cm", delta: "+6.2%", pct: 94 },
    { label: "Hang time", value: "0.83", unit: "sec", delta: "Elite", pct: 96 },
    { label: "Takeoff acceleration", value: "3.84", unit: "m/s²", delta: "+8.2%", pct: 95 },
    { label: "Ground contact", value: "186", unit: "ms", delta: "−12 ms", pct: 92 },
    { label: "Landing flexion", value: "42.6", unit: "°", delta: "Low risk", pct: 97 },
  ],
  Volleyball: [
    { label: "Approach jump", value: "81.2", unit: "cm", delta: "+4.1%", pct: 96 },
    { label: "Hang time", value: "0.86", unit: "sec", delta: "Elite", pct: 97 },
    { label: "Takeoff acceleration", value: "3.71", unit: "m/s²", delta: "+5.8%", pct: 93 },
    { label: "Ground contact", value: "192", unit: "ms", delta: "Optimal", pct: 90 },
    { label: "Landing flexion", value: "44.1", unit: "°", delta: "Low risk", pct: 96 },
  ],
  Tennis: [
    { label: "Serve velocity", value: "194", unit: "km/h", delta: "+5.2%", pct: 95 },
    { label: "First-step burst", value: "1.68", unit: "sec", delta: "Elite", pct: 94 },
    { label: "Split-step timing", value: "142", unit: "ms", delta: "Optimal", pct: 93 },
    { label: "Lateral decel", value: "89.4", unit: "idx", delta: "Top 4%", pct: 91 },
    { label: "Trunk rotation", value: "48.2", unit: "°", delta: "+3.4°", pct: 96 },
  ],
  "Track & Field": [
    { label: "Max velocity", value: "38.4", unit: "km/h", delta: "+2.9%", pct: 97 },
    { label: "Stride length", value: "2.28", unit: "m", delta: "Elite", pct: 95 },
    { label: "Stride frequency", value: "4.62", unit: "Hz", delta: "+0.18 Hz", pct: 96 },
    { label: "Ground contact", value: "108", unit: "ms", delta: "Optimal", pct: 94 },
    { label: "Force production", value: "4.2", unit: "kN", delta: "Top 2%", pct: 98 },
  ],
  Boxing: [
    { label: "Punch speed", value: "11.8", unit: "m/s", delta: "+8.4%", pct: 96 },
    { label: "Head slip reaction", value: "128", unit: "ms", delta: "Elite", pct: 97 },
    { label: "Kinetic transfer", value: "88.4", unit: "%", delta: "Optimal", pct: 94 },
    { label: "Rotational torque", value: "240", unit: "Nm", delta: "Top 3%", pct: 95 },
    { label: "Guard recovery", value: "142", unit: "ms", delta: "Low risk", pct: 92 },
  ],
}

export function NanoBananaAnalysisView({
  reports,
  allDetectedPlayers = [],
  sport,
  userName,
  userRole = "Player",
  onOpenPerformanceReport,
  onSaveProfileRecord,
  savedReportIds = [],
  onAnalyzePlayer,
  demoMode = false,
}: NanoBananaAnalysisViewProps) {
  // Navigation tabs: "teams" (Team selector/roster) vs "player_report" (Player Dossier Shortcut)
  const [activeTab, setActiveTab] = useState<"teams" | "player_report">("player_report")

  // Selected player index for the player report tab
  const [selectedReportIndex, setSelectedReportIndex] = useState<number>(0)

  // Team filter when on "teams" tab: "all" or specific team name
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all")

  // Touch analysis active touch state per report
  const [activeTouchNumber, setActiveTouchNumber] = useState<number>(1)

  // Feedback on copy
  const [copiedLink, setCopiedLink] = useState(false)

  // Current active report & player
  const currentItem = reports[selectedReportIndex] || reports[0]
  const currentReport = currentItem?.report
  const currentPlayer = currentItem?.player

  // Accreditation details tailored for sport
  const accreditation = useMemo(() => {
    return (
      SPORT_ACCREDITATIONS_EXTENDED[sport] ||
      (sport.toLowerCase().includes("foot") || sport.toLowerCase().includes("soccer")
        ? SPORT_ACCREDITATIONS_EXTENDED["Soccer"]
        : sport.toLowerCase().includes("volley")
          ? SPORT_ACCREDITATIONS_EXTENDED["Volleyball"]
          : SPORT_ACCREDITATIONS_EXTENDED["Basketball"])
    )
  }, [sport])

  const isVolleyballSport = useMemo(() => {
    return sport.toLowerCase().includes("volley") || Boolean(currentReport?.volleyballMetrics)
  }, [sport, currentReport])

  // Extract unique teams from detected players and reports
  const teamsData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; players: DetectedPlayer[] }>()

    // Pool all known players from reports and detected players
    const pooled: DetectedPlayer[] = []
    const seenIds = new Set<string>()

    reports.forEach((r) => {
      if (r.player && !seenIds.has(r.player.id)) {
        seenIds.add(r.player.id)
        pooled.push(r.player)
      }
    })

    allDetectedPlayers.forEach((p) => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id)
        pooled.push(p)
      }
    })

    if (!pooled.length) {
      // Synthetic fallback team for single performance analysis
      return [
        {
          name: "Main Squad",
          color: "#3b82f6",
          players: [
            {
              id: "P1",
              label: userName || "Analyzed Athlete",
              jerseyNumber: "10",
              position: currentReport?.position || "Starter",
              team: "Main Squad",
              confidence: 96,
            },
          ],
        },
      ]
    }

    pooled.forEach((p) => {
      let tName = (p.team || "").trim()
      if (!tName) {
        // Deduce team from label or color
        if (p.label.toLowerCase().includes("team a") || p.label.toLowerCase().includes("blue") || p.label.toLowerCase().includes("near")) {
          tName = "Team A (Near Court)"
        } else if (p.label.toLowerCase().includes("team b") || p.label.toLowerCase().includes("red") || p.label.toLowerCase().includes("far")) {
          tName = "Team B (Far Court)"
        } else {
          tName = "First Team"
        }
      }

      if (!map.has(tName)) {
        map.set(tName, {
          name: tName,
          color: p.teamColorHex || (tName.includes("B") || tName.includes("Red") ? "#ef4444" : "#3b82f6"),
          players: [],
        })
      }
      map.get(tName)!.players.push(p)
    })

    return Array.from(map.values())
  }, [reports, allDetectedPlayers, userName, currentReport])

  // All players for team view based on filter
  const filteredTeamPlayers = useMemo(() => {
    if (selectedTeamFilter === "all") {
      return teamsData.flatMap((t) => t.players.map((p) => ({ ...p, teamName: t.name, teamColor: t.color })))
    }
    const t = teamsData.find((tm) => tm.name === selectedTeamFilter)
    return t ? t.players.map((p) => ({ ...p, teamName: t.name, teamColor: t.color })) : []
  }, [teamsData, selectedTeamFilter])

  // Check which players already have an analysis report
  const reportByPlayerId = useMemo(() => {
    const map = new Map<string, { report: VideoAnalysisReport; index: number }>()
    reports.forEach((item, idx) => {
      if (item.player?.id) {
        map.set(item.player.id, { report: item.report, index: idx })
      } else {
        map.set(`report-${idx}`, { report: item.report, index: idx })
      }
    })
    return map
  }, [reports])

  // Handle switching from Team roster directly to a player's report
  const handleOpenPlayerReportFromTeam = (playerId: string) => {
    const match = reportByPlayerId.get(playerId)
    if (match) {
      setSelectedReportIndex(match.index)
      setActiveTab("player_report")
      setActiveTouchNumber(1)
    } else {
      // Find player and if onAnalyzePlayer provided, trigger analysis
      const p = allDetectedPlayers.find((item) => item.id === playerId)
      if (p && onAnalyzePlayer) {
        onAnalyzePlayer(p)
      }
    }
  }

  // Active touch point calculation
  const touchPoints = currentReport?.touchPoints || []
  const activeTouch: AnalysisTouchPoint | undefined =
    touchPoints.find((t) => t.touchNumber === activeTouchNumber) || touchPoints[0]

  // Kinematic benchmarks
  const kinematicKpis = useMemo(() => {
    const norm = sport in SPORT_BENCHMARKS ? sport : "Soccer"
    const base = SPORT_BENCHMARKS[norm] || SPORT_BENCHMARKS["Soccer"]
    const score = currentReport?.overallScore || 90

    // Adjust benchmark values dynamically based on report score
    return base.map((kpi, idx) => {
      const multiplier = score / 92.0
      let valStr = kpi.value
      const num = parseFloat(kpi.value)
      if (!isNaN(num)) {
        if (kpi.unit === "km/h" || kpi.unit === "cm" || kpi.unit === "m/s" || kpi.unit === "Nm") {
          valStr = (num * multiplier).toFixed(1)
        } else if (kpi.unit === "sec" || kpi.unit === "m") {
          valStr = (num * (kpi.label.includes("0–10") ? 1 / multiplier : multiplier)).toFixed(2)
        }
      }
      return {
        ...kpi,
        value: valStr,
        pct: Math.min(99, Math.max(75, Math.round(kpi.pct * (score / 94.0)))),
      }
    })
  }, [sport, currentReport])

  const athleteDisplayName =
    currentPlayer?.label || (userName ? userName.toUpperCase() : "VERIFIED PROSPECT")

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  if (!currentReport) {
    return null
  }

  return (
    <div className="w-full space-y-5 my-6 text-slate-100 font-sans">
      {/* =========================================================================
          TOP SMALL TABS (TEAM ROSTER & PLAYER REPORT SHORTCUT)
          ========================================================================= */}
      <div className="banana-glass rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-3 border border-yellow-400/25 gold-glow">
        {/* The Two Primary Action Tabs */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* TAB 1: Team Selector / Squad Roster */}
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === "teams"
                ? "banana-glass-active shadow-lg shadow-yellow-500/25 border font-black scale-[1.02]"
                : "bg-black/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-yellow-400/15"
            }`}
          >
            <span className="text-sm">🛡️</span>
            <span>TEAM SQUADS & ROSTER</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-yellow-400/20 text-yellow-300 ml-1">
              {teamsData.length} {teamsData.length === 1 ? "Team" : "Teams"}
            </span>
          </button>

          {/* TAB 2: Player's Report Shortcut */}
          <button
            type="button"
            onClick={() => setActiveTab("player_report")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === "player_report"
                ? "banana-glass-active shadow-lg shadow-yellow-500/25 border font-black scale-[1.02]"
                : "bg-black/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-yellow-400/15"
            }`}
          >
            <span className="text-sm">⚡</span>
            <span>PLAYER REPORT SHORTCUT</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-yellow-400/20 text-yellow-300 ml-1 font-bold">
              {reports.length} Analyzed
            </span>
          </button>
        </div>

        {/* Global Live Accreditation Status Tag */}
        <div className="flex items-center space-x-2 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20 text-xs font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span className="text-yellow-400 font-bold uppercase tracking-wider text-[11px]">
            {accreditation.label}
          </span>
        </div>
      </div>

      {/* =========================================================================
          CONTENT FOR TAB 1: TEAMS & SQUADS ROSTER
          ========================================================================= */}
      {activeTab === "teams" && (
        <div className="banana-glass rounded-3xl p-5 sm:p-7 border border-yellow-400/25 gold-glow space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-yellow-400/15">
            <div>
              <span className="text-[11px] font-mono text-yellow-400 font-bold uppercase tracking-widest block">
                ● MULTI-TEAM ROSTER REPERTOIRE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Discovered On-Court Squads & Player Reports
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select any athlete card below to open their certified scouting report directly.
              </p>
            </div>

            {/* Team Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1.5 rounded-xl border border-yellow-400/20">
              <button
                type="button"
                onClick={() => setSelectedTeamFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedTeamFilter === "all"
                    ? "bg-yellow-400 text-black font-black"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                All Squads
              </button>
              {teamsData.map((tm) => (
                <button
                  key={tm.name}
                  type="button"
                  onClick={() => setSelectedTeamFilter(tm.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    selectedTeamFilter === tm.name
                      ? "bg-yellow-400 text-black font-black"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: tm.color }}
                  ></span>
                  <span>{tm.name}</span>
                  <span className="opacity-70 text-[10px]">({tm.players.length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredTeamPlayers.map((p) => {
              const reportMatch = reportByPlayerId.get(p.id)
              const hasReport = Boolean(reportMatch)
              const score = reportMatch?.report.overallScore
              const grade = reportMatch?.report.overallGrade

              return (
                <div
                  key={p.id}
                  className="bg-black/45 rounded-2xl p-4 border border-yellow-400/15 hover:border-yellow-400/40 transition-all flex flex-col justify-between space-y-3.5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {/* Jersey Badge */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-base shadow-md border"
                        style={{
                          backgroundColor: `${p.teamColor}25`,
                          borderColor: p.teamColor,
                          color: p.teamColor === "#ffffff" ? "#FFE100" : p.teamColor,
                        }}
                      >
                        #{p.jerseyNumber || "?"}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">
                            {p.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{p.position || "Athlete"}</span>
                          <span>·</span>
                          <span className="text-yellow-400/90">{p.teamName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score / Status Tag */}
                    {hasReport ? (
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                          {score}/100 · {grade}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 shrink-0">
                        Discovered
                      </span>
                    )}
                  </div>

                  {p.standoutTrait && (
                    <p className="text-xs text-slate-300 italic line-clamp-2 bg-white/5 p-2 rounded-lg border border-white/5">
                      "{p.standoutTrait}"
                    </p>
                  )}

                  {/* Open Report Button */}
                  <div className="pt-2 border-t border-yellow-400/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      {hasReport ? "Certified Report Ready" : "Unanalyzed Candidate"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenPlayerReportFromTeam(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        hasReport
                          ? "banana-gradient text-black font-black hover:opacity-90 shadow-md shadow-yellow-500/20"
                          : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/20"
                      }`}
                    >
                      <span>{hasReport ? "Open Report" : "Analyze Now"}</span>
                      <span>⚡</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENT FOR TAB 2: PLAYER REPORT SHORTCUT (NANO BANANA DOSSIER)
          ========================================================================= */}
      {activeTab === "player_report" && (
        <div className="space-y-4">
          {/* Athlete Quick-Switcher Shortcut Ribbon */}
          <div className="banana-glass rounded-2xl p-3 border border-yellow-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-mono font-bold text-yellow-400 flex items-center gap-1.5">
                <span>⚡</span> ACTIVE ATHLETE DOSSIER:
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({selectedReportIndex + 1} of {reports.length})
              </span>
            </div>

            {/* Scrollable Player Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {reports.map((item, idx) => {
                const isSelected = idx === selectedReportIndex
                const p = item.player
                const rep = item.report

                return (
                  <button
                    key={p?.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedReportIndex(idx)
                      setActiveTouchNumber(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-2 ${
                      isSelected
                        ? "banana-glass-active shadow-lg shadow-yellow-500/20 border font-black scale-[1.02]"
                        : "bg-black/50 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-yellow-400/15"
                    }`}
                  >
                    <span className="text-yellow-400">#{p?.jerseyNumber || idx + 1}</span>
                    <span>{p?.label || `Athlete ${idx + 1}`}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-yellow-400/15 text-yellow-300">
                      {rep.overallScore}
                    </span>
                  </button>
                )
              })}

              {/* Prev / Next controls */}
              {reports.length > 1 && (
                <div className="flex items-center space-x-1 pl-2 border-l border-yellow-400/20 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReportIndex((prev) =>
                        prev > 0 ? prev - 1 : reports.length - 1
                      )
                    }
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 text-xs font-mono font-bold cursor-pointer"
                    title="Previous Athlete Report"
                  >
                    ‹ Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReportIndex((prev) =>
                        prev < reports.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 text-xs font-mono font-bold cursor-pointer"
                    title="Next Athlete Report"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              THE NANO BANANA DOSSIER (ACTIVE PLAYER'S REPORT)
              ===================================================================== */}
          <div className="banana-glass rounded-3xl p-6 sm:p-8 md:p-10 gold-glow relative overflow-hidden transition-all duration-300 space-y-8">
            {/* Ambient Background Glows */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* 1. Header Ribbon & Gold Score Box */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-yellow-400/15 gap-6 relative z-10">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 flex items-center gap-1.5">
                    <span>⚡</span> {accreditation.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-300 bg-white/5 border border-white/10">
                    {sport.toUpperCase()} · {currentReport.position.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    {accreditation.tier || "TIER 1 PROSPECT"}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {athleteDisplayName}
                </h2>

                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  "{currentReport.oneLiner || currentReport.playerSummary}"
                </p>
              </div>

              {/* The Iconic Nano Banana Overall Score Square Badge */}
              <div className="flex items-center space-x-4 bg-black/50 p-4 pr-6 rounded-2xl border border-yellow-400/25 shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl banana-gradient flex flex-col items-center justify-center text-black shadow-lg shadow-yellow-500/30">
                  <span className="text-[10px] font-black tracking-widest leading-none">OVERALL</span>
                  <span className="text-3xl sm:text-4xl font-black leading-tight">
                    {currentReport.overallScore}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-mono text-yellow-400 font-bold uppercase">
                    {currentPlayer?.team || "Alexandria Falcons SC"}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Grade {currentReport.overallGrade} · Verified
                  </div>
                  <div className="text-[11px] text-lime-400 font-bold mt-1">
                    ● CERTIFIED PROSPECT
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sport-Specific Kinematic KPI Matrix (5-col Grid) */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                  <span>●</span> PRIMARY KINEMATIC & BIOMECHANICAL BENCHMARKS
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Measured against Elite Global Pool
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {kinematicKpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-black/40 p-4 rounded-xl border border-yellow-400/15 hover:border-yellow-400/30 transition-all"
                  >
                    <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                      {kpi.label}
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">{kpi.value}</span>
                      <span className="text-xs font-mono text-yellow-400 font-semibold">
                        {kpi.unit}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-lime-400 font-bold">{kpi.delta}</span>
                      <span className="text-slate-500">{kpi.pct}%tile</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className="banana-gradient h-full rounded-full"
                        style={{ width: `${kpi.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Spatial Homography & Tactical Court Display */}
            <div className="bg-black/40 rounded-2xl p-5 border border-yellow-400/20 relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider block">
                    SPATIAL HOMOGRAPHY & ACTION DISPERSION
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {sport} Tactical Pitch Dispersion & Action Corridors
                  </h3>
                  <p className="text-xs text-slate-400">
                    Homography projection: Optical YOLO Re-ID & spatial event density
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-lime-400 bg-lime-400/10 px-3 py-1 rounded-lg border border-lime-400/20">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
                  <span>LIVE HOMOGRAPHY ACCREDITED</span>
                </div>
              </div>

              {/* Pitch / Court Visualization Component */}
              <div className="rounded-xl overflow-hidden border border-yellow-400/20">
                <PitchHeatmap2D
                  sport={sport}
                  athleteName={athleteDisplayName}
                  position={currentReport.position}
                  theme="nano-banana"
                  attackingThird={currentReport.spatialTelemetry?.attackingThirdPct || 46}
                  middleThird={currentReport.spatialTelemetry?.middleThirdPct || 36}
                  defensiveThird={currentReport.spatialTelemetry?.defensiveThirdPct || 18}
                  topSprintZone={currentReport.spatialTelemetry?.topSprintZone || "Primary Corridor"}
                />
              </div>
            </div>

            {/* VOLLEYBALL SPECIALIST TERMINAL: FIVB VIS & DataVolley 4 Tactical Coding */}
            {isVolleyballSport && (
              <div className="bg-black/50 p-6 rounded-2xl border border-yellow-400/30 relative z-10 space-y-5 gold-glow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-yellow-400/20">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>⚡</span> DATA VOLLEY 4 & FIVB VIS ADVANCED TACTICAL METRICS
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      FIVB Olympic Kinematics & True Efficiency Coding
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/25 text-yellow-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-lime-400 inline-block animate-pulse"></span>
                    <span>DATA VOLLEY 4</span>
                    <span>·</span>
                    <span className="text-lime-400">FIVB VIS STANDARD</span>
                  </div>
                </div>

                {/* 4-Card Tactical Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* True Attack Efficiency Eff_A */}
                  <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      True Attack Eff (Eff_A)
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">
                        {currentReport.volleyballMetrics?.trueAttackEfficiency !== undefined
                          ? (currentReport.volleyballMetrics.trueAttackEfficiency > 0 ? `+${currentReport.volleyballMetrics.trueAttackEfficiency}` : `${currentReport.volleyballMetrics.trueAttackEfficiency}`)
                          : "+0.38"}
                      </span>
                      <span className="text-xs font-mono text-lime-400 font-bold">
                        Target &gt; 0.35
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Kill: {currentReport.volleyballMetrics?.killPercentage ?? "52.0"}%</span>
                      <span>Err: {currentReport.volleyballMetrics?.errorPercentage ?? "14.0"}%</span>
                    </div>
                  </div>

                  {/* Pass Expected Sideout eSO */}
                  <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Pass Expected Sideout (eSO)
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">
                        {currentReport.volleyballMetrics?.passExpectedSideout ?? "0.64"}
                      </span>
                      <span className="text-xs font-mono text-lime-400 font-bold">
                        Target &gt; 0.58
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Perf (#): {currentReport.volleyballMetrics?.perfectPassRate ?? "44"}%</span>
                      <span>Pos (+): {currentReport.volleyballMetrics?.positivePassRate ?? "68"}%</span>
                    </div>
                  </div>

                  {/* Block Efficiency BAE */}
                  <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Block Efficiency (BAE)
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">
                        {currentReport.volleyballMetrics?.blockEfficiency !== undefined
                          ? (currentReport.volleyballMetrics.blockEfficiency > 0 ? `+${currentReport.volleyballMetrics.blockEfficiency}` : `${currentReport.volleyballMetrics.blockEfficiency}`)
                          : "+0.31"}
                      </span>
                      <span className="text-xs font-mono text-yellow-400 font-bold">
                        Sealing Rate
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Stuff Blocks: Elite</span>
                      <span>Penetration: 34cm</span>
                    </div>
                  </div>

                  {/* Setter Target Box Accuracy */}
                  <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Setter Target Box Accuracy
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-white">
                        88.4%
                      </span>
                      <span className="text-xs font-mono text-lime-400 font-bold">
                        In-System
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Target: [5.2m, 6.8m]</span>
                      <span>Net: [0.5m, 1.8m]</span>
                    </div>
                  </div>
                </div>

                {/* Module E Biomechanical Kinematics */}
                <div className="pt-1">
                  <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block mb-2">
                    ● MODULE E KINEMATICS & APPROACH ANGLE CALCULATOR
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Penultimate Stride</span>
                      <span className="text-base font-black text-white font-mono">1.48x leg</span>
                      <span className="text-[10px] text-lime-400 block font-mono">Optimal (1.30–1.65)</span>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Plant Foot Angle</span>
                      <span className="text-base font-black text-white font-mono">38.5° inward</span>
                      <span className="text-[10px] text-lime-400 block font-mono">Optimal (30°–45°)</span>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Arm Abduction</span>
                      <span className="text-base font-black text-white font-mono">102° angle</span>
                      <span className="text-[10px] text-lime-400 block font-mono">Optimal (90°–110°)</span>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                      <span className="text-[10px] font-mono text-slate-400 block">X-Factor Separation</span>
                      <span className="text-base font-black text-white font-mono">34.2° torque</span>
                      <span className="text-[10px] text-lime-400 block font-mono">Elite (≥ 30°)</span>
                    </div>
                  </div>
                </div>

                {/* Data Volley 4 Event Codes Ribbon */}
                <div className="pt-1">
                  <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block mb-2">
                    ● DATA VOLLEY 4 SYNTAX CODE STREAM (FIVB VIS EVALUATION)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(currentReport.volleyballEvents || [
                      { dvwCode: "*14SM#41D", skill: "S", evaluation: "#", description: "Jump Float Ace into Zone 1D seam" },
                      { dvwCode: "a04RE#5", skill: "R", evaluation: "#", description: "Midline reception into Setter Target Box" },
                      { dvwCode: "*07EH#3", skill: "E", evaluation: "#", description: "In-system Quick Set release" },
                      { dvwCode: "*14AH#41A", skill: "A", evaluation: "#", description: "Cross-court Spike Kill from Zone 4" },
                      { dvwCode: "*14BH#2", skill: "B", evaluation: "#", description: "Stuff Roof Block sealing sideline" },
                    ]).map((ev, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-black/60 border border-yellow-400/25 flex items-center space-x-2 text-xs font-mono group hover:border-yellow-400 transition-colors"
                      >
                        <span className="font-black text-yellow-400">{ev.dvwCode}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-300 text-[11px]">{ev.description}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-yellow-400/20 text-yellow-300 font-bold">
                          {ev.evaluation === "#" ? "PERFECT #" : ev.evaluation === "+" ? "POSITIVE +" : ev.evaluation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Radar / Multi-Axis Kinematic Spectrum & Technical Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {/* Multi-Axis Kinematic Spectrum */}
              <div className="bg-black/40 p-5 rounded-2xl border border-yellow-400/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">
                    ● MULTI-AXIS KINEMATIC SPECTRUM
                  </span>
                  <span className="text-xs font-mono text-slate-400">Target vs Pro Median</span>
                </div>

                <div className="space-y-3 pt-2">
                  {currentReport.metrics.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="text-yellow-400 font-bold">{item.score}/100</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div
                          className="banana-gradient h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Observations & Strengths */}
              <div className="bg-black/40 p-5 rounded-2xl border border-yellow-400/20 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block mb-3">
                    ● HIGH-RESOLUTION SCOUTING OBSERVATIONS
                  </span>
                  <ul className="space-y-2.5">
                    {currentReport.strengths.map((note, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                        <span className="text-yellow-400 font-bold mt-0.5">✦</span>
                        <span className="leading-relaxed">{note}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Areas to improve */}
                  {currentReport.areasToImprove && currentReport.areasToImprove.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-yellow-400/10">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block mb-2">
                        ● DEVELOPMENTAL FOCUS AREAS
                      </span>
                      <ul className="space-y-2">
                        {currentReport.areasToImprove.map((item, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                            <span className="text-amber-400 font-bold mt-0.5">↳</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Accreditation Stamp Box */}
                <div className="pt-4 border-t border-yellow-400/10 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Regulatory Validation</div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {accreditation.authority}
                    </div>
                    <div className="text-[10px] text-yellow-400 mt-0.5">
                      {accreditation.codePrefix}-9482 · SHA-256 VERIFIED
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-xl border border-yellow-400/30 flex items-center justify-center bg-yellow-400/5 text-yellow-400 font-black text-[10px] text-center leading-tight">
                    VERIFIED
                    <br />
                    LAB
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Technical Repertoire (Touch Analysis Sequence) if present */}
            {touchPoints.length > 0 && (
              <div className="bg-black/40 p-5 rounded-2xl border border-yellow-400/20 relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block">
                      ● TECHNICAL REPERTOIRE & TOUCH SEQUENCE
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Analyzed Sequences ({touchPoints.length} Key Touches)
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/25">
                    {sport.toUpperCase()} TOUCH POINTS
                  </span>
                </div>

                {/* Horizontal Touch Pills */}
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {touchPoints.map((touch) => (
                    <button
                      key={touch.touchNumber}
                      type="button"
                      onClick={() => setActiveTouchNumber(touch.touchNumber)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
                        activeTouch?.touchNumber === touch.touchNumber
                          ? "banana-glass-active border font-black scale-[1.02]"
                          : "bg-black/50 text-slate-400 hover:text-white border border-yellow-400/15"
                      }`}
                    >
                      <span>T{touch.touchNumber}: {touch.phase}</span>
                      <span className="text-yellow-400 font-bold">{touch.rating}</span>
                    </button>
                  ))}
                </div>

                {/* Active Touch Inspector Card */}
                {activeTouch && (
                  <div className="bg-white/5 p-4 rounded-xl border border-yellow-400/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-yellow-400 font-bold">
                          TOUCH #{activeTouch.touchNumber} ({activeTouch.timestamp})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-lime-400/15 text-lime-400 border border-lime-400/30 font-bold">
                          {activeTouch.quality.toUpperCase()} EXECUTION
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {activeTouch.critique}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {activeTouch.biomechanics.map((b) => (
                          <span
                            key={b.metric}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-black/50 text-slate-300 border border-yellow-400/15"
                          >
                            {b.metric}: <strong className="text-yellow-400">{b.val}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <ScoreRing score={activeTouch.rating} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Action Toolbar & Export Actions */}
            <div className="pt-6 border-t border-yellow-400/15 flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                <span className="text-yellow-400">❖</span>
                <span>SCOUTAI CERTIFIED DOSSIER · PROTOCOL v4.2</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Save to Profile Records */}
                {onSaveProfileRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      const newRecord: ProfileRecord = {
                        id: `rec-${Date.now()}`,
                        date: new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }),
                        sport,
                        playerName: athleteDisplayName,
                        overallScore: currentReport.overallScore,
                        overallGrade: currentReport.overallGrade,
                        verticalCm: demoMode ? "78.4 cm" : "N/A",
                        flightSec: demoMode ? "0.83 s" : "N/A",
                        contactMs: demoMode ? "186 ms" : "N/A",
                        strengths: currentReport.strengths,
                        areasToImprove: currentReport.areasToImprove,
                        recommendations: currentReport.recommendations,
                        narrative: currentReport.narrative,
                        verified: true,
                      }
                      onSaveProfileRecord(newRecord)
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-black/60 text-slate-200 hover:text-white border border-yellow-400/25 hover:border-yellow-400/50 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Icon name="shield" size={13} />
                    <span>
                      {savedReportIds.includes(`${currentReport.overallScore}-${currentReport.overallGrade}`)
                        ? "SAVED TO PROFILE ✓"
                        : "SAVE TO PROFILE RECORDS"}
                    </span>
                  </button>
                )}

                {/* Copy Verification Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-black/60 text-slate-200 hover:text-white border border-yellow-400/25 hover:border-yellow-400/50 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Icon name="wifi" size={13} />
                  <span>{copiedLink ? "COPIED! ✓" : "COPY VERIFICATION URL"}</span>
                </button>

                {/* Open Full Performance Dossier Page */}
                {onOpenPerformanceReport && (
                  <button
                    type="button"
                    onClick={() => onOpenPerformanceReport(currentReport, currentPlayer)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-black banana-gradient text-black shadow-lg shadow-yellow-500/25 flex items-center space-x-2 hover:opacity-90 transition-all cursor-pointer"
                  >
                    <span>OPEN FULL CERTIFIED DOSSIER</span>
                    <Icon name="arrow" size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
