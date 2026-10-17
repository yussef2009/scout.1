import React, { useState, useMemo } from "react"
import {
  Icon,
  ScoreRing,
  sports,
  type DirectoryProfile,
} from "../App"

export interface FullDashboardAthlete {
  id: string
  rank: number
  name: string
  position: string
  age: number
  team: string
  town: string
  country: string
  flag: string
  sport: string
  score: number
  trend: string
  primaryMetric: string
  primaryLabel: string
  secondaryMetric: string
  secondaryLabel: string
  acceleration: string
  image: string
  verified: boolean
  scoutAudited: boolean
  bio: string
  strongPoints: string[]
  weakPoints: string[]
}

const FULL_ATHLETES_ROSTER: FullDashboardAthlete[] = [
  {
    id: "ath-1",
    rank: 1,
    name: "Omar Khalil",
    position: "Point Guard",
    age: 21,
    team: "Alexandria Sporting Club",
    town: "Alexandria",
    country: "Egypt",
    flag: "🇪🇬",
    sport: "Basketball",
    score: 94,
    trend: "+2.4",
    primaryMetric: "78.4 cm",
    primaryLabel: "Vertical Jump",
    secondaryMetric: "0.83 sec",
    secondaryLabel: "Hang Time",
    acceleration: "3.84 m/s²",
    image: "https://images.unsplash.com/photo-1772480476707-cc5170235189?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Elite transition playmaker and floor general with 78.4cm verified vertical jump and high deceleration control.",
    strongPoints: ["Explosive vertical jump", "Rapid court vision", "Perimeter defensive spacing"],
    weakPoints: ["Off-dribble mid-range in transition", "Defensive recovery on back screens"],
  },
  {
    id: "ath-2",
    rank: 2,
    name: "Mateo Ruiz",
    position: "Shooting Guard",
    age: 23,
    team: "Real Madrid Baloncesto",
    town: "Madrid",
    country: "Spain",
    flag: "🇪🇸",
    sport: "Basketball",
    score: 91,
    trend: "+1.8",
    primaryMetric: "75.1 cm",
    primaryLabel: "Vertical Jump",
    secondaryMetric: "0.79 sec",
    secondaryLabel: "Hang Time",
    acceleration: "3.72 m/s²",
    image: "https://images.unsplash.com/photo-1759694390162-bf13852b2650?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Perimeter marksman with smooth high-release mechanics and consistent catch-and-shoot rhythm under contest.",
    strongPoints: ["Catch-and-shoot release", "Off-ball movement timing", "Transition wing lane running"],
    weakPoints: ["Contested rim finishing", "Lateral slide recovery against shifty guards"],
  },
  {
    id: "ath-3",
    rank: 3,
    name: "Adam Hassan",
    position: "Small Forward",
    age: 20,
    team: "Al Ahly Basketball",
    town: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    sport: "Basketball",
    score: 89,
    trend: "+3.1",
    primaryMetric: "72.8 cm",
    primaryLabel: "Vertical Jump",
    secondaryMetric: "0.76 sec",
    secondaryLabel: "Hang Time",
    acceleration: "3.65 m/s²",
    image: "https://images.unsplash.com/photo-1762025858816-bb383940763a?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: false,
    bio: "Two-way wing athlete with exceptional length and rim pressure, averaging +3.1 monthly trend.",
    strongPoints: ["Length and defensive deflections", "Slashing rim attacks", "High motor rebounding"],
    weakPoints: ["Corner 3-point consistency", "Free throw percentage under fatigue"],
  },
  {
    id: "ath-4",
    rank: 4,
    name: "Leo Bennett",
    position: "Point Guard",
    age: 22,
    team: "London Lions Youth",
    town: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    sport: "Basketball",
    score: 87,
    trend: "+0.9",
    primaryMetric: "70.6 cm",
    primaryLabel: "Vertical Jump",
    secondaryMetric: "0.74 sec",
    secondaryLabel: "Hang Time",
    acceleration: "3.58 m/s²",
    image: "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Tempo orchestrator with tight pick-and-roll pocket passing and poise against aggressive traps.",
    strongPoints: ["Pick-and-roll navigation", "Low turnover ratio", "Change-of-pace handles"],
    weakPoints: ["Top-end open floor sprint", "Contesting taller combo guards"],
  },
  {
    id: "ath-5",
    rank: 1,
    name: "Tariq Mansour",
    position: "Winger",
    age: 19,
    team: "Al Ahly Academy U-21",
    town: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    sport: "Soccer",
    score: 96,
    trend: "+4.2",
    primaryMetric: "35.6 km/h",
    primaryLabel: "Max Sprint Speed",
    secondaryMetric: "1.68 sec",
    secondaryLabel: "0-10m Acceleration",
    acceleration: "4.12 m/s²",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Explosive dynamic inverted winger with high top-speed biomechanics, quick deceleration cutbacks, and crisp box crosses.",
    strongPoints: ["Linear acceleration burst", "Low-center dribbling", "Clinical first-touch control"],
    weakPoints: ["Aerial heading duels", "Weak-foot cross accuracy"],
  },
  {
    id: "ath-6",
    rank: 2,
    name: "Lucas Silva",
    position: "Central Midfielder",
    age: 22,
    team: "FC Barcelona Masia",
    town: "Barcelona",
    country: "Spain",
    flag: "🇪🇸",
    sport: "Soccer",
    score: 93,
    trend: "+2.7",
    primaryMetric: "33.8 km/h",
    primaryLabel: "Max Sprint Speed",
    secondaryMetric: "1.74 sec",
    secondaryLabel: "0-10m Acceleration",
    acceleration: "3.90 m/s²",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Metronomic playmaker with high scanning frequency, exceptional press-resistance, and 94% progressive pass accuracy.",
    strongPoints: ["360° field scanning", "First touch under pressure", "Line-breaking passes"],
    weakPoints: ["Direct physical duels", "Sprint recovery over 50m"],
  },
  {
    id: "ath-7",
    rank: 3,
    name: "Youssef Nabil",
    position: "Striker",
    age: 20,
    team: "Zamalek Youth",
    town: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    sport: "Soccer",
    score: 90,
    trend: "+3.5",
    primaryMetric: "34.2 km/h",
    primaryLabel: "Max Sprint Speed",
    secondaryMetric: "1.71 sec",
    secondaryLabel: "0-10m Acceleration",
    acceleration: "3.95 m/s²",
    image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: false,
    bio: "High-pressing center forward with instinctual near-post runs and aerial power in the penalty area.",
    strongPoints: ["Target box hold-up", "Near post header conversion", "Off-the-shoulder timing"],
    weakPoints: ["Link-up play outside 18-yard box", "Tracking back on defensive set pieces"],
  },
  {
    id: "ath-8",
    rank: 4,
    name: "Marcus Vance",
    position: "Full Back",
    age: 21,
    team: "Arsenal Academy",
    town: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    sport: "Soccer",
    score: 88,
    trend: "+1.9",
    primaryMetric: "34.9 km/h",
    primaryLabel: "Max Sprint Speed",
    secondaryMetric: "1.69 sec",
    secondaryLabel: "0-10m Acceleration",
    acceleration: "4.02 m/s²",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Athletic box-to-box full back capable of sustaining high-intensity repeated sprint efforts over 90 minutes.",
    strongPoints: ["Work rate and stamina", "Overlap timing", "Slide tackling precision"],
    weakPoints: ["Inverted passing under high press", "Left-foot crossing under contest"],
  },
  {
    id: "ath-9",
    rank: 1,
    name: "Elena Rostova",
    position: "Singles Baseline",
    age: 20,
    team: "Mouratoglou Academy",
    town: "Madrid",
    country: "Spain",
    flag: "🇪🇸",
    sport: "Tennis",
    score: 95,
    trend: "+3.4",
    primaryMetric: "128 mph",
    primaryLabel: "Serve Velocity",
    secondaryMetric: "0.28 sec",
    secondaryLabel: "Reaction Time",
    acceleration: "4.15 m/s²",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Aggressive baseliner with heavy topspin forehand and elite recovery split-step mechanics across clay and hardcourt.",
    strongPoints: ["First serve placement", "Crosscourt forehand heavy topspin", "Split-step reaction"],
    weakPoints: ["Drop shot touch at net", "Patience on extended 20-shot rallies"],
  },
  {
    id: "ath-10",
    rank: 2,
    name: "Karim Mostafa",
    position: "All-Court",
    age: 22,
    team: "Gezira Club Tennis",
    town: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    sport: "Tennis",
    score: 92,
    trend: "+2.1",
    primaryMetric: "124 mph",
    primaryLabel: "Serve Velocity",
    secondaryMetric: "0.31 sec",
    secondaryLabel: "Reaction Time",
    acceleration: "3.98 m/s²",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Versatile all-court competitor with precision slice approach shots and crisp backhand volley transitions.",
    strongPoints: ["Backhand slice depth", "Net approach positioning", "Physical endurance in 5th set"],
    weakPoints: ["Second serve kick bounce", "Unforced errors on return"],
  },
  {
    id: "ath-11",
    rank: 1,
    name: "Amara Diop",
    position: "Middleweight",
    age: 24,
    team: "Dakar Boxing Federation",
    town: "Cairo",
    country: "Senegal",
    flag: "🇸🇳",
    sport: "Boxing",
    score: 96,
    trend: "+3.9",
    primaryMetric: "840 psi",
    primaryLabel: "Punch Force",
    secondaryMetric: "0.22 sec",
    secondaryLabel: "Hand Speed",
    acceleration: "4.30 m/s²",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Devastating counter-puncher with quick slip-and-counter combinations and head movement measured via high-speed CV.",
    strongPoints: ["Rotational core power", "Lead hook accuracy", "Distance management"],
    weakPoints: ["Inside guard clinch defense", "Volume punching in late rounds"],
  },
  {
    id: "ath-12",
    rank: 1,
    name: "David Kim",
    position: "Sprint Freestyle",
    age: 21,
    team: "London Aquatics Club",
    town: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    sport: "Swimming",
    score: 94,
    trend: "+2.8",
    primaryMetric: "48.2 sec",
    primaryLabel: "100m Free Split",
    secondaryMetric: "44 spm",
    secondaryLabel: "Stroke Rate",
    acceleration: "2.85 m/s²",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Streamlined powerhouse with optimal catch-phase elbow angle and 12-meter underwater kick breakout distance.",
    strongPoints: ["Turn breakout velocity", "High stroke rate stability", "Streamline drag reduction"],
    weakPoints: ["Breathing rhythm on final 15m", "Late race stroke slip"],
  },
  {
    id: "ath-13",
    rank: 1,
    name: "Sofia Chen",
    position: "100m / 200m Sprinter",
    age: 22,
    team: "National Athletics Center",
    town: "Alexandria",
    country: "China",
    flag: "🇨🇳",
    sport: "Track & Field",
    score: 97,
    trend: "+4.5",
    primaryMetric: "10.82 sec",
    primaryLabel: "100m Personal Best",
    secondaryMetric: "4.62 m/s²",
    secondaryLabel: "Drive Phase Accel",
    acceleration: "4.62 m/s²",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Explosive block start specialist with sub-0.14s reaction time and upright maximal velocity mechanics.",
    strongPoints: ["Drive phase block clearance", "Ground contact time under 0.088s", "Top-end speed maintenance"],
    weakPoints: ["Wind-adjusted pacing", "Knee drive symmetry in final 20m"],
  },
  {
    id: "ath-14",
    rank: 1,
    name: "Mateo Alvarez",
    position: "Outside Hitter",
    age: 23,
    team: "Madrid Voleibol Elite",
    town: "Madrid",
    country: "Spain",
    flag: "🇪🇸",
    sport: "Volleyball",
    score: 93,
    trend: "+2.2",
    primaryMetric: "108 cm",
    primaryLabel: "Spike Touch Height",
    secondaryMetric: "112 km/h",
    secondaryLabel: "Spike Velocity",
    acceleration: "3.75 m/s²",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=160&h=160&q=80",
    verified: true,
    scoutAudited: true,
    bio: "Dynamic outside hitter with 3.45m spike reach, aggressive roll shots, and consistent serve reception platform.",
    strongPoints: ["Approach transition rhythm", "High-contact spike angle", "Float serve serve-receive"],
    weakPoints: ["Back-row pipe attack timing", "Block coverage on crosscourt rips"],
  },
]

interface FullDashboardPageProps {
  sport: string
  setSport: (sport: string) => void
  theme: "Dark" | "Light"
  demoMode: boolean
  onSelectProfile: (profile: DirectoryProfile) => void
  onBackToOverview: () => void
  onOpenSearch: () => void
  onOpenSettings?: () => void
}

export default function FullDashboardPage({
  sport,
  setSport,
  theme,
  demoMode,
  onSelectProfile,
  onBackToOverview,
  onOpenSearch,
}: FullDashboardPageProps) {
  const [selectedSport, setSelectedSport] = useState<string>(sport)
  const [scope, setScope] = useState<"Town / City Level" | "Country / National Level">("Town / City Level")
  const [searchQuery, setSearchQuery] = useState("")
  const [regionFilter, setRegionFilter] = useState("All regions")
  const [tierFilter, setTierFilter] = useState<"all" | "elite" | "pro" | "academy">("all")
  const [sortBy, setSortBy] = useState<"rank" | "score" | "trend">("rank")
  const [currentPage, setCurrentPage] = useState(1)
  const [compareList, setCompareList] = useState<FullDashboardAthlete[]>([])
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [exportNotice, setExportNotice] = useState("")

  const pageSize = 8

  // Sync external sport changes
  const handleSportChange = (s: string) => {
    setSelectedSport(s)
    setSport(s)
    setCurrentPage(1)
  }

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    if (!demoMode) return []

    return FULL_ATHLETES_ROSTER.filter((athlete) => {
      // Sport match
      if (selectedSport && athlete.sport !== selectedSport) return false

      // Region filter
      if (regionFilter !== "All regions" && athlete.town !== regionFilter) return false

      // Tier filter
      if (tierFilter === "elite" && athlete.score < 90) return false
      if (tierFilter === "pro" && (athlete.score < 80 || athlete.score >= 90)) return false
      if (tierFilter === "academy" && athlete.score >= 80) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = athlete.name.toLowerCase().includes(q)
        const matchTeam = athlete.team.toLowerCase().includes(q)
        const matchTown = athlete.town.toLowerCase().includes(q)
        const matchCountry = athlete.country.toLowerCase().includes(q)
        const matchPos = athlete.position.toLowerCase().includes(q)
        if (!matchName && !matchTeam && !matchTown && !matchCountry && !matchPos) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === "score") return b.score - a.score
      if (sortBy === "trend") {
        const numA = parseFloat(a.trend.replace("+", ""))
        const numB = parseFloat(b.trend.replace("+", ""))
        return numB - numA
      }
      return a.rank - b.rank
    })
  }, [demoMode, selectedSport, regionFilter, tierFilter, searchQuery, sortBy])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAthletes.length / pageSize))
  const paginatedAthletes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAthletes.slice(start, start + pageSize)
  }, [filteredAthletes, currentPage])

  // Comparison toggle
  const toggleCompare = (athlete: FullDashboardAthlete) => {
    if (compareList.some((a) => a.id === athlete.id)) {
      setCompareList((prev) => prev.filter((a) => a.id !== athlete.id))
    } else {
      if (compareList.length >= 2) {
        setCompareList([compareList[1], athlete])
      } else {
        setCompareList((prev) => [...prev, athlete])
      }
    }
  }

  // Export CSV mock
  const handleExportCSV = () => {
    const headers = "Rank,Name,Position,Age,Team,City,Country,Sport,Score,Trend,PrimaryMetric,Acceleration\n"
    const rows = filteredAthletes
      .map(
        (a) =>
          `"${a.rank}","${a.name}","${a.position}","${a.age}","${a.team}","${a.town}","${a.country}","${a.sport}","${a.score}","${a.trend}","${a.primaryMetric}","${a.acceleration}"`
      )
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `scot_athletes_${selectedSport.toLowerCase()}_leaderboard.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExportNotice("CSV Leaderboard report exported successfully.")
    setTimeout(() => setExportNotice(""), 3500)
  }

  // Active sport stats
  const activeTopAthlete = filteredAthletes[0] || FULL_ATHLETES_ROSTER[0]

  return (
    <div className={`full-dashboard-shell ${theme === "Light" ? "theme-light" : ""}`}>
      {/* Top Breadcrumb & Executive Navigation */}
      <div className="full-dashboard-header">
        <div className="full-dashboard-breadcrumb-area">
          <button
            type="button"
            className="full-dash-back-btn"
            onClick={onBackToOverview}
            title="Return to primary Overview dashboard"
          >
            <Icon name="arrow" size={14} />
            <span>BACK TO OVERVIEW</span>
          </button>
          <div className="full-dashboard-breadcrumb">
            <span className="crumb-root">SCOT BIOMECHANICAL HUB</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">FULL DASHBOARD & ATHLETE LEADERBOARD</span>
          </div>
        </div>

        <div className="full-dashboard-header-actions">
          <div className="network-pill-status">
            <span className="pulse-dot active" />
            <span>
              <strong>{demoMode ? "2,148" : "0"}</strong> VERIFIED ATHLETES LIVE
            </span>
          </div>

          <button
            type="button"
            className="outline-button"
            style={{ minHeight: 36, padding: "0 14px", gap: 7, fontSize: 10 }}
            onClick={handleExportCSV}
            title="Download verified dataset as CSV"
          >
            <Icon name="chart" size={13} />
            <span>EXPORT CSV</span>
          </button>

          <button
            type="button"
            className="outline-button"
            style={{ minHeight: 36, padding: "0 14px", gap: 7, fontSize: 10 }}
            onClick={onOpenSearch}
            title="Global athlete and scout directory search"
          >
            <Icon name="search" size={13} />
            <span>SEARCH</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="full-dash-toast" role="status">
          <Icon name="shield" size={14} />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Hero Headline & Title Section */}
      <section className="full-dash-hero">
        <div className="full-dash-hero-title">
          <p className="eyebrow">
            <span /> {selectedSport.toUpperCase()} FULL INTELLIGENCE DECK
          </p>
          <h1>
            Performance Leaderboard
            <br />
            <em>Biomechanical Precision</em>
          </h1>
          <p className="full-dash-hero-desc">
            Computer vision-verified tracking at 60 FPS. Discover elite prospects, compare
            acceleration signatures, and evaluate biomechanical consistency across international
            divisions.
          </p>
        </div>

        {/* Global Sport Pills Bar */}
        <div className="full-dash-sport-bar" role="tablist" aria-label="Scot sport categories">
          <span className="sport-bar-label">SELECT SPORT:</span>
          <div className="sport-bar-chips">
            {sports.map((item) => (
              <button
                key={item}
                type="button"
                className={`full-dash-sport-chip ${selectedSport === item ? "active" : ""}`}
                onClick={() => handleSportChange(item)}
                role="tab"
                aria-selected={selectedSport === item}
              >
                <span>{item}</span>
                {selectedSport === item && <span className="chip-indicator" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics KPI Row */}
      <section className="full-dash-kpi-grid">
        {/* KPI 1: Active Sport Benchmark */}
        <article className="full-dash-kpi-card">
          <span className="kpi-kicker">SPORT BENCHMARK</span>
          <strong className="kpi-title">{selectedSport.toUpperCase()} SIGNAL</strong>
          <div className="kpi-metric-val">
            <span>{activeTopAthlete.primaryMetric}</span>
            <small>{activeTopAthlete.primaryLabel}</small>
          </div>
          <p className="kpi-note">
            Top recorded benchmark in {selectedSport} with ±2.4% vision model variance.
          </p>
        </article>

        {/* KPI 2: Tier Distribution */}
        <article className="full-dash-kpi-card">
          <span className="kpi-kicker">DISTRIBUTION SPREAD</span>
          <strong className="kpi-title">SCOT INDEX TIERS</strong>
          <div className="tier-breakdown-bars">
            <div className="tier-bar-row">
              <span className="tier-name">Elite (90+)</span>
              <div className="tier-track">
                <div className="tier-fill elite" style={{ width: "24%" }} />
              </div>
              <span className="tier-pct">24%</span>
            </div>
            <div className="tier-bar-row">
              <span className="tier-name">Pro (80-89)</span>
              <div className="tier-track">
                <div className="tier-fill pro" style={{ width: "48%" }} />
              </div>
              <span className="tier-pct">48%</span>
            </div>
            <div className="tier-bar-row">
              <span className="tier-name">Academy (70-79)</span>
              <div className="tier-track">
                <div className="tier-fill academy" style={{ width: "28%" }} />
              </div>
              <span className="tier-pct">28%</span>
            </div>
          </div>
        </article>

        {/* KPI 3: Top Performer Spotlight */}
        <article className="full-dash-kpi-card spotlight-card">
          <span className="kpi-kicker">#1 SEEDED PROSPECT</span>
          <div className="kpi-spotlight-athlete">
            <img src={activeTopAthlete.image} alt={activeTopAthlete.name} />
            <div>
              <strong>{activeTopAthlete.name}</strong>
              <small>
                {activeTopAthlete.position} · {activeTopAthlete.team}
              </small>
            </div>
            <ScoreRing score={activeTopAthlete.score} />
          </div>
          <div className="kpi-spotlight-stats">
            <span>Acceleration: {activeTopAthlete.acceleration}</span>
            <span className="trend-badge">
              <Icon name="trend" size={11} /> {activeTopAthlete.trend}
            </span>
          </div>
        </article>

        {/* KPI 4: Computer Vision Telemetry */}
        <article className="full-dash-kpi-card">
          <span className="kpi-kicker">VERIFICATION ENGINE</span>
          <strong className="kpi-title">COMPUTER VISION</strong>
          <div className="kpi-engine-stats">
            <div className="stat-unit">
              <strong>60 FPS</strong>
              <small>Tracking Rate</small>
            </div>
            <div className="stat-unit">
              <strong>99.2%</strong>
              <small>Kinematic Lock</small>
            </div>
            <div className="stat-unit">
              <strong>±2.4%</strong>
              <small>Variance</small>
            </div>
          </div>
          <p className="kpi-note">
            Sub-pixel landmark tracking synchronized across limb angles & ground reaction.
          </p>
        </article>
      </section>

      {/* Filter and Query Deck */}
      <section className="full-dash-controls-deck">
        <div className="controls-left">
          {/* Scope Toggle */}
          <div className="scope-switch-compact">
            <button
              type="button"
              className={scope === "Town / City Level" ? "active" : ""}
              onClick={() => setScope("Town / City Level")}
            >
              Town / City
            </button>
            <button
              type="button"
              className={scope === "Country / National Level" ? "active" : ""}
              onClick={() => setScope("Country / National Level")}
            >
              Country / National
            </button>
          </div>

          {/* Search Input */}
          <div className="search-filter-input">
            <Icon name="search" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Filter by name, club, position, or town..."
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="controls-right">
          {/* Region Filter */}
          <div className="select-pill-wrap">
            <Icon name="location" size={13} />
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option>All regions</option>
              <option>Alexandria</option>
              <option>Cairo</option>
              <option>Madrid</option>
              <option>London</option>
              <option>Barcelona</option>
            </select>
            <Icon name="chevron" size={12} />
          </div>

          {/* Tier Filter */}
          <div className="select-pill-wrap">
            <Icon name="shield" size={13} />
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="all">All Tiers</option>
              <option value="elite">Elite (90+)</option>
              <option value="pro">Pro (80-89)</option>
              <option value="academy">Academy (&lt;80)</option>
            </select>
            <Icon name="chevron" size={12} />
          </div>

          {/* Sort Dropdown */}
          <div className="select-pill-wrap">
            <Icon name="trend" size={13} />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any)
                setCurrentPage(1)
              }}
            >
              <option value="rank">Sort: Rank (1 to N)</option>
              <option value="score">Sort: Scot Score (High)</option>
              <option value="trend">Sort: Monthly Trend (+)</option>
            </select>
            <Icon name="chevron" size={12} />
          </div>

          {(searchQuery || regionFilter !== "All regions" || tierFilter !== "all") && (
            <button
              type="button"
              className="text-button"
              style={{ fontSize: 10 }}
              onClick={() => {
                setSearchQuery("")
                setRegionFilter("All regions")
                setTierFilter("all")
              }}
            >
              RESET
            </button>
          )}
        </div>
      </section>

      {/* Main Table Section */}
      <section className="full-dash-table-card">
        <div className="table-card-topbar">
          <div>
            <h2>
              {scope === "Town / City Level"
                ? `TOWN & CITY LEADERS · ${selectedSport.toUpperCase()}`
                : `NATIONAL & GLOBAL LEADERS · ${selectedSport.toUpperCase()}`}
            </h2>
            <span className="results-count">
              Showing <strong>{filteredAthletes.length}</strong> ranked athletes matching criteria
            </span>
          </div>

          {compareList.length > 0 && (
            <div className="compare-counter-pill">
              <span>
                {compareList.length} of 2 athletes selected for head-to-head
              </span>
              <button
                type="button"
                className="primary-button"
                style={{ minHeight: 30, padding: "0 12px", fontSize: 9 }}
                onClick={() => setIsCompareModalOpen(true)}
              >
                COMPARE NOW <Icon name="arrow" size={11} />
              </button>
              <button
                type="button"
                className="clear-compare-btn"
                onClick={() => setCompareList([])}
                title="Clear comparison selection"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="full-dash-table-scroll">
          <table className="full-dash-table">
            <thead>
              <tr>
                <th>RANK / ATHLETE</th>
                <th>POSITION / TEAM</th>
                <th>LOCATION</th>
                <th>PRIMARY BIOMECHANICS</th>
                <th>ACCELERATION</th>
                <th>SCOT SCORE</th>
                <th>AUDIT STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAthletes.map((athlete) => {
                const isCompared = compareList.some((a) => a.id === athlete.id)
                return (
                  <tr
                    key={athlete.id}
                    className={isCompared ? "row-compared" : ""}
                  >
                    {/* Rank & Athlete Info */}
                    <td>
                      <div className="rank-player-cell">
                        <span className={`athlete-rank-pill rank-${athlete.rank}`}>
                          #{String(athlete.rank).padStart(2, "0")}
                        </span>
                        <img
                          src={athlete.image}
                          alt={athlete.name}
                          className="athlete-table-avatar"
                        />
                        <div className="athlete-name-block">
                          <div className="name-with-verified">
                            <strong>{athlete.name}</strong>
                            {athlete.verified && (
                              <span className="verified-shield-icon" title="SCOT Verified Athlete">
                                <Icon name="shield" size={12} />
                              </span>
                            )}
                          </div>
                          <small>Age {athlete.age} · {athlete.sport}</small>
                        </div>
                      </div>
                    </td>

                    {/* Position & Team */}
                    <td>
                      <strong>{athlete.position}</strong>
                      <small className="cell-sub">{athlete.team}</small>
                    </td>

                    {/* Location & Flag */}
                    <td>
                      <strong>
                        {athlete.flag} {athlete.town}
                      </strong>
                      <small className="cell-sub">{athlete.country}</small>
                    </td>

                    {/* Primary Metric */}
                    <td>
                      <strong className="metric-highlight">{athlete.primaryMetric}</strong>
                      <small className="cell-sub">{athlete.primaryLabel}</small>
                    </td>

                    {/* Secondary Metric / Acceleration */}
                    <td>
                      <strong className="metric-secondary">{athlete.acceleration}</strong>
                      <small className="cell-sub">{athlete.secondaryLabel}: {athlete.secondaryMetric}</small>
                    </td>

                    {/* Scot Score Ring & Trend */}
                    <td>
                      <div className="score-cell-wrap">
                        <ScoreRing score={athlete.score} />
                        <span className="trend">
                          <Icon name="trend" size={12} /> {athlete.trend}
                        </span>
                      </div>
                    </td>

                    {/* Audit Status */}
                    <td>
                      <span className={`audit-badge ${athlete.scoutAudited ? "audited" : "verified"}`}>
                        <span className="dot" />
                        {athlete.scoutAudited ? "SCOUT AUDITED" : "VISION VERIFIED"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons-cell">
                        <button
                          type="button"
                          className="table-profile-btn"
                          onClick={() => {
                            const directoryMatch: DirectoryProfile = {
                              id: athlete.id,
                              rank: athlete.rank,
                              name: athlete.name,
                              meta: `${athlete.position} · ${athlete.age}`,
                              town: athlete.town,
                              country: athlete.country,
                              flag: athlete.flag,
                              score: athlete.score,
                              trend: athlete.trend,
                              image: athlete.image,
                              role: "Player",
                              sport: athlete.sport,
                              followers: 1240,
                              following: 86,
                              bio: athlete.bio,
                              strongPoints: athlete.strongPoints,
                              weakPoints: athlete.weakPoints,
                            }
                            onSelectProfile(directoryMatch)
                          }}
                          title="View public athletic dossier"
                        >
                          <Icon name="user" size={12} />
                          <span>PROFILE</span>
                        </button>

                        <button
                          type="button"
                          className={`table-compare-btn ${isCompared ? "active" : ""}`}
                          onClick={() => toggleCompare(athlete)}
                          title={isCompared ? "Remove from comparison" : "Add to head-to-head comparison"}
                        >
                          {isCompared ? "COMPARING" : "COMPARE"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredAthletes.length === 0 && (
            <div className="empty-state">
              <Icon name="search" size={28} />
              <p>NO ATHLETES MATCH THE CURRENT FILTER SELECTION.</p>
              <button
                type="button"
                className="outline-button"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setSearchQuery("")
                  setRegionFilter("All regions")
                  setTierFilter("all")
                  setSelectedSport(sports[0])
                }}
              >
                RESET ALL FILTERS
              </button>
            </div>
          )}
        </div>

        {/* Table Footer with Pagination */}
        <div className="full-dash-table-footer">
          <div className="footer-left-info">
            <span>
              Showing {paginatedAthletes.length} of {filteredAthletes.length} filtered athletes (
              {demoMode ? "2,148" : "0"} total verified)
            </span>
          </div>

          <div className="pagination-bar">
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              PREV
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                className={`page-num-btn ${currentPage === pg ? "active" : ""}`}
                onClick={() => setCurrentPage(pg)}
              >
                {pg}
              </button>
            ))}

            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              NEXT
            </button>
          </div>
        </div>
      </section>

      {/* Head-to-Head Comparison Modal */}
      {isCompareModalOpen && compareList.length > 0 && (
        <div className="modal-backdrop" onClick={() => setIsCompareModalOpen(false)}>
          <div
            className="full-dash-compare-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Athlete Comparison"
          >
            <div className="compare-modal-header">
              <div className="compare-modal-title">
                <Icon name="chart" size={16} />
                <strong>HEAD-TO-HEAD BIOMECHANICAL AUDIT</strong>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCompareModalOpen(false)}
                aria-label="Close modal"
              >
                <Icon name="close" size={14} />
              </button>
            </div>

            <div className="compare-athletes-grid">
              {compareList.map((ath, idx) => (
                <div key={ath.id} className="compare-athlete-col">
                  <div className="compare-ath-top">
                    <img src={ath.image} alt={ath.name} />
                    <div>
                      <span className="compare-rank-badge">#{ath.rank} SEED</span>
                      <h3>{ath.name}</h3>
                      <small>
                        {ath.position} · {ath.team}
                      </small>
                      <small className="country-sub">
                        {ath.flag} {ath.town}, {ath.country}
                      </small>
                    </div>
                    <div className="compare-score-ring">
                      <ScoreRing score={ath.score} />
                    </div>
                  </div>

                  <div className="compare-metrics-list">
                    <div className="compare-metric-row">
                      <span>Primary Benchmark ({ath.primaryLabel})</span>
                      <strong>{ath.primaryMetric}</strong>
                    </div>
                    <div className="compare-metric-row">
                      <span>Secondary ({ath.secondaryLabel})</span>
                      <strong>{ath.secondaryMetric}</strong>
                    </div>
                    <div className="compare-metric-row">
                      <span>Acceleration Dynamic</span>
                      <strong>{ath.acceleration}</strong>
                    </div>
                    <div className="compare-metric-row">
                      <span>Monthly Trajectory</span>
                      <strong className="trend">
                        <Icon name="trend" size={12} /> {ath.trend}
                      </strong>
                    </div>
                  </div>

                  <div className="compare-strengths">
                    <span className="strength-header">KEY STRENGTHS:</span>
                    <ul>
                      {ath.strongPoints.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    style={{ width: "100%", marginTop: 14 }}
                    onClick={() => {
                      setIsCompareModalOpen(false)
                      onSelectProfile({
                        id: ath.id,
                        rank: ath.rank,
                        name: ath.name,
                        meta: `${ath.position} · ${ath.age}`,
                        town: ath.town,
                        country: ath.country,
                        flag: ath.flag,
                        score: ath.score,
                        trend: ath.trend,
                        image: ath.image,
                        role: "Player",
                        sport: ath.sport,
                        followers: 1240,
                        following: 86,
                        bio: ath.bio,
                        strongPoints: ath.strongPoints,
                        weakPoints: ath.weakPoints,
                      })
                    }}
                  >
                    INSPECT FULL PROFILE <Icon name="arrow" size={12} />
                  </button>
                </div>
              ))}

              {compareList.length === 1 && (
                <div className="compare-athlete-col empty-slot">
                  <Icon name="user" size={32} />
                  <strong>SELECT SECOND ATHLETE</strong>
                  <p>Choose another athlete from the table to unlock delta biomechanics comparison.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
