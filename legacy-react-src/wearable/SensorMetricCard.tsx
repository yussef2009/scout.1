import React from "react"

interface MetricCardProps {
  label: string
  value: number | null | undefined
  unit: string
  decimals?: number
  axis?: "X" | "Y" | "Z" | "MAG" | "AVG"
  featured?: boolean
  deltaLabel?: string
  statusColor?: "normal" | "gold" | "green" | "muted"
  subtext?: string
}

export function SensorMetricCard({
  label,
  value,
  unit,
  decimals = 2,
  axis,
  featured = false,
  deltaLabel,
  statusColor = "normal",
  subtext,
}: MetricCardProps) {
  const isAvailable =
    value !== null && value !== undefined && Number.isFinite(value)
  const formattedValue = isAvailable ? value!.toFixed(decimals) : "--"

  const colorClasses = {
    normal: "",
    gold: "text-amber-400",
    green: "safe",
    muted: "text-slate-500",
  }[statusColor]

  return (
    <article className={`wearable-metric-card ${featured ? "featured" : ""}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {axis && (
          <span className={`axis-tag axis-${axis.toLowerCase()}`}>{axis}</span>
        )}
      </div>

      <div className="metric-body">
        <strong className="metric-val">
          {formattedValue} <small className="metric-unit">{unit}</small>
        </strong>
      </div>

      <div className="metric-footer">
        {deltaLabel ? (
          <b className={`metric-delta ${colorClasses}`}>{deltaLabel}</b>
        ) : (
          <span className="metric-status-sub">
            {isAvailable ? "LIVE SIGNAL" : "UNAVAILABLE"}
          </span>
        )}
        {subtext && <small className="metric-subtext">{subtext}</small>}
      </div>
    </article>
  )
}
