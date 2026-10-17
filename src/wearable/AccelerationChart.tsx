import React, { useMemo, useState } from "react"
import type { ChartDataPoint, ConnectionStatus } from "./wearable.types"

interface AccelerationChartProps {
  data: ChartDataPoint[]
  status: ConnectionStatus
  latestMagnitude: number | null
  unit?: string
}

export function AccelerationChart({
  data,
  status,
  latestMagnitude,
  unit = "m/s²",
}: AccelerationChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null)

  // Chart Dimensions & Padding
  const width = 800
  const height = 260
  const padding = { top: 24, right: 30, bottom: 36, left: 50 }

  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  // Min and Max Y calculations with padding and gravity reference
  const { minY, maxY, points, pathD, areaD, gravityY, avgMagnitude } =
    useMemo(() => {
      if (data.length === 0) {
        return {
          minY: 0,
          maxY: 20,
          points: [],
          pathD: "",
          areaD: "",
          gravityY: null,
          avgMagnitude: 0,
        }
      }

      const magnitudes = data.map((d) => d.magnitude)
      const rawMin = Math.min(...magnitudes)
      const rawMax = Math.max(...magnitudes)
      const sum = magnitudes.reduce((a, b) => a + b, 0)
      const avg = sum / magnitudes.length

      // Provide comfortable bounds around data and include 9.81 m/s² reference
      const calculatedMin = Math.max(0, Math.floor(Math.min(rawMin, 7) - 1))
      const calculatedMax = Math.ceil(Math.max(rawMax, 12) + 2)

      const rangeY = calculatedMax - calculatedMin || 1

      // Map each data point to SVG coordinates
      const mapped = data.map((d, index) => {
        const x =
          padding.left + (index / Math.max(1, data.length - 1)) * plotWidth
        const normalizedY = (d.magnitude - calculatedMin) / rangeY
        const y = padding.top + plotHeight - normalizedY * plotHeight
        return { x, y, raw: d }
      })

      // Create SVG Path for stroke line
      const linePath = mapped.reduce(
        (acc, pt, idx) =>
          idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
        "",
      )

      // Create SVG Path for filled gradient area
      const baselineY = padding.top + plotHeight
      const areaPath =
        mapped.length > 0
          ? `${linePath} L ${mapped[mapped.length - 1].x} ${baselineY} L ${mapped[0].x} ${baselineY} Z`
          : ""

      // 1G Reference gravity line at 9.81 m/s²
      const normGravity = (9.81 - calculatedMin) / rangeY
      const gY =
        normGravity >= 0 && normGravity <= 1
          ? padding.top + plotHeight - normGravity * plotHeight
          : null

      return {
        minY: calculatedMin,
        maxY: calculatedMax,
        points: mapped,
        pathD: linePath,
        areaD: areaPath,
        gravityY: gY,
        avgMagnitude: avg,
      }
    }, [data, padding.left, padding.right, padding.top, plotHeight, plotWidth])

  // Y-axis grid ticks (4-5 intervals)
  const yTicks = useMemo(() => {
    const ticks: { value: number y: number }[] = []
    const count = 4
    const step = (maxY - minY) / count
    for (let i = 0; i <= count; i++) {
      const val = Number((minY + i * step).toFixed(1))
      const norm = (val - minY) / (maxY - minY || 1)
      const y = padding.top + plotHeight - norm * plotHeight
      ticks.push({ value: val, y })
    }
    return ticks
  }, [minY, maxY, padding.top, plotHeight])

  // X-axis time marks from start, middle, and end of the rolling window
  const timeLabels = useMemo(() => {
    if (data.length < 2) return []
    return [
      { text: data[0].timeLabel, x: padding.left },
      {
        text: data[Math.floor(data.length / 2)].timeLabel,
        x: padding.left + plotWidth / 2,
      },
      { text: data[data.length - 1].timeLabel, x: padding.left + plotWidth },
    ]
  }, [data, padding.left, plotWidth])

  const isConnected = status === "connected"
  const isEmpty = data.length === 0

  return (
    <div className="wearable-chart-card">
      <div className="card-header chart-header">
        <div>
          <span className="section-kicker">KINEMATIC TELEMETRY</span>
          <h2>TOTAL ACCELERATION MAGNITUDE OVER TIME</h2>
        </div>
        <div className="chart-header-metrics">
          <div className="chart-stat">
            <span>CURRENT</span>
            <strong>
              {latestMagnitude !== null && latestMagnitude !== undefined
                ? latestMagnitude.toFixed(2)
                : "--"}{" "}
              <small>{unit}</small>
            </strong>
          </div>
          <div className="chart-stat">
            <span>AVERAGE</span>
            <strong>
              {data.length > 0 ? avgMagnitude.toFixed(2) : "--"}{" "}
              <small>{unit}</small>
            </strong>
          </div>
          <div className="chart-stat">
            <span>WINDOW</span>
            <strong>~{Math.round(data.length * 0.5)}s</strong>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {isEmpty ? (
          <div className="chart-empty-state">
            <div className="empty-indicator-ring" />
            <p>
              {isConnected
                ? "Waiting for sensor packets..."
                : status === "connecting"
                  ? "Connecting to ESP32 stream..."
                  : "Sensor is disconnected. Connect to 'SCOT-Sensor' to visualize live motion."}
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="acceleration-svg-chart"
            aria-label="Real-time acceleration magnitude line chart"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="accelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffd700" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#d4af37" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal Grid lines and Y Labels */}
            {yTicks.map((tick) => (
              <g key={tick.value} className="grid-tick">
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={padding.left + plotWidth}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={tick.y + 3}
                  textAnchor="end"
                  className="chart-axis-label"
                >
                  {tick.value}
                </text>
              </g>
            ))}

            {/* 1G Standard Gravity Reference Line (9.81 m/s^2) */}
            {gravityY !== null && (
              <g className="gravity-reference">
                <line
                  x1={padding.left}
                  y1={gravityY}
                  x2={padding.left + plotWidth}
                  y2={gravityY}
                  stroke="rgba(34, 197, 94, 0.45)"
                  strokeWidth="1.2"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left + plotWidth - 4}
                  y={gravityY - 4}
                  textAnchor="end"
                  fill="rgba(34, 197, 94, 0.8)"
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  1G (9.81 m/s²)
                </text>
              </g>
            )}

            {/* Gradient fill under the curve */}
            <path d={areaD} fill="url(#accelGrad)" />

            {/* Acceleration line */}
            <path
              d={pathD}
              fill="none"
              stroke="#ffd700"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#glow)"
            />

            {/* Data points & Interactive Hover Targets */}
            {points.map((pt, idx) => (
              <g
                key={pt.raw.timestamp + "-" + idx}
                onMouseEnter={() => setHoveredPoint(pt.raw)}
                style={{ cursor: "pointer" }}
              >
                {/* Invisible wide circle for easy hover hit-testing */}
                <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />

                {/* Point indicator for the last active point or hovered point */}
                {(idx === points.length - 1 || hoveredPoint === pt.raw) && (
                  <>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#ffd700"
                      stroke="#0a0a0c"
                      strokeWidth="2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="none"
                      stroke="rgba(255, 215, 0, 0.5)"
                      strokeWidth="1"
                    />
                  </>
                )}
              </g>
            ))}

            {/* X-axis baseline */}
            <line
              x1={padding.left}
              y1={padding.top + plotHeight}
              x2={padding.left + plotWidth}
              y2={padding.top + plotHeight}
              stroke="rgba(255, 255, 255, 0.15)"
            />

            {/* Time labels on bottom */}
            {timeLabels.map((tl, i) => (
              <text
                key={i}
                x={tl.x}
                y={padding.top + plotHeight + 18}
                textAnchor={
                  i === 0
                    ? "start"
                    : i === timeLabels.length - 1
                      ? "end"
                      : "middle"
                }
                className="chart-axis-label time-label"
              >
                {tl.text}
              </text>
            ))}

            {/* Tooltip on hover */}
            {hoveredPoint && (
              <g className="chart-tooltip">
                <rect
                  x={Math.min(
                    padding.left + plotWidth - 110,
                    Math.max(
                      padding.left + 5,
                      points.find((p) => p.raw === hoveredPoint)?.x || 0,
                    ) - 50,
                  )}
                  y={10}
                  width="100"
                  height="26"
                  rx="3"
                  fill="rgba(18, 18, 22, 0.95)"
                  stroke="rgba(212, 175, 55, 0.4)"
                />
                <text
                  x={Math.min(
                    padding.left + plotWidth - 60,
                    Math.max(
                      padding.left + 55,
                      points.find((p) => p.raw === hoveredPoint)?.x || 0,
                    ),
                  )}
                  y={26}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {hoveredPoint.magnitude.toFixed(2)} {unit} ·{" "}
                  {hoveredPoint.timeLabel}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      <div className="chart-footer">
        <div className="chart-legend">
          <span className="legend-item">
            <i className="legend-color-gold" /> Measured Acceleration Magnitude
          </span>
          <span className="legend-item">
            <i className="legend-color-green" /> Baseline Gravity Reference
            (9.81 m/s²)
          </span>
        </div>
        <div className="chart-refresh-rate">
          <span>DYNAMIC BUFFER: {data.length} POINTS</span>
        </div>
      </div>
    </div>
  )
}
