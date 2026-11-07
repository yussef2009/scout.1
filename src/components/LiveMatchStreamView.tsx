import React, { useState, useEffect } from "react"
import { Icon } from "../App"

export interface LiveAnalysisEvent {
  id: string
  minute: string
  player: string
  team: string
  eventType: "goal" | "key-pass" | "recovery" | "sprint" | "tackle" | "save"
  impact: string
  ratingChange: number
  note: string
  scoutName: string
}

export interface LiveMatchStreamViewProps {
  onClose?: () => void
  currentUserName?: string
  currentUserRole?: string
  defaultSport?: string
}

const INITIAL_EVENTS: LiveAnalysisEvent[] = [
  {
    id: "evt-1",
    minute: "67'",
    player: "Marcus Vance",
    team: "Ajax U19",
    eventType: "sprint",
    impact: "+0.4 Rating",
    ratingChange: 0.4,
    note: "Explosive counter-pressing burst (33.8 km/h). Won second ball in transition.",
    scoutName: "Alexandre Ramos (UEFA Pro)",
  },
  {
    id: "evt-2",
    minute: "62'",
    player: "Ziad El-Sayed",
    team: "Benfica U19",
    eventType: "key-pass",
    impact: "+0.6 Rating",
    ratingChange: 0.6,
    note: "Pinpoint diagonal through ball cutting open backline into the half-space.",
    scoutName: "Scout Network EMEA",
  },
  {
    id: "evt-3",
    minute: "49'",
    player: "Lucas Silva",
    team: "Ajax U19",
    eventType: "goal",
    impact: "+1.2 Rating",
    ratingChange: 1.2,
    note: "Clinical near-post volley off cross. Reaction time clocked at 184ms.",
    scoutName: "Coach Henderson",
  },
]

