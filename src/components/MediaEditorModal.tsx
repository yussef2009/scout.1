import React, { useState, useRef } from "react"
import { type AttachedReportData } from "./ScoutReportViewerModal"
import { calculateGrade } from "./NewsBulletinCard"

export interface MediaEditorPublishData {
  content: string
  sport: string
  postType: "reel" | "dispatch" | "news"
  mediaUrl: string
  videoUrl?: string
  aspectRatio: "9:16" | "1:1" | "4:5" | "16:9"
  filterName: string
  filterCss: string
  audioTrack: string
  isAudioMuted: boolean
  trimRange: { start: number; end: number }
  overlays: {
    showBoundingBox: boolean
    showRadarGrade: boolean
    showSpeedMetric: boolean
    showPlayerTag: boolean
  }
  rating: number
  ratingGrade: string
  hasReport: boolean
  reportData?: AttachedReportData
  newsHeadline?: string
  newsCategory?: string
}

export interface MediaEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (data: MediaEditorPublishData) => void
  currentUserName?: string
  currentUserRole?: string
  defaultSport?: string
  sports?: string[]
}

export const PRESET_CLIPS = [
  {
    id: "clip-vert-1",
    label: "Vertical Takeoff (78.4 cm)",
    sport: "Basketball",
    aspect: "9:16",
    url: "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80",
    duration: 30,
  },
  {
    id: "clip-sprint-2",
    label: "Acceleration Sprint (34.2 km/h)",
    sport: "Soccer",
    aspect: "9:16",
    url: "https://images.unsplash.com/photo-1762025753986-b6227fe6debb?auto=format&fit=crop&w=800&q=80",
    duration: 25,
  },
  {
    id: "clip-spike-3",
    label: "Volleyball Spike Elevation",
    sport: "Volleyball",
    aspect: "9:16",
    url: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&q=80",
    duration: 20,
  },
  {
    id: "clip-match-4",
    label: "Youth Championship Keyframe",
    sport: "Soccer",
    aspect: "16:9",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    duration: 40,
  },
]

export const FILTER_PRESETS = [
  { name: "Normal", css: "none" },
  { name: "Cyber Gold", css: "sepia(0.25) contrast(1.15) brightness(1.05) saturate(1.2)" },
  { name: "Neon Pitch", css: "contrast(1.25) saturate(1.4) hue-rotate(15deg)" },
  { name: "Matrix Scout", css: "contrast(1.3) hue-rotate(85deg) saturate(1.35)" },
  { name: "Monochrome Pro", css: "grayscale(1) contrast(1.3) brightness(0.95)" },
  { name: "HDR Cinematic", css: "contrast(1.2) brightness(1.08) saturate(1.25)" },
]

export const AUDIO_TRACKS = [
  "Original Audio (Live mic)",
  "Cyber Trap Drill (140 BPM)",
  "Stadium Roar & Whistle",
  "High-Tempo Kinetic Beat",
  "Scout Commentary Track",
]

