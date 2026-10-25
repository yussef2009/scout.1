import React from "react"
import type { DetectedPlayer } from "../video-analysis"

interface BoundingBoxOverlayProps {
  players: DetectedPlayer[]
  selectedPlayerId?: string | null
  onSelectPlayer?: (player: DetectedPlayer) => void
  visible?: boolean
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  visible = true,
}) => {
  if (!visible || !players || players.length === 0) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 select-none overflow-hidden"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="box-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="box-glow-gold" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {players.map((p, idx) => {
        // Use normalized bbox [ymin, xmin, ymax, xmax] 0-1000, or generate staggered tactical box
        const rawBox = p.bbox || [
          220 + (idx % 3) * 160,
          140 + idx * 220,
          680 + (idx % 2) * 80,
          340 + idx * 220,
        ]
        const ymin = Math.max(0, Math.min(1000, rawBox[0]))
        const xmin = Math.max(0, Math.min(1000, rawBox[1]))
        const ymax = Math.max(ymin + 80, Math.min(1000, rawBox[2]))
        const xmax = Math.max(xmin + 60, Math.min(1000, rawBox[3]))
        const w = xmax - xmin
        const h = ymax - ymin

        const isSelected = selectedPlayerId === p.id
        const strokeColor = isSelected
          ? "#fbbf24"
          : p.teamColorHex || (idx % 2 === 0 ? "#22d3ee" : "#818cf8")

        return (
          <g
            key={p.id}
            className="cursor-pointer pointer-events-auto transition-transform duration-150"
            onClick={(e) => {
              e.stopPropagation()
              onSelectPlayer?.(p)
            }}
          >
            {/* Main Bounding Box */}
            <rect
              x={xmin}
              y={ymin}
              width={w}
              height={h}
              fill={isSelected ? "rgba(251, 191, 36, 0.18)" : "rgba(34, 211, 238, 0.08)"}
              stroke={strokeColor}
              strokeWidth={isSelected ? 5 : 3}
              strokeDasharray={isSelected ? "none" : "8 4"}
              rx={10}
              filter={isSelected ? "url(#box-glow-gold)" : "url(#box-glow-cyan)"}
            />

            {/* Corner Targeting Accents */}
            <path
              d={`M ${xmin} ${ymin + 24} L ${xmin} ${ymin} L ${xmin + 24} ${ymin}`}
              stroke={strokeColor}
              strokeWidth={isSelected ? 6 : 4}
              fill="none"
            />
            <path
              d={`M ${xmax - 24} ${ymin} L ${xmax} ${ymin} L ${xmax} ${ymin + 24}`}
              stroke={strokeColor}
              strokeWidth={isSelected ? 6 : 4}
              fill="none"
            />
            <path
              d={`M ${xmin} ${ymax - 24} L ${xmin} ${ymax} L ${xmin + 24} ${ymax}`}
              stroke={strokeColor}
              strokeWidth={isSelected ? 6 : 4}
              fill="none"
            />
            <path
              d={`M ${xmax - 24} ${ymax} L ${xmax} ${ymax} L ${xmax} ${ymax - 24}`}
              stroke={strokeColor}
              strokeWidth={isSelected ? 6 : 4}
              fill="none"
            />

            {/* Header Badge: Number & Label */}
            <rect
              x={xmin}
              y={Math.max(8, ymin - 46)}
              width={Math.min(320, Math.max(140, p.label.length * 16 + 80))}
              height={42}
              fill="rgba(7, 11, 24, 0.92)"
              stroke={strokeColor}
              strokeWidth={2}
              rx={6}
            />
            <circle
              cx={xmin + 18}
              cy={Math.max(8, ymin - 46) + 21}
              r={6}
              fill={strokeColor}
            />
            <text
              x={xmin + 34}
              y={Math.max(8, ymin - 46) + 27}
              fill="#ffffff"
              fontSize="22"
              fontWeight="bold"
              fontFamily="Outfit, sans-serif"
            >
              {p.jerseyNumber ? `#${p.jerseyNumber} ` : ""}
              {p.label} · {p.position || "Athlete"}
            </text>

            {/* Confidence / Quality Pill */}
            {p.confidence > 0 && (
              <text
                x={xmax - 6}
                y={ymax - 12}
                textAnchor="end"
                fill={strokeColor}
                fontSize="18"
                fontWeight="bold"
                fontFamily="Outfit, sans-serif"
              >
                {p.confidence}% CONF
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