export function LiveMatchStreamView({
  onClose,
  currentUserName = "Verified Scout",
  currentUserRole = "Scout",
  defaultSport = "Soccer",
}: LiveMatchStreamViewProps) {
  const [matchMinutes, setMatchMinutes] = useState(68)
  const [matchSeconds, setMatchSeconds] = useState(42)
  const [homeScore, setHomeScore] = useState(2)
  const [awayScore, setAwayScore] = useState(1)
  const [viewerCount, setViewerCount] = useState(1428)
  const [events, setEvents] = useState<LiveAnalysisEvent[]>(INITIAL_EVENTS)

  // Add Live Analysis form state
  const [showAddAnalysis, setShowAddAnalysis] = useState(false)
  const [analysisPlayer, setAnalysisPlayer] = useState("Marcus Vance")
  const [analysisType, setAnalysisType] = useState<LiveAnalysisEvent["eventType"]>("key-pass")
  const [analysisNote, setAnalysisNote] = useState("")
  const [analysisImpact, setAnalysisImpact] = useState<number>(0.5)

  // Live Chat state
  const [chatMessages, setChatMessages] = useState<{ id: string; user: string; role: string; text: string; time: string }[]>([
    { id: "m-1", user: "Scout EMEA", role: "Scout", text: "Marcus Vance's acceleration curve is out of this world today.", time: "66'" },
    { id: "m-2", user: "Real Betis Youth", role: "Club", text: "Look at the recovery speed after losing possession.", time: "67'" },
  ])
  const [chatDraft, setChatDraft] = useState("")

  // Dynamic live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setMatchSeconds((prev) => {
        if (prev >= 59) {
          setMatchMinutes((m) => m + 1)
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!analysisNote.trim()) return

    const newEvent: LiveAnalysisEvent = {
      id: `evt-${Date.now()}`,
      minute: `${matchMinutes}'`,
      player: analysisPlayer,
      team: analysisPlayer === "Ziad El-Sayed" ? "Benfica U19" : "Ajax U19",
      eventType: analysisType,
      impact: `+${analysisImpact.toFixed(1)} Rating`,
      ratingChange: analysisImpact,
      note: analysisNote.trim(),
      scoutName: `${currentUserName} (${currentUserRole})`,
    }

    setEvents([newEvent, ...events])
    setAnalysisNote("")
    setShowAddAnalysis(false)

    // Also inject into live scout chat
    setChatMessages((prev) => [
      {
        id: `chat-${Date.now()}`,
        user: currentUserName,
        role: currentUserRole,
        text: `[ANALYSIS LOG] ${analysisPlayer} - ${analysisType.toUpperCase()}: ${analysisNote.trim()}`,
        time: `${matchMinutes}'`,
      },
      ...prev,
    ])
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatDraft.trim()) return
    setChatMessages([
      {
        id: `chat-${Date.now()}`,
        user: currentUserName,
        role: currentUserRole,
        text: chatDraft.trim(),
        time: `${matchMinutes}'`,
      },
      ...chatMessages,
    ])
    setChatDraft("")
  }

  const eventTypeIcons: Record<LiveAnalysisEvent["eventType"], { icon: string; color: string; label: string }> = {
    goal: { icon: "⚽", color: "text-amber-400 border-amber-400/40 bg-amber-500/10", label: "GOAL" },
    "key-pass": { icon: "🎯", color: "text-emerald-400 border-emerald-400/40 bg-emerald-500/10", label: "KEY PASS" },
    recovery: { icon: "🛡️", color: "text-blue-400 border-blue-400/40 bg-blue-500/10", label: "BALL RECOVERY" },
    sprint: { icon: "⚡", color: "text-yellow-400 border-yellow-400/40 bg-yellow-500/10", label: "EXPLOSIVE SPRINT" },
    tackle: { icon: "🛑", color: "text-purple-400 border-purple-400/40 bg-purple-500/10", label: "TACTICAL TACKLE" },
    save: { icon: "🧤", color: "text-cyan-400 border-cyan-400/40 bg-cyan-500/10", label: "KEY SAVE" },
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn text-white max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d18] via-[#0e1628] to-[#090d18] border border-amber-500/30 p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 text-2xl animate-pulse shadow-lg shadow-red-500/20">
              🔴
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-red-600 text-white font-black animate-pulse">
                  LIVE SCOUTING BROADCAST
                </span>
                <span className="text-[11px] font-mono text-amber-300">
                  {viewerCount.toLocaleString()} SCOUTS & AGENTS ONLINE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                YOUTH CHAMPIONS LEAGUE: AJAX U19 vs BENFICA U19
              </h2>
              <p className="text-xs text-neutral-400">
                Live 60 FPS Computer Vision tracking, tactical heatmaps, and crowd-sourced live match analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddAnalysis(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
            >
              <span>+ ADD LIVE MATCH ANALYSIS</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white text-lg transition-all cursor-pointer"
                aria-label="Close live stream"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Live Scoreboard Strip */}
        <div className="mt-5 p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-xs font-bold">
                AJX
              </span>
              <strong className="text-sm font-bold">Ajax U19</strong>
            </div>
            <div className="px-3 py-1 rounded-lg bg-black border border-amber-500/40 text-lg font-mono font-black text-amber-300 tracking-wider">
              {homeScore} - {awayScore}
            </div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold">Benfica U19</strong>
              <span className="w-8 h-8 rounded-full bg-red-800/30 border border-red-700 flex items-center justify-center text-xs font-bold">
                SLB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-amber-300">
              <span>⏱️</span>
              <span className="font-bold text-sm">
                {String(matchMinutes).padStart(2, "0")}:{String(matchSeconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-neutral-400">(2ND HALF)</span>
            </div>
            <div className="text-neutral-400">
              PITCH: <span className="text-emerald-400">OPTIMAL (18°C)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Video Stream (8 cols) + Analysis & Chat Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Video Feed with Interactive Tactical Reticles */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-amber-500/30 shadow-2xl flex items-center justify-center">
            {/* Live Video Canvas Image */}
            <img
              src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=80"
              alt="Live match camera broadcast"
              className="w-full h-full object-cover opacity-90"
            />

            {/* Simulated Live Tactical Bounding Boxes */}
            <div
              className="absolute top-[35%] left-[45%] w-[80px] h-[130px] border-2 border-emerald-400/90 rounded pointer-events-none animate-pulse"
              style={{ boxShadow: "0 0 15px rgba(52, 211, 153, 0.4)" }}
            >
              <span className="absolute -top-5 left-0 text-[9px] font-mono font-bold bg-emerald-500 text-black px-1 rounded whitespace-nowrap">
                #10 M. Vance [33.8 km/h]
              </span>
            </div>

            <div
              className="absolute top-[40%] right-[30%] w-[75px] h-[120px] border-2 border-amber-400/90 rounded pointer-events-none"
              style={{ boxShadow: "0 0 15px rgba(251, 191, 36, 0.4)" }}
            >
              <span className="absolute -top-5 left-0 text-[9px] font-mono font-bold bg-amber-400 text-black px-1 rounded whitespace-nowrap">
                #7 Z. El-Sayed [89% Pass]
              </span>
            </div>

            {/* Broadcast Overlay Badges */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-mono font-black animate-pulse flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE STREAM
              </span>
              <span className="px-2 py-1 rounded bg-black/70 border border-white/20 text-[10px] font-mono text-neutral-300 backdrop-blur-md">
                CAM 1: TACTICAL BROADCAST (60 FPS)
              </span>
            </div>

            <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-full bg-black/70 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold backdrop-blur-md">
              AI KINEMATICS ACTIVE
            </div>

            {/* Bottom Live Controls */}
            <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between p-2.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold"
                >
                  HD 1080p
                </button>
                <span className="text-[11px] font-mono text-neutral-400">
                  LATENCY: <strong className="text-emerald-400">24ms</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnalysis(true)}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  + Add Analysis Point
                </button>
              </div>
            </div>
          </div>

          {/* Tactical Pitch 2D Heatmap & Live Biomechanics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300">
                  2D TACTICAL PITCH ZONES
                </span>
                <span className="text-[10px] font-mono text-neutral-400">60 FPS RADAR</span>
              </div>

              {/* Pitch Canvas Representation */}
              <div className="relative w-full h-36 rounded-lg bg-emerald-950/60 border border-emerald-500/30 overflow-hidden flex items-center justify-center">
                {/* Center Circle & Lines */}
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-400/30" />
                <div className="w-16 h-16 rounded-full border border-emerald-400/30" />
                <div className="absolute inset-y-4 left-0 w-8 border-r border-t border-b border-emerald-400/30" />
                <div className="absolute inset-y-4 right-0 w-8 border-l border-t border-b border-emerald-400/30" />

                {/* Player Dots */}
                <div
                  className="absolute top-[40%] left-[55%] w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_8px_#fbbf24]"
                  title="Marcus Vance"
                />
                <div
                  className="absolute top-[55%] left-[40%] w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_8px_#22d3ee]"
                  title="Ziad El-Sayed"
                />
                <div
                  className="absolute top-[30%] left-[65%] w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_8px_#34d399]"
                  title="Lucas Silva"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-1">
                <span>🔴 ATTACKING THIRD: 64% PRESSURE</span>
                <span>BALL RECOVERY: 4.2s AVG</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2 justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300">
                  LIVE BIOMECHANICAL TELEMETRY
                </span>
                <span className="text-[10px] font-mono text-emerald-400">SYNCHRONIZED</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 block">TOP SPRINT</span>
                  <strong className="text-sm font-mono text-amber-300">33.8 KM/H</strong>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 block">DISTANCE COVERED</span>
                  <strong className="text-sm font-mono text-white">8.42 KM</strong>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 block">HIGH INTENSITY BURSTS</span>
                  <strong className="text-sm font-mono text-emerald-300">26 ACTIONS</strong>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400 block">HEART RATE AVG</span>
                  <strong className="text-sm font-mono text-red-400">168 BPM</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Live Match Analysis Stream & Scout Chat (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Live Analysis Events Feed */}
          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-sm">⚡</span>
                <h3 className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                  LIVE MATCH ANALYSIS TIMELINE ({events.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAnalysis(true)}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
              >
                + LOG EVENT
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {events.map((evt) => {
                const badge = eventTypeIcons[evt.eventType] || eventTypeIcons["key-pass"]
                return (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-amber-400">{evt.minute}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {evt.impact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-white">{evt.player}</strong>
                      <span className="text-[10px] text-neutral-400">{evt.team}</span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-snug">
                      {evt.note}
                    </p>

                    <div className="text-[9px] font-mono text-neutral-500 border-t border-white/5 pt-1">
                      Scout: {evt.scoutName}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live Scout Chat Box */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <span>💬</span> SCOUT LIVE DISCUSSION
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE FEED</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar text-xs">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-0.5">
                    <span className="font-bold text-amber-300">
                      {msg.user} <small className="text-neutral-500">[{msg.role}]</small>
                    </span>
                    <span className="font-mono text-neutral-500">{msg.time}</span>
                  </div>
                  <p className="text-neutral-200 text-[11px]">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Share live observation..."
                className="flex-1 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!chatDraft.trim()}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                SEND
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Add Live Analysis Modal */}
      {showAddAnalysis && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowAddAnalysis(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#090d16] border border-amber-500/40 p-5 flex flex-col gap-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-base font-bold text-white">
                  LOG LIVE MATCH ANALYSIS EVENT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAnalysis(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogEvent} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  OBSERVED ATHLETE:
                </label>
                <select
                  value={analysisPlayer}
                  onChange={(e) => setAnalysisPlayer(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Marcus Vance">Marcus Vance (#10 Ajax U19 - Winger)</option>
                  <option value="Ziad El-Sayed">Ziad El-Sayed (#7 Benfica U19 - Midfielder)</option>
                  <option value="Lucas Silva">Lucas Silva (#9 Ajax U19 - Striker)</option>
                  <option value="Mateo Ruiz">Mateo Ruiz (#4 Benfica U19 - Defender)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  EVENT TYPE:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["goal", "key-pass", "recovery", "sprint", "tackle", "save"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnalysisType(type)}
                      className={`py-1.5 px-2 rounded text-xs font-mono font-bold border transition-all cursor-pointer ${
                        analysisType === type
                          ? "bg-amber-500/20 text-amber-300 border-amber-400"
                          : "bg-black/40 text-neutral-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {eventTypeIcons[type].icon} {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  RATING IMPACT (+0.1 to +1.5):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.1}
                    max={1.5}
                    step={0.1}
                    value={analysisImpact}
                    onChange={(e) => setAnalysisImpact(Number(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-amber-300 w-12 text-right">
                    +{analysisImpact.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  TACTICAL OBSERVATION & NOTE:
                </label>
                <textarea
                  rows={3}
                  value={analysisNote}
                  onChange={(e) => setAnalysisNote(e.target.value)}
                  placeholder="e.g. Excellent first-touch orientation under heavy midfield pressure. Created 3v2 overload..."
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddAnalysis(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!analysisNote.trim()}
                  className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                >
                  LOG ANALYSIS POINT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMatchStreamView

