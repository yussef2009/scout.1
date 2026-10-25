import React from "react"

interface PitchHeatmap2DProps {
  sport?: string
  athleteName?: string
  position?: string
  attackingThird?: number
  middleThird?: number
  defensiveThird?: number
  topSprintZone?: string
}

export const PitchHeatmap2D: React.FC<PitchHeatmap2DProps> = ({
  sport = "Basketball",
  athleteName = "Athlete",
  position = "Guard",
  attackingThird = 44,
  middleThird = 38,
  defensiveThird = 18,
  topSprintZone = "Perimeter Wing & Paint",
}) => {
  const normSport = (sport || "").toLowerCase()
  const isFootball = normSport.includes("foot") || normSport.includes("soccer")
  const isTennis = normSport.includes("tennis") || normSport.includes("padel")

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        padding: "24px",
        marginTop: "24px",
        backdropFilter: "blur(14px)",
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
              color: "var(--gold-bright, #fbbf24)",
              textTransform: "uppercase",
            }}
          >
            SPATIAL &amp; KINEMATIC TELEMETRY
          </span>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "4px 0 2px",
            }}
          >
            2D Tactical Pitch Heatmap &amp; Action Zones
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Positional density distribution for <strong>{athleteName}</strong> ({position})
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 8px #10b981",
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>
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
            background: isFootball
              ? "radial-gradient(ellipse at center, #0e3022 0%, #061710 100%)"
              : isTennis
                ? "radial-gradient(ellipse at center, #0f2744 0%, #081324 100%)"
                : "radial-gradient(ellipse at center, #27160c 0%, #120904 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
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
              <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.65" />
                <stop offset="75%" stopColor="#22d3ee" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-mid" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
            </defs>

            {isFootball ? (
              /* Soccer Pitch Geometry */
              <g stroke="rgba(255, 255, 255, 0.22)" strokeWidth="3" fill="none">
                <rect x="40" y="30" width="920" height="560" />
                <line x1="500" y1="30" x2="500" y2="590" />
                <circle cx="500" cy="310" r="90" />
                <circle cx="500" cy="310" r="4" fill="rgba(255,255,255,0.4)" />
                {/* Left Penalty Box */}
                <rect x="40" y="160" width="160" height="300" />
                <rect x="40" y="230" width="60" height="160" />
                {/* Right Penalty Box */}
                <rect x="800" y="160" width="160" height="300" />
                <rect x="900" y="230" width="60" height="160" />
              </g>
            ) : isTennis ? (
              /* Tennis Court Geometry */
              <g stroke="rgba(255, 255, 255, 0.22)" strokeWidth="3" fill="none">
                <rect x="60" y="40" width="880" height="540" />
                <line x1="500" y1="30" x2="500" y2="590" strokeWidth="4" stroke="rgba(255,255,255,0.4)" />
                <line x1="200" y1="40" x2="200" y2="580" />
                <line x1="800" y1="40" x2="800" y2="580" />
                <line x1="200" y1="310" x2="800" y2="310" />
              </g>
            ) : (
              /* Basketball Court Geometry */
              <g stroke="rgba(255, 255, 255, 0.22)" strokeWidth="3" fill="none">
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
              </g>
            )}

            {/* Glowing Spatial Density Heat Blobs */}
            <circle cx="760" cy="290" r="130" fill="url(#heat-high)" />
            <circle cx="680" cy="370" r="100" fill="url(#heat-mid)" />
            <circle cx="550" cy="270" r="90" fill="url(#heat-mid)" />
            <circle cx="420" cy="340" r="80" fill="url(#heat-mid)" opacity="0.6" />
            <circle cx="830" cy="200" r="75" fill="url(#heat-high)" opacity="0.75" />

            {/* Highlight Marker */}
            <circle cx="760" cy="290" r="9" fill="#fbbf24" stroke="#ffffff" strokeWidth="3" />
            <text
              x="760"
              y="265"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="16"
              fontWeight="bold"
              fontFamily="Outfit, sans-serif"
            >
              PEAK TOUCH HUB
            </text>
          </svg>
        </div>

        {/* Action Zones Metric Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
              ATTACKING THIRD
            </span>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#10b981",
                marginTop: "4px",
              }}
            >
              {attackingThird}%
            </div>
            <small style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              High-leverage paint touches
            </small>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
              MIDDLE THIRD
            </span>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#22d3ee",
                marginTop: "4px",
              }}
            >
              {middleThird}%
            </div>
            <small style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              Transition &amp; court circulation
            </small>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
              DEFENSIVE THIRD
            </span>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#818cf8",
                marginTop: "4px",
              }}
            >
              {defensiveThird}%
            </div>
            <small style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              Recovery &amp; rim protection
            </small>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(251, 191, 36, 0.25)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 600 }}>
              TOP SPRINT CORRIDOR
            </span>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#ffffff",
                marginTop: "6px",
                lineHeight: "1.3",
              }}
            >
              {topSprintZone}
            </div>
            <small style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
              Peak acceleration corridor
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}
