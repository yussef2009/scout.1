import React from "react"

interface SportBackgroundProps {
  sport: string
  theme: string
}

export default function SportBackground({ sport, theme }: SportBackgroundProps) {
  const isLight = theme === "Light"
  const isMidnight = theme === "Midnight"
  const isCyber = theme === "Cyber"
  const isOled = theme === "OLED"

  const strokeColor = isLight
    ? "rgba(15, 23, 42, 0.08)"
    : isMidnight
      ? "rgba(56, 189, 248, 0.12)"
      : isCyber
        ? "rgba(16, 185, 129, 0.12)"
        : isOled
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(212, 175, 55, 0.12)"

  const strokeAccent = isLight
    ? "rgba(180, 83, 9, 0.22)"
    : isMidnight
      ? "rgba(56, 189, 248, 0.28)"
      : isCyber
        ? "rgba(16, 185, 129, 0.28)"
        : isOled
          ? "rgba(255, 255, 255, 0.25)"
          : "rgba(255, 215, 0, 0.28)"

  const strokeSubtle = isLight
    ? "rgba(15, 23, 42, 0.04)"
    : isMidnight
      ? "rgba(56, 189, 248, 0.05)"
      : isCyber
        ? "rgba(16, 185, 129, 0.05)"
        : isOled
          ? "rgba(255, 255, 255, 0.04)"
          : "rgba(255, 255, 255, 0.05)"

  const ballFill = isLight
    ? "rgba(255, 255, 255, 0.6)"
    : isMidnight
      ? "rgba(11, 19, 34, 0.6)"
      : isCyber
        ? "rgba(9, 20, 14, 0.6)"
        : isOled
          ? "rgba(5, 5, 5, 0.6)"
          : "rgba(18, 18, 22, 0.5)"

  // Render sport-specific court/field and ball watermark
  const renderSportGraphic = () => {
    switch (sport) {
      case "Volleyball":
        return (
          <>
            {/* Volleyball Court Layout */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Outer boundary 18m x 9m ratio */}
              <rect x="200" y="150" width="800" height="400" rx="4" strokeWidth="2" stroke={strokeAccent} />
              {/* Center Net Line */}
              <line x1="600" y1="130" x2="600" y2="570" strokeWidth="2.5" stroke={strokeAccent} strokeDasharray="8 4" />
              {/* Attack Lines (3m from center) */}
              <line x1="450" y1="150" x2="450" y2="550" strokeWidth="1.5" stroke={strokeColor} />
              <line x1="750" y1="150" x2="750" y2="550" strokeWidth="1.5" stroke={strokeColor} />
              {/* Service zone markers */}
              <line x1="200" y1="135" x2="200" y2="150" strokeWidth="1.5" stroke={strokeAccent} />
              <line x1="1000" y1="135" x2="1000" y2="150" strokeWidth="1.5" stroke={strokeAccent} />
              {/* Net Antenna Posts */}
              <circle cx="600" cy="130" r="4" fill={strokeAccent} />
              <circle cx="600" cy="570" r="4" fill={strokeAccent} />
              {/* Defense zone grid */}
              <line x1="200" y1="350" x2="450" y2="350" stroke={strokeSubtle} strokeDasharray="4 6" />
              <line x1="750" y1="350" x2="1000" y2="350" stroke={strokeSubtle} strokeDasharray="4 6" />
            </svg>

            {/* Stylized Volleyball Watermark */}
            <svg
              className="sport-bg-watermark volleyball-ball"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.2"
            >
              {/* Outer Ball Sphere */}
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeAccent} strokeWidth="3" />
              {/* Inner Seam Curve Panel 1 (Top Left Section) */}
              <path d="M 200 30 C 130 90, 90 140, 30 200" />
              <path d="M 235 34 C 170 100, 110 160, 44 235" strokeDasharray="6 3" />
              <path d="M 165 34 C 100 90, 70 140, 34 165" />

              {/* Panel 2 (Right Curved Swirl) */}
              <path d="M 200 30 C 270 90, 310 140, 370 200" />
              <path d="M 235 366 C 300 300, 340 250, 370 200" />
              <path d="M 200 370 C 140 310, 90 270, 30 200" />

              {/* Panel 3 (Signature 3-Stripes Wave) */}
              <path d="M 100 100 C 170 160, 230 240, 300 300" strokeWidth="2.5" />
              <path d="M 120 80 C 190 140, 250 220, 320 280" />
              <path d="M 80 120 C 150 180, 210 260, 280 320" />

              {/* Biomechanical rotation coordinate ring */}
              <circle cx="200" cy="200" r="188" stroke={strokeSubtle} strokeDasharray="8 8" />
              {/* Trajectory flight arrow */}
              <path d="M 330 70 Q 380 120, 360 200" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </>
        )

      case "Basketball":
        return (
          <>
            {/* Basketball Court Key & 3-Point Arc */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Half court boundary */}
              <rect x="150" y="80" width="900" height="640" strokeWidth="2" stroke={strokeAccent} />
              {/* Center court circle */}
              <circle cx="600" cy="80" r="110" strokeWidth="2" stroke={strokeAccent} />
              {/* The Key (Paint area) */}
              <rect x="460" y="440" width="280" height="280" strokeWidth="2" />
              {/* Free throw circle */}
              <circle cx="600" cy="440" r="90" strokeWidth="1.8" strokeDasharray="6 4" />
              {/* 3-Point Arc */}
              <path d="M 280 720 L 280 560 A 360 360 0 0 1 920 560 L 920 720" strokeWidth="2.2" stroke={strokeAccent} />
              {/* Restricted Area Arc */}
              <path d="M 540 720 A 60 60 0 0 1 660 720" strokeWidth="1.5" />
              {/* Backboard & Rim */}
              <line x1="560" y1="695" x2="640" y2="695" strokeWidth="3" stroke={strokeAccent} />
              <circle cx="600" cy="680" r="14" strokeWidth="2" stroke={strokeAccent} />
            </svg>

            {/* Stylized Basketball Watermark */}
            <svg
              className="sport-bg-watermark basketball-ball"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.4"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeAccent} strokeWidth="3" />
              {/* Vertical seam */}
              <line x1="200" y1="30" x2="200" y2="370" strokeWidth="2.5" />
              {/* Horizontal equator */}
              <line x1="30" y1="200" x2="370" y2="200" strokeWidth="2.5" />
              {/* Left Rib Curve */}
              <path d="M 80 55 C 160 120, 160 280, 80 345" strokeWidth="2.5" />
              {/* Right Rib Curve */}
              <path d="M 320 55 C 240 120, 240 280, 320 345" strokeWidth="2.5" />
              {/* Kinematic tracking circle */}
              <circle cx="200" cy="200" r="190" stroke={strokeSubtle} strokeDasharray="10 6" />
            </svg>
          </>
        )

      case "Soccer":
        return (
          <>
            {/* Soccer Pitch Layout */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Pitch boundary */}
              <rect x="120" y="80" width="960" height="640" strokeWidth="2" stroke={strokeAccent} />
              {/* Half-line */}
              <line x1="600" y1="80" x2="600" y2="720" strokeWidth="2" stroke={strokeAccent} />
              {/* Center Circle & Spot */}
              <circle cx="600" cy="400" r="110" strokeWidth="2" stroke={strokeAccent} />
              <circle cx="600" cy="400" r="5" fill={strokeAccent} />
              {/* Penalty Box Left */}
              <rect x="120" y="230" width="180" height="340" strokeWidth="2" />
              {/* Goal Area Left */}
              <rect x="120" y="310" width="70" height="180" strokeWidth="1.5" />
              {/* Penalty Spot Left & Arc */}
              <circle cx="240" cy="400" r="4" fill={strokeAccent} />
              <path d="M 300 330 A 100 100 0 0 1 300 470" strokeWidth="1.8" />
              {/* Corner Arcs */}
              <path d="M 120 110 A 30 30 0 0 1 150 80" strokeWidth="1.5" />
              <path d="M 120 690 A 30 30 0 0 0 150 720" strokeWidth="1.5" />
              <path d="M 1080 110 A 30 30 0 0 0 1050 80" strokeWidth="1.5" />
              <path d="M 1080 690 A 30 30 0 0 1 1050 720" strokeWidth="1.5" />
            </svg>

            {/* Stylized Soccer Ball Watermark */}
            <svg
              className="sport-bg-watermark soccer-ball"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.2"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeAccent} strokeWidth="3" />
              {/* Center Pentagon */}
              <polygon points="200,150 245,185 228,238 172,238 155,185" fill={isLight ? "rgba(180,83,9,0.12)" : "rgba(212,175,55,0.18)"} strokeWidth="2.5" />
              {/* Radiating Hexagon lines */}
              <line x1="200" y1="150" x2="200" y2="85" />
              <line x1="245" y1="185" x2="305" y2="165" />
              <line x1="228" y1="238" x2="270" y2="295" />
              <line x1="172" y1="238" x2="130" y2="295" />
              <line x1="155" y1="185" x2="95" y2="165" />
              {/* Outer boundary polygons */}
              <path d="M 200 85 L 140 50 M 200 85 L 260 50" />
              <path d="M 305 165 L 355 120 M 305 165 L 345 225" />
              <path d="M 270 295 L 335 315 M 270 295 L 235 360" />
              <path d="M 130 295 L 65 315 M 130 295 L 165 360" />
              <path d="M 95 165 L 45 120 M 95 165 L 55 225" />
              <circle cx="200" cy="200" r="188" stroke={strokeSubtle} strokeDasharray="6 8" />
            </svg>
          </>
        )

      case "Tennis":
        return (
          <>
            {/* Tennis Court Geometry */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Outer Doubles Baseline */}
              <rect x="180" y="140" width="840" height="520" strokeWidth="2.2" stroke={strokeAccent} />
              {/* Singles Sidelines */}
              <line x1="180" y1="200" x2="1020" y2="200" strokeWidth="1.5" />
              <line x1="180" y1="600" x2="1020" y2="600" strokeWidth="1.5" />
              {/* Net Center Line */}
              <line x1="600" y1="110" x2="600" y2="690" strokeWidth="2.8" stroke={strokeAccent} />
              {/* Service Lines */}
              <line x1="390" y1="200" x2="390" y2="600" strokeWidth="1.8" />
              <line x1="810" y1="200" x2="810" y2="600" strokeWidth="1.8" />
              {/* Center Service Line */}
              <line x1="390" y1="400" x2="810" y2="400" strokeWidth="1.8" />
              {/* Center Baseline Marks */}
              <line x1="180" y1="400" x2="195" y2="400" strokeWidth="2" stroke={strokeAccent} />
              <line x1="1020" y1="400" x2="1005" y2="400" strokeWidth="2" stroke={strokeAccent} />
            </svg>

            {/* Tennis Ball Watermark with Continuous Curved Seam */}
            <svg
              className="sport-bg-watermark tennis-ball"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.6"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeAccent} strokeWidth="3" />
              {/* Top Curved Seam Arc */}
              <path d="M 65 110 C 130 110, 150 45, 230 45 C 310 45, 335 120, 335 200" />
              {/* Bottom Inverted Seam Arc */}
              <path d="M 335 290 C 270 290, 250 355, 170 355 C 90 355, 65 280, 65 200" />
              {/* Spin vector circles */}
              <circle cx="200" cy="200" r="190" stroke={strokeSubtle} strokeDasharray="12 6" />
            </svg>
          </>
        )

      case "Baseball":
        return (
          <>
            {/* Baseball Diamond Layout */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Foul lines */}
              <line x1="600" y1="650" x2="180" y2="230" strokeWidth="2" stroke={strokeAccent} />
              <line x1="600" y1="650" x2="1020" y2="230" strokeWidth="2" stroke={strokeAccent} />
              {/* Infield Diamond square rotated 45 deg */}
              <polygon points="600,650 780,470 600,290 420,470" strokeWidth="2" />
              {/* Pitcher's Mound */}
              <circle cx="600" cy="470" r="38" strokeWidth="1.8" />
              <rect x="592" y="466" width="16" height="8" fill={strokeAccent} />
              {/* Home Plate */}
              <polygon points="595,655 605,655 608,647 600,640 592,647" fill={strokeAccent} />
              {/* Bases */}
              <rect x="772" y="462" width="16" height="16" transform="rotate(45 780 470)" fill={strokeAccent} />
              <rect x="592" y="282" width="16" height="16" transform="rotate(45 600 290)" fill={strokeAccent} />
              <rect x="412" y="462" width="16" height="16" transform="rotate(45 420 470)" fill={strokeAccent} />
              {/* Outfield arc */}
              <path d="M 280 330 A 500 500 0 0 1 920 330" strokeWidth="2" strokeDasharray="6 4" stroke={strokeAccent} />
            </svg>

            {/* Baseball Watermark with Red-accent Horseshoe Stitches */}
            <svg
              className="sport-bg-watermark baseball-ball"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.2"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeAccent} strokeWidth="3" />
              {/* Left Seam Horseshoe */}
              <path d="M 110 50 C 170 110, 170 290, 110 350" strokeWidth="2.5" />
              {/* Right Seam Horseshoe */}
              <path d="M 290 50 C 230 110, 230 290, 290 350" strokeWidth="2.5" />
              {/* Left Stitch Marks */}
              <line x1="100" y1="80" x2="124" y2="76" />
              <line x1="120" y1="120" x2="144" y2="114" />
              <line x1="135" y1="160" x2="158" y2="156" />
              <line x1="140" y1="200" x2="164" y2="200" />
              <line x1="135" y1="240" x2="158" y2="244" />
              <line x1="120" y1="280" x2="144" y2="286" />
              <line x1="100" y1="320" x2="124" y2="324" />
              {/* Right Stitch Marks */}
              <line x1="300" y1="80" x2="276" y2="76" />
              <line x1="280" y1="120" x2="256" y2="114" />
              <line x1="265" y1="160" x2="242" y2="156" />
              <line x1="260" y1="200" x2="236" y2="200" />
              <line x1="265" y1="240" x2="242" y2="244" />
              <line x1="280" y1="280" x2="256" y2="286" />
              <line x1="300" y1="320" x2="276" y2="324" />
            </svg>
          </>
        )

      case "Boxing":
        return (
          <>
            {/* Boxing Ring Geometry */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Ring Apron Square */}
              <rect x="250" y="100" width="700" height="600" strokeWidth="2.5" stroke={strokeAccent} />
              {/* Ropes inner boundaries (3 concentric squares) */}
              <rect x="280" y="130" width="640" height="540" strokeWidth="1.8" />
              <rect x="310" y="160" width="580" height="480" strokeWidth="1.5" strokeDasharray="8 4" />
              <rect x="340" y="190" width="520" height="420" strokeWidth="1.2" stroke={strokeSubtle} />
              {/* Ring Corner Posts (Red, Blue, Neutral) */}
              <circle cx="280" cy="130" r="14" fill="rgba(239,68,68,0.4)" stroke="#ef4444" strokeWidth="2" />
              <circle cx="920" cy="670" r="14" fill="rgba(59,130,246,0.4)" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="920" cy="130" r="12" fill={strokeAccent} />
              <circle cx="280" cy="670" r="12" fill={strokeAccent} />
              {/* Canvas Center Markings */}
              <circle cx="600" cy="400" r="80" strokeWidth="2" stroke={strokeAccent} />
              <line x1="560" y1="400" x2="640" y2="400" strokeWidth="2" />
              <line x1="600" y1="360" x2="600" y2="440" strokeWidth="2" />
            </svg>

            {/* Boxing Glove Impact Watermark */}
            <svg
              className="sport-bg-watermark boxing-glove"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.2"
            >
              {/* Glove Body Profile */}
              <path
                d="M 140 100 C 220 70, 290 120, 280 210 C 275 250, 240 280, 210 300 L 160 300 C 130 270, 110 210, 110 160 C 110 120, 120 105, 140 100 Z"
                fill={ballFill}
                strokeWidth="2.8"
              />
              {/* Thumb compartment */}
              <path d="M 120 170 C 80 180, 75 240, 130 250" strokeWidth="2.4" />
              {/* Wrist cuff & Laces */}
              <rect x="150" y="300" width="70" height="50" rx="4" strokeWidth="2.2" />
              <line x1="160" y1="315" x2="210" y2="315" strokeDasharray="4 4" />
              <line x1="160" y1="330" x2="210" y2="330" strokeDasharray="4 4" />
              {/* Impact shockwave ripple rings */}
              <circle cx="270" cy="160" r="40" stroke={strokeAccent} strokeDasharray="6 4" />
              <circle cx="270" cy="160" r="70" stroke={strokeSubtle} strokeDasharray="8 6" />
              <circle cx="270" cy="160" r="100" stroke={strokeSubtle} strokeDasharray="10 8" />
            </svg>
          </>
        )

      case "Swimming":
        return (
          <>
            {/* Olympic Pool Lane Lines */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Pool Perimeter */}
              <rect x="100" y="100" width="1000" height="600" strokeWidth="2.5" stroke={strokeAccent} />
              {/* 8 Swimming Lanes */}
              {Array.from({ length: 7 }).map((_, i) => {
                const y = 100 + (600 / 8) * (i + 1)
                return (
                  <line
                    key={i}
                    x1="100"
                    y1={y}
                    x2="1100"
                    y2={y}
                    strokeWidth="1.8"
                    strokeDasharray={i % 2 === 0 ? "12 4" : "6 4"}
                    stroke={i === 3 ? strokeAccent : strokeColor}
                  />
                )
              })}
              {/* 5m Backstroke Flag line */}
              <line x1="250" y1="100" x2="250" y2="700" strokeWidth="1.5" strokeDasharray="4 6" stroke={strokeAccent} />
              <line x1="950" y1="100" x2="950" y2="700" strokeWidth="1.5" strokeDasharray="4 6" stroke={strokeAccent} />
              {/* Turning Wall T-targets */}
              <line x1="150" y1="140" x2="150" y2="200" strokeWidth="2" />
              <line x1="1050" y1="140" x2="1050" y2="200" strokeWidth="2" />
            </svg>

            {/* Hydrodynamic Fluid Waves Watermark */}
            <svg
              className="sport-bg-watermark swimming-waves"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.4"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeSubtle} />
              {/* Flow waveform curves */}
              <path d="M 40 140 Q 120 80, 200 140 T 360 140" strokeWidth="2.8" />
              <path d="M 40 180 Q 120 120, 200 180 T 360 180" strokeWidth="2.5" />
              <path d="M 40 220 Q 120 160, 200 220 T 360 220" strokeWidth="2.2" />
              <path d="M 40 260 Q 120 200, 200 260 T 360 260" strokeWidth="1.8" />
              {/* Streamline vector */}
              <circle cx="200" cy="200" r="188" stroke={strokeAccent} strokeDasharray="14 8" />
            </svg>
          </>
        )

      case "Track & Field":
        return (
          <>
            {/* Running Track Staves Layout */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Oval 400m Track Staves */}
              {Array.from({ length: 6 }).map((_, i) => {
                const rx = 440 + i * 24
                const ry = 220 + i * 24
                return (
                  <ellipse
                    key={i}
                    cx="600"
                    cy="400"
                    rx={rx}
                    ry={ry}
                    strokeWidth={i === 0 ? "2.2" : "1.4"}
                    stroke={i === 0 ? strokeAccent : strokeColor}
                  />
                )
              })}
              {/* Staggered Start Lines & Finish Line */}
              <line x1="600" y1="160" x2="600" y2="40" strokeWidth="3" stroke={strokeAccent} />
              <line x1="630" y1="162" x2="630" y2="60" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="660" y1="166" x2="660" y2="80" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Infield Field Events lines */}
              <circle cx="600" cy="400" r="60" stroke={strokeSubtle} strokeDasharray="6 4" />
            </svg>

            {/* Sprint Velocity Watermark */}
            <svg
              className="sport-bg-watermark track-sprint"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.4"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeSubtle} />
              {/* Speed burst arcs */}
              <path d="M 60 200 A 140 140 0 0 1 340 200" strokeWidth="3" />
              <path d="M 80 230 A 120 120 0 0 1 320 230" strokeWidth="2.5" />
              <path d="M 100 260 A 100 100 0 0 1 300 260" strokeWidth="2" />
              {/* Stopwatch ticks */}
              <circle cx="200" cy="200" r="188" stroke={strokeAccent} strokeDasharray="4 16" />
            </svg>
          </>
        )

      case "Cycling":
        return (
          <>
            {/* Velodrome Banking Curves */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Velodrome Banked Oval */}
              <ellipse cx="600" cy="400" rx="480" ry="260" strokeWidth="3" stroke={strokeAccent} />
              <ellipse cx="600" cy="400" rx="440" ry="220" strokeWidth="1.8" />
              <ellipse cx="600" cy="400" rx="400" ry="180" strokeWidth="1.5" strokeDasharray="8 4" />
              {/* Côte d'azur (Blue Band) */}
              <ellipse cx="600" cy="400" rx="360" ry="140" strokeWidth="2" stroke="#38bdf8" strokeDasharray="4 4" />
              {/* Pursuit and Finish lines */}
              <line x1="600" y1="140" x2="600" y2="40" strokeWidth="3" stroke="#ef4444" />
              <line x1="600" y1="660" x2="600" y2="760" strokeWidth="3" stroke="#ef4444" />
            </svg>

            {/* Aerodynamic Bike Wheel Watermark */}
            <svg
              className="sport-bg-watermark cycling-wheel"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.2"
            >
              {/* Outer Tire & Rim */}
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeAccent} strokeWidth="3.5" />
              <circle cx="200" cy="200" r="150" strokeWidth="1.8" />
              {/* Hub */}
              <circle cx="200" cy="200" r="24" fill={isLight ? "#e2e8f0" : "#27272a"} strokeWidth="2" />
              {/* Radiating Aerodynamic Spokes */}
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 360) / 16
                const rad = (angle * Math.PI) / 180
                const x2 = 200 + 150 * Math.cos(rad)
                const y2 = 200 + 150 * Math.sin(rad)
                return <line key={i} x1="200" y1="200" x2={x2} y2={y2} strokeWidth="1.2" stroke={strokeColor} />
              })}
              <circle cx="200" cy="200" r="188" stroke={strokeSubtle} strokeDasharray="8 8" />
            </svg>
          </>
        )

      case "Gymnastics":
      default:
        return (
          <>
            {/* Gymnastics 12m Mat Matrix & Kinematic Axes */}
            <svg
              className="sport-bg-court"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            >
              {/* Floor Exercise 12m x 12m Mat boundary */}
              <rect x="250" y="100" width="700" height="600" strokeWidth="2.2" stroke={strokeAccent} />
              <rect x="280" y="130" width="640" height="540" strokeWidth="1.5" strokeDasharray="8 4" />
              {/* Center Diagonal axes */}
              <line x1="250" y1="100" x2="950" y2="700" strokeWidth="1.2" strokeDasharray="4 6" />
              <line x1="950" y1="100" x2="250" y2="700" strokeWidth="1.2" strokeDasharray="4 6" />
              {/* Concentric angular landing circles */}
              <circle cx="600" cy="400" r="120" strokeWidth="1.8" stroke={strokeAccent} />
              <circle cx="600" cy="400" r="60" strokeWidth="1.4" strokeDasharray="4 4" />
            </svg>

            {/* Rotational Kinematics Watermark */}
            <svg
              className="sport-bg-watermark gymnastics-spin"
              viewBox="0 0 400 400"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="2.4"
            >
              <circle cx="200" cy="200" r="170" fill={ballFill} stroke={strokeSubtle} />
              {/* Multi-axis rotation arcs */}
              <ellipse cx="200" cy="200" rx="140" ry="70" strokeWidth="2.6" transform="rotate(25 200 200)" />
              <ellipse cx="200" cy="200" rx="140" ry="70" strokeWidth="2.2" transform="rotate(-40 200 200)" />
              <circle cx="200" cy="200" r="188" stroke={strokeAccent} strokeDasharray="8 12" />
            </svg>
          </>
        )
    }
  }

  return (
    <aside
      className={`sport-bg-container sport-bg-${sport.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      aria-hidden="true"
    >
      {/* Dynamic Ambient Color Aura tailored to the active sport */}
      <div className="sport-bg-ambient-aura" />

      {/* Sport Graphic (Court Geometry + High-Resolution Ball Watermark) */}
      <div className="sport-bg-graphics-layer">
        {renderSportGraphic()}
      </div>

      {/* Subtle Biomechanical Grid Matrix */}
      <div className="sport-bg-tech-grid" />
    </aside>
  )
}
