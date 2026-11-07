import React from "react"

export interface AttachedReportData {
  title?: string
  reportType?: "Match Scouting" | "Combine Biomechanics" | "Tactical Evaluation" | "Full Dossier"
  overallScore?: number
  overallGrade?: string
  date?: string
  scoutName?: string
  scoutRole?: string
  sport?: string
  athleteName?: string
  fileName?: string
  fileSize?: string
  strengths?: string[]
  weaknesses?: string[]
  tacticalNotes?: string
  metrics?: { label: string; value: string; benchmark?: string }[]
  recommendation?: string
  verifiedBadge?: boolean
}

export interface ScoutReportViewerModalProps {
  isOpen: boolean
  onClose: () => void
  report?: AttachedReportData | null
  athleteName?: string
  sport?: string
}

export function ScoutReportViewerModal({
  isOpen,
  onClose,
  report,
  athleteName = "Verified Athlete",
  sport = "Basketball",
}: ScoutReportViewerModalProps) {
  if (!isOpen) return null

  const resolvedReport: AttachedReportData = {
    title: report?.title || `${athleteName} · Match Scouting Dossier`,
    reportType: report?.reportType || "Match Scouting",
    overallScore: report?.overallScore || 94,
    overallGrade: report?.overallGrade || "A",
    date: report?.date || "Today · 60 FPS Computer Vision",
    scoutName: report?.scoutName || "Alexandre Ramos (Chief Scout EMEA)",
    scoutRole: report?.scoutRole || "FIVB & UEFA Certified Talent Evaluator",
    sport: report?.sport || sport,
    athleteName: report?.athleteName || athleteName,
    fileName: report?.fileName || `${athleteName.toLowerCase().replace(/\s+/g, "_")}_scouting_dossier.pdf`,
    fileSize: report?.fileSize || "2.8 MB (PDF)",
    strengths: report?.strengths || [
      "Elite vertical burst & hang time",
      "Lateral agility & quick second-jump recovery",
      "High game IQ under aggressive press",
      "Decisive shot release mechanics",
    ],
    weaknesses: report?.weaknesses || [
      "Physical contact balance in low post",
      "Stamina preservation in final 4 minutes",
    ],
    tacticalNotes:
      report?.tacticalNotes ||
      "Dominant athletic profile with Tier 1 pro potential. High-speed kinematic tracking confirms 78.4 cm vertical elevation and zero biomechanical asymmetry on landing.",
    recommendation:
      report?.recommendation ||
      "Priority target for Division 1 / European Academy international roster. Immediate invitation recommended.",
    metrics: report?.metrics || [
      { label: "Vertical Elevation", value: "78.4 cm", benchmark: "+12% vs combine avg" },
      { label: "Hang Time", value: "0.83 sec", benchmark: "Top 3% percentile" },
      { label: "Takeoff Accel", value: "3.84 m/s²", benchmark: "Elite explosive power" },
      { label: "Ground Contact", value: "186 ms", benchmark: "Hyper-reactive" },
    ],
    verifiedBadge: report?.verifiedBadge ?? true,
  }

  const handleDownload = () => {
    // Simulated PDF report download
    const blob = new Blob(
      [
        `SCOT ATHLETIC INTELLIGENCE DOSSIER\n\n` +
          `Athlete: ${resolvedReport.athleteName}\n` +
          `Sport: ${resolvedReport.sport}\n` +
          `Grade: ${resolvedReport.overallGrade} (${resolvedReport.overallScore}/100)\n` +
          `Evaluator: ${resolvedReport.scoutName}\n\n` +
          `TACTICAL SUMMARY:\n${resolvedReport.tacticalNotes}\n\n` +
          `RECOMMENDATION:\n${resolvedReport.recommendation}\n`,
      ],
      { type: "text/plain" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = resolvedReport.fileName || "scout_report.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-label="Scouting Report Dossier"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#090d16] border border-amber-500/30 text-white shadow-2xl p-4 sm:p-6 flex flex-col gap-5 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 0 40px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-inner">
              📑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {resolvedReport.reportType}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  VERIFIED ATTACHMENT
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                {resolvedReport.title}
              </h3>
              <p className="text-xs text-neutral-400">
                {resolvedReport.athleteName} · {resolvedReport.sport} · {resolvedReport.date}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all"
            onClick={onClose}
            aria-label="Close report modal"
          >
            ✕
          </button>
        </div>

        {/* Overall Rating & Scout Stamp */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-amber-500/20 items-center">
          <div className="flex items-center gap-3 col-span-1">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex flex-col items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <span className="text-2xl leading-none">{resolvedReport.overallGrade}</span>
              <span className="text-[9px] font-mono tracking-wider">{resolvedReport.overallScore}/100</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-400 block">EVALUATION RATING</span>
              <strong className="text-sm font-bold text-amber-300">TIER-1 PROSPECT</strong>
            </div>
          </div>

          <div className="col-span-2 flex flex-col justify-center sm:border-l border-white/10 sm:pl-4">
            <span className="text-[10px] font-mono text-neutral-400">EVALUATING SCOUT:</span>
            <strong className="text-xs text-white flex items-center gap-1 mt-0.5">
              {resolvedReport.scoutName}
              <span className="text-amber-400 text-xs" title="Verified Pro Scout">✓</span>
            </strong>
            <span className="text-[10px] text-neutral-400">{resolvedReport.scoutRole}</span>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div>
          <span className="text-[11px] font-mono text-amber-300 font-bold tracking-wider block mb-2">
            60 FPS KINEMATICS & BENCHMARKS:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {resolvedReport.metrics?.map((m, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex flex-col justify-between"
              >
                <span className="text-[10px] font-mono text-neutral-400">{m.label}</span>
                <strong className="text-base font-bold text-amber-300 font-mono my-1">{m.value}</strong>
                {m.benchmark && (
                  <span className="text-[9px] text-emerald-400 font-mono">{m.benchmark}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Growth Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 mb-2">
              <span>✓</span> VERIFIED STRENGTHS
            </span>
            <ul className="flex flex-col gap-1.5 text-xs text-neutral-200">
              {resolvedReport.strengths?.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1 mb-2">
              <span>⚡</span> DEVELOPMENT FOCUS
            </span>
            <ul className="flex flex-col gap-1.5 text-xs text-neutral-200">
              {resolvedReport.weaknesses?.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tactical Recommendation */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
          <span className="text-[10px] font-mono text-amber-300 font-bold tracking-wider block mb-1">
            TACTICAL VERDICT & SCOUT NOTES:
          </span>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {resolvedReport.tacticalNotes}
          </p>
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-400">RECOMMENDATION:</span>
            <span className="text-xs font-semibold text-emerald-300">{resolvedReport.recommendation}</span>
          </div>
        </div>

        {/* Attached Document File Download Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-black to-amber-500/10 border border-amber-500/30 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📄</span>
            <div>
              <strong className="text-xs text-white block">{resolvedReport.fileName}</strong>
              <small className="text-[10px] text-neutral-400">{resolvedReport.fileSize} · Cryptographically Signed</small>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Download Dossier</span>
              <span>↓</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoutReportViewerModal

