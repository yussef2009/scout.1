import React from "react"

interface PitchHeatmap2DProps {
  sport?: string
  athleteName?: string
  position?: string
  attackingThird?: number
  middleThird?: number
  defensiveThird?: number
  topSprintZone?: string
  theme?: "nano-banana" | "dark" | "clean-white" | "navy" | string
}

export const PitchHeatmap2D: React.FC<PitchHeatmap2DProps> = ({
  sport = "Basketball",
  athleteName = "Athlete",
  position = "Guard",
  attackingThird = 44,
  middleThird = 38,
  defensiveThird = 18,
  topSprintZone = "Perimeter Wing & Paint",
  theme = "nano-banana",
}) => {
  const normSport = (sport || "").toLowerCase()
  const isSoccer = normSport.includes("foot") || normSport.includes("soccer")
  const isTennis = normSport.includes("tennis") || normSport.includes("padel")
  const isVolleyball = normSport.includes("volley")
  const isTrack = normSport.includes("track") || normSport.includes("field") || normSport.includes("sprint")
  const isBoxing = normSport.includes("box") || normSport.includes("combat")
  const isSwimming = normSport.includes("swim")
  const isBaseball = normSport.includes("base") || normSport.includes("softball")
  const isCycling = normSport.includes("cycl") || normSport.includes("velo")
  const isGymnastics = normSport.includes("gym")
  const isBasketball = !isSoccer && !isTennis && !isVolleyball && !isTrack && !isBoxing && !isSwimming && !isBaseball && !isCycling && !isGymnastics

  const isNanoBanana = theme === "nano-banana"
  const isCleanWhite = theme === "clean-white"
  const isNavy = theme === "navy"
  const isDark = theme === "dark"

  const goldColor = isNanoBanana
    ? "#FFE100"
    : isCleanWhite
      ? "#B45309"
      : isNavy
        ? "#38BDF8"
        : "var(--gold-bright, #fbbf24)"
  const goldGlow = isNanoBanana
    ? "rgba(255, 225, 0, 0.25)"
    : isCleanWhite
      ? "rgba(180, 83, 9, 0.15)"
      : isNavy
        ? "rgba(56, 189, 248, 0.25)"
        : "rgba(251, 191, 36, 0.2)"

  // Dynamic zone metrics & titles tailored per sport
  let zone1Label = "ATTACKING THIRD"
  let zone1Val = `${attackingThird}%`
  let zone1Desc = "High-leverage final third touches"

  let zone2Label = "MIDDLE THIRD"
  let zone2Val = `${middleThird}%`
  let zone2Desc = "Transition & ball circulation"

  let zone3Label = "DEFENSIVE THIRD"
  let zone3Val = `${defensiveThird}%`
  let zone3Desc = "Recovery & structural defense"

  let zone4Label = "TOP SPRINT CORRIDOR"
  let zone4Val = topSprintZone || "Central Channel"
  let zone4Desc = "Peak acceleration lane"

  let courtTitle = "2D Tactical Pitch Heatmap & Action Zones"
  let courtSubtitle = `Positional density distribution for ${athleteName} (${position})`

  if (isSoccer) {
    courtTitle = "11v11 Pitch Spatial Heatmap & Half-Space Corridors"
    courtSubtitle = `Positional density & passing network for ${athleteName} (${position})`
    zone1Label = "ATTACKING 3RD"
    zone2Label = "MIDDLE 3RD"
    zone3Label = "DEFENSIVE 3RD"
    zone4Label = "SPRINT CORRIDOR"
    zone4Val = topSprintZone || "Left Half-Space & Overlap"
  } else if (isBasketball) {
    courtTitle = "Hardwood Court & Shot Zone Shot-Chart Heatmap"
    courtSubtitle = `Paint penetration & perimeter arc spacing for ${athleteName} (${position})`
    zone1Label = "PAINT PENETRATION"
    zone1Val = `${attackingThird}%`
    zone1Desc = "Rim finishes & post touches"
    zone2Label = "PERIMETER WING"
    zone2Val = `${middleThird}%`
    zone2Desc = "Pick-and-roll & ball rotation"
    zone3Label = "TRANSITION ZONE"
    zone3Val = `${defensiveThird}%`
    zone3Desc = "Fastbreak & defensive retreat"
    zone4Label = "PRIMARY SCORING HUB"
    zone4Val = topSprintZone || "Right Elbow / Arc"
  } else if (isVolleyball) {
    courtTitle = "9m×18m Court & 3m Attack Zone Heatmap"
    courtSubtitle = `Spike approach corridor & block perimeter for ${athleteName} (${position})`
    zone1Label = "ZONE 4 ATTACK"
    zone1Val = "48%"
    zone1Desc = "Outside spike approach"
    zone2Label = "PIPE / BACK ROW"
    zone2Val = "28%"
    zone2Desc = "Second tempo transition"
    zone3Label = "DIG RADIUS"
    zone3Val = "24%"
    zone3Desc = "Floor recovery perimeter"
    zone4Label = "PEAK SPIKE CEILING"
    zone4Val = "3.18 meters"
    zone4Desc = "Maximum vertical contact"
  } else if (isTennis) {
    courtTitle = "78ft Regulation Court & Baseline Depth Distribution"
    courtSubtitle = `Rally depth & split-step reaction vectors for ${athleteName} (${position})`
    zone1Label = "DEEP BASELINE"
    zone1Val = "54%"
    zone1Desc = "Heavy topspin rally exchanges"
    zone2Label = "MID-COURT"
    zone2Val = "28%"
    zone2Desc = "Approach & short ball winners"
    zone3Label = "NET / VOLLEY"
    zone3Val = "18%"
    zone3Desc = "Forward transition finishes"
    zone4Label = "DOMINANT STRIKE"
    zone4Val = topSprintZone || "Inside-Out Forehand"
    zone4Desc = "Highest win-rate weapon"
  } else if (isTrack) {
    courtTitle = "100m Track Lane Velocity & Stride Phasing Map"
    courtSubtitle = `Drive acceleration & max speed phasing for ${athleteName} (${position})`
    zone1Label = "0–30m DRIVE"
    zone1Val = "3.84 s"
    zone1Desc = "Low torso acceleration angle"
    zone2Label = "30–60m MAX VELO"
    zone2Val = "11.4 m/s"
    zone2Desc = "Peak velocity maintenance"
    zone3Label = "60–100m RESERVE"
    zone3Val = "97.8%"
    zone3Desc = "Deceleration resistance"
    zone4Label = "STRIDE CADENCE"
    zone4Val = "4.48 Hz"
    zone4Desc = "Step frequency & ground force"
  } else if (isBoxing) {
    courtTitle = "20ft Ring Canvas & Strike Heat Distribution"
    courtSubtitle = `Ring center control & punch placement for ${athleteName} (${position})`
    zone1Label = "HEAD STRIKES"
    zone1Val = "58%"
    zone1Desc = "High guard & jab targets"
    zone2Label = "BODY / LIVER"
    zone2Val = "42%"
    zone2Desc = "Mid-range ribcage hooks"
    zone3Label = "RING CENTER"
    zone3Val = "68%"
    zone3Desc = "Territory & ropes pressure"
    zone4Label = "SLIP & COUNTER"
    zone4Val = "45° Lateral"
    zone4Desc = "Evade & return corridor"
  } else if (isSwimming) {
    courtTitle = "50m Olympic Pool Lane & Breakout Hydrodynamics"
    courtSubtitle = `Underwater dolphin breakout & wall turn metrics for ${athleteName} (${position})`
    zone1Label = "UNDERWATER"
    zone1Val = "14.2 m"
    zone1Desc = "Subsurface streamline phase"
    zone2Label = "CLEAN STROKE"
    zone2Val = "31.8 m"
    zone2Desc = "Surface propulsion phase"
    zone3Label = "TURN EXPLOSION"
    zone3Val = "1.86 kN"
    zone3Desc = "Wall contact push-off"
    zone4Label = "STROKE CADENCE"
    zone4Val = "64 spm"
    zone4Desc = "Cycles per minute pace"
  } else if (isBaseball) {
    courtTitle = "Diamond Field Spray Chart & 3×3 Strike Zone Grid"
    courtSubtitle = `Pitch tunneling & exit velocity spray for ${athleteName} (${position})`
    zone1Label = "ZONE CONTROL"
    zone1Val = "67%"
    zone1Desc = "In-zone strike frequency"
    zone2Label = "EXIT VELOCITY"
    zone2Val = "102 mph"
    zone2Desc = "Hard-hit contact metric"
    zone3Label = "LAUNCH ANGLE"
    zone3Val = "16.4°"
    zone3Desc = "Optimal line-drive trajectory"
    zone4Label = "PRIMARY TUNNEL"
    zone4Val = "Low & Away Slider"
    zone4Desc = "Wipeout release disguise"
  } else if (isCycling) {
    courtTitle = "250m Velodrome Banking & Power Curve Spectrum"
    courtSubtitle = `Wattage zones & aerodynamic drag contour for ${athleteName} (${position})`
    zone1Label = "FTP THRESHOLD"
    zone1Val = "410 W"
    zone1Desc = "1-hour sustained power"
    zone2Label = "SPRINT 5s BURST"
    zone2Val = "1,184 W"
    zone2Desc = "Terminal track acceleration"
    zone3Label = "AERO DRAG (CdA)"
    zone3Val = "0.208 m²"
    zone3Desc = "Wind tunnel efficiency"
    zone4Label = "L / R BALANCE"
    zone4Val = "50.4% / 49.6%"
    zone4Desc = "Pedal stroke torque symmetry"
  } else if (isGymnastics) {
    courtTitle = "12m×12m Spring Floor & Vault Runway Trajectory"
    courtSubtitle = `Diagonal tumbling apex & stick landing zones for ${athleteName} (${position})`
    zone1Label = "TUMBLING APEX"
    zone1Val = "1.24 m"
    zone1Desc = "Takeoff vertical elevation"
    zone2Label = "ROTATIONAL VELO"
    zone2Val = "5.8 rad/s"
    zone2Desc = "Twist angular momentum"
    zone3Label = "STICK RADIUS"
    zone3Val = "0.22 m"
    zone3Desc = "Landing dispersion offset"
    zone4Label = "DIAGONAL PASS"
    zone4Val = "Corner 1 → 3"
    zone4Desc = "Triple twist layout vector"
  }

  // Pitch Background Colors
  const pitchBg = isSoccer
    ? "radial-gradient(ellipse at center, #0c2016 0%, #06110a 100%)"
    : isTennis
      ? "radial-gradient(ellipse at center, #140e08 0%, #080604 100%)"
      : isVolleyball
        ? "radial-gradient(ellipse at center, #0a1420 0%, #050a12 100%)"
        : isTrack
          ? "radial-gradient(ellipse at center, #1b0a0e 0%, #0d0407 100%)"
          : isBoxing
            ? "radial-gradient(ellipse at center, #130a13 0%, #080408 100%)"
            : isSwimming
              ? "radial-gradient(ellipse at center, #071724 0%, #030a10 100%)"
              : isBaseball
                ? "radial-gradient(ellipse at center, #0e160a 0%, #060b04 100%)"
                : isCycling
                  ? "radial-gradient(ellipse at center, #0b0c16 0%, #05060d 100%)"
                  : isGymnastics
                    ? "radial-gradient(ellipse at center, #140a16 0%, #08040a 100%)"
                    : "radial-gradient(ellipse at center, #1c1006 0%, #0c0602 100%)" // Basketball

  return (
    <div
      className={`pitch-heatmap-container pitch-theme-${theme}`}
      style={{
        background: isNanoBanana
          ? "rgba(14, 18, 28, 0.85)"
          : isCleanWhite
            ? "#f8fafc"
            : isNavy
              ? "rgba(11, 19, 34, 0.9)"
              : "rgba(255, 255, 255, 0.04)",
        border: `1px solid ${
          isNanoBanana
            ? "rgba(255, 225, 0, 0.22)"
            : isCleanWhite
              ? "#e2e8f0"
              : isNavy
                ? "rgba(56, 189, 248, 0.25)"
                : "rgba(255, 255, 255, 0.1)"
        }`,
        borderRadius: "20px",
        padding: "24px",
        marginTop: "24px",
        backdropFilter: "blur(14px)",
        boxShadow: isNanoBanana
          ? `0 0 35px -5px ${goldGlow}`
          : isCleanWhite
            ? "0 4px 20px rgba(0,0,0,0.03)"
            : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1px",
              color: goldColor,
              textTransform: "uppercase",
            }}
          >
            SPATIAL &amp; KINEMATIC TELEMETRY
          </span>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: isCleanWhite
                ? "#0f172a"
                : isNanoBanana
                  ? "#FFE100"
                  : "#ffffff",
              margin: "4px 0 2px",
            }}
          >
            {courtTitle}
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: isCleanWhite
                ? "#64748b"
                : isNanoBanana
                  ? "#F59E0B"
                  : "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            {courtSubtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#A3E635",
              boxShadow: "0 0 10px #A3E635",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#A3E635",
              fontFamily: "monospace",
              letterSpacing: "0.06em",
            }}
          >
            LIVE HOMOGRAPHY
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          alignItems: "center",
        }}
      >
        {/* Court / Pitch SVG Graphic */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 10",
            borderRadius: "14px",
            overflow: "hidden",
            background: pitchBg,
            border: `1px solid ${isNanoBanana ? "rgba(255, 225, 0, 0.28)" : "rgba(255, 255, 255, 0.12)"}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Pitch Lines */}
          <svg
            viewBox="0 0 1000 620"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <defs>
              {/* Radial Heatmap Gradients */}
              <radialGradient id="heat-gold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE100" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.65" />
                <stop offset="80%" stopColor="#A3E635" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FFE100" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-secondary" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFE100" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFE100" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="track-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#FFE100" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#A3E635" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FFE100" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {isSoccer ? (
              /* Soccer Pitch Geometry */
              <g stroke="rgba(255, 225, 0, 0.28)" strokeWidth="2.5" fill="none">
                <rect x="40" y="30" width="920" height="560" rx="4" />
                <line x1="500" y1="30" x2="500" y2="590" />
                <circle cx="500" cy="310" r="90" />
                <circle cx="500" cy="310" r="4" fill="#FFE100" />
                {/* Penalty Boxes */}
                <rect x="40" y="160" width="160" height="300" />
                <rect x="40" y="230" width="60" height="160" />
                <rect x="800" y="160" width="160" height="300" />
                <rect x="900" y="230" width="60" height="160" />
                {/* Spatial Heat Blobs */}
                <circle cx="720" cy="240" r="115" fill="url(#heat-gold)" />
                <circle cx="600" cy="340" r="95" fill="url(#heat-secondary)" />
                <circle cx="450" cy="260" r="75" fill="url(#heat-secondary)" opacity="0.6" />
                <path d="M 450 260 Q 600 200 720 240" stroke="#FFE100" strokeWidth="3" strokeDasharray="6 4" />
                <circle cx="720" cy="240" r="8" fill="#FFE100" stroke="#000" strokeWidth="2" />
                <text x="720" y="215" textAnchor="middle" fill="#FFE100" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  PRIMARY HUB (LEFT HALF-SPACE)
                </text>
              </g>
            ) : isVolleyball ? (
              /* Volleyball Court Geometry (9m x 18m) */
              <g stroke="rgba(255, 225, 0, 0.3)" strokeWidth="2.5" fill="none">
                <rect x="80" y="60" width="840" height="500" rx="4" />
                <line x1="500" y1="50" x2="500" y2="570" stroke="#FFE100" strokeWidth="5" />
                <line x1="360" y1="60" x2="360" y2="560" strokeDasharray="8 6" />
                <line x1="640" y1="60" x2="640" y2="560" strokeDasharray="8 6" />
                <circle cx="680" cy="180" r="105" fill="url(#heat-gold)" />
                <path d="M 780 180 L 680 180 L 480 260" stroke="#FFE100" strokeWidth="3" strokeDasharray="6 4" />
                <circle cx="680" cy="180" r="8" fill="#FFE100" stroke="#000" strokeWidth="2" />
                <text x="680" y="150" textAnchor="middle" fill="#FFE100" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  ZONE 4 OUTSIDE SPIKE (3.18m CEILING)
                </text>
              </g>
            ) : isTennis ? (
              /* Tennis Court Geometry */
              <g stroke="rgba(255, 225, 0, 0.3)" strokeWidth="2.5" fill="none">
                <rect x="70" y="50" width="860" height="520" />
                <line x1="500" y1="40" x2="500" y2="580" stroke="#FFE100" strokeWidth="4" />
                <line x1="70" y1="120" x2="930" y2="120" />
                <line x1="70" y1="500" x2="930" y2="500" />
                <line x1="280" y1="120" x2="280" y2="500" />
                <line x1="720" y1="120" x2="720" y2="500" />
                <line x1="280" y1="310" x2="720" y2="310" />
                <circle cx="860" cy="400" r="100" fill="url(#heat-gold)" />
                <circle cx="860" cy="400" r="8" fill="#FFE100" stroke="#000" strokeWidth="2" />
                <text x="830" y="370" textAnchor="middle" fill="#FFE100" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  INSIDE-OUT FOREHAND (54% DEEP)
                </text>
              </g>
            ) : isTrack ? (
              /* Track & Field Straightaway (100m Lane) */
              <g stroke="rgba(255, 225, 0, 0.25)" strokeWidth="2" fill="none">
                <line x1="60" y1="160" x2="940" y2="160" />
                <line x1="60" y1="240" x2="940" y2="240" />
                <line x1="60" y1="320" x2="940" y2="320" />
                <line x1="60" y1="400" x2="940" y2="400" />
                <line x1="60" y1="480" x2="940" y2="480" />
                <line x1="60" y1="140" x2="60" y2="500" stroke="#FFE100" strokeWidth="4" />
                <line x1="330" y1="140" x2="330" y2="500" strokeDasharray="6 6" />
                <line x1="670" y1="140" x2="670" y2="500" strokeDasharray="6 6" />
                <line x1="940" y1="140" x2="940" y2="500" stroke="#A3E635" strokeWidth="4" />
                <rect x="60" y="320" width="880" height="80" fill="url(#track-gradient)" rx="4" />
                <text x="60" y="130" fill="#FFE100" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  BLOCKS (0m)
                </text>
                <text x="330" y="130" fill="#FFE100" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  30m DRIVE ACCEL
                </text>
                <text x="670" y="130" fill="#FFE100" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  60m MAX VELO (11.4 m/s)
                </text>
                <text x="940" y="130" textAnchor="end" fill="#A3E635" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  100m FINISH
                </text>
              </g>
            ) : isBoxing ? (
              /* Boxing Ring (20ft) */
              <g stroke="rgba(255, 225, 0, 0.3)" strokeWidth="3" fill="none">
                <rect x="180" y="70" width="640" height="480" rx="6" />
                <rect x="195" y="85" width="610" height="450" />
                <rect x="210" y="100" width="580" height="420" />
                <circle cx="180" cy="70" r="16" fill="#ef4444" stroke="#FFE100" />
                <circle cx="820" cy="550" r="16" fill="#3b82f6" stroke="#FFE100" />
                <circle cx="820" cy="70" r="14" fill="#64748b" />
                <circle cx="180" cy="550" r="14" fill="#64748b" />
                <circle cx="500" cy="310" r="130" fill="url(#heat-gold)" />
                <circle cx="500" cy="310" r="8" fill="#FFE100" stroke="#000" strokeWidth="2" />
                <text x="500" y="280" textAnchor="middle" fill="#FFE100" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  RING CENTER PRESSURE (68% OCCUPANCY)
                </text>
              </g>
            ) : isSwimming ? (
              /* 50m Olympic Pool Lane */
              <g stroke="rgba(255, 225, 0, 0.25)" strokeWidth="2.5" fill="none">
                <rect x="60" y="70" width="880" height="480" />
                <line x1="60" y1="190" x2="940" y2="190" />
                <line x1="60" y1="310" x2="940" y2="310" />
                <line x1="60" y1="430" x2="940" y2="430" />
                <line x1="280" y1="60" x2="280" y2="560" stroke="#FFE100" strokeWidth="3" strokeDasharray="8 6" />
                <rect x="60" y="190" width="880" height="120" fill="url(#track-gradient)" opacity="0.35" />
                <text x="60" y="55" fill="#FFE100" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  DIVE BLOCKS
                </text>
                <text x="280" y="55" fill="#FFE100" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  15m DOLPHIN BREAKOUT (2.42 m/s)
                </text>
                <text x="940" y="55" textAnchor="end" fill="#F59E0B" fontSize="12" fontFamily="monospace" fontWeight="bold">
                  TURN WALL (1.86 kN EXPLOSION)
                </text>
              </g>
            ) : isBaseball ? (
              /* Baseball Diamond & 3x3 Strike Zone */
              <g stroke="rgba(255, 225, 0, 0.3)" strokeWidth="2.5" fill="none">
                <line x1="500" y1="530" x2="160" y2="120" />
                <line x1="500" y1="530" x2="840" y2="120" />
                <polygon points="500,530 620,410 500,290 380,410" stroke="#FFE100" strokeWidth="3" />
                <path d="M 220 180 Q 500 70 780 180" stroke="rgba(255,225,0,0.2)" strokeWidth="2" />
                <g transform="translate(730, 260)">
                  <rect width="160" height="180" fill="#111827" stroke="#FFE100" strokeWidth="2" />
                  <line x1="53" y1="0" x2="53" y2="180" stroke="rgba(255,225,0,0.4)" />
                  <line x1="106" y1="0" x2="106" y2="180" stroke="rgba(255,225,0,0.4)" />
                  <line x1="0" y1="60" x2="160" y2="60" stroke="rgba(255,225,0,0.4)" />
                  <line x1="0" y1="120" x2="160" y2="120" stroke="rgba(255,225,0,0.4)" />
                  <rect x="0" y="120" width="53" height="60" fill="rgba(255,225,0,0.45)" />
                  <text x="80" y="-12" textAnchor="middle" fill="#FFE100" fontSize="11" fontWeight="bold" fontFamily="monospace">
                    3×3 STRIKE TUNNEL
                  </text>
                </g>
                <circle cx="500" cy="220" r="70" fill="url(#heat-gold)" />
                <text x="500" y="220" textAnchor="middle" fill="#FFE100" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  SPRAY EXIT: 102 MPH
                </text>
              </g>
            ) : isCycling ? (
              /* Velodrome Banking (250m) */
              <g stroke="rgba(255, 225, 0, 0.3)" strokeWidth="3" fill="none">
                <rect x="140" y="110" width="720" height="400" rx="200" stroke="#334155" strokeWidth="12" />
                <rect x="110" y="80" width="780" height="460" rx="230" stroke="#ef4444" strokeWidth="3" />
                <rect x="80" y="50" width="840" height="520" rx="260" stroke="#38bdf8" strokeWidth="2" strokeDasharray="8 6" />
                <path d="M 200 460 Q 500 500 800 460" stroke="#FFE100" strokeWidth="6" fill="none" />
                <circle cx="800" cy="460" r="9" fill="#FFE100" stroke="#000" strokeWidth="2" />
                <text x="500" y="310" textAnchor="middle" fill="#FFE100" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  SPRINT POWER BURST: 1,184 WATTS @ 68.4 KM/H
                </text>
              </g>
            ) : isGymnastics ? (
              /* Gymnastics Spring Floor (12m x 12m) */
              <g stroke="rgba(255, 225, 0, 0.3)" strokeWidth="3" fill="none">
                <rect x="220" y="50" width="560" height="520" rx="6" />
                <rect x="250" y="80" width="500" height="460" strokeDasharray="6 6" />
                <line x1="250" y1="80" x2="750" y2="540" stroke="#FFE100" strokeWidth="3" strokeDasharray="10 8" />
                <circle cx="500" cy="310" r="85" fill="url(#heat-gold)" />
                <circle cx="730" cy="520" r="28" fill="rgba(163, 230, 53, 0.4)" stroke="#A3E635" strokeWidth="3" />
                <text x="500" y="295" textAnchor="middle" fill="#FFE100" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  TUMBLING APEX: 1.24m (5.8 rad/s)
                </text>
                <text x="730" y="570" textAnchor="middle" fill="#A3E635" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  STICK LANDING ZONE (r=0.22m)
                </text>
              </g>
            ) : (
              /* Basketball Court Geometry (Default) */
              <g stroke="rgba(255, 225, 0, 0.28)" strokeWidth="2.5" fill="none">
                <rect x="40" y="30" width="920" height="560" rx="10" />
                <line x1="500" y1="30" x2="500" y2="590" />
                <circle cx="500" cy="310" r="80" />
                {/* Left Key & 3-pt */}
                <rect x="40" y="210" width="180" height="200" />
                <circle cx="220" cy="310" r="70" strokeDasharray="8 6" />
                <path d="M 40 100 L 160 100 A 240 240 0 0 1 160 520 L 40 520" />
                {/* Right Key & 3-pt */}
                <rect x="780" y="210" width="180" height="200" />
                <circle cx="780" cy="310" r="70" strokeDasharray="8 6" />
                <path d="M 960 100 L 840 100 A 240 240 0 0 0 840 520 L 960 520" />
                {/* Glowing Density Blobs */}
                <circle cx="830" cy="310" r="115" fill="url(#heat-gold)" />
                <circle cx="750" cy="200" r="85" fill="url(#heat-secondary)" />
                <circle cx="830" cy="310" r="8" fill="#FFE100" stroke="#000" strokeWidth="2" />
                <text x="830" y="280" textAnchor="middle" fill="#FFE100" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  PAINT PENETRATION 42%
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Action Zones Metric Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            style={{
              background: isNanoBanana
                ? "rgba(16, 20, 30, 0.85)"
                : isCleanWhite
                  ? "#ffffff"
                  : isNavy
                    ? "rgba(6, 11, 20, 0.85)"
                    : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${
                isNanoBanana
                  ? "rgba(255, 225, 0, 0.16)"
                  : isCleanWhite
                    ? "#e2e8f0"
                    : isNavy
                      ? "rgba(56, 189, 248, 0.2)"
                      : "rgba(255, 255, 255, 0.08)"
              }`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: isNanoBanana
                  ? "#FFE100"
                  : isCleanWhite
                    ? "#64748b"
                    : isNavy
                      ? "#38bdf8"
                      : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {zone1Label}
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: isNanoBanana
                  ? "#ffffff"
                  : isCleanWhite
                    ? "#059669"
                    : "#10b981",
                marginTop: "4px",
              }}
            >
              {zone1Val}
            </div>
            <small
              style={{
                fontSize: "11px",
                color: isCleanWhite
                  ? "#64748b"
                  : "rgba(255,255,255,0.5)",
              }}
            >
              {zone1Desc}
            </small>
          </div>

          <div
            style={{
              background: isNanoBanana
                ? "rgba(16, 20, 30, 0.85)"
                : isCleanWhite
                  ? "#ffffff"
                  : isNavy
                    ? "rgba(6, 11, 20, 0.85)"
                    : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${
                isNanoBanana
                  ? "rgba(255, 225, 0, 0.16)"
                  : isCleanWhite
                    ? "#e2e8f0"
                    : isNavy
                      ? "rgba(56, 189, 248, 0.2)"
                      : "rgba(255, 255, 255, 0.08)"
              }`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: isNanoBanana
                  ? "#FFE100"
                  : isCleanWhite
                    ? "#64748b"
                    : isNavy
                      ? "#38bdf8"
                      : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {zone2Label}
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: isNanoBanana
                  ? "#ffffff"
                  : isCleanWhite
                    ? "#0284c7"
                    : "#22d3ee",
                marginTop: "4px",
              }}
            >
              {zone2Val}
            </div>
            <small
              style={{
                fontSize: "11px",
                color: isCleanWhite
                  ? "#64748b"
                  : "rgba(255,255,255,0.5)",
              }}
            >
              {zone2Desc}
            </small>
          </div>

          <div
            style={{
              background: isNanoBanana
                ? "rgba(16, 20, 30, 0.85)"
                : isCleanWhite
                  ? "#ffffff"
                  : isNavy
                    ? "rgba(6, 11, 20, 0.85)"
                    : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${
                isNanoBanana
                  ? "rgba(255, 225, 0, 0.16)"
                  : isCleanWhite
                    ? "#e2e8f0"
                    : isNavy
                      ? "rgba(56, 189, 248, 0.2)"
                      : "rgba(255, 255, 255, 0.08)"
              }`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: isNanoBanana
                  ? "#FFE100"
                  : isCleanWhite
                    ? "#64748b"
                    : isNavy
                      ? "#38bdf8"
                      : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {zone3Label}
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: isNanoBanana
                  ? "#ffffff"
                  : isCleanWhite
                    ? "#6366f1"
                    : "#818cf8",
                marginTop: "4px",
              }}
            >
              {zone3Val}
            </div>
            <small
              style={{
                fontSize: "11px",
                color: isCleanWhite
                  ? "#64748b"
                  : "rgba(255,255,255,0.5)",
              }}
            >
              {zone3Desc}
            </small>
          </div>

          <div
            style={{
              background: isNanoBanana
                ? "rgba(16, 20, 30, 0.85)"
                : isCleanWhite
                  ? "#ffffff"
                  : isNavy
                    ? "rgba(6, 11, 20, 0.85)"
                    : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${
                isNanoBanana
                  ? "rgba(255, 225, 0, 0.35)"
                  : isCleanWhite
                    ? "rgba(180, 83, 9, 0.3)"
                    : isNavy
                      ? "rgba(56, 189, 248, 0.3)"
                      : "rgba(251, 191, 36, 0.25)"
              }`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: isNanoBanana
                  ? "#FFE100"
                  : isCleanWhite
                    ? "#b45309"
                    : isNavy
                      ? "#38bdf8"
                      : "#FFE100",
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {zone4Label}
            </span>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: isCleanWhite
                  ? "#0f172a"
                  : "#ffffff",
                marginTop: "6px",
                lineHeight: "1.3",
              }}
            >
              {zone4Val}
            </div>
            <small
              style={{
                fontSize: "11px",
                color: isCleanWhite
                  ? "#64748b"
                  : "rgba(255,255,255,0.5)",
              }}
            >
              {zone4Desc}
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}