export function MediaEditorModal({
  isOpen,
  onClose,
  onPublish,
  currentUserName = "Verified Athlete",
  currentUserRole = "Player",
  defaultSport = "Basketball",
  sports = ["Basketball", "Soccer", "Volleyball", "Tennis", "Track & Field"],
}: MediaEditorModalProps) {
  const [selectedSport, setSelectedSport] = useState(defaultSport)
  const [postType, setPostType] = useState<"reel" | "dispatch" | "news">("reel")
  const [mediaUrl, setMediaUrl] = useState(PRESET_CLIPS[0].url)
  const [caption, setCaption] = useState("")
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "4:5" | "16:9">("9:16")
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(1) // Cyber Gold default
  const [selectedAudio, setSelectedAudio] = useState(AUDIO_TRACKS[0])
  const [isMuted, setIsMuted] = useState(false)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(25)
  const [rating, setRating] = useState(94)

  // HUD Overlays
  const [showBoundingBox, setShowBoundingBox] = useState(true)
  const [showRadarGrade, setShowRadarGrade] = useState(true)
  const [showSpeedMetric, setShowSpeedMetric] = useState(true)
  const [showPlayerTag, setShowPlayerTag] = useState(true)

  // Optional Report State
  const [attachReport, setAttachReport] = useState(false)
  const [reportFileName, setReportFileName] = useState("scout_assessment_u19.pdf")
  const [reportTacticalNotes, setReportTacticalNotes] = useState(
    "Verified kinematic takeoff at 60 FPS. Strong hip hinge mechanics with zero valgus collapse on landing.",
  )
  const [reportStrengths, setReportStrengths] = useState(
    "Explosive first step, High vertical hang time, Press resilience",
  )
  const [reportWeaknesses, setReportWeaknesses] = useState(
    "Low post contact balance, Aerobic stamina preservation in 4th quarter",
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const reportFileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setMediaUrl(objectUrl)
    }
  }

  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReportFileName(file.name)
      setAttachReport(true)
    }
  }

  const handleConfirmPublish = () => {
    if (!caption.trim() && !mediaUrl) return

    const currentFilter = FILTER_PRESETS[selectedFilterIndex]
    const grade = calculateGrade(rating)

    let reportData: AttachedReportData | undefined = undefined
    if (attachReport) {
      reportData = {
        title: `${currentUserName} · ${selectedSport} Scouting Dossier`,
        reportType: "Match Scouting",
        overallScore: rating,
        overallGrade: grade,
        athleteName: currentUserName,
        sport: selectedSport,
        fileName: reportFileName,
        fileSize: "2.4 MB (PDF)",
        tacticalNotes: reportTacticalNotes,
        strengths: reportStrengths.split(",").map((s) => s.trim()).filter(Boolean),
        weaknesses: reportWeaknesses.split(",").map((w) => w.trim()).filter(Boolean),
        recommendation: "Tier 1 Academy ready prospect with verified biomechanical potential.",
        verifiedBadge: true,
      }
    }

    onPublish({
      content: caption.trim() || `Verified ${selectedSport} highlight reel with 60 FPS kinematics analysis.`,
      sport: selectedSport,
      postType: postType,
      mediaUrl,
      videoUrl: postType === "reel" ? mediaUrl : undefined,
      aspectRatio,
      filterName: currentFilter.name,
      filterCss: currentFilter.css,
      audioTrack: selectedAudio,
      isAudioMuted: isMuted,
      trimRange: { start: trimStart, end: trimEnd },
      overlays: {
        showBoundingBox,
        showRadarGrade,
        showSpeedMetric,
        showPlayerTag,
      },
      rating,
      ratingGrade: grade,
      hasReport: attachReport,
      reportData,
    })

    onClose()
  }

  const currentFilter = FILTER_PRESETS[selectedFilterIndex]
  const currentGrade = calculateGrade(rating)

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-fadeIn overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-label="Highlight Reel Media Editor"
    >
      <div
        className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[96vh] sm:rounded-3xl bg-[#03060c] border border-amber-500/30 text-white shadow-2xl flex flex-col overflow-hidden no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 0 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* =========================================================
            INSTAGRAM TOP HEADER BAR
            ========================================================= */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/10 bg-black/80 backdrop-blur-md z-30 shrink-0">
          {/* Left: Close Button + Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white text-base transition-all cursor-pointer"
              onClick={onClose}
              aria-label="Close media editor"
              title="Close editor"
            >
              ✕
            </button>
            <div className="flex flex-col">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                <span className="text-amber-400">⚡</span>
                <span>HIGHLIGHT REEL & POST MEDIA EDITOR</span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                Instagram-Style 9:16 Creator Studio · 60 FPS Biomechanics
              </span>
            </div>
          </div>

          {/* Center: Format Switcher (Reel / Post / News) */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {(["reel", "dispatch", "news"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPostType(t)
                  if (t === "reel") setAspectRatio("9:16")
                  if (t === "news") setAspectRatio("16:9")
                }}
                className={`px-3 py-1 text-[11px] font-mono font-bold rounded-full transition-all cursor-pointer ${
                  postType === t
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-sm shadow-amber-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {t === "reel" ? "REEL" : t === "dispatch" ? "POST" : "NEWS"}
              </button>
            ))}
          </div>

          {/* Right: Instagram Publish CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmPublish}
              className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-black text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer"
              aria-label="PUBLISH HIGHLIGHT REEL"
            >
              <span>PUBLISH {postType === "reel" ? "HIGHLIGHT REEL" : "POST"}</span>
              <span className="text-sm leading-none font-bold">→</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            EDITOR WORKSPACE: SPLIT GRID WITH INSTAGRAM VISUALS
            ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto no-scrollbar">
          {/* LEFT: Instagram Phone Screen & Filters (5 cols on lg) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#020408] via-[#070b14] to-[#020408] p-3 sm:p-5 flex flex-col items-center justify-between gap-3 border-b lg:border-b-0 lg:border-r border-white/10">
            {/* Phone Screen Canvas Frame */}
            <div
              className={`relative overflow-hidden rounded-2xl bg-black border border-amber-500/40 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                aspectRatio === "9:16"
                  ? "w-[210px] sm:w-[250px] h-[373px] sm:h-[444px]"
                  : aspectRatio === "1:1"
                    ? "w-[230px] sm:w-[290px] h-[230px] sm:h-[290px]"
                    : aspectRatio === "4:5"
                      ? "w-[220px] sm:w-[260px] h-[275px] sm:h-[325px]"
                      : "w-full max-w-[360px] h-[202px]"
              }`}
              style={{
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(251, 191, 36, 0.2)",
              }}
            >
              {/* Media with Active Filter */}
              <img
                src={mediaUrl}
                alt="Highlight preview"
                className="w-full h-full object-cover transition-all duration-200 select-none"
                style={{ filter: currentFilter.css }}
              />

              {/* Instagram Subtle Vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 pointer-events-none" />

              {/* Top Canvas Bar (Aspect & Filter Name) */}
              <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/70 border border-white/20 backdrop-blur-md text-amber-300">
                  {aspectRatio} · FX ACTIVE
                </span>
                {attachReport && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-500/60 backdrop-blur-md text-amber-300 flex items-center gap-1">
                    <span>📑</span>
                    <span>Report Attached</span>
                  </span>
                )}
              </div>

              {/* YOLOv11 Computer Vision Bounding Box Reticle */}
              {showBoundingBox && (
                <div
                  className="absolute inset-[15%] border-2 border-amber-400/90 rounded pointer-events-none z-10 animate-pulse"
                  style={{
                    boxShadow: "0 0 18px rgba(251, 191, 36, 0.45), inset 0 0 12px rgba(251, 191, 36, 0.2)",
                  }}
                >
                  <span className="absolute -top-5 left-0 text-[9px] font-mono font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded-sm">
                    YOLOv11: {currentUserName} [99.4%]
                  </span>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
                </div>
              )}

              {/* Radar Grade Stamp */}
              {showRadarGrade && (
                <div className="absolute top-9 right-2.5 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/85 border border-amber-500/50 backdrop-blur-md pointer-events-none shadow-lg">
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    SCOT {rating}/100
                  </span>
                  <span className="text-[10px] font-mono font-black px-1.5 py-0.2 bg-amber-400 text-black rounded">
                    {currentGrade}
                  </span>
                </div>
              )}

              {/* Top Speed Metric Stamp */}
              {showSpeedMetric && (
                <div className="absolute top-9 left-2.5 z-20 px-2 py-1 rounded-lg bg-black/85 border border-emerald-500/50 backdrop-blur-md text-[10px] font-mono text-emerald-400 font-bold pointer-events-none shadow-lg">
                  ⚡ 33.8 KM/H PEAK
                </div>
              )}

              {/* Bottom Canvas Overlay: Athlete & Audio */}
              <div className="absolute bottom-2.5 inset-x-2.5 z-20 flex flex-col gap-1.5 pointer-events-none">
                {showPlayerTag && (
                  <div className="flex items-center gap-1.5 bg-black/75 px-2.5 py-1 rounded-full backdrop-blur-md self-start border border-white/15">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-white">{currentUserName}</span>
                    <span className="text-[9px] font-mono text-amber-300">#{selectedSport}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-200 bg-black/70 px-2.5 py-0.5 rounded-full backdrop-blur-md self-start border border-white/10">
                  <span>♫</span>
                  <span className="truncate max-w-[160px]">{selectedAudio}</span>
                  {isMuted && <span className="text-red-400 font-bold">[MUTED]</span>}
                </div>
              </div>
            </div>

            {/* Instagram Horizontal Filter Carousel */}
            <div className="w-full flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] font-mono text-neutral-400 self-start">
                COLOR GRADING / FILTERS:
              </span>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar w-full">
                {FILTER_PRESETS.map((f, idx) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setSelectedFilterIndex(idx)}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                  >
                    <div
                      className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                        selectedFilterIndex === idx
                          ? "border-amber-400 scale-105 ring-2 ring-amber-400/40 shadow-md shadow-amber-400/25"
                          : "border-white/20 hover:border-white/50 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={mediaUrl}
                        alt={f.name}
                        className="w-full h-full object-cover rounded-full"
                        style={{ filter: f.css }}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-mono whitespace-nowrap transition-colors ${
                        selectedFilterIndex === idx
                          ? "text-amber-300 font-bold"
                          : "text-neutral-400 group-hover:text-white"
                      }`}
                    >
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Controls & Instagram Creation Tools (7 cols on lg) */}
          <div className="lg:col-span-7 p-3 sm:p-5 flex flex-col gap-4 bg-[#050810]">
            {/* Aspect Ratio Options */}
            <div>
              <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                ASPECT RATIO (INSTAGRAM FORMATS):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { ratio: "9:16", label: "9:16 Reel" },
                    { ratio: "1:1", label: "1:1 Square" },
                    { ratio: "4:5", label: "4:5 Portrait" },
                    { ratio: "16:9", label: "16:9 Wide" },
                  ] as const
                ).map(({ ratio, label }) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer text-center ${
                      aspectRatio === ratio
                        ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/25 font-black"
                        : "bg-black/50 text-neutral-300 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Footage Carousel + Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-neutral-400 font-bold">
                  FOOTAGE CLIP SOURCE:
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-mono text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  + UPLOAD FROM DEVICE
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_CLIPS.map((clip) => (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => {
                      setMediaUrl(clip.url)
                      setSelectedSport(clip.sport)
                      if (clip.aspect === "9:16") setAspectRatio("9:16")
                    }}
                    className={`p-1.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      mediaUrl === clip.url
                        ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/30"
                        : "border-white/10 bg-black/50 hover:border-white/25"
                    }`}
                  >
                    <img
                      src={clip.url}
                      alt={clip.label}
                      className="w-full h-12 object-cover rounded-lg"
                    />
                    <span className="text-[10px] font-bold text-white truncate block">
                      {clip.label}
                    </span>
                    <span className="text-[8px] font-mono text-amber-300">{clip.sport}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filmstrip Timeline Trimmer */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>FILMSTRIP TIMELINE TRIMMER (START / END)</span>
                <span className="text-amber-300 font-bold">
                  DURATION: {Math.max(1, trimEnd - trimStart)}s
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold">{trimStart}s</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trimEnd - 1)}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  className="flex-1 accent-amber-400 cursor-pointer"
                  title="Trim Start"
                />
                <input
                  type="range"
                  min={trimStart + 1}
                  max={45}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  className="flex-1 accent-amber-400 cursor-pointer"
                  title="Trim End"
                />
                <span className="text-[10px] font-mono font-bold">{trimEnd}s</span>
              </div>
            </div>

            {/* Audio Track & Mute */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  SOUNDTRACK / AUDIO:
                </label>
                <select
                  value={selectedAudio}
                  onChange={(e) => setSelectedAudio(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                >
                  {AUDIO_TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isMuted
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  <span>{isMuted ? "🔇 ORIGINAL SOUND MUTED" : "🔊 SOUND ACTIVE"}</span>
                </button>
              </div>
            </div>

            {/* Overlays & Vision Stickers */}
            <div>
              <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                COMPUTER VISION & KINEMATICS OVERLAYS:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "YOLOv11 Reticle", state: showBoundingBox, setter: setShowBoundingBox },
                  { label: "Radar Grade Stamp", state: showRadarGrade, setter: setShowRadarGrade },
                  { label: "Peak Speed Pill", state: showSpeedMetric, setter: setShowSpeedMetric },
                  { label: "Athlete Tag", state: showPlayerTag, setter: setShowPlayerTag },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center justify-between ${
                      item.state
                        ? "bg-amber-400/20 text-amber-300 border-amber-400"
                        : "bg-black/40 text-neutral-500 border-white/10"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span>{item.state ? "✓" : "✕"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SCOT AI Rating Score */}
            <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/25">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-neutral-400">SCOT AI RATING SCORE:</span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {rating}/100 (GRADE {currentGrade})
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* OPTIONAL SCOUT REPORT ATTACHMENT */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-black/50 to-black border border-amber-500/30 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachReport}
                    onChange={(e) => setAttachReport(e.target.checked)}
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>📑</span>
                    <span>ATTACH SCOUTING / MATCH REPORT (OPTIONAL)</span>
                  </span>
                </label>

                {attachReport && (
                  <button
                    type="button"
                    onClick={() => reportFileInputRef.current?.click()}
                    className="text-[10px] font-mono text-amber-300 hover:text-white underline cursor-pointer"
                  >
                    Upload Custom PDF
                  </button>
                )}
                <input
                  ref={reportFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleReportUpload}
                  className="hidden"
                />
              </div>

              {attachReport && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="font-mono text-neutral-400">Attached File:</span>
                    <strong className="text-amber-300 font-mono">{reportFileName}</strong>
                  </div>

                  <input
                    type="text"
                    value={reportStrengths}
                    onChange={(e) => setReportStrengths(e.target.value)}
                    placeholder="Key Strengths (comma separated)..."
                    className="bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />

                  <textarea
                    rows={2}
                    value={reportTacticalNotes}
                    onChange={(e) => setReportTacticalNotes(e.target.value)}
                    placeholder="Tactical verdict and match observations..."
                    className="bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono text-neutral-400">
                  CAPTION & HASHTAGS:
                </label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="bg-black/70 border border-white/15 rounded px-2 py-0.5 text-[10px] text-amber-300"
                >
                  {sports.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe the play, match context, key takeaways or hashtags #ScotAI #Combine..."
                className="w-full bg-black/70 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none font-sans"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaEditorModal
